import { defineStore } from 'pinia'
import type {
  PharmacyConfig,
  PharmacyCustomer,
  PharmacyMessage,
  PharmacyConversation,
  PharmacyStats,
  PharmacyTimelineFilters
} from '@/types/pharmacyConfig.types'

interface PharmacyState {
  // Pharmacy Configs
  pharmacies: PharmacyConfig[]
  totalPharmacies: number
  selectedPharmacy: PharmacyConfig | null
  pharmacyStats: PharmacyStats | null

  // Customers (for selected pharmacy)
  customers: PharmacyCustomer[]
  totalCustomers: number
  selectedCustomer: PharmacyCustomer | null

  // Messages/Timeline (for selected pharmacy)
  messages: PharmacyMessage[]
  totalMessages: number

  // Conversation (for selected customer)
  conversation: PharmacyConversation | null

  // UI State
  isLoading: boolean
  error: string | null

  // Pagination - Pharmacies
  pharmacyPage: number
  pharmacyPageSize: number

  // Pagination - Customers
  customerPage: number
  customerPageSize: number

  // Pagination - Timeline
  timelinePage: number
  timelinePageSize: number

  // Filters - Pharmacies
  pharmacyFilters: {
    search?: string
    mpEnabled?: boolean
  }

  // Filters - Customers
  customerFilters: {
    search?: string
  }

  // Filters - Timeline
  timelineFilters: PharmacyTimelineFilters

  // Dialogs
  showPharmacyDialog: boolean
  showDeleteDialog: boolean
  showConversationDialog: boolean
  editingPharmacy: PharmacyConfig | null
  deletingPharmacy: PharmacyConfig | null
}

