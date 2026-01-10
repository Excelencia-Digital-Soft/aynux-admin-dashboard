/**
 * Response Configs Types - Multi-domain, multi-tenant response configuration
 * Defines how the system generates responses for each intent
 */

import type { DomainKey, CacheStatsResponse, BulkImportResponse, SeedResponse } from './domainIntents.types'

// Re-export shared types for convenience
export type { DomainKey, CacheStatsResponse, BulkImportResponse, SeedResponse }

// ============================================================================
// Core Response Config Types
// ============================================================================

/**
 * Response configuration entity
 * Maps intents to response generation settings
 */
export interface ResponseConfig {
  id: string
  organization_id: string
  domain_key: DomainKey
  intent_key: string
  is_critical: boolean // If true, always uses fixed template, never LLM
  task_description: string // Injected into LLM system prompt
  fallback_template_key: string // Key in fallback_templates.yaml
  display_name: string | null
  description: string | null
  priority: number // 0-1000, higher = first
  is_enabled: boolean
  created_at: string | null
  updated_at: string | null
}

/**
 * Create response config request
 */
export interface ResponseConfigCreate {
  organization_id: string
  domain_key: string
  intent_key: string
  is_critical?: boolean
  task_description: string
  fallback_template_key: string
  display_name?: string | null
  description?: string | null
  priority?: number
  is_enabled?: boolean
}

/**
 * Update response config request (all fields optional)
 */
export interface ResponseConfigUpdate {
  is_critical?: boolean
  task_description?: string
  fallback_template_key?: string
  display_name?: string | null
  description?: string | null
  priority?: number
  is_enabled?: boolean
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * List response configs response
 */
export interface ResponseConfigListResponse {
  configs: ResponseConfig[]
  total: number
  domain_key: string
}

/**
 * Domain statistics for response configs
 */
export interface DomainConfigStats {
  domain_key: string
  total_configs: number
  enabled_configs: number
  critical_configs: number
}

/**
 * Domain list response
 */
export interface DomainListResponse {
  organization_id: string
  domains: DomainConfigStats[]
}

// ============================================================================
// Filter and Query Types
// ============================================================================

/**
 * Filter options for response config list
 */
export interface ResponseConfigFilterOptions {
  enabled_only?: boolean
  critical_only?: boolean
  search?: string
}

// ============================================================================
// Export/Import Types
// ============================================================================

/**
 * Response config export format (for JSON export)
 */
export interface ResponseConfigExport {
  intent_key: string
  is_critical: boolean
  task_description: string
  fallback_template_key: string
  display_name: string | null
  description: string | null
  priority: number
  is_enabled: boolean
}

/**
 * Export file format
 */
export interface ResponseConfigsExportFile {
  domain_key: string
  organization_id: string
  exported_at: string
  configs: ResponseConfigExport[]
}

// ============================================================================
// Form Types (for UI)
// ============================================================================

/**
 * Form data for create/edit dialog
 */
export interface ResponseConfigFormData {
  intent_key: string
  display_name: string
  description: string
  task_description: string
  fallback_template_key: string
  priority: number
  is_critical: boolean
  is_enabled: boolean
}

/**
 * Default form data
 */
export const DEFAULT_RESPONSE_CONFIG_FORM: ResponseConfigFormData = {
  intent_key: '',
  display_name: '',
  description: '',
  task_description: '',
  fallback_template_key: '',
  priority: 0,
  is_critical: false,
  is_enabled: true
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache invalidate request
 */
export interface CacheInvalidateRequest {
  organization_id?: string | null
  domain_key?: string | null
}

/**
 * Cache invalidate response
 */
export interface CacheInvalidateResponse {
  success: boolean
  organizations_invalidated: number
  message: string | null
}

/**
 * Cache warm request
 */
export interface CacheWarmRequest {
  organization_id: string
  domain_key: string
}

/**
 * Cache warm response
 */
export interface CacheWarmResponse {
  success: boolean
  configs_loaded: number
  message: string | null
}
