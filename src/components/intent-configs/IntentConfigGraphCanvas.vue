<script setup lang="ts">
/**
 * IntentConfigGraphCanvas - Vue Flow canvas for intent configuration visualization
 *
 * Renders the graph with custom nodes for domains, intents, agents, and keywords.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import DomainNode from './nodes/DomainNode.vue'
import IntentNode from './nodes/IntentNode.vue'
import AgentNode from './nodes/AgentNode.vue'
import KeywordGroupNode from './nodes/KeywordGroupNode.vue'

import type {
  IntentConfigGraphNode,
  IntentConfigGraphEdge,
  GraphNodeType,
  DomainNodeData,
  AgentNodeData
} from './types'
import { getDomainConfig } from './types'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// Props
interface Props {
  nodes: IntentConfigGraphNode[]
  edges: IntentConfigGraphEdge[]
  selectedNodeId?: string | null
  highlightedPath?: string[]
  height?: string
  showMinimap?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedNodeId: null,
  highlightedPath: () => [],
  height: '600px',
  showMinimap: true,
  showControls: true
})

// Emits
const emit = defineEmits<{
  (e: 'nodeClick', nodeId: string, nodeType: GraphNodeType): void
  (e: 'paneClick'): void
}>()

// Vue Flow
const { fitView } = useVueFlow()
const viewportReady = ref(false)

// Handle initialization
function onVueFlowInit() {
  viewportReady.value = true
  if (props.nodes.length > 0) {
    nextTick(() => fitView({ padding: 0.15 }))
  }
}

// Computed nodes with styling
const styledNodes = computed(() => {
  return props.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    class: getNodeClass(node)
  }))
})

// Computed edges with styling
const styledEdges = computed(() => {
  return props.edges.map(edge => {
    const isHighlighted =
      props.highlightedPath.includes(edge.source) &&
      props.highlightedPath.includes(edge.target)

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: isHighlighted || edge.animated,
      style: isHighlighted
        ? { stroke: '#8b5cf6', strokeWidth: '3' }
        : edge.style || getDefaultEdgeStyle(edge.type)
    }
  })
})

// Node class based on selection and highlight
function getNodeClass(node: IntentConfigGraphNode): string {
  const classes = [`node-${node.type}`]

  if (props.selectedNodeId === node.id) {
    classes.push('node-selected')
  }

  if (props.highlightedPath.includes(node.id)) {
    classes.push('node-highlighted')
  }

  return classes.join(' ')
}

// Default edge styles
function getDefaultEdgeStyle(edgeType?: string): Record<string, string> {
  switch (edgeType) {
    case 'domain-intent':
      return { stroke: '#cbd5e1', strokeWidth: '1.5' }
    case 'intent-agent':
      return { stroke: '#3b82f6', strokeWidth: '2' }
    case 'agent-keyword':
      return { stroke: '#94a3b8', strokeWidth: '1.5' }
    default:
      return { stroke: '#94a3b8', strokeWidth: '1.5' }
  }
}

// Minimap node color
function getMinimapNodeColor(node: { type: string; data: unknown }): string {
  switch (node.type) {
    case 'domain': {
      const data = node.data as DomainNodeData
      return data.color
    }
    case 'intent':
      return '#3b82f6'
    case 'agent': {
      const data = node.data as AgentNodeData
      return data.color
    }
    case 'keyword-group':
      return '#94a3b8'
    default:
      return '#64748b'
  }
}

// Handle node click
function onNodeClick(event: { node: { id: string; type: string } }) {
  emit('nodeClick', event.node.id, event.node.type as GraphNodeType)
}

// Handle pane click
function onPaneClick() {
  emit('paneClick')
}

// Fit view button
function handleFitView() {
  fitView({ padding: 0.15 })
}

// Auto-fit when nodes change
watch(
  () => props.nodes.length,
  async () => {
    if (props.nodes.length > 0 && viewportReady.value) {
      await nextTick()
      fitView({ padding: 0.15 })
    }
  }
)
</script>

<template>
  <div class="graph-canvas" :style="{ height }">
    <VueFlow
      v-if="nodes.length > 0"
      :nodes="styledNodes"
      :edges="styledEdges"
      :default-viewport="{ zoom: 0.8, x: 50, y: 50 }"
      :min-zoom="0.2"
      :max-zoom="2"
      @init="onVueFlowInit"
      @nodeClick="onNodeClick"
      @paneClick="onPaneClick"
    >
      <!-- Background -->
      <Background pattern-color="#e2e8f0" :gap="20" />

      <!-- Controls -->
      <Controls v-if="showControls" position="top-right" />

      <!-- Minimap -->
      <MiniMap
        v-if="showMinimap"
        position="bottom-right"
        :node-color="getMinimapNodeColor"
      />

      <!-- Custom Node: Domain -->
      <template #node-domain="{ data }">
        <DomainNode :data="data" />
      </template>

      <!-- Custom Node: Intent -->
      <template #node-intent="{ data }">
        <IntentNode :data="data" />
      </template>

      <!-- Custom Node: Agent -->
      <template #node-agent="{ data }">
        <AgentNode :data="data" />
      </template>

      <!-- Custom Node: Keyword Group -->
      <template #node-keyword-group="{ data }">
        <KeywordGroupNode :data="data" />
      </template>
    </VueFlow>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="pi pi-sitemap empty-icon" />
      <p>No hay datos para visualizar</p>
      <p class="empty-hint">Selecciona un dominio o ajusta los filtros</p>
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
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f8fafc;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
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
  color: #94a3b8;
}

/* Fit View Button */
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

/* Node States */
:deep(.node-selected) {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

:deep(.node-highlighted) {
  outline: 2px solid #f59e0b;
  outline-offset: 1px;
}
</style>
