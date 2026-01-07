<script setup lang="ts">
/**
 * SubgraphFlowDialog - Vue Flow visualization for domain subgraphs
 *
 * Displays the internal flow structure of LangGraph subgraphs:
 * - PharmacyGraph: Customer identification, debt check, confirmation, payment
 * - EcommerceGraph: Products, promotions, tracking, invoicing
 * - CreditGraph: Balance, payments, schedules
 */
import { ref, computed, watch, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import {
  SUBGRAPH_DEFINITIONS,
  type SubgraphDefinition,
  type SubgraphNode,
  type SubgraphEdge
} from '@/types/subgraph.types'

// Vue Flow CSS imports
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

// Props
interface Props {
  visible: boolean
  graphName: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const { fitView } = useVueFlow()

// Local state
const isReady = ref(false)

// Get subgraph definition
const subgraph = computed<SubgraphDefinition | null>(() => {
  if (!props.graphName) return null
  return SUBGRAPH_DEFINITIONS[props.graphName] || null
})

// Layout configuration
const LAYOUT = {
  columnSpacing: 250,
  rowSpacing: 100,
  startX: 50,
  startY: 50
}

// Generate Vue Flow nodes from definition
const nodes = computed(() => {
  if (!subgraph.value) return []
  return generateNodes(subgraph.value)
})

// Generate Vue Flow edges from definition
const edges = computed(() => {
  if (!subgraph.value) return []
  return generateEdges(subgraph.value)
})

/**
 * Layout algorithm for positioning nodes
 * Arranges nodes in columns: Entry -> Router -> Operations -> End
 */
function generateNodes(def: SubgraphDefinition) {
  const nodePositions: Record<string, { x: number; y: number }> = {}

  // Categorize nodes by type
  const entryNodes = def.nodes.filter((n) => n.type === 'entry')
  const routerNodes = def.nodes.filter((n) => n.type === 'router')
  const operationNodes = def.nodes.filter((n) => n.type === 'operation')
  const endNodes = def.nodes.filter((n) => n.type === 'end')

  // Column positions
  let currentCol = 0

  // Position entry nodes (column 0)
  entryNodes.forEach((node, idx) => {
    nodePositions[node.id] = {
      x: LAYOUT.startX + currentCol * LAYOUT.columnSpacing,
      y: LAYOUT.startY + idx * LAYOUT.rowSpacing
    }
  })
  if (entryNodes.length > 0) currentCol++

  // Position router nodes (column 1) - skip if router is also entry
  const standaloneRouters = routerNodes.filter((r) => !entryNodes.some((e) => e.id === r.id))
  standaloneRouters.forEach((node, idx) => {
    nodePositions[node.id] = {
      x: LAYOUT.startX + currentCol * LAYOUT.columnSpacing,
      y: LAYOUT.startY + idx * LAYOUT.rowSpacing
    }
  })
  if (standaloneRouters.length > 0) currentCol++

  // If router is also entry (e.g., ecommerce_router), position it in entry column
  routerNodes
    .filter((r) => entryNodes.some((e) => e.id === r.id))
    .forEach((node) => {
      // Already positioned as entry
    })

  // Position operation nodes (columns 2-3, distributed vertically)
  const operationCols = Math.ceil(operationNodes.length / 3)
  operationNodes.forEach((node, idx) => {
    const colOffset = Math.floor(idx / 3)
    const rowIdx = idx % 3
    nodePositions[node.id] = {
      x: LAYOUT.startX + (currentCol + colOffset) * LAYOUT.columnSpacing,
      y: LAYOUT.startY + rowIdx * LAYOUT.rowSpacing
    }
  })
  if (operationNodes.length > 0) currentCol += operationCols

  // Position end nodes (last column)
  const maxY = Math.max(...Object.values(nodePositions).map((p) => p.y))
  const centerY = LAYOUT.startY + (maxY - LAYOUT.startY) / 2
  endNodes.forEach((node, idx) => {
    nodePositions[node.id] = {
      x: LAYOUT.startX + currentCol * LAYOUT.columnSpacing,
      y: centerY + idx * LAYOUT.rowSpacing
    }
  })

  // Create Vue Flow nodes
  return def.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: nodePositions[node.id] || { x: 0, y: 0 },
    data: {
      label: node.label,
      description: node.description,
      icon: node.icon,
      domainColor: def.domainColor
    }
  }))
}

/**
 * Generate Vue Flow edges from subgraph definition
 */
function generateEdges(def: SubgraphDefinition) {
  return def.edges.map((edge, idx) => ({
    id: `edge-${idx}`,
    source: edge.from,
    target: edge.to,
    type: 'smoothstep',
    animated: !edge.isConditional,
    label: edge.label || '',
    labelStyle: {
      fill: edge.isConditional ? '#f97316' : '#64748b',
      fontSize: '10px',
      fontWeight: 500
    },
    style: getEdgeStyle(edge, def.domainColor)
  }))
}

function getEdgeStyle(edge: SubgraphEdge, domainColor: string): Record<string, string> {
  if (edge.isConditional) {
    return {
      stroke: '#f97316',
      strokeWidth: '1.5',
      strokeDasharray: '5,5'
    }
  }
  return {
    stroke: domainColor,
    strokeWidth: '2'
  }
}

// Fit view when dialog opens and data is ready
watch(
  () => props.visible,
  async (visible) => {
    if (visible && subgraph.value) {
      isReady.value = false
      await nextTick()
      setTimeout(() => {
        isReady.value = true
        setTimeout(() => fitView({ padding: 0.2 }), 100)
      }, 50)
    }
  }
)

function handleClose() {
  emit('update:visible', false)
}

