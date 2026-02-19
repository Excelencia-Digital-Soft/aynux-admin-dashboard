/**
 * API client for TenantInstitutionConfig management.
 *
 * Provides CRUD operations for institution configurations.
 * All endpoints require organization membership.
 */

import apiClient from './index'
import type {
  TenantInstitutionConfig,
  InstitutionConfigCreateRequest,
  InstitutionConfigUpdateRequest,
  InstitutionConfigSecretsRequest,
  InstitutionConfigListResponse,
  InstitutionConfigListParams
} from '@/types/tenantInstitutionConfig.types'

const BASE_URL = '/admin/organizations'

class TenantInstitutionConfigApi {
  /**
   * List institution configurations for an organization.
   *
   * @param orgId - Organization UUID
   * @param params - Optional filter/pagination parameters
   * @returns List response with items and counts
   */
  async list(
    orgId: string,
    params: InstitutionConfigListParams = {}
  ): Promise<InstitutionConfigListResponse> {
    const { data } = await apiClient.get<InstitutionConfigListResponse>(
      `${BASE_URL}/${orgId}/institution-configs`,
      {
        params: {
          page: params.page || 1,
          page_size: params.page_size || 25,
          institution_type: params.institution_type,
          domain_key: params.domain_key,
          search: params.search,
          enabled_only: params.enabled_only
        }
      }
    )
    return data
  }

  /**
   * Get a single institution configuration.
   *
   * @param orgId - Organization UUID
   * @param configId - Institution config UUID
   * @returns Institution configuration
   */
  async getById(orgId: string, configId: string): Promise<TenantInstitutionConfig> {
    const { data } = await apiClient.get<TenantInstitutionConfig>(
      `${BASE_URL}/${orgId}/institution-configs/${configId}`
    )
    return data
  }

  /**
   * Create a new institution configuration.
   *
   * @param orgId - Organization UUID
   * @param createData - Institution configuration data
   * @returns Created institution configuration
   */
  async create(
    orgId: string,
    createData: InstitutionConfigCreateRequest
  ): Promise<TenantInstitutionConfig> {
    const { data } = await apiClient.post<TenantInstitutionConfig>(
      `${BASE_URL}/${orgId}/institution-configs`,
      createData
    )
    return data
  }

  /**
   * Update an institution configuration (partial update).
   *
   * @param orgId - Organization UUID
   * @param configId - Institution config UUID
   * @param updateData - Fields to update
   * @returns Updated institution configuration
   */
  async update(
    orgId: string,
    configId: string,
    updateData: InstitutionConfigUpdateRequest
  ): Promise<TenantInstitutionConfig> {
    const { data } = await apiClient.patch<TenantInstitutionConfig>(
      `${BASE_URL}/${orgId}/institution-configs/${configId}`,
      updateData
    )
    return data
  }

  /**
   * Delete an institution configuration.
   *
   * @param orgId - Organization UUID
   * @param configId - Institution config UUID
   */
  async delete(orgId: string, configId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${orgId}/institution-configs/${configId}`)
  }

  /**
   * Toggle enabled/disabled status.
   *
   * @param orgId - Organization UUID
   * @param configId - Institution config UUID
   * @returns Updated institution configuration
   */
  async toggle(orgId: string, configId: string): Promise<TenantInstitutionConfig> {
    const { data } = await apiClient.post<TenantInstitutionConfig>(
      `${BASE_URL}/${orgId}/institution-configs/${configId}/toggle`
    )
    return data
  }

  /**
   * Fetch available specialties from HCWeb SOAP API.
   *
   * @param orgId - Organization UUID
   * @param configId - Institution config UUID
   * @returns List of specialties with id and name
   */
  async fetchSpecialties(
    orgId: string,
    configId: string
  ): Promise<{ id: string; name: string }[]> {
    const { data } = await apiClient.get<{ id: string; name: string }[]>(
      `${BASE_URL}/${orgId}/institution-configs/${configId}/specialties`
    )
    return data
  }

  /**
   * Update encrypted secrets (write-only).
   *
   * NOTE: Secrets are never returned in API responses.
   *
   * @param orgId - Organization UUID
   * @param configId - Institution config UUID
   * @param secrets - Secret values to update
   * @returns Success message
   */
  async updateSecrets(
    orgId: string,
    configId: string,
    secrets: InstitutionConfigSecretsRequest
  ): Promise<{ message: string; config_id: string; has_secrets: boolean }> {
    const { data } = await apiClient.patch<{
      message: string
      config_id: string
      has_secrets: boolean
    }>(`${BASE_URL}/${orgId}/institution-configs/${configId}/secrets`, secrets)
    return data
  }
}

export const tenantInstitutionConfigApi = new TenantInstitutionConfigApi()
