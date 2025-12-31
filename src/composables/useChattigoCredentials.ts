import { computed } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useAuthStore } from '@/stores/auth.store'
import { chattigoCredentialsApi } from '@/api/chattigoCredentials.api'
import { useToast } from '@/composables/useToast'
import type {
  ChattigoCredentialCreateRequest,
  ChattigoCredentialUpdateRequest,
  ChattigoCredentialFilters
} from '@/types/chattigoCredentials.types'

export function useChattigoCredentials() {
  const store = useChattigoCredentialsStore()
  const authStore = useAuthStore()
  const toast = useToast()

  // ============ Computed State ============

  const credentials = computed(() => store.credentials)
  const totalCredentials = computed(() => store.totalCredentials)
  const enabledCount = computed(() => store.enabledCount)
  const disabledCount = computed(() => store.disabledCount)
  const filteredCredentials = computed(() => store.filteredCredentials)
  const selectedCredential = computed(() => store.selectedCredential)
  const testResult = computed(() => store.testResult)
  const testingDid = computed(() => store.testingDid)

  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  // Dialog states
  const showCredentialDialog = computed(() => store.showCredentialDialog)
  const showDeleteDialog = computed(() => store.showDeleteDialog)
  const showTestDialog = computed(() => store.showTestDialog)
  const editingCredential = computed(() => store.editingCredential)
  const deletingCredential = computed(() => store.deletingCredential)
  const isEditing = computed(() => store.isEditingCredential)

  // Filters
  const filters = computed(() => store.filters)
  const hasFilters = computed(() => store.hasFilters)

  // ============ Helper ============

  function getOrgId(): string | null {
    return authStore.currentOrgId
  }

  // ============ Credentials CRUD ============

  /**
   * Fetch all credentials. Pass orgId to filter by organization.
   * By default fetches ALL credentials (admin global view).
   */
  async function fetchCredentials(orgId?: string) {
    store.setLoading(true)
    store.setError(null)

    try {
      // Don't filter by org - Chattigo credentials are a global admin resource
      const result = await chattigoCredentialsApi.list(orgId)
      store.setCredentials(result)
    } catch (err) {
      store.setError('Error al cargar credenciales de Chattigo')
      toast.error('Error al cargar credenciales de Chattigo')
    } finally {
      store.setLoading(false)
    }
  }

  async function getCredential(did: string) {
    store.setLoading(true)
    try {
      const credential = await chattigoCredentialsApi.getByDid(did)
      store.selectCredential(credential)
      return credential
    } catch (err) {
      toast.error('Error al cargar credencial')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function createCredential(data: ChattigoCredentialCreateRequest) {
    store.setLoading(true)
    try {
      const credential = await chattigoCredentialsApi.create(data)
      store.addCredential(credential)
      store.closeCredentialDialog()
      toast.success('Credencial creada exitosamente')
      return credential
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string } } }
      const status = axiosError.response?.status
      const detail = axiosError.response?.data?.detail

      if (status === 409) {
        toast.error('Ya existe una credencial con este DID')
      } else if (status === 403) {
        toast.error('No tienes permisos para crear credenciales')
      } else if (status === 400) {
        toast.error(detail || 'Datos inválidos')
      } else {
        toast.error(detail || 'Error al crear credencial')
      }
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateCredential(did: string, data: ChattigoCredentialUpdateRequest) {
    store.setLoading(true)
    try {
      const credential = await chattigoCredentialsApi.update(did, data)
      store.updateCredential(credential)
      store.closeCredentialDialog()
      toast.success('Credencial actualizada exitosamente')
      return credential
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      const detail = axiosError.response?.data?.detail
      toast.error(detail || 'Error al actualizar credencial')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteCredential(did: string) {
    store.setLoading(true)
    try {
      await chattigoCredentialsApi.delete(did)
      store.removeCredential(did)
      store.closeDeleteDialog()
      toast.success('Credencial eliminada exitosamente')
      return true
    } catch (err) {
      toast.error('Error al eliminar credencial')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Test Connection ============

  async function testConnection(did: string) {
    store.setTestingDid(did)
    store.setLoading(true)
    try {
      const result = await chattigoCredentialsApi.test(did)
      store.setTestResult(result)
      if (result.success) {
        toast.success('Conexión exitosa con Chattigo')
      } else {
        toast.warn(result.message || 'Error en la conexión')
      }
      return result
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      const message = axiosError.response?.data?.detail || 'Error al probar conexión'
      store.setTestResult({
        success: false,
        message,
        error_detail: message
      })
      toast.error(message)
      return null
    } finally {
      store.setLoading(false)
      store.setTestingDid(null)
    }
  }

  // ============ Filter Actions ============

  function setFilters(newFilters: Partial<ChattigoCredentialFilters>) {
    store.setFilters(newFilters)
  }

  function clearFilters() {
    store.clearFilters()
  }

  return {
    // State
    credentials,
    totalCredentials,
    enabledCount,
    disabledCount,
    filteredCredentials,
    selectedCredential,
    testResult,
    testingDid,
    isLoading,
    error,

    // Dialog states
    showCredentialDialog,
    showDeleteDialog,
    showTestDialog,
    editingCredential,
    deletingCredential,
    isEditing,

    // Filters
    filters,
    hasFilters,

    // CRUD operations
    fetchCredentials,
    getCredential,
    createCredential,
    updateCredential,
    deleteCredential,
    testConnection,

    // Filter operations
    setFilters,
    clearFilters,

    // Store actions (passthrough)
    selectCredential: store.selectCredential,
    openCredentialDialog: store.openCredentialDialog,
    closeCredentialDialog: store.closeCredentialDialog,
    openDeleteDialog: store.openDeleteDialog,
    closeDeleteDialog: store.closeDeleteDialog,
    openTestDialog: store.openTestDialog,
    closeTestDialog: store.closeTestDialog,
    clearTestResult: store.clearTestResult
  }
}
