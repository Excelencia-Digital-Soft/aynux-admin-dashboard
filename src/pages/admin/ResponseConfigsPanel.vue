<template>
  <div>
    <!-- Stats Cards -->
    <ResponseConfigStatsCards
      v-if="domain"
      :total-count="filteredConfigs.length"
      :enabled-count="enabledConfigs"
      :critical-count="criticalConfigs"
    />

    <!-- No Domain Selected -->
    <div
      v-if="!domain"
      class="glass-card text-center py-16 px-8"
    >
      <i class="pi pi-inbox text-5xl text-muted-foreground mb-4 block" />
      <h3 class="text-lg font-semibold text-foreground mb-2">Selecciona un Dominio</h3>
      <p class="text-sm text-muted-foreground">
        Elige un dominio del selector para ver y gestionar las configuraciones de respuesta
      </p>
    </div>

    <!-- Configs Table -->
    <ResponseConfigsTable
      v-else
      :configs="paginatedConfigs"
      :loading="loading"
      :filtered-count="sortedData.length"
      :search-query="searchQuery"
      :show-only-enabled="showOnlyEnabled"
      :show-only-critical="showOnlyCritical"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-pages="totalPages"
      :pagination-start="paginationStart"
      :pagination-end="paginationEnd"
      :expanded-rows="expandedRows"
      :node-map="nodeMap"
      :node-filter="nodeFilter"
      :node-filter-options="nodeFilterOptions"
      @update:search-query="searchQuery = $event"
      @update:show-only-enabled="showOnlyEnabled = $event"
      @update:show-only-critical="showOnlyCritical = $event"
      @update:current-page="currentPage = $event"
      @update:node-filter="nodeFilter = $event"
      @sort="toggleSort"
      @toggle-row="toggleRow"
      @edit="openEditDialog"
      @delete="confirmDeleteConfig"
      @toggle-enabled="toggleEnabled"
      @toggle-critical="toggleCritical"
      @create-first="openCreateDialog"
      @page-size-change="onPageSizeChange"
    />

    <!-- Dialogs -->
    <ResponseConfigFormDialog
      :open="showDialog"
      :saving="saving"
      :form-data="formData"
      :available-params="availableParams"
      :save-warnings="saveWarnings"
      :is-editing="isEditing()"
      :dialog-title="dialogTitle()"
      :submit-label="submitLabel()"
      @update:open="showDialog = $event"
      @save="saveConfig"
      @cancel="closeDialog"
      @dismiss-warnings="closeDialog"
    />

    <ResponseConfigSeedDialog
      :open="showSeedDialog"
      :domain-name="domainName"
      :seed-overwrite="seedOverwrite"
      :seeding-configs="seedingConfigs"
      :last-seed-result="lastSeedResult"
      @update:open="showSeedDialog = $event"
      @update:seed-overwrite="seedOverwrite = $event"
      @seed="seedDefaults"
      @cancel="closeSeedDialog"
    />

    <ResponseConfigImportDialog
      :open="showImportDialog"
      :importing="importing"
      :import-file="importFile"
      :import-preview="importPreview"
      :last-import-result="lastImportResult"
      @update:open="showImportDialog = $event"
      @file-select="handleImportFileChange"
      @import="importConfigs"
      @cancel="closeImportDialog"
    />

    <ResponseConfigDeleteDialog
      :open="deleteDialogOpen"
      :config="deletingConfig"
      @update:open="deleteDialogOpen = $event"
      @confirm="executeDeleteConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'

import {
  ResponseConfigStatsCards,
  ResponseConfigsTable,
  ResponseConfigFormDialog,
  ResponseConfigSeedDialog,
  ResponseConfigImportDialog,
  ResponseConfigDeleteDialog
} from '@/components/response-configs'

import { useResponseConfigs } from '@/composables/useResponseConfigs'
import { useResponseConfigDialog } from '@/composables/useResponseConfigDialog'
import { useTableSort } from '@/composables/useTableSort'
import type { ResponseConfig } from '@/types/responseConfigs.types'
import type { DomainKey } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

