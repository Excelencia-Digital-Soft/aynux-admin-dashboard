<script setup lang="ts">
/**
 * AgentFlowGraph - Vue Flow visualization of agent system architecture
 *
 * Displays:
 * - Message input (WhatsApp entry point)
 * - Bypass rules (priority-ordered routing rules)
 * - Orchestrator (central routing hub)
 * - Domain groups with agents
 * - Supervisor (response evaluation)
 * - End node (response output)
 */
import { ref, computed, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useAgentFlowStore } from '@/stores/agentFlow.store'
import { agentFlowApi } from '@/api/agentFlow.api'
import BypassRuleDetailPanel from './BypassRuleDetailPanel.vue'
import type {
  AgentFlowNode,
  AgentNodeData,
  BypassRuleNodeData,
  BypassRuleVisualization,
  OrchestratorNodeData,
  DomainGroupNodeData,
  FlowNodeType,
  DOMAIN_CONFIG,
  BYPASS_RULE_TYPE_CONFIG
} from '@/types/agentFlow.types'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// Props
interface Props {
  organizationId?: string
  height?: string
  showMinimap?: boolean
  showControls?: boolean
  showLegend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px',
  showMinimap: true,
  showControls: true,
  showLegend: true
})

// Emits
const emit = defineEmits<{
  (e: 'nodeClick', nodeId: string, nodeType: FlowNodeType): void
  (e: 'agentSelect', agentKey: string): void
  (e: 'ruleSelect', ruleId: string): void
}>()

// Store
const store = useAgentFlowStore()
const { fitView, zoomIn, zoomOut } = useVueFlow()

// Local state
const isInitialized = ref(false)
const selectedRule = ref<BypassRuleVisualization | null>(null)
const showDetailPanel = ref(false)

// Computed
const nodes = computed(() => {
  return store.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    class: getNodeClass(node)
  }))
})

const edges = computed(() => {
  return store.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.animated,
    style: edge.style || getEdgeStyle(edge.type),
    label: edge.label,
    labelStyle: { fill: '#64748b', fontSize: '11px', fontWeight: 500 }
  }))
})

// Domain configuration
const domainConfig: Record<string, { displayName: string; color: string; bgColor: string }> = {
  system: { displayName: 'Sistema', color: '#64748b', bgColor: '#f1f5f9' },
  global: { displayName: 'Global', color: '#3b82f6', bgColor: '#dbeafe' },
  excelencia: { displayName: 'Excelencia', color: '#8b5cf6', bgColor: '#ede9fe' },
  ecommerce: { displayName: 'E-commerce', color: '#10b981', bgColor: '#d1fae5' },
  pharmacy: { displayName: 'Farmacia', color: '#14b8a6', bgColor: '#ccfbf1' },
  credit: { displayName: 'Credito', color: '#f59e0b', bgColor: '#fef3c7' }
}

// Bypass rule type config
const bypassTypeConfig: Record<string, { icon: string; color: string }> = {
  phone_number: { icon: 'pi-phone', color: '#3b82f6' },
  phone_number_list: { icon: 'pi-list', color: '#10b981' },
  whatsapp_phone_number_id: { icon: 'pi-whatsapp', color: '#25d366' }
}

// Methods
function getNodeClass(node: AgentFlowNode): string {
  const classes = [`node-${node.type}`]

  if (store.selectedNodeId === node.id) {
    classes.push('node-selected')
  }

  if (store.highlightedPath.includes(node.id)) {
    classes.push('node-highlighted')
  }

  // Check if agent is enabled
  if (node.type === 'agent') {
    const data = node.data as AgentNodeData
    if (!data.isEnabled) {
      classes.push('node-disabled')
    }
  }

  // Check if bypass rule is enabled
  if (node.type === 'bypass-rule') {
    const data = node.data as BypassRuleNodeData
    if (!data.isEnabled) {
      classes.push('node-disabled')
    }
  }

  return classes.join(' ')
}

function getEdgeStyle(edgeType?: string): Record<string, string> {
  switch (edgeType) {
    case 'bypass':
      return { stroke: '#f97316', strokeWidth: '2', strokeDasharray: '5,5' }
    case 'routing':
      return { stroke: '#3b82f6', strokeWidth: '2' }
    case 'response':
      return { stroke: '#10b981', strokeWidth: '1.5' }
    default:
      return { stroke: '#94a3b8', strokeWidth: '1.5' }
  }
}

