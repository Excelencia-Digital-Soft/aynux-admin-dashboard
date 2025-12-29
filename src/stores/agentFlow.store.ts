import { defineStore } from 'pinia'
import type {
  AgentFlowVisualization,
  AgentVisualization,
  BypassRuleVisualization,
  DomainGroup,
  OrchestratorRoute,
  AgentFlowNode,
  AgentFlowEdge,
  AgentFlowFilters,
  FlowNodeType,
  AgentDomain,
  SelectedNodeInfo,
  DOMAIN_CONFIG,
  LAYOUT_CONFIG
} from '@/types/agentFlow.types'

interface AgentFlowState {
  // Core data from API
  agents: AgentVisualization[]
  bypassRules: BypassRuleVisualization[]
  domains: DomainGroup[]
  orchestratorRoutes: OrchestratorRoute[]
  tenantEnabledAgents: string[]
  defaultDomain: string
  isMultiTenant: boolean
  organizationId: string | null

  // Vue Flow state
  nodes: AgentFlowNode[]
  edges: AgentFlowEdge[]

  // UI state
  selectedNodeId: string | null
  selectedNodeType: FlowNodeType | null
  highlightedPath: string[]

  // Filters
  filters: AgentFlowFilters

  // View options
  showDisabledAgents: boolean
  showDisabledRules: boolean
  collapsedDomains: Set<string>

