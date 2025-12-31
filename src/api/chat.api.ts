import apiClient from './index'
import type {
  ChatRequest,
  ChatResponse,
  ConversationThread,
  ExecutionStep,
  ChatMetrics,
  WebhookSimulationRequest,
  WebhookSimulationResponse
} from '@/types/chat.types'

// Chat endpoints - use /chat for message processing (existing backend routes)
const CHAT_URL = '/chat'
// Admin endpoints - use /admin/chat for testing, metrics, config (new admin routes)
const ADMIN_CHAT_URL = '/admin/chat'

export const chatApi = {
  /**
   * Send a chat message and get response
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await apiClient.post<ChatResponse>(
      `${CHAT_URL}/message`,
      request,
      { timeout: 120000 } // 2 minutes for complex agent tasks
    )
    return data
  },

  /**
   * Send message with streaming response
   */
  async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onStep?: (step: ExecutionStep) => void
  ): Promise<ChatResponse> {
    const response = await fetch(
      `${apiClient.defaults.baseURL}${CHAT_URL}/message/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ ...request, stream: true })
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let finalResponse: ChatResponse | null = null

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6) // Remove 'data: ' prefix
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'token' && parsed.content) {
              fullContent += parsed.content
              onChunk(parsed.content)
            } else if (parsed.type === 'step' && parsed.step && onStep) {
              onStep(parsed.step)
            } else if (parsed.type === 'done' && parsed.response) {
              finalResponse = parsed.response
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    if (finalResponse) {
      return finalResponse
    }

    // Fallback response if streaming didn't complete properly
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toISOString()
      },
      thread_id: request.thread_id || crypto.randomUUID()
    }
  },

  /**
   * Get conversation threads
   */
  async getThreads(params: {
    page?: number
    pageSize?: number
  } = {}): Promise<{ threads: ConversationThread[]; total: number }> {
    const { data } = await apiClient.get(`${CHAT_URL}/threads`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 20
      }
    })
    return data
  },

  /**
   * Get single thread with messages
   */
  async getThread(threadId: string): Promise<ConversationThread> {
    const { data } = await apiClient.get<ConversationThread>(
      `${CHAT_URL}/threads/${threadId}`
    )
    return data
  },

  /**
   * Delete a conversation thread
   */
  async deleteThread(threadId: string): Promise<void> {
    await apiClient.delete(`${CHAT_URL}/threads/${threadId}`)
  },

  /**
   * Clear all threads
   */
  async clearAllThreads(): Promise<void> {
    await apiClient.delete(`${CHAT_URL}/threads`)
  },

  /**
   * Get execution steps for a message
   */
  async getExecutionSteps(messageId: string): Promise<ExecutionStep[]> {
    const { data } = await apiClient.get<{ steps: ExecutionStep[] }>(
      `${ADMIN_CHAT_URL}/execution/${messageId}/steps`
    )
    return data.steps
  },

  /**
   * Get agent execution graph
   */
  async getExecutionGraph(messageId: string): Promise<{
    nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>
    edges: Array<{ id: string; source: string; target: string }>
  }> {
    const { data } = await apiClient.get(
      `${ADMIN_CHAT_URL}/execution/${messageId}/graph`
    )
    return data
  },

  /**
   * Get chat metrics
   */
  async getMetrics(params: {
    threadId?: string
    days?: number
  } = {}): Promise<ChatMetrics> {
    const { data } = await apiClient.get<ChatMetrics>(`${ADMIN_CHAT_URL}/metrics`, {
      params
    })
    return data
  },

  /**
   * Test agent with specific input
   */
  async testAgent(input: {
    message: string
    context?: Record<string, unknown>
    debug?: boolean
    session_id?: string
  }): Promise<{
    session_id: string
    response: string
    agent_used: string
    execution_steps?: ExecutionStep[]
    debug_info?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }> {
    const { data } = await apiClient.post(
      `${ADMIN_CHAT_URL}/test`,
      input,
      { timeout: 180000 } // 3 minutes for debug mode
    )
    return data
  },

  /**
   * Get agent configuration
   */
  async getAgentConfig(): Promise<{
    model: string
    temperature: number
    max_tokens: number
    tools: string[]
    system_prompt?: string
  }> {
    const { data } = await apiClient.get(`${ADMIN_CHAT_URL}/config`)
    return data
  },

  /**
   * Test webhook simulation - uses process_webhook_message flow
   *
   * This endpoint simulates the exact WhatsApp webhook processing flow
   * with configurable test data from the Chat Visualizer UI.
   */
  async testWebhookSimulation(
    request: WebhookSimulationRequest
  ): Promise<WebhookSimulationResponse> {
    const { data } = await apiClient.post<WebhookSimulationResponse>(
      `${ADMIN_CHAT_URL}/test-webhook`,
      request,
      { timeout: 180000 } // 3 minutes for complex processing
    )
    return data
  }
}

export default chatApi
