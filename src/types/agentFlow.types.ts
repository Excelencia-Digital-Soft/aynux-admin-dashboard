/**
 * Agent Flow Visualization Types
 *
 * Types for visualizing the agent system architecture including:
 * - Bypass rules and their routing
 * - Orchestrator and domain agents
 * - Message flow through the system
 */

// ============================================================================
// Domain & Classification Types
// ============================================================================

/**
 * Agent domains - categorization for grouping agents
 */
export type AgentDomain =
  | 'system' // orchestrator, supervisor
  | 'global' // greeting, farewell, fallback, support
  | 'excelencia' // excelencia domain agents
  | 'ecommerce' // ecommerce domain agents
  | 'pharmacy' // pharmacy domain agents
  | 'credit' // credit domain agents

/**
 * Vue Flow node types for the agent flow visualization
 */
export type FlowNodeType =
  | 'message-input'
  | 'bypass-rule'
  | 'bypass-group'
  | 'orchestrator'
  | 'supervisor'
  | 'agent'
  | 'domain-group'
  | 'end'

/**
 * Vue Flow edge types
 */
export type FlowEdgeType = 'bypass' | 'routing' | 'domain' | 'response'

/**
 * Bypass rule types
 */
export type BypassRuleType =
  | 'phone_number'
  | 'phone_number_list'
  | 'whatsapp_phone_number_id'

// ============================================================================
// Visualization Data Types (from API)
// ============================================================================

/**
 * Agent visualization data
 */
export interface AgentVisualization {
  id: string
  agent_key: string
  display_name: string
  description: string | null
  domain_key: AgentDomain | null
  enabled: boolean
  priority: number
  keywords: string[]
  primary_intents: string[]
  requires_postgres: boolean
  requires_pgvector: boolean
  requires_external_apis: boolean
  icon: string
  node_color: string
}

/**
 * Bypass rule visualization data
 */
export interface BypassRuleVisualization {
  id: string
  rule_name: string
  description: string | null
  rule_type: BypassRuleType
  pattern: string | null
  phone_numbers: string[] | null
  phone_number_id: string | null
  target_agent: string
  target_domain: string | null
  priority: number
  enabled: boolean
}

/**
 * Domain group for visualization
 */
export interface DomainGroup {
  domain_key: AgentDomain
  display_name: string
  description: string
  color: string
  agents: AgentVisualization[]
}

/**
 * Orchestrator routing configuration
 */
export interface OrchestratorRoute {
  intent: string
  target_agent: string
  confidence_threshold: number
  description?: string
}

/**
 * Intent mapping for visualization
 */
export interface IntentMapping {
  intent: string
  description: string
  examples: string[]
  target_agent: string
}

/**
 * Complete visualization data from API
 */
export interface AgentFlowVisualization {
  // Entities
  agents: AgentVisualization[]
  bypass_rules: BypassRuleVisualization[]
  domains: DomainGroup[]

  // Relationships
  orchestrator_routes: OrchestratorRoute[]
  intent_mappings: IntentMapping[]

  // Metadata
  organization_id: string | null
  tenant_enabled_agents: string[]
  default_domain: string
  is_multi_tenant: boolean
}

// ============================================================================
// Vue Flow Node Types
// ============================================================================

/**
 * Base position for nodes
 */
export interface NodePosition {
  x: number
  y: number
}

/**
 * Base node data
 */
export interface BaseNodeData {
  label: string
  description?: string
  isHighlighted?: boolean
  isSelected?: boolean
}

/**
 * Message input node data
 */
export interface MessageInputNodeData extends BaseNodeData {
  phoneNumber?: string
  whatsappPhoneNumberId?: string
}

/**
 * Bypass rule node data
 */
export interface BypassRuleNodeData extends BaseNodeData {
  rule: BypassRuleVisualization
  targetAgentName: string
  isEnabled: boolean
}

/**
 * Bypass group node data (container for all bypass rules)
 */
export interface BypassGroupNodeData extends BaseNodeData {
  rulesCount: number
  enabledCount: number
}

/**
 * Orchestrator node data
 */
export interface OrchestratorNodeData extends BaseNodeData {
  routes: OrchestratorRoute[]
  activeIntent?: string
}

/**
 * Supervisor node data
 */
