<script setup lang="ts">
// @ts-nocheck - Pre-existing type issues with Vue Flow prop types
/**
 * WorkflowCanvas - n8n-style visual workflow canvas
 *
 * Features:
 * - Dark gradient background (navy theme)
 * - Square nodes with large icons (80x80px)
 * - Smooth bezier curve connections
 * - Circular handles on left/right
 * - Node labels below the node
 */
import { computed, markRaw } from 'vue'
import { VueFlow, Handle, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import ConditionEdge from '@/components/workflows/edges/ConditionEdge.vue'
import AnnotationNode from '@/components/workflows/nodes/AnnotationNode.vue'
import GroupNode from '@/components/workflows/nodes/GroupNode.vue'
import ConditionNode from '@/components/workflows/nodes/ConditionNode.vue'
import WorkflowNodeSearch from '@/components/workflows/WorkflowNodeSearch.vue'
import WorkflowSimulationPanel from '@/components/workflows/WorkflowSimulationPanel.vue'
import { nodeTypeColors } from '@/composables/useWorkflowEditor'
import { useToast } from '@/composables/useToast'
import type { NodeDefinition, WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow.types'

const toast = useToast()

const props = defineProps<{
  currentWorkflow: WorkflowDefinition | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  isValidConnection: (connection: any) => boolean
  showSimulationPanel: boolean
  // Simulation props
  simulationState: any
  simulationStepDelay: number
  canStepForward: boolean
  canStepBackward: boolean
}>()

const emit = defineEmits<{
  (e: 'addNodeRequest', definition: NodeDefinition): void
  (e: 'nodeClick', nodeId: string): void
  (e: 'edgeClick', edgeId: string): void
  (e: 'paneClick'): void
  (e: 'connect', params: any): void
  (e: 'nodeDragStop', params: { id: string, position: { x: number, y: number } }): void
  (e: 'init'): void
  // Context menu and double-click events (n8n-style)
  (e: 'nodeContextMenu', payload: { event: MouseEvent; nodeId: string }): void
  (e: 'nodeDoubleClick', nodeId: string): void
  // Toolbar position update (screen coordinates)
  (e: 'nodeSelected', payload: { nodeId: string; screenPosition: { x: number; y: number } }): void
  // Simulation events
  (e: 'startSimulation'): void
  (e: 'pauseSimulation'): void
  (e: 'resumeSimulation'): void
  (e: 'stopSimulation'): void
  (e: 'simulationStepForward'): void
  (e: 'simulationStepBackward'): void
  (e: 'update:simulationStepDelay', value: number): void
  (e: 'openSimulationContext'): void
}>()

// Custom types - use markRaw to prevent Vue from making components reactive
const nodeTypes = {
  annotation: markRaw(AnnotationNode),
  group: markRaw(GroupNode),
  condition: markRaw(ConditionNode)
}

const edgeTypes = {
  condition: markRaw(ConditionEdge)
}

// Computed nodes/edges - simple pass-through like AgentFlowGraph
const flowNodes = computed(() => props.nodes)
const flowEdges = computed(() => props.edges)

// Handle init event
function onInit() {
  emit('init')
}

// Get screen position directly from the DOM node element (most reliable method)
function getNodeScreenPosition(nodeId: string): { x: number; y: number } | null {
  // Find the node element in the DOM
  const nodeElement = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement
  if (!nodeElement) {
    return null
  }

  const rect = nodeElement.getBoundingClientRect()

  // Return the center-top position of the node
  return {
    x: rect.left + rect.width / 2,
    y: rect.top
  }
}

// Handle node click with screen position emission
function handleNodeClick(nodeId: string) {
  // Small delay to ensure the node is rendered and selected
  setTimeout(() => {
    const screenPos = getNodeScreenPosition(nodeId)
    if (screenPos) {
      emit('nodeSelected', {
        nodeId,
        screenPosition: screenPos
      })
    }
  }, 0)
  emit('nodeClick', nodeId)
}

function getNodeColor(nodeType: string): string {
  return nodeTypeColors[nodeType] || '#64748b'
}

// Get icon for node type
function getNodeIcon(data: any, nodeType: string): string {
  if (data?.icon) return data.icon

  const defaultIcons: Record<string, string> = {
    conversation: 'pi-comments',
    routing: 'pi-sitemap',
    integration: 'pi-cloud',
    utility: 'pi-cog',
    default: 'pi-circle'
  }

  return defaultIcons[nodeType] || defaultIcons.default
}

// Get background color for node type (darker for n8n style)
function getNodeBgColor(nodeType: string): string {
  const colors: Record<string, string> = {
    conversation: '#3b82f6',
    routing: '#8b5cf6',
    integration: '#10b981',
    utility: '#64748b'
  }
  return colors[nodeType] || '#64748b'
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (!event.dataTransfer) return

  const data = event.dataTransfer.getData('application/workflow-node')
  if (!data) return

  try {
    const definition = JSON.parse(data) as NodeDefinition
    emit('addNodeRequest', definition)
  } catch (error) {
    console.error('[WorkflowCanvas] Invalid node data in drag-drop:', error)
    toast.error('No se pudo agregar el nodo: formato de datos invalido')
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// Handle right-click on node (context menu)
function onNodeContextMenu(event: MouseEvent, nodeId: string) {
  event.preventDefault()
  event.stopPropagation()
  emit('nodeContextMenu', { event, nodeId })
}

// Handle double-click on node (open edit modal)
function onNodeDoubleClick(nodeId: string) {
  emit('nodeDoubleClick', nodeId)
}
</script>

<template>
  <div class="n8n-canvas-container">
    <div v-if="!currentWorkflow" class="empty-canvas">
      <div class="empty-icon">
        <i class="pi pi-sitemap" />
      </div>
      <p class="empty-text">Selecciona o crea un workflow para comenzar</p>
    </div>

    <div
      v-else
      class="vue-flow-container"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <!-- Node Search Overlay -->
      <WorkflowNodeSearch />

      <!-- Simulation Panel Overlay -->
      <Transition name="slide-right">
        <div v-if="showSimulationPanel" class="simulation-panel-overlay">
          <WorkflowSimulationPanel
            :state="simulationState"
            :step-delay="simulationStepDelay"
            :can-step-forward="canStepForward"
            :can-step-backward="canStepBackward"
            @start="emit('startSimulation')"
            @pause="emit('pauseSimulation')"
            @resume="emit('resumeSimulation')"
            @stop="emit('stopSimulation')"
            @step-forward="emit('simulationStepForward')"
            @step-backward="emit('simulationStepBackward')"
            @update:step-delay="(v) => emit('update:simulationStepDelay', v)"
            @open-context="emit('openSimulationContext')"
          />
        </div>
      </Transition>

      <!-- Empty state when no nodes -->
      <div v-if="flowNodes.length === 0" class="empty-canvas">
        <div class="empty-icon">
          <i class="pi pi-plus-circle" />
        </div>
        <p class="empty-text">Arrastra nodos desde el panel o haz clic en + para comenzar</p>
      </div>

      <!-- Vue Flow only mounts when we have nodes -->
      <VueFlow
        v-else
        :nodes="flowNodes"
        :edges="flowEdges"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :is-valid-connection="isValidConnection"
        :default-viewport="{ zoom: 0.8, x: 100, y: 100 }"
        :min-zoom="0.2"
        :max-zoom="2"
        :default-edge-options="{
          type: 'condition',
          animated: false
        }"
        :connection-line-style="{ stroke: '#8b5cf6', strokeWidth: 2 }"
        :connection-line-type="'smoothstep'"
        @init="onInit"
        @nodeClick="(e) => handleNodeClick(e.node.id)"
        @nodeDoubleClick="(e) => emit('nodeDoubleClick', e.node.id)"
        @nodeContextMenu="(e) => onNodeContextMenu(e.event, e.node.id)"
        @edgeClick="(e) => emit('edgeClick', e.edge.id)"
        @paneClick="emit('paneClick')"
        @connect="(e) => emit('connect', e)"
        @nodeDragStop="(e) => emit('nodeDragStop', { id: e.node.id, position: e.node.position })"
      >
        <!-- Dark dotted background -->
        <Background :gap="24" :size="1" pattern-color="rgba(255, 255, 255, 0.1)" />

        <!-- MiniMap with dark theme -->
        <MiniMap
          position="bottom-right"
          :node-color="(node: any) => node.data?.color || getNodeColor(node.type || 'utility')"
          class="n8n-minimap"
        />

        <!-- n8n-style Node Templates -->
        <template #node-conversation="{ data }">
          <div
            class="n8n-node"
            :class="{ 'is-entry': data.isEntryPoint }"
          >
            <!-- Input handle (left) - hidden for entry point -->
            <Handle
              v-if="!data.isEntryPoint"
              type="target"
              :position="Position.Left"
              class="n8n-handle n8n-handle-target"
            />

            <!-- Node body -->
            <div class="n8n-node-body" :style="{ backgroundColor: getNodeBgColor('conversation') }">
              <i :class="['pi', getNodeIcon(data, 'conversation')]" />
              <!-- Entry badge -->
              <div v-if="data.isEntryPoint" class="n8n-entry-badge">
                <i class="pi pi-flag" />
              </div>
            </div>

            <!-- Node label (below) -->
            <div class="n8n-node-label">{{ data.label }}</div>

            <!-- Output handle (right) -->
            <Handle type="source" :position="Position.Right" class="n8n-handle n8n-handle-source" />
          </div>
        </template>

        <template #node-routing="{ data }">
          <div
            class="n8n-node"
            :class="{ 'is-entry': data.isEntryPoint }"
          >
            <Handle
              v-if="!data.isEntryPoint"
              type="target"
              :position="Position.Left"
              class="n8n-handle n8n-handle-target"
            />

            <div class="n8n-node-body" :style="{ backgroundColor: getNodeBgColor('routing') }">
              <i :class="['pi', getNodeIcon(data, 'routing')]" />
              <div v-if="data.isEntryPoint" class="n8n-entry-badge">
                <i class="pi pi-flag" />
              </div>
            </div>

            <div class="n8n-node-label">{{ data.label }}</div>

            <Handle type="source" :position="Position.Right" class="n8n-handle n8n-handle-source" />
          </div>
        </template>

        <template #node-integration="{ data }">
          <div
            class="n8n-node"
            :class="{ 'is-entry': data.isEntryPoint }"
          >
            <Handle
              v-if="!data.isEntryPoint"
              type="target"
              :position="Position.Left"
              class="n8n-handle n8n-handle-target"
            />

            <div class="n8n-node-body" :style="{ backgroundColor: getNodeBgColor('integration') }">
              <i :class="['pi', getNodeIcon(data, 'integration')]" />
              <div v-if="data.isEntryPoint" class="n8n-entry-badge">
                <i class="pi pi-flag" />
              </div>
            </div>

            <div class="n8n-node-label">{{ data.label }}</div>

            <Handle type="source" :position="Position.Right" class="n8n-handle n8n-handle-source" />
          </div>
        </template>

        <template #node-utility="{ data }">
          <div
            class="n8n-node"
            :class="{ 'is-entry': data.isEntryPoint }"
          >
            <Handle
              v-if="!data.isEntryPoint"
              type="target"
              :position="Position.Left"
              class="n8n-handle n8n-handle-target"
            />

            <div class="n8n-node-body" :style="{ backgroundColor: getNodeBgColor('utility') }">
              <i :class="['pi', getNodeIcon(data, 'utility')]" />
              <div v-if="data.isEntryPoint" class="n8n-entry-badge">
                <i class="pi pi-flag" />
              </div>
            </div>

            <div class="n8n-node-label">{{ data.label }}</div>

            <Handle type="source" :position="Position.Right" class="n8n-handle n8n-handle-source" />
          </div>
        </template>

        <template #node-default="{ data }">
          <div
            class="n8n-node"
            :class="{ 'is-entry': data.isEntryPoint }"
          >
            <Handle
              v-if="!data.isEntryPoint"
              type="target"
              :position="Position.Left"
              class="n8n-handle n8n-handle-target"
            />

            <div class="n8n-node-body" style="background-color: #64748b">
              <i :class="['pi', getNodeIcon(data, 'default')]" />
              <div v-if="data.isEntryPoint" class="n8n-entry-badge">
                <i class="pi pi-flag" />
              </div>
            </div>

            <div class="n8n-node-label">{{ data.label }}</div>

            <Handle type="source" :position="Position.Right" class="n8n-handle n8n-handle-source" />
          </div>
        </template>

        <!-- Condition Node Template (If/Else with two outputs) -->
        <template #node-condition="{ data, id }">
          <ConditionNode
            :id="id"
            :data="data"
            @contextmenu.native="onNodeContextMenu($event, id)"
            @dblclick.native="onNodeDoubleClick(id)"
          />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<style scoped>
/* ========================================
   n8n-Style Canvas Container
   ======================================== */
.n8n-canvas-container {
  height: 100%;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  /* Dark gradient background - navy theme */
  background: linear-gradient(135deg, #0c1d3d 0%, #1e3a5f 50%, #0c1d3d 100%);
  position: relative;
}

.vue-flow-container {
  height: 100%;
  width: 100%;
}

/* ========================================
   Empty State
   ======================================== */
.empty-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin-bottom: 1rem;
}

.empty-icon i {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.4);
}

.empty-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  text-align: center;
  max-width: 250px;
}

/* ========================================
   n8n-Style Nodes
   ======================================== */
.n8n-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.n8n-node-body {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
}

.n8n-node-body i {
  font-size: 2rem;
  color: white;
}

.n8n-node-body:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.2);
}

