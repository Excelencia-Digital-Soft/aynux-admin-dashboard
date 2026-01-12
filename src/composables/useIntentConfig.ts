/**
 * useIntentConfig Composable - High-level API for intent configuration management
 *
 * Wraps the store and API calls with error handling and toast notifications.
 */

import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useIntentConfigStore } from '@/stores/intentConfig.store'
import { useAuthStore } from '@/stores/auth.store'
import { intentConfigsApi } from '@/api/intentConfigs.api'
import type {
  IntentAgentMappingCreate,
  IntentAgentMappingUpdate,
  FlowAgentConfigCreate,
  FlowAgentConfigUpdate,
  KeywordAgentMappingCreate,
  KeywordAgentMappingBulkCreate,
  IntentTestRequest,
  SeedRequest,
} from '@/types/intentConfigs.types'

export function useIntentConfig() {
  const store = useIntentConfigStore()
  const authStore = useAuthStore()
  const toast = useToast()

  // Get current organization ID
  const organizationId = computed(() => authStore.currentOrgId || '')

  // =============================================================================
  // Intent Mappings
  // =============================================================================

  async function fetchIntentMappings(domainKey?: string | null, enabledOnly = false) {
    if (!organizationId.value) {
      toast.add({
        severity: 'warn',
        summary: 'Sin organizacion',
        detail: 'Selecciona una organizacion primero',
        life: 3000,
      })
      return
    }

    store.setLoading(true)
    store.setError(null)

    try {
      const response = await intentConfigsApi.listMappings(
        organizationId.value,
        domainKey,
        enabledOnly
      )
      store.setIntentMappings(response.mappings)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar mappings'
      store.setError(message)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      })
    } finally {
      store.setLoading(false)
    }
  }

  async function createIntentMapping(data: IntentAgentMappingCreate) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const mapping = await intentConfigsApi.createMapping(organizationId.value, data)
      store.addIntentMapping(mapping)
      toast.add({
        severity: 'success',
        summary: 'Mapping creado',
        detail: `Intent "${data.intent_key}" mapeado a "${data.agent_key}"`,
        life: 3000,
      })
      return mapping
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear mapping'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function updateIntentMapping(mappingId: string, data: IntentAgentMappingUpdate) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const mapping = await intentConfigsApi.updateMapping(organizationId.value, mappingId, data)
      store.updateIntentMapping(mappingId, mapping)
      toast.add({
        severity: 'success',
        summary: 'Mapping actualizado',
        detail: 'Configuracion guardada correctamente',
        life: 3000,
      })
      return mapping
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar mapping'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteIntentMapping(mappingId: string) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      await intentConfigsApi.deleteMapping(organizationId.value, mappingId)
      store.removeIntentMapping(mappingId)
      toast.add({
        severity: 'success',
        summary: 'Mapping eliminado',
        detail: 'El mapping ha sido eliminado',
        life: 3000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar mapping'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  // =============================================================================
  // Flow Agents
  // =============================================================================

  async function fetchFlowAgents(enabledOnly = false) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.listFlowAgents(organizationId.value, enabledOnly)
      store.setFlowAgents(response.configs)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar flow agents'
      store.setError(message)
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
    } finally {
      store.setLoading(false)
    }
  }

  async function createFlowAgent(data: FlowAgentConfigCreate) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const config = await intentConfigsApi.createFlowAgent(organizationId.value, data)
      store.addFlowAgent(config)
      toast.add({
        severity: 'success',
        summary: 'Flow agent creado',
        detail: `Agente "${data.agent_key}" configurado como flow`,
        life: 3000,
      })
      return config
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear flow agent'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function updateFlowAgent(agentKey: string, data: FlowAgentConfigUpdate) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const config = await intentConfigsApi.updateFlowAgent(organizationId.value, agentKey, data)
      store.updateFlowAgent(agentKey, config)
      toast.add({
        severity: 'success',
        summary: 'Flow agent actualizado',
        detail: 'Configuracion guardada correctamente',
        life: 3000,
      })
      return config
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar flow agent'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteFlowAgent(agentKey: string) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      await intentConfigsApi.deleteFlowAgent(organizationId.value, agentKey)
      store.removeFlowAgent(agentKey)
      toast.add({
        severity: 'success',
        summary: 'Flow agent eliminado',
        detail: 'La configuracion ha sido eliminada',
        life: 3000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar flow agent'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  // =============================================================================
  // Keywords
  // =============================================================================

  async function fetchKeywords(agentKey?: string | null, enabledOnly = false) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.listKeywords(
        organizationId.value,
        agentKey,
        enabledOnly
      )
      store.setKeywordMappings(response.mappings)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar keywords'
      store.setError(message)
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
    } finally {
      store.setLoading(false)
    }
  }

  async function createKeyword(data: KeywordAgentMappingCreate) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const keyword = await intentConfigsApi.createKeyword(organizationId.value, data)
      store.addKeywordMappings([keyword])
      toast.add({
        severity: 'success',
        summary: 'Keyword creado',
        detail: `Keyword "${data.keyword}" agregado`,
        life: 3000,
      })
      return keyword
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear keyword'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function createKeywordsBulk(data: KeywordAgentMappingBulkCreate) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.createKeywordsBulk(organizationId.value, data)
      store.addKeywordMappings(response.mappings)
      toast.add({
        severity: 'success',
        summary: 'Keywords creados',
        detail: `${response.total} keywords agregados`,
        life: 3000,
      })
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear keywords'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteKeyword(keywordId: string) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      await intentConfigsApi.deleteKeyword(organizationId.value, keywordId)
      store.removeKeywordMapping(keywordId)
      toast.add({
        severity: 'success',
        summary: 'Keyword eliminado',
        detail: 'El keyword ha sido eliminado',
        life: 3000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar keyword'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  // =============================================================================
  // Testing
  // =============================================================================

  async function testIntent(data: IntentTestRequest) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.testIntent(organizationId.value, data)
      store.setTestResult(response.result)
      return response.result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al probar intent'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  // =============================================================================
  // Visualization
  // =============================================================================

  async function fetchVisualization() {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.getVisualization(organizationId.value)
      store.setFlowVisualization(response.nodes, response.edges)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar visualizacion'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  // =============================================================================
  // Seed and Cache
  // =============================================================================

  async function seedFromDefaults(data: SeedRequest = {}) {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.seed(organizationId.value, data)
      toast.add({
        severity: 'success',
        summary: 'Seed completado',
        detail: `${response.mappings_created} mappings, ${response.flow_agents_created} flow agents, ${response.keywords_created} keywords`,
        life: 5000,
      })
      // Refresh all data
      await fetchAllConfigs()
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al hacer seed'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchCacheStats() {
    try {
      const stats = await intentConfigsApi.getCacheStats()
      store.setCacheStats(stats)
      return stats
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar stats'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    }
  }

  async function invalidateCache() {
    if (!organizationId.value) return

    try {
      const response = await intentConfigsApi.invalidateCache(organizationId.value)
      toast.add({
        severity: 'success',
        summary: 'Cache invalidado',
        detail: response.message,
        life: 3000,
      })
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al invalidar cache'
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    }
  }

  // =============================================================================
  // Combined
  // =============================================================================

  async function fetchAllConfigs() {
    if (!organizationId.value) return

    store.setLoading(true)
    try {
      const response = await intentConfigsApi.getAllConfigs(organizationId.value)
      store.setIntentMappings(response.intent_mappings)
      store.setFlowAgents(response.flow_agents)
      store.setKeywordMappings(response.keyword_mappings)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar configuraciones'
      store.setError(message)
      toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
      throw error
    } finally {
      store.setLoading(false)
    }
  }

  // =============================================================================
  // Return
  // =============================================================================

  return {
    // Store state (readonly)
    intentMappings: computed(() => store.intentMappings),
    flowAgents: computed(() => store.flowAgents),
    keywordMappings: computed(() => store.keywordMappings),
    flowNodes: computed(() => store.flowNodes),
    flowEdges: computed(() => store.flowEdges),
    lastTestResult: computed(() => store.lastTestResult),
    cacheStats: computed(() => store.cacheStats),
    loading: computed(() => store.loading),
    error: computed(() => store.error),

    // Store getters
    enabledMappings: computed(() => store.enabledMappings),
    mappedAgents: computed(() => store.mappedAgents),
    flowAgentKeys: computed(() => store.flowAgentKeys),
    keywordsByAgent: computed(() => store.keywordsByAgent),
    selectedMapping: computed(() => store.selectedMapping),
    isFlowAgent: store.isFlowAgent,
    keywordCountForAgent: store.keywordCountForAgent,

    // Store actions
    selectMapping: store.selectMapping,
    selectFlowAgent: store.selectFlowAgent,
    reset: store.reset,

    // API actions
    fetchIntentMappings,
    createIntentMapping,
    updateIntentMapping,
    deleteIntentMapping,
    fetchFlowAgents,
    createFlowAgent,
    updateFlowAgent,
    deleteFlowAgent,
    fetchKeywords,
    createKeyword,
    createKeywordsBulk,
    deleteKeyword,
    testIntent,
    fetchVisualization,
    seedFromDefaults,
    fetchCacheStats,
    invalidateCache,
    fetchAllConfigs,
  }
}
