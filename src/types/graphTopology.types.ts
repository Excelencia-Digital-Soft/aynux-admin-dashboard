/**
 * Graph Topology Types
 * Types for the graph topology admin API
 */

export interface GraphNode {
  id: string
  node_type: 'entry' | 'supervisor' | 'action' | 'formatter' | 'terminal'
  display_name: string
  description: string
  icon: string
  color: string
  accepts_awaiting_types: string[]
  has_conditional_output: boolean
  routing_config_count: number
  awaiting_type_config_count: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  edge_type: 'direct' | 'conditional'
  condition: string | null
  label: string | null
}

export interface RoutingConfigSummary {
  id: string
  config_type: string
  trigger_value: string
  target_intent: string
  target_node: string | null
  is_enabled: boolean
  priority: number
  display_name: string | null
  requires_auth: boolean
  clears_context: boolean
  is_escape_intent: boolean
}

export interface AwaitingTypeConfigSummary {
  id: string
  awaiting_type: string
  target_node: string
  is_enabled: boolean
  priority: number
  display_name: string | null
  valid_response_intents: string[]
}

export interface GraphTopologyResponse {
  domain_key: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  routing_configs: RoutingConfigSummary[]
  awaiting_type_configs: AwaitingTypeConfigSummary[]
}

export interface InstitutionConfigSummary {
  id: string
  institution_key: string
  institution_name: string
  institution_type: string
  enabled: boolean
  organization_id: string
}
