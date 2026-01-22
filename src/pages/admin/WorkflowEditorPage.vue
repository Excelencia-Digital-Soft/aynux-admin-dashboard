<script setup lang="ts">
/**
 * WorkflowEditorPage - Visual workflow builder with Vue Flow
 *
 * Refactored to use sub-components for better maintainability.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { useConfirm } from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'

// Composables
import { useWorkflowEditor } from '@/composables/useWorkflowEditor'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useWorkflowClipboard } from '@/composables/useWorkflowClipboard'
import { useWorkflowExportImport } from '@/composables/useWorkflowExportImport'
import { useWorkflowNodeSearch } from '@/composables/useWorkflowNodeSearch'
import { useWorkflowHistory } from '@/composables/useWorkflowHistory'
import { useWorkflowLayout } from '@/composables/useWorkflowLayout' // Only needed if we use it here, but logic moved to header
import { useConnectionValidation } from '@/composables/useConnectionValidation'
import { useWorkflowSimulation } from '@/composables/useWorkflowSimulation'

// Components
import WorkflowHeader from '@/components/workflows/editor/WorkflowHeader.vue'
import WorkflowToolbar from '@/components/workflows/editor/WorkflowToolbar.vue'
import WorkflowSelector from '@/components/workflows/editor/WorkflowSelector.vue'
import WorkflowPalette from '@/components/workflows/editor/WorkflowPalette.vue'
import WorkflowCanvas from '@/components/workflows/editor/WorkflowCanvas.vue'
import WorkflowPropertiesPanel from '@/components/workflows/editor/WorkflowPropertiesPanel.vue'
import WorkflowValidationBanner from '@/components/workflows/editor/WorkflowValidationBanner.vue'
import NewWorkflowDialog from '@/components/workflows/editor/NewWorkflowDialog.vue'
import AddNodeDialog from '@/components/workflows/editor/AddNodeDialog.vue'
import WorkflowSimulationContext from '@/components/workflows/WorkflowSimulationContext.vue'
import NodeDefinitionsDialog from '@/components/workflows/editor/NodeDefinitionsDialog.vue'

// Types
import type { NodeDefinition, NodeInstance } from '@/types/workflow.types'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// Composables
const {
  // Institution state
  institutions,
  selectedInstitutionId,
  isLoadingInstitutions,

  // State
  showWorkflowDialog,
  showNodeDialog,
  newWorkflow,
  newNode,
  selectedDefinition,

  // Computed
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
  validationErrors,

  // Actions
  selectInstitution,
  loadWorkflow,
  createWorkflow,
  saveWorkflow,
  publishWorkflow,
  openAddNodeDialog,
  addNode,
  updateNode,
  deleteNode,
  updateTransition,
  deleteTransition,

  // Vue Flow handlers
  onConnect,
  onNodeDragStop,
  onNodeClick,
  onEdgeClick,
  onPaneClick,

  // Utilities
  resetWorkflowForm
} = useWorkflowEditor()

// Access store directly for specific needs
const workflowStore = useWorkflowStore()

// Clipboard composable
const { copy, paste, cut, duplicate, hasClipboard } = useWorkflowClipboard()

// Export/Import composable
const { exportToFile, importFromFile, isExporting, isImporting } = useWorkflowExportImport()
const importFileInput = ref<HTMLInputElement | null>(null)

// Node search composable
const { openSearch: openNodeSearch } = useWorkflowNodeSearch()

// History composable
const { undo, redo, canUndo, canRedo } = useWorkflowHistory()

// Connection validation
const { isValidConnection } = useConnectionValidation()

// Simulation composable
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

const showSimulationPanel = ref(false)
const showSimulationContextDialog = ref(false)
const showNodeDefinitionsDialog = ref(false)
const showPropertiesDrawer = ref(false)
const confirm = useConfirm()

// Computed for toolbar selection state
const hasSelection = computed(() => selectedNode.value !== null || selectedEdge.value !== null)

// Auto-open properties drawer when selecting a node or edge
watch([selectedNode, selectedEdge], ([node, edge]) => {
  if (node || edge) {
    showPropertiesDrawer.value = true
  }
})

// Toggle properties drawer
function togglePropertiesDrawer() {
  showPropertiesDrawer.value = !showPropertiesDrawer.value
}

// Handle delete from toolbar (decides between node or edge deletion)
function handleDelete() {
  if (selectedNode.value) {
    confirmDeleteNode(selectedNode.value)
  } else if (selectedEdge.value) {
    confirmDeleteTransition(selectedEdge.value.id)
  }
}
// Note: useVueFlow must be used inside VueFlowProvider. 
// Since we wrap the template in VueFlowProvider, we can't use it in setup() directly for the whole page unless we are a child.
// However, we can use a separate component or just rely on the store/events.
// For zooming/fitting, we might need access to the instance. 
// Ideally, the actions that require flow instance should be triggered from components inside the provider.
// But keyboard shortcuts are global.
// We'll try to use `useVueFlow()` but it might return undefined if called outside provider context.
// Actually, `useVueFlow` works if `VueFlowProvider` is up in the tree. Since we are adding it in template, we can't use it here comfortably for initialization.
// BUT, we can use `useVueFlow` inside the `handleKeyDown` because it will be called after mount/render? No, the provider needs to be mounted.
// We will use a ref for viewport readiness.

const viewportReady = ref(false)

// Handle institution selection
async function onInstitutionSelect() {
  if (selectedInstitutionId.value) {
    await selectInstitution(selectedInstitutionId.value)
  }
}

// Handle workflow selection
async function onWorkflowSelect() {
  if (selectedInstitutionId.value) { // Use selectedInstitutionId ref or logic from composable
    // Ideally loadWorkflow needs workflow ID.
    // The composable exposes `loadWorkflow`.
    // Wait, `selectedWorkflowId` was a local ref in the original file.
    // `useWorkflowEditor` doesn't seem to expose `selectedWorkflowId` directly as a ref we bind to?
    // Checking `useWorkflowEditor.ts`: it does NOT expose `selectedWorkflowId`. It exposes `loadWorkflow`.
  }
}

// We need a local ref for selectedWorkflowId to bind to the selector
const localSelectedWorkflowId = ref<string | null>(null)

// Watch local selection and call load
watch(localSelectedWorkflowId, async (newId) => {
  if (newId) {
    await loadWorkflow(newId)
    // Fit view logic handled by watch on nodes
  }
})

// Handle Vue Flow init
function onVueFlowInit() {
  viewportReady.value = true
  // fitView logic if needed
}

// Confirm node delete
function confirmDeleteNode(node: NodeInstance) {
  confirm.require({
    message: `¿Estás seguro de eliminar el nodo "${node.display_label}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteNode(node.id)
  })
}

// Confirm transition delete
function confirmDeleteTransition(edgeId: string) {
  confirm.require({
    message: '¿Estás seguro de eliminar esta transición?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteTransition(edgeId)
  })
}

// Keyboard shortcuts handler
function handleKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  // Delete/Backspace
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedNode.value) {
      e.preventDefault()
      confirmDeleteNode(selectedNode.value)
    } else if (selectedEdge.value) {
      e.preventDefault()
      confirmDeleteTransition(selectedEdge.value.id)
    }
  }

  // Escape
  if (e.key === 'Escape') {
    onPaneClick()
  }

  // Ctrl+S
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (currentWorkflow.value && isDirty.value) {
      saveWorkflow()
    }
  }

  // Zoom/Copy/Paste etc would ideally use useVueFlow instance.
  // We can try to access it here if we assume it's initialized.
  // Since we can't easily access useVueFlow outside component setup if provider is local, 
  // we might skip zoom shortcuts or move them to a child component (Canvas) that handles global keys.
  // For now, let's keep the logic that doesn't strictly depend on VueFlow instance methods (like copy/paste/undo/redo which use store).
  
  if (currentWorkflow.value) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copy() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); paste() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') { e.preventDefault(); cut() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicate() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); openNodeSearch() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Validation focus
function focusOnValidationNode(nodeId: string | undefined) {
  if (!nodeId) return
  workflowStore.selectNode(nodeId)
}

// Import
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

// Annotation
function addAnnotation() {
  workflowStore.addAnnotation({
    type: 'sticky',
    content: 'Nueva nota...',
    position: { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 },
    color: 'yellow'
  })
}

// Node definitions management
function openNodeDefinitions() {
  showNodeDefinitionsDialog.value = true
}

async function onDefinitionsUpdated() {
  // Reload node definitions to reflect changes in the palette
  await workflowStore.loadNodeDefinitions()
}
</script>

<template>
  <div class="workflow-editor-page p-6">
    <ConfirmDialog />

    <WorkflowHeader
        :currentWorkflow="currentWorkflow"
        :isDirty="isDirty"
        :isSaving="isSaving"
        @save="saveWorkflow"
        @publish="publishWorkflow"
        @newWorkflow="showWorkflowDialog = true"
      />

      <input
        ref="importFileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleImportFile"
      />

      <WorkflowSelector
        :institutions="institutions"
        :workflows="workflows"
        v-model:selectedInstitutionId="selectedInstitutionId"
        v-model:selectedWorkflowId="localSelectedWorkflowId"
        :currentWorkflow="currentWorkflow"
        :stats="stats"
        :isLoadingInstitutions="isLoadingInstitutions"
        @selectInstitution="onInstitutionSelect"
      />

      <WorkflowValidationBanner
        :validationErrors="validationErrors"
        @focusNode="focusOnValidationNode"
      />

      <!-- Main Editor Layout -->
      <div class="editor-layout">
        <!-- Left Sidebar: Node Palette -->
        <WorkflowPalette
          :isLoading="isLoading"
          :nodeDefinitionsByCategory="nodeDefinitionsByCategory"
          @addNode="openAddNodeDialog"
          @manageDefinitions="openNodeDefinitions"
        />

        <!-- Center: Toolbar + Canvas -->
        <div class="canvas-area">
          <WorkflowToolbar
            v-if="currentWorkflow"
            :canUndo="canUndo"
            :canRedo="canRedo"
            :hasClipboard="hasClipboard"
            :hasSelection="hasSelection"
            :isExporting="isExporting"
            :isImporting="isImporting"
            :isSimulating="isSimulating"
            :showSimulationPanel="showSimulationPanel"
            @update:showSimulationPanel="showSimulationPanel = $event"
            @export="exportToFile"
            @triggerImport="triggerImport"
            @addAnnotation="addAnnotation"
            @undo="undo"
            @redo="redo"
            @copy="copy"
            @paste="paste"
            @cut="cut"
            @duplicate="duplicate"
            @delete="handleDelete"
            @search="openNodeSearch"
          />

          <!-- Vue Flow Canvas -->
          <WorkflowCanvas
          :currentWorkflow="currentWorkflow"
          :nodes="nodes"
          :edges="edges"
          :isValidConnection="isValidConnection"
          :showSimulationPanel="showSimulationPanel"
          :simulationState="simulationState"
          v-model:simulationStepDelay="simulationStepDelay"
          :canStepForward="canStepForward"
          :canStepBackward="canStepBackward"
          @addNodeRequest="openAddNodeDialog"
          @nodeClick="onNodeClick"
          @edgeClick="onEdgeClick"
          @paneClick="onPaneClick"
          @connect="onConnect"
          @nodeDragStop="(p) => onNodeDragStop(p.id, p.position)"
          @init="onVueFlowInit"
          @startSimulation="startSimulation"
          @pauseSimulation="pauseSimulation"
          @resumeSimulation="resumeSimulation"
          @stopSimulation="stopSimulation"
          @simulationStepForward="simulationStepForward"
          @simulationStepBackward="simulationStepBackward"
          @openSimulationContext="showSimulationContextDialog = true"
          />
        </div>

        <!-- Floating Properties Button -->
        <Button
          v-if="currentWorkflow"
          icon="pi pi-sliders-h"
          class="properties-toggle-btn"
          severity="secondary"
          rounded
          :badge="hasSelection ? '1' : undefined"
          badgeSeverity="info"
          v-tooltip.left="'Propiedades'"
          @click="togglePropertiesDrawer"
        />
      </div>

      <!-- Properties Drawer -->
      <WorkflowPropertiesPanel
        v-model:visible="showPropertiesDrawer"
        :selectedNode="selectedNode"
        :selectedEdge="selectedEdge"
        :getNodeDefinition="workflowStore.getNodeDefinitionById"
        @updateNode="updateNode"
        @deleteNode="confirmDeleteNode"
        @updateTransition="updateTransition"
        @deleteTransition="confirmDeleteTransition"
      />

      <!-- Dialogs -->
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
      :visible="showSimulationContextDialog"
      :context="simulationState.context"
      @update:visible="showSimulationContextDialog = $event"
      @update:context="updateSimulationContext"
    />

    <!-- Node Definitions Management Dialog -->
    <NodeDefinitionsDialog
      v-model:visible="showNodeDefinitionsDialog"
      @definitionsUpdated="onDefinitionsUpdated"
    />
  </div>
</template>


<style scoped>
.workflow-editor-page {
  max-width: 100%;
  margin: 0 auto;
}

/* Editor Layout */
.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1rem;
  height: calc(100vh - 280px);
  min-height: 500px;
  position: relative;
}

/* Floating Properties Button */
.properties-toggle-btn {
  position: absolute !important;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Canvas Area - Toolbar + Canvas */
.canvas-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.canvas-area :deep(.flow-canvas-container) {
  flex: 1;
  border: none;
  border-radius: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: 992px) {
  .editor-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 400px;
    height: auto;
  }

  .canvas-area {
    min-height: 400px;
  }

  .properties-toggle-btn {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>

<!-- Global dark mode styles (unscoped) -->
<style>
/* Canvas Area - Dark Mode */
.dark-mode .canvas-area {
  background-color: var(--aynux-navy-800) !important;
  border-color: var(--aynux-navy-700) !important;
}

.dark-mode .canvas-area .flow-canvas-container {
  background-color: var(--aynux-navy-900) !important;
}
</style>
