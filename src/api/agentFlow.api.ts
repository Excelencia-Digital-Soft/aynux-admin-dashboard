/**
 * Agent Flow Visualization API
 * API client for fetching agent flow visualization data
 *
 * Supports both Global Mode and Multi-tenant Mode:
 * - Global Mode: Uses /admin/agent-flow/visualization
 * - Multi-tenant Mode: Uses /admin/organizations/{orgId}/agent-flow/visualization
 */

import apiClient from './index'
import type { AgentFlowVisualization } from '@/types/agentFlow.types'

/**
 * Get base URL for agent flow API based on mode
 */
function getBaseUrl(orgId?: string): string {
  if (orgId) {
    return `/admin/organizations/${orgId}/agent-flow`
  }
  return '/admin/agent-flow'
}

export const agentFlowApi = {
  /**
   * Get complete visualization data
   *
   * In Global Mode (orgId not provided):
   * - Returns agents from ENABLED_AGENTS env var
   * - Returns empty bypass_rules array
   * - Uses DEFAULT_AGENT_SCHEMA for definitions
   *
   * In Multi-tenant Mode (orgId provided):
   * - Returns agents from tenant_agents table
   * - Returns bypass_rules from bypass_rules table
   * - Filters by organization
   */
  async getVisualization(orgId?: string): Promise<AgentFlowVisualization> {
    const url = `${getBaseUrl(orgId)}/visualization`
    const { data } = await apiClient.get<AgentFlowVisualization>(url)
    return data
  },

  /**
   * Get only agents data (for partial refresh)
   */
  async getAgents(orgId?: string): Promise<AgentFlowVisualization['agents']> {
    const url = `${getBaseUrl(orgId)}/agents`
    const { data } = await apiClient.get<AgentFlowVisualization['agents']>(url)
    return data
  },

  /**
   * Get orchestrator routes and intent mappings
   */
  async getRoutes(orgId?: string): Promise<{
    routes: AgentFlowVisualization['orchestrator_routes']
    mappings: AgentFlowVisualization['intent_mappings']
  }> {
    const url = `${getBaseUrl(orgId)}/routes`
    const { data } = await apiClient.get<{
      routes: AgentFlowVisualization['orchestrator_routes']
      mappings: AgentFlowVisualization['intent_mappings']
    }>(url)
    return data
  }
}

export default agentFlowApi
