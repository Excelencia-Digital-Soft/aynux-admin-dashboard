/**
 * Intent Configs Types - Replaces hardcoded intent_validator.py mappings
 *
 * Types for managing:
 * - IntentAgentMapping: Intent -> Agent routing
 * - FlowAgentConfig: Multi-turn flow agents
 * - KeywordAgentMapping: Keyword-based fallback routing
 */

// =============================================================================
// Enums
// =============================================================================

export type MatchType = 'exact' | 'contains' | 'prefix' | 'regex'

// =============================================================================
// Intent Agent Mapping Types
// =============================================================================

export interface IntentAgentMapping {
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
  created_at: string | null
  updated_at: string | null
}

export interface IntentAgentMappingCreate {
  intent_key: string
  intent_name: string
  intent_description?: string | null
  agent_key: string
  domain_key?: string | null
  confidence_threshold?: number
  requires_handoff?: boolean
  priority?: number
  is_enabled?: boolean
  examples?: string[]
}

export interface IntentAgentMappingUpdate {
  intent_name?: string
  intent_description?: string | null
  agent_key?: string
  domain_key?: string | null
  confidence_threshold?: number
  requires_handoff?: boolean
  priority?: number
  is_enabled?: boolean
  examples?: string[]
}

export interface IntentAgentMappingListResponse {
  mappings: IntentAgentMapping[]
  total: number
  organization_id: string
}

// =============================================================================
// Flow Agent Config Types
// =============================================================================

export interface FlowAgentConfig {
  id: string
  organization_id: string
  agent_key: string
  is_flow_agent: boolean
  flow_description: string | null
  max_turns: number
  timeout_seconds: number
  is_enabled: boolean
  created_at: string | null
  updated_at: string | null
}

export interface FlowAgentConfigCreate {
  agent_key: string
  is_flow_agent?: boolean
  flow_description?: string | null
  max_turns?: number
  timeout_seconds?: number
  is_enabled?: boolean
}

export interface FlowAgentConfigUpdate {
  is_flow_agent?: boolean
  flow_description?: string | null
  max_turns?: number
  timeout_seconds?: number
  is_enabled?: boolean
}

export interface FlowAgentConfigListResponse {
  configs: FlowAgentConfig[]
  total: number
  organization_id: string
}

// =============================================================================
// Keyword Agent Mapping Types
// =============================================================================

export interface KeywordAgentMapping {
  id: string
  organization_id: string
  agent_key: string
  keyword: string
  match_type: MatchType
  case_sensitive: boolean
  priority: number
  is_enabled: boolean
  created_at: string | null
}

export interface KeywordAgentMappingCreate {
  agent_key: string
  keyword: string
  match_type?: MatchType
  case_sensitive?: boolean
  priority?: number
  is_enabled?: boolean
}

export interface KeywordAgentMappingBulkCreate {
  agent_key: string
  keywords: string[]
  match_type?: MatchType
  case_sensitive?: boolean
  priority?: number
}

export interface KeywordAgentMappingListResponse {
  mappings: KeywordAgentMapping[]
  total: number
  organization_id: string
}

// =============================================================================
// Testing Types
// =============================================================================

export interface IntentTestRequest {
  message: string
  domain_key?: string | null
}

export interface IntentTestResult {
  detected_intent: string
  confidence: number
  target_agent: string
  method: string
  reasoning: string
  matched_keywords: string[]
  is_flow_agent: boolean
}

export interface IntentTestResponse {
  result: IntentTestResult
  organization_id: string
}

// =============================================================================
// Visualization Types
// =============================================================================

export interface FlowNode {
  id: string
  type: 'intent' | 'agent' | 'keyword'
  label: string
  data: {
    intent_key?: string
    agent_key?: string
    priority?: number
    confidence_threshold?: number
    domain_key?: string | null
    is_flow_agent?: boolean
    keyword_count?: number
  }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface FlowVisualizationResponse {
  nodes: FlowNode[]
  edges: FlowEdge[]
  organization_id: string
}

// =============================================================================
// Seed and Cache Types
// =============================================================================

export interface SeedRequest {
  overwrite?: boolean
}

export interface SeedResponse {
  mappings_created: number
  flow_agents_created: number
  keywords_created: number
  organization_id: string
}

export interface CacheStatsResponse {
  memory_hits: number
  memory_misses: number
  memory_hit_rate: number
  redis_hits: number
  redis_misses: number
  redis_hit_rate: number
  db_loads: number
  invalidations: number
  cached_organizations: number
}

export interface CacheInvalidateResponse {
  success: boolean
  organization_id: string
  message: string
}

// =============================================================================
// Combined Config Types
// =============================================================================

export interface AllConfigsResponse {
  intent_mappings: IntentAgentMapping[]
  flow_agents: FlowAgentConfig[]
  keyword_mappings: KeywordAgentMapping[]
  organization_id: string
}
