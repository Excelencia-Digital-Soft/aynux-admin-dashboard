// Pharmacy Configuration types

/**
 * Pharmacy configuration entity
 * Represents a pharmacy's configuration including Mercado Pago settings
 */
export interface PharmacyConfig {
  id: string
  organization_id: string
  organization_name?: string

  // Basic info
  pharmacy_name: string
  pharmacy_address: string | null
  pharmacy_phone: string | null
  pharmacy_logo_path: string | null

  // Mercado Pago configuration (secrets masked in responses)
  mp_enabled: boolean
  mp_sandbox: boolean
  mp_timeout: number
  mp_notification_url: string | null
  receipt_public_url_base: string | null
  has_mp_credentials: boolean

  // Masked credentials (shown as "***" if configured)
  mp_access_token: string | null
  mp_public_key: string | null
  mp_webhook_secret: string | null

  // WhatsApp
  whatsapp_phone_number: string | null

  // Timestamps
  created_at: string | null
  updated_at: string | null
}

/**
 * Request to create a new pharmacy configuration
 */
export interface PharmacyConfigCreateRequest {
  organization_id: string

  // Basic info
  pharmacy_name: string
  pharmacy_address?: string
  pharmacy_phone?: string
  pharmacy_logo_path?: string

  // Mercado Pago configuration
  mp_enabled?: boolean
  mp_access_token?: string
  mp_public_key?: string
  mp_webhook_secret?: string
  mp_sandbox?: boolean
  mp_timeout?: number
  mp_notification_url?: string
  receipt_public_url_base?: string

  // WhatsApp
  whatsapp_phone_number?: string
}

/**
 * Request to update a pharmacy configuration (partial update)
 */
export interface PharmacyConfigUpdateRequest {
  // Basic info
  pharmacy_name?: string
  pharmacy_address?: string
  pharmacy_phone?: string
  pharmacy_logo_path?: string

  // Mercado Pago configuration
  mp_enabled?: boolean
  mp_access_token?: string
  mp_public_key?: string
  mp_webhook_secret?: string
  mp_sandbox?: boolean
  mp_timeout?: number
  mp_notification_url?: string
  receipt_public_url_base?: string

  // WhatsApp
  whatsapp_phone_number?: string
}

/**
 * Paginated list response for pharmacy configurations
 */
export interface PharmacyConfigListResponse {
  pharmacies: PharmacyConfig[]
  total: number
  page: number
  page_size: number
}

// ============================================================
// Conversation History Types
// ============================================================

/**
 * Customer who has contacted the pharmacy
 */
export interface PharmacyCustomer {
  user_phone: string
  conversation_id: string
  total_messages: number
  last_activity: string
  first_message: string
  rolling_summary: string | null
}

/**
 * Paginated list response for pharmacy customers
 */
export interface PharmacyCustomerListResponse {
  customers: PharmacyCustomer[]
  total: number
  page: number
  page_size: number
}

/**
 * Individual message in a pharmacy conversation
 */
export interface PharmacyMessage {
  id: string
  conversation_id: string
  user_phone: string
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  agent_name: string | null
  created_at: string
  extra_data: Record<string, unknown>
}

/**
 * Paginated timeline response for pharmacy messages
 */
export interface PharmacyTimelineResponse {
  messages: PharmacyMessage[]
  total: number
  page: number
  page_size: number
}

/**
 * Timeline filter parameters
 */
export interface PharmacyTimelineFilters {
  start_date?: string
  end_date?: string
  sender_type?: 'user' | 'assistant' | 'all'
  user_phone?: string
  search?: string
}

/**
 * Full conversation thread with context
 */
export interface PharmacyConversation {
  conversation_id: string
  user_phone: string
  messages: PharmacyMessage[]
  total_messages: number
  context: {
    rolling_summary: string | null
    topic_history: string[]
    last_activity: string | null
  }
}

/**
 * Pharmacy statistics
 */
export interface PharmacyStats {
  total_customers: number
  total_conversations: number
  total_messages: number
  messages_today: number
  messages_this_week: number
  avg_messages_per_conversation: number
  active_conversations_24h: number
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get severity color for MP enabled status
 */
export function getMPStatusSeverity(enabled: boolean): 'success' | 'secondary' {
  return enabled ? 'success' : 'secondary'
}

/**
 * Get label for MP enabled status
 */
export function getMPStatusLabel(enabled: boolean): string {
  return enabled ? 'Activo' : 'Inactivo'
}

/**
 * Get severity color for credentials status
 */
export function getCredentialsSeverity(hasCredentials: boolean): 'success' | 'warn' {
  return hasCredentials ? 'success' : 'warn'
}

/**
 * Get label for credentials status
 */
export function getCredentialsLabel(hasCredentials: boolean): string {
  return hasCredentials ? 'Configurado' : 'Sin configurar'
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '-'
  // Format as +XX XXX XXX XXXX if starts with country code
  if (phone.startsWith('549')) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`
  }
  return phone
}

/**
 * Get sender type label
 */
export function getSenderTypeLabel(type: 'user' | 'assistant' | 'system'): string {
  const labels: Record<string, string> = {
    user: 'Cliente',
    assistant: 'Agente',
    system: 'Sistema'
  }
  return labels[type] || type
}

/**
 * Get sender type severity for styling
 */
export function getSenderTypeSeverity(
  type: 'user' | 'assistant' | 'system'
): 'info' | 'success' | 'secondary' {
  const severities: Record<string, 'info' | 'success' | 'secondary'> = {
    user: 'info',
    assistant: 'success',
    system: 'secondary'
  }
  return severities[type] || 'secondary'
}
