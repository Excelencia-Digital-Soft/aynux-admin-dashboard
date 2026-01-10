import { ref, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { chatApi } from '@/api/chat.api'
import { useToast } from '@/composables/useToast'
import type { ConversationMessage } from '@/types/chat.types'

/**
 * Composable for chat visualizer page.
 * Manages chat interactions, debug modes, streaming, and webhook simulation.
 */

export interface UseChatVisualizerOptions {
  defaultDebugMode?: boolean
  defaultStreaming?: boolean
  autoLoadMetrics?: boolean
  metricsDays?: number
}

export function useChatVisualizer(options: UseChatVisualizerOptions = {}) {
  const {
    defaultDebugMode = true,
    defaultStreaming = false,
    autoLoadMetrics = true,
    metricsDays = 7
  } = options

  const store = useChatStore()
  const toast = useToast()

  // Local state
  const activeTab = ref('0')
  const debugMode = ref(defaultDebugMode)
  const showSettings = ref(false)
  const useStreaming = ref(defaultStreaming)
  const isProcessing = ref(false)

  /**
   * Send a message with appropriate mode (webhook, streaming, or standard).
   */
  async function sendMessage(message: string): Promise<void> {
    if (!message.trim()) return

    store.clearExecutionState()
    store.setLoading(true)
    store.setError(null)
    isProcessing.value = true

    try {
      // Create/get thread BEFORE adding user message
      let threadId = store.activeThreadId
      if (!threadId) {
        threadId = store.createNewThread()
      }

      // Add user message AFTER thread is set up
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
      store.addMessage(userMessage)

      if (store.webhookSimulation.enabled) {
        await sendWebhookMessage(message, threadId)
      } else if (useStreaming.value) {
        await sendStreamingMessage(message, threadId)
      } else {
        await sendStandardMessage(message, threadId)
      }
    } catch (error) {
      handleError(error)
    } finally {
      store.setLoading(false)
      isProcessing.value = false
    }
  }

  /**
   * Send message via webhook simulation.
   */
  async function sendWebhookMessage(message: string, threadId: string): Promise<void> {
    const result = await chatApi.testWebhookSimulation({
      message,
      phone_number: store.webhookSimulation.phoneNumber,
      user_name: store.webhookSimulation.userName,
      business_domain: store.webhookSimulation.businessDomain,
      session_id: threadId,
      debug: debugMode.value,
      did: store.webhookSimulation.did,
      simulate_bypass: store.webhookSimulation.simulateBypass,
      organization_id: store.webhookSimulation.organizationId,
      pharmacy_id: store.webhookSimulation.pharmacyId
    })

    const assistantMessage: ConversationMessage = {
      id: result.session_id || crypto.randomUUID(),
      role: 'assistant',
      content: result.response,
      timestamp: new Date().toISOString()
    }
    store.addMessage(assistantMessage)

    if (result.execution_steps) {
      store.setExecutionSteps(result.execution_steps)
    }
  }

  /**
   * Send message with streaming.
   */
  async function sendStreamingMessage(message: string, threadId: string): Promise<void> {
    store.startStreaming()

    const response = await chatApi.sendMessageStream(
      { message, thread_id: threadId },
      (chunk) => store.appendStreamContent(chunk),
      (step) => store.addExecutionStep(step)
    )

    store.endStreaming()
    store.addMessage(response.message)

    if (response.execution_steps) {
      store.setExecutionSteps(response.execution_steps)
    }
    if (response.agent_state) {
      store.setAgentState(response.agent_state)
    }
  }

  /**
   * Send message with standard or debug mode.
   */
  async function sendStandardMessage(message: string, threadId: string): Promise<void> {
    if (debugMode.value) {
      const result = await chatApi.testAgent({
        message,
        debug: true,
        session_id: threadId
      })

      const assistantMessage: ConversationMessage = {
        id: result.session_id || crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString()
      }
      store.addMessage(assistantMessage)

      if (result.execution_steps) {
        store.setExecutionSteps(result.execution_steps)
      }
    } else {
      const response = await chatApi.sendMessage({
        message,
        thread_id: threadId
      })

      store.addMessage(response.message)

      if (response.execution_steps) {
        store.setExecutionSteps(response.execution_steps)
      }
    }
  }

  /**
   * Handle errors during message sending.
   */
  function handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    store.setError(errorMessage)
    toast.error(`Error: ${errorMessage}`)

    store.addExecutionStep({
      id: crypto.randomUUID(),
      step_number: store.executionSteps.length + 1,
      node_type: 'error',
      name: 'Error',
      description: errorMessage,
      status: 'error',
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Handle click on a message.
   */
  function handleMessageClick(message: ConversationMessage): void {
    console.log('Message clicked:', message.id)
  }

  /**
   * Handle click on a graph node.
   */
  function handleNodeClick(_nodeId: string): void {
    activeTab.value = '1' // Switch to reasoning tab
  }

  /**
   * Clear all chat data.
   */
  function clearChat(): void {
    store.clearAllThreads()
    store.clearExecutionState()
    toast.info('Conversacion limpiada')
  }

  /**
   * Create a new conversation thread.
   */
  function newThread(): void {
    store.createNewThread()
    store.clearExecutionState()
    toast.info('Nueva conversacion iniciada')
  }

  /**
   * Load metrics data.
   */
  async function loadMetrics(): Promise<void> {
    try {
      const metrics = await chatApi.getMetrics({ days: metricsDays })
      store.setSessionMetrics(metrics)
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  /**
   * Toggle settings dialog.
   */
  function toggleSettings(): void {
    showSettings.value = !showSettings.value
  }

  /**
   * Close settings dialog.
   */
  function closeSettings(): void {
    showSettings.value = false
  }

  /**
   * Clear error from store.
   */
  function clearError(): void {
    store.setError(null)
  }

  // Lifecycle
  onMounted(() => {
    if (autoLoadMetrics) {
      loadMetrics()
    }
  })

  onUnmounted(() => {
    // Cleanup if needed
  })

  return {
    // Local state
    activeTab,
    debugMode,
    showSettings,
    useStreaming,
    isProcessing,
    // Store passthrough
    store,
    // Actions
    sendMessage,
    handleMessageClick,
    handleNodeClick,
    clearChat,
    newThread,
    loadMetrics,
    toggleSettings,
    closeSettings,
    clearError
  }
}

export default useChatVisualizer
