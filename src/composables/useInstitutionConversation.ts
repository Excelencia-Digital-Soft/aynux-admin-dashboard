/**
 * Composable for institution conversation history management.
 */

import { storeToRefs } from 'pinia'
import { useInstitutionConversationStore } from '@/stores/institutionConversation.store'
import { institutionConversationApi } from '@/api/institutionConversation.api'
import { useToast } from '@/composables/useToast'
import type { InstitutionTimelineFilters } from '@/types/institutionConversation.types'

export function useInstitutionConversation() {
  const store = useInstitutionConversationStore()
  const toast = useToast()

  const {
    customers,
    totalCustomers,
    messages,
    totalMessages,
    conversation,
    stats,
    isLoading,
    error,
    showConversationDialog,
    selectedCustomer
  } = storeToRefs(store)

  async function fetchCustomers(orgId: string, configId: string) {
    store.setLoading(true)
    try {
      const result = await institutionConversationApi.getCustomers(orgId, configId, {
        page: store.customerPage,
        pageSize: store.customerPageSize,
        search: store.customerFilters.search
      })
      store.setCustomers(result.customers, result.total)
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchStats(orgId: string, configId: string) {
    try {
      const result = await institutionConversationApi.getStats(orgId, configId)
      store.setStats(result)
    } catch {
      // Stats are non-critical, fail silently
    }
  }

  async function fetchTimeline(
    orgId: string,
    configId: string,
    filters?: InstitutionTimelineFilters
  ) {
    store.setLoading(true)
    try {
      const result = await institutionConversationApi.getTimeline(orgId, configId, {
        page: store.timelinePage,
        pageSize: store.timelinePageSize,
        filters: filters || store.timelineFilters
      })
      store.setMessages(result.messages, result.total)
    } catch {
      toast.error('Error al cargar mensajes')
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchConversation(
    orgId: string,
    configId: string,
    conversationId: string,
    limit = 50,
    offset = 0
  ) {
    store.setLoading(true)
    try {
      const result = await institutionConversationApi.getConversation(
        orgId,
        configId,
        conversationId,
        { limit, offset }
      )
      store.setConversation(result)
      return result
    } catch {
      toast.error('Error al cargar conversacion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  function setCustomerPage(page: number) {
    store.setCustomerPage(page)
  }

  function setCustomerFilters(filters: { search?: string }) {
    store.setCustomerFilters(filters)
  }

  function setTimelinePage(page: number) {
    store.setTimelinePage(page)
  }

  function setTimelineFilters(filters: Partial<InstitutionTimelineFilters>) {
    store.setTimelineFilters(filters)
  }

  return {
    customers,
    totalCustomers,
    messages,
    totalMessages,
    conversation,
    stats,
    isLoading,
    error,
    showConversationDialog,
    selectedCustomer,
    fetchCustomers,
    fetchStats,
    fetchTimeline,
    fetchConversation,
    setCustomerPage,
    setCustomerFilters,
    setTimelinePage,
    setTimelineFilters,
    store
  }
}
