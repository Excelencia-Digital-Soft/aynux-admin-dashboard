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

  // Create form
  const showCreateForm = ref(false)

  // Loading
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
    openCreateForm
  }
}
