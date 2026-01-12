/**
 * Composable for managing domain intents in a panel context
 * Receives domain as a ref parameter instead of managing its own state
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { domainIntentsApi } from '@/api/domainIntents.api'
import { useAuthStore } from '@/stores/auth.store'
import type {
  DomainIntent,
  DomainKey,
  SeedResponse,
  BulkImportResponse,
  IntentCreate,
  IntentsExportFile
} from '@/types/domainIntents.types'

export function useDomainIntentsPanel(selectedDomain: Ref<DomainKey | null>) {
  const toast = useToast()
  const confirm = useConfirm()
  const authStore = useAuthStore()

  // State
  const intents = ref<DomainIntent[]>([])
  const loading = ref(false)
  const expandedRows = ref<DomainIntent[]>([])
  const searchQuery = ref('')
  const showOnlyEnabled = ref(false)

  // Seed state
  const seedingIntents = ref(false)
  const showSeedDialog = ref(false)
  const seedOverwrite = ref(false)
  const lastSeedResult = ref<SeedResponse | null>(null)

  // Import/Export state
  const importing = ref(false)
  const showImportDialog = ref(false)
  const importFile = ref<File | null>(null)
  const importPreview = ref<IntentCreate[]>([])
  const lastImportResult = ref<BulkImportResponse | null>(null)

  // Computed
  const organizationId = computed(() => authStore.currentOrgId)

  const enabledIntents = computed(() =>
    intents.value.filter((i) => i.is_enabled).length
  )

  const totalPatterns = computed(() => {
    return intents.value.reduce((sum, intent) => {
      const lemmaCount = intent.lemmas?.length || 0
      const phraseCount = intent.phrases?.length || 0
      const confirmationCount = intent.confirmation_patterns?.length || 0
      const keywordCount = intent.keywords?.length || 0
      return sum + lemmaCount + phraseCount + confirmationCount + keywordCount
    }, 0)
  })

  const canLoad = computed(() =>
    selectedDomain.value !== null && organizationId.value !== null
  )

  // Data loading
  async function loadIntents() {
    if (!canLoad.value) return

    loading.value = true
    try {
      const options: { is_enabled?: boolean; search?: string } = {}
      if (showOnlyEnabled.value) {
        options.is_enabled = true
      }
      if (searchQuery.value) {
        options.search = searchQuery.value
      }
      intents.value = await domainIntentsApi.listIntents(
        selectedDomain.value!,
        organizationId.value!,
        options
      )
    } catch (error) {
      console.error('Error loading intents:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los intents',
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  // Search with debounce
  let searchTimeout: ReturnType<typeof setTimeout>
  function onSearch() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(loadIntents, 300)
  }

  // Watch for domain changes
  watch(selectedDomain, () => {
    intents.value = []
    expandedRows.value = []
    if (selectedDomain.value) {
      loadIntents()
    }
  })

  watch(showOnlyEnabled, loadIntents)

  // Delete intent
  function confirmDeleteIntent(intent: DomainIntent) {
    confirm.require({
      message: `¿Eliminar el intent "${intent.name}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: () => deleteIntent(intent)
    })
  }

  async function deleteIntent(intent: DomainIntent) {
    if (!selectedDomain.value) return

    try {
      await domainIntentsApi.deleteIntent(selectedDomain.value, intent.id)
      toast.add({
        severity: 'success',
        summary: 'Intent eliminado',
        detail: `"${intent.name}" eliminado correctamente`,
        life: 3000
      })
      await loadIntents()
    } catch (error) {
      console.error('Error deleting intent:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el intent',
        life: 3000
      })
    }
  }

  // =========================================================================
  // Seed Defaults
  // =========================================================================

  function openSeedDialog() {
    seedOverwrite.value = false
    lastSeedResult.value = null
    showSeedDialog.value = true
  }

  function closeSeedDialog() {
    showSeedDialog.value = false
    seedOverwrite.value = false
    lastSeedResult.value = null
  }

  async function seedDefaults() {
    if (!selectedDomain.value || !organizationId.value) return

    seedingIntents.value = true
    try {
      lastSeedResult.value = await domainIntentsApi.seedDefaults(
        selectedDomain.value,
        organizationId.value,
        seedOverwrite.value
      )
      toast.add({
        severity: lastSeedResult.value.success ? 'success' : 'warn',
        summary: 'Seed completado',
        detail: `${lastSeedResult.value.added} creados, ${lastSeedResult.value.skipped} omitidos`,
        life: 5000
      })
      await loadIntents()
    } catch (error) {
      console.error('Error seeding intents:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron sembrar los intents por defecto',
        life: 3000
      })
    } finally {
      seedingIntents.value = false
    }
  }

  // =========================================================================
  // Export Intents
  // =========================================================================

  async function exportIntents() {
    if (!selectedDomain.value || !organizationId.value) return

    try {
      const intentsList = await domainIntentsApi.exportIntents(
        selectedDomain.value,
        organizationId.value
      )

      const exportData: IntentsExportFile = {
        domain_key: selectedDomain.value,
        organization_id: organizationId.value,
        exported_at: new Date().toISOString(),
        intents: intentsList.map((intent) => ({
          intent_key: intent.intent_key,
          name: intent.name,
          description: intent.description,
          weight: intent.weight,
          exact_match: intent.exact_match,
          is_enabled: intent.is_enabled,
          priority: intent.priority,
          lemmas: intent.lemmas,
          phrases: intent.phrases,
          confirmation_patterns: intent.confirmation_patterns,
          keywords: intent.keywords
        }))
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `intents-${selectedDomain.value}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.add({
        severity: 'success',
        summary: 'Exportación exitosa',
        detail: `${intentsList.length} intents exportados`,
        life: 3000
      })
    } catch (error) {
      console.error('Error exporting intents:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron exportar los intents',
        life: 3000
      })
    }
  }

  // =========================================================================
  // Import Intents
  // =========================================================================

  function openImportDialog() {
    importFile.value = null
    importPreview.value = []
    lastImportResult.value = null
    showImportDialog.value = true
  }

  function closeImportDialog() {
    showImportDialog.value = false
    importFile.value = null
    importPreview.value = []
    lastImportResult.value = null
  }

  async function handleImportFileChange(file: File | null) {
    importFile.value = file
    importPreview.value = []

    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as IntentsExportFile

      if (!data.intents || !Array.isArray(data.intents)) {
        throw new Error('Invalid file format: missing intents array')
      }

      // Convert to IntentCreate format
      importPreview.value = data.intents.map((intent) => ({
        intent_key: intent.intent_key,
        name: intent.name,
        description: intent.description,
        weight: intent.weight,
        exact_match: intent.exact_match,
        is_enabled: intent.is_enabled,
        priority: intent.priority
      }))

      toast.add({
        severity: 'info',
        summary: 'Archivo cargado',
        detail: `${importPreview.value.length} intents listos para importar`,
        life: 3000
      })
    } catch (error) {
      console.error('Error parsing import file:', error)
      toast.add({
        severity: 'error',
        summary: 'Error de formato',
        detail: 'El archivo no tiene un formato válido de intents',
        life: 5000
      })
      importFile.value = null
    }
  }

  async function importIntents() {
    if (!selectedDomain.value || !organizationId.value || importPreview.value.length === 0) return

    importing.value = true
    try {
      lastImportResult.value = await domainIntentsApi.bulkCreateIntents(
        selectedDomain.value,
        organizationId.value,
        importPreview.value
      )

      toast.add({
        severity: lastImportResult.value.success ? 'success' : 'warn',
        summary: 'Importación completada',
        detail: `${lastImportResult.value.created} creados, ${lastImportResult.value.skipped} omitidos`,
        life: 5000
      })

      await loadIntents()
    } catch (error) {
      console.error('Error importing intents:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron importar los intents',
        life: 3000
      })
    } finally {
      importing.value = false
    }
  }

  return {
    // State
    intents,
    loading,
    expandedRows,
    searchQuery,
    showOnlyEnabled,

    // Seed state
    seedingIntents,
    showSeedDialog,
    seedOverwrite,
    lastSeedResult,

    // Import/Export state
    importing,
    showImportDialog,
    importFile,
    importPreview,
    lastImportResult,

    // Computed
    organizationId,
    enabledIntents,
    totalPatterns,
    canLoad,

    // Actions
    loadIntents,
    onSearch,
    confirmDeleteIntent,
    deleteIntent,

    // Seed actions
    openSeedDialog,
    closeSeedDialog,
    seedDefaults,

    // Export/Import actions
    exportIntents,
    openImportDialog,
    closeImportDialog,
    handleImportFileChange,
    importIntents
  }
}