/* Entry point badge */
.n8n-entry-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0c1d3d;
}

.n8n-entry-badge i {
  font-size: 0.75rem;
  color: white;
}

/* Node label */
.n8n-node-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* ========================================
   n8n-Style Handles
   ======================================== */
.n8n-handle {
  width: 16px !important;
  height: 16px !important;
  background: #3d5a80 !important;
  border: 3px solid #0c1d3d !important;
  border-radius: 50% !important;
  transition: all 0.15s ease;
}

.n8n-handle-target {
  left: -8px !important;
}

.n8n-handle-source {
  right: -8px !important;
}

.n8n-handle:hover {
  background: #8b5cf6 !important;
  transform: scale(1.3);
  border-color: #0c1d3d !important;
}

/* Connecting state */
:deep(.vue-flow__handle.connecting) {
  background: #10b981 !important;
  animation: pulse-handle 0.8s infinite;
}

:deep(.vue-flow__handle.valid) {
  background: #10b981 !important;
}

@keyframes pulse-handle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* ========================================
   Selected State
   ======================================== */
:deep(.vue-flow__node.selected) .n8n-node-body {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 3px #8b5cf6;
}

:deep(.vue-flow__edge.selected) .vue-flow__edge-path {
  stroke: #8b5cf6;
  stroke-width: 3;
}

