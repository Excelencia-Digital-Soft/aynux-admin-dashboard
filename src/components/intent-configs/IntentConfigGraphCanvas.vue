<script setup lang="ts">
/**
 * IntentConfigGraphCanvas - Vue Flow canvas for LangGraph topology
 *
 * Renders the graph with custom nodes for router, action, formatter, and terminals.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import RouterNode from './nodes/RouterNode.vue'
import ActionNode from './nodes/ActionNode.vue'
import FormatterNode from './nodes/FormatterNode.vue'
import StartEndNode from './nodes/StartEndNode.vue'

import type { TopologyFlowNode, TopologyFlowEdge, TopologyNodeData } from './types'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// Props
interface Props {
  nodes: TopologyFlowNode[]
  edges: TopologyFlowEdge[]
  selectedNodeId?: string | null
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedNodeId: null,
  height: '600px'
})

// Emits
const emit = defineEmits<{
  (e: 'nodeClick', nodeId: string): void
  (e: 'paneClick'): void
}>()

// Vue Flow
const { fitView } = useVueFlow()
const viewportReady = ref(false)

function onVueFlowInit() {
  viewportReady.value = true
  if (props.nodes.length > 0) {
    nextTick(() => fitView({ padding: 0.2 }))
  }
}

// Styled edges with hover highlight
const styledEdges = computed(() => {
  return props.edges.map((edge) => {
    // Highlight edges connected to selected node
    const isConnected =
      props.selectedNodeId &&
      (edge.source === props.selectedNodeId || edge.target === props.selectedNodeId)

    return {
      ...edge,
      animated: isConnected || edge.animated,
      style: isConnected
        ? { stroke: '#a78bfa', strokeWidth: '3' }
        : edge.style
    }
  })
})

// Minimap node color
function getMinimapNodeColor(node: { type: string; data: unknown }): string {
  const data = node.data as TopologyNodeData
  return data?.color || '#64748b'
}

// Handlers
function onNodeClick(event: { node: { id: string } }) {
  emit('nodeClick', event.node.id)
}

function onPaneClick() {
  emit('paneClick')
}

function handleFitView() {
  fitView({ padding: 0.2 })
}

// Auto-fit when nodes change
watch(
  () => props.nodes.length,
  async () => {
    if (props.nodes.length > 0 && viewportReady.value) {
      await nextTick()
      fitView({ padding: 0.2 })
    }
  }
)
</script>

<template>
  <div class="graph-canvas" :style="{ height }">
    <VueFlow
      v-if="nodes.length > 0"
      :nodes="nodes"
      :edges="styledEdges"
      :default-viewport="{ zoom: 0.9, x: 50, y: 30 }"
      :min-zoom="0.3"
      :max-zoom="2"
      :nodes-draggable="false"
      @init="onVueFlowInit"
      @nodeClick="onNodeClick"
      @paneClick="onPaneClick"
    >
      <Background pattern-color="var(--surface-border)" :gap="20" />
      <Controls position="top-right" />
      <MiniMap position="bottom-right" :node-color="getMinimapNodeColor" />

      <!-- Custom Nodes -->
      <template #node-router="{ data }">
        <RouterNode :data="data" />
      </template>

      <template #node-action="{ data }">
        <ActionNode :data="data" />
      </template>

      <template #node-formatter="{ data }">
        <FormatterNode :data="data" />
      </template>

      <template #node-terminal="{ data }">
        <StartEndNode :data="data" />
      </template>
    </VueFlow>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="pi pi-sitemap empty-icon" />
      <p>No hay datos de topologia</p>
      <p class="empty-hint">Verifica que el dominio tenga una topologia registrada</p>
    </div>

    <!-- Fit View Button -->
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
.graph-canvas {
  position: relative;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: var(--surface-ground);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0.25rem 0;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  opacity: 0.7;
}

/* Fit View Button */
.fit-view-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.375rem;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  color: var(--text-color);
}

.fit-view-btn:hover {
  background: var(--surface-hover);
}

/* Dark mode canvas */
:root.dark .graph-canvas,
.dark-mode .graph-canvas,
[data-theme="dark"] .graph-canvas {
  background-color: #0f172a;
}
</style>
