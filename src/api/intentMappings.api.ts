// =============================================================================
// Intent Mappings API - CRUD for core.intent_agent_mappings table
// =============================================================================

import apiClient from './index'
import type {
  IntentMapping,
  IntentMappingListResponse,
  IntentMappingCreate,
  IntentMappingUpdate,
  SeedIntentsResponse
} from '@/types/intentMappings.types'

class IntentMappingsApi {
  private readonly basePath = '/admin/intent-configs'

  /**
   * List all intent mappings for an organization
   */
  async list(organizationId: string): Promise<IntentMappingListResponse> {
    const response = await apiClient.get(`${this.basePath}/mappings`, {
      params: { organization_id: organizationId }
    })
    return response.data
  }

  /**
   * Get a single intent mapping by ID
   */
  async getById(id: string, organizationId: string): Promise<IntentMapping> {
    const response = await apiClient.get(`${this.basePath}/mappings/${id}`, {
      params: { organization_id: organizationId }
    })
    return response.data
  }

  /**
   * Create a new intent mapping
   */
  async create(data: IntentMappingCreate, organizationId: string): Promise<IntentMapping> {
    const response = await apiClient.post(`${this.basePath}/mappings`, data, {
      params: { organization_id: organizationId }
    })
    return response.data
  }

  /**
   * Update an existing intent mapping
   */
  async update(
    id: string,
    data: IntentMappingUpdate,
    organizationId: string
  ): Promise<IntentMapping> {
    const response = await apiClient.put(`${this.basePath}/mappings/${id}`, data, {
      params: { organization_id: organizationId }
    })
    return response.data
  }

  /**
   * Delete an intent mapping (will fail for system intents)
   */
  async delete(id: string, organizationId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/mappings/${id}`, {
      params: { organization_id: organizationId }
    })
  }

  /**
   * Seed intents from builtin defaults
   */
  async seedIntents(organizationId: string): Promise<SeedIntentsResponse> {
    const response = await apiClient.post(`${this.basePath}/seed-intents`, null, {
      params: { organization_id: organizationId }
    })
    return response.data
  }

  /**
   * Invalidate the AgentConfigService cache (triggers reload on next access)
   */
  async reloadConfigCache(): Promise<void> {
    await apiClient.post('/admin/agents/reload-config-cache')
  }
}

export const intentMappingsApi = new IntentMappingsApi()
export default intentMappingsApi
