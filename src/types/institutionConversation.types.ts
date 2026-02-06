/**
 * TypeScript types for institution conversation history.
 *
 * Mirrors the backend Pydantic schemas from institution_conversations.py
 */

export interface InstitutionCustomer {
  user_phone: string
  conversation_id: string
  total_messages: number
  last_activity: string | null
  first_message: string | null
  rolling_summary: string | null
}

export interface InstitutionCustomerListResponse {
  customers: InstitutionCustomer[]
  total: number
  page: number
  page_size: number
}

export interface InstitutionMessage {
  id: string
  conversation_id: string
  user_phone: string | null
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  agent_name: string | null
  created_at: string
  extra_data: Record<string, unknown>
}

export interface InstitutionTimelineResponse {
  messages: InstitutionMessage[]
  total: number
  page: number
  page_size: number
}

export interface InstitutionTimelineFilters {
  start_date?: string
  end_date?: string
  sender_type?: 'user' | 'assistant' | 'all'
  user_phone?: string
  search?: string
}

export interface InstitutionConversation {
  conversation_id: string
  user_phone: string | null
  messages: InstitutionMessage[]
  total_messages: number
  context: {
    rolling_summary: string | null
    topic_history: string[]
    last_activity: string | null
  }
}

export interface InstitutionConversationStats {
  total_customers: number
  total_conversations: number
  total_messages: number
  messages_today: number
  messages_this_week: number
  avg_messages_per_conversation: number
  active_conversations_24h: number
}

export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '-'
  if (phone.length > 10) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`
  }
  return phone
}
