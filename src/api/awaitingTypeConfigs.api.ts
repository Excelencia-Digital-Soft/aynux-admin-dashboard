/**
 * Awaiting Type Configs API Client
 * Wraps backend CRUD endpoints for awaiting_type_configs
 */

import api from './index'

const BASE_PATH = '/admin/awaiting-type-configs'

export interface AwaitingTypeConfigResponse {
  id: string
  organization_id: string | null
  domain_key: string
  awaiting_type: string
  target_node: string
  valid_response_intents: string[]
  validation_pattern: string | null
  priority: number
  is_enabled: boolean
  display_name: string | null
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AwaitingTypeConfigUpdate {
  target_node?: string
  valid_response_intents?: string[]
  validation_pattern?: string | null
  priority?: number
  is_enabled?: boolean
  display_name?: string
  description?: string
}

export const awaitingTypeConfigsApi = {
  /**
   * List awaiting type configs for a domain
   */
  async list(
    domainKey: string,
    enabledOnly: boolean = false
  ): Promise<AwaitingTypeConfigResponse[]> {
    const params = new URLSearchParams()
    params.append('domain_key', domainKey)
    params.append('enabled_only', String(enabledOnly))
    const response = await api.get<AwaitingTypeConfigResponse[]>(
      `${BASE_PATH}?${params.toString()}`
    )
    return response.data
  },

  /**
   * Update a single awaiting type config
   */
  async update(
    configId: string,
    updates: AwaitingTypeConfigUpdate
  ): Promise<AwaitingTypeConfigResponse> {
    const response = await api.put<AwaitingTypeConfigResponse>(
      `${BASE_PATH}/${configId}`,
      updates
    )
    return response.data
  }
}

export default awaitingTypeConfigsApi
