/**
 * Graph Layout Utilities
 *
 * Algorithm for positioning nodes in a left-to-right layout:
 * [Domain] → [Intent] → [Agent] → [Keywords]
 *   Col 1      Col 2      Col 3      Col 4
 */

import type {
  IntentConfigGraphNode,
  IntentConfigGraphEdge,
  DomainNodeData,
  IntentNodeData,
  AgentNodeData,
  KeywordGroupNodeData,
  LAYOUT_CONFIG as LayoutConfig
} from '../types'
import type { DomainIntent } from '@/types/domainIntents.types'
import type {
  IntentAgentMapping,
  FlowAgentConfig,
  KeywordAgentMapping,
  UsageStatus
} from '@/types/intentConfigs.types'
import { getDomainConfig, LAYOUT_CONFIG } from '../types'

// =============================================================================
// Layout Configuration
// =============================================================================

export interface LayoutOptions {
  columnSpacing?: number
  rowSpacing?: number
  startX?: number
  startY?: number
}

// =============================================================================
// Graph Generation Types
// =============================================================================

export interface GraphGenerationInput {
  domainIntents: Map<string, DomainIntent[]> // domainKey -> intents
  intentMappings: IntentAgentMapping[]
  flowAgents: FlowAgentConfig[]
  keywordMappings: KeywordAgentMapping[]
  filters?: {
    domainKey?: string | null
    status?: UsageStatus | 'all'
    showDisabled?: boolean
  }
}

export interface GeneratedGraph {
  nodes: IntentConfigGraphNode[]
  edges: IntentConfigGraphEdge[]
}

// =============================================================================
// Graph Generation
// =============================================================================

