// =============================================================================
// Agent Catalog API - CRUD for core.agents table
// =============================================================================
// This is separate from agent.api.ts which handles YAML module configuration.
// These endpoints manage the database-driven agent catalog (LangGraph agents).
// =============================================================================

import apiClient from './index'
import type {
  AgentCatalogItem,
  AgentCatalogListResponse,
  AgentCatalogCreate,
  AgentCatalogUpdate,
  AgentCatalogFilters,
  SeedBuiltinResponse,
  BulkUpdateResponse
} from '@/types/agentCatalog.types'

class AgentCatalogApi {
  private readonly basePath = '/admin/agents'

  /**
   * List all agents with optional filtering
   */
  async list(filters: AgentCatalogFilters = {}): Promise<AgentCatalogListResponse> {
    const response = await apiClient.get(this.basePath, { params: filters })
    return response.data
  }

  /**
   * Get a single agent by ID
   */
  async getById(id: string): Promise<AgentCatalogItem> {
    const response = await apiClient.get(`${this.basePath}/${id}`)
    return response.data
  }

  /**
   * Create a new agent
   */
  async create(data: AgentCatalogCreate): Promise<AgentCatalogItem> {
    const response = await apiClient.post(this.basePath, data)
    return response.data
  }

  /**
   * Update an existing agent
   */
  async update(id: string, data: AgentCatalogUpdate): Promise<AgentCatalogItem> {
    const response = await apiClient.put(`${this.basePath}/${id}`, data)
    return response.data
  }

  /**
   * Delete an agent
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`)
  }

  /**
   * Toggle agent enabled status
   */
  async toggle(id: string): Promise<AgentCatalogItem> {
    const response = await apiClient.post(`${this.basePath}/${id}/toggle`)
    return response.data
  }

  /**
   * Get list of enabled agent keys
   */
  async getEnabledKeys(): Promise<string[]> {
    const response = await apiClient.get(`${this.basePath}/enabled-keys`)
    return response.data
  }

  /**
   * Seed builtin agents from BUILTIN_AGENT_DEFAULTS
   */
  async seedBuiltin(): Promise<SeedBuiltinResponse> {
    const response = await apiClient.post(`${this.basePath}/seed/builtin`)
    return response.data
  }

  /**
   * Bulk enable multiple agents
   */
  async bulkEnable(agentIds: string[]): Promise<BulkUpdateResponse> {
    const response = await apiClient.post(`${this.basePath}/bulk/enable`, {
      agent_ids: agentIds
    })
    return response.data
  }

  /**
   * Bulk disable multiple agents
   */
  async bulkDisable(agentIds: string[]): Promise<BulkUpdateResponse> {
    const response = await apiClient.post(`${this.basePath}/bulk/disable`, {
      agent_ids: agentIds
    })
    return response.data
  }
}

export const agentCatalogApi = new AgentCatalogApi()
export default agentCatalogApi
