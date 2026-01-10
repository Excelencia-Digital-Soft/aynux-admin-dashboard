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
        <!-- Domain Selector -->
        <Select
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
        <template v-else>
          <Button
            label="Nueva Config"
            icon="pi pi-plus"
            severity="success"
            @click="configsPanel?.openCreateDialog()"
            :disabled="!selectedDomain"
          />
        </template>

        <Button
          label="Seed"
          icon="pi pi-database"
          severity="secondary"
          outlined
          @click="handleSeed"
          :disabled="!selectedDomain"
          v-tooltip="'Cargar datos por defecto'"
        />
        <Button
          label="Exportar"
          icon="pi pi-download"
          severity="secondary"
          outlined
          @click="handleExport"
          :disabled="!selectedDomain"
          v-tooltip="'Exportar a JSON'"
        />
        <Button
          label="Importar"
          icon="pi pi-upload"
          severity="secondary"
          outlined
          @click="handleImport"
          :disabled="!selectedDomain"
          v-tooltip="'Importar desde JSON'"
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
          :disabled="!selectedDomain"
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

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

import DomainIntentsPanel from './DomainIntentsPanel.vue'
import ResponseConfigsPanel from './ResponseConfigsPanel.vue'

import { domainIntentsApi } from '@/api/domainIntents.api'
import { responseConfigsApi } from '@/api/responseConfigs.api'
import { useAuthStore } from '@/stores/auth.store'
import type { DomainKey, CacheStatsResponse } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

const toast = useToast()
const authStore = useAuthStore()

// Refs to child panels
const intentsPanel = ref<InstanceType<typeof DomainIntentsPanel> | null>(null)
const configsPanel = ref<InstanceType<typeof ResponseConfigsPanel> | null>(null)

// State
const selectedDomain = ref<DomainKey | null>(null)
const activeTab = ref<string>('0')

// Cache stats
const cacheStats = ref<CacheStatsResponse | null>(null)
const loadingCacheStats = ref(false)
const showCacheStatsDialog = ref(false)

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
  if (!selectedDomain.value || !organizationId.value) return

  try {
    // Invalidate both caches
    await Promise.all([
      domainIntentsApi.invalidateCache(selectedDomain.value, organizationId.value),
      responseConfigsApi.invalidateCache(organizationId.value, selectedDomain.value)
    ])

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
