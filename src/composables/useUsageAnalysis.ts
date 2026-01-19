/**
 * Usage Analysis Composable
 *
 * Analyzes relationships between intent configurations to determine:
 * - Which configs are actively in use (have complete relationships)
 * - Which configs are unused (no relationships)
 * - Which configs are orphaned (reference non-existent entities)
 *
 * Used by the redesigned IntentConfigsPage for master-detail navigation
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import { useIntentConfigStore } from '@/stores/intentConfig.store'
import type {
  UsageStatus,
  UsageAnalysis,
  ConfigNode,
  DomainHealth,
  DomainHealthIssue,
  UsageFilter,
  DomainStats,
  IntentAgentMapping,
  FlowAgentConfig,
  KeywordAgentMapping,
} from '@/types/intentConfigs.types'
import type { DomainIntent, DomainKey } from '@/types/domainIntents.types'
import type { OrchestratorRoute } from '@/types/agentFlow.types'

/**
 * Props for the usage analysis composable
 */
export interface UseUsageAnalysisOptions {
  /** Ref to domain intents array (from useDomainIntents composable) */
  domainIntents: Ref<DomainIntent[]> | ComputedRef<DomainIntent[]>
  /** Optional ref to orchestrator routes (from agentFlowApi) */
  orchestratorRoutes?: Ref<OrchestratorRoute[]> | ComputedRef<OrchestratorRoute[]>
}

