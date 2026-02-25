/**
 * TypeScript types for Turnos Medicos testing.
 *
 * These types were previously in medical.api.ts and are used by
 * the turnos medicos testing composable and components.
 */

// Re-export interactive types from chat.types for convenience
export type { InteractiveButton, InteractiveListItem } from '@/types/chat.types'

/**
 * Simplified institution representation for turnos medicos testing UI.
 * Mapped from TenantInstitutionConfig.
 */
export interface Institution {
  id: string
  name: string
  code: string // WhatsApp phone number ID (DID) - from chattigo.did or whatsapp.phone_number_id
  institution_key: string
  institution_type: string
  active: boolean
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
  buttons?: { id: string; titulo: string }[]
  listItems?: { id: string; titulo: string; descripcion?: string }[]
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
  response_buttons?: { id: string; titulo: string }[]
  response_list_items?: { id: string; titulo: string; descripcion?: string }[]
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
