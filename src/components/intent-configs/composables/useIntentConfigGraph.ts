/**
 * useIntentConfigGraph Composable
 *
 * Manages state and logic for the intent configuration graph visualization.
 * Combines data from domain intents, intent mappings, flow agents, and keywords.
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { useIntentConfigStore } from '@/stores/intentConfig.store'
import { useIntentConfig } from '@/composables/useIntentConfig'
import { useDomainIntents } from '@/composables/useDomainIntents'
import { domainIntentsApi } from '@/api/domainIntents.api'
import { generateGraph, getConnectedPath, formatAgentName } from '../utils/graphLayout'
import type {
  IntentConfigGraphNode,
  IntentConfigGraphEdge,
  GraphNodeType,
  GraphFilters,
  SelectedNodeInfo,
  DomainNodeData,
  IntentNodeData,
  AgentNodeData,
  KeywordGroupNodeData
} from '../types'
import type { DomainIntent, DomainKey, IntentCreate } from '@/types/domainIntents.types'
import type { UsageStatus } from '@/types/intentConfigs.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

export function useIntentConfigGraph() {
  const toast = useToast()
  const authStore = useAuthStore()
  const store = useIntentConfigStore()
  const intentConfigComposable = useIntentConfig()

  // ==========================================================================
  // State
  // ==========================================================================

  // Graph state
  const nodes = ref<IntentConfigGraphNode[]>([])
  const edges = ref<IntentConfigGraphEdge[]>([])

  // Data state
  const domainIntents = ref<Map<string, DomainIntent[]>>(new Map())

  // UI state
  const selectedNodeId = ref<string | null>(null)
  const selectedNodeType = ref<GraphNodeType | null>(null)
  const highlightedPath = ref<string[]>([])

  // Filters
  const filters = ref<GraphFilters>({
    domainKey: null,
    status: 'all',
    showDisabled: true
  })

  // Loading
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Drawer state
  const drawerVisible = ref(false)

  // ==========================================================================
  // Computed
  // ==========================================================================

  const organizationId = computed(() => authStore.currentOrgId)

  const availableDomains = computed(() => AVAILABLE_DOMAINS)

  const selectedNode = computed<SelectedNodeInfo | null>(() => {
    if (!selectedNodeId.value) return null
    const node = nodes.value.find(n => n.id === selectedNodeId.value)
    if (!node) return null
    return {
      nodeId: node.id,
      nodeType: node.type as GraphNodeType,
      data: node.data
    }
  })

  // Get all domain intents as a flat array
  const allIntents = computed(() => {
    const all: DomainIntent[] = []
    domainIntents.value.forEach(intents => all.push(...intents))
    return all
  })

  // Stats
  const stats = computed(() => ({
    totalDomains: domainIntents.value.size,
    totalIntents: allIntents.value.length,
    totalMappings: store.intentMappings.length,
    totalAgents: store.mappedAgents.length,
    totalKeywords: store.keywordMappings.length,
    totalFlowAgents: store.flowAgents.filter(f => f.is_flow_agent).length,
    activeIntents: allIntents.value.filter(i => i.is_enabled).length,
    enabledMappings: store.enabledMappings.length
  }))

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  async function fetchAllData() {
    if (!organizationId.value) {
      toast.add({
        severity: 'warn',
        summary: 'Sin organización',
        detail: 'Selecciona una organización primero',
        life: 3000
      })
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // Fetch all configs (mappings, flow agents, keywords)
      await intentConfigComposable.fetchAllConfigs()

      // Fetch intents for all domains
      const domainsToFetch = filters.value.domainKey
        ? [filters.value.domainKey]
        : AVAILABLE_DOMAINS.map(d => d.key)

      const intentsMap = new Map<string, DomainIntent[]>()

      await Promise.all(
        domainsToFetch.map(async domainKey => {
          try {
            const intents = await domainIntentsApi.listIntents(
              domainKey as DomainKey,
              organizationId.value!
            )
            if (intents.length > 0) {
              intentsMap.set(domainKey, intents)
            }
          } catch (err) {
            console.warn(`Failed to fetch intents for domain ${domainKey}:`, err)
          }
        })
      )

      domainIntents.value = intentsMap

      // Generate graph
      regenerateGraph()
    } catch (err) {
      console.error('Error fetching graph data:', err)
      error.value = 'Error al cargar los datos del grafo'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos',
        life: 5000
      })
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================================================
  // Graph Generation
  // ==========================================================================

  function regenerateGraph() {
    const generated = generateGraph({
      domainIntents: domainIntents.value,
      intentMappings: store.intentMappings,
      flowAgents: store.flowAgents,
      keywordMappings: store.keywordMappings,
      filters: {
        domainKey: filters.value.domainKey,
        status: filters.value.status as UsageStatus | 'all',
        showDisabled: filters.value.showDisabled
      }
    })

    nodes.value = generated.nodes
    edges.value = generated.edges

    // Clear selection if selected node no longer exists
    if (selectedNodeId.value && !nodes.value.find(n => n.id === selectedNodeId.value)) {
      clearSelection()
    }
  }

  // ==========================================================================
  // Selection
  // ==========================================================================

  function selectNode(nodeId: string | null) {
    if (nodeId === selectedNodeId.value) {
      // Toggle off
      clearSelection()
      return
    }

    selectedNodeId.value = nodeId

    if (nodeId) {
      const node = nodes.value.find(n => n.id === nodeId)
      selectedNodeType.value = node?.type as GraphNodeType || null

      // Highlight connected path
      highlightedPath.value = getConnectedPath(nodeId, nodes.value, edges.value)

      // Open drawer
      drawerVisible.value = true
    } else {
      selectedNodeType.value = null
      highlightedPath.value = []
    }
  }

  function clearSelection() {
    selectedNodeId.value = null
    selectedNodeType.value = null
    highlightedPath.value = []
    drawerVisible.value = false
  }

  // ==========================================================================
  // Filters
  // ==========================================================================

  function setFilter<K extends keyof GraphFilters>(key: K, value: GraphFilters[K]) {
    filters.value[key] = value
    regenerateGraph()
  }

  function clearFilters() {
    filters.value = {
      domainKey: null,
      status: 'all',
      showDisabled: true
    }
    regenerateGraph()
  }

  // ==========================================================================
  // CRUD Operations - Intents
  // ==========================================================================

  async function createIntent(domainKey: DomainKey, data: IntentCreate): Promise<boolean> {
    if (!organizationId.value) {
      toast.add({
        severity: 'warn',
        summary: 'Sin organización',
        detail: 'Selecciona una organización primero',
        life: 3000
      })
      return false
    }

    try {
      await domainIntentsApi.createIntent(domainKey, organizationId.value, data)

      toast.add({
        severity: 'success',
        summary: 'Intent creado',
        detail: `"${data.name}" creado correctamente`,
        life: 3000
      })

      // Refresh data
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error creating intent:', err)
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el intent'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      })
      return false
    }
  }

  async function deleteIntent(domainKey: DomainKey, intentId: string, intentName: string): Promise<boolean> {
    try {
      await domainIntentsApi.deleteIntent(domainKey, intentId)

      toast.add({
        severity: 'success',
        summary: 'Intent eliminado',
        detail: `"${intentName}" eliminado correctamente`,
        life: 3000
      })

      // Close drawer since the intent no longer exists
      clearSelection()

      // Refresh data
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error deleting intent:', err)
      const errorMessage = err instanceof Error ? err.message : 'No se pudo eliminar el intent'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      })
      return false
    }
  }

  async function updateIntent(
    intentId: string,
    updates: Partial<DomainIntent>
  ): Promise<boolean> {
    try {
      // Find the intent to get its domain
      let domainKey: string | null = null
      domainIntents.value.forEach((intents, key) => {
        if (intents.find(i => i.id === intentId)) {
          domainKey = key
        }
      })

      if (!domainKey) {
        throw new Error('Intent not found')
      }

      await domainIntentsApi.updateIntent(domainKey as DomainKey, intentId, updates)

      toast.add({
        severity: 'success',
        summary: 'Intent actualizado',
        detail: 'Los cambios se guardaron correctamente',
        life: 3000
      })

      // Refresh data
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error updating intent:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el intent',
        life: 5000
      })
      return false
    }
  }

  // ==========================================================================
  // CRUD Operations - Mappings
  // ==========================================================================

  async function createMapping(domainKey: string, intentKey: string, agentKey: string): Promise<boolean> {
    try {
      // Find the intent name from domainIntents
      const intents = domainIntents.value.get(domainKey)
      const intent = intents?.find(i => i.intent_key === intentKey)
      const intentName = intent?.name || intentKey

      await intentConfigComposable.createIntentMapping({
        intent_key: intentKey,
        intent_name: intentName,
        agent_key: agentKey,
        domain_key: domainKey
      })

      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error creating mapping:', err)
      return false
    }
  }

  async function updateMapping(
    mappingId: string,
    updates: { agent_key?: string; is_enabled?: boolean; confidence_threshold?: number }
  ): Promise<boolean> {
    try {
      await intentConfigComposable.updateIntentMapping(mappingId, updates)
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error updating mapping:', err)
      return false
    }
  }

  async function deleteMapping(mappingId: string): Promise<boolean> {
    try {
      await intentConfigComposable.deleteIntentMapping(mappingId)
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error deleting mapping:', err)
      return false
    }
  }

  // ==========================================================================
  // CRUD Operations - Keywords
  // ==========================================================================

  async function addKeywords(agentKey: string, keywords: string[]): Promise<boolean> {
    try {
      await intentConfigComposable.createKeywordsBulk({
        agent_key: agentKey,
        keywords
      })

      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error adding keywords:', err)
      return false
    }
  }

  async function deleteKeyword(keywordId: string): Promise<boolean> {
    try {
      await intentConfigComposable.deleteKeyword(keywordId)
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error deleting keyword:', err)
      return false
    }
  }

  // ==========================================================================
  // CRUD Operations - Flow Agents
  // ==========================================================================

  async function updateFlowAgent(
    agentKey: string,
    updates: { is_flow_agent?: boolean; is_enabled?: boolean; max_turns?: number }
  ): Promise<boolean> {
    try {
      await intentConfigComposable.updateFlowAgent(agentKey, updates)
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Error updating flow agent:', err)
      return false
    }
  }

  // ==========================================================================
  // Watchers
  // ==========================================================================

  // Watch for organization changes
  watch(organizationId, newOrgId => {
    if (newOrgId) {
      fetchAllData()
    } else {
      nodes.value = []
      edges.value = []
      domainIntents.value.clear()
      clearSelection()
    }
  })

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    nodes,
    edges,
    domainIntents,
    selectedNodeId,
    selectedNodeType,
    highlightedPath,
    filters,
    isLoading,
    error,
    drawerVisible,

    // Computed
    organizationId,
    availableDomains,
    selectedNode,
    allIntents,
    stats,

    // Store refs
    intentMappings: computed(() => store.intentMappings),
    flowAgents: computed(() => store.flowAgents),
    keywordMappings: computed(() => store.keywordMappings),

    // Data fetching
    fetchAllData,
    regenerateGraph,

    // Selection
    selectNode,
    clearSelection,

    // Filters
    setFilter,
    clearFilters,

    // CRUD - Intents
    createIntent,
    deleteIntent,
    updateIntent,

    // CRUD - Mappings
    createMapping,
    updateMapping,
    deleteMapping,

    // CRUD - Keywords
    addKeywords,
    deleteKeyword,

    // CRUD - Flow Agents
    updateFlowAgent,

    // Helpers
    formatAgentName
  }
}
