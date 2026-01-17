/**
 * Composable for Workflow simulation functionality
 *
 * Provides a visual simulation of workflow execution for testing and debugging.
 */

import { ref, computed, watch } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import type { NodeInstance, WorkflowTransition, TransitionCondition } from '@/types/workflow.types'

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'

export interface SimulationStep {
  nodeId: string
  nodeLabel: string
  timestamp: number
  transitionId?: string
  transitionLabel?: string
}

export interface SimulationContext {
  state: Record<string, unknown>
  entities: Record<string, unknown>
  intent: string | null
  userInput: string
}

export interface SimulationState {
  status: SimulationStatus
  currentNodeId: string | null
  visitedNodes: string[]
  executionPath: SimulationStep[]
  context: SimulationContext
  error: string | null
}

const DEFAULT_CONTEXT: SimulationContext = {
  state: {},
  entities: {},
  intent: null,
  userInput: ''
}

export function useWorkflowSimulation() {
  const store = useWorkflowStore()
  const { setCenter } = useVueFlow()
  const toast = useToast()

  // Simulation state
  const state = ref<SimulationState>({
    status: 'idle',
    currentNodeId: null,
    visitedNodes: [],
    executionPath: [],
    context: { ...DEFAULT_CONTEXT },
    error: null
  })

  // Speed control (ms between steps)
  const stepDelay = ref(1000)

  // Auto-advance timer
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

  // Computed
  const isSimulating = computed(() =>
    state.value.status === 'running' || state.value.status === 'paused'
  )

  const canStepForward = computed(() => {
    if (state.value.status === 'completed' || state.value.status === 'error') return false
    if (!state.value.currentNodeId) return true // Can start
    // Check if there are outgoing transitions
    const outgoing = store.transitions.filter(t => t.source_node_id === state.value.currentNodeId)
    return outgoing.length > 0
  })

  const canStepBackward = computed(() => {
    return state.value.executionPath.length > 0
  })

  const currentNode = computed((): NodeInstance | null => {
    if (!state.value.currentNodeId) return null
    return store.nodeInstances.find(n => n.id === state.value.currentNodeId) || null
  })

  /**
   * Get the entry node for the workflow
   */
  function getEntryNode(): NodeInstance | null {
    return store.nodeInstances.find(n => n.is_entry_point) || null
  }

  /**
   * Get outgoing transitions from a node
   */
  function getOutgoingTransitions(nodeId: string): WorkflowTransition[] {
    return store.transitions
      .filter(t => t.source_node_id === nodeId && t.is_active)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Evaluate a transition condition
   */
  function evaluateCondition(condition: TransitionCondition | null): boolean {
    if (!condition) return true
    if (condition.type === 'always') return true

    const context = state.value.context

    switch (condition.type) {
      case 'intent':
        return context.intent === condition.value

      case 'entity':
        if (condition.field && condition.value) {
          const entityValue = context.entities[condition.field]
          switch (condition.operator) {
            case 'eq':
              return entityValue === condition.value
            case 'ne':
              return entityValue !== condition.value
            case 'contains':
              return String(entityValue || '').includes(String(condition.value))
            default:
              return entityValue === condition.value
          }
        }
        return false

      case 'state':
        if (condition.field && condition.value) {
          const stateValue = context.state[condition.field]
          switch (condition.operator) {
            case 'eq':
              return stateValue === condition.value
            case 'ne':
              return stateValue !== condition.value
            default:
              return stateValue === condition.value
          }
        }
        return false

      case 'expression':
        // Expression evaluation would require a safe evaluator
        // For now, return true as a placeholder
        return true

      default:
        return true
    }
  }

  /**
   * Find the next transition to follow
   */
  function findNextTransition(nodeId: string): WorkflowTransition | null {
    const transitions = getOutgoingTransitions(nodeId)

    // Find first transition whose condition evaluates to true
    for (const transition of transitions) {
      if (evaluateCondition(transition.condition)) {
        return transition
      }
    }

    return null
  }

  /**
   * Focus view on a node
   */
  function focusNode(nodeId: string) {
    const vfNodes = store.nodes
    const node = vfNodes.find(n => n.id === nodeId)
    if (node) {
      setCenter(node.position.x + 90, node.position.y + 30, {
        zoom: 1,
        duration: 300
      })
    }
  }

  /**
   * Start simulation from entry point
   */
  function start() {
    const entryNode = getEntryNode()
    if (!entryNode) {
      toast.error('No hay punto de entrada definido')
      return
    }

    state.value = {
      status: 'running',
      currentNodeId: entryNode.id,
      visitedNodes: [entryNode.id],
      executionPath: [{
        nodeId: entryNode.id,
        nodeLabel: entryNode.display_label,
        timestamp: Date.now()
      }],
      context: { ...DEFAULT_CONTEXT },
      error: null
    }

    focusNode(entryNode.id)
    toast.info('Simulacion iniciada')

    // Start auto-advance
    scheduleAutoAdvance()
  }

  /**
   * Step forward to next node
   */
  function stepForward(): boolean {
    if (!canStepForward.value) return false

    // If not started, start from entry
    if (!state.value.currentNodeId) {
      start()
      return true
    }

    const transition = findNextTransition(state.value.currentNodeId)

    if (!transition) {
      // Dead end - simulation complete
      state.value.status = 'completed'
      toast.success('Simulacion completada - punto muerto alcanzado')
      clearAutoAdvance()
      return false
    }

    // Move to next node
    const nextNodeId = transition.target_node_id
    const nextNode = store.nodeInstances.find(n => n.id === nextNodeId)

    if (!nextNode) {
      state.value.status = 'error'
      state.value.error = 'Nodo destino no encontrado'
      clearAutoAdvance()
      return false
    }

    // Check for infinite loop
    if (state.value.visitedNodes.filter(id => id === nextNodeId).length > 10) {
      state.value.status = 'error'
      state.value.error = 'Posible bucle infinito detectado'
      toast.error('Bucle infinito detectado')
      clearAutoAdvance()
      return false
    }

    // Update state
    state.value.currentNodeId = nextNodeId
    state.value.visitedNodes.push(nextNodeId)
    state.value.executionPath.push({
      nodeId: nextNodeId,
      nodeLabel: nextNode.display_label,
      timestamp: Date.now(),
      transitionId: transition.id,
      transitionLabel: transition.label || undefined
    })

    focusNode(nextNodeId)

    return true
  }

  /**
   * Step backward to previous node
   */
  function stepBackward(): boolean {
    if (!canStepBackward.value) return false

    // Remove last step
    state.value.executionPath.pop()
    state.value.visitedNodes.pop()

    // Get previous node
    const lastStep = state.value.executionPath[state.value.executionPath.length - 1]
    state.value.currentNodeId = lastStep?.nodeId || null

    if (state.value.currentNodeId) {
      focusNode(state.value.currentNodeId)
      state.value.status = 'paused'
    } else {
      state.value.status = 'idle'
    }

    return true
  }

  /**
   * Pause simulation
   */
  function pause() {
    if (state.value.status === 'running') {
      state.value.status = 'paused'
      clearAutoAdvance()
    }
  }

  /**
   * Resume simulation
   */
  function resume() {
    if (state.value.status === 'paused') {
      state.value.status = 'running'
      scheduleAutoAdvance()
    }
  }

  /**
   * Stop and reset simulation
   */
  function stop() {
    clearAutoAdvance()
    state.value = {
      status: 'idle',
      currentNodeId: null,
      visitedNodes: [],
      executionPath: [],
      context: { ...DEFAULT_CONTEXT },
      error: null
    }
  }

  /**
   * Update simulation context
   */
  function updateContext(updates: Partial<SimulationContext>) {
    state.value.context = {
      ...state.value.context,
      ...updates
    }
  }

  /**
   * Schedule auto-advance
   */
  function scheduleAutoAdvance() {
    if (state.value.status !== 'running') return

    clearAutoAdvance()

    autoAdvanceTimer = setTimeout(() => {
      if (state.value.status === 'running') {
        const advanced = stepForward()
        if (advanced) {
          scheduleAutoAdvance()
        }
      }
    }, stepDelay.value)
  }

  /**
   * Clear auto-advance timer
   */
  function clearAutoAdvance() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
  }

  // Cleanup on workflow change
  watch(() => store.currentWorkflow?.id, () => {
    stop()
  })

  return {
    // State
    state,
    stepDelay,

    // Computed
    isSimulating,
    canStepForward,
    canStepBackward,
    currentNode,

    // Actions
    start,
    stepForward,
    stepBackward,
    pause,
    resume,
    stop,
    updateContext
  }
}

export default useWorkflowSimulation
