/**
 * Intent Configs API - Manages intent routing configurations
 *
 * Endpoints:
 * - GET/POST/PUT/DELETE /admin/intent-configs/mappings
 * - GET/POST/PUT/DELETE /admin/intent-configs/flow-agents
 * - GET/POST/DELETE /admin/intent-configs/keywords
 * - POST /admin/intent-configs/test
 * - GET /admin/intent-configs/visualization
 * - POST /admin/intent-configs/seed
 * - GET/POST /admin/intent-configs/cache/*
 */

import { apiClient } from './index'
import type {
  AllConfigsResponse,
  CacheInvalidateResponse,
  CacheStatsResponse,
  FlowAgentConfig,
  FlowAgentConfigCreate,
  FlowAgentConfigListResponse,
  FlowAgentConfigUpdate,
  FlowVisualizationResponse,
  IntentAgentMapping,
  IntentAgentMappingCreate,
  IntentAgentMappingListResponse,
  IntentAgentMappingUpdate,
  IntentTestRequest,
  IntentTestResponse,
  KeywordAgentMappingBulkCreate,
  KeywordAgentMappingCreate,
  KeywordAgentMappingListResponse,
  KeywordAgentMapping,
  SeedRequest,
  SeedResponse,
} from '@/types/intentConfigs.types'

const BASE_URL = '/admin/intent-configs'

// =============================================================================
// Intent Agent Mappings
// =============================================================================

export const intentConfigsApi = {
  // List all intent-agent mappings
  async listMappings(
    organizationId: string,
    domainKey?: string | null,
    enabledOnly = false
  ): Promise<IntentAgentMappingListResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    if (domainKey) params.append('domain_key', domainKey)
    if (enabledOnly) params.append('enabled_only', 'true')
    const response = await apiClient.get(`${BASE_URL}/mappings?${params}`)
    return response.data
  },

  // Create a new mapping
  async createMapping(
    organizationId: string,
    data: IntentAgentMappingCreate
  ): Promise<IntentAgentMapping> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/mappings?${params}`, data)
    return response.data
  },

  // Get a specific mapping
  async getMapping(organizationId: string, mappingId: string): Promise<IntentAgentMapping> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.get(`${BASE_URL}/mappings/${mappingId}?${params}`)
    return response.data
  },

  // Update a mapping
  async updateMapping(
    organizationId: string,
    mappingId: string,
    data: IntentAgentMappingUpdate
  ): Promise<IntentAgentMapping> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.put(`${BASE_URL}/mappings/${mappingId}?${params}`, data)
    return response.data
  },

  // Delete a mapping
  async deleteMapping(organizationId: string, mappingId: string): Promise<void> {
    const params = new URLSearchParams({ organization_id: organizationId })
    await apiClient.delete(`${BASE_URL}/mappings/${mappingId}?${params}`)
  },

  // =============================================================================
  // Flow Agent Configs
  // =============================================================================

  // List all flow agent configs
  async listFlowAgents(
    organizationId: string,
    enabledOnly = false
  ): Promise<FlowAgentConfigListResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    if (enabledOnly) params.append('enabled_only', 'true')
    const response = await apiClient.get(`${BASE_URL}/flow-agents?${params}`)
    return response.data
  },

  // Create a new flow agent config
  async createFlowAgent(
    organizationId: string,
    data: FlowAgentConfigCreate
  ): Promise<FlowAgentConfig> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/flow-agents?${params}`, data)
    return response.data
  },

  // Update a flow agent config
  async updateFlowAgent(
    organizationId: string,
    agentKey: string,
    data: FlowAgentConfigUpdate
  ): Promise<FlowAgentConfig> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.put(`${BASE_URL}/flow-agents/${agentKey}?${params}`, data)
    return response.data
  },

  // Delete a flow agent config
  async deleteFlowAgent(organizationId: string, agentKey: string): Promise<void> {
    const params = new URLSearchParams({ organization_id: organizationId })
    await apiClient.delete(`${BASE_URL}/flow-agents/${agentKey}?${params}`)
  },

  // =============================================================================
  // Keyword Agent Mappings
  // =============================================================================

  // List all keyword mappings
  async listKeywords(
    organizationId: string,
    agentKey?: string | null,
    enabledOnly = false
  ): Promise<KeywordAgentMappingListResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    if (agentKey) params.append('agent_key', agentKey)
    if (enabledOnly) params.append('enabled_only', 'true')
    const response = await apiClient.get(`${BASE_URL}/keywords?${params}`)
    return response.data
  },

  // Create a new keyword mapping
  async createKeyword(
    organizationId: string,
    data: KeywordAgentMappingCreate
  ): Promise<KeywordAgentMapping> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/keywords?${params}`, data)
    return response.data
  },

  // Bulk create keywords
  async createKeywordsBulk(
    organizationId: string,
    data: KeywordAgentMappingBulkCreate
  ): Promise<KeywordAgentMappingListResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/keywords/bulk?${params}`, data)
    return response.data
  },

  // Delete a keyword mapping
  async deleteKeyword(organizationId: string, keywordId: string): Promise<void> {
    const params = new URLSearchParams({ organization_id: organizationId })
    await apiClient.delete(`${BASE_URL}/keywords/${keywordId}?${params}`)
  },

  // =============================================================================
  // Testing
  // =============================================================================

  // Test intent detection
  async testIntent(organizationId: string, data: IntentTestRequest): Promise<IntentTestResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/test?${params}`, data)
    return response.data
  },

  // =============================================================================
  // Visualization
  // =============================================================================

  // Get flow visualization data
  async getVisualization(organizationId: string): Promise<FlowVisualizationResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.get(`${BASE_URL}/visualization?${params}`)
    return response.data
  },

  // =============================================================================
  // Seed and Cache
  // =============================================================================

  // Seed from defaults
  async seed(organizationId: string, data: SeedRequest = {}): Promise<SeedResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/seed?${params}`, data)
    return response.data
  },

  // Get cache stats
  async getCacheStats(): Promise<CacheStatsResponse> {
    const response = await apiClient.get(`${BASE_URL}/cache/stats`)
    return response.data
  },

  // Invalidate cache
  async invalidateCache(organizationId: string): Promise<CacheInvalidateResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.post(`${BASE_URL}/cache/invalidate?${params}`)
    return response.data
  },

  // =============================================================================
  // Combined
  // =============================================================================

  // Get all configs
  async getAllConfigs(organizationId: string): Promise<AllConfigsResponse> {
    const params = new URLSearchParams({ organization_id: organizationId })
    const response = await apiClient.get(`${BASE_URL}/all?${params}`)
    return response.data
  },
}
