<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useChatStore } from '@/stores/chat.store'
import type { GraphNode, GraphEdge } from '@/types/chat.types'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

interface Props {
  height?: string
  showMinimap?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  showMinimap: true,
  showControls: true
})

const emit = defineEmits<{
  (e: 'nodeClick', nodeId: string): void
}>()

const store = useChatStore()
const { fitView, zoomIn, zoomOut } = useVueFlow()

// Convert store nodes to Vue Flow format
const nodes = computed(() => {
  return store.graphNodes.map(node => ({
    id: node.id,
    type: 'custom',
    position: node.position,
    data: node.data,
    class: getNodeClass(node)
  }))
})

const edges = computed(() => {
  return store.graphEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.animated,
    style: getEdgeStyle(edge),
    labelStyle: { fill: '#666', fontWeight: 500 },
    label: edge.label
  }))
})

function getNodeClass(node: GraphNode): string {
  const classes = ['custom-node']

  // Status classes
  switch (node.data.status) {
    case 'running':
      classes.push('node-running')
      break
    case 'completed':
      classes.push('node-completed')
      break
    case 'error':
      classes.push('node-error')
      break
    default:
      classes.push('node-pending')
  }

  // Type classes
  classes.push(`node-type-${node.type}`)

  // Selected
  if (store.selectedNodeId === node.id) {
    classes.push('node-selected')
  }

  return classes.join(' ')
}

function getEdgeStyle(edge: GraphEdge): Record<string, string> {
  if (edge.type === 'error') {
    return { stroke: '#ef4444', strokeWidth: '2' }
  }
  if (edge.animated) {
    return { stroke: '#3b82f6', strokeWidth: '2' }
  }
  return { stroke: '#94a3b8', strokeWidth: '1.5' }
}

function onNodeClick(event: { node: { id: string } }) {
  store.selectNode(event.node.id)
  emit('nodeClick', event.node.id)
}

function handleFitView() {
  fitView({ padding: 0.2 })
}

// Auto-fit when nodes change
watch(() => store.graphNodes.length, () => {
  if (store.graphNodes.length > 0) {
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }
})

onMounted(() => {
  store.setGraphInitialized(true)
})
</script>

<template>
  <div class="graph-visualization" :style="{ height }">
    <VueFlow
      v-if="nodes.length > 0"
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="2"
      fit-view-on-init
      @nodeClick="onNodeClick"
    >
      <!-- Background -->
      <Background pattern-color="#e2e8f0" :gap="20" />

      <!-- Controls -->
      <Controls v-if="showControls" position="top-right" />

      <!-- Minimap -->
      <MiniMap
        v-if="showMinimap"
        position="bottom-right"
        :node-color="(node: any) => {
          if (node.data?.status === 'error') return '#ef4444'
          if (node.data?.status === 'completed') return '#10b981'
          if (node.data?.status === 'running') return '#3b82f6'
          return '#94a3b8'
        }"
      />

      <!-- Custom node template -->
      <template #node-custom="{ data }">
        <div class="custom-node-content">
          <div class="node-header">
            <i :class="['pi', data.icon || 'pi-circle']" />
            <span class="node-label">{{ data.label }}</span>

            <!-- RAG Badge with tooltip -->
            <span
              v-if="data.rag_info?.used"
              class="rag-badge"
              :title="`RAG: ${data.rag_info.query?.substring(0, 30) || 'N/A'}...\nResultados: ${data.rag_info.results_count || 0}\nTiempo: ${data.rag_info.duration_ms || 0}ms`"
            >
              <i class="pi pi-database" />
              <span class="rag-count">{{ data.rag_info.results_count || 0 }}</span>
            </span>
          </div>
          <div v-if="data.description" class="node-description">
            {{ data.description }}
          </div>
          <div v-if="data.duration_ms" class="node-duration">
            {{ data.duration_ms }}ms
          </div>
          <div v-if="data.status === 'running'" class="node-spinner">
            <i class="pi pi-spin pi-spinner" />
          </div>
        </div>
      </template>
    </VueFlow>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <i class="pi pi-sitemap text-4xl text-gray-300" />
      <p class="text-gray-400 mt-2">Envia un mensaje para ver el grafo de ejecucion</p>
    </div>

    <!-- Legend -->
    <div class="graph-legend">
      <div class="legend-item">
        <span class="legend-dot bg-gray-400" />
        <span>Pendiente</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot bg-blue-500" />
        <span>Ejecutando</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot bg-green-500" />
        <span>Completado</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot bg-red-500" />
        <span>Error</span>
      </div>
      <div class="legend-item">
        <i class="pi pi-database text-blue-500" style="font-size: 0.65rem" />
        <span>RAG</span>
      </div>
    </div>

    <!-- Fit view button -->
    <button
      v-if="nodes.length > 0"
      class="fit-view-btn"
      @click="handleFitView"
      title="Ajustar vista"
    >
      <i class="pi pi-arrows-alt" />
    </button>
  </div>
</template>

<style scoped>
.graph-visualization {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f8fafc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.graph-legend {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 0.75rem;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.legend-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.fit-view-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.fit-view-btn:hover {
  background: #f1f5f9;
}

/* Custom node styles */
:deep(.custom-node) {
  padding: 0;
  border-radius: 0.5rem;
  min-width: 150px;
  background: white;
  border: 2px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

:deep(.custom-node:hover) {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.node-pending) {
  border-color: #94a3b8;
}

:deep(.node-running) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.node-completed) {
  border-color: #10b981;
}

:deep(.node-error) {
  border-color: #ef4444;
  background: #fef2f2;
}

:deep(.node-selected) {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
}

.custom-node-content {
  padding: 0.75rem;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.node-header i {
  color: #6b7280;
}

.node-description {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-duration {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

.node-spinner {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #3b82f6;
}

/* RAG Badge Styles */
.rag-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: #dbeafe;
  border-radius: 4px;
  font-size: 0.65rem;
  color: #1d4ed8;
  margin-left: auto;
  cursor: help;
  white-space: pre-line;
}

.rag-badge:hover {
  background: #bfdbfe;
}

.rag-badge i {
  font-size: 0.6rem;
}

.rag-count {
  font-weight: 600;
}

/* Node type specific styles */
:deep(.node-type-start .custom-node-content) {
  background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
}

:deep(.node-type-end .custom-node-content) {
  background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
}

:deep(.node-type-error .custom-node-content) {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

:deep(.node-type-tool) {
  border-style: dashed;
}

:deep(.node-type-decision) {
  border-radius: 0.25rem;
  transform: rotate(0deg);
}
</style>
