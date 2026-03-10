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
 * - useWorkflowNodeInteractions: Node context menu, toolbar, execution
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
import { useWorkflowExecution } from '@/composables/useWorkflowExecution'
import { useWorkflowNodeInteractions } from '@/composables/useWorkflowNodeInteractions'

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
import WorkflowDeleteDialogs from '@/components/workflows/editor/WorkflowDeleteDialogs.vue'
import WorkflowExecutionsTab from '@/components/workflows/editor/WorkflowExecutionsTab.vue'
import WorkflowTriggersPanel from '@/components/workflows/editor/WorkflowTriggersPanel.vue'

// n8n-style components
import WorkflowNodeContextMenu from '@/components/workflows/editor/WorkflowNodeContextMenu.vue'
import WorkflowNodeToolbar from '@/components/workflows/editor/WorkflowNodeToolbar.vue'
import WorkflowNodeEditModal from '@/components/workflows/editor/WorkflowNodeEditModal.vue'

// Dialog container
import WorkflowEditorDialogs from '@/components/workflows/editor/WorkflowEditorDialogs.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/minimap/dist/style.css'

// Core workflow editor
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
  isLoading,
  isSaving,
  isDirty,
  stats,
  selectInstitution,
  loadInstitutions,
  loadAllWorkflows,
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

// Specialized composables
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

// UI State
const uiState = useWorkflowUIState({
  selectedNode,
  selectedEdge
})

// Delete dialogs
const localSelectedWorkflowId = ref<string | null>(null)

const deleteDialogs = useWorkflowDeleteDialogs({
  deleteNode,
  deleteTransition,
  deleteWorkflow,
  onWorkflowDeleted: () => {
    localSelectedWorkflowId.value = null
  }
})

// Real execution
const execution = useWorkflowExecution()

// Execution logs
const executionLogs = useWorkflowExecutionLogs({
  startSimulation
})

// Node interactions (context menu, toolbar, execution orchestration)
const nodeInteractions = useWorkflowNodeInteractions({
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
})

// Computed
const hasWorkflow = computed(() => currentWorkflow.value !== null)
const hasNodes = computed(() => nodes.value.length > 0)

