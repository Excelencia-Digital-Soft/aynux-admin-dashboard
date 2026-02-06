import { ref, watch, type Ref } from 'vue'
import type { NodeInstance, WorkflowEdge } from '@/types/workflow.types'

/**
 * useWorkflowUIState - Manages UI panels and dialogs visibility
 *
 * Single responsibility: Centralize UI state management for
 * workflow editor panels, drawers, dialogs, context menu, and toolbar.
 */
export function useWorkflowUIState(options?: {
  selectedNode?: Ref<NodeInstance | null>
  selectedEdge?: Ref<WorkflowEdge | null>
}) {
  // Tab navigation
  const activeTab = ref<'editor' | 'executions' | 'evaluations'>('editor')

  // Panels
  const showSimulationPanel = ref(false)
  const showPropertiesDrawer = ref(false)

  // Dialogs
  const showWorkflowDialog = ref(false)
  const showNodeDialog = ref(false)
  const showNodePaletteDialog = ref(false)
  const showSimulationContextDialog = ref(false)
  const showNodeDefinitionsDialog = ref(false)
  const showInstitutionInfoDialog = ref(false)
  const showCopyWorkflowDialog = ref(false)

  // Node Edit Modal (fullscreen, opens on double-click)
  const showNodeEditModal = ref(false)
  const editingNodeId = ref<string | null>(null)

  // Context Menu
  const showContextMenu = ref(false)
  const contextMenuPosition = ref<{ x: number; y: number } | null>(null)
  const contextMenuNodeId = ref<string | null>(null)

  // Node Toolbar (uses screen coordinates for proper positioning)
  const showNodeToolbar = ref(true) // Always show when node is selected
  const toolbarNodeId = ref<string | null>(null)
  const toolbarPosition = ref<{ x: number; y: number } | null>(null)
  const toolbarScreenPosition = ref<{ x: number; y: number } | null>(null)

  // Zoom
  const zoomLevel = ref(0.8)

  // Auto-open properties drawer when selecting node/edge (legacy behavior)
  // Now we prefer double-click to open the modal instead
  if (options?.selectedNode && options?.selectedEdge) {
    watch([options.selectedNode, options.selectedEdge], ([node, edge]) => {
      // Update toolbar position when node is selected
      if (node) {
        toolbarNodeId.value = node.id
        toolbarPosition.value = {
          x: node.position_x,
          y: node.position_y
        }
      } else {
        toolbarNodeId.value = null
        toolbarPosition.value = null
      }

      // Only auto-open drawer for edges (not nodes - nodes use double-click modal)
      if (edge && !node) {
        showPropertiesDrawer.value = true
      }
    })
  }

  // Dialog openers
  function openWorkflowDialog() {
    showWorkflowDialog.value = true
  }

  function openNodeDialog() {
    showNodeDialog.value = true
  }

  function openNodePalette() {
    showNodePaletteDialog.value = true
  }

  function openSimulationContext() {
    showSimulationContextDialog.value = true
  }

  function openNodeDefinitions() {
    showNodeDefinitionsDialog.value = true
  }

  function openInstitutionInfo() {
    showInstitutionInfoDialog.value = true
  }

  function openCopyWorkflow() {
    showCopyWorkflowDialog.value = true
  }

  // Node Edit Modal (fullscreen, opens on double-click)
  function openNodeEditModal(nodeId: string) {
    editingNodeId.value = nodeId
    showNodeEditModal.value = true
    // Close context menu and drawer when opening modal
    // Note: toolbar is hidden via template condition, not by clearing position
    showContextMenu.value = false
    showPropertiesDrawer.value = false
  }

  function closeNodeEditModal() {
    showNodeEditModal.value = false
    editingNodeId.value = null
  }

  // Context Menu
  function openContextMenu(event: MouseEvent, nodeId: string) {
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    contextMenuNodeId.value = nodeId
    showContextMenu.value = true
  }

  function closeContextMenu() {
    showContextMenu.value = false
    contextMenuNodeId.value = null
    contextMenuPosition.value = null
  }

  // Update toolbar position (called when node position changes)
  function updateToolbarPosition(nodeId: string, position: { x: number; y: number }) {
    if (toolbarNodeId.value === nodeId) {
      toolbarPosition.value = position
    }
  }

  // Update toolbar screen position (called when node is selected with screen coords)
  function updateToolbarScreenPosition(nodeId: string, screenPosition: { x: number; y: number }) {
    toolbarNodeId.value = nodeId
    toolbarScreenPosition.value = screenPosition
  }

  // Clear toolbar when pane is clicked
  function clearToolbar() {
    toolbarNodeId.value = null
    toolbarScreenPosition.value = null
  }

  // Dialog closers
  function closeAllDialogs() {
    showNodePaletteDialog.value = false
    showContextMenu.value = false
    showNodeEditModal.value = false
  }

  // Zoom controls
  function zoomIn() {
    zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2)
  }

  function zoomOut() {
    zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.2)
  }

  function resetZoom() {
    zoomLevel.value = 1
  }

  function setZoom(level: number) {
    zoomLevel.value = Math.max(0.2, Math.min(2, level))
  }

  // Properties drawer
  function openPropertiesDrawer() {
    showPropertiesDrawer.value = true
  }

  function closePropertiesDrawer() {
    showPropertiesDrawer.value = false
  }

  function togglePropertiesDrawer() {
    showPropertiesDrawer.value = !showPropertiesDrawer.value
  }

  return {
    // Tab
    activeTab,

    // Panels
    showSimulationPanel,
    showPropertiesDrawer,

    // Dialogs
    showWorkflowDialog,
    showNodeDialog,
    showNodePaletteDialog,
    showSimulationContextDialog,
    showNodeDefinitionsDialog,
    showInstitutionInfoDialog,
    showCopyWorkflowDialog,

    // Node Edit Modal
    showNodeEditModal,
    editingNodeId,
    openNodeEditModal,
    closeNodeEditModal,

    // Context Menu
    showContextMenu,
    contextMenuPosition,
    contextMenuNodeId,
    openContextMenu,
    closeContextMenu,

    // Node Toolbar
    showNodeToolbar,
    toolbarNodeId,
    toolbarPosition,
    toolbarScreenPosition,
    updateToolbarPosition,
    updateToolbarScreenPosition,
    clearToolbar,

    // Zoom
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,

    // Dialog openers
    openWorkflowDialog,
    openNodeDialog,
    openNodePalette,
    openSimulationContext,
    openNodeDefinitions,
    openInstitutionInfo,
    openCopyWorkflow,
    closeAllDialogs,

    // Properties drawer
    openPropertiesDrawer,
    closePropertiesDrawer,
    togglePropertiesDrawer
  }
}
