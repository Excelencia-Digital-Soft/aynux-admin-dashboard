<script setup lang="ts">
/**
 * IntentConfigGraph - Main component for the LangGraph topology editor
 *
 * Displays the real LangGraph topology (graph_v2.py):
 * START → ROUTER → [action nodes] → RESPONSE_FORMATTER → END
 * with a detail drawer for editing selected node configurations.
 */
import { onMounted, ref, watch } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

import IntentConfigGraphCanvas from './IntentConfigGraphCanvas.vue'
import IntentConfigDetailDrawer from './IntentConfigDetailDrawer.vue'
import { useIntentConfigGraph } from './composables/useIntentConfigGraph'
import { DOMAIN_CONFIGS } from './types'
import { graphTopologyApi } from '@/api/graphTopology.api'
import type { InstitutionConfigSummary } from '@/types/graphTopology.types'

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
  drawerVisible,
  domainKey,
  availableDomains,
  isLoading,
  error,
  stats,
  fetchTopology,
  selectNode,
  clearSelection,
  setDomain,
  updateRoutingConfig,
  updateAwaitingTypeConfig
} = useIntentConfigGraph()

// Domain options for the dropdown
const domainOptions = Object.values(DOMAIN_CONFIGS).map((d) => ({
  label: d.displayName,
  value: d.key
}))

// Linked institution configs
const linkedConfigs = ref<InstitutionConfigSummary[]>([])

async function fetchLinkedConfigs() {
  if (!domainKey.value) {
    linkedConfigs.value = []
    return
  }
  try {
    linkedConfigs.value = await graphTopologyApi.getDomainInstitutionConfigs(domainKey.value)
  } catch {
    linkedConfigs.value = []
  }
}

watch(domainKey, () => {
  fetchLinkedConfigs()
})

// Handle node click
function handleNodeClick(nodeId: string) {
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

// Handle domain change
function handleDomainChange(event: { value: string }) {
  setDomain(event.value)
}

// Handle config toggle from panels
function handleToggleRoutingConfig(configId: string, enabled: boolean) {
  updateRoutingConfig(configId, { is_enabled: enabled })
}

function handleToggleAwaitingConfig(configId: string, enabled: boolean) {
  updateAwaitingTypeConfig(configId, { is_enabled: enabled })
}

// Handle generic routing config update (clears_context, metadata, etc.)
function handleUpdateRoutingConfig(configId: string, updates: Record<string, unknown>) {
  updateRoutingConfig(configId, updates)
}

// Refresh
function handleRefresh() {
  fetchTopology()
}

// Lifecycle
onMounted(() => {
  fetchTopology()
  fetchLinkedConfigs()
})
</script>

<template>
  <div class="topology-graph">
    <!-- Header / Toolbar -->
    <div class="graph-toolbar">
      <div class="toolbar-left">
        <h2 class="toolbar-title">
          <i class="pi pi-share-alt" />
          LangGraph Topology
        </h2>
      </div>

      <div class="toolbar-center">
        <!-- Domain Selector -->
        <Select
          :modelValue="domainKey"
          :options="domainOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Dominio"
          class="domain-select"
          @change="handleDomainChange"
        />
      </div>

      <div class="toolbar-right">
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
        <span class="stat-value">{{ stats.nodes }}</span>
        <span class="stat-label">Nodos</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.edges }}</span>
        <span class="stat-label">Conexiones</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.routingConfigs }}</span>
        <span class="stat-label">Routing</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.awaitingTypes }}</span>
        <span class="stat-label">Awaiting</span>
      </div>
    </div>

    <!-- Linked Institution Configs -->
    <div v-if="linkedConfigs.length > 0" class="linked-configs-bar">
      <span class="linked-configs-label">
        <i class="pi pi-building" />
        Instituciones vinculadas:
      </span>
      <div class="linked-configs-list">
        <Tag
          v-for="cfg in linkedConfigs"
          :key="cfg.id"
          :severity="cfg.enabled ? 'success' : 'secondary'"
          :value="cfg.institution_name"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && nodes.length === 0" class="loading-state">
      <ProgressSpinner />
      <p>Cargando topologia del grafo...</p>
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
      :height="height"
      @node-click="handleNodeClick"
      @pane-click="handlePaneClick"
    />

    <!-- Legend -->
    <div v-if="nodes.length > 0" class="graph-legend">
      <div class="legend-title">Leyenda</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-dot" style="background: #10b981" />
          <span>Terminal</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #8b5cf6" />
          <span>Supervisor</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #3b82f6" />
          <span>Action</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #a855f7" />
          <span>Formatter</span>
        </div>
      </div>
      <div class="legend-edges">
        <div class="legend-item">
          <span class="legend-line solid" />
          <span>Directo</span>
        </div>
        <div class="legend-item">
          <span class="legend-line dashed" />
          <span>Condicional</span>
        </div>
      </div>
    </div>

    <!-- Detail Drawer -->
    <IntentConfigDetailDrawer
      v-model:visible="drawerVisible"
      :selected-node="selectedNode"
      :domain-key="domainKey"
      @close="handleDrawerClose"
      @toggle-routing-config="handleToggleRoutingConfig"
      @toggle-awaiting-config="handleToggleAwaitingConfig"
      @update-routing-config="handleUpdateRoutingConfig"
    />
  </div>
</template>

<style scoped>
.topology-graph {
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

.domain-select {
  width: 180px;
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

/* Linked Institution Configs */
.linked-configs-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
  flex-wrap: wrap;
}

.linked-configs-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

.linked-configs-list {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
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
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.legend-title {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-color);
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
  color: var(--text-color-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-edges {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.375rem;
  border-top: 1px solid var(--surface-border);
}

.legend-line {
  display: inline-block;
  width: 20px;
  height: 2px;
}

.legend-line.solid {
  background: #64748b;
}

.legend-line.dashed {
  background: repeating-linear-gradient(
    90deg,
    #8b5cf6,
    #8b5cf6 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Dark mode legend */
:root.dark .graph-legend,
.dark-mode .graph-legend,
[data-theme="dark"] .graph-legend {
  background: #1e293b;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}
</style>
