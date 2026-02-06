/**
 * Pinia store for institution conversation history state management.
 */

import { defineStore } from 'pinia'
import type {
  InstitutionCustomer,
  InstitutionMessage,
  InstitutionConversation,
  InstitutionConversationStats,
  InstitutionTimelineFilters
} from '@/types/institutionConversation.types'

export interface InstitutionConversationState {
  customers: InstitutionCustomer[]
  totalCustomers: number

  messages: InstitutionMessage[]
  totalMessages: number

  conversation: InstitutionConversation | null
  stats: InstitutionConversationStats | null

  isLoading: boolean
  error: string | null

  customerPage: number
  customerPageSize: number
  timelinePage: number
  timelinePageSize: number

  customerFilters: { search?: string }
  timelineFilters: InstitutionTimelineFilters

  showConversationDialog: boolean
  selectedCustomer: InstitutionCustomer | null
}

export const useInstitutionConversationStore = defineStore('institutionConversation', {
  state: (): InstitutionConversationState => ({
    customers: [],
    totalCustomers: 0,
    messages: [],
    totalMessages: 0,
    conversation: null,
    stats: null,
    isLoading: false,
    error: null,
    customerPage: 1,
    customerPageSize: 25,
    timelinePage: 1,
    timelinePageSize: 50,
    customerFilters: {},
    timelineFilters: {},
    showConversationDialog: false,
    selectedCustomer: null
  }),

  getters: {
    hasTimelineFilters(): boolean {
      const f = this.timelineFilters
      return !!(f.start_date || f.end_date || f.sender_type || f.user_phone || f.search)
    }
  },

  actions: {
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    setCustomers(customers: InstitutionCustomer[], total: number) {
      this.customers = customers
      this.totalCustomers = total
    },

    setMessages(messages: InstitutionMessage[], total: number) {
      this.messages = messages
      this.totalMessages = total
    },

    appendMessages(messages: InstitutionMessage[]) {
      this.messages = [...this.messages, ...messages]
    },

    setConversation(conversation: InstitutionConversation | null) {
      this.conversation = conversation
    },

    setStats(stats: InstitutionConversationStats | null) {
      this.stats = stats
    },

    openConversationDialog(customer: InstitutionCustomer) {
      this.selectedCustomer = customer
      this.showConversationDialog = true
    },

    closeConversationDialog() {
      this.showConversationDialog = false
      this.selectedCustomer = null
      this.conversation = null
    },

    setCustomerPage(page: number) {
      this.customerPage = page
    },

    setCustomerPageSize(size: number) {
      this.customerPageSize = size
      this.customerPage = 1
    },

    setTimelinePage(page: number) {
      this.timelinePage = page
    },

    setTimelinePageSize(size: number) {
      this.timelinePageSize = size
      this.timelinePage = 1
    },

    setCustomerFilters(filters: Partial<InstitutionConversationState['customerFilters']>) {
      this.customerFilters = { ...this.customerFilters, ...filters }
      this.customerPage = 1
    },

    setTimelineFilters(filters: Partial<InstitutionTimelineFilters>) {
      this.timelineFilters = { ...this.timelineFilters, ...filters }
      this.timelinePage = 1
    },

    clearTimelineFilters() {
      this.timelineFilters = {}
      this.timelinePage = 1
    }
  }
})