// Props
const props = defineProps<{
  domain: DomainKey | null
  nodeMap?: Record<string, { nodeId: string; nodeDisplayName: string }>
  nodeFilterOptions?: { id: string; label: string }[]
  selectedNodeId?: string | null
}>()

// Emits
defineEmits<{
  (e: 'openSeed'): void
  (e: 'openImport'): void
  (e: 'export'): void
}>()

// Convert prop to ref for composables
const selectedDomain = toRef(props, 'domain')

// Response configs composable
const {
  loading,
  searchQuery,
  showOnlyEnabled,
  showOnlyCritical,
  seedingConfigs,
  showSeedDialog,
  seedOverwrite,
  lastSeedResult,
  importing,
  showImportDialog,
  importPreview,
  lastImportResult,
  importFile,
  organizationId,
  enabledConfigs,
  criticalConfigs,
  filteredConfigs,
  loadConfigs,
  deleteConfig,
  toggleEnabled,
  toggleCritical,
  openSeedDialog,
  closeSeedDialog,
  seedDefaults,
  openImportDialog,
  closeImportDialog,
  handleImportFileChange,
  importConfigs,
  exportConfigs
} = useResponseConfigs(selectedDomain)

// Dialog composable
const {
  showDialog,
  saving,
  formData,
  availableParams,
  saveWarnings,
  isEditing,
  dialogTitle,
  submitLabel,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  saveConfig
} = useResponseConfigDialog(selectedDomain, organizationId, loadConfigs)

// Node filtering
const nodeFilter = ref<string | null>(null)

watch(() => props.selectedNodeId, (id) => {
  if (id && props.nodeFilterOptions?.some(n => n.id === id)) {
    nodeFilter.value = id
  }
})

// Reset node filter on domain change
watch(() => props.domain, () => {
  nodeFilter.value = null
})

const nodeFilteredConfigs = computed(() => {
  if (!nodeFilter.value || !props.nodeMap) return filteredConfigs.value
  return filteredConfigs.value.filter(
    rc => props.nodeMap![rc.intent_key]?.nodeId === nodeFilter.value
  )
})

// Sorting
const { sortField, sortOrder, toggleSort, sortedData } = useTableSort<ResponseConfig>(nodeFilteredConfigs)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const paginatedConfigs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedData.value.length / pageSize.value))
)

const paginationStart = computed(() =>
  sortedData.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)

const paginationEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, sortedData.value.length)
)

function onPageSizeChange(val: string) {
  pageSize.value = Number(val)
  currentPage.value = 1
}

// Reset page when filters change
watch(filteredConfigs, () => {
  currentPage.value = 1
})

// Expandable Rows
const expandedRows = ref<Set<string>>(new Set())

function toggleRow(id: string) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
  expandedRows.value = new Set(expandedRows.value)
}

// Delete Confirmation
const deleteDialogOpen = ref(false)
const deletingConfig = ref<ResponseConfig | null>(null)

function confirmDeleteConfig(config: ResponseConfig) {
  deletingConfig.value = config
  deleteDialogOpen.value = true
}

async function executeDeleteConfig() {
  if (deletingConfig.value) {
    await deleteConfig(deletingConfig.value)
    deletingConfig.value = null
  }
}

// Domain name for display
const domainName = computed(() => {
  if (!props.domain) return ''
  const domainConfig = AVAILABLE_DOMAINS.find(d => d.key === props.domain)
  return domainConfig?.name || props.domain
})

// Watch domain changes to reload
watch(() => props.domain, (newDomain) => {
  if (newDomain) {
    loadConfigs()
  }
}, { immediate: true })

// Expose methods for parent
defineExpose({
  openCreateDialog,
  openSeedDialog,
  openImportDialog,
  exportConfigs
})
</script>