export const usePharmacyStore = defineStore('pharmacy', {
  state: (): PharmacyState => ({
    pharmacies: [],
    totalPharmacies: 0,
    selectedPharmacy: null,
    pharmacyStats: null,

    customers: [],
    totalCustomers: 0,
    selectedCustomer: null,

    messages: [],
    totalMessages: 0,

    conversation: null,

    isLoading: false,
    error: null,

    pharmacyPage: 1,
    pharmacyPageSize: 25,

    customerPage: 1,
    customerPageSize: 25,

    timelinePage: 1,
    timelinePageSize: 50,

    pharmacyFilters: {},
    customerFilters: {},
    timelineFilters: {},

    showPharmacyDialog: false,
    showDeleteDialog: false,
    showConversationDialog: false,
    editingPharmacy: null,
    deletingPharmacy: null
  }),

  getters: {
    /**
     * Get pharmacies with MP enabled
     */
    mpEnabledPharmacies(): PharmacyConfig[] {
      return this.pharmacies.filter(p => p.mp_enabled)
    },

    /**
     * Get current pharmacy ID
     */
    currentPharmacyId(): string | null {
      return this.selectedPharmacy?.id || null
    },

    /**
     * Check if editing a pharmacy
     */
    isEditingPharmacy(): boolean {
      return this.editingPharmacy !== null
    },

    /**
     * Get user messages only
     */
    userMessages(): PharmacyMessage[] {
      return this.messages.filter(m => m.sender_type === 'user')
    },

    /**
     * Get assistant messages only
     */
    assistantMessages(): PharmacyMessage[] {
      return this.messages.filter(m => m.sender_type === 'assistant')
    },

    /**
     * Check if has active timeline filters
     */
    hasTimelineFilters(): boolean {
      const f = this.timelineFilters
      return !!(f.start_date || f.end_date || f.sender_type || f.user_phone || f.search)
    }
  },

  actions: {
    // ============ Pharmacy Config Actions ============

    setPharmacies(pharmacies: PharmacyConfig[], total: number) {
      this.pharmacies = pharmacies
      this.totalPharmacies = total
    },

    selectPharmacy(pharmacy: PharmacyConfig | null) {
      this.selectedPharmacy = pharmacy
      // Clear customer/message data when switching pharmacies
      if (pharmacy?.id !== this.selectedPharmacy?.id) {
        this.customers = []
        this.totalCustomers = 0
        this.selectedCustomer = null
        this.messages = []
        this.totalMessages = 0
        this.conversation = null
        this.pharmacyStats = null
      }
    },

    addPharmacy(pharmacy: PharmacyConfig) {
      this.pharmacies.unshift(pharmacy)
      this.totalPharmacies++
    },

    updatePharmacy(pharmacy: PharmacyConfig) {
      const index = this.pharmacies.findIndex(p => p.id === pharmacy.id)
      if (index >= 0) {
        this.pharmacies[index] = pharmacy
      }
      if (this.selectedPharmacy?.id === pharmacy.id) {
        this.selectedPharmacy = pharmacy
      }
    },

    removePharmacy(pharmacyId: string) {
      this.pharmacies = this.pharmacies.filter(p => p.id !== pharmacyId)
      this.totalPharmacies--
      if (this.selectedPharmacy?.id === pharmacyId) {
        this.selectedPharmacy = null
      }
    },

    setPharmacyStats(stats: PharmacyStats | null) {
      this.pharmacyStats = stats
    },

    // ============ Customer Actions ============

    setCustomers(customers: PharmacyCustomer[], total: number) {
      this.customers = customers
      this.totalCustomers = total
    },

    selectCustomer(customer: PharmacyCustomer | null) {
      this.selectedCustomer = customer
      if (!customer) {
        this.conversation = null
      }
    },

    // ============ Message/Timeline Actions ============

    setMessages(messages: PharmacyMessage[], total: number) {
      this.messages = messages
      this.totalMessages = total
    },

    appendMessages(messages: PharmacyMessage[]) {
      this.messages = [...this.messages, ...messages]
    },

    setConversation(conversation: PharmacyConversation | null) {
      this.conversation = conversation
    },

    // ============ UI Actions ============

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    // ============ Dialog Actions ============

    openPharmacyDialog(pharmacy: PharmacyConfig | null = null) {
      this.editingPharmacy = pharmacy
      this.showPharmacyDialog = true
    },

    closePharmacyDialog() {
      this.showPharmacyDialog = false
      this.editingPharmacy = null
    },

    openDeleteDialog(pharmacy: PharmacyConfig) {
      this.deletingPharmacy = pharmacy
      this.showDeleteDialog = true
    },

    closeDeleteDialog() {
      this.showDeleteDialog = false
      this.deletingPharmacy = null
    },

    openConversationDialog(customer: PharmacyCustomer) {
      this.selectedCustomer = customer
      this.showConversationDialog = true
    },

    closeConversationDialog() {
      this.showConversationDialog = false
      this.selectedCustomer = null
      this.conversation = null
    },

    // ============ Pagination Actions ============

    setPharmacyPage(page: number) {
      this.pharmacyPage = page
    },

    setPharmacyPageSize(size: number) {
      this.pharmacyPageSize = size
      this.pharmacyPage = 1
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

    // ============ Filter Actions ============

    setPharmacyFilters(filters: Partial<PharmacyState['pharmacyFilters']>) {
      this.pharmacyFilters = { ...this.pharmacyFilters, ...filters }
      this.pharmacyPage = 1
    },

    setCustomerFilters(filters: Partial<PharmacyState['customerFilters']>) {
      this.customerFilters = { ...this.customerFilters, ...filters }
      this.customerPage = 1
    },

    setTimelineFilters(filters: Partial<PharmacyTimelineFilters>) {
      this.timelineFilters = { ...this.timelineFilters, ...filters }
      this.timelinePage = 1
    },

    clearTimelineFilters() {
      this.timelineFilters = {}
      this.timelinePage = 1
    },

    resetAllFilters() {
      this.pharmacyFilters = {}
      this.customerFilters = {}
      this.timelineFilters = {}
      this.pharmacyPage = 1
      this.customerPage = 1
      this.timelinePage = 1
    }
  }
})
