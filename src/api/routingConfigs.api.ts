/**
 * Routing Configs API Client
 * Wraps existing backend CRUD endpoints for routing_configs
 */

import api from './index'
import type {
  RoutingConfigResponse,
  RoutingConfigUpdate,
  RoutingConfigBatchUpdate
} from '@/types/routingConfigs.types'

const BASE_PATH = '/admin/routing-configs'

export const routingConfigsApi = {
  /**
   * List routing configs for a domain, optionally filtered by config_type
   */
  async list(
    domainKey: string,
    configType?: string,
    enabledOnly: boolean = false
  ): Promise<RoutingConfigResponse[]> {
    const params = new URLSearchParams()
    params.append('domain_key', domainKey)
    params.append('enabled_only', String(enabledOnly))
    if (configType) {
      params.append('config_type', configType)
    }

    const response = await api.get<RoutingConfigResponse[]>(
      `${BASE_PATH}?${params.toString()}`
    )
    return response.data
  },

  /**
   * Update a single routing config
   */
  async update(
    configId: string,
    updates: RoutingConfigUpdate
  ): Promise<RoutingConfigResponse> {
    const response = await api.put<RoutingConfigResponse>(
      `${BASE_PATH}/${configId}`,
      updates
    )
    return response.data
  },

  /**
   * Batch update multiple routing configs with the same updates
   */
  async batchUpdate(
    data: RoutingConfigBatchUpdate
  ): Promise<RoutingConfigResponse[]> {
    const response = await api.patch<RoutingConfigResponse[]>(
      `${BASE_PATH}/batch`,
      data
    )
    return response.data
  }
}

export default routingConfigsApi
