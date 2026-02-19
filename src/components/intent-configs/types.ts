/**
 * LangGraph Topology Editor Types
 *
 * Types for the graph-based LangGraph topology editor
 * using Vue Flow for visualization.
 */

import type { Node } from '@vue-flow/core'
import type {
  GraphNode as ApiGraphNode,
  GraphEdge as ApiGraphEdge,
  RoutingConfigSummary,
  AwaitingTypeConfigSummary
} from '@/types/graphTopology.types'

// Re-export API types for convenience
export type { RoutingConfigSummary, AwaitingTypeConfigSummary }
export type {
  GraphNode as ApiGraphNode,
  GraphEdge as ApiGraphEdge,
  GraphTopologyResponse
} from '@/types/graphTopology.types'

// Also re-export routing config types used by panels
export type {
  RoutingConfigResponse,
  RoutingConfigUpdate,
  RoutingConfigBatchUpdate
} from '@/types/routingConfigs.types'

// =============================================================================
// Graph Node Types
// =============================================================================

export type TopologyNodeType = 'router' | 'action' | 'formatter' | 'terminal'

/**
 * Data attached to each Vue Flow node for topology visualization
 */
export interface TopologyNodeData {
  // From API
  nodeId: string
  nodeType: ApiGraphNode['node_type']
  displayName: string
  description: string
  icon: string
  color: string
  acceptsAwaitingTypes: string[]
  hasConditionalOutput: boolean
  routingConfigCount: number
  awaitingTypeConfigCount: number
  // Computed by composable
  isSelected: boolean
}

// =============================================================================
// Vue Flow Node / Edge Types
// =============================================================================

export interface TopologyFlowNode extends Node {
  type: TopologyNodeType
  data: TopologyNodeData
}

export interface TopologyFlowEdge {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
  style?: Record<string, string>
  label?: string
  data?: {
    edgeType: 'direct' | 'conditional'
    condition?: string | null
  }
}

// =============================================================================
// Selection State
// =============================================================================

export interface SelectedNodeInfo {
  nodeId: string
  nodeType: ApiGraphNode['node_type']
  data: TopologyNodeData
  routingConfigs: RoutingConfigSummary[]
  awaitingTypeConfigs: AwaitingTypeConfigSummary[]
}

// =============================================================================
// Domain Configuration (kept for compatibility)
// =============================================================================

export interface DomainConfig {
  key: string
  displayName: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  pharmacy: {
    key: 'pharmacy',
    displayName: 'Farmacia',
    description: 'Flujo de farmacia (graph_v2)',
    icon: 'pi-heart',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  excelencia: {
    key: 'excelencia',
    displayName: 'Excelencia',
    description: 'Flujo de software Excelencia',
    icon: 'pi-star',
    color: '#8b5cf6',
    bgColor: '#ede9fe'
  },
  ecommerce: {
    key: 'ecommerce',
    displayName: 'E-Commerce',
    description: 'Flujo de e-commerce',
    icon: 'pi-shopping-cart',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  healthcare: {
    key: 'healthcare',
    displayName: 'Salud',
    description: 'Flujo de salud',
    icon: 'pi-heart-fill',
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  turnos_medicos: {
    key: 'turnos_medicos',
    displayName: 'Turnos Medicos',
    description: 'Flujo de agendamiento de turnos medicos',
    icon: 'pi-calendar',
    color: '#0ea5e9',
    bgColor: '#e0f2fe'
  }
}

export function getDomainConfig(domainKey: string): DomainConfig {
  return (
    DOMAIN_CONFIGS[domainKey] || {
      key: domainKey,
      displayName: domainKey,
      description: '',
      icon: 'pi-tag',
      color: '#64748b',
      bgColor: '#f1f5f9'
    }
  )
}