export function generateGraph(input: GraphGenerationInput, options?: LayoutOptions): GeneratedGraph {
  const layout = { ...LAYOUT_CONFIG, ...options }
  const nodes: IntentConfigGraphNode[] = []
  const edges: IntentConfigGraphEdge[] = []

  // Track positions
  let domainY = layout.startY
  const agentPositions = new Map<string, { x: number; y: number }>()
  const agentRowIndex = new Map<string, number>()

  // Filter domains based on input filters
  let domains = Array.from(input.domainIntents.keys())
  if (input.filters?.domainKey) {
    domains = domains.filter(d => d === input.filters?.domainKey)
  }

  // Create mapping lookups - using composite key domain:intent for uniqueness
  // Also store by intent_key only as fallback for mappings with null domain_key
  const mappingsByCompositeKey = new Map<string, IntentAgentMapping>()
  const mappingsByIntentKey = new Map<string, IntentAgentMapping>()

  input.intentMappings.forEach(m => {
    // Store by composite key if domain_key exists
    if (m.domain_key) {
      const compositeKey = `${m.domain_key}:${m.intent_key}`
      mappingsByCompositeKey.set(compositeKey, m)
    }
    // Always store by intent_key as fallback (later mappings overwrite earlier ones)
    mappingsByIntentKey.set(m.intent_key, m)
  })

  // Helper to find mapping - tries composite key first, then falls back to intent_key
  const findMapping = (domainKey: string, intentKey: string): IntentAgentMapping | undefined => {
    const compositeKey = `${domainKey}:${intentKey}`
    return mappingsByCompositeKey.get(compositeKey) || mappingsByIntentKey.get(intentKey)
  }


  const flowAgentsByKey = new Map<string, FlowAgentConfig>()
  input.flowAgents.forEach(f => {
    flowAgentsByKey.set(f.agent_key, f)
  })

  const keywordsByAgent = new Map<string, KeywordAgentMapping[]>()
  input.keywordMappings.forEach(k => {
    if (!keywordsByAgent.has(k.agent_key)) {
      keywordsByAgent.set(k.agent_key, [])
    }
    keywordsByAgent.get(k.agent_key)!.push(k)
  })

  // Track unique agents and their intents
  const uniqueAgents = new Set<string>()
  const agentIntentCount = new Map<string, number>()

  // Process each domain
  domains.forEach((domainKey, domainIndex) => {
    const intents = input.domainIntents.get(domainKey) || []
    const domainConfig = getDomainConfig(domainKey)

    // Filter intents based on status if needed
    let filteredIntents = intents
    if (input.filters?.status && input.filters.status !== 'all') {
      filteredIntents = intents.filter(intent => {
        const mapping = findMapping(domainKey, intent.intent_key)
        const status = getIntentStatus(intent, mapping)
        return status === input.filters?.status
      })
    }

    if (!input.filters?.showDisabled) {
      filteredIntents = filteredIntents.filter(i => i.is_enabled)
    }

    if (filteredIntents.length === 0) return

    // Column 1: Domain node
    const domainNodeId = `domain-${domainKey}`
    const enabledCount = filteredIntents.filter(i => i.is_enabled).length

    nodes.push({
      id: domainNodeId,
      type: 'domain',
      position: { x: layout.startX, y: domainY },
      data: {
        label: domainConfig.displayName,
        domainKey,
        displayName: domainConfig.displayName,
        description: domainConfig.description,
        icon: domainConfig.icon,
        color: domainConfig.color,
        bgColor: domainConfig.bgColor,
        intentCount: filteredIntents.length,
        enabledCount,
        healthScore: filteredIntents.length > 0 ? Math.round((enabledCount / filteredIntents.length) * 100) : 0
      } as DomainNodeData
    })

    // Column 2: Intent nodes
    let intentY = domainY
    filteredIntents.forEach((intent, intentIndex) => {
      const mapping = findMapping(domainKey, intent.intent_key)
      const intentNodeId = `intent-${domainKey}-${intent.intent_key}`
      const status = getIntentStatus(intent, mapping)

      const patternCount =
        (intent.lemmas?.length || 0) +
        (intent.phrases?.length || 0) +
        (intent.confirmation_patterns?.length || 0) +
        (intent.keywords?.length || 0)

      nodes.push({
        id: intentNodeId,
        type: 'intent',
        position: {
          x: layout.startX + layout.columnSpacing,
          y: intentY
        },
        data: {
          label: intent.name,
          intentKey: intent.intent_key,
          intentName: intent.name,
          domainKey,
          domainColor: domainConfig.color,
          status,
          isEnabled: intent.is_enabled,
          patternCount,
          lemmaCount: intent.lemmas?.length || 0,
          phraseCount: intent.phrases?.length || 0,
          keywordCount: intent.keywords?.length || 0,
          mapping,
          intent,
          agentKey: mapping?.agent_key || null,
          confidence: mapping?.confidence_threshold || 0.5
        } as IntentNodeData
      })

      // Edge from domain to intent
      edges.push({
        id: `edge-${domainNodeId}-${intentNodeId}`,
        source: domainNodeId,
        target: intentNodeId,
        type: 'domain-intent',
        animated: false,
        style: { stroke: domainConfig.color, strokeWidth: '1.5' }
      })

      // Track agent for this intent
      if (mapping?.agent_key) {
        uniqueAgents.add(mapping.agent_key)
        agentIntentCount.set(
          mapping.agent_key,
          (agentIntentCount.get(mapping.agent_key) || 0) + 1
        )
      }

      intentY += layout.rowSpacing
    })

    // Update domain Y for next domain
    domainY = intentY + layout.rowSpacing / 2
  })

  // Column 3: Agent nodes (unique)
  let agentY = layout.startY
  const sortedAgents = Array.from(uniqueAgents).sort()

  sortedAgents.forEach((agentKey, agentIndex) => {
    const flowConfig = flowAgentsByKey.get(agentKey)
    const keywords = keywordsByAgent.get(agentKey) || []
    const mappingCount = agentIntentCount.get(agentKey) || 0
    const agentNodeId = `agent-${agentKey}`

    // Calculate color based on domain of first intent mapped to this agent
    const firstMapping = input.intentMappings.find(m => m.agent_key === agentKey)
    const agentColor = firstMapping?.domain_key
      ? getDomainConfig(firstMapping.domain_key).color
      : '#3b82f6'

    nodes.push({
      id: agentNodeId,
      type: 'agent',
      position: {
        x: layout.startX + layout.columnSpacing * 2,
        y: agentY
      },
      data: {
        label: formatAgentName(agentKey),
        agentKey,
        displayName: formatAgentName(agentKey),
        isFlowAgent: flowConfig?.is_flow_agent || false,
        flowConfig,
        isEnabled: flowConfig?.is_enabled ?? true,
        mappingCount,
        keywordCount: keywords.length,
        color: agentColor
      } as AgentNodeData
    })

    agentPositions.set(agentKey, {
      x: layout.startX + layout.columnSpacing * 2,
      y: agentY
    })
    agentRowIndex.set(agentKey, agentIndex)

    agentY += layout.rowSpacing
  })

  // Create edges from intents to agents
  nodes
    .filter(n => n.type === 'intent')
    .forEach(intentNode => {
      const data = intentNode.data as IntentNodeData
      if (data.agentKey) {
        const agentNodeId = `agent-${data.agentKey}`
        const isEnabled = data.isEnabled && (data.mapping?.is_enabled ?? true)

        edges.push({
          id: `edge-${intentNode.id}-${agentNodeId}`,
          source: intentNode.id,
          target: agentNodeId,
          type: 'intent-agent',
          animated: isEnabled,
          style: {
            stroke: isEnabled ? '#3b82f6' : '#94a3b8',
            strokeWidth: isEnabled ? '2' : '1',
            strokeDasharray: isEnabled ? 'none' : '5,5'
          }
        })
      }
    })

  // Column 4: Keyword group nodes
  let keywordY = layout.startY
  sortedAgents.forEach(agentKey => {
    const keywords = keywordsByAgent.get(agentKey) || []
    if (keywords.length === 0) return

    const keywordNodeId = `keywords-${agentKey}`
    const agentNodeId = `agent-${agentKey}`
    const enabledKeywords = keywords.filter(k => k.is_enabled)

    nodes.push({
      id: keywordNodeId,
      type: 'keyword-group',
      position: {
        x: layout.startX + layout.columnSpacing * 3,
        y: agentPositions.get(agentKey)?.y || keywordY
      },
      data: {
        label: `${keywords.length} keywords`,
        agentKey,
        keywords,
        keywordCount: keywords.length,
        enabledCount: enabledKeywords.length
      } as KeywordGroupNodeData
    })

    // Edge from agent to keywords
    edges.push({
      id: `edge-${agentNodeId}-${keywordNodeId}`,
      source: agentNodeId,
      target: keywordNodeId,
      type: 'agent-keyword',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: '1.5' }
    })

    keywordY += layout.rowSpacing
  })

  return { nodes, edges }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getIntentStatus(intent: DomainIntent, mapping: IntentAgentMapping | undefined): UsageStatus {
  // Intent is disabled
  if (!intent.is_enabled) {
    return 'idle'
  }
  // Intent enabled but no mapping to agent
  if (!mapping) {
    return 'unused'
  }
  // Mapping exists but is disabled
  if (!mapping.is_enabled) {
    return 'idle'
  }
  // Intent enabled and mapping active
  return 'active'
}

