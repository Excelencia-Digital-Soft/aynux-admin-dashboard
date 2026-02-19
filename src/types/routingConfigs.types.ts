/**
 * Routing Configs Types
 * Types for the routing_configs admin API
 */

export interface RoutingConfigResponse {
  id: string
  organization_id: string | null
  domain_key: string
  config_type: string
  trigger_value: string
  target_intent: string
  target_node: string | null
  priority: number
  is_enabled: boolean
  requires_auth: boolean
  clears_context: boolean
  metadata: Record<string, unknown> | null
  display_name: string | null
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface RoutingConfigUpdate {
  target_intent?: string
  target_node?: string
  priority?: number
  is_enabled?: boolean
  requires_auth?: boolean
  clears_context?: boolean
  metadata?: Record<string, unknown>
  display_name?: string
  description?: string
}

export interface RoutingConfigBatchUpdate {
  ids: string[]
  updates: RoutingConfigUpdate
}
