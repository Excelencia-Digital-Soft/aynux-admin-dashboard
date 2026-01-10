/**
 * Composable for managing response configs
 * Handles CRUD operations, filtering, and statistics
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { responseConfigsApi } from '@/api/responseConfigs.api'
import { useAuthStore } from '@/stores/auth.store'
import type {
  ResponseConfig,
  ResponseConfigFilterOptions,
  CacheStatsResponse,
  SeedResponse,
  BulkImportResponse,
  ResponseConfigsExportFile,
  ResponseConfigCreate
} from '@/types/responseConfigs.types'
import type { DomainKey } from '@/types/domainIntents.types'

export function useResponseConfigs(selectedDomain: Ref<DomainKey | null>) {
  const toast = useToast()
  const confirm = useConfirm()
  const authStore = useAuthStore()

  // State
  const configs = ref<ResponseConfig[]>([])
  const loading = ref(false)
  const expandedRows = ref<ResponseConfig[]>([])
  const searchQuery = ref('')
  const showOnlyEnabled = ref(false)
  const showOnlyCritical = ref(false)

  // Cache stats state
  const cacheStats = ref<CacheStatsResponse | null>(null)
  const loadingCacheStats = ref(false)
  const showCacheStatsDialog = ref(false)

  // Seed state
  const seedingConfigs = ref(false)
  const showSeedDialog = ref(false)
  const seedOverwrite = ref(false)
  const lastSeedResult = ref<SeedResponse | null>(null)

  // Import/Export state
  const importing = ref(false)
  const showImportDialog = ref(false)
  const importFile = ref<File | null>(null)
  const importPreview = ref<Omit<ResponseConfigCreate, 'organization_id' | 'domain_key'>[]>([])
  const lastImportResult = ref<BulkImportResponse | null>(null)

  // Computed
  const organizationId = computed(() => authStore.currentOrgId)

  const enabledConfigs = computed(() =>
    configs.value.filter((c) => c.is_enabled).length
  )

  const criticalConfigs = computed(() =>
    configs.value.filter((c) => c.is_critical).length
  )

  const canLoad = computed(() =>
    selectedDomain.value !== null && organizationId.value !== null
  )

  // Filtered configs (client-side filtering for search)
  const filteredConfigs = computed(() => {
    let result = configs.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (c) =>
          c.intent_key.toLowerCase().includes(query) ||
          (c.display_name && c.display_name.toLowerCase().includes(query)) ||
          c.task_description.toLowerCase().includes(query)
      )
    }

    if (showOnlyCritical.value) {
      result = result.filter((c) => c.is_critical)
    }

    return result
  })

  // Data loading
  async function loadConfigs() {
    if (!canLoad.value) return

    loading.value = true
    try {
      const options: ResponseConfigFilterOptions = {}
      if (showOnlyEnabled.value) {
        options.enabled_only = true
      }
      configs.value = await responseConfigsApi.listConfigs(
        organizationId.value!,
        selectedDomain.value!,
        options
      )
    } catch (error) {
      console.error('Error loading response configs:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las configuraciones de respuesta',
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  // Search with debounce (client-side)
  let searchTimeout: ReturnType<typeof setTimeout>
  function onSearch() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      // Client-side filtering is handled by computed
    }, 300)
  }

  // Watch for domain changes
  watch(selectedDomain, () => {
    configs.value = []
    expandedRows.value = []
    if (selectedDomain.value) {
      loadConfigs()
    }
  })

  watch(showOnlyEnabled, loadConfigs)

  // Delete config
  function confirmDeleteConfig(config: ResponseConfig) {
    confirm.require({
      message: `¿Eliminar la configuración "${config.display_name || config.intent_key}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: () => deleteConfig(config)
    })
  }

  async function deleteConfig(config: ResponseConfig) {
    try {
      await responseConfigsApi.deleteConfig(config.id)
      toast.add({
        severity: 'success',
        summary: 'Configuración eliminada',
        detail: `"${config.display_name || config.intent_key}" eliminada correctamente`,
        life: 3000
      })
      await loadConfigs()
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la configuración',
        life: 3000
      })
    }
  }

  // Toggle config properties
  async function toggleEnabled(config: ResponseConfig) {
    try {
      await responseConfigsApi.updateConfig(config.id, {
        is_enabled: !config.is_enabled
      })
      config.is_enabled = !config.is_enabled
      toast.add({
        severity: 'success',
        summary: config.is_enabled ? 'Habilitado' : 'Deshabilitado',
        detail: `"${config.display_name || config.intent_key}" ${config.is_enabled ? 'habilitado' : 'deshabilitado'}`,
        life: 2000
      })
    } catch (error) {
      console.error('Error toggling enabled:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado',
        life: 3000
      })
    }
  }

  async function toggleCritical(config: ResponseConfig) {
    try {
      await responseConfigsApi.updateConfig(config.id, {
        is_critical: !config.is_critical
      })
      config.is_critical = !config.is_critical
      toast.add({
        severity: 'success',
        summary: config.is_critical ? 'Marcado crítico' : 'Desmarcado crítico',
        detail: `"${config.display_name || config.intent_key}" ${config.is_critical ? 'usa template fijo' : 'usa LLM'}`,
        life: 2000
      })
    } catch (error) {
      console.error('Error toggling critical:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado',
        life: 3000
      })
    }
  }

  // Cache operations
  async function invalidateCache() {
    if (!organizationId.value) return

    try {
      await responseConfigsApi.invalidateCache(organizationId.value, selectedDomain.value || undefined)
      toast.add({
        severity: 'success',
        summary: 'Cache invalidado',
        detail: 'El cache de response configs ha sido limpiado',
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

  // Cache Stats
  async function fetchCacheStats() {
    loadingCacheStats.value = true
    try {
      cacheStats.value = await responseConfigsApi.getCacheStats()
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

  function closeCacheStatsDialog() {
    showCacheStatsDialog.value = false
  }

  // Seed Defaults
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

    seedingConfigs.value = true
    try {
      lastSeedResult.value = await responseConfigsApi.seedDefaults(
        organizationId.value,
        selectedDomain.value,
        seedOverwrite.value
      )
      toast.add({
        severity: lastSeedResult.value.success ? 'success' : 'warn',
        summary: 'Seed completado',
        detail: `${lastSeedResult.value.added} creados, ${lastSeedResult.value.skipped} omitidos`,
        life: 5000
      })
      await loadConfigs()
    } catch (error) {
      console.error('Error seeding configs:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron sembrar las configuraciones por defecto',
        life: 3000
      })
    } finally {
      seedingConfigs.value = false
    }
  }

  // Export Configs
  async function exportConfigs() {
    if (!selectedDomain.value || !organizationId.value) return

    try {
      const configsList = await responseConfigsApi.exportConfigs(
        organizationId.value,
        selectedDomain.value
      )

      const exportData: ResponseConfigsExportFile = {
        domain_key: selectedDomain.value,
        organization_id: organizationId.value,
        exported_at: new Date().toISOString(),
        configs: configsList.map((config) => ({
          intent_key: config.intent_key,
          is_critical: config.is_critical,
          task_description: config.task_description,
          fallback_template_key: config.fallback_template_key,
          display_name: config.display_name,
          description: config.description,
          priority: config.priority,
          is_enabled: config.is_enabled
        }))
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `response-configs-${selectedDomain.value}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.add({
        severity: 'success',
        summary: 'Exportación exitosa',
        detail: `${configsList.length} configuraciones exportadas`,
        life: 3000
      })
    } catch (error) {
      console.error('Error exporting configs:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron exportar las configuraciones',
        life: 3000
      })
    }
  }

  // Import Configs
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
      const data = JSON.parse(text) as ResponseConfigsExportFile

      if (!data.configs || !Array.isArray(data.configs)) {
        throw new Error('Invalid file format: missing configs array')
      }

      // Convert to create format
      importPreview.value = data.configs.map((config) => ({
        intent_key: config.intent_key,
        is_critical: config.is_critical,
        task_description: config.task_description,
        fallback_template_key: config.fallback_template_key,
        display_name: config.display_name || undefined,
        description: config.description || undefined,
        priority: config.priority,
        is_enabled: config.is_enabled
      }))

      toast.add({
        severity: 'info',
        summary: 'Archivo cargado',
        detail: `${importPreview.value.length} configuraciones listas para importar`,
        life: 3000
      })
    } catch (error) {
      console.error('Error parsing import file:', error)
      toast.add({
        severity: 'error',
        summary: 'Error de formato',
        detail: 'El archivo no tiene un formato válido de response configs',
        life: 5000
      })
      importFile.value = null
    }
  }

  async function importConfigs() {
    if (!selectedDomain.value || !organizationId.value || importPreview.value.length === 0) return

    importing.value = true
    try {
      lastImportResult.value = await responseConfigsApi.bulkCreate(
        organizationId.value,
        selectedDomain.value,
        importPreview.value
      )

      toast.add({
        severity: lastImportResult.value.success ? 'success' : 'warn',
        summary: 'Importación completada',
        detail: `${lastImportResult.value.created} creados, ${lastImportResult.value.skipped} omitidos`,
        life: 5000
      })

      await loadConfigs()
    } catch (error) {
      console.error('Error importing configs:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron importar las configuraciones',
        life: 3000
      })
    } finally {
      importing.value = false
    }
  }

  return {
    // State
    configs,
    loading,
    expandedRows,
    searchQuery,
    showOnlyEnabled,
    showOnlyCritical,

    // Cache stats state
    cacheStats,
    loadingCacheStats,
    showCacheStatsDialog,

    // Seed state
    seedingConfigs,
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
    enabledConfigs,
    criticalConfigs,
    filteredConfigs,
    canLoad,

    // Actions
    loadConfigs,
    onSearch,
    confirmDeleteConfig,
    deleteConfig,
    toggleEnabled,
    toggleCritical,
    invalidateCache,

    // Cache stats actions
    fetchCacheStats,
    closeCacheStatsDialog,

    // Seed actions
    openSeedDialog,
    closeSeedDialog,
    seedDefaults,

    // Export/Import actions
    exportConfigs,
    openImportDialog,
    closeImportDialog,
    handleImportFileChange,
    importConfigs
  }
}