export function formatAgentName(agentKey: string): string {
  return agentKey
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// =============================================================================
// Path Highlighting
// =============================================================================

export function getConnectedPath(
  nodeId: string,
  nodes: IntentConfigGraphNode[],
  edges: IntentConfigGraphEdge[]
): string[] {
  const path: string[] = [nodeId]
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return path

  // Find connected nodes based on node type
  switch (node.type) {
    case 'domain': {
      // Get all intents for this domain
      const intentEdges = edges.filter(e => e.source === nodeId)
      intentEdges.forEach(e => {
        path.push(e.target)
        // Get agents connected to these intents
        const agentEdges = edges.filter(ae => ae.source === e.target)
        agentEdges.forEach(ae => {
          path.push(ae.target)
          // Get keywords connected to these agents
          const keywordEdges = edges.filter(ke => ke.source === ae.target)
          keywordEdges.forEach(ke => path.push(ke.target))
        })
      })
      break
    }
    case 'intent': {
      // Get domain
      const domainEdge = edges.find(e => e.target === nodeId && e.type === 'domain-intent')
      if (domainEdge) path.push(domainEdge.source)
      // Get agent
      const agentEdge = edges.find(e => e.source === nodeId && e.type === 'intent-agent')
      if (agentEdge) {
        path.push(agentEdge.target)
        // Get keywords
        const keywordEdge = edges.find(e => e.source === agentEdge.target && e.type === 'agent-keyword')
        if (keywordEdge) path.push(keywordEdge.target)
      }
      break
    }
    case 'agent': {
      // Get all intents pointing to this agent
      const intentEdges = edges.filter(e => e.target === nodeId && e.type === 'intent-agent')
      intentEdges.forEach(e => {
        path.push(e.source)
        // Get domains
        const domainEdge = edges.find(de => de.target === e.source && de.type === 'domain-intent')
        if (domainEdge) path.push(domainEdge.source)
      })
      // Get keywords
      const keywordEdge = edges.find(e => e.source === nodeId && e.type === 'agent-keyword')
      if (keywordEdge) path.push(keywordEdge.target)
      break
    }
    case 'keyword-group': {
      // Get agent
      const agentEdge = edges.find(e => e.target === nodeId && e.type === 'agent-keyword')
      if (agentEdge) {
        path.push(agentEdge.source)
        // Get intents
        const intentEdges = edges.filter(e => e.target === agentEdge.source && e.type === 'intent-agent')
        intentEdges.forEach(e => {
          path.push(e.source)
          // Get domains
          const domainEdge = edges.find(de => de.target === e.source && de.type === 'domain-intent')
          if (domainEdge) path.push(domainEdge.source)
        })
      }
      break
    }
  }

  return [...new Set(path)]
}
