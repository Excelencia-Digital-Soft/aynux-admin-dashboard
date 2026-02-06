import { ref } from 'vue'
import type { NodeInstance } from '@/types/workflow.types'

/**
 * useWorkflowDeleteDialogs - Manages delete confirmation dialogs
 *
 * Single responsibility: Handle confirmation dialogs for deleting
 * nodes, transitions, and workflows.
 */
export function useWorkflowDeleteDialogs(options: {
  deleteNode: (nodeId: string) => void
  deleteTransition: (edgeId: string) => void
  deleteWorkflow: (workflowId: string) => Promise<void>
  onWorkflowDeleted?: () => void
}) {
  // Dialog visibility state
  const showDeleteNodeDialog = ref(false)
  const showDeleteTransitionDialog = ref(false)
  const showDeleteWorkflowDialog = ref(false)

  // Items pending deletion
  const nodeToDelete = ref<NodeInstance | null>(null)
  const transitionToDelete = ref<string | null>(null)
  const workflowToDelete = ref<{ id: string; name: string } | null>(null)

  // Node deletion
  function confirmDeleteNode(node: NodeInstance) {
    nodeToDelete.value = node
    showDeleteNodeDialog.value = true
  }

  function executeDeleteNode() {
    if (nodeToDelete.value) {
      options.deleteNode(nodeToDelete.value.id)
      cancelDeleteNode()
    }
  }

  function cancelDeleteNode() {
    nodeToDelete.value = null
    showDeleteNodeDialog.value = false
  }

  // Transition deletion
  function confirmDeleteTransition(edgeId: string) {
    transitionToDelete.value = edgeId
    showDeleteTransitionDialog.value = true
  }

  function executeDeleteTransition() {
    if (transitionToDelete.value) {
      options.deleteTransition(transitionToDelete.value)
      cancelDeleteTransition()
    }
  }

  function cancelDeleteTransition() {
    transitionToDelete.value = null
    showDeleteTransitionDialog.value = false
  }

  // Workflow deletion
  function confirmDeleteWorkflow(workflow: { id: string; display_name: string }) {
    workflowToDelete.value = { id: workflow.id, name: workflow.display_name }
    showDeleteWorkflowDialog.value = true
  }

  async function executeDeleteWorkflow() {
    if (workflowToDelete.value) {
      await options.deleteWorkflow(workflowToDelete.value.id)
      cancelDeleteWorkflow()
      options.onWorkflowDeleted?.()
    }
  }

  function cancelDeleteWorkflow() {
    workflowToDelete.value = null
    showDeleteWorkflowDialog.value = false
  }

  return {
    // State
    showDeleteNodeDialog,
    showDeleteTransitionDialog,
    showDeleteWorkflowDialog,
    nodeToDelete,
    transitionToDelete,
    workflowToDelete,

    // Node actions
    confirmDeleteNode,
    executeDeleteNode,
    cancelDeleteNode,

    // Transition actions
    confirmDeleteTransition,
    executeDeleteTransition,
    cancelDeleteTransition,

    // Workflow actions
    confirmDeleteWorkflow,
    executeDeleteWorkflow,
    cancelDeleteWorkflow
  }
}
