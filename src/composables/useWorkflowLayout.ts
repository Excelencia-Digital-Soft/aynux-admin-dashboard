/**
 * Composable for Workflow auto-layout functionality
 *
 * Uses dagre library to automatically position workflow nodes.
 */

import { ref, computed } from 'vue'
import dagre from 'dagre'
import { useVueFlow } from '@vue-flow/core'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow.types'

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL'

export interface LayoutOptions {
  direction: LayoutDirection
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
  edgeSep?: number
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path'
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 200,
  nodeHeight: 80,
  rankSep: 80,
  nodeSep: 50,
  edgeSep: 20,
  ranker: 'network-simplex'
}

export function useWorkflowLayout() {
  const store = useWorkflowStore()
  const { fitView } = useVueFlow()
  const toast = useToast()

  // State
  const isLayouting = ref(false)
  const lastLayoutDirection = ref<LayoutDirection>('TB')

  // Computed
  const nodes = computed(() => store.nodes)
  const edges = computed(() => store.edges)

  /**
   * Calculate layout positions using dagre
   */
  function calculateLayout(
    inputNodes: WorkflowNode[],
    inputEdges: WorkflowEdge[],
    options: Partial<LayoutOptions> = {}
  ): Map<string, { x: number; y: number }> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const positions = new Map<string, { x: number; y: number }>()

    if (inputNodes.length === 0) {
      return positions
    }

    // Create dagre graph
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
      rankdir: opts.direction,
      ranksep: opts.rankSep,
      nodesep: opts.nodeSep,
      edgesep: opts.edgeSep,
      ranker: opts.ranker
    })

    // Add nodes to graph
    for (const node of inputNodes) {
      g.setNode(node.id, {
        width: opts.nodeWidth,
        height: opts.nodeHeight
      })
    }

    // Add edges to graph
    for (const edge of inputEdges) {
      g.setEdge(edge.source, edge.target)
    }

    // Run layout algorithm
    dagre.layout(g)

    // Extract positions
    for (const node of inputNodes) {
      const nodeWithPosition = g.node(node.id)
      if (nodeWithPosition) {
        // Dagre returns center position, convert to top-left
        positions.set(node.id, {
          x: nodeWithPosition.x - (opts.nodeWidth! / 2),
          y: nodeWithPosition.y - (opts.nodeHeight! / 2)
        })
      }
    }

    return positions
  }

  /**
   * Apply calculated layout to the workflow
   */
  async function applyLayout(options: Partial<LayoutOptions> = {}): Promise<boolean> {
    if (nodes.value.length === 0) {
      toast.warn('No hay nodos para organizar')
      return false
    }

    isLayouting.value = true

    try {
      const opts = { ...DEFAULT_OPTIONS, ...options }
      lastLayoutDirection.value = opts.direction

      // Calculate new positions
      const positions = calculateLayout(nodes.value, edges.value, opts)

      // Apply positions to store
      for (const [nodeId, position] of positions) {
        store.updateNodePosition(nodeId, position)
      }

      // Regenerate graph
      store.generateGraph()

      // Fit view with padding
      await new Promise(resolve => setTimeout(resolve, 50))
      fitView({ padding: 0.2, duration: 400 })

      toast.success('Layout aplicado correctamente')
      return true
    } catch (e) {
      toast.error('Error al aplicar layout')
      return false
    } finally {
      isLayouting.value = false
    }
  }

  /**
   * Apply top-to-bottom layout
   */
  function layoutTopToBottom(): Promise<boolean> {
    return applyLayout({ direction: 'TB' })
  }

  /**
   * Apply left-to-right layout
   */
  function layoutLeftToRight(): Promise<boolean> {
    return applyLayout({ direction: 'LR' })
  }

  /**
   * Apply bottom-to-top layout
   */
  function layoutBottomToTop(): Promise<boolean> {
    return applyLayout({ direction: 'BT' })
  }

  /**
   * Apply right-to-left layout
   */
  function layoutRightToLeft(): Promise<boolean> {
    return applyLayout({ direction: 'RL' })
  }

  /**
   * Layout only selected/connected nodes
   */
  async function layoutSubgraph(nodeIds: string[]): Promise<boolean> {
    const subNodes = nodes.value.filter(n => nodeIds.includes(n.id))
    const subEdges = edges.value.filter(e =>
      nodeIds.includes(e.source) && nodeIds.includes(e.target)
    )

    if (subNodes.length === 0) {
      toast.warn('No hay nodos seleccionados para organizar')
      return false
    }

    isLayouting.value = true

    try {
      // Calculate layout for subgraph
      const positions = calculateLayout(subNodes, subEdges, { direction: lastLayoutDirection.value })

      // Find offset to keep nodes in relative position
      const firstNode = subNodes[0]
      const originalPos = { x: firstNode.position.x, y: firstNode.position.y }
      const newPos = positions.get(firstNode.id)
      const offset = newPos
        ? { x: originalPos.x - newPos.x, y: originalPos.y - newPos.y }
        : { x: 0, y: 0 }

      // Apply positions with offset
      for (const [nodeId, position] of positions) {
        store.updateNodePosition(nodeId, {
          x: position.x + offset.x,
          y: position.y + offset.y
        })
      }

      store.generateGraph()
      toast.success('Sub-layout aplicado correctamente')
      return true
    } catch (e) {
      toast.error('Error al aplicar sub-layout')
      return false
    } finally {
      isLayouting.value = false
    }
  }

  return {
    // State
    isLayouting,
    lastLayoutDirection,

    // Actions
    calculateLayout,
    applyLayout,
    layoutTopToBottom,
    layoutLeftToRight,
    layoutBottomToTop,
    layoutRightToLeft,
    layoutSubgraph,
    autoLayout: layoutTopToBottom
  }
}

export default useWorkflowLayout
