/**
 * Validation API Client
 * Calls the config validation endpoint for graph topology integrity checks.
 */

import api from './index'

const BASE_PATH = '/admin/graph-topology'

export interface ValidationIssue {
  severity: 'critical' | 'warning'
  type: string
  node_id: string | null
  intent_key: string | null
  detail: string
  fix_hint: string | null
}

export interface ValidationResult {
  status: 'ok' | 'warning' | 'error'
  issues: ValidationIssue[]
}

export interface NodeVariables {
  node_id: string
  domain_key: string
  variables: string[]
}

export interface AllNodeVariables {
  domain_key: string
  node_variables: Record<string, string[]>
}

export const validationApi = {
  /**
   * Run all validation checks for a domain + organization
   */
  async validate(domainKey: string, organizationId: string): Promise<ValidationResult> {
    const response = await api.post<ValidationResult>(
      `${BASE_PATH}/${domainKey}/validate?organization_id=${organizationId}`
    )
    return response.data
  },

  /**
   * Get variables for a specific node
   */
  async getNodeVariables(domainKey: string, nodeId: string): Promise<NodeVariables> {
    const response = await api.get<NodeVariables>(
      `${BASE_PATH}/${domainKey}/nodes/${nodeId}/variables`
    )
    return response.data
  },

  /**
   * Get all node variables for a domain
   */
  async getAllNodeVariables(domainKey: string): Promise<AllNodeVariables> {
    const response = await api.get<AllNodeVariables>(
      `${BASE_PATH}/${domainKey}/variables`
    )
    return response.data
  }
}

export default validationApi
