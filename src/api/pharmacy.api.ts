import api from './index'

export interface Pharmacy {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  active: boolean
}

// Interactive message types (WhatsApp style)
export interface InteractiveButton {
  id: string
  titulo: string
}

export interface InteractiveListItem {
  id: string
  titulo: string
  descripcion?: string
}

export interface InteractiveResponseInput {
  type: 'button_reply' | 'list_reply'
  id: string
  title: string
}

export interface PharmacyTestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
  // Interactive message data (for assistant messages)
  responseType?: 'text' | 'buttons' | 'list'
  buttons?: InteractiveButton[]
  listItems?: InteractiveListItem[]
  // Interactive response data (for user messages from button/list selection)
  interactiveResponse?: InteractiveResponseInput
}

export interface PharmacyTestSession {
  session_id: string
  pharmacy_id: string
  messages: PharmacyTestMessage[]
  created_at: string
  execution_steps?: unknown[]
  graph_state?: unknown
}

export interface PharmacyTestRequest {
  whatsapp_phone_number_id: string  // Business phone (DID) - REQUIRED for bypass routing
  phone_number: string              // Customer phone - REQUIRED
  message?: string
  interactive_response?: InteractiveResponseInput
  session_id?: string
  pharmacy_id?: string              // Optional override (normally determined via bypass)
}

export interface PharmacyTestResponse {
  session_id: string
  response: string
  // Interactive message data
  response_type: 'text' | 'buttons' | 'list'
  response_buttons?: InteractiveButton[]
  response_list_items?: InteractiveListItem[]
  // Execution metadata
  execution_steps?: unknown[]
  graph_state?: unknown
  metadata?: Record<string, unknown>
}

export interface PharmacyWebhookConfig {
  enabled: boolean
  phoneNumber: string
  userName: string
  // Chattigo simulation fields (same as WebhookSimulationConfig)
  did: string | null
  simulateBypass: boolean
  organizationId: string | null
  pharmacyId: string | null
}

// Conversation history types
export interface ConversationContext {
  conversation_id: string
  summary: string
  topic_history: string[]
  total_turns: number
  last_activity: string
}

export interface ConversationListResponse {
  conversations: ConversationContext[]
  total: number
}

export interface ConversationMessage {
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  agent_name: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface MessageListResponse {
  conversation_id: string
  messages: ConversationMessage[]
  limit: number
  offset: number
  total: number | null
}

export const pharmacyApi = {
  // Get available pharmacies for testing
  async getPharmacies(): Promise<Pharmacy[]> {
    try {
      const response = await api.get('/admin/pharmacy/list')
      return response.data
    } catch (error) {
      console.error('Failed to fetch pharmacies:', error)
      return []
    }
  },

  // Send test message to pharmacy agent
  // Extended timeout (2 min) - LLM processing can take 30s-2min
  async sendTestMessage(request: PharmacyTestRequest): Promise<PharmacyTestResponse | null> {
    try {
      const response = await api.post('/admin/pharmacy/test', request, {
        timeout: 120000 // 2 minutes
      })
      return response.data
    } catch (error) {
      console.error('Failed to send test message:', error)
      throw error
    }
  },

  // Get test session history
  async getSession(sessionId: string): Promise<PharmacyTestSession | null> {
    try {
      const response = await api.get(`/admin/pharmacy/session/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch session:', error)
      return null
    }
  },

  // Clear test session
  async clearSession(sessionId: string): Promise<boolean> {
    try {
      await api.delete(`/admin/pharmacy/session/${sessionId}`)
      return true
    } catch (error) {
      console.error('Failed to clear session:', error)
      return false
    }
  },

  // Get pharmacy graph visualization data
  async getGraphData(sessionId: string): Promise<unknown | null> {
    try {
      const response = await api.get(`/admin/pharmacy/graph/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch graph data:', error)
      return null
    }
  },

  // Get conversations by phone number
  async getConversationsByPhone(userPhone: string, limit: number = 10): Promise<ConversationContext[]> {
    try {
      const response = await api.get<ConversationListResponse>('/conversations/recent', {
        params: { user_phone: userPhone, limit }
      })
      return response.data.conversations
    } catch (error) {
      console.error('Failed to fetch conversations by phone:', error)
      return []
    }
  },

  // Get messages for a conversation
  async getConversationMessages(conversationId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const response = await api.get<MessageListResponse>(`/conversations/${conversationId}/messages`, {
        params: { limit }
      })
      return response.data.messages
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error)
      return []
    }
  },

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await api.delete(`/conversations/${conversationId}`)
      return true
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      return false
    }
  },

  /**
   * Get available bypass rules for test webhook dropdown.
   * Reuses the same endpoint as chat.api.ts.
   */
  async getAvailableBypassRules(): Promise<BypassRuleOption[]> {
    try {
      const response = await api.get<BypassRuleOption[]>('/admin/chat/bypass-rules/available')
      return response.data
    } catch (error) {
      console.error('Failed to fetch bypass rules:', error)
      return []
    }
  }
}

// Bypass rule option for dropdown (same as chat.api.ts)
export interface BypassRuleOption {
  id: string
  name: string
  type: string
  pattern: string | null
  phone_number_id: string | null
  phone_numbers: string[] | null
  target_domain: string | null
  pharmacy_id: string | null
  organization_id: string
}
