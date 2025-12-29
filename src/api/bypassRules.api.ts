/**
 * Bypass Rules API
 * API client for managing bypass routing rules
 */

import apiClient from './index'
import type {
  BypassRule,
  BypassRuleCreateRequest,
  BypassRuleUpdateRequest,
  BypassRuleListResponse,
  BypassTestRequest,
  BypassTestResponse,
  BypassReorderRequest
} from '@/types/bypassRules.types'

/**
 * Get base URL for bypass rules API
 */
function getBaseUrl(orgId: string): string {
  return `/admin/organizations/${orgId}/bypass-rules`
}

export const bypassRulesApi = {
  /**
   * List all bypass rules for organization (sorted by priority desc)
   */
  async list(orgId: string): Promise<BypassRuleListResponse> {
    const { data } = await apiClient.get<BypassRuleListResponse>(getBaseUrl(orgId))
    return data
  },

  /**
   * Get single bypass rule by ID
   */
  async getById(orgId: string, ruleId: string): Promise<BypassRule> {
    const { data } = await apiClient.get<BypassRule>(`${getBaseUrl(orgId)}/${ruleId}`)
    return data
  },

  /**
   * Create new bypass rule
   */
  async create(orgId: string, ruleData: BypassRuleCreateRequest): Promise<BypassRule> {
    const { data } = await apiClient.post<BypassRule>(getBaseUrl(orgId), ruleData)
    return data
  },

  /**
   * Update bypass rule
   */
  async update(
    orgId: string,
    ruleId: string,
    updateData: BypassRuleUpdateRequest
  ): Promise<BypassRule> {
    const { data } = await apiClient.put<BypassRule>(
      `${getBaseUrl(orgId)}/${ruleId}`,
      updateData
    )
    return data
  },

  /**
   * Delete bypass rule
   */
  async delete(orgId: string, ruleId: string): Promise<void> {
    await apiClient.delete(`${getBaseUrl(orgId)}/${ruleId}`)
  },

  /**
   * Toggle enabled state of a rule
   */
  async toggle(orgId: string, ruleId: string): Promise<BypassRule> {
    const { data } = await apiClient.post<BypassRule>(
      `${getBaseUrl(orgId)}/${ruleId}/toggle`
    )
    return data
  },

  /**
   * Test routing - simulate rule matching
   */
  async testRouting(orgId: string, testData: BypassTestRequest): Promise<BypassTestResponse> {
    const { data } = await apiClient.post<BypassTestResponse>(
      `${getBaseUrl(orgId)}/test`,
      testData
    )
    return data
  },

  /**
   * Reorder rules by priority
   */
  async reorder(orgId: string, reorderData: BypassReorderRequest): Promise<BypassRule[]> {
    const { data } = await apiClient.post<BypassRule[]>(
      `${getBaseUrl(orgId)}/reorder`,
      reorderData
    )
    return data
  }
}

export default bypassRulesApi
