/**
 * Domain Types
 * Types for centralized business domain management
 */

// ============================================================
// Entity Interfaces
// ============================================================

/**
 * Domain entity from database
 */
export interface Domain {
  id: string
  domain_key: string
  display_name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  enabled: boolean
  sort_order: number
}

// ============================================================
// Request Interfaces
// ============================================================

/**
 * Request to create a new domain
 */
export interface DomainCreateRequest {
  domain_key: string
  display_name: string
  description?: string
  icon?: string
  color?: string
  enabled?: boolean
  sort_order?: number
}

/**
 * Request to update a domain
 */
export interface DomainUpdateRequest {
  display_name?: string
  description?: string
  icon?: string
  color?: string
  enabled?: boolean
  sort_order?: number
}

// ============================================================
// Response Interfaces
// ============================================================

/**
 * List response for domains
 */
export interface DomainListResponse {
  domains: Domain[]
  total: number
}

// ============================================================
// UI Option Interface
// ============================================================

/**
 * Domain option for Select component
 */
export interface DomainOption {
  value: string | null
  label: string
  color?: string
  icon?: string
}
