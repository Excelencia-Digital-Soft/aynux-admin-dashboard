<script setup lang="ts">
// @ts-nocheck - Pre-existing type issues with WorkflowEdge/WorkflowTransition prop types
/**
 * WorkflowEditorPage - n8n-style visual workflow builder
 *
 * This page orchestrates the workflow editor components.
 * Business logic is delegated to specialized composables:
 * - useWorkflowEditor: Core workflow CRUD operations
 * - useWorkflowUIState: UI panels and dialogs state
 * - useWorkflowDeleteDialogs: Delete confirmation flows
 * - useWorkflowKeyboardShortcuts: Keyboard shortcuts
 * - useWorkflowExecutionLogs: Execution and logging
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

// Core composables
import { useWorkflowEditor } from '@/composables/useWorkflowEditor'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useWorkflowClipboard } from '@/composables/useWorkflowClipboard'
import { useWorkflowExportImport } from '@/composables/useWorkflowExportImport'
import { useWorkflowNodeSearch } from '@/composables/useWorkflowNodeSearch'
import { useWorkflowHistory } from '@/composables/useWorkflowHistory'
import { useWorkflowLayout } from '@/composables/useWorkflowLayout'
import { useConnectionValidation } from '@/composables/useConnectionValidation'
import { useWorkflowSimulation } from '@/composables/useWorkflowSimulation'

// Refactored composables (SRP)
import { useWorkflowUIState } from '@/composables/useWorkflowUIState'
import { useWorkflowDeleteDialogs } from '@/composables/useWorkflowDeleteDialogs'
import { useWorkflowKeyboardShortcuts } from '@/composables/useWorkflowKeyboardShortcuts'
import { useWorkflowExecutionLogs } from '@/composables/useWorkflowExecutionLogs'

// Layout components
import WorkflowTopBar from '@/components/workflows/editor/WorkflowTopBar.vue'
import WorkflowLeftSidebar from '@/components/workflows/editor/WorkflowLeftSidebar.vue'
import WorkflowRightSidebar from '@/components/workflows/editor/WorkflowRightSidebar.vue'
import WorkflowCanvas from '@/components/workflows/editor/WorkflowCanvas.vue'
import WorkflowBottomControls from '@/components/workflows/editor/WorkflowBottomControls.vue'
import WorkflowExecuteButton from '@/components/workflows/editor/WorkflowExecuteButton.vue'
import WorkflowLogsPanel from '@/components/workflows/editor/WorkflowLogsPanel.vue'
import WorkflowPropertiesPanel from '@/components/workflows/editor/WorkflowPropertiesPanel.vue'
import WorkflowSelector from '@/components/workflows/editor/WorkflowSelector.vue'

// Dialogs
import WorkflowDeleteDialogs from '@/components/workflows/editor/WorkflowDeleteDialogs.vue'
import WorkflowNodePaletteDialog from '@/components/workflows/editor/WorkflowNodePaletteDialog.vue'
import NewWorkflowDialog from '@/components/workflows/editor/NewWorkflowDialog.vue'
import AddNodeDialog from '@/components/workflows/editor/AddNodeDialog.vue'
import WorkflowSimulationContext from '@/components/workflows/WorkflowSimulationContext.vue'
import NodeDefinitionsDialog from '@/components/workflows/editor/NodeDefinitionsDialog.vue'
import InstitutionInfoDialog from '@/components/workflows/editor/InstitutionInfoDialog.vue'
import CopyWorkflowDialog from '@/components/workflows/editor/CopyWorkflowDialog.vue'

// n8n-style components
import WorkflowNodeContextMenu from '@/components/workflows/editor/WorkflowNodeContextMenu.vue'
import WorkflowNodeToolbar from '@/components/workflows/editor/WorkflowNodeToolbar.vue'
import WorkflowNodeEditModal from '@/components/workflows/editor/WorkflowNodeEditModal.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/minimap/dist/style.css'

// ============================================================================
// Core workflow editor
// ============================================================================
const {
  institutions,
  selectedInstitutionId,
  selectedInstitution,
  isLoadingInstitutions,
  showWorkflowDialog,
  showNodeDialog,
  newWorkflow,
  newNode,
  selectedDefinition,
  workflows,
  currentWorkflow,
  nodeDefinitionsByCategory,
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  isSaving,
  isDirty,
  stats,
  selectInstitution,
  loadWorkflow,
  createWorkflow,
  saveWorkflow,
  publishWorkflow,
  deleteWorkflow,
  openAddNodeDialog,
  addNode,
  updateNode,
  deleteNode,
  updateTransition,
  deleteTransition,
  onConnect,
  onNodeDragStop,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  resetWorkflowForm
} = useWorkflowEditor()

const workflowStore = useWorkflowStore()
const router = useRouter()

// ============================================================================
// Specialized composables
// ============================================================================
const { copy, paste, cut, duplicate } = useWorkflowClipboard()
const { exportToFile, importFromFile } = useWorkflowExportImport()
const { openSearch: openNodeSearch } = useWorkflowNodeSearch()
const { undo, redo, canUndo, canRedo } = useWorkflowHistory()
const { autoLayout } = useWorkflowLayout()
const { isValidConnection } = useConnectionValidation()

const {
  state: simulationState,
  stepDelay: simulationStepDelay,
  isSimulating,
  canStepForward,
  canStepBackward,
  start: startSimulation,
  stepForward: simulationStepForward,
  stepBackward: simulationStepBackward,
  pause: pauseSimulation,
  resume: resumeSimulation,
  stop: stopSimulation,
  updateContext: updateSimulationContext
} = useWorkflowSimulation()

// ============================================================================
// UI State (SRP)
// ============================================================================
const uiState = useWorkflowUIState({
  selectedNode,
  selectedEdge
})

// ============================================================================
// Delete dialogs (SRP)
// ============================================================================
const localSelectedWorkflowId = ref<string | null>(null)

const deleteDialogs = useWorkflowDeleteDialogs({
  deleteNode,
  deleteTransition,
  deleteWorkflow,
  onWorkflowDeleted: () => {
    localSelectedWorkflowId.value = null
  }
})

// ============================================================================
// Execution and logs (SRP)
// ============================================================================
const executionLogs = useWorkflowExecutionLogs({
  startSimulation
})

// ============================================================================
// Computed
// ============================================================================
const hasWorkflow = computed(() => currentWorkflow.value !== null)
const hasNodes = computed(() => nodes.value.length > 0)

// ============================================================================
// Keyboard shortcuts (SRP)
// ============================================================================
useWorkflowKeyboardShortcuts({
  selectedNode,
  selectedEdge,
  hasWorkflow,
  hasNodes,
  isDirty,
  onDeleteNode: deleteDialogs.confirmDeleteNode,
  onDeleteTransition: deleteDialogs.confirmDeleteTransition,
  onSave: saveWorkflow,
  onExecute: executionLogs.executeWorkflow,
  onCopy: copy,
  onPaste: paste,
  onCut: cut,
  onDuplicate: duplicate,
  onSearch: openNodeSearch,
  onUndo: undo,
  onRedo: redo,
  onEscape: onPaneClick,
  onCloseDialogs: uiState.closeAllDialogs
})

// ============================================================================
// Workflow selection
// ============================================================================
watch(localSelectedWorkflowId, async (newId) => {
  if (newId) {
    await loadWorkflow(newId)
  }
})

async function onInstitutionSelect() {
  if (selectedInstitutionId.value) {
    await selectInstitution(selectedInstitutionId.value)
  }
}

// ============================================================================
// Navigation
// ============================================================================
function handleLeftNavigation(item: string) {
  const routes: Record<string, string> = {
    home: '/admin',
    agents: '/admin/agents'
  }

  if (routes[item]) {
    router.push(routes[item])
  } else if (item === 'search') {
    openNodeSearch()
  }
}

// ============================================================================
// Import/Export
// ============================================================================
const importFileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  importFileInput.value?.click()
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await importFromFile(file)
    input.value = ''
  }
}

// ============================================================================
// Workflow copy
// ============================================================================
async function onWorkflowCopied(result: { newWorkflowId: string }) {
  await workflowStore.loadWorkflows()
  localSelectedWorkflowId.value = result.newWorkflowId
}

// ============================================================================
// Node definitions
// ============================================================================
async function onDefinitionsUpdated() {
  await workflowStore.loadNodeDefinitions()
}

// ============================================================================
// Context Menu and Toolbar handlers (n8n-style)
// ============================================================================
function handleNodeContextMenu(payload: { event: MouseEvent; nodeId: string }) {
  // Select the node first
  onNodeClick(payload.nodeId)
  // Open context menu at cursor position
  uiState.openContextMenu(payload.event, payload.nodeId)
}

function handleNodeDoubleClick(nodeId: string) {
  // First select the node so the modal has data
  onNodeClick(nodeId)
  // Open fullscreen edit modal
  uiState.openNodeEditModal(nodeId)
}

// Context menu action handlers
function handleContextMenuOpen() {
  if (uiState.contextMenuNodeId.value) {
    uiState.openNodeEditModal(uiState.contextMenuNodeId.value)
  }
}

function handleContextMenuExecute() {
  // Execute only this node (start simulation from this node)
  executionLogs.executeWorkflow()
}

function handleContextMenuRename() {
  // Open edit modal focused on name field
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
  // Pin data functionality (placeholder for future implementation)
  console.log('Pin data for node:', uiState.contextMenuNodeId.value)
}

function handleContextMenuTidyUp() {
  autoLayout()
}

function handleContextMenuSelectAll() {
  // Select all nodes (placeholder)
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

// Toolbar action handlers
function handleToolbarExecute() {
  executionLogs.executeWorkflow()
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

// Handle node selection with screen coordinates for toolbar
function handleNodeSelected(payload: { nodeId: string; screenPosition: { x: number; y: number } }) {
  uiState.updateToolbarScreenPosition(payload.nodeId, payload.screenPosition)
}

// Clear toolbar when pane is clicked
function handlePaneClick() {
  uiState.clearToolbar()
  onPaneClick()
}
</script>

<template>
  <div class="n8n-editor-page">
    <!-- Delete Confirmation Dialogs -->
    <WorkflowDeleteDialogs
      :show-delete-node-dialog="deleteDialogs.showDeleteNodeDialog.value"
      :node-to-delete-label="deleteDialogs.nodeToDelete.value?.display_label"
      :show-delete-transition-dialog="deleteDialogs.showDeleteTransitionDialog.value"
      :show-delete-workflow-dialog="deleteDialogs.showDeleteWorkflowDialog.value"
      :workflow-to-delete-name="deleteDialogs.workflowToDelete.value?.name"
      @confirm-delete-node="deleteDialogs.executeDeleteNode"
      @cancel-delete-node="deleteDialogs.cancelDeleteNode"
      @confirm-delete-transition="deleteDialogs.executeDeleteTransition"
      @cancel-delete-transition="deleteDialogs.cancelDeleteTransition"
      @confirm-delete-workflow="deleteDialogs.executeDeleteWorkflow"
      @cancel-delete-workflow="deleteDialogs.cancelDeleteWorkflow"
    />

    <!-- Hidden file input for import -->
    <input
      ref="importFileInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleImportFile"
    />

    <!-- Workflow Selector (shown when no workflow is loaded) -->
    <div v-if="!currentWorkflow" class="workflow-selector-overlay">
      <button class="overlay-back-button" @click="router.push('/admin')">
        <i class="pi pi-arrow-left" />
        <span>Volver al menú</span>
      </button>
      <WorkflowSelector
        :institutions="institutions"
        :workflows="workflows"
        v-model:selectedInstitutionId="selectedInstitutionId"
        v-model:selectedWorkflowId="localSelectedWorkflowId"
        :selectedInstitution="selectedInstitution"
        :currentWorkflow="currentWorkflow"
        :stats="stats"
        :isLoadingInstitutions="isLoadingInstitutions"
        @selectInstitution="onInstitutionSelect"
        @showInstitutionInfo="uiState.openInstitutionInfo"
        @newWorkflow="showWorkflowDialog = true"
      />
    </div>

    <!-- Main Editor Layout -->
    <template v-else>
      <!-- Top Bar -->
      <WorkflowTopBar
        :workflow="currentWorkflow"
        :institution-name="selectedInstitution?.institution_name"
        :is-dirty="isDirty"
        :is-saving="isSaving"
        :active-tab="uiState.activeTab.value"
        @update:activeTab="uiState.activeTab.value = $event"
        @save="saveWorkflow"
        @publish="publishWorkflow"
        @refresh="workflowStore.loadWorkflows"
        @settings="uiState.openNodeDefinitions"
        @duplicate="uiState.openCopyWorkflow"
        @export="exportToFile"
        @delete="() => currentWorkflow && deleteDialogs.confirmDeleteWorkflow(currentWorkflow)"
        @back="localSelectedWorkflowId = null"
      />

      <!-- Main Content Area -->
      <div class="editor-main">
        <!-- Left Sidebar -->
        <WorkflowLeftSidebar
          active-item="workflows"
          @navigate="handleLeftNavigation"
        />

        <!-- Canvas Area -->
        <div class="canvas-wrapper">
          <WorkflowCanvas
            :currentWorkflow="currentWorkflow"
            :nodes="nodes"
            :edges="edges"
            :isValidConnection="isValidConnection"
            :showSimulationPanel="uiState.showSimulationPanel.value"
            :simulationState="simulationState"
            v-model:simulationStepDelay="simulationStepDelay"
            :canStepForward="canStepForward"
            :canStepBackward="canStepBackward"
            @addNodeRequest="openAddNodeDialog"
            @nodeClick="onNodeClick"
            @nodeSelected="handleNodeSelected"
            @edgeClick="onEdgeClick"
            @paneClick="handlePaneClick"
            @connect="onConnect"
            @nodeDragStop="(p) => onNodeDragStop(p.id, p.position)"
            @nodeContextMenu="handleNodeContextMenu"
            @nodeDoubleClick="handleNodeDoubleClick"
            @startSimulation="startSimulation"
            @pauseSimulation="pauseSimulation"
            @resumeSimulation="resumeSimulation"
            @stopSimulation="stopSimulation"
            @simulationStepForward="simulationStepForward"
            @simulationStepBackward="simulationStepBackward"
            @openSimulationContext="uiState.openSimulationContext"
          />

          <!-- n8n-style Node Toolbar (uses screen coordinates, hidden when modal is open) -->
          <WorkflowNodeToolbar
            :position="uiState.showNodeEditModal.value ? null : uiState.toolbarScreenPosition.value"
            :is-active="selectedNode?.is_active !== false"
            :node-id="selectedNode?.id ?? null"
            @execute="handleToolbarExecute"
            @toggle-active="handleToolbarToggleActive"
            @delete="handleToolbarDelete"
            @more="handleToolbarMore"
          />

          <!-- Bottom Controls -->
          <WorkflowBottomControls
            :can-undo="canUndo"
            :can-redo="canRedo"
            :zoom-level="uiState.zoomLevel.value"
            @zoom-in="uiState.zoomIn"
            @zoom-out="uiState.zoomOut"
            @undo="undo"
            @redo="redo"
          />

          <!-- Execute Button -->
          <WorkflowExecuteButton
            :is-executing="isSimulating"
            :has-nodes="hasNodes"
            @execute="executionLogs.executeWorkflow"
          />

          <!-- Logs Panel -->
          <WorkflowLogsPanel
            :logs="executionLogs.logs.value"
            v-model:is-expanded="executionLogs.isLogsExpanded.value"
            :is-executing="isSimulating"
            @clear="executionLogs.clearLogs"
          />
        </div>

        <!-- Right Sidebar -->
        <WorkflowRightSidebar
          @add-node="uiState.openNodePalette"
          @search="openNodeSearch"
          @duplicate="duplicate"
          @auto-layout="autoLayout"
          @ai-assist="() => {}"
          @toggle-minimap="() => {}"
        />
      </div>
    </template>

    <!-- Properties Drawer (for edges, legacy fallback) -->
    <WorkflowPropertiesPanel
      v-model:visible="uiState.showPropertiesDrawer.value"
      :selectedNode="null"
      :selectedEdge="selectedEdge"
      :getNodeDefinition="workflowStore.getNodeDefinitionById"
      :nodeInstances="workflowStore.nodeInstances"
      @updateNode="updateNode"
      @deleteNode="deleteDialogs.confirmDeleteNode"
      @updateTransition="updateTransition"
      @deleteTransition="deleteDialogs.confirmDeleteTransition"
    />

    <!-- n8n-style Node Edit Modal (fullscreen, opens on double-click) -->
    <WorkflowNodeEditModal
      v-model:visible="uiState.showNodeEditModal.value"
      :node="selectedNode"
      :getNodeDefinition="workflowStore.getNodeDefinitionById"
      :nodeInstances="workflowStore.nodeInstances"
      @updateNode="updateNode"
      @deleteNode="deleteDialogs.confirmDeleteNode"
    />

    <!-- n8n-style Context Menu (right-click) -->
    <WorkflowNodeContextMenu
      v-model:visible="uiState.showContextMenu.value"
      :position="uiState.contextMenuPosition.value"
      :node-id="uiState.contextMenuNodeId.value"
      :node-name="selectedNode?.display_label || 'Nodo'"
      :is-active="selectedNode?.is_active !== false"
      @open="handleContextMenuOpen"
      @execute="handleContextMenuExecute"
      @rename="handleContextMenuRename"
      @toggle-active="handleContextMenuToggleActive"
      @pin="handleContextMenuPin"
      @copy="copy"
      @duplicate="duplicate"
      @tidy-up="handleContextMenuTidyUp"
      @select-all="handleContextMenuSelectAll"
      @clear-selection="handleContextMenuClearSelection"
      @delete="handleContextMenuDelete"
    />

    <!-- Node Palette Dialog -->
    <WorkflowNodePaletteDialog
      v-model:visible="uiState.showNodePaletteDialog.value"
      :nodeDefinitionsByCategory="nodeDefinitionsByCategory"
      @addNode="openAddNodeDialog"
    />

    <!-- Other Dialogs -->
    <NewWorkflowDialog
      v-model:visible="showWorkflowDialog"
      :loading="false"
      :workflow="newWorkflow"
      @save="createWorkflow"
      @cancel="showWorkflowDialog = false; resetWorkflowForm()"
    />

    <AddNodeDialog
      v-model:visible="showNodeDialog"
      :definition="selectedDefinition"
      :newNode="newNode"
      @add="addNode"
      @cancel="showNodeDialog = false"
    />

    <WorkflowSimulationContext
      :visible="uiState.showSimulationContextDialog.value"
      :context="simulationState.context"
      @update:visible="uiState.showSimulationContextDialog.value = $event"
      @update:context="updateSimulationContext"
    />

    <NodeDefinitionsDialog
      v-model:visible="uiState.showNodeDefinitionsDialog.value"
      @definitionsUpdated="onDefinitionsUpdated"
    />

    <InstitutionInfoDialog
      v-model:visible="uiState.showInstitutionInfoDialog.value"
      :institution="selectedInstitution"
    />

    <CopyWorkflowDialog
      v-model:visible="uiState.showCopyWorkflowDialog.value"
      :currentInstitutionId="selectedInstitutionId"
      @copied="onWorkflowCopied"
    />
  </div>
</template>

<style scoped>
.n8n-editor-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #0c1d3d;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

.workflow-selector-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #0c1d3d 0%, #1e3a5f 50%, #0c1d3d 100%);
  position: relative;
}

.overlay-back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.overlay-back-button:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper :deep(.n8n-canvas-container) {
  position: absolute;
  inset: 0;
  border-radius: 0;
}
</style>

<style>
body:has(.n8n-editor-page) {
  overflow: hidden;
}

body:has(.n8n-editor-page) .default-layout-sidebar,
body:has(.n8n-editor-page) .default-layout-header {
  display: none !important;
}

body:has(.n8n-editor-page) .default-layout-main {
  padding: 0 !important;
  margin: 0 !important;
}
</style>
