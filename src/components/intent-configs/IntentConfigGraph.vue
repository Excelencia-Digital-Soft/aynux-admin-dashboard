<script setup lang="ts">
/**
 * IntentConfigGraph - Main component for the graph-based intent configuration editor
 *
 * Displays a visual graph: [Domain] → [Intent] → [Agent] → [Keywords]
 * with a detail drawer for editing selected nodes.
 */
import { ref, onMounted, watch } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import type { DomainKey, IntentCreate } from '@/types/domainIntents.types'

import IntentConfigGraphCanvas from './IntentConfigGraphCanvas.vue'
import IntentConfigDetailDrawer from './IntentConfigDetailDrawer.vue'
import { useIntentConfigGraph } from './composables/useIntentConfigGraph'
import type { GraphNodeType } from './types'
import { STATUS_CONFIGS } from './types'

// Props
interface Props {
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '650px'
})

// Composable
const {
  nodes,
  edges,
  selectedNodeId,
  selectedNode,
  highlightedPath,
  filters,
  isLoading,
  error,
  drawerVisible,
  availableDomains,
  stats,
  intentMappings,
  flowAgents,
  keywordMappings,
  fetchAllData,
  selectNode,
  clearSelection,
  setFilter,
  clearFilters,
  createIntent,
  deleteIntent,
  updateIntent,
  createMapping,
  updateMapping,
  deleteMapping,
  addKeywords,
  deleteKeyword,
  updateFlowAgent
} = useIntentConfigGraph()

// ==========================================================================
// Create Intent Dialog State
// ==========================================================================

interface IntentFormData extends IntentCreate {
  is_enabled: boolean
  exact_match: boolean
}

const defaultFormData: IntentFormData = {
  intent_key: '',
  name: '',
  description: '',
  weight: 1.0,
  priority: 50,
  is_enabled: true,
  exact_match: false
}

const showCreateDialog = ref(false)
const savingIntent = ref(false)
const createFormData = ref<IntentFormData>({ ...defaultFormData })

// Get selected domain for creating intent (use filter or first available)
function getSelectedDomainForCreate(): DomainKey | null {
  if (filters.value.domainKey) {
    return filters.value.domainKey as DomainKey
  }
  // If no filter, return first available domain
  if (availableDomains.value.length > 0) {
    return availableDomains.value[0].key as DomainKey
  }
  return null
}

function openCreateIntentDialog() {
  createFormData.value = { ...defaultFormData }
  showCreateDialog.value = true
}

function closeCreateIntentDialog() {
  showCreateDialog.value = false
}

async function handleSaveIntent() {
  const domainKey = getSelectedDomainForCreate()
  if (!domainKey) return

  savingIntent.value = true
  try {
    const data: IntentCreate = {
      intent_key: createFormData.value.intent_key,
      name: createFormData.value.name,
      description: createFormData.value.description || undefined,
      weight: createFormData.value.weight,
      priority: createFormData.value.priority,
      is_enabled: createFormData.value.is_enabled,
      exact_match: createFormData.value.exact_match
    }
    const success = await createIntent(domainKey, data)
    if (success) {
      closeCreateIntentDialog()
    }
  } finally {
    savingIntent.value = false
  }
}

// Status filter options
const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'idle' },
  { label: 'Sin usar', value: 'unused' },
  { label: 'Huérfanos', value: 'orphaned' }
]

// Domain filter options
const domainOptions = [
  { label: 'Todos los dominios', value: null },
  ...availableDomains.value.map(d => ({
    label: d.name,
    value: d.key
  }))
]

// Handle node click
function handleNodeClick(nodeId: string, nodeType: GraphNodeType) {
  selectNode(nodeId)
}

// Handle pane click (deselect)
function handlePaneClick() {
  clearSelection()
}

// Handle drawer close
function handleDrawerClose() {
  drawerVisible.value = false
}

