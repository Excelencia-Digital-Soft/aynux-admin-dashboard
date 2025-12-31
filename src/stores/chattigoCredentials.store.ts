import { defineStore } from 'pinia'
import type {
  ChattigoCredential,
  ChattigoTestResponse,
  ChattigoCredentialFilters
} from '@/types/chattigoCredentials.types'

interface ChattigoCredentialsState {
  // Credentials data
  credentials: ChattigoCredential[]
  totalCredentials: number
  enabledCount: number
  disabledCount: number
  selectedCredential: ChattigoCredential | null

  // Test results
  testResult: ChattigoTestResponse | null
  testingDid: string | null

  // UI State
  isLoading: boolean
  error: string | null

  // Filters
  filters: ChattigoCredentialFilters

  // Dialogs
  showCredentialDialog: boolean
  showDeleteDialog: boolean
  showTestDialog: boolean
  editingCredential: ChattigoCredential | null
  deletingCredential: ChattigoCredential | null
}

export const useChattigoCredentialsStore = defineStore('chattigoCredentials', {
  state: (): ChattigoCredentialsState => ({
    credentials: [],
    totalCredentials: 0,
    enabledCount: 0,
    disabledCount: 0,
    selectedCredential: null,

    testResult: null,
    testingDid: null,

    isLoading: false,
    error: null,

    filters: {},

    showCredentialDialog: false,
    showDeleteDialog: false,
    showTestDialog: false,
    editingCredential: null,
    deletingCredential: null
  }),

  getters: {
    /**
     * Get enabled credentials
     */
    enabledCredentials(): ChattigoCredential[] {
      return this.credentials.filter(c => c.enabled)
    },

    /**
     * Get disabled credentials
     */
    disabledCredentials(): ChattigoCredential[] {
      return this.credentials.filter(c => !c.enabled)
    },

    /**
     * Check if editing a credential
     */
    isEditingCredential(): boolean {
      return this.editingCredential !== null
    },

    /**
     * Get filtered credentials
     */
    filteredCredentials(): ChattigoCredential[] {
      let result = [...this.credentials]

      const { search, enabled } = this.filters

      if (search) {
        const searchLower = search.toLowerCase()
        result = result.filter(
          c =>
            c.name.toLowerCase().includes(searchLower) ||
            c.did.includes(searchLower) ||
            c.bot_name.toLowerCase().includes(searchLower)
        )
      }

      if (enabled !== undefined) {
        result = result.filter(c => c.enabled === enabled)
      }

      return result
    },

    /**
     * Check if has active filters
     */
    hasFilters(): boolean {
      const f = this.filters
      return !!(f.search || f.enabled !== undefined)
    }
  },

  actions: {
    // ============ Credentials Actions ============

    setCredentials(credentials: ChattigoCredential[]) {
      this.credentials = credentials
      this.totalCredentials = credentials.length
      this.enabledCount = credentials.filter(c => c.enabled).length
      this.disabledCount = credentials.filter(c => !c.enabled).length
    },

    selectCredential(credential: ChattigoCredential | null) {
      this.selectedCredential = credential
    },

    addCredential(credential: ChattigoCredential) {
      this.credentials.unshift(credential)
      this.totalCredentials++
      if (credential.enabled) {
        this.enabledCount++
      } else {
        this.disabledCount++
      }
    },

    updateCredential(credential: ChattigoCredential) {
      const index = this.credentials.findIndex(c => c.did === credential.did)
      if (index >= 0) {
        const oldCredential = this.credentials[index]
        // Update enabled counts if status changed
        if (oldCredential.enabled !== credential.enabled) {
          if (credential.enabled) {
            this.enabledCount++
            this.disabledCount--
          } else {
            this.enabledCount--
            this.disabledCount++
          }
        }
        this.credentials[index] = credential
      }
      if (this.selectedCredential?.did === credential.did) {
        this.selectedCredential = credential
      }
    },

    removeCredential(did: string) {
      const credential = this.credentials.find(c => c.did === did)
      if (credential) {
        if (credential.enabled) {
          this.enabledCount--
        } else {
          this.disabledCount--
        }
      }
      this.credentials = this.credentials.filter(c => c.did !== did)
      this.totalCredentials--
      if (this.selectedCredential?.did === did) {
        this.selectedCredential = null
      }
    },

    // ============ Test Actions ============

    setTestResult(result: ChattigoTestResponse | null) {
      this.testResult = result
    },

    setTestingDid(did: string | null) {
      this.testingDid = did
    },

    clearTestResult() {
      this.testResult = null
      this.testingDid = null
    },

    // ============ UI Actions ============

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    // ============ Dialog Actions ============

    openCredentialDialog(credential: ChattigoCredential | null = null) {
      this.editingCredential = credential
      this.showCredentialDialog = true
    },

    closeCredentialDialog() {
      this.showCredentialDialog = false
      this.editingCredential = null
    },

    openDeleteDialog(credential: ChattigoCredential) {
      this.deletingCredential = credential
      this.showDeleteDialog = true
    },

    closeDeleteDialog() {
      this.showDeleteDialog = false
      this.deletingCredential = null
    },

    openTestDialog(credential: ChattigoCredential) {
      this.selectedCredential = credential
      this.showTestDialog = true
      this.testResult = null
    },

    closeTestDialog() {
      this.showTestDialog = false
      this.testResult = null
      this.testingDid = null
    },

    // ============ Filter Actions ============

    setFilters(filters: Partial<ChattigoCredentialFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {}
    },

    // ============ Reset ============

    reset() {
      this.$reset()
    }
  }
})
