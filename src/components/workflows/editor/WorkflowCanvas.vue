<script setup lang="ts">
import { computed, watch, markRaw } from 'vue'
import { VueFlow, Handle, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import Tag from 'primevue/tag'
import ConditionEdge from '@/components/workflows/edges/ConditionEdge.vue'
import AnnotationNode from '@/components/workflows/nodes/AnnotationNode.vue'
import WorkflowNodeSearch from '@/components/workflows/WorkflowNodeSearch.vue'
import WorkflowSimulationPanel from '@/components/workflows/WorkflowSimulationPanel.vue'
import { nodeTypeColors } from '@/composables/useWorkflowEditor'
import type { NodeDefinition, WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow.types'

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
  annotation: markRaw(AnnotationNode)
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

function getNodeColor(nodeType: string): string {
  return nodeTypeColors[nodeType] || '#64748b'
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (!event.dataTransfer) return

  const data = event.dataTransfer.getData('application/workflow-node')
  if (!data) return

  const definition = JSON.parse(data) as NodeDefinition
  emit('addNodeRequest', definition)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}
</script>

<template>
  <div class="flow-canvas-container">
    <div v-if="!currentWorkflow" class="empty-canvas">
      <i class="pi pi-sitemap text-6xl text-gray-300" />
      <p class="text-gray-400 mt-4">Selecciona o crea un workflow para comenzar</p>
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
        <i class="pi pi-sitemap text-6xl text-gray-300" />
        <p class="text-gray-400 mt-4">El workflow está vacío. Arrastra nodos desde el panel izquierdo.</p>
      </div>

      <!-- Vue Flow only mounts when we have nodes -->
      <VueFlow
        v-else
        :nodes="flowNodes"
        :edges="flowEdges"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :is-valid-connection="isValidConnection"
        :default-viewport="{ zoom: 0.8, x: 50, y: 50 }"
        :min-zoom="0.2"
        :max-zoom="2"
        @init="onInit"
        @nodeClick="(e) => emit('nodeClick', e.node.id)"
        @edgeClick="(e) => emit('edgeClick', e.edge.id)"
        @paneClick="emit('paneClick')"
        @connect="(e) => emit('connect', e)"
        @nodeDragStop="(e) => emit('nodeDragStop', { id: e.node.id, position: e.node.position })"
      >
        <Background pattern-color="#e2e8f0" :gap="20" />
        <Controls position="top-right" />
        <MiniMap
          position="bottom-right"
          :node-color="(node: any) => node.data?.color || getNodeColor(node.type || 'utility')"
        />

        <!-- Custom Node Templates -->
        <template #node-conversation="{ data }">
          <div class="workflow-node conversation-node">
            <!-- Input handle (top) - hidden for entry point -->
            <Handle v-if="!data.isEntryPoint" type="target" :position="Position.Top" class="handle-target" />
            <div class="node-header" :style="{ backgroundColor: '#dbeafe' }">
              <i :class="['pi', data.icon || 'pi-comments']" style="color: #3b82f6" />
              <span class="node-label">{{ data.label }}</span>
              <Tag v-if="data.isEntryPoint" value="Entry" severity="success" class="text-xs" />
            </div>
            <div v-if="data.description" class="node-description">{{ data.description }}</div>
            <!-- Output handle (bottom) -->
            <Handle type="source" :position="Position.Bottom" class="handle-source" />
          </div>
        </template>

        <template #node-routing="{ data }">
          <div class="workflow-node routing-node">
            <Handle v-if="!data.isEntryPoint" type="target" :position="Position.Top" class="handle-target" />
            <div class="node-header" :style="{ backgroundColor: '#ede9fe' }">
              <i :class="['pi', data.icon || 'pi-sitemap']" style="color: #8b5cf6" />
              <span class="node-label">{{ data.label }}</span>
              <Tag v-if="data.isEntryPoint" value="Entry" severity="success" class="text-xs" />
            </div>
            <div v-if="data.description" class="node-description">{{ data.description }}</div>
            <Handle type="source" :position="Position.Bottom" class="handle-source" />
          </div>
        </template>

        <template #node-integration="{ data }">
          <div class="workflow-node integration-node">
            <Handle v-if="!data.isEntryPoint" type="target" :position="Position.Top" class="handle-target" />
            <div class="node-header" :style="{ backgroundColor: '#d1fae5' }">
              <i :class="['pi', data.icon || 'pi-cloud']" style="color: #10b981" />
              <span class="node-label">{{ data.label }}</span>
              <Tag v-if="data.isEntryPoint" value="Entry" severity="success" class="text-xs" />
            </div>
            <div v-if="data.description" class="node-description">{{ data.description }}</div>
            <Handle type="source" :position="Position.Bottom" class="handle-source" />
          </div>
        </template>

        <template #node-utility="{ data }">
          <div class="workflow-node utility-node">
            <Handle v-if="!data.isEntryPoint" type="target" :position="Position.Top" class="handle-target" />
            <div class="node-header" :style="{ backgroundColor: '#f1f5f9' }">
              <i :class="['pi', data.icon || 'pi-cog']" style="color: #64748b" />
              <span class="node-label">{{ data.label }}</span>
              <Tag v-if="data.isEntryPoint" value="Entry" severity="success" class="text-xs" />
            </div>
            <div v-if="data.description" class="node-description">{{ data.description }}</div>
            <Handle type="source" :position="Position.Bottom" class="handle-source" />
          </div>
        </template>

        <template #node-default="{ data }">
          <div class="workflow-node default-node">
            <Handle v-if="!data.isEntryPoint" type="target" :position="Position.Top" class="handle-target" />
            <div class="node-header">
              <i :class="['pi', data.icon || 'pi-circle']" />
              <span class="node-label">{{ data.label }}</span>
              <Tag v-if="data.isEntryPoint" value="Entry" severity="success" class="text-xs" />
            </div>
            <div v-if="data.description" class="node-description">{{ data.description }}</div>
            <Handle type="source" :position="Position.Bottom" class="handle-source" />
          </div>
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<style scoped>
.flow-canvas-container {
  height: 100%;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.vue-flow-container {
  height: 100%;
  width: 100%;
}

.empty-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

/* Workflow Nodes */
.workflow-node {
  min-width: 180px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.workflow-node .node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem 0.375rem 0 0;
}

.workflow-node .node-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workflow-node .node-description {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
}

/* Node Types */
.conversation-node { border-color: #3b82f6; }
.routing-node { border-color: #8b5cf6; }
.integration-node { border-color: #10b981; }
.utility-node { border-color: #64748b; }

/* Handle Styles */
.handle-target,
.handle-source {
  width: 12px !important;
  height: 12px !important;
  background: #64748b !important;
  border: 2px solid white !important;
  border-radius: 50% !important;
}

.handle-target {
  top: -6px !important;
}

.handle-source {
  bottom: -6px !important;
}

.handle-target:hover,
.handle-source:hover {
  background: #8b5cf6 !important;
  transform: scale(1.3);
  transition: all 0.15s ease;
}

/* Connecting state */
:deep(.vue-flow__handle.connecting) {
  background: #10b981 !important;
}

:deep(.vue-flow__handle.valid) {
  background: #10b981 !important;
}

/* Selected state */
:deep(.vue-flow__node.selected) {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
}

:deep(.vue-flow__edge.selected) .vue-flow__edge-path {
  stroke: #8b5cf6;
  stroke-width: 3;
}

/* Simulation Overlay */
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

/* Simulation Active Node Styles */
:deep(.vue-flow__node.simulation-active) {
  animation: pulse-active 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);
}

:deep(.vue-flow__node.simulation-visited) {
  opacity: 0.7;
  border-color: #9ca3af;
}

@keyframes pulse-active {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2);
  }
}
</style>
