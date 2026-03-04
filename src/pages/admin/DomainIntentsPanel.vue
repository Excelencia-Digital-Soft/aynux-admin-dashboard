<template>
  <div>
    <!-- Stats Cards -->
    <DomainIntentStatsCards
      v-if="domain"
      :total-count="intents.length"
      :enabled-count="enabledIntents"
      :total-patterns="totalPatterns"
    />

    <!-- NLU Test Input (Phase 4) -->
    <div v-if="domain && domain === 'turnos_medicos'" class="nlu-test-section glass-panel mt-3 mb-3 p-3">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-search text-sm text-muted-foreground" />
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Probar NLU</span>
      </div>
      <div class="flex gap-2 items-start">
        <input
          v-model="nluTestText"
          type="text"
          class="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Escribi una frase... ej: quiero cambiar mi turno"
          @keydown.enter="handleNluTest"
        />
        <button
          class="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          :disabled="!nluTestText.trim() || nluTestLoading"
          @click="handleNluTest"
        >
          <i v-if="nluTestLoading" class="pi pi-spin pi-spinner mr-1 text-xs" />
          Analizar
        </button>
      </div>
      <!-- NLU Test Result -->
      <div v-if="nluTestResult" class="mt-2 rounded-md border border-border bg-muted/50 p-3">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-sm font-semibold text-foreground">{{ nluTestResult.intent }}</span>
          <span
            class="text-[0.65rem] font-medium px-1.5 py-0.5 rounded-full"
            :class="nluTestResult.confidence >= 0.6
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : nluTestResult.confidence >= 0.3
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
          >
            {{ (nluTestResult.confidence * 100).toFixed(0) }}%
          </span>
          <span class="text-[0.6rem] text-muted-foreground ml-auto">{{ nluTestResult.method }}</span>
        </div>
        <!-- Matched Lemmas -->
        <div v-if="nluTestResult.matched_lemmas.length > 0" class="flex flex-wrap gap-1 mb-1.5">
          <span
            v-for="lemma in nluTestResult.matched_lemmas"
            :key="lemma"
            class="text-[0.6rem] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {{ lemma }}
          </span>
        </div>
        <!-- All Scores (top 5) -->
        <div v-if="sortedNluScores.length > 0" class="space-y-1">
          <div
            v-for="score in sortedNluScores"
            :key="score.intent"
            class="flex items-center gap-2"
          >
            <span class="text-[0.65rem] text-muted-foreground w-[120px] truncate">{{ score.intent }}</span>
            <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="score.intent === nluTestResult!.intent ? 'bg-primary' : 'bg-muted-foreground/30'"
                :style="{ width: `${Math.max(score.score * 100, 2)}%` }"
              />
            </div>
            <span class="text-[0.6rem] text-muted-foreground w-[36px] text-right">{{ (score.score * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

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
import { intentAnalysisApi, type IntentAnalysisResponse } from '@/api/intentAnalysis.api'
import { useAuthStore } from '@/stores/auth.store'
import type { DomainIntent, DomainKey, MatchType } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

// Props
const props = defineProps<{
  domain: DomainKey | null
}>()

const selectedDomain = toRef(props, 'domain')

// NLU Test (Phase 4)
const authStore = useAuthStore()
const nluTestText = ref('')
const nluTestLoading = ref(false)
const nluTestResult = ref<IntentAnalysisResponse | null>(null)

const sortedNluScores = computed(() => {
  if (!nluTestResult.value?.all_scores) return []
  return Object.entries(nluTestResult.value.all_scores)
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
})

async function handleNluTest() {
  if (!nluTestText.value.trim() || !props.domain || !authStore.currentOrgId) return
  nluTestLoading.value = true
  try {
    nluTestResult.value = await intentAnalysisApi.analyze(props.domain, {
      text: nluTestText.value,
      organization_id: authStore.currentOrgId,
    })
  } catch (err) {
    console.error('NLU test failed:', err)
    nluTestResult.value = null
  } finally {
    nluTestLoading.value = false
  }
}

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