function onNodeClick(event: { node: { id: string } }) {
  const node = store.nodes.find((n) => n.id === event.node.id)
  if (node) {
    store.selectNode(node.id)
    emit('nodeClick', node.id, node.type)

    // Bypass rule: highlight path and open detail panel
    if (node.type === 'bypass-rule') {
      const data = node.data as BypassRuleNodeData
      store.highlightBypassPath(data.rule.id)
      selectedRule.value = data.rule
      showDetailPanel.value = true
      emit('ruleSelect', data.rule.id)
    }
    // Agent: emit event and clear highlight
    else if (node.type === 'agent') {
      const data = node.data as AgentNodeData
      emit('agentSelect', data.agent.agent_key)
      selectedRule.value = null
      showDetailPanel.value = false
      store.clearHighlight()
    }
    // Other nodes: clear highlight and panel
    else {
      selectedRule.value = null
      showDetailPanel.value = false
      store.clearHighlight()
    }
  }
}

function handleFitView() {
  fitView({ padding: 0.2 })
}

function getDomainColor(domainKey: string | null): string {
  return domainConfig[domainKey || 'global']?.color || '#3b82f6'
}

function getDomainBgColor(domainKey: string | null): string {
  return domainConfig[domainKey || 'global']?.bgColor || '#dbeafe'
}

function getBypassTypeIcon(ruleType: string): string {
  return bypassTypeConfig[ruleType]?.icon || 'pi-filter'
}

