import { ref, type Ref } from 'vue'
import type { NodeInstance } from '@/types/workflow-node.types'
import type { WorkflowDefinition } from '@/types/workflow-definition.types'
import type { useWorkflowUIState } from '@/composables/useWorkflowUIState'
import type { useWorkflowDeleteDialogs } from '@/composables/useWorkflowDeleteDialogs'
import type { useWorkflowExecution } from '@/composables/useWorkflowExecution'
import type { useWorkflowExecutionLogs } from '@/composables/useWorkflowExecutionLogs'
import type { useWorkflowStore } from '@/stores/workflow.store'

interface NodeInteractionOptions {
  selectedNode: Ref<NodeInstance | null>
  currentWorkflow: Ref<WorkflowDefinition | null>
  uiState: ReturnType<typeof useWorkflowUIState>
  deleteDialogs: ReturnType<typeof useWorkflowDeleteDialogs>
  execution: ReturnType<typeof useWorkflowExecution>
  executionLogs: ReturnType<typeof useWorkflowExecutionLogs>
  workflowStore: ReturnType<typeof useWorkflowStore>
  onNodeClick: (nodeId: string) => void
  onPaneClick: () => void
  updateNode: (id: string, data: Partial<NodeInstance>) => void
  autoLayout: () => void
}

export function useWorkflowNodeInteractions(options: NodeInteractionOptions) {
  const {
    selectedNode,
    currentWorkflow,
    uiState,
    deleteDialogs,
    execution,
    executionLogs,
    workflowStore,
    onNodeClick,
    onPaneClick,
    updateNode,
    autoLayout
  } = options

  // Pinned node tracking
  const pinnedNodeIds = ref<string[]>([])

  // --- Pin helpers (safe to call without contextMenu) ---

  function togglePinNode(nodeId: string) {
    const idx = pinnedNodeIds.value.indexOf(nodeId)
    if (idx >= 0) {
      pinnedNodeIds.value.splice(idx, 1)
    } else {
      pinnedNodeIds.value.push(nodeId)
    }
  }

  function unpinNode(nodeId: string) {
    const idx = pinnedNodeIds.value.indexOf(nodeId)
    if (idx >= 0) {
      pinnedNodeIds.value.splice(idx, 1)
    }
  }

  // --- Context menu handlers ---

  function handleNodeContextMenu(payload: { event: MouseEvent; nodeId: string }) {
    onNodeClick(payload.nodeId)
    uiState.openContextMenu(payload.event, payload.nodeId)
  }

  function handleNodeDoubleClick(nodeId: string) {
    onNodeClick(nodeId)
    uiState.openNodeEditModal(nodeId)
  }

  function handleContextMenuOpen() {
    if (uiState.contextMenuNodeId.value) {
      uiState.openNodeEditModal(uiState.contextMenuNodeId.value)
    }
  }

  function handleContextMenuExecute() {
    uiState.showExecuteDialog.value = true
  }

  function handleContextMenuRename() {
    if (uiState.contextMenuNodeId.value) {
      uiState.openNodeEditModal(uiState.contextMenuNodeId.value)
    }
  }

  function handleContextMenuToggleActive() {
    if (selectedNode.value) {
      const newActiveState = !(selectedNode.value.is_active !== false)
      updateNode(selectedNode.value.id, { is_active: newActiveState })
    }
  }

  function handleContextMenuPin() {
    const nodeId = uiState.contextMenuNodeId.value
    if (!nodeId) return
    togglePinNode(nodeId)
  }

  function handleContextMenuTidyUp() {
    autoLayout()
  }

  function handleContextMenuSelectAll() {
    console.log('Select all nodes')
  }

  function handleContextMenuClearSelection() {
    onPaneClick()
  }

  function handleContextMenuDelete() {
    if (selectedNode.value) {
      deleteDialogs.confirmDeleteNode(selectedNode.value)
    }
  }

  // --- Toolbar handlers ---

  function handleToolbarExecute() {
    uiState.showExecuteDialog.value = true
  }

  function handleToolbarToggleActive() {
    if (selectedNode.value) {
      const newActiveState = !(selectedNode.value.is_active !== false)
      updateNode(selectedNode.value.id, { is_active: newActiveState })
    }
  }

  function handleToolbarDelete() {
    if (selectedNode.value) {
      deleteDialogs.confirmDeleteNode(selectedNode.value)
    }
  }

  function handleToolbarMore(event: MouseEvent) {
    if (selectedNode.value) {
      uiState.openContextMenu(event, selectedNode.value.id)
    }
  }

  function handleNodeSelected(payload: { nodeId: string; screenPosition: { x: number; y: number } }) {
    uiState.updateToolbarScreenPosition(payload.nodeId, payload.screenPosition)
  }

  function handlePaneClick() {
    uiState.clearToolbar()
    onPaneClick()
  }

  // --- Execution ---

  async function handleRealExecution(payload: { test_input: string; domain_key: string }) {
    if (!currentWorkflow.value) return

    uiState.showExecuteDialog.value = false
    executionLogs.clearLogs()
    executionLogs.expandLogs()
    executionLogs.addInfoLog('Iniciando ejecucion real del workflow...')

    const pinnedData: Record<string, Record<string, unknown>> = {}
    const nodeInstances = workflowStore.nodeInstances
    const nodeMap = new Map(nodeInstances.map(n => [n.id, n]))

    await execution.startExecution(
      {
        domain_key: payload.domain_key,
        institution_config_id: currentWorkflow.value.institution_config_id,
        test_input: payload.test_input,
        pinned_data: Object.keys(pinnedData).length > 0 ? pinnedData : undefined
      },
      {
        onNodeStarted: (nodeId) => {
          const node = nodeMap.get(nodeId)
          executionLogs.addInfoLog(
            `Nodo iniciado: ${node?.display_label || nodeId}`,
            nodeId,
            node?.display_label
          )
        },
        onNodeCompleted: (nodeId) => {
          const node = nodeMap.get(nodeId)
          executionLogs.addSuccessLog(
            `Nodo completado: ${node?.display_label || nodeId}`,
            nodeId,
            node?.display_label
          )
        },
        onNodeError: (nodeId, error) => {
          const node = nodeMap.get(nodeId)
          executionLogs.addErrorLog(
            `Error en nodo ${node?.display_label || nodeId}: ${error}`,
            nodeId,
            node?.display_label
          )
        },
        onComplete: (data) => {
          const responseText = (data.response_text as string) || ''
          const execMs = (data.execution_ms as number) || 0
          executionLogs.addSuccessLog(
            `Ejecucion completada en ${execMs}ms${responseText ? `: ${responseText.substring(0, 100)}` : ''}`
          )
        },
        onError: (error) => {
          executionLogs.addErrorLog(`Ejecucion fallida: ${error}`)
        }
      }
    )
  }

  return {
    pinnedNodeIds,
    togglePinNode,
    unpinNode,
    handleNodeContextMenu,
    handleNodeDoubleClick,
    handleContextMenuOpen,
    handleContextMenuExecute,
    handleContextMenuRename,
    handleContextMenuToggleActive,
    handleContextMenuPin,
    handleContextMenuTidyUp,
    handleContextMenuSelectAll,
    handleContextMenuClearSelection,
    handleContextMenuDelete,
    handleToolbarExecute,
    handleToolbarToggleActive,
    handleToolbarDelete,
    handleToolbarMore,
    handleNodeSelected,
    handlePaneClick,
    handleRealExecution
  }
}
