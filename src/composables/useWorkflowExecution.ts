import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { workflowApi } from '@/api/workflow.api'
import type {
  NodeExecutionState,
  NodeExecutionStatus,
  ManualExecutionRequest,
  WorkflowSSEEventType
} from '@/types/workflow-execution.types'

export function useWorkflowExecution() {
  const authStore = useAuthStore()

  const isExecuting = ref(false)
  const executionId = ref<string | null>(null)
  const executionError = ref<string | null>(null)
  const nodeStates = reactive<Record<string, NodeExecutionState>>({})
  const abortController = ref<AbortController | null>(null)

  const hasActiveExecution = computed(() => isExecuting.value && executionId.value !== null)

  function resetStates() {
    for (const key of Object.keys(nodeStates)) {
      delete nodeStates[key]
    }
    executionError.value = null
  }

  function setNodeStatus(nodeId: string, status: NodeExecutionStatus, extra?: Partial<NodeExecutionState>) {
    if (!nodeStates[nodeId]) {
      nodeStates[nodeId] = { nodeId, status }
    }
    nodeStates[nodeId].status = status
    if (extra) Object.assign(nodeStates[nodeId], extra)
  }

  async function startExecution(
    request: ManualExecutionRequest,
    callbacks?: {
      onNodeStarted?: (nodeId: string) => void
      onNodeCompleted?: (nodeId: string) => void
      onNodeError?: (nodeId: string, error: string) => void
      onEdgeData?: (sourceNode: string, targetNode: string, data: Record<string, unknown>) => void
      onComplete?: (data: Record<string, unknown>) => void
      onError?: (error: string) => void
    }
  ) {
    resetStates()
    isExecuting.value = true
    executionError.value = null

    try {
      // 1. Start execution on backend
      const result = await workflowApi.startExecution(request)
      executionId.value = result.execution_id

      // 2. Connect to SSE stream
      const streamUrl = workflowApi.getExecutionStreamUrl(result.execution_id)
      const controller = new AbortController()
      abortController.value = controller

      const response = await fetch(streamUrl, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body is not readable')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEventType: string | null = null

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim()
            continue
          }

          if (line.startsWith('data: ') && currentEventType) {
            try {
              const data = JSON.parse(line.slice(6))
              handleSSEEvent(currentEventType as WorkflowSSEEventType, data, callbacks)
            } catch {
              // Skip unparseable lines
            }
            currentEventType = null
          }

          // Handle unnamed data-only events (fallback)
          if (line.startsWith('data: ') && !currentEventType) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.event) {
                handleSSEEvent(data.event as WorkflowSSEEventType, data.data || data, callbacks)
              }
            } catch {
              // Skip
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      const msg = error instanceof Error ? error.message : 'Execution failed'
      executionError.value = msg
      callbacks?.onError?.(msg)
    } finally {
      isExecuting.value = false
      abortController.value = null
    }
  }

  function handleSSEEvent(
    eventType: WorkflowSSEEventType,
    data: Record<string, unknown>,
    callbacks?: Parameters<typeof startExecution>[1]
  ) {
    switch (eventType) {
      case 'node_started': {
        const nodeId = data.node_id as string
        setNodeStatus(nodeId, 'running', { startedAt: Date.now() })
        callbacks?.onNodeStarted?.(nodeId)
        break
      }
      case 'node_completed': {
        const nodeId = data.node_id as string
        setNodeStatus(nodeId, 'completed', {
          completedAt: Date.now(),
          outputData: (data.output as Record<string, unknown>) || undefined
        })
        callbacks?.onNodeCompleted?.(nodeId)
        break
      }
      case 'node_error': {
        const nodeId = data.node_id as string
        const error = (data.error as string) || 'Unknown error'
        setNodeStatus(nodeId, 'error', { error })
        callbacks?.onNodeError?.(nodeId, error)
        break
      }
      case 'edge_data': {
        const source = data.source_node as string
        const target = data.target_node as string
        const edgePayload = (data.data as Record<string, unknown>) || {}
        // Store I/O data on source node
        if (nodeStates[source]) {
          nodeStates[source].outputData = edgePayload
        }
        // Store input data on target node
        if (!nodeStates[target]) {
          nodeStates[target] = { nodeId: target, status: 'idle' }
        }
        nodeStates[target].inputData = edgePayload
        callbacks?.onEdgeData?.(source, target, edgePayload)
        break
      }
      case 'execution_complete': {
        callbacks?.onComplete?.(data)
        break
      }
      case 'execution_error': {
        const error = (data.error as string) || 'Execution failed'
        executionError.value = error
        callbacks?.onError?.(error)
        break
      }
    }
  }

  function cancelExecution() {
    abortController.value?.abort()
    isExecuting.value = false
  }

  return {
    isExecuting,
    executionId,
    executionError,
    nodeStates,
    hasActiveExecution,
    startExecution,
    cancelExecution,
    resetStates
  }
}
