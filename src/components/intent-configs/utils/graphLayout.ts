/**
 * Graph Layout Utilities - LangGraph Topology Layout
 *
 * Uses dagre for hierarchical top-to-bottom layout:
 * START → ROUTER → [action nodes] → RESPONSE_FORMATTER → END
 */

import dagre from 'dagre'
import type {
  GraphNode as ApiGraphNode,
  GraphEdge as ApiGraphEdge
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
  selectedNodeId: string | null = null
): { nodes: TopologyFlowNode[]; edges: TopologyFlowEdge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 100,
    marginx: 40,
    marginy: 40
  })

  // Add nodes to dagre
  for (const node of apiNodes) {
    const dims = getNodeDimensions(node.node_type)
    g.setNode(node.id, { width: dims.width, height: dims.height })
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
    const dims = getNodeDimensions(node.node_type)

    return {
      id: node.id,
      type: mapNodeType(node.node_type),
      position: {
        x: dagreNode.x - dims.width / 2,
        y: dagreNode.y - dims.height / 2
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
        isSelected: node.id === selectedNodeId
      }
    }
  })

  // Convert to Vue Flow edges
  const flowEdges: TopologyFlowEdge[] = apiEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.edge_type === 'conditional',
    label: edge.label || undefined,
    style: getEdgeStyle(edge),
    data: {
      edgeType: edge.edge_type as 'direct' | 'conditional',
      condition: edge.condition
    }
  }))

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
