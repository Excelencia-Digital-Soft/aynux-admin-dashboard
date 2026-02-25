<template>
  <div>
    <!-- Stats Cards -->
    <DomainIntentStatsCards
      v-if="domain"
      :total-count="intents.length"
      :enabled-count="enabledIntents"
      :total-patterns="totalPatterns"
    />

    <!-- No Domain Selected -->
    <div
      v-if="!domain"
      class="glass-card flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <i class="pi pi-inbox text-5xl text-muted-foreground mb-4" />
      <h3 class="text-lg font-semibold text-foreground mb-2">Selecciona un Dominio</h3>
      <p class="text-muted-foreground">Elige un dominio del selector para ver y gestionar sus intents</p>
    </div>

    <!-- Intents Table -->
    <DomainIntentsTable
      v-else
      :intents="paginatedIntents"
      :loading="loading"
      :filtered-count="sortedData.length"
      :search-query="searchQuery"
      :show-only-enabled="showOnlyEnabled"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-pages="totalPages"
      :pagination-start="paginationStart"
      :pagination-end="paginationEnd"
      :expanded-rows="expandedRows"
      @update:search-query="searchQuery = $event"
      @update:show-only-enabled="showOnlyEnabled = $event"
      @update:current-page="currentPage = $event"
      @sort="toggleSort"
      @toggle-row="toggleRow"
      @edit="openEditDialog"
      @delete="confirmDelete"
      @create-first="openCreateDialog"
      @page-size-change="onPageSizeChange"
      @search="onSearch"
    >
      <template #expanded-row="{ intent }">
        <DomainIntentExpandedRow
          :intent="intent"
          @add-lemma="handleAddLemma"
          @remove-lemma="handleRemoveLemma"
          @add-phrase="handleAddPhrase"
          @remove-phrase="handleRemovePhrase"
          @add-confirmation="handleAddConfirmation"
          @add-keyword="handleAddKeyword"
          @remove-keyword="handleRemoveKeyword"
        />
      </template>
    </DomainIntentsTable>

    <!-- Dialogs -->
    <DomainIntentFormDialog
      :open="showDialog"
      :saving="saving"
      :form-data="formData"
      :is-editing="isEditing()"
      :dialog-title="dialogTitle()"
      :submit-label="submitLabel()"
      @update:open="showDialog = $event"
      @save="saveIntent"
      @cancel="closeDialog"
    />

    <DomainIntentSeedDialog
      :open="showSeedDialog"
      :domain-name="domainName"
      :seed-overwrite="seedOverwrite"
      :seeding-intents="seedingIntents"
      :last-seed-result="lastSeedResult"
      @update:open="showSeedDialog = $event"
      @update:seed-overwrite="seedOverwrite = $event"
      @seed="seedDefaults"
      @cancel="closeSeedDialog"
    />

    <DomainIntentImportDialog
      :open="showImportDialog"
      :importing="importing"
      :import-file="importFile"
      :import-preview="importPreview"
      :last-import-result="lastImportResult"
      @update:open="showImportDialog = $event"
      @file-select="handleImportFileChange"
      @import="importIntents"
      @cancel="closeImportDialog"
    />

    <DomainIntentDeleteDialog
      :open="deleteDialogOpen"
      :intent="deletingIntent"
      @update:open="deleteDialogOpen = $event"
      @confirm="executeDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'

import {
  DomainIntentStatsCards,
  DomainIntentsTable,
  DomainIntentExpandedRow,
  DomainIntentFormDialog,
  DomainIntentSeedDialog,
  DomainIntentImportDialog,
  DomainIntentDeleteDialog
} from '@/components/domain-intents'

import { useDomainIntentsPanel } from '@/composables/useDomainIntentsPanel'
import { useIntentPatterns } from '@/composables/useIntentPatterns'
import { useIntentDialog } from '@/composables/useIntentDialog'
import { useTableSort } from '@/composables/useTableSort'
import type { DomainIntent, DomainKey, MatchType } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

