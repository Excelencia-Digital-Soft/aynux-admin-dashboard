/**
 * Pinia store for TenantInstitutionConfig state management.
 *
 * Manages institution configuration list, pagination, filters,
 * and dialog states.
 */

import { defineStore } from 'pinia'
import type {
  TenantInstitutionConfig,
  InstitutionConfigListParams
} from '@/types/tenantInstitutionConfig.types'

interface InstitutionConfigState {
  // List state
  configs: TenantInstitutionConfig[]
  total: number
  enabledCount: number
  disabledCount: number

  // Pagination
  page: number
  pageSize: number

  // Filters
  filters: InstitutionConfigListParams

  // Loading states
  isLoading: boolean
  error: string | null

  // Dialog states
  showFormDialog: boolean
  showSecretsDialog: boolean
  editingConfig: TenantInstitutionConfig | null
  secretsConfigId: string | null
}

export const useTenantInstitutionConfigStore = defineStore('tenantInstitutionConfig', {
  state: (): InstitutionConfigState => ({
    // List state
    configs: [],
    total: 0,
    enabledCount: 0,
    disabledCount: 0,

    // Pagination
    page: 1,
    pageSize: 25,

    // Filters
    filters: {
      search: '',
      institution_type: undefined,
      enabled_only: false
    },

    // Loading states
    isLoading: false,
    error: null,

    // Dialog states
    showFormDialog: false,
    showSecretsDialog: false,
    editingConfig: null,
    secretsConfigId: null
  }),

  getters: {
    /**
     * Get config by ID from current list.
     */
    getConfigById: (state) => (id: string) => {
      return state.configs.find((c) => c.id === id)
    },

    /**
     * Check if we're in edit mode.
     */
    isEditing: (state) => state.editingConfig !== null,

    /**
     * Get total pages for pagination.
     */
    totalPages: (state) => Math.ceil(state.total / state.pageSize)
  },

  actions: {
    /**
     * Set configs list from API response.
     */
    setConfigs(
      configs: TenantInstitutionConfig[],
      total: number,
      enabledCount: number,
      disabledCount: number
    ) {
      this.configs = configs
      this.total = total
      this.enabledCount = enabledCount
      this.disabledCount = disabledCount
    },

    /**
     * Add a new config to the list.
     */
    addConfig(config: TenantInstitutionConfig) {
      this.configs.unshift(config)
      this.total++
      if (config.enabled) {
        this.enabledCount++
      } else {
        this.disabledCount++
      }
    },

    /**
     * Update an existing config in the list.
     */
    updateConfig(config: TenantInstitutionConfig) {
      const index = this.configs.findIndex((c) => c.id === config.id)
      if (index !== -1) {
        const wasEnabled = this.configs[index].enabled
        this.configs[index] = config

        // Update counts if enabled status changed
        if (wasEnabled !== config.enabled) {
          if (config.enabled) {
            this.enabledCount++
            this.disabledCount--
          } else {
            this.enabledCount--
            this.disabledCount++
          }
        }
      }
    },

    /**
     * Remove a config from the list.
     */
    removeConfig(id: string) {
      const index = this.configs.findIndex((c) => c.id === id)
      if (index !== -1) {
        const wasEnabled = this.configs[index].enabled
        this.configs.splice(index, 1)
        this.total--

        if (wasEnabled) {
          this.enabledCount--
        } else {
          this.disabledCount--
        }
      }
    },

    /**
     * Set loading state.
     */
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    /**
     * Set error message.
     */
    setError(error: string | null) {
      this.error = error
    },

    /**
     * Set current page.
     */
    setPage(page: number) {
      this.page = page
    },

    /**
     * Set page size.
     */
    setPageSize(size: number) {
      this.pageSize = size
      this.page = 1 // Reset to first page
    },

    /**
     * Set filters.
     */
    setFilters(filters: Partial<InstitutionConfigListParams>) {
      this.filters = { ...this.filters, ...filters }
      this.page = 1 // Reset to first page when filters change
    },

    /**
     * Clear all filters.
     */
    clearFilters() {
      this.filters = {
        search: '',
        institution_type: undefined,
        enabled_only: false
      }
      this.page = 1
    },

    /**
     * Open create dialog.
     */
    openCreateDialog() {
      this.editingConfig = null
      this.showFormDialog = true
    },

    /**
     * Open edit dialog with config.
     */
    openEditDialog(config: TenantInstitutionConfig) {
      this.editingConfig = config
      this.showFormDialog = true
    },

    /**
     * Close form dialog.
     */
    closeFormDialog() {
      this.showFormDialog = false
      this.editingConfig = null
    },

    /**
     * Open secrets dialog.
     */
    openSecretsDialog(configId: string) {
      this.secretsConfigId = configId
      this.showSecretsDialog = true
    },

    /**
     * Close secrets dialog.
     */
    closeSecretsDialog() {
      this.showSecretsDialog = false
      this.secretsConfigId = null
    },

    /**
     * Reset store to initial state.
     */
    $reset() {
      this.configs = []
      this.total = 0
      this.enabledCount = 0
      this.disabledCount = 0
      this.page = 1
      this.pageSize = 25
      this.filters = {
        search: '',
        institution_type: undefined,
        enabled_only: false
      }
      this.isLoading = false
      this.error = null
      this.showFormDialog = false
      this.showSecretsDialog = false
      this.editingConfig = null
      this.secretsConfigId = null
    }
  }
})
