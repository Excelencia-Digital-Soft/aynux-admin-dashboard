/**
 * Composable for TenantInstitutionConfig operations.
 *
 * Provides reactive state and CRUD operations for institution configs.
 * Wraps the store and API client for use in components.
 */

import { computed } from 'vue'
import { useTenantInstitutionConfigStore } from '@/stores/tenantInstitutionConfig.store'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import { useToast } from 'primevue/usetoast'
import type { AxiosError } from 'axios'
import type {
  TenantInstitutionConfig,
  InstitutionConfigCreateRequest,
  InstitutionConfigUpdateRequest,
  InstitutionConfigSecretsRequest,
  InstitutionConfigListParams
} from '@/types/tenantInstitutionConfig.types'

interface ApiValidationDetail {
  field: string
  message: string
  type: string
}

interface ApiErrorResponse {
  error?: boolean
  message?: string
  detail?: string | ApiValidationDetail[]
  details?: ApiValidationDetail[]
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosErr = err as AxiosError<ApiErrorResponse>
    const data = axiosErr.response?.data
    if (data) {
      // Format: { details: [{ field, message }] }
      if (data.details?.length) {
        return data.details.map((d) => d.message).join('. ')
      }
      // Format: { detail: [{ msg, loc }] } (FastAPI default)
      if (Array.isArray(data.detail)) {
        return data.detail.map((d) => d.message || String(d)).join('. ')
      }
      // Format: { message: "..." } or { detail: "..." }
      if (data.message) return data.message
      if (typeof data.detail === 'string') return data.detail
    }
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function useTenantInstitutionConfig() {
  const store = useTenantInstitutionConfigStore()
  const toast = useToast()

  // ============================================================
  // Computed State
  // ============================================================

  const configs = computed(() => store.configs)
  const total = computed(() => store.total)
  const enabledCount = computed(() => store.enabledCount)
  const disabledCount = computed(() => store.disabledCount)
  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)
  const page = computed(() => store.page)
  const pageSize = computed(() => store.pageSize)
  const totalPages = computed(() => store.totalPages)
  const filters = computed(() => store.filters)

  // Dialog states
  const showFormDialog = computed(() => store.showFormDialog)
  const showSecretsDialog = computed(() => store.showSecretsDialog)
  const editingConfig = computed(() => store.editingConfig)
  const secretsConfigId = computed(() => store.secretsConfigId)
  const isEditing = computed(() => store.isEditing)

  // ============================================================
  // CRUD Operations
  // ============================================================

  /**
   * Fetch institution configs for an organization.
   */
  async function fetchConfigs(orgId: string): Promise<void> {
    store.setLoading(true)
    store.setError(null)

    try {
      const params: InstitutionConfigListParams = {
        page: store.page,
        page_size: store.pageSize,
        ...store.filters
      }

      const response = await tenantInstitutionConfigApi.list(orgId, params)

      store.setConfigs(
        response.items,
        response.total,
        response.enabled_count,
        response.disabled_count
      )
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Error al cargar configuraciones')
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Create a new institution config.
   */
  async function createConfig(
    orgId: string,
    data: InstitutionConfigCreateRequest
  ): Promise<TenantInstitutionConfig | null> {
    store.setLoading(true)
    store.setError(null)

    try {
      const config = await tenantInstitutionConfigApi.create(orgId, data)
      store.addConfig(config)

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: `Institución "${config.institution_name}" creada correctamente`,
        life: 3000
      })

      store.closeFormDialog()
      return config
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Error al crear configuración')
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Update an existing institution config.
   */
  async function updateConfig(
    orgId: string,
    configId: string,
    data: InstitutionConfigUpdateRequest
  ): Promise<TenantInstitutionConfig | null> {
    store.setLoading(true)
    store.setError(null)

    try {
      const config = await tenantInstitutionConfigApi.update(orgId, configId, data)
      store.updateConfig(config)

      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: `Institución "${config.institution_name}" actualizada correctamente`,
        life: 3000
      })

      store.closeFormDialog()
      return config
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Error al actualizar configuración')
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Delete an institution config.
   */
  async function deleteConfig(
    orgId: string,
    configId: string
  ): Promise<boolean> {
    store.setLoading(true)
    store.setError(null)

    try {
      await tenantInstitutionConfigApi.delete(orgId, configId)
      store.removeConfig(configId)

      toast.add({
        severity: 'success',
        summary: 'Eliminado',
        detail: 'Configuración eliminada correctamente',
        life: 3000
      })

      return true
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Error al eliminar configuración')
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Toggle enabled/disabled status.
   */
  async function toggleConfig(
    orgId: string,
    configId: string
  ): Promise<TenantInstitutionConfig | null> {
    store.setLoading(true)
    store.setError(null)

    try {
      const config = await tenantInstitutionConfigApi.toggle(orgId, configId)
      store.updateConfig(config)

      toast.add({
        severity: 'success',
        summary: config.enabled ? 'Habilitado' : 'Deshabilitado',
        detail: `Institución "${config.institution_name}" ${
          config.enabled ? 'habilitada' : 'deshabilitada'
        }`,
        life: 3000
      })

      return config
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Error al cambiar estado')
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Update secrets (write-only).
   */
  async function updateSecrets(
    orgId: string,
    configId: string,
    secrets: InstitutionConfigSecretsRequest
  ): Promise<boolean> {
    store.setLoading(true)
    store.setError(null)

    try {
      await tenantInstitutionConfigApi.updateSecrets(orgId, configId, secrets)

      // Update has_secrets flag in local config
      const config = store.getConfigById(configId)
      if (config) {
        store.updateConfig({ ...config, has_secrets: true })
      }

      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Credenciales actualizadas correctamente',
        life: 3000
      })

      store.closeSecretsDialog()
      return true
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Error al actualizar credenciales')
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
      return false
    } finally {
      store.setLoading(false)
    }
  }

  // ============================================================
  // Pagination & Filters
  // ============================================================

  function setPage(newPage: number) {
    store.setPage(newPage)
  }

  function setPageSize(size: number) {
    store.setPageSize(size)
  }

  function setFilters(newFilters: Partial<InstitutionConfigListParams>) {
    store.setFilters(newFilters)
  }

  function clearFilters() {
    store.clearFilters()
  }

  // ============================================================
  // Dialog Actions
  // ============================================================

  function openCreateDialog() {
    store.openCreateDialog()
  }

  function openEditDialog(config: TenantInstitutionConfig) {
    store.openEditDialog(config)
  }

  function closeFormDialog() {
    store.closeFormDialog()
  }

  function openSecretsDialog(configId: string) {
    store.openSecretsDialog(configId)
  }

  function closeSecretsDialog() {
    store.closeSecretsDialog()
  }

  // ============================================================
  // Return
  // ============================================================

  return {
    // State
    configs,
    total,
    enabledCount,
    disabledCount,
    isLoading,
    error,
    page,
    pageSize,
    totalPages,
    filters,

    // Dialog state
    showFormDialog,
    showSecretsDialog,
    editingConfig,
    secretsConfigId,
    isEditing,

    // CRUD operations
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfig,
    updateSecrets,

    // Pagination & filters
    setPage,
    setPageSize,
    setFilters,
    clearFilters,

    // Dialog actions
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    openSecretsDialog,
    closeSecretsDialog
  }
}
