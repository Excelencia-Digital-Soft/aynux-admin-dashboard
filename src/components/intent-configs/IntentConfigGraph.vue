<script setup lang="ts">
/**
 * IntentConfigGraph - Main component for the LangGraph topology editor
 *
 * Displays the real LangGraph topology (graph_v2.py):
 * START → ROUTER → [action nodes] → RESPONSE_FORMATTER → END
 * with a detail drawer for editing selected node configurations.
 */
import { onMounted, ref, watch, type Ref } from 'vue'
import { RefreshCw, X } from 'lucide-vue-next'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'

import IntentConfigGraphCanvas from './IntentConfigGraphCanvas.vue'
import IntentConfigDetailDrawer from './IntentConfigDetailDrawer.vue'
import { useIntentConfigGraph } from './composables/useIntentConfigGraph'
import { DOMAIN_CONFIGS } from './types'
import { EDGE_TYPE_COLORS } from './utils/graphLayout'
import { graphTopologyApi } from '@/api/graphTopology.api'
import type { GraphTopologyResponse, InstitutionConfigSummary } from '@/types/graphTopology.types'
import type { RoutingConfigCreate } from '@/types/routingConfigs.types'

// Props
interface Props {
  height?: string
  highlightedNodeId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  height: '650px',
  highlightedNodeId: null,
})

// Emits
const emit = defineEmits<{
  (e: 'domainChange', domain: string): void
  (e: 'topologyLoaded', topology: GraphTopologyResponse): void
  (e: 'nodeSelect', nodeId: string | null): void
}>()