export interface SupervisorNodeData extends BaseNodeData {
  evaluating?: boolean
}

/**
 * Agent node data
 */
export interface AgentNodeData extends BaseNodeData {
  agent: AgentVisualization
  isEnabled: boolean
  domainColor: string
}

/**
 * Domain group node data
 */
export interface DomainGroupNodeData extends BaseNodeData {
  domain: DomainGroup
  isCollapsed: boolean
  agentCount: number
  enabledCount: number
}

/**
 * End node data
 */
export interface EndNodeData extends BaseNodeData {
  responseType?: 'success' | 'error'
}

/**
 * Union type for all node data types
 */
export type AgentFlowNodeData =
  | MessageInputNodeData
  | BypassRuleNodeData
  | BypassGroupNodeData
  | OrchestratorNodeData
  | SupervisorNodeData
  | AgentNodeData
  | DomainGroupNodeData
  | EndNodeData

/**
 * Agent flow node structure
 */
export interface AgentFlowNode {
  id: string
  type: FlowNodeType
  position: NodePosition
  data: AgentFlowNodeData
  parentNode?: string
  extent?: 'parent'
  class?: string
}

// ============================================================================
// Vue Flow Edge Types
// ============================================================================

/**
 * Agent flow edge structure
 */
export interface AgentFlowEdge {
  id: string
  source: string
  target: string
  type?: FlowEdgeType
  label?: string
  animated?: boolean
  style?: Record<string, string>
  class?: string
  sourceHandle?: string
  targetHandle?: string
}

// ============================================================================
// Store & UI State Types
// ============================================================================

/**
 * Filter options for the visualization
 */
export interface AgentFlowFilters {
  domain?: AgentDomain
  enabledOnly?: boolean
  searchQuery?: string
  ruleType?: BypassRuleType
}

/**
 * View mode options
 */
export type ViewMode = 'full' | 'bypass-only' | 'agents-only' | 'orchestrator'

/**
 * Selected node info
 */
export interface SelectedNodeInfo {
  nodeId: string
  nodeType: FlowNodeType
  data: AgentFlowNodeData
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Domain display names and colors
 */
export const DOMAIN_CONFIG: Record<
  AgentDomain,
  { displayName: string; color: string; bgColor: string }
> = {
  system: {
    displayName: 'Sistema',
    color: '#64748b',
    bgColor: '#f1f5f9'
  },
  global: {
    displayName: 'Global',
    color: '#3b82f6',
    bgColor: '#dbeafe'
  },
  excelencia: {
    displayName: 'Excelencia Software',
    color: '#8b5cf6',
    bgColor: '#ede9fe'
  },
  ecommerce: {
    displayName: 'E-commerce',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  pharmacy: {
    displayName: 'Farmacia',
    color: '#14b8a6',
    bgColor: '#ccfbf1'
  },
  credit: {
    displayName: 'Credito',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  }
}

/**
 * Bypass rule type display config
 */
export const BYPASS_RULE_TYPE_CONFIG: Record<
  BypassRuleType,
  { displayName: string; icon: string; color: string }
> = {
  phone_number: {
    displayName: 'Patron de telefono',
    icon: 'pi-phone',
    color: '#3b82f6'
  },
  phone_number_list: {
    displayName: 'Lista de telefonos',
    icon: 'pi-list',
    color: '#10b981'
  },
  whatsapp_phone_number_id: {
    displayName: 'WhatsApp Phone ID',
    icon: 'pi-whatsapp',
    color: '#25d366'
  }
}

/**
 * Node type icons
 */
export const NODE_TYPE_ICONS: Record<FlowNodeType, string> = {
  'message-input': 'pi-whatsapp',
  'bypass-rule': 'pi-directions',
  'bypass-group': 'pi-filter',
  orchestrator: 'pi-sitemap',
  supervisor: 'pi-eye',
  agent: 'pi-android',
  'domain-group': 'pi-folder',
  end: 'pi-check-circle'
}

/**
 * Layout constants
 */
export const LAYOUT_CONFIG = {
  columnSpacing: 250,
  rowSpacing: 80,
  nodePadding: 50,
  nodeWidth: 180,
  nodeHeight: 80,
  domainGroupPadding: 20
}
