/**
 * Response Configs API Client
 * Multi-domain, multi-tenant response configuration management
 */

import api from './index'
import type {
  ResponseConfig,
  ResponseConfigCreate,
  ResponseConfigUpdate,
  ResponseConfigListResponse,
  ResponseConfigFilterOptions,
  DomainListResponse,
  CacheStatsResponse,
  SeedResponse,
  BulkImportResponse,
  CacheInvalidateResponse,
  CacheWarmResponse
} from '@/types/responseConfigs.types'

const BASE_PATH = '/admin/response-configs'

/**
 * Response Configs API
 */
export const responseConfigsApi = {
  // =========================================================================
  // Config CRUD Operations
  // =========================================================================

  /**
   * List all response configs for a domain
   */
  async listConfigs(
    organizationId: string,
    domainKey: string = 'pharmacy',
    options: ResponseConfigFilterOptions = {}
  ): Promise<ResponseConfig[]> {
    const params = new URLSearchParams()
    params.append('organization_id', organizationId)
    params.append('domain_key', domainKey)

    if (options.enabled_only !== undefined) {
      params.append('enabled_only', String(options.enabled_only))
    }

    const url = `${BASE_PATH}?${params.toString()}`
    const response = await api.get<ResponseConfigListResponse>(url)
    return response.data.configs
  },

  /**
   * Get a single config by ID
   */
  async getConfig(configId: string): Promise<ResponseConfig> {
    const response = await api.get<ResponseConfig>(`${BASE_PATH}/${configId}`)
    return response.data
  },

  /**
   * Get config by intent key
   */
  async getByIntent(
    intentKey: string,
    organizationId: string,
    domainKey: string = 'pharmacy'
  ): Promise<ResponseConfig | null> {
    try {
      const params = new URLSearchParams()
      params.append('organization_id', organizationId)
      params.append('domain_key', domainKey)

      const response = await api.get<ResponseConfig>(
        `${BASE_PATH}/by-intent/${intentKey}?${params.toString()}`
      )
      return response.data
    } catch {
      return null
    }
  },

  /**
   * Create a new response config
   */
  async createConfig(data: ResponseConfigCreate): Promise<ResponseConfig> {
    const response = await api.post<ResponseConfig>(BASE_PATH, data)
    return response.data
  },

  /**
   * Update an existing response config
   */
  async updateConfig(configId: string, data: ResponseConfigUpdate): Promise<ResponseConfig> {
    const response = await api.put<ResponseConfig>(`${BASE_PATH}/${configId}`, data)
    return response.data
  },

  /**
   * Delete a response config
   */
  async deleteConfig(configId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${configId}`)
  },

  // =========================================================================
  // Bulk Operations
  // =========================================================================

  /**
   * Bulk create response configs
   */
  async bulkCreate(
    organizationId: string,
    domainKey: string,
    configs: Omit<ResponseConfigCreate, 'organization_id' | 'domain_key'>[]
  ): Promise<BulkImportResponse> {
    const response = await api.post<BulkImportResponse>(`${BASE_PATH}/bulk`, {
      organization_id: organizationId,
      domain_key: domainKey,
      configs
    })
    return response.data
  },

  // =========================================================================
  // Seed Operations
  // =========================================================================

  /**
   * Seed default response configs for a domain
   */
  async seedDefaults(
    organizationId: string,
    domainKey: string = 'pharmacy',
    overwrite: boolean = false
  ): Promise<SeedResponse> {
    const response = await api.post<SeedResponse>(`${BASE_PATH}/seed`, {
      organization_id: organizationId,
      domain_key: domainKey,
      overwrite
    })
    return response.data
  },

  // =========================================================================
  // Domain Operations
  // =========================================================================

  /**
   * Get list of domains with config statistics
   */
  async getDomains(organizationId: string): Promise<DomainListResponse> {
    const response = await api.get<DomainListResponse>(
      `${BASE_PATH}/domains?organization_id=${organizationId}`
    )
    return response.data
  },

  // =========================================================================
  // Cache Operations
  // =========================================================================

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStatsResponse> {
    const response = await api.get<CacheStatsResponse>(`${BASE_PATH}/cache/stats`)
    return response.data
  },

  /**
   * Invalidate cache for organization/domain
   */
  async invalidateCache(
    organizationId?: string,
    domainKey?: string
  ): Promise<CacheInvalidateResponse> {
    const response = await api.post<CacheInvalidateResponse>(`${BASE_PATH}/cache/invalidate`, {
      organization_id: organizationId || null,
      domain_key: domainKey || null
    })
    return response.data
  },

  /**
   * Warm cache for organization/domain
   */
  async warmCache(
    organizationId: string,
    domainKey: string = 'pharmacy'
  ): Promise<CacheWarmResponse> {
    const response = await api.post<CacheWarmResponse>(`${BASE_PATH}/cache/warm`, {
      organization_id: organizationId,
      domain_key: domainKey
    })
    return response.data
  },

  // =========================================================================
  // Export Operations
  // =========================================================================

  /**
   * Export all configs for a domain (returns configs for download)
   */
  async exportConfigs(
    organizationId: string,
    domainKey: string = 'pharmacy'
  ): Promise<ResponseConfig[]> {
    return this.listConfigs(organizationId, domainKey, {})
  }
}

export default responseConfigsApi
