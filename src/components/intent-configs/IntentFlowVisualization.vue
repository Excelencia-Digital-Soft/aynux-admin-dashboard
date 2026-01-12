<template>
  <div class="intent-flow-visualization">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-info">
        <h3>Flujo de Routing</h3>
        <p class="text-muted">
          Visualiza cómo los intents se mapean a agentes
        </p>
      </div>
      <div class="header-actions">
        <SelectButton
          v-model="viewMode"
          :options="viewModeOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          @click="handleRefresh"
          :loading="loading"
          v-tooltip="'Refrescar'"
        />
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="stats-bar">
      <div class="stat-item">
        <i class="pi pi-comments"></i>
        <span class="stat-value">{{ stats.intents }}</span>
        <span class="stat-label">Intents</span>
      </div>
      <div class="stat-item">
        <i class="pi pi-android"></i>
        <span class="stat-value">{{ stats.agents }}</span>
        <span class="stat-label">Agentes</span>
      </div>
      <div class="stat-item flow">
        <i class="pi pi-sitemap"></i>
        <span class="stat-value">{{ stats.flowAgents }}</span>
        <span class="stat-label">Flow Agents</span>
      </div>
      <div class="stat-item">
        <i class="pi pi-tag"></i>
        <span class="stat-value">{{ stats.keywords }}</span>
        <span class="stat-label">Keywords</span>
      </div>
    </div>

    <!-- Flow Diagram View -->
    <div v-if="viewMode === 'flow'" class="flow-diagram">
      <!-- Flow Legend -->
      <div class="flow-legend">
        <div class="legend-item">
          <div class="legend-dot intent"></div>
          <span>Intent</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot agent"></div>
          <span>Agente</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot flow-agent"></div>
          <span>Flow Agent</span>
        </div>
        <div class="legend-arrow">
          <svg width="30" height="10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="var(--primary-color)" stroke-width="2"/>
            <polygon points="20,0 30,5 20,10" fill="var(--primary-color)"/>
          </svg>
          <span>Mapeo</span>
        </div>
      </div>

      <!-- Flow Columns -->
      <div class="flow-columns">
        <!-- Intents Column -->
        <div class="flow-column intents-column">
          <div class="column-header">
            <i class="pi pi-comments"></i>
            <span>Intents Detectados</span>
          </div>
          <div class="column-content">
            <div
              v-for="mapping in mappings"
              :key="mapping.id"
              class="intent-card"
              :class="{ 'selected': selectedMapping?.id === mapping.id }"
              @click="selectMapping(mapping)"
            >
              <div class="intent-name">{{ formatIntentName(mapping.intent_key) }}</div>
              <div class="intent-key">{{ mapping.intent_key }}</div>
              <div v-if="mapping.priority !== 50" class="intent-priority">
                P{{ mapping.priority }}
              </div>
            </div>
            <div v-if="!mappings.length" class="empty-column">
              <i class="pi pi-inbox"></i>
              <span>Sin mappings</span>
            </div>
          </div>
        </div>

        <!-- Connection Lines -->
        <div class="flow-connections">
          <svg class="connection-svg" ref="connectionsSvg">
            <!-- Lines will be drawn here -->
          </svg>
        </div>

        <!-- Agents Column -->
        <div class="flow-column agents-column">
          <div class="column-header">
            <i class="pi pi-android"></i>
            <span>Agentes Destino</span>
          </div>
          <div class="column-content">
            <div
              v-for="agent in uniqueAgents"
              :key="agent.key"
              class="agent-card"
              :class="{
                'flow-agent': agent.isFlow,
                'selected': selectedAgent?.key === agent.key
              }"
              @click="selectAgent(agent)"
            >
              <div class="agent-header">
                <div class="agent-name">{{ formatAgentName(agent.key) }}</div>
                <div class="agent-badges">
                  <Tag v-if="agent.isFlow" value="FLOW" severity="warning" />
                  <Tag :value="`${agent.intentCount} intent${agent.intentCount > 1 ? 's' : ''}`" severity="info" />
                </div>
              </div>
              <div class="agent-key">{{ agent.key }}</div>
              <div v-if="agent.keywordCount > 0" class="agent-keywords">
                <i class="pi pi-tag"></i>
                {{ agent.keywordCount }} keywords de fallback
              </div>
            </div>
            <div v-if="!uniqueAgents.length" class="empty-column">
              <i class="pi pi-inbox"></i>
              <span>Sin agentes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Details -->
      <transition name="slide-up">
        <div v-if="selectedMapping || selectedAgent" class="selection-details">
          <div class="details-header">
            <h4>
              <i :class="selectedMapping ? 'pi pi-comments' : 'pi pi-android'"></i>
              {{ selectedMapping ? formatIntentName(selectedMapping.intent_key) : formatAgentName(selectedAgent!.key) }}
            </h4>
            <Button icon="pi pi-times" text rounded @click="clearSelection" />
          </div>
          <div class="details-content">
            <template v-if="selectedMapping">
              <div class="detail-row">
                <span class="detail-label">Intent Key</span>
                <code>{{ selectedMapping.intent_key }}</code>
              </div>
              <div class="detail-row">
                <span class="detail-label">Agente Destino</span>
                <Tag :value="formatAgentName(selectedMapping.agent_key)" severity="success" />
              </div>
              <div class="detail-row">
                <span class="detail-label">Prioridad</span>
                <span>{{ selectedMapping.priority }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estado</span>
                <Tag :value="selectedMapping.is_enabled ? 'Activo' : 'Inactivo'" :severity="selectedMapping.is_enabled ? 'success' : 'danger'" />
              </div>
            </template>
            <template v-else-if="selectedAgent">
              <div class="detail-row">
                <span class="detail-label">Agent Key</span>
                <code>{{ selectedAgent.key }}</code>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tipo</span>
                <Tag :value="selectedAgent.isFlow ? 'Flow Agent' : 'Agente Normal'" :severity="selectedAgent.isFlow ? 'warning' : 'info'" />
              </div>
              <div class="detail-row">
                <span class="detail-label">Intents Mapeados</span>
                <div class="intent-tags">
                  <Tag
                    v-for="intent in getIntentsForAgent(selectedAgent.key)"
                    :key="intent"
                    :value="intent"
                    severity="secondary"
                  />
                </div>
              </div>
              <div v-if="selectedAgent.keywordCount > 0" class="detail-row">
                <span class="detail-label">Keywords</span>
                <div class="keyword-chips">
                  <Chip
                    v-for="kw in getKeywordsForAgent(selectedAgent.key)"
                    :key="kw.id"
                    :label="kw.keyword"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </div>

    <!-- Table View -->
    <div v-else class="table-view">
      <DataTable
        :value="mappings"
        :loading="loading"
        stripedRows
        showGridlines
        size="small"
        class="mappings-table"
      >
        <Column field="intent_key" header="Intent" sortable>
          <template #body="{ data }">
            <div class="intent-cell">
              <i class="pi pi-comments"></i>
              <div>
                <div class="intent-name">{{ formatIntentName(data.intent_key) }}</div>
                <code class="intent-key">{{ data.intent_key }}</code>
              </div>
            </div>
          </template>
        </Column>
        <Column header="" style="width: 60px; text-align: center;">
          <template #body>
            <i class="pi pi-arrow-right" style="color: var(--primary-color)"></i>
          </template>
        </Column>
        <Column field="agent_key" header="Agente" sortable>
          <template #body="{ data }">
            <div class="agent-cell">
              <i class="pi pi-android"></i>
              <div>
                <div class="agent-name">{{ formatAgentName(data.agent_key) }}</div>
                <code class="agent-key">{{ data.agent_key }}</code>
              </div>
              <Tag v-if="isFlowAgent(data.agent_key)" value="FLOW" severity="warning" />
            </div>
          </template>
        </Column>
        <Column field="priority" header="Prioridad" sortable style="width: 100px; text-align: center;">
          <template #body="{ data }">
            <Tag :value="`P${data.priority}`" :severity="data.priority < 50 ? 'danger' : data.priority > 50 ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column field="is_enabled" header="Estado" style="width: 100px; text-align: center;">
          <template #body="{ data }">
            <Tag :value="data.is_enabled ? 'Activo' : 'Inactivo'" :severity="data.is_enabled ? 'success' : 'danger'" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !mappings.length" class="empty-state">
      <i class="pi pi-sitemap"></i>
      <h4>No hay mappings configurados</h4>
      <p>Los mappings definen cómo los intents se routean a agentes</p>
      <Button label="Ir a Agent Mappings" icon="pi pi-arrow-right" @click="$emit('goToMappings')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import SelectButton from 'primevue/selectbutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type { IntentAgentMapping, FlowAgentConfig, KeywordAgentMapping } from '@/types/intentConfigs.types'

// Emits
defineEmits(['goToMappings'])

// Composables
const authStore = useAuthStore()
const {
  intentMappings: mappings,
  flowAgents,
  keywordMappings: keywords,
  loading,
  fetchIntentMappings,
  fetchFlowAgents,
  fetchKeywords
} = useIntentConfig()

// State
const viewMode = ref<'flow' | 'table'>('flow')
const selectedMapping = ref<IntentAgentMapping | null>(null)
const selectedAgent = ref<{ key: string; isFlow: boolean; intentCount: number; keywordCount: number } | null>(null)
const connectionsSvg = ref<SVGSVGElement | null>(null)

// Options
const viewModeOptions = [
  { label: 'Flujo', value: 'flow', icon: 'pi pi-sitemap' },
  { label: 'Tabla', value: 'table', icon: 'pi pi-table' }
]

// Computed
const organizationId = computed(() => authStore.currentOrgId)

const stats = computed(() => ({
  intents: mappings.value.length,
  agents: uniqueAgents.value.length,
  flowAgents: flowAgents.value.filter(f => f.is_flow_agent).length,
  keywords: keywords.value.length
}))

const uniqueAgents = computed(() => {
  const agentMap = new Map<string, { key: string; isFlow: boolean; intentCount: number; keywordCount: number }>()

  // Count intents per agent
  for (const mapping of mappings.value) {
    const existing = agentMap.get(mapping.agent_key)
    if (existing) {
      existing.intentCount++
    } else {
      agentMap.set(mapping.agent_key, {
        key: mapping.agent_key,
        isFlow: isFlowAgent(mapping.agent_key),
        intentCount: 1,
        keywordCount: getKeywordCountForAgent(mapping.agent_key)
      })
    }
  }

  // Add flow agents that might not have mappings
  for (const fa of flowAgents.value) {
    if (!agentMap.has(fa.agent_key)) {
      agentMap.set(fa.agent_key, {
        key: fa.agent_key,
        isFlow: fa.is_flow_agent,
        intentCount: 0,
        keywordCount: getKeywordCountForAgent(fa.agent_key)
      })
    }
  }

  return Array.from(agentMap.values()).sort((a, b) => b.intentCount - a.intentCount)
})

// Helpers
function formatIntentName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function formatAgentName(key: string): string {
  return key
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function isFlowAgent(agentKey: string): boolean {
  return flowAgents.value.some(fa => fa.agent_key === agentKey && fa.is_flow_agent)
}

function getKeywordCountForAgent(agentKey: string): number {
  return keywords.value.filter((k: KeywordAgentMapping) => k.agent_key === agentKey).length
}

function getIntentsForAgent(agentKey: string): string[] {
  return mappings.value
    .filter((m: IntentAgentMapping) => m.agent_key === agentKey)
    .map((m: IntentAgentMapping) => m.intent_key)
}

function getKeywordsForAgent(agentKey: string): KeywordAgentMapping[] {
  return keywords.value.filter((k: KeywordAgentMapping) => k.agent_key === agentKey).slice(0, 10)
}

function selectMapping(mapping: IntentAgentMapping) {
  selectedAgent.value = null
  selectedMapping.value = selectedMapping.value?.id === mapping.id ? null : mapping
}

function selectAgent(agent: { key: string; isFlow: boolean; intentCount: number; keywordCount: number }) {
  selectedMapping.value = null
  selectedAgent.value = selectedAgent.value?.key === agent.key ? null : agent
}

function clearSelection() {
  selectedMapping.value = null
  selectedAgent.value = null
}

async function handleRefresh() {
  await Promise.all([
    fetchIntentMappings(),
    fetchFlowAgents(),
    fetchKeywords()
  ])
}

async function loadData() {
  if (!organizationId.value) return
  await handleRefresh()
}

// Lifecycle
onMounted(() => {
  loadData()
})

watch(organizationId, () => {
  loadData()
})

// Expose
defineExpose({
  refresh: handleRefresh
})
</script>

<style scoped>
.intent-flow-visualization {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.header-info .text-muted {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.stat-item i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.stat-item.flow i {
  color: var(--yellow-500);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

/* Flow Diagram */
.flow-diagram {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.flow-legend {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  font-size: 0.875rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.intent {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.legend-dot.agent {
  background: linear-gradient(135deg, #34d399, #10b981);
}

.legend-dot.flow-agent {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.legend-arrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Flow Columns */
.flow-columns {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 0;
  min-height: 400px;
}

.flow-column {
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-100);
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  font-size: 0.875rem;
}

.column-header i {
  color: var(--primary-color);
}

.column-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0 0 8px 8px;
  overflow-y: auto;
  max-height: 500px;
}

/* Intent Card */
.intent-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.intent-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.intent-card.selected {
  box-shadow: 0 0 0 3px var(--primary-color), 0 4px 12px rgba(59, 130, 246, 0.3);
}

.intent-card .intent-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.intent-card .intent-key {
  font-size: 0.75rem;
  opacity: 0.8;
  font-family: monospace;
}

.intent-card .intent-priority {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

/* Agent Card */
.agent-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-card:hover {
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.agent-card.selected {
  box-shadow: 0 0 0 3px var(--primary-color), 0 4px 12px rgba(16, 185, 129, 0.3);
}

.agent-card.flow-agent {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1f2937;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.agent-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.agent-badges {
  display: flex;
  gap: 0.25rem;
}

.agent-key {
  font-size: 0.75rem;
  opacity: 0.8;
  font-family: monospace;
}

.agent-keywords {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.9;
}

/* Flow Connections */
.flow-connections {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  position: relative;
}

.flow-connections::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--green-500));
  opacity: 0.3;
}

.flow-connections::after {
  content: '→';
  font-size: 1.5rem;
  color: var(--primary-color);
  background: var(--surface-ground);
  padding: 0.5rem;
  z-index: 1;
}

/* Empty Column */
.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  gap: 0.5rem;
}

.empty-column i {
  font-size: 2rem;
  opacity: 0.5;
}

/* Selection Details */
.selection-details {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface-100);
  border-bottom: 1px solid var(--surface-border);
}

.details-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.details-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.detail-row code {
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.intent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.keyword-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Table View */
.table-view {
  background: var(--surface-card);
  border-radius: 8px;
  overflow: hidden;
}

.intent-cell,
.agent-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.intent-cell i,
.agent-cell i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.agent-cell i {
  color: var(--green-500);
}

.intent-cell .intent-name,
.agent-cell .agent-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.intent-cell .intent-key,
.agent-cell .agent-key {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: var(--surface-ground);
  border-radius: 8px;
}

.empty-state i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  opacity: 0.3;
  margin-bottom: 1rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: var(--text-color-secondary);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
