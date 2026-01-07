/**
 * Domain API
 * API client for centralized domain management
 */

import { apiClient } from './index'
import type {
  Domain,
  DomainCreateRequest,
  DomainUpdateRequest,
  DomainListResponse
} from '@/types/domain.types'

export const domainApi = {
  /**
   * List all domains
   * @param enabledOnly - If true, only return enabled domains
   */
  async list(enabledOnly = false): Promise<DomainListResponse> {
    const params = enabledOnly ? { enabled_only: true } : {}
    const response = await apiClient.get<DomainListResponse>('/admin/domains', { params })
    return response.data
  },

  /**
   * Get a domain by ID
   */
  async get(id: string): Promise<Domain> {
    const response = await apiClient.get<Domain>(`/admin/domains/${id}`)
    return response.data
  },

  /**
   * Create a new domain
   */
  async create(data: DomainCreateRequest): Promise<Domain> {
    const response = await apiClient.post<Domain>('/admin/domains', data)
    return response.data
  },

  /**
   * Update a domain
   */
  async update(id: string, data: DomainUpdateRequest): Promise<Domain> {
    const response = await apiClient.put<Domain>(`/admin/domains/${id}`, data)
    return response.data
  },

  /**
   * Toggle a domain's enabled status
   */
  async toggle(id: string): Promise<Domain> {
    const response = await apiClient.post<Domain>(`/admin/domains/${id}/toggle`)
    return response.data
  },

  /**
   * Delete a domain
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/domains/${id}`)
  }
}
