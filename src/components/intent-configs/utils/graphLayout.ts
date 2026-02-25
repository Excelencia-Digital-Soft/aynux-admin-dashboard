/**
 * Graph Layout Utilities - LangGraph Topology Layout
 *
 * Uses dagre for hierarchical top-to-bottom layout:
 * START → ROUTER → [action nodes] → RESPONSE_FORMATTER → END
 */

import dagre from 'dagre'
import type {
  GraphNode as ApiGraphNode,
  GraphEdge as ApiGraphEdge,
  RoutingConfigSummary,
  AwaitingTypeConfigSummary
} from '@/types/graphTopology.types'
import type { TopologyFlowNode, TopologyFlowEdge, TopologyNodeType } from '../types'

// =============================================================================
// Layout Configuration
// =============================================================================

const NODE_WIDTH = 220
const NODE_HEIGHT = 80
const TERMINAL_WIDTH = 100
const TERMINAL_HEIGHT = 40

function getNodeDimensions(nodeType: string): { width: number; height: number } {
  if (nodeType === 'terminal') {
    return { width: TERMINAL_WIDTH, height: TERMINAL_HEIGHT }
  }
  return { width: NODE_WIDTH, height: NODE_HEIGHT }
}

// =============================================================================
// Layout Generation
// =============================================================================

/**
 * Convert API topology data into Vue Flow nodes/edges with dagre layout
 */
export function layoutTopology(
  apiNodes: ApiGraphNode[],
  apiEdges: ApiGraphEdge[],
  selectedNodeId: string | null = null,
  routingConfigs: RoutingConfigSummary[] = [],
  awaitingTypeConfigs: AwaitingTypeConfigSummary[] = []
): { nodes: TopologyFlowNode[]; edges: TopologyFlowEdge[] } {
  // Pre-compute intents per node from routing configs
  const nodeIntentsMap: Record<string, string[]> = {}
  for (const rc of routingConfigs) {
    if (rc.target_node && rc.is_enabled) {
      if (!nodeIntentsMap[rc.target_node]) nodeIntentsMap[rc.target_node] = []
      if (!nodeIntentsMap[rc.target_node].includes(rc.target_intent)) {
        nodeIntentsMap[rc.target_node].push(rc.target_intent)
      }
    }
  }

  // For supervisor/router nodes: collect ALL unique intents (they dispatch, not receive)
  const allUniqueIntents = [...new Set(routingConfigs.filter(rc => rc.is_enabled).map(rc => rc.target_intent))]
  for (const node of apiNodes) {
    if (node.node_type === 'supervisor') {
      nodeIntentsMap[node.id] = allUniqueIntents
    }
  }

  // Pre-compute awaiting type names per node
  const nodeAwaitingMap: Record<string, string[]> = {}
  for (const ac of awaitingTypeConfigs) {
    if (ac.target_node && ac.is_enabled) {
      if (!nodeAwaitingMap[ac.target_node]) nodeAwaitingMap[ac.target_node] = []
      if (!nodeAwaitingMap[ac.target_node].includes(ac.awaiting_type)) {
        nodeAwaitingMap[ac.target_node].push(ac.awaiting_type)
      }
    }
  }
  // Detect hub-and-spoke pattern (>10 edges from one node)
  const outDegree: Record<string, number> = {}
  for (const edge of apiEdges) {
    outDegree[edge.source] = (outDegree[edge.source] || 0) + 1
  }
  const isHubAndSpoke = Object.values(outDegree).some((count) => count > 10)

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    nodesep: isHubAndSpoke ? 40 : 60,
    ranksep: isHubAndSpoke ? 120 : 100,
    marginx: 40,
    marginy: 40
  })

  // Add nodes to dagre with dynamic height for intent badges
  const effectiveNodeWidth = isHubAndSpoke ? 180 : NODE_WIDTH
  const nodeHeights: Record<string, number> = {}
  for (const node of apiNodes) {
    const dims = getNodeDimensions(node.node_type)
    const width = node.node_type === 'terminal' ? dims.width : effectiveNodeWidth
    let height = dims.height

    // Add extra height for intent badges on action nodes
    if (node.node_type === 'action') {
      const intentCount = nodeIntentsMap[node.id]?.length || 0
      if (intentCount > 0) {
        const maxVisible = 4
        const visibleCount = Math.min(intentCount, maxVisible) + (intentCount > maxVisible ? 1 : 0)
        const badgeRows = Math.ceil(visibleCount / 3)
        height += badgeRows * 20 + 8
      }
    }

    nodeHeights[node.id] = height
    g.setNode(node.id, { width, height })
  }

  // Add edges to dagre
  for (const edge of apiEdges) {
    g.setEdge(edge.source, edge.target)
  }

  // Run layout
  dagre.layout(g)

  // Convert to Vue Flow nodes
  const flowNodes: TopologyFlowNode[] = apiNodes.map((node) => {
    const dagreNode = g.node(node.id)
    const height = nodeHeights[node.id] || getNodeDimensions(node.node_type).height
    const width = node.node_type === 'terminal' ? TERMINAL_WIDTH : effectiveNodeWidth

    return {
      id: node.id,
      type: mapNodeType(node.node_type),
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2
      },
      data: {
        nodeId: node.id,
        nodeType: node.node_type,
        displayName: node.display_name,
        description: node.description,
        icon: node.icon,
        color: node.color,
        acceptsAwaitingTypes: node.accepts_awaiting_types,
        hasConditionalOutput: node.has_conditional_output,
        routingConfigCount: node.routing_config_count,
        awaitingTypeConfigCount: node.awaiting_type_config_count,
        subgraph: node.subgraph,
        routingIntents: nodeIntentsMap[node.id] || [],
        awaitingTypeNames: nodeAwaitingMap[node.id] || [],
        isSelected: node.id === selectedNodeId
      }
    }
  })

  // Convert to Vue Flow edges
  const flowEdges: TopologyFlowEdge[] = apiEdges.map((edge) => {
    const isConditional = edge.edge_type === 'conditional'
    const base: TopologyFlowEdge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: isConditional,
      label: edge.label || undefined,
      style: getEdgeStyle(edge),
      data: {
        edgeType: edge.edge_type as 'direct' | 'conditional',
        condition: edge.condition
      }
    }
    // Add label pill/badge styling for conditional edges with labels
    if (isConditional && edge.label) {
      base.labelStyle = { fill: '#e2e8f0', fontSize: '10px', fontWeight: 500 }
      base.labelBgStyle = { fill: '#1e293b', rx: 4, ry: 4 }
      base.labelBgPadding = [4, 6]
      base.labelShowBg = true
    }
    return base
  })

  return { nodes: flowNodes, edges: flowEdges }
}

// =============================================================================
// Helpers
// =============================================================================

function mapNodeType(apiType: string): TopologyNodeType {
  switch (apiType) {
    case 'supervisor':
      return 'router'
    case 'action':
      return 'action'
    case 'formatter':
      return 'formatter'
    case 'entry':
    case 'terminal':
    default:
      return 'terminal'
  }
}

function getEdgeStyle(edge: ApiGraphEdge): Record<string, string> {
  if (edge.edge_type === 'conditional') {
    return {
      stroke: '#8b5cf6',
      strokeWidth: '2'
    }
  }
  return {
    stroke: '#64748b',
    strokeWidth: '1.5'
  }
}