// Handle domain filter change
function handleDomainFilter(domain: string | null) {
  setFilter('domainKey', domain)
}

// Handle status filter change
function handleStatusFilter(status: string) {
  setFilter('status', status as 'all' | 'active' | 'idle' | 'unused' | 'orphaned')
}

// Handle toggle disabled
function handleToggleDisabled() {
  setFilter('showDisabled', !filters.value.showDisabled)
}

// Refresh data
function handleRefresh() {
  fetchAllData()
}

// Lifecycle
onMounted(() => {
  fetchAllData()
})
</script>

<template>
  <div class="intent-config-graph">
    <!-- Header / Toolbar -->
    <div class="graph-toolbar">
      <div class="toolbar-left">
        <h2 class="toolbar-title">
          <i class="pi pi-sitemap" />
          Configuración de Intents
        </h2>
      </div>

      <div class="toolbar-center">
        <!-- Domain Filter -->
        <Select
          v-model="filters.domainKey"
          :options="domainOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Dominio"
          class="filter-select"
          @change="(e) => handleDomainFilter(e.value)"
        />

        <!-- Status Filter -->
        <Select
          v-model="filters.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          class="filter-select"
          @change="(e) => handleStatusFilter(e.value)"
        />

        <!-- Show Disabled Toggle -->
        <Button
          :icon="filters.showDisabled ? 'pi pi-eye' : 'pi pi-eye-slash'"
          :severity="filters.showDisabled ? 'secondary' : 'contrast'"
          text
          @click="handleToggleDisabled"
          v-tooltip="filters.showDisabled ? 'Ocultar deshabilitados' : 'Mostrar deshabilitados'"
        />

        <!-- Clear Filters -->
        <Button
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="clearFilters"
          v-tooltip="'Limpiar filtros'"
        />
      </div>

      <div class="toolbar-right">
        <!-- Create Intent -->
        <Button
          label="Nuevo Intent"
          icon="pi pi-plus"
          severity="success"
          @click="openCreateIntentDialog"
          v-tooltip="'Crear un nuevo intent'"
        />

        <!-- Refresh -->
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          :loading="isLoading"
          @click="handleRefresh"
          v-tooltip="'Actualizar datos'"
        />
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalDomains }}</span>
        <span class="stat-label">Dominios</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalIntents }}</span>
        <span class="stat-label">Intents</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalMappings }}</span>
        <span class="stat-label">Mappings</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalAgents }}</span>
        <span class="stat-label">Agentes</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalKeywords }}</span>
        <span class="stat-label">Keywords</span>
      </div>
      <div class="stat-item flow">
        <span class="stat-value">{{ stats.totalFlowAgents }}</span>
        <span class="stat-label">Flow Agents</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && nodes.length === 0" class="loading-state">
      <ProgressSpinner />
      <p>Cargando configuración de intents...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle" />
      <p>{{ error }}</p>
      <Button label="Reintentar" @click="handleRefresh" />
    </div>

    <!-- Graph Canvas -->
    <IntentConfigGraphCanvas
      v-else
      :nodes="nodes"
      :edges="edges"
      :selected-node-id="selectedNodeId"
      :highlighted-path="highlightedPath"
      :height="height"
      @node-click="handleNodeClick"
      @pane-click="handlePaneClick"
    />

    <!-- Legend -->
    <div v-if="nodes.length > 0" class="graph-legend">
      <div class="legend-title">Leyenda</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-dot domain" />
          <span>Dominio</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot intent" />
          <span>Intent</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot agent" />
          <span>Agente</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot keyword" />
          <span>Keywords</span>
        </div>
      </div>
      <div class="legend-status">
        <Tag
          v-for="(config, status) in STATUS_CONFIGS"
          :key="status"
          :value="config.label"
          :style="{ backgroundColor: config.bgColor, color: config.color }"
          class="status-tag"
        />
      </div>
    </div>

    <!-- Detail Drawer -->
    <IntentConfigDetailDrawer
      v-model:visible="drawerVisible"
      :selected-node="selectedNode"
      :intent-mappings="intentMappings"
      :flow-agents="flowAgents"
      :keyword-mappings="keywordMappings"
      @close="handleDrawerClose"
      @update-intent="updateIntent"
      @delete-intent="deleteIntent"
      @create-mapping="createMapping"
      @update-mapping="updateMapping"
      @delete-mapping="deleteMapping"
      @add-keywords="addKeywords"
      @delete-keyword="deleteKeyword"
      @update-flow-agent="updateFlowAgent"
      @refresh="handleRefresh"
    />

    <!-- Create Intent Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Nuevo Intent"
      :modal="true"
      :style="{ width: '500px' }"
      class="intent-create-dialog"
    >
      <div class="dialog-content">
        <!-- Domain Info -->
        <div class="domain-info">
          <i class="pi pi-info-circle" />
          <span>
            El intent se creará en el dominio:
            <strong>{{ filters.domainKey || availableDomains[0]?.name || 'Sin dominio' }}</strong>
          </span>
        </div>

        <div class="field">
          <label for="intent_key">Intent Key *</label>
          <InputText
            id="intent_key"
            v-model="createFormData.intent_key"
            placeholder="ej: check_stock, request_price"
            class="w-full"
          />
          <small class="text-muted">Identificador único del intent (snake_case)</small>
        </div>

        <div class="field">
          <label for="name">Nombre *</label>
          <InputText
            id="name"
            v-model="createFormData.name"
            placeholder="ej: Consulta de Stock"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="description">Descripción</label>
          <Textarea
            id="description"
            v-model="createFormData.description"
            rows="3"
            placeholder="Descripción del intent y cuándo se activa"
            class="w-full"
          />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="weight">Peso</label>
            <InputNumber
              id="weight"
              v-model="createFormData.weight"
              :min="0"
              :max="9.99"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
          <div class="field">
            <label for="priority">Prioridad</label>
            <InputNumber
              id="priority"
              v-model="createFormData.priority"
              :min="0"
              :max="100"
              class="w-full"
            />
          </div>
        </div>

        <div class="field-row">
          <div class="field checkbox-field">
            <Checkbox v-model="createFormData.is_enabled" :binary="true" inputId="is_enabled" />
            <label for="is_enabled">Activo</label>
          </div>
          <div class="field checkbox-field">
            <Checkbox v-model="createFormData.exact_match" :binary="true" inputId="exact_match" />
            <label for="exact_match">Match Exacto</label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="closeCreateIntentDialog" />
        <Button
          label="Crear Intent"
          icon="pi pi-check"
          @click="handleSaveIntent"
          :loading="savingIntent"
          :disabled="!createFormData.intent_key || !createFormData.name"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.intent-config-graph {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Toolbar */
.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-title i {
  color: var(--primary-color);
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  width: 160px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.stat-item.flow .stat-value {
  color: #f59e0b;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: var(--text-color-secondary);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: var(--red-500);
}

.error-state i {
  font-size: 3rem;
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
  gap: 0.75rem;
  margin-bottom: 0.5rem;
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
  border-radius: 2px;
}

.legend-dot.domain {
  background: #10b981;
}

.legend-dot.intent {
  background: #3b82f6;
}

.legend-dot.agent {
  background: #8b5cf6;
}

.legend-dot.keyword {
  background: #94a3b8;
}

.legend-status {
  display: flex;
  gap: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.status-tag {
  font-size: 0.6rem;
  padding: 2px 6px;
}

/* Create Intent Dialog */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.domain-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.domain-info i {
  color: var(--primary-color);
}

.domain-info strong {
  color: var(--text-color);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-weight: 500;
  font-size: 0.875rem;
}

.field .text-muted {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field {
  flex: 1;
}

.checkbox-field {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;
}
</style>
