// =============================================================================
// Intent Mappings Types - CRUD for core.intent_agent_mappings table
// =============================================================================

/**
 * Intent-to-agent mapping from core.intent_agent_mappings table
 */
export interface IntentMapping {
  id: string
  organization_id: string
  domain_key: string | null
  intent_key: string
  intent_name: string
  intent_description: string | null
  agent_key: string
  confidence_threshold: number
  requires_handoff: boolean
  priority: number
  is_enabled: boolean
  examples: string[]
  system: boolean
  created_at: string | null
  updated_at: string | null
}

/**
 * Response from GET /admin/intent-configs/mappings
 */
export interface IntentMappingListResponse {
  mappings: IntentMapping[]
  total: number
  organization_id: string
}

/**
 * Request body for POST /admin/intent-configs/mappings
 */
export interface IntentMappingCreate {
  intent_key: string
  intent_name: string
  intent_description?: string
  agent_key: string
  domain_key?: string | null
  confidence_threshold?: number
  requires_handoff?: boolean
  priority?: number
  is_enabled?: boolean
  examples?: string[]
}

/**
 * Request body for PUT /admin/intent-configs/mappings/{id}
 */
export interface IntentMappingUpdate {
  intent_name?: string
  intent_description?: string
  agent_key?: string
  domain_key?: string | null
  confidence_threshold?: number
  requires_handoff?: boolean
  priority?: number
  is_enabled?: boolean
  examples?: string[]
}

/**
 * Response from POST /admin/intent-configs/seed-intents
 */
export interface SeedIntentsResponse {
  mappings_created: number
  flow_agents_created: number
  keywords_created: number
  organization_id: string
}