// Keyboard shortcuts
useWorkflowKeyboardShortcuts({
  selectedNode,
  selectedEdge,
  hasWorkflow,
  hasNodes,
  isDirty,
  onDeleteNode: deleteDialogs.confirmDeleteNode,
  onDeleteTransition: deleteDialogs.confirmDeleteTransition,
  onSave: saveWorkflow,
  onExecute: () => { uiState.showExecuteDialog.value = true },
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

// Workflow selection
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

async function handleBackToSelector() {
  localSelectedWorkflowId.value = null
  workflowStore.currentWorkflow = null
  await loadAllWorkflows()
}

async function openNewWorkflowDialog() {
  showWorkflowDialog.value = true
  if (institutions.value.length === 0) {
    await loadInstitutions()
  }
}

// Navigation
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

// Import/Export
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

// Workflow copy callback
async function onWorkflowCopied(result: { newWorkflowId: string }) {
  await loadAllWorkflows()
  localSelectedWorkflowId.value = result.newWorkflowId
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
        :workflows="workflows"
        v-model:selectedWorkflowId="localSelectedWorkflowId"
        :currentWorkflow="currentWorkflow"
        :stats="stats"
        :isLoading="isLoading"
        @newWorkflow="openNewWorkflowDialog"
      />
    </div>

    <!-- Main Editor Layout -->
    <template v-else>
      <!-- Top Bar -->
      <WorkflowTopBar
        :workflow="currentWorkflow"
        :institution-name="currentWorkflow?.institution_name ?? selectedInstitution?.institution_name"
        :is-dirty="isDirty"
        :is-saving="isSaving"
        :active-tab="uiState.activeTab.value"
        @update:activeTab="uiState.activeTab.value = $event"
        @save="saveWorkflow"
        @publish="publishWorkflow"
        @refresh="loadAllWorkflows"
        @settings="uiState.openNodeDefinitions"
        @duplicate="uiState.openCopyWorkflow"
        @export="exportToFile"
        @triggers="uiState.showTriggersPanel.value = true"
        @delete="() => currentWorkflow && deleteDialogs.confirmDeleteWorkflow(currentWorkflow)"
        @back="handleBackToSelector"
      />

      <!-- Main Content Area -->
      <div class="editor-main">
        <!-- Left Sidebar -->
        <WorkflowLeftSidebar
          active-item="workflows"
          @navigate="handleLeftNavigation"
        />

        <!-- Executions Tab (Phase 2) -->
        <div v-if="uiState.activeTab.value === 'executions'" class="canvas-wrapper">
          <WorkflowExecutionsTab
            :institution-config-id="currentWorkflow?.institution_config_id"
          />
        </div>

        <!-- Canvas Area (Editor tab) -->
        <div v-else class="canvas-wrapper">
          <WorkflowCanvas
            :currentWorkflow="currentWorkflow"
            :nodes="nodes"
            :edges="edges"
            :isValidConnection="isValidConnection"
            :showSimulationPanel="uiState.showSimulationPanel.value"
            :simulationState="simulationState"
            :nodeExecutionStates="execution.nodeStates"
            :pinnedNodeIds="nodeInteractions.pinnedNodeIds.value"
            v-model:simulationStepDelay="simulationStepDelay"
            :canStepForward="canStepForward"
            :canStepBackward="canStepBackward"
            @addNodeRequest="openAddNodeDialog"
            @nodeClick="onNodeClick"
            @nodeSelected="nodeInteractions.handleNodeSelected"
            @edgeClick="onEdgeClick"
            @paneClick="nodeInteractions.handlePaneClick"
            @connect="onConnect"
            @nodeDragStop="(p) => onNodeDragStop(p.id, p.position)"
            @nodeContextMenu="nodeInteractions.handleNodeContextMenu"
            @nodeDoubleClick="nodeInteractions.handleNodeDoubleClick"
            @startSimulation="startSimulation"
            @pauseSimulation="pauseSimulation"
            @resumeSimulation="resumeSimulation"
            @stopSimulation="stopSimulation"
            @simulationStepForward="simulationStepForward"
            @simulationStepBackward="simulationStepBackward"
            @openSimulationContext="uiState.openSimulationContext"
          />

          <!-- n8n-style Node Toolbar (hidden when modal is open) -->
          <WorkflowNodeToolbar
            :position="uiState.showNodeEditModal.value ? null : uiState.toolbarScreenPosition.value"
            :is-active="selectedNode?.is_active !== false"
            :node-id="selectedNode?.id ?? null"
            @execute="nodeInteractions.handleToolbarExecute"
            @toggle-active="nodeInteractions.handleToolbarToggleActive"
            @delete="nodeInteractions.handleToolbarDelete"
            @more="nodeInteractions.handleToolbarMore"
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
            :is-executing="execution.isExecuting.value || isSimulating"
            :has-nodes="hasNodes"
            @execute="uiState.showExecuteDialog.value = true"
          />

          <!-- Logs Panel -->
          <WorkflowLogsPanel
            :logs="executionLogs.logs.value"
            v-model:is-expanded="executionLogs.isLogsExpanded.value"
            :is-executing="execution.isExecuting.value || isSimulating"
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
      :executionNodeStates="execution.nodeStates"
      :pinnedNodes="nodeInteractions.pinnedNodeIds.value"
      @updateNode="updateNode"
      @deleteNode="deleteDialogs.confirmDeleteNode"
      @pinData="nodeInteractions.togglePinNode"
      @unpinData="nodeInteractions.unpinNode"
    />

    <!-- n8n-style Context Menu (right-click) -->
    <WorkflowNodeContextMenu
      v-model:visible="uiState.showContextMenu.value"
      :position="uiState.contextMenuPosition.value"
      :node-id="uiState.contextMenuNodeId.value"
      :node-name="selectedNode?.display_label || 'Nodo'"
      :is-active="selectedNode?.is_active !== false"
      @open="nodeInteractions.handleContextMenuOpen"
      @execute="nodeInteractions.handleContextMenuExecute"
      @rename="nodeInteractions.handleContextMenuRename"
      @toggle-active="nodeInteractions.handleContextMenuToggleActive"
      @pin="nodeInteractions.handleContextMenuPin"
      @copy="copy"
      @duplicate="duplicate"
      @tidy-up="nodeInteractions.handleContextMenuTidyUp"
      @select-all="nodeInteractions.handleContextMenuSelectAll"
      @clear-selection="nodeInteractions.handleContextMenuClearSelection"
      @delete="nodeInteractions.handleContextMenuDelete"
    />

    <!-- Triggers Panel (Phase 6) -->
    <WorkflowTriggersPanel
      v-if="currentWorkflow"
      :visible="uiState.showTriggersPanel.value"
      :workflow-id="currentWorkflow.id"
      @update:visible="uiState.showTriggersPanel.value = $event"
    />

    <!-- Data Dialogs (grouped) -->
    <WorkflowEditorDialogs
      :showNodePaletteDialog="uiState.showNodePaletteDialog.value"
      @update:showNodePaletteDialog="uiState.showNodePaletteDialog.value = $event"
      :nodeDefinitionsByCategory="nodeDefinitionsByCategory"
      @addNodeFromPalette="openAddNodeDialog"

      :showWorkflowDialog="showWorkflowDialog"
      @update:showWorkflowDialog="showWorkflowDialog = $event"
      :newWorkflow="newWorkflow"
      :institutions="institutions"
      :isLoadingInstitutions="isLoadingInstitutions"
      @createWorkflow="createWorkflow"
      @cancelWorkflow="() => { showWorkflowDialog = false; resetWorkflowForm() }"

      :showNodeDialog="showNodeDialog"
      @update:showNodeDialog="showNodeDialog = $event"
      :selectedDefinition="selectedDefinition"
      :newNode="newNode"
      @addNode="addNode"
      @cancelAddNode="showNodeDialog = false"

      :showSimulationContextDialog="uiState.showSimulationContextDialog.value"
      @update:showSimulationContextDialog="uiState.showSimulationContextDialog.value = $event"
      :simulationContext="simulationState.context"
      @updateSimulationContext="updateSimulationContext"

      :showNodeDefinitionsDialog="uiState.showNodeDefinitionsDialog.value"
      @update:showNodeDefinitionsDialog="uiState.showNodeDefinitionsDialog.value = $event"

      :showInstitutionInfoDialog="uiState.showInstitutionInfoDialog.value"
      @update:showInstitutionInfoDialog="uiState.showInstitutionInfoDialog.value = $event"
      :selectedInstitution="selectedInstitution"

      :showCopyWorkflowDialog="uiState.showCopyWorkflowDialog.value"
      @update:showCopyWorkflowDialog="uiState.showCopyWorkflowDialog.value = $event"
      :selectedInstitutionId="selectedInstitutionId"
      @copied="onWorkflowCopied"

      :showExecuteDialog="uiState.showExecuteDialog.value"
      @update:showExecuteDialog="uiState.showExecuteDialog.value = $event"
      :isExecuting="execution.isExecuting.value"
      :institutionConfigId="currentWorkflow?.institution_config_id"
      @execute="nodeInteractions.handleRealExecution"
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
