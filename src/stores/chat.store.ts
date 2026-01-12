import { defineStore } from 'pinia'
import type {
  ConversationMessage,
  ConversationThread,
  ExecutionStep,
  AgentState,
  GraphNode,
  GraphEdge,
  ChatMetrics,
  WebhookSimulationConfig
} from '@/types/chat.types'

export interface ChatState {
  // Conversations
  threads: Map<string, ConversationThread>
  activeThreadId: string | null
  currentMessages: ConversationMessage[]

  // Execution visualization
  executionSteps: ExecutionStep[]
  currentAgentState: AgentState | null
  graphNodes: GraphNode[]
  graphEdges: GraphEdge[]
  selectedNodeId: string | null

  // UI state
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  error: string | null

  // Metrics
  sessionMetrics: ChatMetrics | null
  graphInitialized: boolean

  // Webhook simulation config (persisted to localStorage)
  webhookSimulation: WebhookSimulationConfig
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    threads: new Map(),
    activeThreadId: null,
    currentMessages: [],
    executionSteps: [],
    currentAgentState: null,
    graphNodes: [],
    graphEdges: [],
    selectedNodeId: null,
    isLoading: false,
    isStreaming: false,
    streamingContent: '',
    error: null,
    sessionMetrics: null,
    graphInitialized: false,
    // Webhook simulation defaults - persisted to localStorage
    webhookSimulation: {
      enabled: false,
      phoneNumber: 'web_5491100001234',
      userName: 'Web Tester',
      businessDomain: 'excelencia',
      // Chattigo simulation fields
      did: null,
      simulateBypass: false,
      organizationId: null,
      pharmacyId: null
    }
  }),

  getters: {
    activeThread(): ConversationThread | null {
      if (!this.activeThreadId) return null
      return this.threads.get(this.activeThreadId) || null
    },

    threadsList(): ConversationThread[] {
      return Array.from(this.threads.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    },

    selectedNode(): GraphNode | null {
      if (!this.selectedNodeId) return null
      return this.graphNodes.find(n => n.id === this.selectedNodeId) || null
    },

    completedSteps(): ExecutionStep[] {
      return this.executionSteps.filter(s => s.status === 'completed')
    },

    currentStep(): ExecutionStep | null {
      return this.executionSteps.find(s => s.status === 'running') || null
    },

    hasErrors(): boolean {
      return this.executionSteps.some(s => s.status === 'error')
    },

    totalDuration(): number {
      return this.executionSteps.reduce((sum, s) => sum + (s.duration_ms || 0), 0)
    }
  },

  actions: {
    // Thread management
    setActiveThread(threadId: string | null) {
      this.activeThreadId = threadId
      if (threadId && this.threads.has(threadId)) {
        this.currentMessages = this.threads.get(threadId)!.messages
      } else {
        this.currentMessages = []
      }
      // Clear execution state when switching threads
      this.clearExecutionState()
    },

    addThread(thread: ConversationThread) {
      this.threads.set(thread.id, thread)
    },

    updateThread(threadId: string, updates: Partial<ConversationThread>) {
      const thread = this.threads.get(threadId)
      if (thread) {
        this.threads.set(threadId, { ...thread, ...updates })
      }
    },

    removeThread(threadId: string) {
      this.threads.delete(threadId)
      if (this.activeThreadId === threadId) {
        this.activeThreadId = null
        this.currentMessages = []
      }
    },

    clearAllThreads() {
      this.threads.clear()
      this.activeThreadId = null
      this.currentMessages = []
      this.clearExecutionState()
    },

    // Message management
    addMessage(message: ConversationMessage) {
      this.currentMessages.push(message)

      // Update thread if exists
      if (this.activeThreadId && this.threads.has(this.activeThreadId)) {
        const thread = this.threads.get(this.activeThreadId)!
        // Only push to thread.messages if it's a different array reference
        // (avoids duplicate when currentMessages === thread.messages)
        if (thread.messages !== this.currentMessages) {
          thread.messages.push(message)
        }
        thread.updated_at = new Date().toISOString()
      }
    },

    updateLastMessage(content: string) {
      if (this.currentMessages.length > 0) {
        const lastMsg = this.currentMessages[this.currentMessages.length - 1]
        lastMsg.content = content
      }
    },

    // Streaming
    startStreaming() {
      this.isStreaming = true
      this.streamingContent = ''
    },

    appendStreamContent(content: string) {
      this.streamingContent += content
    },

    endStreaming() {
      this.isStreaming = false
      this.streamingContent = ''
    },

    // Execution state
    setExecutionSteps(steps: ExecutionStep[]) {
      this.executionSteps = steps
      this.updateGraphFromSteps(steps)
    },

    addExecutionStep(step: ExecutionStep) {
      // Check if step already exists
      const existingIndex = this.executionSteps.findIndex(s => s.id === step.id)
      if (existingIndex >= 0) {
        this.executionSteps[existingIndex] = step
      } else {
        this.executionSteps.push(step)
      }
      this.updateGraphFromSteps(this.executionSteps)
    },

    updateStepStatus(stepId: string, status: ExecutionStep['status'], error?: string) {
      const step = this.executionSteps.find(s => s.id === stepId)
      if (step) {
        step.status = status
        if (error) step.error_message = error
        this.updateGraphFromSteps(this.executionSteps)
      }
    },

    setAgentState(state: AgentState | null) {
      this.currentAgentState = state
    },

    clearExecutionState() {
      this.executionSteps = []
      this.currentAgentState = null
      this.graphNodes = []
      this.graphEdges = []
      this.selectedNodeId = null
    },

    // Graph visualization
    updateGraphFromSteps(steps: ExecutionStep[]) {
      const nodes: GraphNode[] = []
      const edges: GraphEdge[] = []

      // Calculate positions using a simple horizontal layout
      const nodeSpacingX = 200
      const nodeSpacingY = 100
      let currentX = 50
      let currentY = 50

      steps.forEach((step, index) => {
        // Determine node type and style
        let nodeType: GraphNode['type'] = 'custom'
        let icon = 'pi-circle'

        switch (step.node_type) {
          case 'start':
            nodeType = 'start'
            icon = 'pi-play'
            break
          case 'tool_call':
            nodeType = 'tool'
            icon = 'pi-wrench'
            break
          case 'llm_call':
            nodeType = 'llm'
            icon = 'pi-comments'
            break
          case 'decision':
            nodeType = 'decision'
            icon = 'pi-question'
            break
          case 'end':
            nodeType = 'end'
            icon = 'pi-check'
            break
          case 'error':
            nodeType = 'error'
            icon = 'pi-times'
            break
        }

        nodes.push({
          id: step.id,
          type: nodeType,
          position: { x: currentX, y: currentY },
          data: {
            label: step.name,
            description: step.description,
            status: step.status,
            duration_ms: step.duration_ms,
            icon,
            metadata: step.output,
            // Extract RAG info from step output if available
            rag_info: step.output?.rag_metrics as import('@/types/chat.types').RagInfo | undefined
          }
        })

        // Create edge to next step
        if (index < steps.length - 1) {
          edges.push({
            id: `edge-${step.id}-${steps[index + 1].id}`,
            source: step.id,
            target: steps[index + 1].id,
            type: step.status === 'error' ? 'error' : 'step',
            animated: step.status === 'running'
          })
        }

        // Move position for next node
        currentX += nodeSpacingX
        if (currentX > 800) {
          currentX = 50
          currentY += nodeSpacingY
        }
      })

      this.graphNodes = nodes
      this.graphEdges = edges
    },

    selectNode(nodeId: string | null) {
      this.selectedNodeId = nodeId
    },

    setGraphInitialized(value: boolean) {
      this.graphInitialized = value
    },

    // Loading state
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    // Metrics
    setSessionMetrics(metrics: ChatMetrics | null) {
      this.sessionMetrics = metrics
    },

    // Create new thread
    createNewThread(): string {
      const threadId = crypto.randomUUID()
      const thread: ConversationThread = {
        id: threadId,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.threads.set(threadId, thread)
      this.setActiveThread(threadId)
      return threadId
    },

    // Webhook simulation
    updateWebhookSimulation(config: Partial<WebhookSimulationConfig>) {
      this.webhookSimulation = { ...this.webhookSimulation, ...config }
    },

    toggleWebhookSimulation() {
      this.webhookSimulation.enabled = !this.webhookSimulation.enabled
    }
  },

  // Persist webhookSimulation config to localStorage
  persist: {
    key: 'chat-store',
    paths: ['webhookSimulation']
  }
})