/* ========================================
   MiniMap Styling
   ======================================== */
.n8n-minimap :deep(.vue-flow__minimap) {
  background: rgba(12, 29, 61, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

:deep(.vue-flow__minimap-mask) {
  fill: rgba(139, 92, 246, 0.2);
}

/* ========================================
   Simulation Overlay
   ======================================== */
.simulation-panel-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

/* Transitions */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ========================================
   Simulation Active Node Styles
   ======================================== */
:deep(.vue-flow__node.simulation-active) .n8n-node-body {
  animation: pulse-active 1.5s ease-in-out infinite;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 4px rgba(16, 185, 129, 0.6);
}

:deep(.vue-flow__node.simulation-visited) .n8n-node-body {
  opacity: 0.6;
}

@keyframes pulse-active {
  0%, 100% {
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 0 4px rgba(16, 185, 129, 0.6);
  }
  50% {
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 0 8px rgba(16, 185, 129, 0.3);
  }
}

/* ========================================
   Hide default Vue Flow controls
   ======================================== */
:deep(.vue-flow__controls) {
  display: none;
}

/* ========================================
   Connection line styling
   ======================================== */
:deep(.vue-flow__connection-line) {
  stroke: #8b5cf6;
  stroke-width: 2;
}

/* ========================================
   Edge path default styling
   ======================================== */
:deep(.vue-flow__edge-path) {
  stroke: #64748b;
  stroke-width: 2;
}
</style>
