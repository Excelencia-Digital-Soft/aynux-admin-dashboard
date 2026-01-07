// =============================================================================
// Agent Catalog Types - CRUD for core.agents table
// =============================================================================
// This is separate from agent.types.ts which handles YAML module configuration.
// These types are for the database-driven agent catalog (LangGraph agents).
// =============================================================================

/**
 * Agent catalog item from core.agents table
 */
export interface AgentCatalogItem {
  id: string
  agent_key: string
  name: string
  description: string | null
  agent_type: 'builtin' | 'specialized' | 'custom'
  domain_key: string | null
  enabled: boolean
  priority: number
  keywords: string[]
  intent_patterns: Record<string, unknown>[]
  config: Record<string, unknown>
  sync_source: 'seed' | 'manual'
  created_at: string
  updated_at: string
}

/**
 * Response from GET /admin/agents
 */
export interface AgentCatalogListResponse {
  agents: AgentCatalogItem[]
  total: number
  enabled_count: number
  disabled_count: number
}

/**
 * Request body for POST /admin/agents
 */
export interface AgentCatalogCreate {
  agent_key: string
  name: string
  description?: string
  agent_type?: 'builtin' | 'specialized' | 'custom'
  domain_key?: string
  enabled?: boolean
  priority?: number
  keywords?: string[]
  config?: Record<string, unknown>
}

/**
 * Request body for PUT /admin/agents/{id}
 */
export interface AgentCatalogUpdate {
  name?: string
  description?: string
  domain_key?: string
  enabled?: boolean
  priority?: number
  keywords?: string[]
  config?: Record<string, unknown>
}

/**
 * Query parameters for GET /admin/agents
 */
export interface AgentCatalogFilters {
  agent_type?: string
  domain_key?: string
  enabled_only?: boolean
}

/**
 * Response from POST /admin/agents/seed/builtin
 */
export interface SeedBuiltinResponse {
  created: number
  updated: number
  skipped: number
}

/**
 * Response from POST /admin/agents/bulk/enable or /bulk/disable
 */
export interface BulkUpdateResponse {
  updated: number
}

// =============================================================================
// Constants for UI
// =============================================================================

export type DomainKey = 'excelencia' | 'ecommerce' | 'pharmacy' | 'credit' | null

export interface DomainOption {
  value: DomainKey
  label: string
  color: 'info' | 'help' | 'success' | 'warn' | 'secondary'
  icon: string
}

/**
 * Domain options for Select component
 * @deprecated Use useDomains().getDomainOptions() instead for dynamic domain data from API
 */
export const DOMAIN_OPTIONS: DomainOption[] = [
  { value: null, label: 'Global', color: 'info', icon: 'pi-globe' },
  { value: 'excelencia', label: 'Excelencia', color: 'help', icon: 'pi-building' },
  { value: 'ecommerce', label: 'E-commerce', color: 'success', icon: 'pi-shopping-cart' },
  { value: 'pharmacy', label: 'Farmacia', color: 'info', icon: 'pi-heart' },
  { value: 'credit', label: 'Credito', color: 'warn', icon: 'pi-wallet' }
]

/**
 * Agent type options for Select component
 */
export const AGENT_TYPE_OPTIONS = [
  { value: 'builtin', label: 'Builtin' },
  { value: 'specialized', label: 'Especializado' },
  { value: 'custom', label: 'Custom' }
]

/**
 * Subgraph information by agent_key
 * Agents not in this map use only the Main Graph
 */
export const SUBGRAPH_INFO: Record<string, { graph: string; hasSubgraph: boolean }> = {
  ecommerce_agent: { graph: 'EcommerceGraph', hasSubgraph: true },
  pharmacy_operations_agent: { graph: 'PharmacyGraph', hasSubgraph: true },
  credit_agent: { graph: 'CreditGraph', hasSubgraph: true }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get domain configuration by domain_key
 * @deprecated Use useDomains().getDomainLabel(), getDomainColor(), getDomainIcon() instead
 */
export function getDomainConfig(domainKey: DomainKey): DomainOption {
  return DOMAIN_OPTIONS.find((d) => d.value === domainKey) || DOMAIN_OPTIONS[0]
}

/**
 * Get graph info for an agent
 */
export function getGraphInfo(agentKey: string): { graph: string; hasSubgraph: boolean } {
  return SUBGRAPH_INFO[agentKey] || { graph: 'Main', hasSubgraph: false }
}

/**
 * Get severity for Tag component based on agent_type
 */
export function getAgentTypeSeverity(
  agentType: string
): 'secondary' | 'info' | 'success' | 'warn' {
  const map: Record<string, 'secondary' | 'info' | 'success' | 'warn'> = {
    builtin: 'secondary',
    specialized: 'info',
    custom: 'success'
  }
  return map[agentType] || 'secondary'
}
