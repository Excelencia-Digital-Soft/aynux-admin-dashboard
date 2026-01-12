<template>
  <div class="intent-configs-page">
    <!-- Header with Domain Selector -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="pi pi-cog mr-2"></i>
          Gestión de Intents y Respuestas
        </h1>
        <p class="text-muted">Configura intents de detección y respuestas por dominio</p>
      </div>
      <div class="header-right">
        <!-- Domain Selector (only for tabs 0-1 that use domain filtering) -->
        <Select
          v-if="['0', '1'].includes(activeTab)"
          v-model="selectedDomain"
          :options="availableDomains"
          optionLabel="name"
          optionValue="key"
          placeholder="Seleccionar Dominio"
          class="domain-selector"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="domain-option">
              <i :class="getDomainIcon(slotProps.value)" :style="{ color: getDomainColor(slotProps.value) }"></i>
              <span>{{ getDomainName(slotProps.value) }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
          <template #option="slotProps">
            <div class="domain-option">
              <i :class="slotProps.option.icon" :style="{ color: slotProps.option.color }"></i>
              <span>{{ slotProps.option.name }}</span>
            </div>
          </template>
        </Select>

        <!-- Organization indicator for tabs 2-6 -->
        <div v-if="!['0', '1'].includes(activeTab)" class="org-indicator">
          <i class="pi pi-building"></i>
          <span>{{ authStore.currentOrganization?.name || 'Organización actual' }}</span>
        </div>

        <!-- Action buttons based on active tab -->
        <template v-if="activeTab === '0'">
          <Button
            label="Nuevo Intent"
            icon="pi pi-plus"
            severity="success"
            @click="intentsPanel?.openCreateDialog()"
            :disabled="!selectedDomain"
          />
        </template>
        <template v-else-if="activeTab === '1'">
          <Button
            label="Nueva Config"
            icon="pi pi-plus"
            severity="success"
            @click="configsPanel?.openCreateDialog()"
            :disabled="!selectedDomain"
          />
        </template>
        <template v-else-if="activeTab === '2'">
          <Button
            label="Nuevo Mapping"
            icon="pi pi-plus"
            severity="success"
            @click="agentMappingsPanel?.openCreateDialog()"
          />
        </template>
        <template v-else-if="activeTab === '3'">
          <Button
            label="Nuevo Flow Agent"
            icon="pi pi-plus"
            severity="success"
            @click="flowAgentsPanel?.openCreateDialog()"
          />
        </template>
        <template v-else-if="activeTab === '4'">
          <Button
            label="Agregar Keywords"
            icon="pi pi-plus"
            severity="success"
            @click="keywordMappingsPanel?.openBulkDialog()"
          />
        </template>

        <!-- Seed button (tabs 0, 1, 2-4) -->
        <Button
          v-if="['0', '1'].includes(activeTab)"
          label="Seed"
          icon="pi pi-database"
          severity="secondary"
          outlined
          @click="handleSeed"
          :disabled="!selectedDomain"
          v-tooltip="'Cargar datos por defecto'"
        />
        <Button
          v-if="['2', '3', '4'].includes(activeTab)"
          label="Seed Mappings"
          icon="pi pi-database"
          severity="secondary"
          outlined
          @click="handleSeedIntentConfigs"
          v-tooltip="'Importar desde valores hardcodeados'"
        />

        <!-- Export/Import for legacy tabs -->
        <Button
          v-if="['0', '1'].includes(activeTab)"
          label="Exportar"
          icon="pi pi-download"
          severity="secondary"
          outlined
          @click="handleExport"
          :disabled="!selectedDomain"
          v-tooltip="'Exportar a JSON'"
        />
        <Button
          v-if="['0', '1'].includes(activeTab)"
          label="Importar"
          icon="pi pi-upload"
          severity="secondary"
          outlined
          @click="handleImport"
          :disabled="!selectedDomain"
          v-tooltip="'Importar desde JSON'"
        />
        <Button
          icon="pi pi-question-circle"
          severity="info"
          text
          rounded
          @click="showHelpDialog = true"
          v-tooltip="'¿Cómo funciona?'"
        />
        <Button
          icon="pi pi-chart-bar"
          severity="secondary"
          text
          rounded
          @click="fetchCacheStats"
          :loading="loadingCacheStats"
          v-tooltip="'Estadísticas del cache'"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          @click="handleInvalidateCache"
          :disabled="['0', '1'].includes(activeTab) ? !selectedDomain : !organizationId"
          v-tooltip="'Invalidar cache'"
        />
      </div>
    </div>

    <!-- Tabs -->
    <Tabs v-model:value="activeTab" class="main-tabs">
      <TabList>
        <Tab value="0">
          <i class="pi pi-tags mr-2"></i>
          Intents de Detección
        </Tab>
        <Tab value="1">
          <i class="pi pi-comment mr-2"></i>
          Configuración de Respuestas
        </Tab>
        <Tab value="2">
          <i class="pi pi-link mr-2"></i>
          Agent Mappings
        </Tab>
        <Tab value="3">
          <i class="pi pi-sitemap mr-2"></i>
          Flow Agents
        </Tab>
        <Tab value="4">
          <i class="pi pi-tag mr-2"></i>
          Keywords
        </Tab>
        <Tab value="5">
          <i class="pi pi-share-alt mr-2"></i>
          Visualización
        </Tab>
        <Tab value="6">
          <i class="pi pi-play mr-2"></i>
          Testing
        </Tab>
      </TabList>
      <TabPanels>
        <!-- Domain Intents Panel -->
        <TabPanel value="0">
          <DomainIntentsPanel
            ref="intentsPanel"
            :domain="selectedDomain"
            @update:domain="selectedDomain = $event"
          />
        </TabPanel>

        <!-- Response Configs Panel -->
        <TabPanel value="1">
          <ResponseConfigsPanel
            ref="configsPanel"
            :domain="selectedDomain"
          />
        </TabPanel>

        <!-- Agent Mappings Panel -->
        <TabPanel value="2">
          <AgentMappingsPanel
            ref="agentMappingsPanel"
            :domain-key="selectedDomain"
          />
        </TabPanel>

        <!-- Flow Agents Panel -->
        <TabPanel value="3">
          <FlowAgentsPanel
            ref="flowAgentsPanel"
          />
        </TabPanel>

        <!-- Keywords Panel -->
        <TabPanel value="4">
          <KeywordMappingsPanel
            ref="keywordMappingsPanel"
          />
        </TabPanel>

        <!-- Visualization Panel -->
        <TabPanel value="5">
          <IntentFlowVisualization
            ref="visualizationPanel"
          />
        </TabPanel>

        <!-- Testing Panel -->
        <TabPanel value="6">
          <IntentTestPanel />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Cache Stats Dialog -->
    <Dialog
      v-model:visible="showCacheStatsDialog"
      header="Estadísticas del Cache"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div v-if="cacheStats" class="cache-stats-content">
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-title">Memory Hits</span>
            <span class="stat-number">{{ cacheStats.memory_hits }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Memory Misses</span>
            <span class="stat-number">{{ cacheStats.memory_misses }}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-title">Memory Hit Rate</span>
            <span class="stat-number">{{ (cacheStats.memory_hit_rate * 100).toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Redis Hits</span>
            <span class="stat-number">{{ cacheStats.redis_hits }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Redis Misses</span>
            <span class="stat-number">{{ cacheStats.redis_misses }}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-title">Redis Hit Rate</span>
            <span class="stat-number">{{ (cacheStats.redis_hit_rate * 100).toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">DB Loads</span>
            <span class="stat-number">{{ cacheStats.db_loads }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Invalidaciones</span>
            <span class="stat-number">{{ cacheStats.invalidations }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Orgs en Cache</span>
            <span class="stat-number">{{ cacheStats.cached_organizations }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" severity="secondary" @click="showCacheStatsDialog = false" />
      </template>
    </Dialog>

    <!-- Help Dialog -->
    <IntentSystemExplanation v-model="showHelpDialog" />

    <!-- Toast -->
    <Toast />

    <!-- Confirm Dialog for new panels -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ConfirmDialog from 'primevue/confirmdialog'

import DomainIntentsPanel from './DomainIntentsPanel.vue'
import ResponseConfigsPanel from './ResponseConfigsPanel.vue'
import AgentMappingsPanel from '@/components/intent-configs/AgentMappingsPanel.vue'
import FlowAgentsPanel from '@/components/intent-configs/FlowAgentsPanel.vue'
import KeywordMappingsPanel from '@/components/intent-configs/KeywordMappingsPanel.vue'
import IntentFlowVisualization from '@/components/intent-configs/IntentFlowVisualization.vue'
import IntentTestPanel from '@/components/intent-configs/IntentTestPanel.vue'
import IntentSystemExplanation from '@/components/intent-configs/IntentSystemExplanation.vue'

import { domainIntentsApi } from '@/api/domainIntents.api'
import { responseConfigsApi } from '@/api/responseConfigs.api'
import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type { DomainKey, CacheStatsResponse } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

// Intent Config composable for new panels
const {
  seedFromDefaults,
  invalidateCache: invalidateIntentConfigCache,
  fetchCacheStats: fetchIntentConfigCacheStats,
  cacheStats: intentConfigCacheStats,
} = useIntentConfig()

// Refs to child panels
const intentsPanel = ref<InstanceType<typeof DomainIntentsPanel> | null>(null)
const configsPanel = ref<InstanceType<typeof ResponseConfigsPanel> | null>(null)
const agentMappingsPanel = ref<InstanceType<typeof AgentMappingsPanel> | null>(null)
const flowAgentsPanel = ref<InstanceType<typeof FlowAgentsPanel> | null>(null)
const keywordMappingsPanel = ref<InstanceType<typeof KeywordMappingsPanel> | null>(null)
const visualizationPanel = ref<InstanceType<typeof IntentFlowVisualization> | null>(null)

// State
const selectedDomain = ref<DomainKey | null>(null)
const activeTab = ref<string>('0')

// Cache stats
const cacheStats = ref<CacheStatsResponse | null>(null)
const loadingCacheStats = ref(false)
const showCacheStatsDialog = ref(false)

// Help dialog
const showHelpDialog = ref(false)

// Constants
const availableDomains = AVAILABLE_DOMAINS

// Computed
const organizationId = computed(() => authStore.currentOrgId)

// Domain helpers
function getDomainConfig(key: DomainKey) {
  return availableDomains.find((d) => d.key === key)
}

function getDomainName(key: DomainKey): string {
  return getDomainConfig(key)?.name || key
}

function getDomainIcon(key: DomainKey): string {
  return getDomainConfig(key)?.icon || 'pi pi-tag'
}

function getDomainColor(key: DomainKey): string {
  return getDomainConfig(key)?.color || '#666'
}

// Cache operations
async function fetchCacheStats() {
  loadingCacheStats.value = true
  try {
    // Try both APIs and merge stats
    const [intentsStats, configsStats] = await Promise.allSettled([
      domainIntentsApi.getCacheStats(),
      responseConfigsApi.getCacheStats()
    ])

    // Use intents stats as primary, or configs if intents fails
    if (intentsStats.status === 'fulfilled') {
      cacheStats.value = intentsStats.value
    } else if (configsStats.status === 'fulfilled') {
      cacheStats.value = configsStats.value
    } else {
      throw new Error('Could not fetch cache stats')
    }

    showCacheStatsDialog.value = true
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las estadísticas del cache',
      life: 3000
    })
  } finally {
    loadingCacheStats.value = false
  }
}

async function handleInvalidateCache() {
  // For tabs 0-1 we need domain, for tabs 2-6 we only need organization
  const isLegacyTab = ['0', '1'].includes(activeTab.value)

  if (isLegacyTab && (!selectedDomain.value || !organizationId.value)) return
  if (!isLegacyTab && !organizationId.value) return

  try {
    if (isLegacyTab) {
      // Legacy tabs - invalidate domain intents and response configs cache
      await Promise.all([
        domainIntentsApi.invalidateCache(selectedDomain.value!, organizationId.value!),
        responseConfigsApi.invalidateCache(organizationId.value!, selectedDomain.value!)
      ])
    } else {
      // New tabs - invalidate intent config cache
      await invalidateIntentConfigCache()
    }

    toast.add({
      severity: 'success',
      summary: 'Cache invalidado',
      detail: 'El cache ha sido limpiado correctamente',
      life: 3000
    })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo invalidar el cache',
      life: 3000
    })
  }
}

// Tab-specific actions
function handleSeed() {
  if (activeTab.value === '0') {
    intentsPanel.value?.openSeedDialog()
  } else {
    configsPanel.value?.openSeedDialog()
  }
}

function handleExport() {
  if (activeTab.value === '0') {
    intentsPanel.value?.exportIntents()
  } else {
    configsPanel.value?.exportConfigs()
  }
}

function handleImport() {
  if (activeTab.value === '0') {
    intentsPanel.value?.openImportDialog()
  } else {
    configsPanel.value?.openImportDialog()
  }
}

// Seed intent config mappings from hardcoded values
function handleSeedIntentConfigs() {
  confirm.require({
    message: '¿Importar los mappings desde los valores hardcodeados en intent_validator.py? Esto creará nuevos registros pero no sobrescribirá existentes.',
    header: 'Confirmar Seed',
    icon: 'pi pi-database',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Importar',
    accept: async () => {
      try {
        await seedFromDefaults()
        // Refresh the active panel
        if (activeTab.value === '2') {
          agentMappingsPanel.value?.refresh()
        } else if (activeTab.value === '3') {
          flowAgentsPanel.value?.refresh()
        } else if (activeTab.value === '4') {
          keywordMappingsPanel.value?.refresh()
        }
      } catch (error) {
        // Error handled in composable
      }
    },
  })
}
</script>

<style scoped>
.intent-configs-page {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.header-left .text-muted {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
}

.header-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.domain-selector {
  min-width: 200px;
}

.domain-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.org-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.org-indicator i {
  color: var(--primary-color);
}

.main-tabs {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
}

.main-tabs :deep(.p-tablist) {
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 1rem;
}

.main-tabs :deep(.p-tab) {
  padding: 0.75rem 1.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* Cache Stats Dialog */
.cache-stats-content {
  padding: 0.5rem 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-item.highlight {
  background: var(--primary-color);
  color: white;
}

.stat-item.highlight .stat-title {
  color: rgba(255, 255, 255, 0.8);
}

.stat-title {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.stat-number {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1200px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
