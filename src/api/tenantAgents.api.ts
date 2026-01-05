import apiClient from './index'
import type {
  TenantAgentConfig,
  TenantAgentListResponse,
  TenantAgentUpdate
} from '@/types/tenantAgents.types'

const TENANT_URL = '/admin/organizations'

export const tenantAgentsApi = {
  /**
   * List all agents configured for organization
   */
  async list(orgId: string): Promise<TenantAgentListResponse> {
    const { data } = await apiClient.get<TenantAgentListResponse>(
      `${TENANT_URL}/${orgId}/agents`
    )
    return data
  },

  /**
   * Toggle agent enabled/disabled
   */
  async toggle(orgId: string, agentId: string): Promise<TenantAgentConfig> {
    const { data } = await apiClient.post<TenantAgentConfig>(
      `${TENANT_URL}/${orgId}/agents/${agentId}/toggle`
    )
    return data
  },

  /**
   * Update agent configuration (priority, config, etc.)
   */
  async update(
    orgId: string,
    agentId: string,
    updateData: TenantAgentUpdate
  ): Promise<TenantAgentConfig> {
    const { data } = await apiClient.put<TenantAgentConfig>(
      `${TENANT_URL}/${orgId}/agents/${agentId}`,
      updateData
    )
    return data
  },

  /**
   * Initialize builtin agents for organization (creates DB records)
   */
  async initBuiltin(orgId: string): Promise<TenantAgentConfig[]> {
    const { data } = await apiClient.post<TenantAgentConfig[]>(
      `${TENANT_URL}/${orgId}/agents/init-builtin`
    )
    return data
  }
}

export default tenantAgentsApi