// Props
const props = defineProps<{
  domain: DomainKey | null
}>()

const selectedDomain = toRef(props, 'domain')

// Domain name for display
const domainName = computed(() => {
  if (!props.domain) return ''
  const domainConfig = AVAILABLE_DOMAINS.find(d => d.key === props.domain)
  return domainConfig?.name || props.domain
})

// Domain Intents composable
const {
  intents,
  loading,
  searchQuery,
  showOnlyEnabled,
  seedingIntents,
  showSeedDialog,
  seedOverwrite,
  lastSeedResult,
  importing,
  showImportDialog,
  importFile,
  importPreview,
  lastImportResult,
  organizationId,
  enabledIntents,
  totalPatterns,
  loadIntents,
  onSearch,
  deleteIntent,
  openSeedDialog,
  closeSeedDialog,
  seedDefaults,
  exportIntents,
  openImportDialog,
  closeImportDialog,
  handleImportFileChange,
  importIntents
} = useDomainIntentsPanel(selectedDomain)

// Intent Patterns composable
const {
  newLemma,
  newKeyword,
  newPhrase,
  newConfirmation,
  addLemma,
  addKeyword,
  addPhrase,
  addConfirmation,
  removeLemma,
  removePhrase,
  removeKeyword
} = useIntentPatterns(selectedDomain, loadIntents)

// Intent Dialog composable
const {
  showDialog,
  saving,
  formData,
  isEditing,
  dialogTitle,
  submitLabel,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  saveIntent
} = useIntentDialog(selectedDomain, organizationId, loadIntents)

// Sorting (replaces inline sorting)
const { sortField, sortOrder, toggleSort, sortedData } = useTableSort<DomainIntent>(intents)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const paginatedIntents = computed(() => {
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

// Reset page when intents change
watch(() => intents.value.length, () => {
  currentPage.value = 1
})

// Expandable Rows
const expandedRows = ref<Set<string>>(new Set())

function toggleRow(id: string) {
  const newSet = new Set(expandedRows.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedRows.value = newSet
}

// Delete Confirmation
const deleteDialogOpen = ref(false)
const deletingIntent = ref<DomainIntent | null>(null)

function confirmDelete(intent: DomainIntent) {
  deletingIntent.value = intent
  deleteDialogOpen.value = true
}

function executeDelete() {
  if (deletingIntent.value) {
    deleteIntent(deletingIntent.value)
  }
  deleteDialogOpen.value = false
  deletingIntent.value = null
}

// Bridge pattern actions from ExpandedRow events to useIntentPatterns composable
// The composable reads from its internal refs, so we set them before calling
function handleAddLemma(intent: DomainIntent, value: string) {
  newLemma.value = value
  addLemma(intent)
}

function handleRemoveLemma(intent: DomainIntent, lemma: string) {
  removeLemma(intent, lemma)
}

function handleAddPhrase(intent: DomainIntent, value: string, matchType: MatchType) {
  newPhrase.value = { value, match_type: matchType }
  addPhrase(intent)
}

function handleRemovePhrase(intent: DomainIntent, phrase: string) {
  removePhrase(intent, phrase)
}

function handleAddConfirmation(intent: DomainIntent, value: string, matchType: MatchType) {
  newConfirmation.value = { value, match_type: matchType }
  addConfirmation(intent)
}

function handleAddKeyword(intent: DomainIntent, value: string) {
  newKeyword.value = value
  addKeyword(intent)
}

function handleRemoveKeyword(intent: DomainIntent, keyword: string) {
  removeKeyword(intent, keyword)
}

// Watch domain changes
watch(() => props.domain, (newDomain) => {
  if (newDomain) {
    loadIntents()
  }
}, { immediate: true })

// Expose methods for parent
defineExpose({
  openCreateDialog,
  openSeedDialog,
  openImportDialog,
  exportIntents
})
</script>
