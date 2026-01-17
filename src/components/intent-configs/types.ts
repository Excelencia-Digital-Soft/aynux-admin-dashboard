/**
 * Intent Config Graph Types
 *
 * Types for the graph-based intent configuration editor
 * using Vue Flow for visualization.
 */

import type { Node } from '@vue-flow/core'
import type { DomainIntent } from '@/types/domainIntents.types'
import type {
  IntentAgentMapping,
  FlowAgentConfig,
  KeywordAgentMapping,
  UsageStatus
} from '@/types/intentConfigs.types'

// =============================================================================
// Graph Node Types
// =============================================================================

export type GraphNodeType = 'domain' | 'intent' | 'agent' | 'keyword-group'

/**
 * Domain node data - represents a domain (column 1)
 */
export interface DomainNodeData {
  label: string
  domainKey: string
  displayName: string
  description: string
  icon: string
  color: string
  bgColor: string
  intentCount: number
  enabledCount: number
  healthScore: number
}

/**
 * Intent node data - represents an intent (column 2)
 */
export interface IntentNodeData {
  label: string
  intentKey: string
  intentName: string
  domainKey: string
  domainColor: string
  status: UsageStatus
  isEnabled: boolean
  patternCount: number
  lemmaCount: number
  phraseCount: number
  keywordCount: number
  mapping: IntentAgentMapping | null
  intent: DomainIntent | null
  agentKey: string | null
  confidence: number
}

/**
 * Agent node data - represents an agent (column 3)
 */
export interface AgentNodeData {
  label: string
  agentKey: string
  displayName: string
  isFlowAgent: boolean
  flowConfig: FlowAgentConfig | null
  isEnabled: boolean
  mappingCount: number
  keywordCount: number
  color: string
}

/**
 * Keyword group node data - represents keywords for an agent (column 4)
 */
export interface KeywordGroupNodeData {
  label: string
  agentKey: string
  keywords: KeywordAgentMapping[]
  keywordCount: number
  enabledCount: number
}

// Union type for all node data
export type GraphNodeData =
  | DomainNodeData
  | IntentNodeData
  | AgentNodeData
  | KeywordGroupNodeData

// =============================================================================
// Vue Flow Node Types
// =============================================================================

export interface IntentConfigGraphNode extends Node {
  type: GraphNodeType
  data: GraphNodeData
}

// =============================================================================
// Edge Types
// =============================================================================

export type EdgeType = 'domain-intent' | 'intent-agent' | 'agent-keyword'

export interface IntentConfigGraphEdge {
  id: string
  source: string
  target: string
  type?: EdgeType
  animated?: boolean
  style?: Record<string, string>
  sourceHandle?: string
  targetHandle?: string
  label?: string
  data?: Record<string, unknown>
}

// =============================================================================
// Selection State
// =============================================================================

export interface SelectedNodeInfo {
  nodeId: string
  nodeType: GraphNodeType
  data: GraphNodeData
}

// =============================================================================
// Filter State
// =============================================================================

export interface GraphFilters {
  domainKey?: string | null
  status?: UsageStatus | 'all'
  searchQuery?: string
  showDisabled?: boolean
}

// =============================================================================
// Graph State
// =============================================================================

export interface IntentConfigGraphState {
  // Data
  nodes: IntentConfigGraphNode[]
  edges: IntentConfigGraphEdge[]

  // UI State
  selectedNodeId: string | null
  selectedNodeType: GraphNodeType | null
  highlightedPath: string[]

  // Filters
  filters: GraphFilters

  // Loading
  isLoading: boolean
  error: string | null
}

// =============================================================================
// Domain Configuration
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
    description: 'Intents para asistente de farmacia',
    icon: 'pi-heart',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  excelencia: {
    key: 'excelencia',
    displayName: 'Excelencia',
    description: 'Intents para software Excelencia',
    icon: 'pi-star',
    color: '#8b5cf6',
    bgColor: '#ede9fe'
  },
  ecommerce: {
    key: 'ecommerce',
    displayName: 'E-Commerce',
    description: 'Intents para comercio electrónico',
    icon: 'pi-shopping-cart',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  healthcare: {
    key: 'healthcare',
    displayName: 'Salud',
    description: 'Intents para servicios de salud',
    icon: 'pi-heart-fill',
    color: '#ef4444',
    bgColor: '#fee2e2'
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

// =============================================================================
// Layout Constants
// =============================================================================

export const LAYOUT_CONFIG = {
  columnSpacing: 280,
  rowSpacing: 120,
  nodeWidth: 200,
  nodeHeight: 100,
  startX: 50,
  startY: 50,
  columns: {
    domain: 0,
    intent: 1,
    agent: 2,
    keyword: 3
  }
}

// =============================================================================
// Status Configuration
// =============================================================================

export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  icon: string
}

export const STATUS_CONFIGS: Record<UsageStatus, StatusConfig> = {
  active: {
    label: 'Activo',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: 'pi-check-circle'
  },
  idle: {
    label: 'Inactivo',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: 'pi-pause-circle'
  },
  unused: {
    label: 'Sin usar',
    color: '#64748b',
    bgColor: '#f1f5f9',
    icon: 'pi-minus-circle'
  },
  orphaned: {
    label: 'Huérfano',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: 'pi-exclamation-circle'
  }
}

export function getStatusConfig(status: UsageStatus): StatusConfig {
  return STATUS_CONFIGS[status]
}