function handleFitView() {
  fitView({ padding: 0.2 })
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    :header="subgraph?.displayName || 'Flujo del Subgrafo'"
    :modal="true"
    :style="{ width: '900px' }"
    :maximizable="true"
    :contentStyle="{ padding: 0 }"
    class="subgraph-dialog"
  >
    <div v-if="!subgraph" class="empty-state">
      <i class="pi pi-exclamation-circle text-4xl text-gray-400" />
      <p class="text-gray-500 mt-2">No se encontró la definición del subgrafo</p>
    </div>

    <div v-else class="subgraph-flow-container">
      <!-- Description -->
      <div class="flow-description">
        <i class="pi pi-info-circle text-gray-400" />
        <span>{{ subgraph.description }}</span>
      </div>

      <!-- Vue Flow Graph -->
      <div class="flow-graph" style="height: 400px">
        <VueFlow
          v-if="isReady"
          :nodes="nodes"
          :edges="edges"
          :default-viewport="{ zoom: 0.9, x: 50, y: 50 }"
          :min-zoom="0.3"
          :max-zoom="2"
          fit-view-on-init
        >
          <!-- Background -->
          <Background pattern-color="#e2e8f0" :gap="20" />

          <!-- Controls -->
          <Controls position="top-right" />

          <!-- Custom Node: Entry -->
          <template #node-entry="{ data }">
            <div class="custom-node entry-node">
              <div class="node-icon entry-icon">
                <i :class="['pi', data.icon || 'pi-sign-in']" class="text-white" />
              </div>
              <div class="node-content">
                <div class="node-label">{{ data.label }}</div>
                <div v-if="data.description" class="node-description">{{ data.description }}</div>
              </div>
            </div>
          </template>

          <!-- Custom Node: Router -->
          <template #node-router="{ data }">
            <div class="custom-node router-node">
              <div class="node-icon router-icon">
                <i :class="['pi', data.icon || 'pi-sitemap']" class="text-white" />
              </div>
              <div class="node-content">
                <div class="node-label font-bold">{{ data.label }}</div>
                <div v-if="data.description" class="node-description">{{ data.description }}</div>
              </div>
            </div>
          </template>

          <!-- Custom Node: Operation -->
          <template #node-operation="{ data }">
            <div class="custom-node operation-node" :style="{ borderLeftColor: data.domainColor }">
              <div class="node-header">
                <i
                  :class="['pi', data.icon || 'pi-cog']"
                  :style="{ color: data.domainColor }"
                />
                <span class="node-label">{{ data.label }}</span>
              </div>
              <div v-if="data.description" class="node-description px-3 pb-2">
                {{ data.description }}
              </div>
            </div>
          </template>

          <!-- Custom Node: End -->
          <template #node-end="{ data }">
            <div class="custom-node end-node">
              <div class="node-icon end-icon">
                <i class="pi pi-check text-white" />
              </div>
              <div class="node-content">
                <div class="node-label">{{ data.label }}</div>
              </div>
            </div>
          </template>
        </VueFlow>

        <!-- Loading state -->
        <div v-else class="loading-state">
          <i class="pi pi-spin pi-spinner text-3xl text-gray-400" />
        </div>

        <!-- Fit View Button -->
        <button v-if="isReady" class="fit-view-btn" @click="handleFitView" title="Ajustar vista">
          <i class="pi pi-arrows-alt" />
        </button>
      </div>

      <!-- Legend -->
      <div class="flow-legend">
        <div class="legend-title">Leyenda</div>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-dot" style="background-color: #22c55e" />
            <span>Entrada</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background-color: #a855f7" />
            <span>Router</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: subgraph.domainColor }" />
            <span>Operación</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background-color: #10b981" />
            <span>Fin</span>
          </div>
        </div>
        <div class="legend-edges">
          <div class="legend-item">
            <span class="legend-line solid" :style="{ backgroundColor: subgraph.domainColor }" />
            <span>Flujo normal</span>
          </div>
          <div class="legend-item">
            <span class="legend-line dashed" />
            <span>Condicional</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cerrar" severity="secondary" @click="handleClose" />
    </template>
  </Dialog>
</template>

<style scoped>
.subgraph-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.subgraph-flow-container {
  display: flex;
  flex-direction: column;
}

.flow-description {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #64748b;
}

.flow-graph {
  position: relative;
  background-color: #f8fafc;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

/* Custom Node Base Styles */
.custom-node {
  padding: 0;
  border-radius: 0.5rem;
  min-width: 150px;
  max-width: 180px;
  background: white;
  border: 2px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.custom-node:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Node Header */
.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  font-size: 0.8rem;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-content {
  padding: 0.5rem 0.75rem;
}

.node-description {
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-width: 140px;
}

/* Node Icon */
.node-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Entry Node */
.entry-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #22c55e;
}

.entry-icon {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

/* Router Node */
.router-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border-color: #a855f7;
  min-width: 170px;
}

.router-icon {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
}

/* Operation Node */
.operation-node {
  border-left: 4px solid #3b82f6;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* End Node */
.end-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
}

.end-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Legend */
.flow-legend {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.legend-title {
  font-weight: 600;
  font-size: 0.75rem;
  color: #374151;
}

.legend-items {
  display: flex;
  gap: 1rem;
}

.legend-edges {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #64748b;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-line {
  width: 20px;
  height: 2px;
}

.legend-line.solid {
  background-color: #94a3b8;
}

.legend-line.dashed {
  background: repeating-linear-gradient(
    90deg,
    #f97316 0px,
    #f97316 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Fit View Button */
.fit-view-btn {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
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
</style>