export function useUsageAnalysis(options: UseUsageAnalysisOptions) {
  const { domainIntents, orchestratorRoutes } = options
  const intentConfigStore = useIntentConfigStore()

  // =============================================================================
  // Core Analysis
  // =============================================================================

  /**
   * Analyze all configurations and their relationships
   */
  const usageAnalysis = computed<UsageAnalysis>(() => {
    const mappings = intentConfigStore.intentMappings
    const flowAgents = intentConfigStore.flowAgents
    const keywords = intentConfigStore.keywordMappings
    const intents = domainIntents.value

    // Build sets for relationship tracking
    const intentsWithMappings = new Set(mappings.map((m) => m.intent_key))
    const agentsWithMappings = new Set(mappings.map((m) => m.agent_key))
    const agentsWithKeywords = new Set(keywords.map((k) => k.agent_key))
    const agentsWithFlowConfig = new Set(
      flowAgents.filter((f) => f.is_flow_agent && f.is_enabled).map((f) => f.agent_key)
    )

    // Build set of intents from orchestrator routes (alternative usage source)
    const intentsFromRoutes = new Set(
      (orchestratorRoutes?.value || []).map((r) => r.intent)
    )

    // Combined: intents in use from ANY source (mappings OR routes)
    const intentsInUse = new Set([...intentsWithMappings, ...intentsFromRoutes])

    // Get all domain intent keys
    const allIntentKeys = new Set(intents.map((i) => i.intent_key))
    const intentsWithPatterns = new Set(
      intents
        .filter(
          (i) =>
            i.lemmas.length > 0 ||
            i.phrases.length > 0 ||
            i.keywords.length > 0 ||
            i.confirmation_patterns.length > 0
        )
        .map((i) => i.intent_key)
    )

    // Find intents without mappings (orphaned domain intents)
    const intentsWithoutMappings = new Set<string>()
    for (const intentKey of allIntentKeys) {
      if (!intentsWithMappings.has(intentKey)) {
        intentsWithoutMappings.add(intentKey)
      }
    }

    // Find orphaned mappings (pointing to non-existent intents in domain)
    const orphanedMappingIds: string[] = []
    for (const mapping of mappings) {
      // A mapping is orphaned if it references an intent_key that doesn't exist in domain intents
      // However, mappings can also be global (domain_key = null), so we only check domain-specific ones
      if (mapping.domain_key && !allIntentKeys.has(mapping.intent_key)) {
        orphanedMappingIds.push(mapping.id)
      }
    }

    // Find orphaned keywords (pointing to agents with no mappings)
    const orphanedKeywordIds: string[] = []
    for (const keyword of keywords) {
      if (!agentsWithMappings.has(keyword.agent_key)) {
        orphanedKeywordIds.push(keyword.id)
      }
    }

    // Find unused flow agents (configured but no mappings)
    const unusedFlowAgentKeys: string[] = []
    for (const flowAgent of flowAgents) {
      if (flowAgent.is_enabled && !agentsWithMappings.has(flowAgent.agent_key)) {
        unusedFlowAgentKeys.push(flowAgent.agent_key)
      }
    }

    // Count active configs
    const activeCount =
      mappings.filter((m) => m.is_enabled).length +
      keywords.filter((k) => k.is_enabled).length +
      flowAgents.filter((f) => f.is_enabled).length

    const unusedCount =
      intentsWithoutMappings.size +
      unusedFlowAgentKeys.length +
      mappings.filter((m) => !m.is_enabled).length +
      keywords.filter((k) => !k.is_enabled).length

    const orphanedCount = orphanedMappingIds.length + orphanedKeywordIds.length

    return {
      intentsWithMappings,
      intentsWithoutMappings,
      intentsWithPatterns,
      intentsFromRoutes,
      intentsInUse,
      agentsWithMappings,
      agentsWithKeywords,
      agentsWithFlowConfig,
      orphanedMappingIds,
      orphanedKeywordIds,
      unusedFlowAgentKeys,
      totalIntents: intents.length,
      totalMappings: mappings.length,
      totalKeywords: keywords.length,
      totalFlowAgents: flowAgents.length,
      activeCount,
      unusedCount,
      orphanedCount,
    }
  })

  // =============================================================================
  // Status Determination
  // =============================================================================

  /**
   * Get usage status for an intent mapping
   */
  function getMappingStatus(mapping: IntentAgentMapping): UsageStatus {
    const analysis = usageAnalysis.value

    // Check if orphaned (references non-existent intent)
    if (analysis.orphanedMappingIds.includes(mapping.id)) {
      return 'orphaned'
    }

    // Check if disabled
    if (!mapping.is_enabled) {
      return 'unused'
    }

    // Check if the intent has patterns (complete config)
    if (analysis.intentsWithPatterns.has(mapping.intent_key)) {
      return 'active'
    }

    // Enabled but incomplete
    return 'idle'
  }

  /**
   * Get usage status for an agent (based on all its relationships)
   */
  function getAgentStatus(agentKey: string): UsageStatus {
    const analysis = usageAnalysis.value

    const hasMappings = analysis.agentsWithMappings.has(agentKey)
    const hasKeywords = analysis.agentsWithKeywords.has(agentKey)
    const hasFlowConfig = analysis.agentsWithFlowConfig.has(agentKey)

    // Agent is unused if it has no incoming connections
    if (!hasMappings && !hasKeywords) {
      return 'unused'
    }

    // Agent is active if it has mappings
    if (hasMappings) {
      return 'active'
    }

    // Agent only has keywords (fallback only)
    return 'idle'
  }

  /**
   * Get usage status for a keyword mapping
   */
  function getKeywordStatus(keyword: KeywordAgentMapping): UsageStatus {
    const analysis = usageAnalysis.value

    // Check if orphaned (points to agent with no mappings)
    if (analysis.orphanedKeywordIds.includes(keyword.id)) {
      return 'orphaned'
    }

    // Check if disabled
    if (!keyword.is_enabled) {
      return 'unused'
    }

    return 'active'
  }

  /**
   * Get usage status for a domain intent
   *
   * Logic:
   * - active: Has patterns (can be detected)
   * - idle: Has routing but no patterns (expected but can't detect)
   * - unused: No patterns and no routing
   * - orphaned: Disabled intent
   */
  function getIntentStatus(intent: DomainIntent): UsageStatus {
    const analysis = usageAnalysis.value

    // Check if disabled
    if (!intent.is_enabled) {
      return 'unused'
    }

    // Check if has patterns (can be detected)
    const hasPatterns =
      intent.lemmas.length > 0 ||
      intent.phrases.length > 0 ||
      intent.keywords.length > 0 ||
      intent.confirmation_patterns.length > 0

    // Check if in use by ANY source (mappings OR orchestrator routes)
    const isInUse = analysis.intentsInUse.has(intent.intent_key)

    // Intent with patterns = active (can be detected)
    if (hasPatterns) {
      return 'active'
    }

    // Intent in use but no patterns = idle (expected but can't detect)
    if (isInUse && !hasPatterns) {
      return 'idle'
    }

    // Intent not in use and without patterns = unused
    return 'unused'
  }

  /**
   * Get usage status for a flow agent config
   */
  function getFlowAgentStatus(flowAgent: FlowAgentConfig): UsageStatus {
    const analysis = usageAnalysis.value

    if (!flowAgent.is_enabled) {
      return 'unused'
    }

    if (analysis.unusedFlowAgentKeys.includes(flowAgent.agent_key)) {
      return 'orphaned'
    }

    return 'active'
  }

  // =============================================================================
  // Domain Health
  // =============================================================================

  /**
   * Calculate health score and issues for a domain
   */
  function getDomainHealth(domainKey: DomainKey): DomainHealth {
    const analysis = usageAnalysis.value
    const mappings = intentConfigStore.intentMappings.filter(
      (m) => m.domain_key === domainKey || m.domain_key === null
    )
    const intentsForDomain = domainIntents.value.filter((i) => i.domain_key === domainKey)
    const keywords = intentConfigStore.keywordMappings
    const flowAgents = intentConfigStore.flowAgents

    const issues: DomainHealthIssue[] = []

    // Find issues
    // 1. Domain intents without mappings
    for (const intent of intentsForDomain) {
      if (!analysis.intentsWithMappings.has(intent.intent_key)) {
        issues.push({
          severity: 'warning',
          type: 'agent_no_mappings',
          message: `Intent "${intent.name}" no tiene routing configurado`,
          affectedKey: intent.intent_key,
          affectedId: intent.id,
        })
      }
    }

    // 2. Intents without patterns
    for (const intent of intentsForDomain) {
      const hasPatterns =
        intent.lemmas.length > 0 ||
        intent.phrases.length > 0 ||
        intent.keywords.length > 0 ||
        intent.confirmation_patterns.length > 0

      if (!hasPatterns && intent.is_enabled) {
        issues.push({
          severity: 'warning',
          type: 'intent_no_patterns',
          message: `Intent "${intent.name}" no tiene patrones definidos`,
          affectedKey: intent.intent_key,
          affectedId: intent.id,
        })
      }
    }

    // 3. Orphaned mappings
    for (const mappingId of analysis.orphanedMappingIds) {
      const mapping = mappings.find((m) => m.id === mappingId)
      if (mapping) {
        issues.push({
          severity: 'error',
          type: 'orphaned_mapping',
          message: `Mapping "${mapping.intent_key}" apunta a intent inexistente`,
          affectedKey: mapping.intent_key,
          affectedId: mapping.id,
        })
      }
    }

    // Calculate counts
    const activeIntents = intentsForDomain.filter((i) => i.is_enabled).length
    const totalIntents = intentsForDomain.length

    const domainAgentKeys = new Set(mappings.map((m) => m.agent_key))
    const activeAgents = [...domainAgentKeys].filter((ak) =>
      analysis.agentsWithMappings.has(ak)
    ).length
    const totalAgents = domainAgentKeys.size

    const domainKeywordAgents = [...domainAgentKeys]
    const activeKeywords = keywords.filter(
      (k) => domainKeywordAgents.includes(k.agent_key) && k.is_enabled
    ).length
    const totalKeywords = keywords.filter((k) => domainKeywordAgents.includes(k.agent_key)).length

    // Calculate score (0-100)
    const intentScore = totalIntents > 0 ? (activeIntents / totalIntents) * 40 : 40
    const agentScore = totalAgents > 0 ? (activeAgents / totalAgents) * 30 : 30
    const issuesPenalty = Math.min(issues.length * 5, 30)
    const score = Math.max(0, Math.round(intentScore + agentScore + 30 - issuesPenalty))

    return {
      score,
      activeIntents,
      totalIntents,
      activeAgents,
      totalAgents,
      activeKeywords,
      totalKeywords,
      issues,
    }
  }

  // =============================================================================
  // Navigation Tree Building
  // =============================================================================

  /**
   * Build navigation tree for a domain
   */
  function buildNavigationTree(domainKey: DomainKey): ConfigNode[] {
    const mappings = intentConfigStore.intentMappings.filter(
      (m) => m.domain_key === domainKey || m.domain_key === null
    )
    const intentsForDomain = domainIntents.value.filter((i) => i.domain_key === domainKey)
    const keywords = intentConfigStore.keywordMappings
    const flowAgents = intentConfigStore.flowAgents

    // Get unique agents for this domain
    const agentKeys = new Set<string>()
    mappings.forEach((m) => agentKeys.add(m.agent_key))
    keywords.forEach((k) => {
      if (agentKeys.has(k.agent_key) || mappings.some((m) => m.agent_key === k.agent_key)) {
        agentKeys.add(k.agent_key)
      }
    })

    // Build intent nodes
    const intentNodes: ConfigNode[] = intentsForDomain.map((intent) => ({
      id: `intent-${intent.id}`,
      type: 'intent' as const,
      key: intent.intent_key,
      label: intent.name,
      status: getIntentStatus(intent),
      icon: 'pi pi-tag',
      selectable: true,
      data: intent,
    }))

    // Build agent nodes with their mappings and keywords
    const agentNodes: ConfigNode[] = [...agentKeys].map((agentKey) => {
      const agentMappings = mappings.filter((m) => m.agent_key === agentKey)
      const agentKeywords = keywords.filter((k) => k.agent_key === agentKey)
      const flowAgent = flowAgents.find((f) => f.agent_key === agentKey)
      const isFlowAgent = flowAgent?.is_flow_agent && flowAgent?.is_enabled

      return {
        id: `agent-${agentKey}`,
        type: 'agent' as const,
        key: agentKey,
        label: formatAgentName(agentKey),
        status: getAgentStatus(agentKey),
        icon: isFlowAgent ? 'pi pi-sitemap' : 'pi pi-user',
        badge: agentMappings.length + agentKeywords.length,
        selectable: true,
        data: flowAgent || null,
      }
    })

    // Build keyword category node
    const keywordNodes: ConfigNode[] = keywords
      .filter((k) => agentKeys.has(k.agent_key))
      .map((keyword) => ({
        id: `keyword-${keyword.id}`,
        type: 'keyword' as const,
        key: keyword.keyword,
        label: keyword.keyword,
        status: getKeywordStatus(keyword),
        icon: 'pi pi-key',
        selectable: true,
        data: keyword,
      }))

    // Build tree structure
    const tree: ConfigNode[] = [
      {
        id: 'category-intents',
        type: 'category' as const,
        key: 'intents',
        label: 'Intents',
        status: 'active',
        icon: 'pi pi-tags',
        badge: intentNodes.length,
        expanded: true,
        selectable: false,
        children: intentNodes,
      },
      {
        id: 'category-agents',
        type: 'category' as const,
        key: 'agents',
        label: 'Agents',
        status: 'active',
        icon: 'pi pi-users',
        badge: agentNodes.length,
        expanded: true,
        selectable: false,
        children: agentNodes,
      },
      {
        id: 'category-keywords',
        type: 'category' as const,
        key: 'keywords',
        label: 'Keywords',
        status: 'active',
        icon: 'pi pi-key',
        badge: keywordNodes.length,
        expanded: false,
        selectable: false,
        children: keywordNodes,
      },
    ]

    return tree
  }

  /**
   * Filter navigation tree by usage status
   */
  function filterNavigationTree(tree: ConfigNode[], filter: UsageFilter): ConfigNode[] {
    if (filter === 'all') return tree

    return tree
      .map((category) => {
        if (category.type !== 'category' || !category.children) return category

        const filteredChildren = category.children.filter((node) => {
          switch (filter) {
            case 'active':
              return node.status === 'active'
            case 'unused':
              return node.status === 'unused' || node.status === 'idle'
            case 'orphaned':
              return node.status === 'orphaned'
            default:
              return true
          }
        })

        return {
          ...category,
          children: filteredChildren,
          badge: filteredChildren.length,
        }
      })
      .filter((category) => category.children && category.children.length > 0)
  }

  // =============================================================================
  // Unused/Orphaned Getters
  // =============================================================================

  /**
   * Get all unused configurations
   */
  function getUnusedConfigs(): {
    intents: DomainIntent[]
    mappings: IntentAgentMapping[]
    keywords: KeywordAgentMapping[]
    flowAgents: FlowAgentConfig[]
  } {
    const allIntents = domainIntents.value
    const mappings = intentConfigStore.intentMappings
    const keywords = intentConfigStore.keywordMappings
    const flowAgents = intentConfigStore.flowAgents
    const analysis = usageAnalysis.value

    return {
      intents: allIntents.filter(
        (i) => !i.is_enabled || !analysis.intentsWithMappings.has(i.intent_key)
      ),
      mappings: mappings.filter((m) => !m.is_enabled),
      keywords: keywords.filter((k) => !k.is_enabled),
      flowAgents: flowAgents.filter(
        (f) => !f.is_enabled || analysis.unusedFlowAgentKeys.includes(f.agent_key)
      ),
    }
  }

  /**
   * Get all orphaned configurations
   */
  function getOrphanedConfigs(): {
    mappings: IntentAgentMapping[]
    keywords: KeywordAgentMapping[]
  } {
    const mappings = intentConfigStore.intentMappings
    const keywords = intentConfigStore.keywordMappings
    const analysis = usageAnalysis.value

    return {
      mappings: mappings.filter((m) => analysis.orphanedMappingIds.includes(m.id)),
      keywords: keywords.filter((k) => analysis.orphanedKeywordIds.includes(k.id)),
    }
  }

  // =============================================================================
  // Domain Stats
  // =============================================================================

  /**
   * Get stats for all domains (for domain selector cards)
   */
  function getDomainStats(domainKeys: DomainKey[]): DomainStats[] {
    return domainKeys.map((domainKey) => {
      const health = getDomainHealth(domainKey)
      return {
        domainKey,
        intentCount: health.totalIntents,
        agentCount: health.totalAgents,
        keywordCount: health.totalKeywords,
        healthScore: health.score,
        hasIssues: health.issues.length > 0,
      }
    })
  }

  // =============================================================================
  // Helpers
  // =============================================================================

  /**
   * Format agent key to readable name
   */
  function formatAgentName(agentKey: string): string {
    return agentKey
      .replace(/_/g, ' ')
      .replace(/agent$/i, '')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Get severity color for status
   */
  function getStatusSeverity(status: UsageStatus): string {
    switch (status) {
      case 'active':
        return 'success'
      case 'idle':
        return 'warn'
      case 'unused':
        return 'secondary'
      case 'orphaned':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  /**
   * Get label for status
   */
  function getStatusLabel(status: UsageStatus): string {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'idle':
        return 'Incompleto'
      case 'unused':
        return 'Sin usar'
      case 'orphaned':
        return 'Huérfano'
      default:
        return status
    }
  }

  return {
    // Core analysis
    usageAnalysis,

    // Status determination
    getMappingStatus,
    getAgentStatus,
    getKeywordStatus,
    getIntentStatus,
    getFlowAgentStatus,

    // Domain health
    getDomainHealth,

    // Navigation tree
    buildNavigationTree,
    filterNavigationTree,

    // Unused/orphaned getters
    getUnusedConfigs,
    getOrphanedConfigs,

    // Domain stats
    getDomainStats,

    // Helpers
    formatAgentName,
    getStatusSeverity,
    getStatusLabel,
  }
}