// Composable
const {
  nodes,
  edges,
  topology,
  selectedNodeId,
  selectedNode,
  drawerVisible,
  showCreateForm,
  availableNodes,
  domainKey,
  availableDomains,
  isLoading,
  error,
  stats,
  totalIssues,
  dependencyHighlightNodes,
  dependencyHighlightEdges,
  fetchTopology,
  selectNode,
  clearSelection,
  setDomain,
  updateRoutingConfig,
  updateAwaitingTypeConfig,
  createRoutingConfig,
  deleteRoutingConfig,
  openCreateForm,
  highlightDependency
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

// Emit topology and selection changes to parent
watch(topology, (val) => {
  if (val) emit('topologyLoaded', val)
}, { immediate: true })

watch(selectedNodeId, (val) => {
  emit('nodeSelect', val ?? null)
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
  showCreateForm.value = false
}

// Handle domain change
function handleDomainChange(value: string) {
  setDomain(value)
  emit('domainChange', value)
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

// Handle create routing config
function handleCreateRoutingConfig(data: RoutingConfigCreate) {
  createRoutingConfig(data)
}

// Handle delete routing config
function handleDeleteRoutingConfig(configId: string) {
  deleteRoutingConfig(configId)
}

// Handle add-config from node "+" button
function handleNodeAddConfig(nodeId: string) {
  openCreateForm(nodeId)
}

// Handle showCreateForm toggle
function handleShowCreateFormUpdate(value: boolean) {
  showCreateForm.value = value
}

// Refresh
function handleRefresh() {
  fetchTopology()
}

// Welcome banner
const WELCOME_STORAGE_KEY = 'topology-welcome-dismissed'
const welcomeDismissed = ref(localStorage.getItem(WELCOME_STORAGE_KEY) === 'true')

function dismissWelcome() {
  welcomeDismissed.value = true
  localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
}

// Lifecycle
onMounted(() => {
  fetchTopology()
  fetchLinkedConfigs()
  emit('domainChange', domainKey.value)
})
</script>

<template>
  <div class="topology-graph">
    <!-- Header / Toolbar -->
    <div class="graph-toolbar glass-card">
      <div class="toolbar-left">
        <h2 class="toolbar-title">
          <i class="pi pi-share-alt" />
          Flujo del Chatbot
        </h2>
      </div>

      <div class="toolbar-center">
        <!-- Domain Selector -->
        <Select :model-value="domainKey" @update:model-value="handleDomainChange">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Dominio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in domainOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="toolbar-right">
        <!-- Refresh -->
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" :disabled="isLoading" @click="handleRefresh">
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actualizar datos</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar glass-panel">
      <div class="stat-item">
        <span class="stat-value">{{ stats.nodes }}</span>
        <span class="stat-label">Pasos</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.edges }}</span>
        <span class="stat-label">Conexiones</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.routingConfigs }}</span>
        <span class="stat-label">Reglas</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.awaitingTypes }}</span>
        <span class="stat-label">Esperando</span>
      </div>
      <div v-if="totalIssues.total > 0" class="stat-item stat-issues" :class="{ 'stat-critical': totalIssues.critical > 0 }">
        <span class="stat-value">{{ totalIssues.total }}</span>
        <span class="stat-label">{{ totalIssues.critical > 0 ? 'Errores' : 'Avisos' }}</span>
      </div>
    </div>

    <!-- Linked Institution Configs -->
    <div v-if="linkedConfigs.length > 0" class="linked-configs-bar glass-panel">
      <span class="linked-configs-label">
        <i class="pi pi-building" />
        Instituciones vinculadas:
      </span>
      <div class="linked-configs-list">
        <Badge
          v-for="cfg in linkedConfigs"
          :key="cfg.id"
          :variant="cfg.enabled ? 'success' : 'secondary'"
        >
          {{ cfg.institution_name }}
        </Badge>
      </div>
    </div>

    <!-- Welcome Banner -->
    <Alert v-if="!welcomeDismissed" class="welcome-banner">
      <AlertDescription class="flex items-center justify-between gap-2">
        <span>
          Este es el flujo de conversación de tu chatbot de WhatsApp. Cada caja representa un paso del proceso. Hacé clic en cualquier paso para ver y editar sus reglas.
        </span>
        <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0" @click="dismissWelcome">
          <X class="h-3.5 w-3.5" />
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <div v-if="isLoading && nodes.length === 0" class="loading-state">
      <Spinner size="lg" />
      <p>Cargando el flujo del chatbot...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle" />
      <p>{{ error }}</p>
      <Button @click="handleRefresh">Reintentar</Button>
    </div>

    <!-- Graph Canvas -->
    <IntentConfigGraphCanvas
      v-else
      :nodes="nodes"
      :edges="edges"
      :selected-node-id="selectedNodeId"
      :highlighted-node-id="highlightedNodeId"
      :dependency-highlight-nodes="dependencyHighlightNodes"
      :dependency-highlight-edges="dependencyHighlightEdges"
      :height="height"
      @node-click="handleNodeClick"
      @pane-click="handlePaneClick"
      @add-config="handleNodeAddConfig"
    />

    <!-- Legend -->
    <div v-if="nodes.length > 0" class="graph-legend glass-card">
      <div class="legend-title">Leyenda</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-dot" style="background: #10b981" />
          <span>Inicio / Fin</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #8b5cf6" />
          <span>Distribuidor</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #3b82f6" />
          <span>Acción</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #a855f7" />
          <span>Formateador</span>
        </div>
      </div>
      <div class="legend-edges">
        <div class="legend-item">
          <span class="legend-line solid" />
          <span>Directo</span>
        </div>
        <div
          v-for="(cfg, key) in EDGE_TYPE_COLORS"
          :key="key"
          class="legend-item"
        >
          <span
            class="legend-line"
            :class="{ dashed: cfg.dashed }"
            :style="{ background: cfg.dashed ? undefined : cfg.stroke, '--dash-color': cfg.stroke }"
          />
          <span>{{ cfg.label }}</span>
        </div>
      </div>
    </div>

    <!-- Detail Drawer -->
    <IntentConfigDetailDrawer
      v-model:visible="drawerVisible"
      :selected-node="selectedNode"
      :domain-key="domainKey"
      :show-create-form="showCreateForm"
      :available-nodes="availableNodes"
      @close="handleDrawerClose"
      @toggle-routing-config="handleToggleRoutingConfig"
      @toggle-awaiting-config="handleToggleAwaitingConfig"
      @update-routing-config="handleUpdateRoutingConfig"
      @create-routing-config="handleCreateRoutingConfig"
      @delete-routing-config="handleDeleteRoutingConfig"
      @update:show-create-form="handleShowCreateFormUpdate"
      @highlight-dependency="highlightDependency"
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
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-title i {
  color: hsl(var(--primary));
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-issues .stat-value {
  color: #eab308;
}

.stat-critical .stat-value {
  color: #ef4444;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.stat-label {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
}

/* Linked Institution Configs */
.linked-configs-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  flex-wrap: wrap;
}

.linked-configs-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
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

/* Welcome Banner */
.welcome-banner {
  font-size: 0.8rem;
  line-height: 1.4;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: hsl(var(--muted-foreground));
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: hsl(var(--destructive));
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
  z-index: 10;
}

.legend-title {
  font-weight: 600;
  font-size: 0.75rem;
  color: hsl(var(--foreground));
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
  color: hsl(var(--muted-foreground));
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
  border-top: 1px solid hsl(var(--border));
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
    var(--dash-color, #8b5cf6),
    var(--dash-color, #8b5cf6) 4px,
    transparent 4px,
    transparent 8px
  );
}
</style>
