// Chattigo Credentials types

/**
 * Chattigo credential entity
 * Represents WhatsApp Business credentials for Chattigo ISV integration
 */
export interface ChattigoCredential {
  did: string // WhatsApp Business phone number (10-15 digits, unique)
  name: string
  username: string // Masked as "***" in responses
  password: string // Masked as "***" in responses
  login_url: string
  base_url: string // API base URL (messages sent to /v15.0/{did}/messages)
  bot_name: string
  token_refresh_hours: number
  enabled: boolean
  organization_id: string
  bypass_rule_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Request to create new Chattigo credentials
 */
export interface ChattigoCredentialCreateRequest {
  did: string // Required, 10-15 digits
  name: string // Required
  username: string // Required
  password: string // Required
  login_url?: string // Optional, default: https://channels.chattigo.com/bsp-cloud-chattigo-isv/login
  base_url?: string // Optional, default: https://channels.chattigo.com/bsp-cloud-chattigo-isv
  bot_name?: string // Optional, default: "Aynux"
  token_refresh_hours?: number // Optional, default: 7
  enabled?: boolean // Optional, default: true
  organization_id: string // Required
  bypass_rule_id?: string // Optional
}

/**
 * Request to update Chattigo credentials (partial update)
 */
export interface ChattigoCredentialUpdateRequest {
  name?: string
  username?: string
  password?: string
  login_url?: string
  base_url?: string
  bot_name?: string
  token_refresh_hours?: number
  enabled?: boolean
  bypass_rule_id?: string | null
}

/**
 * Response from test authentication endpoint
 */
export interface ChattigoTestResponse {
  success: boolean
  message: string
  token_valid_until?: string
  error_detail?: string
}

/**
 * Cache statistics response
 */
export interface ChattigoCacheStats {
  total_cached: number
  cache_hits: number
  cache_misses: number
  tokens_refreshed: number
}

/**
 * Filters for credentials list
 */
export interface ChattigoCredentialFilters {
  search?: string
  enabled?: boolean
  org_id?: string
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get severity color for enabled status
 */
export function getEnabledStatusSeverity(enabled: boolean): 'success' | 'secondary' {
  return enabled ? 'success' : 'secondary'
}

/**
 * Get label for enabled status
 */
export function getEnabledStatusLabel(enabled: boolean): string {
  return enabled ? 'Activo' : 'Inactivo'
}

/**
 * Validate DID format (10-15 digits)
 */
export function validateDID(did: string): boolean {
  return /^\d{10,15}$/.test(did)
}

/**
 * Format DID for display
 */
export function formatDID(did: string): string {
  if (!did) return '-'
  // Format as +XX XXX XXX XXXX for display
  if (did.length >= 10) {
    return `+${did.slice(0, 2)} ${did.slice(2, 5)} ${did.slice(5, 8)} ${did.slice(8)}`
  }
  return did
}

/**
 * Default URLs for Chattigo ISV
 * Note: Messages are sent to {base_url}/v15.0/{did}/messages
 */
export const CHATTIGO_DEFAULTS: {
  LOGIN_URL: string
  BASE_URL: string
  BOT_NAME: string
  TOKEN_REFRESH_HOURS: number
} = {
  LOGIN_URL: 'https://channels.chattigo.com/bsp-cloud-chattigo-isv/login',
  BASE_URL: 'https://channels.chattigo.com/bsp-cloud-chattigo-isv',
  BOT_NAME: 'Aynux',
  TOKEN_REFRESH_HOURS: 7
}
