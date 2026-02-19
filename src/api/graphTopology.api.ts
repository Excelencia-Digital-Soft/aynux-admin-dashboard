/**
 * Graph Topology API Client
 * Fetches graph topology data for the visual graph editor
 */

import api from './index'
import type { GraphTopologyResponse, InstitutionConfigSummary } from '@/types/graphTopology.types'

const BASE_PATH = '/admin/graph-topology'

export const graphTopologyApi = {
  /**
   * Get the full graph topology for a domain
   */
  async getTopology(
    domainKey: string,
    organizationId?: string | null
  ): Promise<GraphTopologyResponse> {
    const params = new URLSearchParams()
    if (organizationId) {
      params.append('organization_id', organizationId)
    }
    const query = params.toString()
    const url = `${BASE_PATH}/${domainKey}${query ? `?${query}` : ''}`
    const response = await api.get<GraphTopologyResponse>(url)
    return response.data
  },

  /**
   * List domains with registered graph topologies
   */
  async listDomains(): Promise<string[]> {
    const response = await api.get<string[]>(`${BASE_PATH}/`)
    return response.data
  },

  /**
   * Get institution configs linked to a domain
   */
  async getDomainInstitutionConfigs(domainKey: string): Promise<InstitutionConfigSummary[]> {
    const response = await api.get<InstitutionConfigSummary[]>(
      `${BASE_PATH}/${domainKey}/institution-configs`
    )
    return response.data
  }
}

export default graphTopologyApi