function getBypassTypeColor(ruleType: string): string {
  return bypassTypeConfig[ruleType]?.color || '#3b82f6'
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Fetch data on mount
async function fetchData() {
  console.log('[AgentFlowGraph] fetchData called with orgId:', props.organizationId)
  store.setLoading(true)
  store.setError(null)

  try {
    const data = await agentFlowApi.getVisualization(props.organizationId)
    console.log('[AgentFlowGraph] API response:', {
      agents: data.agents?.length,
      bypass_rules: data.bypass_rules?.length,
      is_multi_tenant: data.is_multi_tenant,
      organization_id: data.organization_id
    })
    store.setVisualizationData(data)
    isInitialized.value = true

    // Fit view after data loads
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  } catch (error) {
    console.error('Failed to fetch agent flow data:', error)
    store.setError('Error al cargar datos de visualizacion')
  } finally {
    store.setLoading(false)
  }
}

// Watch for organization changes
watch(
  () => props.organizationId,
  (newOrgId) => {
    console.log('[AgentFlowGraph] organizationId changed:', newOrgId)
    fetchData()
  },
  { immediate: true }
)

// Auto-fit when nodes change
watch(
  () => store.nodes.length,
  () => {
    if (store.nodes.length > 0 && isInitialized.value) {
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    }
  }
)

// Note: fetchData is called via watch with immediate: true
</script>

<template>
  <div class="agent-flow-graph" :style="{ height }">
    <!-- Loading State -->
    <div v-if="store.isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner text-4xl text-blue-500" />
      <p class="text-gray-500 mt-2">Cargando visualizacion...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="error-state">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
      <p class="text-red-500 mt-2">{{ store.error }}</p>
      <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" @click="fetchData">
        Reintentar
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="nodes.length === 0" class="empty-state">
      <i class="pi pi-sitemap text-4xl text-gray-300" />
      <p class="text-gray-400 mt-2">No hay datos de agentes para visualizar</p>
    </div>

    <!-- Vue Flow Graph -->
    <VueFlow
      v-else
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.8, x: 50, y: 50 }"
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
        :node-color="
          (node: any) => {
            if (node.type === 'orchestrator') return '#8b5cf6'
            if (node.type === 'supervisor') return '#64748b'
            if (node.type === 'bypass-rule') return '#f97316'
            if (node.type === 'agent') {
              const data = node.data as AgentNodeData
              return getDomainColor(data?.agent?.domain_key)
            }
            if (node.type === 'message-input') return '#25d366'
            if (node.type === 'end') return '#10b981'
            return '#94a3b8'
          }
        "
      />

      <!-- Custom Node: Message Input -->
      <template #node-message-input="{ data }">
        <div class="custom-node message-input-node">
          <div class="node-icon" style="background-color: #25d366">
            <i class="pi pi-whatsapp text-white" />
          </div>
          <div class="node-content">
            <div class="node-label">{{ data.label }}</div>
            <div v-if="data.description" class="node-description">{{ data.description }}</div>
          </div>
        </div>
      </template>

      <!-- Custom Node: Bypass Group -->
      <template #node-bypass-group="{ data }">
        <div class="custom-node bypass-group-node">
          <div class="node-header" style="background-color: #fff7ed; border-color: #f97316">
            <i class="pi pi-filter" style="color: #f97316" />
            <span class="node-label">{{ data.label }}</span>
            <span class="badge" style="background-color: #f97316">{{ data.enabledCount }}/{{ data.rulesCount }}</span>
          </div>
          <div v-if="data.description" class="node-description px-3 pb-2">{{ data.description }}</div>
        </div>
      </template>

      <!-- Custom Node: Bypass Rule -->
      <template #node-bypass-rule="{ data }">
        <div class="custom-node bypass-rule-node" :class="{ 'node-disabled': !data.isEnabled }">
          <div class="node-header">
            <i :class="['pi', getBypassTypeIcon(data.rule.rule_type)]" :style="{ color: getBypassTypeColor(data.rule.rule_type) }" />
            <span class="node-label">{{ data.label }}</span>
            <span v-if="!data.isEnabled" class="badge badge-disabled">OFF</span>
          </div>

          <!-- Criterios de match -->
          <div class="node-criteria">
            <!-- Para phone_number: mostrar patron -->
            <div v-if="data.rule.rule_type === 'phone_number' && data.rule.pattern" class="criteria-item">
              <i class="pi pi-search text-xs" />
              <span class="criteria-text" :title="data.rule.pattern">{{ truncate(data.rule.pattern, 20) }}</span>
            </div>

            <!-- Para phone_number_list: mostrar cantidad de telefonos -->
            <div v-else-if="data.rule.rule_type === 'phone_number_list' && data.rule.phone_numbers" class="criteria-item">
              <i class="pi pi-list text-xs" />
              <span class="criteria-text">{{ data.rule.phone_numbers.length }} numeros</span>
            </div>

            <!-- Para whatsapp_phone_number_id -->
            <div v-else-if="data.rule.rule_type === 'whatsapp_phone_number_id' && data.rule.phone_number_id" class="criteria-item">
              <i class="pi pi-whatsapp text-xs" />
              <span class="criteria-text" :title="data.rule.phone_number_id">ID: {{ truncate(data.rule.phone_number_id, 12) }}</span>
            </div>

            <!-- Fallback si no hay criterio especifico -->
            <div v-else class="criteria-item">
              <i class="pi pi-info-circle text-xs" />
              <span class="criteria-text">{{ data.rule.description || 'Sin criterio' }}</span>
            </div>
          </div>

          <div class="node-meta">
            <span class="priority-badge">P{{ data.rule.priority }}</span>
            <i class="pi pi-arrow-right text-xs text-gray-400" />
            <span class="target-badge">{{ data.targetAgentName }}</span>
          </div>
        </div>
      </template>

      <!-- Custom Node: Orchestrator -->
      <template #node-orchestrator="{ data }">
        <div class="custom-node orchestrator-node">
          <div class="node-icon orchestrator-icon">
            <i class="pi pi-sitemap text-white" />
          </div>
          <div class="node-content">
            <div class="node-label font-bold">{{ data.label }}</div>
            <div class="node-description">{{ data.description }}</div>
            <div v-if="data.activeIntent" class="intent-badge">
              <i class="pi pi-bolt" />
              {{ data.activeIntent }}
            </div>
          </div>
        </div>
      </template>

      <!-- Custom Node: Supervisor -->
      <template #node-supervisor="{ data }">
        <div class="custom-node supervisor-node">
          <div class="node-icon supervisor-icon">
            <i class="pi pi-eye text-white" />
          </div>
          <div class="node-content">
            <div class="node-label">{{ data.label }}</div>
            <div class="node-description">{{ data.description }}</div>
          </div>
        </div>
      </template>

      <!-- Custom Node: Agent -->
      <template #node-agent="{ data }">
        <div
          class="custom-node agent-node"
          :class="{ 'node-disabled': !data.isEnabled }"
          :style="{ borderLeftColor: data.domainColor }"
        >
          <div class="node-header">
            <i :class="['pi', data.agent.icon || 'pi-android']" :style="{ color: data.domainColor }" />
            <span class="node-label">{{ data.label }}</span>
          </div>
          <div class="node-badges">
            <span v-if="data.agent.requires_pgvector" class="badge badge-rag" title="Requiere RAG">
              <i class="pi pi-database" />
            </span>
            <span v-if="data.agent.requires_external_apis" class="badge badge-api" title="Requiere API externa">
              <i class="pi pi-cloud" />
            </span>
            <span v-if="!data.isEnabled" class="badge badge-disabled">OFF</span>
          </div>
          <div v-if="data.agent.primary_intents?.length" class="node-intents">
            <span v-for="intent in data.agent.primary_intents.slice(0, 2)" :key="intent" class="intent-tag">
              {{ intent }}
            </span>
          </div>
        </div>
      </template>

      <!-- Custom Node: Domain Group -->
      <template #node-domain-group="{ data }">
        <div
          class="custom-node domain-group-node"
          :style="{ borderColor: data.domain.color }"
        >
          <div
            class="domain-header"
            :style="{ backgroundColor: getDomainBgColor(data.domain.domain_key) }"
            @click="store.toggleDomainCollapse(data.domain.domain_key)"
          >
            <i :class="['pi', data.isCollapsed ? 'pi-chevron-right' : 'pi-chevron-down']" />
            <span class="domain-label" :style="{ color: data.domain.color }">{{ data.label }}</span>
            <span class="domain-count">{{ data.enabledCount }}/{{ data.agentCount }}</span>
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

    <!-- Bypass Rule Detail Panel -->
    <BypassRuleDetailPanel
      v-model:visible="showDetailPanel"
      :rule="selectedRule"
      :target-agent-name="selectedRule ? store.agents.find(a => a.agent_key === selectedRule.target_agent)?.display_name : undefined"
      @edit="(ruleId) => emit('ruleSelect', ruleId)"
    />

    <!-- Legend -->
    <div v-if="showLegend && nodes.length > 0" class="graph-legend">
      <div class="legend-title">Leyenda</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #25d366" />
          <span>WhatsApp</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #f97316" />
          <span>Bypass</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #8b5cf6" />
          <span>Orchestrator</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #64748b" />
          <span>Supervisor</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #3b82f6" />
          <span>Agente</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #10b981" />
          <span>Respuesta</span>
        </div>
      </div>
      <div class="legend-badges">
        <span class="badge badge-rag"><i class="pi pi-database" /> RAG</span>
        <span class="badge badge-api"><i class="pi pi-cloud" /> API</span>
      </div>
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

    <!-- Stats Panel -->
    <div v-if="nodes.length > 0" class="stats-panel">
      <div class="stat">
        <span class="stat-value">{{ store.agents.length }}</span>
        <span class="stat-label">Agentes</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ store.enabledAgentsCount }}</span>
        <span class="stat-label">Activos</span>
      </div>
      <div v-if="store.bypassRules.length > 0" class="stat">
        <span class="stat-value">{{ store.bypassRules.length }}</span>
        <span class="stat-label">Bypass</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-flow-graph {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f8fafc;
}

