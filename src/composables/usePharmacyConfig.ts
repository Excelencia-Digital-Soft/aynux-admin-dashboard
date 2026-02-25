import { computed, ref } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { pharmacyConfigApi } from '@/api/pharmacyConfig.api'
import { useToast } from '@/composables/useToast'
import type {
  PharmacyConfigCreateRequest,
  PharmacyConfigUpdateRequest,
  PharmacyTimelineFilters,
  SummarizeEvent
} from '@/types/pharmacyConfig.types'

export function usePharmacyConfig() {
  const store = usePharmacyStore()
  const toast = useToast()

  // ============ Computed State ============

  const pharmacies = computed(() => store.pharmacies)
  const totalPharmacies = computed(() => store.totalPharmacies)
  const selectedPharmacy = computed(() => store.selectedPharmacy)
  const pharmacyStats = computed(() => store.pharmacyStats)

  const customers = computed(() => store.customers)
  const totalCustomers = computed(() => store.totalCustomers)
  const selectedCustomer = computed(() => store.selectedCustomer)
  const selectedCustomers = computed(() => store.selectedCustomers)

  const summarizeProgress = computed(() => store.summarizeProgress)

  const messages = computed(() => store.messages)
  const totalMessages = computed(() => store.totalMessages)
  const conversation = computed(() => store.conversation)

  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  // Dialog states
  const showPharmacyDialog = computed(() => store.showPharmacyDialog)
  const showDeleteDialog = computed(() => store.showDeleteDialog)
  const showConversationDialog = computed(() => store.showConversationDialog)
  const editingPharmacy = computed(() => store.editingPharmacy)
  const deletingPharmacy = computed(() => store.deletingPharmacy)
  const isEditing = computed(() => store.isEditingPharmacy)

  // Pagination
  const pharmacyPage = computed(() => store.pharmacyPage)
  const pharmacyPageSize = computed(() => store.pharmacyPageSize)
  const customerPage = computed(() => store.customerPage)
  const customerPageSize = computed(() => store.customerPageSize)
  const timelinePage = computed(() => store.timelinePage)
  const timelinePageSize = computed(() => store.timelinePageSize)

  // Filters
  const pharmacyFilters = computed(() => store.pharmacyFilters)
  const customerFilters = computed(() => store.customerFilters)
  const timelineFilters = computed(() => store.timelineFilters)
  const hasTimelineFilters = computed(() => store.hasTimelineFilters)

  // ============ Pharmacy CRUD ============

  async function fetchPharmacies(organizationId?: string) {
    store.setLoading(true)
    store.setError(null)

    try {
      const result = await pharmacyConfigApi.list({
        page: store.pharmacyPage,
        pageSize: store.pharmacyPageSize,
        search: store.pharmacyFilters.search,
        mpEnabled: store.pharmacyFilters.mpEnabled,
        organizationId
      })
      store.setPharmacies(result.pharmacies, result.total)
    } catch (err) {
      store.setError('Error al cargar farmacias')
      toast.error('Error al cargar farmacias')
    } finally {
      store.setLoading(false)
    }
  }

  async function getPharmacy(pharmacyId: string) {
    store.setLoading(true)
    try {
      const pharmacy = await pharmacyConfigApi.getById(pharmacyId)
      store.selectPharmacy(pharmacy)
      return pharmacy
    } catch (err) {
      toast.error('Error al cargar farmacia')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function createPharmacy(data: PharmacyConfigCreateRequest) {
    store.setLoading(true)
    try {
      const pharmacy = await pharmacyConfigApi.create(data)
      store.addPharmacy(pharmacy)
      store.closePharmacyDialog()
      toast.success('Farmacia creada exitosamente')
      return pharmacy
    } catch (err: unknown) {
      // Enhanced error handling with specific messages
      const axiosError = err as { response?: { status?: number; data?: { detail?: string } } }
      const status = axiosError.response?.status
      const detail = axiosError.response?.data?.detail

      if (status === 403) {
        toast.error('No tienes permisos para crear farmacias en esta organización')
      } else if (status === 404) {
        toast.error('Organización no encontrada')
      } else if (status === 400) {
        toast.error(detail || 'Datos inválidos')
      } else {
        toast.error(detail || 'Error al crear farmacia')
      }
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updatePharmacy(pharmacyId: string, data: PharmacyConfigUpdateRequest) {
    store.setLoading(true)
    try {
      const pharmacy = await pharmacyConfigApi.update(pharmacyId, data)
      store.updatePharmacy(pharmacy)
      store.closePharmacyDialog()
      toast.success('Farmacia actualizada exitosamente')
      return pharmacy
    } catch (err) {
      toast.error('Error al actualizar farmacia')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deletePharmacy(pharmacyId: string) {
    store.setLoading(true)
    try {
      await pharmacyConfigApi.delete(pharmacyId)
      store.removePharmacy(pharmacyId)
      store.closeDeleteDialog()
      toast.success('Farmacia eliminada exitosamente')
      return true
    } catch (err) {
      toast.error('Error al eliminar farmacia')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Pharmacy Statistics ============

  async function fetchPharmacyStats(pharmacyId?: string) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId) return

    try {
      const stats = await pharmacyConfigApi.getStats(targetId)
      store.setPharmacyStats(stats)
    } catch (err) {
      console.error('Error fetching pharmacy stats:', err)
    }
  }

  // ============ Customers ============

  async function fetchCustomers(pharmacyId?: string) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId) return

    store.setLoading(true)
    try {
      const result = await pharmacyConfigApi.getCustomers(targetId, {
        page: store.customerPage,
        pageSize: store.customerPageSize,
        search: store.customerFilters.search
      })
      store.setCustomers(result.customers, result.total)
    } catch (err) {
      toast.error('Error al cargar clientes')
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Timeline ============

  async function fetchTimeline(pharmacyId?: string, filters?: PharmacyTimelineFilters) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId) return

    store.setLoading(true)
    try {
      const result = await pharmacyConfigApi.getTimeline(targetId, {
        page: store.timelinePage,
        pageSize: store.timelinePageSize,
        filters: filters || store.timelineFilters
      })
      store.setMessages(result.messages, result.total)
    } catch (err) {
      toast.error('Error al cargar mensajes')
    } finally {
      store.setLoading(false)
    }
  }

  async function loadMoreTimeline(pharmacyId?: string) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId) return

    const nextPage = store.timelinePage + 1
    store.setTimelinePage(nextPage)

    try {
      const result = await pharmacyConfigApi.getTimeline(targetId, {
        page: nextPage,
        pageSize: store.timelinePageSize,
        filters: store.timelineFilters
      })
      store.appendMessages(result.messages)
    } catch (err) {
      toast.error('Error al cargar mas mensajes')
    }
  }

  // ============ Conversation ============

  async function fetchConversation(
    conversationId: string,
    pharmacyId?: string,
    limit = 50,
    offset = 0
  ) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId) return

    store.setLoading(true)
    try {
      const conversation = await pharmacyConfigApi.getConversation(
        targetId,
        conversationId,
        { limit, offset }
      )
      store.setConversation(conversation)
      return conversation
    } catch (err) {
      toast.error('Error al cargar conversacion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Convenience Methods ============

  async function selectAndLoadPharmacy(pharmacyId: string) {
    const pharmacy = await getPharmacy(pharmacyId)
    if (pharmacy) {
      await Promise.all([fetchPharmacyStats(pharmacyId), fetchCustomers(pharmacyId)])
    }
    return pharmacy
  }

  async function openCustomerConversation(conversationId: string, pharmacyId?: string) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId) return

    const customer = store.customers.find(c => c.conversation_id === conversationId)
    if (customer) {
      store.openConversationDialog(customer)
      await fetchConversation(conversationId, targetId)
    }
  }

  async function deleteSelectedConversations(pharmacyId?: string) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId || store.selectedCustomers.length === 0) return false

    store.setLoading(true)
    const conversationIds = store.selectedCustomers.map(c => c.conversation_id)

    try {
      const result = await pharmacyConfigApi.deleteConversations(targetId, conversationIds)
      store.removeCustomers(result.deleted_conversation_ids)
      toast.success(`${result.deleted_count} conversaciones eliminadas`)
      return true
    } catch (err) {
      toast.error('Error al eliminar conversaciones')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  const summarizeAbortController = ref<AbortController | null>(null)

  async function summarizeSelectedConversations(pharmacyId?: string) {
    const targetId = pharmacyId || store.selectedPharmacy?.id
    if (!targetId || store.selectedCustomers.length === 0) return false

    const conversationIds = store.selectedCustomers
      .filter(c => !c.rolling_summary)
      .map(c => c.conversation_id)

    if (conversationIds.length === 0) {
      toast.info('Todas las conversaciones seleccionadas ya tienen resumen')
      return true
    }

    store.setSummarizeProgress({
      total: conversationIds.length,
      isRunning: true,
      current: 0
    })

    summarizeAbortController.value = new AbortController()

    try {
      await pharmacyConfigApi.summarizeStream(
        targetId,
        conversationIds,
        (event: SummarizeEvent) => {
          if (event.type === 'progress') {
            store.setSummarizeProgress({
              current: event.current,
              currentConversationId: event.conversation_id
            })
          } else if (event.type === 'summary') {
            store.updateCustomerSummary(event.conversation_id, event.summary)
            toast.success(`Resumen generado para ${event.conversation_id.slice(0, 8)}...`)
          } else if (event.type === 'error') {
            toast.error(`Error en ${event.conversation_id.slice(0, 8)}...: ${event.error}`)
          } else if (event.type === 'done') {
            store.resetSummarizeProgress()
            toast.success(`${event.total} resúmenes generados`)
          }
        },
        summarizeAbortController.value.signal
      )
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        toast.info('Generación de resúmenes cancelada')
      } else {
        toast.error('Error al generar resúmenes')
      }
      store.resetSummarizeProgress()
      return false
    }
  }

  function cancelSummarize() {
    if (summarizeAbortController.value) {
      summarizeAbortController.value.abort()
      summarizeAbortController.value = null
    }
  }

  return {
    // State
    pharmacies,
    totalPharmacies,
    selectedPharmacy,
    pharmacyStats,
    customers,
    totalCustomers,
    selectedCustomer,
    selectedCustomers,
    messages,
    totalMessages,
    conversation,
    isLoading,
    error,
    summarizeProgress,

    // Dialog states
    showPharmacyDialog,
    showDeleteDialog,
    showConversationDialog,
    editingPharmacy,
    deletingPharmacy,
    isEditing,

    // Pagination
    pharmacyPage,
    pharmacyPageSize,
    customerPage,
    customerPageSize,
    timelinePage,
    timelinePageSize,

    // Filters
    pharmacyFilters,
    customerFilters,
    timelineFilters,
    hasTimelineFilters,

    // Pharmacy CRUD
    fetchPharmacies,
    getPharmacy,
    createPharmacy,
    updatePharmacy,
    deletePharmacy,
    fetchPharmacyStats,

    // Customers
    fetchCustomers,

    // Timeline
    fetchTimeline,
    loadMoreTimeline,

    // Conversation
    fetchConversation,

    // Convenience
    selectAndLoadPharmacy,
    openCustomerConversation,

    // Bulk actions
    deleteSelectedConversations,
    summarizeSelectedConversations,
    cancelSummarize,

    // Store actions (passthrough)
    selectPharmacy: store.selectPharmacy,
    setPharmacyPage: store.setPharmacyPage,
    setPharmacyPageSize: store.setPharmacyPageSize,
    setPharmacyFilters: store.setPharmacyFilters,
    setCustomerPage: store.setCustomerPage,
    setCustomerPageSize: store.setCustomerPageSize,
    setCustomerFilters: store.setCustomerFilters,
    setTimelinePage: store.setTimelinePage,
    setTimelinePageSize: store.setTimelinePageSize,
    setTimelineFilters: store.setTimelineFilters,
    clearTimelineFilters: store.clearTimelineFilters,
    openPharmacyDialog: store.openPharmacyDialog,
    closePharmacyDialog: store.closePharmacyDialog,
    openDeleteDialog: store.openDeleteDialog,
    closeDeleteDialog: store.closeDeleteDialog,
    openConversationDialog: store.openConversationDialog,
    closeConversationDialog: store.closeConversationDialog,
    setSelectedCustomers: store.setSelectedCustomers,
    toggleCustomerSelection: store.toggleCustomerSelection,
    selectAllCustomers: store.selectAllCustomers,
    clearCustomerSelection: store.clearCustomerSelection
  }
}
