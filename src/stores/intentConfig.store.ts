/**
 * Intent Config Store - Pinia store for managing intent routing configurations
 *
 * Manages:
 * - Intent-Agent Mappings
 * - Flow Agent Configs
 * - Keyword Agent Mappings
 * - Testing and Visualization
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  IntentAgentMapping,
  FlowAgentConfig,
  KeywordAgentMapping,
  IntentTestResult,
  FlowNode,
  FlowEdge,
  CacheStatsResponse,
} from '@/types/intentConfigs.types'

export const useIntentConfigStore = defineStore('intentConfig', () => {
  // =============================================================================
  // State
  // =============================================================================

  // Data
  const intentMappings = ref<IntentAgentMapping[]>([])
  const flowAgents = ref<FlowAgentConfig[]>([])
  const keywordMappings = ref<KeywordAgentMapping[]>([])

  // Visualization
  const flowNodes = ref<FlowNode[]>([])
  const flowEdges = ref<FlowEdge[]>([])

  // Testing
  const lastTestResult = ref<IntentTestResult | null>(null)

  // Cache stats
  const cacheStats = ref<CacheStatsResponse | null>(null)

  // UI State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedMappingId = ref<string | null>(null)
  const selectedFlowAgentKey = ref<string | null>(null)

  // =============================================================================
  // Getters
  // =============================================================================

  // Get enabled mappings only
  const enabledMappings = computed(() => intentMappings.value.filter((m) => m.is_enabled))

  // Get unique agents from mappings
  const mappedAgents = computed(() => [
    ...new Set(intentMappings.value.map((m) => m.agent_key)),
  ])

  // Get flow agent keys
  const flowAgentKeys = computed(() =>
    flowAgents.value.filter((f) => f.is_flow_agent && f.is_enabled).map((f) => f.agent_key)
  )

  // Get keywords grouped by agent
  const keywordsByAgent = computed(() => {
    const grouped: Record<string, KeywordAgentMapping[]> = {}
    for (const kw of keywordMappings.value) {
      if (!grouped[kw.agent_key]) {
        grouped[kw.agent_key] = []
      }
      grouped[kw.agent_key].push(kw)
    }
    return grouped
  })

  // Check if agent is a flow agent
  const isFlowAgent = (agentKey: string) => flowAgentKeys.value.includes(agentKey)

  // Get selected mapping
  const selectedMapping = computed(() =>
    intentMappings.value.find((m) => m.id === selectedMappingId.value) || null
  )

  // Get keyword count for agent
  const keywordCountForAgent = (agentKey: string) =>
    keywordMappings.value.filter((k) => k.agent_key === agentKey).length

  // =============================================================================
  // Actions - Intent Mappings
  // =============================================================================

  function setIntentMappings(mappings: IntentAgentMapping[]) {
    intentMappings.value = mappings
  }

  function addIntentMapping(mapping: IntentAgentMapping) {
    intentMappings.value.push(mapping)
  }

  function updateIntentMapping(id: string, updates: Partial<IntentAgentMapping>) {
    const index = intentMappings.value.findIndex((m) => m.id === id)
    if (index !== -1) {
      intentMappings.value[index] = { ...intentMappings.value[index], ...updates }
    }
  }

  function removeIntentMapping(id: string) {
    intentMappings.value = intentMappings.value.filter((m) => m.id !== id)
  }

  // =============================================================================
  // Actions - Flow Agents
  // =============================================================================

  function setFlowAgents(configs: FlowAgentConfig[]) {
    flowAgents.value = configs
  }

  function addFlowAgent(config: FlowAgentConfig) {
    flowAgents.value.push(config)
  }

  function updateFlowAgent(agentKey: string, updates: Partial<FlowAgentConfig>) {
    const index = flowAgents.value.findIndex((f) => f.agent_key === agentKey)
    if (index !== -1) {
      flowAgents.value[index] = { ...flowAgents.value[index], ...updates }
    }
  }

  function removeFlowAgent(agentKey: string) {
    flowAgents.value = flowAgents.value.filter((f) => f.agent_key !== agentKey)
  }

  // =============================================================================
  // Actions - Keyword Mappings
  // =============================================================================

  function setKeywordMappings(keywords: KeywordAgentMapping[]) {
    keywordMappings.value = keywords
  }

  function addKeywordMappings(keywords: KeywordAgentMapping[]) {
    keywordMappings.value.push(...keywords)
  }

  function removeKeywordMapping(id: string) {
    keywordMappings.value = keywordMappings.value.filter((k) => k.id !== id)
  }

  // =============================================================================
  // Actions - Visualization
  // =============================================================================

  function setFlowVisualization(nodes: FlowNode[], edges: FlowEdge[]) {
    flowNodes.value = nodes
    flowEdges.value = edges
  }

  // =============================================================================
  // Actions - Testing
  // =============================================================================

  function setTestResult(result: IntentTestResult | null) {
    lastTestResult.value = result
  }

  // =============================================================================
  // Actions - Cache
  // =============================================================================

  function setCacheStats(stats: CacheStatsResponse | null) {
    cacheStats.value = stats
  }

  // =============================================================================
  // Actions - UI State
  // =============================================================================

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(value: string | null) {
    error.value = value
  }

  function selectMapping(id: string | null) {
    selectedMappingId.value = id
  }

  function selectFlowAgent(agentKey: string | null) {
    selectedFlowAgentKey.value = agentKey
  }

  function reset() {
    intentMappings.value = []
    flowAgents.value = []
    keywordMappings.value = []
    flowNodes.value = []
    flowEdges.value = []
    lastTestResult.value = null
    cacheStats.value = null
    loading.value = false
    error.value = null
    selectedMappingId.value = null
    selectedFlowAgentKey.value = null
  }

  // =============================================================================
  // Return
  // =============================================================================

  return {
    // State
    intentMappings,
    flowAgents,
    keywordMappings,
    flowNodes,
    flowEdges,
    lastTestResult,
    cacheStats,
    loading,
    error,
    selectedMappingId,
    selectedFlowAgentKey,

    // Getters
    enabledMappings,
    mappedAgents,
    flowAgentKeys,
    keywordsByAgent,
    isFlowAgent,
    selectedMapping,
    keywordCountForAgent,

    // Actions - Intent Mappings
    setIntentMappings,
    addIntentMapping,
    updateIntentMapping,
    removeIntentMapping,

    // Actions - Flow Agents
    setFlowAgents,
    addFlowAgent,
    updateFlowAgent,
    removeFlowAgent,

    // Actions - Keyword Mappings
    setKeywordMappings,
    addKeywordMappings,
    removeKeywordMapping,

    // Actions - Visualization
    setFlowVisualization,

    // Actions - Testing
    setTestResult,

    // Actions - Cache
    setCacheStats,

    // Actions - UI State
    setLoading,
    setError,
    selectMapping,
    selectFlowAgent,
    reset,
  }
})