  // Loading state
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export const useAgentFlowStore = defineStore('agentFlow', {
  state: (): AgentFlowState => ({
    // Core data
    agents: [],
    bypassRules: [],
    domains: [],
    orchestratorRoutes: [],
    tenantEnabledAgents: [],
    defaultDomain: 'excelencia',
    isMultiTenant: false,
    organizationId: null,

    // Vue Flow
    nodes: [],
    edges: [],

    // UI state
    selectedNodeId: null,
    selectedNodeType: null,
    highlightedPath: [],

    // Filters
    filters: {},

    // View options
    showDisabledAgents: true,
    showDisabledRules: true,
    collapsedDomains: new Set(),

    // Loading
    isLoading: false,
    error: null,
    lastUpdated: null
  }),

  getters: {
    /**
     * Get selected node info
     */
    selectedNode(): SelectedNodeInfo | null {
      if (!this.selectedNodeId) return null
      const node = this.nodes.find((n) => n.id === this.selectedNodeId)
      if (!node) return null
      return {
        nodeId: node.id,
        nodeType: node.type,
        data: node.data
      }
    },

    /**
     * Get agents filtered by current filters
     */
    filteredAgents(): AgentVisualization[] {
      let result = [...this.agents]

      if (this.filters.domain) {
        result = result.filter((a) => a.domain_key === this.filters.domain)
      }

      if (this.filters.enabledOnly) {
        result = result.filter((a) => a.enabled)
      }

      if (this.filters.searchQuery) {
        const query = this.filters.searchQuery.toLowerCase()
        result = result.filter(
          (a) =>
            a.display_name.toLowerCase().includes(query) ||
            a.agent_key.toLowerCase().includes(query) ||
            a.keywords.some((k) => k.toLowerCase().includes(query))
        )
      }

      if (!this.showDisabledAgents) {
        result = result.filter((a) => this.tenantEnabledAgents.includes(a.agent_key))
      }

      return result
    },

    /**
     * Get bypass rules filtered
     */
    filteredBypassRules(): BypassRuleVisualization[] {
      let result = [...this.bypassRules]

      if (this.filters.ruleType) {
        result = result.filter((r) => r.rule_type === this.filters.ruleType)
      }

      if (this.filters.enabledOnly) {
        result = result.filter((r) => r.enabled)
      }

      if (!this.showDisabledRules) {
        result = result.filter((r) => r.enabled)
      }

      // Sort by priority (highest first)
      result.sort((a, b) => b.priority - a.priority)

      return result
    },

    /**
     * Get enabled agents count
     */
    enabledAgentsCount(): number {
      return this.agents.filter((a) => this.tenantEnabledAgents.includes(a.agent_key)).length
    },

    /**
     * Get enabled bypass rules count
     */
    enabledRulesCount(): number {
      return this.bypassRules.filter((r) => r.enabled).length
    },

    /**
     * Check if a domain is collapsed
     */
    isDomainCollapsed(): (domain: string) => boolean {
      return (domain: string) => this.collapsedDomains.has(domain)
    }
  },

  actions: {
    /**
     * Set visualization data from API
     */
    setVisualizationData(data: AgentFlowVisualization) {
      this.agents = data.agents
      this.bypassRules = data.bypass_rules
      this.domains = data.domains
      this.orchestratorRoutes = data.orchestrator_routes
      this.tenantEnabledAgents = data.tenant_enabled_agents
      this.defaultDomain = data.default_domain
      this.isMultiTenant = data.is_multi_tenant
      this.organizationId = data.organization_id
      this.lastUpdated = new Date()

      // Generate graph
      this.generateGraph()
    },

    /**
     * Generate Vue Flow nodes and edges from data
     */
    generateGraph() {
      const nodes: AgentFlowNode[] = []
      const edges: AgentFlowEdge[] = []

      const LAYOUT = {
        columnSpacing: 250,
        rowSpacing: 80,
        startX: 50,
        startY: 50
      }

      let currentX = LAYOUT.startX
      let currentY = LAYOUT.startY

      // Column 1: Message Input
      const messageInputId = 'node-message-input'
      nodes.push({
        id: messageInputId,
        type: 'message-input',
        position: { x: currentX, y: currentY + 100 },
        data: {
          label: 'WhatsApp Message',
          description: 'Mensaje entrante de WhatsApp'
        }
      })

      currentX += LAYOUT.columnSpacing

      // Column 2: Bypass Rules (only in multi-tenant mode with rules)
      const bypassRules = this.filteredBypassRules
      let lastBypassNodeId = messageInputId
      let bypassGroupId: string | null = null

      if (bypassRules.length > 0) {
        // Create bypass group node
        bypassGroupId = 'node-bypass-group'
        const bypassGroupHeight = Math.max(200, bypassRules.length * LAYOUT.rowSpacing + 40)

        nodes.push({
          id: bypassGroupId,
          type: 'bypass-group',
          position: { x: currentX, y: LAYOUT.startY },
          data: {
            label: 'Bypass Rules',
            description: 'Reglas de bypass ordenadas por prioridad',
            rulesCount: bypassRules.length,
            enabledCount: bypassRules.filter((r) => r.enabled).length
          }
        })

        // Edge from message input to bypass group
        edges.push({
          id: `edge-${messageInputId}-${bypassGroupId}`,
          source: messageInputId,
          target: bypassGroupId,
          type: 'routing',
          animated: true
        })

        // Create individual bypass rule nodes
        bypassRules.forEach((rule, index) => {
          const ruleNodeId = `node-bypass-rule-${rule.id}`
          const targetAgent = this.agents.find((a) => a.agent_key === rule.target_agent)

          nodes.push({
            id: ruleNodeId,
            type: 'bypass-rule',
            position: {
              x: currentX + 20,
              y: LAYOUT.startY + 60 + index * LAYOUT.rowSpacing
            },
            data: {
              label: rule.rule_name,
              description: rule.description || `Tipo: ${rule.rule_type}`,
              rule,
              targetAgentName: targetAgent?.display_name || rule.target_agent,
              isEnabled: rule.enabled
            }
          })

          lastBypassNodeId = ruleNodeId
        })

        currentX += LAYOUT.columnSpacing
      } else {
        // No bypass rules - direct connection to orchestrator
        edges.push({
          id: `edge-${messageInputId}-orchestrator`,
          source: messageInputId,
          target: 'node-orchestrator',
          type: 'routing',
          animated: true
        })
      }

      // Column 3: Orchestrator
      const orchestratorId = 'node-orchestrator'
      const orchestratorY = LAYOUT.startY + 100
      nodes.push({
        id: orchestratorId,
        type: 'orchestrator',
        position: { x: currentX, y: orchestratorY },
        data: {
          label: 'Orchestrator',
          description: 'Analiza intent y rutea a agentes especializados',
          routes: this.orchestratorRoutes
        }
      })

      // Edge from bypass group to orchestrator (fallback path)
      if (bypassGroupId) {
        edges.push({
          id: `edge-${bypassGroupId}-${orchestratorId}`,
          source: bypassGroupId,
          target: orchestratorId,
          type: 'routing',
          label: 'No match',
          style: { strokeDasharray: '5,5' }
        })
      }

      currentX += LAYOUT.columnSpacing

      // Column 4: Domain Groups and Agents
      const agentsByDomain = new Map<string, AgentVisualization[]>()

      // Group agents by domain
      this.filteredAgents.forEach((agent) => {
        const domainKey = agent.domain_key || 'global'
        if (!agentsByDomain.has(domainKey)) {
          agentsByDomain.set(domainKey, [])
        }
        agentsByDomain.get(domainKey)!.push(agent)
      })

      let agentY = LAYOUT.startY
      const agentNodeIds: string[] = []

      // Create domain groups and agent nodes
      agentsByDomain.forEach((domainAgents, domainKey) => {
        const domain = this.domains.find((d) => d.domain_key === domainKey)
        const domainConfig = this.getDomainConfig(domainKey as AgentDomain)

        // Create domain group node
        const domainGroupId = `node-domain-${domainKey}`
        const isCollapsed = this.collapsedDomains.has(domainKey)

        nodes.push({
          id: domainGroupId,
          type: 'domain-group',
          position: { x: currentX, y: agentY },
          data: {
            label: domain?.display_name || domainConfig.displayName,
            description: domain?.description || '',
            domain: domain || {
              domain_key: domainKey as AgentDomain,
              display_name: domainConfig.displayName,
              description: '',
              color: domainConfig.color,
              agents: domainAgents
            },
            isCollapsed,
            agentCount: domainAgents.length,
            enabledCount: domainAgents.filter((a) =>
              this.tenantEnabledAgents.includes(a.agent_key)
            ).length
          }
        })

        // Edge from orchestrator to domain group
        edges.push({
          id: `edge-${orchestratorId}-${domainGroupId}`,
          source: orchestratorId,
          target: domainGroupId,
          type: 'routing',
          label: domainKey
        })

        // Create agent nodes within domain
        if (!isCollapsed) {
          domainAgents.forEach((agent, index) => {
            const agentNodeId = `node-agent-${agent.agent_key}`
            const isEnabled = this.tenantEnabledAgents.includes(agent.agent_key)

            nodes.push({
              id: agentNodeId,
              type: 'agent',
              position: {
                x: currentX + 20,
                y: agentY + 50 + index * (LAYOUT.rowSpacing - 10)
              },
              data: {
                label: agent.display_name,
                description: agent.description || '',
                agent,
                isEnabled,
                domainColor: domainConfig.color
              }
            })

            agentNodeIds.push(agentNodeId)

            // Create edge from bypass rules to this agent (if it's a target)
            const targetingRules = this.bypassRules.filter(
              (r) => r.target_agent === agent.agent_key && r.enabled
            )
            targetingRules.forEach((rule) => {
              edges.push({
                id: `edge-bypass-${rule.id}-${agentNodeId}`,
                source: `node-bypass-rule-${rule.id}`,
                target: agentNodeId,
                type: 'bypass',
                label: 'Bypass',
                animated: true,
                style: { stroke: '#f97316' }
              })
            })
          })
        }

        // Update Y position for next domain group
        const domainHeight = isCollapsed ? 80 : 60 + domainAgents.length * (LAYOUT.rowSpacing - 10)
        agentY += domainHeight + 30
      })

      currentX += LAYOUT.columnSpacing

      // Column 5: Supervisor
      const supervisorId = 'node-supervisor'
      nodes.push({
        id: supervisorId,
        type: 'supervisor',
        position: { x: currentX, y: orchestratorY },
        data: {
          label: 'Supervisor',
          description: 'Evalua respuestas y controla flujo'
        }
      })

      // Edges from agents to supervisor
      agentNodeIds.forEach((agentId) => {
        edges.push({
          id: `edge-${agentId}-${supervisorId}`,
          source: agentId,
          target: supervisorId,
          type: 'response',
          style: { stroke: '#94a3b8' }
        })
      })

      currentX += LAYOUT.columnSpacing

      // Column 6: End Node
      const endId = 'node-end'
      nodes.push({
        id: endId,
        type: 'end',
        position: { x: currentX, y: orchestratorY },
        data: {
          label: 'Response',
          description: 'Respuesta enviada al usuario'
        }
      })

      // Edge from supervisor to end
      edges.push({
        id: `edge-${supervisorId}-${endId}`,
        source: supervisorId,
        target: endId,
        type: 'response',
        animated: true,
        style: { stroke: '#10b981' }
      })

      // Edge from supervisor back to orchestrator (re-routing)
      edges.push({
        id: `edge-${supervisorId}-${orchestratorId}-reroute`,
        source: supervisorId,
        target: orchestratorId,
        type: 'routing',
        label: 'Re-route',
        style: { strokeDasharray: '5,5', stroke: '#94a3b8' }
      })

      this.nodes = nodes
      this.edges = edges
    },

    /**
     * Get domain config with fallback
     */
    getDomainConfig(domain: AgentDomain): { displayName: string; color: string; bgColor: string } {
      const config: Record<AgentDomain, { displayName: string; color: string; bgColor: string }> = {
        system: { displayName: 'Sistema', color: '#64748b', bgColor: '#f1f5f9' },
        global: { displayName: 'Global', color: '#3b82f6', bgColor: '#dbeafe' },
        excelencia: { displayName: 'Excelencia Software', color: '#8b5cf6', bgColor: '#ede9fe' },
        ecommerce: { displayName: 'E-commerce', color: '#10b981', bgColor: '#d1fae5' },
        pharmacy: { displayName: 'Farmacia', color: '#14b8a6', bgColor: '#ccfbf1' },
        credit: { displayName: 'Credito', color: '#f59e0b', bgColor: '#fef3c7' }
      }
      return config[domain] || config.global
    },

    /**
     * Select a node
     */
    selectNode(nodeId: string | null) {
      this.selectedNodeId = nodeId
      if (nodeId) {
        const node = this.nodes.find((n) => n.id === nodeId)
        this.selectedNodeType = node?.type || null
      } else {
        this.selectedNodeType = null
      }
    },

    /**
     * Highlight a path
     */
    highlightPath(nodeIds: string[]) {
      this.highlightedPath = nodeIds
      this.regenerateNodeClasses()
    },

    /**
     * Clear highlight
     */
    clearHighlight() {
      this.highlightedPath = []
      // Restore original edge styles
      this.edges = this.edges.map(edge => ({
        ...edge,
        animated: edge.type === 'routing' || edge.type === 'bypass',
        style: this.getDefaultEdgeStyle(edge.type)
      }))
      this.regenerateNodeClasses()
    },

    /**
     * Highlight the bypass rule path: Message → Rule → Target Agent
     */
    highlightBypassPath(ruleId: string) {
      const rule = this.bypassRules.find(r => r.id === ruleId)
      if (!rule) {
        this.clearHighlight()
        return
      }

      // Build path: message-input → bypass-rule → target-agent
      const pathNodeIds = [
        'node-message-input',
        `node-bypass-rule-${ruleId}`,
        `node-agent-${rule.target_agent}`
      ]

      this.highlightedPath = pathNodeIds

      // Update edge highlighting
      this.edges = this.edges.map(edge => {
        const isInPath = pathNodeIds.includes(edge.source) && pathNodeIds.includes(edge.target)
        return {
          ...edge,
          animated: isInPath,
          style: this.getEdgeHighlightStyle(edge, isInPath)
        }
      })

      this.regenerateNodeClasses()
    },

    /**
     * Get default edge style by type
     */
    getDefaultEdgeStyle(edgeType?: string): Record<string, string> {
      switch (edgeType) {
        case 'bypass':
          return { stroke: '#f97316', strokeWidth: '2', strokeDasharray: '5,5' }
        case 'routing':
          return { stroke: '#3b82f6', strokeWidth: '2' }
        case 'response':
          return { stroke: '#10b981', strokeWidth: '1.5' }
        default:
          return { stroke: '#94a3b8', strokeWidth: '1.5' }
      }
    },

    /**
     * Get edge style based on highlight state
     */
    getEdgeHighlightStyle(edge: AgentFlowEdge, isHighlighted: boolean): Record<string, string> {
      if (isHighlighted) {
        return { stroke: '#f97316', strokeWidth: '3' }
      }

      // Dim other edges when path is highlighted
      if (this.highlightedPath.length > 0) {
        return { stroke: '#e2e8f0', strokeWidth: '1' }
      }

      return this.getDefaultEdgeStyle(edge.type)
    },

    /**
     * Regenerate node classes based on state
     */
    regenerateNodeClasses() {
      this.nodes = this.nodes.map((node) => ({
        ...node,
        class: this.getNodeClass(node)
      }))
    },

    /**
     * Get CSS class for a node
     */
    getNodeClass(node: AgentFlowNode): string {
      const classes = [`node-${node.type}`]

      if (this.selectedNodeId === node.id) {
        classes.push('node-selected')
      }

      if (this.highlightedPath.includes(node.id)) {
        classes.push('node-highlighted')
      }

      return classes.join(' ')
    },

    /**
     * Toggle domain collapse
     */
    toggleDomainCollapse(domain: string) {
      if (this.collapsedDomains.has(domain)) {
        this.collapsedDomains.delete(domain)
      } else {
        this.collapsedDomains.add(domain)
      }
      this.generateGraph()
    },

    /**
     * Apply filters and regenerate graph
     */
    applyFilters(filters: AgentFlowFilters) {
      this.filters = { ...this.filters, ...filters }
      this.generateGraph()
    },

    /**
     * Clear all filters
     */
    clearFilters() {
      this.filters = {}
      this.generateGraph()
    },

    /**
     * Toggle show disabled agents
     */
    toggleShowDisabledAgents() {
      this.showDisabledAgents = !this.showDisabledAgents
      this.generateGraph()
    },

    /**
     * Toggle show disabled rules
     */
    toggleShowDisabledRules() {
      this.showDisabledRules = !this.showDisabledRules
      this.generateGraph()
    },

    /**
     * Set loading state
     */
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    /**
     * Set error
     */
    setError(error: string | null) {
      this.error = error
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.agents = []
      this.bypassRules = []
      this.domains = []
      this.orchestratorRoutes = []
      this.tenantEnabledAgents = []
      this.nodes = []
      this.edges = []
      this.selectedNodeId = null
      this.selectedNodeType = null
      this.highlightedPath = []
      this.filters = {}
      this.collapsedDomains.clear()
      this.isLoading = false
      this.error = null
    }
  }
})
