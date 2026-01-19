/**
 * Intent Configs Types - Replaces hardcoded intent_validator.py mappings
 *
 * Types for managing:
 * - IntentAgentMapping: Intent -> Agent routing
 * - FlowAgentConfig: Multi-turn flow agents
 * - KeywordAgentMapping: Keyword-based fallback routing
 */

import type { DomainIntent } from './domainIntents.types'

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

// =============================================================================
// Usage Analysis Types (for UI redesign)
// =============================================================================

/**
 * Usage status for intent configurations
 * - active: Config is enabled and has complete relationships
 * - idle: Config is enabled but may be incomplete
 * - unused: Config exists but has no relationships or is disabled
 * - orphaned: Config references non-existent entities
 */
export type UsageStatus = 'active' | 'idle' | 'unused' | 'orphaned'

/**
 * Result of analyzing relationships between all configurations
 */
export interface UsageAnalysis {
  // Intent analysis
  intentsWithMappings: Set<string>       // intent_keys that have IntentAgentMapping
  intentsWithoutMappings: Set<string>    // intent_keys with no mapping (orphaned)
  intentsWithPatterns: Set<string>       // intent_keys that have patterns defined
  intentsFromRoutes: Set<string>         // intent_keys from OrchestratorRoutes
  intentsInUse: Set<string>              // Combined: mappings + routes (any source)

  // Agent analysis
  agentsWithMappings: Set<string>        // agent_keys receiving intents
  agentsWithKeywords: Set<string>        // agent_keys with fallback keywords
  agentsWithFlowConfig: Set<string>      // agent_keys configured as flow agents

  // Orphaned/unused detection
  orphanedMappingIds: string[]           // IntentAgentMapping IDs pointing to non-existent intents
  orphanedKeywordIds: string[]           // KeywordAgentMapping IDs pointing to non-existent agents
  unusedFlowAgentKeys: string[]          // FlowAgentConfig keys with no incoming mappings

  // Summary counts
  totalIntents: number
  totalMappings: number
  totalKeywords: number
  totalFlowAgents: number
  activeCount: number
  unusedCount: number
  orphanedCount: number
}

/**
 * Node types for navigation tree
 */
export type ConfigNodeType = 'domain' | 'intent' | 'agent' | 'keyword' | 'category'

/**
 * Navigation tree node for the sidebar
 */
export interface ConfigNode {
  id: string
  type: ConfigNodeType
  key: string
  label: string
  status: UsageStatus
  icon?: string
  badge?: number
  children?: ConfigNode[]
  selectable?: boolean
  expanded?: boolean
  // Original data reference
  data?: IntentAgentMapping | FlowAgentConfig | KeywordAgentMapping | DomainIntent | null
}

/**
 * Domain health score with breakdown
 */
export interface DomainHealth {
  score: number              // 0-100 percentage
  activeIntents: number
  totalIntents: number
  activeAgents: number
  totalAgents: number
  activeKeywords: number
  totalKeywords: number
  issues: DomainHealthIssue[]
}

/**
 * Individual health issue for a domain
 */
export interface DomainHealthIssue {
  severity: 'warning' | 'error'
  type: 'orphaned_mapping' | 'orphaned_keyword' | 'unused_flow_agent' | 'intent_no_patterns' | 'agent_no_mappings'
  message: string
  affectedKey: string
  affectedId?: string
}

/**
 * Filter options for the navigation sidebar
 */
export type UsageFilter = 'all' | 'active' | 'unused' | 'orphaned'

/**
 * Stats for domain selector cards
 */
export interface DomainStats {
  domainKey: string
  intentCount: number
  agentCount: number
  keywordCount: number
  healthScore: number
  hasIssues: boolean
}
