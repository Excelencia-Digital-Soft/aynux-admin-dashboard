/**
 * Tenant Agent configuration types
 * For managing enabled/disabled agents per organization
 */

export interface TenantAgentConfig {
  id: string
  organization_id: string
  agent_key: string
  agent_type: 'builtin' | 'specialized' | 'custom'
  display_name: string
  description: string | null
  enabled: boolean
  priority: number
  domain_key: string | null
  keywords: string[]
  config: Record<string, unknown>
  created_at: string | null
  updated_at: string | null
}

export interface TenantAgentListResponse {
  agents: TenantAgentConfig[]
  total: number
  enabled_count: number
  disabled_count: number
}

export interface TenantAgentUpdate {
  enabled?: boolean
  priority?: number
  config?: Record<string, unknown>
}