/* Loading/Error/Empty States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* Custom Node Base Styles */
.custom-node {
  padding: 0;
  border-radius: 0.5rem;
  min-width: 160px;
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
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Message Input Node */
.message-input-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
  border-color: #25d366;
}

/* Bypass Group Node */
.bypass-group-node {
  border-color: #f97316;
  border-style: dashed;
  min-width: 180px;
}

.bypass-group-node .node-header {
  border-bottom: 1px dashed #fed7aa;
}

/* Bypass Rule Node */
.bypass-rule-node {
  border-left: 4px solid #f97316;
  min-width: 150px;
}

.bypass-rule-node .node-meta {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem 0.5rem;
  flex-wrap: wrap;
}

.priority-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-weight: 600;
}

.target-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
}

/* Criterios de bypass */
.node-criteria {
  padding: 0.25rem 0.75rem;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
}

.criteria-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: #64748b;
}

.criteria-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

/* Orchestrator Node */
.orchestrator-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  border-color: #8b5cf6;
  min-width: 180px;
}

.orchestrator-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.intent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.5rem;
  padding: 2px 8px;
  background: #8b5cf6;
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
}

/* Supervisor Node */
.supervisor-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #64748b;
}

.supervisor-icon {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

/* Agent Node */
.agent-node {
  border-left: 4px solid #3b82f6;
}

.node-badges {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.75rem 0.25rem;
}

.node-intents {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem 0.5rem;
  flex-wrap: wrap;
}

.intent-tag {
  font-size: 0.6rem;
  padding: 1px 4px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 2px;
}

/* Domain Group Node */
.domain-group-node {
  border: 2px dashed #e2e8f0;
  min-width: 200px;
}

.domain-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 0.375rem;
}

.domain-label {
  font-weight: 600;
  flex: 1;
}

.domain-count {
  font-size: 0.7rem;
  color: #64748b;
}

/* End Node */
.end-node {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #10b981;
}

.end-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
}

.badge-rag {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-api {
  background: #fef3c7;
  color: #92400e;
}

.badge-disabled {
  background: #fee2e2;
  color: #991b1b;
}

/* Node States */
:deep(.node-selected) {
  border-color: #8b5cf6 !important;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3) !important;
}

:deep(.node-highlighted) {
  border-color: #f59e0b !important;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3) !important;
}

:deep(.node-disabled) {
  opacity: 0.5;
}

/* Legend */
.graph-legend {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-width: 200px;
}

.legend-title {
  font-weight: 600;
  font-size: 0.75rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #64748b;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
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

/* Stats Panel */
.stats-panel {
  position: absolute;
  top: 1rem;
  right: 60px;
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.65rem;
  color: #64748b;
}
</style>
