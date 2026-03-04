/**
 * useIntentConfigGraph Composable
 *
 * Manages state and logic for the LangGraph topology editor.
 * Fetches graph topology from API and converts to Vue Flow nodes/edges.
 */

import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { graphTopologyApi } from '@/api/graphTopology.api'
import { routingConfigsApi } from '@/api/routingConfigs.api'
import { awaitingTypeConfigsApi } from '@/api/awaitingTypeConfigs.api'
import type { GraphTopologyResponse, RoutingConfigSummary, AwaitingTypeConfigSummary } from '@/types/graphTopology.types'
import type { RoutingConfigCreate, RoutingConfigUpdate } from '@/types/routingConfigs.types'
import type { AwaitingTypeConfigUpdate } from '@/api/awaitingTypeConfigs.api'
import { layoutTopology } from '../utils/graphLayout'
import type { TopologyFlowNode, TopologyFlowEdge, SelectedNodeInfo } from '../types'
import { useConfigValidation } from './useConfigValidation'

export function useIntentConfigGraph() {
  const toast = useToast()

  // ==========================================================================
  // State
  // ==========================================================================

  const nodes = ref<TopologyFlowNode[]>([])
  const edges = ref<TopologyFlowEdge[]>([])
  const topology = ref<GraphTopologyResponse | null>(null)

  // Domain selection
  const domainKey = ref('pharmacy')
  const availableDomains = ref<string[]>([])

  // Selection
  const selectedNodeId = ref<string | null>(null)
  const drawerVisible = ref(false)

  // Dependency highlighting (Phase 4)
  const highlightedRoutingConfigId = ref<string | null>(null)

  // Create form
  const showCreateForm = ref(false)

  // Loading
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Validation
  const {
    validationResult,
    isValidating,
    nodeIssueMap,
    totalIssues,
    refreshValidation,
    getNodeIssues
  } = useConfigValidation()

  // Default organization for validation (SYSTEM_ORG)
  const SYSTEM_ORG = '00000000-0000-0000-0000-000000000000'

  // ==========================================================================
  // Computed
  // ==========================================================================

  const selectedNode = computed<SelectedNodeInfo | null>(() => {
    if (!selectedNodeId.value || !topology.value) return null

    const node = nodes.value.find((n) => n.id === selectedNodeId.value)
    if (!node) return null

    // For supervisor nodes: show ALL routing configs (they dispatch to other nodes)
    // For other nodes: show only configs targeting this specific node
    const nodeRoutingConfigs =
      node.data.nodeType === 'supervisor'
        ? topology.value.routing_configs
        : topology.value.routing_configs.filter((rc) => rc.target_node === node.id)

    // Find awaiting type configs for this node
    const nodeAwaitingConfigs = topology.value.awaiting_type_configs.filter(
      (ac) => ac.target_node === node.id
    )

    return {
      nodeId: node.id,
      nodeType: node.data.nodeType,
      data: node.data,
      routingConfigs: nodeRoutingConfigs,
      awaitingTypeConfigs: nodeAwaitingConfigs
    }
  })

  const availableNodes = computed(() => {
    if (!topology.value) return []
    return topology.value.nodes
      .filter((n) => n.node_type !== 'terminal')
      .map((n) => ({ id: n.id, displayName: n.display_name }))
  })

  const stats = computed(() => {
    if (!topology.value) {
      return { nodes: 0, edges: 0, routingConfigs: 0, awaitingTypes: 0 }
    }
    return {
      nodes: topology.value.nodes.filter((n) => n.node_type !== 'terminal').length,
      edges: topology.value.edges.length,
      routingConfigs: topology.value.routing_configs.length,
      awaitingTypes: topology.value.awaiting_type_configs.length
    }
  })

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  async function fetchTopology() {
    isLoading.value = true
    error.value = null

    try {
      // Fetch available domains and topology in parallel
      const [domains, topoData] = await Promise.all([
        graphTopologyApi.listDomains(),
        graphTopologyApi.getTopology(domainKey.value)
      ])

      availableDomains.value = domains
      topology.value = topoData

      // Layout the graph
      rebuildGraph()

      // Trigger validation in background (non-blocking)
      refreshValidation(domainKey.value, SYSTEM_ORG).then(() => {
        // Re-inject validation data into nodes after results arrive
        injectValidationData()
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      error.value = `Error cargando topologia: ${msg}`
      console.error('Failed to fetch topology:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la topologia del grafo',
        life: 3000
      })
    } finally {
      isLoading.value = false
    }
  }

  function rebuildGraph() {
    if (!topology.value) return

    const result = layoutTopology(
      topology.value.nodes,
      topology.value.edges,
      selectedNodeId.value,
      topology.value.routing_configs,
      topology.value.awaiting_type_configs
    )

    nodes.value = result.nodes
    edges.value = result.edges
  }

  // ==========================================================================
  // Selection
  // ==========================================================================

  function selectNode(nodeId: string) {
    selectedNodeId.value = nodeId
    drawerVisible.value = true
    // Update selected state on nodes
    rebuildGraph()
  }

  function clearSelection() {
    selectedNodeId.value = null
    drawerVisible.value = false
    rebuildGraph()
  }

  // ==========================================================================
  // Domain Switching
  // ==========================================================================

  function setDomain(key: string) {
    domainKey.value = key
    selectedNodeId.value = null
    drawerVisible.value = false
    fetchTopology()
  }

  // ==========================================================================
  // Config Updates
  // ==========================================================================

  async function updateRoutingConfig(configId: string, updates: RoutingConfigUpdate) {
    try {
      await routingConfigsApi.update(configId, updates)
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'Configuracion de routing actualizada',
        life: 2000
      })
      // Refetch to get updated counts
      await fetchTopology()
    } catch (err) {
      console.error('Failed to update routing config:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la configuracion',
        life: 3000
      })
    }
  }

  async function updateRoutingConfigsBatch(ids: string[], updates: RoutingConfigUpdate) {
    try {
      await routingConfigsApi.batchUpdate({ ids, updates })
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: `${ids.length} configuraciones actualizadas`,
        life: 2000
      })
      await fetchTopology()
    } catch (err) {
      console.error('Failed to batch update routing configs:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron actualizar las configuraciones',
        life: 3000
      })
    }
  }

  async function updateAwaitingTypeConfig(configId: string, updates: AwaitingTypeConfigUpdate) {
    try {
      await awaitingTypeConfigsApi.update(configId, updates)
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'Configuracion de awaiting type actualizada',
        life: 2000
      })
      await fetchTopology()
    } catch (err) {
      console.error('Failed to update awaiting type config:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la configuracion',
        life: 3000
      })
    }
  }

  async function createRoutingConfig(data: RoutingConfigCreate) {
    try {
      await routingConfigsApi.create(data)
      showCreateForm.value = false
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Routing config creado exitosamente',
        life: 2000
      })
      await fetchTopology()
    } catch (err) {
      console.error('Failed to create routing config:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo crear la configuracion',
        life: 3000
      })
    }
  }

  async function deleteRoutingConfig(configId: string) {
    try {
      await routingConfigsApi.delete(configId)
      toast.add({
        severity: 'success',
        summary: 'Eliminado',
        detail: 'Routing config eliminado',
        life: 2000
      })
      await fetchTopology()
    } catch (err) {
      console.error('Failed to delete routing config:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la configuracion',
        life: 3000
      })
    }
  }

  function openCreateForm(targetNodeId?: string) {
    if (targetNodeId) {
      selectNode(targetNodeId)
    }
    showCreateForm.value = true
  }

  // ==========================================================================
  // Dependency Highlighting (Phase 4)
  // ==========================================================================

  /**
   * Computed set of node IDs that should be highlighted as part of
   * a routing config dependency chain (source → target).
   */
  const dependencyHighlightNodes = computed<Set<string>>(() => {
    if (!highlightedRoutingConfigId.value || !topology.value) return new Set()

    const rc = topology.value.routing_configs.find(
      (c) => c.id === highlightedRoutingConfigId.value
    )
    if (!rc) return new Set()

    const nodeSet = new Set<string>()

    // Target node (the node this routing config routes TO)
    if (rc.target_node) nodeSet.add(rc.target_node)

    // Source node: find which node generates the trigger for this routing config.
    // For button_mapping/list_selection: the node whose response_configs contain
    // buttons matching the trigger_value.
    // For simplicity, we use the supervisor/router node as the source since it
    // dispatches all routing decisions.
    const supervisorNode = topology.value.nodes.find(
      (n) => n.node_type === 'supervisor'
    )
    if (supervisorNode) nodeSet.add(supervisorNode.id)

    return nodeSet
  })

  /**
   * Computed set of edge IDs that should be highlighted as part of
   * a routing config dependency chain.
   */
  const dependencyHighlightEdges = computed<Set<string>>(() => {
    if (!highlightedRoutingConfigId.value || !topology.value) return new Set()

    const rc = topology.value.routing_configs.find(
      (c) => c.id === highlightedRoutingConfigId.value
    )
    if (!rc || !rc.target_node) return new Set()

    // Find edges that connect to the target node
    const edgeSet = new Set<string>()
    for (const edge of edges.value) {
      if (edge.target === rc.target_node) {
        edgeSet.add(edge.id)
      }
    }
    return edgeSet
  })

  function highlightDependency(routingConfigId: string | null) {
    highlightedRoutingConfigId.value = routingConfigId
  }

  /**
   * Inject validation issue counts into node data for badge rendering.
   */
  function injectValidationData() {
    const issueMap = nodeIssueMap.value
    for (const node of nodes.value) {
      const issues = issueMap[node.id]
      if (issues) {
        node.data = {
          ...node.data,
          validationCritical: issues.critical,
          validationWarning: issues.warning
        }
      } else {
        node.data = {
          ...node.data,
          validationCritical: 0,
          validationWarning: 0
        }
      }
    }
  }

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    nodes,
    edges,
    topology,
    domainKey,
    availableDomains,
    selectedNodeId,
    selectedNode,
    drawerVisible,
    showCreateForm,
    availableNodes,
    isLoading,
    error,
    stats,

    // Validation
    validationResult,
    isValidating,
    totalIssues,
    getNodeIssues,

    // Dependency highlighting
    highlightedRoutingConfigId,
    dependencyHighlightNodes,
    dependencyHighlightEdges,

    // Actions
    fetchTopology,
    selectNode,
    clearSelection,
    setDomain,
    updateRoutingConfig,
    updateRoutingConfigsBatch,
    updateAwaitingTypeConfig,
    createRoutingConfig,
    deleteRoutingConfig,
    openCreateForm,
    highlightDependency
  }
}
