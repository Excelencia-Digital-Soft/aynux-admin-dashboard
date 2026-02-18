import api from './index'

export interface Institution {
  id: string
  name: string
  code: string // WhatsApp phone number ID (DID)
  institution_key: string
  institution_type: string
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

export interface MedicalTestMessage {
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

export interface MedicalTestRequest {
  whatsapp_phone_number_id: string // Business phone (DID) - REQUIRED for bypass routing
  phone_number: string // Customer phone - REQUIRED
  message?: string
  interactive_response?: InteractiveResponseInput
  session_id?: string
}

export interface MedicalTestResponse {
  session_id: string
  response: string
  response_type: string
  response_buttons?: InteractiveButton[]
  response_list_items?: InteractiveListItem[]
  execution_steps?: unknown[]
  graph_state?: unknown
  metadata?: Record<string, unknown>
}

export interface MedicalWebhookConfig {
  enabled: boolean
  phoneNumber: string
  userName: string
  did: string | null
}

// Conversation history types (shared endpoints)
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

export const medicalApi = {
  /**
   * Get available medical institutions for testing.
   * Returns institutions from tenant_institution_configs with type='medical'.
   */
  async getInstitutions(): Promise<Institution[]> {
    try {
      const response = await api.get('/admin/medical/institutions')
      return response.data
    } catch (error) {
      console.error('Failed to fetch medical institutions:', error)
      return []
    }
  },

  /**
   * Send test message to medical appointments agent.
   * Extended timeout (2 min) - LLM processing can take 30s-2min.
   */
  async sendTestMessage(request: MedicalTestRequest): Promise<MedicalTestResponse | null> {
    try {
      const response = await api.post('/admin/medical/test', request, {
        timeout: 120000 // 2 minutes
      })
      return response.data
    } catch (error) {
      console.error('Failed to send test message:', error)
      throw error
    }
  },

  /**
   * Get conversations by phone number.
   * Uses shared /conversations/recent endpoint.
   */
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

  /**
   * Get messages for a conversation.
   * Uses shared /conversations/{id}/messages endpoint.
   */
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

  /**
   * Delete a conversation.
   * Uses shared /conversations/{id} endpoint.
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await api.delete(`/conversations/${conversationId}`)
      return true
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      return false
    }
  }
}
