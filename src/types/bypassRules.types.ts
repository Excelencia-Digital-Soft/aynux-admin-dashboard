/**
 * Bypass Rules Types
 * Types for managing bypass routing rules that direct conversations to specific agents
 */

// ============================================================
// Enums / Type Unions
// ============================================================

/**
 * Rule type discriminator for conditional field validation
 */
export type BypassRuleType = 'phone_number' | 'phone_number_list' | 'whatsapp_phone_number_id'

/**
 * Target domain options
 */
export type TargetDomain = 'excelencia' | 'healthcare' | 'credit' | 'ecommerce'

// ============================================================
// Entity Interfaces
// ============================================================

/**
 * Bypass rule entity
 */
export interface BypassRule {
  id: string
  organization_id: string
  rule_name: string
  description?: string | null
  rule_type: BypassRuleType
  pattern?: string | null
  phone_numbers?: string[] | null
  phone_number_id?: string | null
  target_agent: string
  target_domain?: TargetDomain | null
  priority: number
  enabled: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Request Interfaces
// ============================================================

/**
 * Request to create a new bypass rule
 */
export interface BypassRuleCreateRequest {
  rule_name: string
  description?: string
  rule_type: BypassRuleType
  pattern?: string
  phone_numbers?: string[]
  phone_number_id?: string
  target_agent: string
  target_domain?: TargetDomain
  priority?: number
  enabled?: boolean
}

/**
 * Request to update a bypass rule
 */
export interface BypassRuleUpdateRequest {
  rule_name?: string
  description?: string
  rule_type?: BypassRuleType
  pattern?: string
  phone_numbers?: string[]
  phone_number_id?: string
  target_agent?: string
  target_domain?: TargetDomain
  priority?: number
  enabled?: boolean
}

/**
 * Request to test routing
 */
export interface BypassTestRequest {
  wa_id: string
  whatsapp_phone_number_id?: string
}

/**
 * Request to reorder rules
 */
export interface BypassReorderRequest {
  rule_ids: string[]
}

// ============================================================
// Response Interfaces
// ============================================================

/**
 * List response for bypass rules
 */
export interface BypassRuleListResponse {
  rules: BypassRule[]
  total: number
  enabled_count: number
  disabled_count: number
}

/**
 * Matched rule info in test response
 */
export interface MatchedRuleInfo {
  id: string
  rule_name: string
  target_agent: string
  target_domain?: string | null
  priority: number
}

/**
 * Response from test routing endpoint
 */
export interface BypassTestResponse {
  matched: boolean
  matched_rule?: MatchedRuleInfo | null
  target_agent?: string | null
  target_domain?: string | null
  evaluation_order: string[]
}

// ============================================================
// Filter Interfaces
// ============================================================

/**
 * Filters for bypass rules list
 */
export interface BypassRuleFilters {
  search?: string
  enabled?: boolean
  ruleType?: BypassRuleType
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
 * Get label for rule type
 */
export function getRuleTypeLabel(type: BypassRuleType): string {
  const labels: Record<BypassRuleType, string> = {
    phone_number: 'Patron',
    phone_number_list: 'Lista',
    whatsapp_phone_number_id: 'WhatsApp ID'
  }
  return labels[type] || type
}

/**
 * Get severity for rule type tag
 */
export function getRuleTypeSeverity(type: BypassRuleType): 'info' | 'warn' | 'success' {
  const severities: Record<BypassRuleType, 'info' | 'warn' | 'success'> = {
    phone_number: 'info',
    phone_number_list: 'warn',
    whatsapp_phone_number_id: 'success'
  }
  return severities[type] || 'info'
}

/**
 * Get label for target domain
 */
export function getTargetDomainLabel(domain?: TargetDomain | string | null): string {
  if (!domain) return '-'
  const labels: Record<string, string> = {
    excelencia: 'Excelencia',
    healthcare: 'Salud',
    credit: 'Credito',
    ecommerce: 'E-commerce'
  }
  return labels[domain] || domain
}

/**
 * Format pattern/numbers display for list view
 */
export function formatRuleMatch(rule: BypassRule): string {
  switch (rule.rule_type) {
    case 'phone_number':
      return rule.pattern || '-'
    case 'phone_number_list': {
      const count = rule.phone_numbers?.length || 0
      return `${count} numero${count !== 1 ? 's' : ''}`
    }
    case 'whatsapp_phone_number_id':
      return rule.phone_number_id || '-'
    default:
      return '-'
  }
}

/**
 * Get detailed match info for tooltips
 */
export function getDetailedRuleMatch(rule: BypassRule): string {
  switch (rule.rule_type) {
    case 'phone_number':
      return `Patron: ${rule.pattern || '-'}`
    case 'phone_number_list':
      return rule.phone_numbers?.join(', ') || '-'
    case 'whatsapp_phone_number_id':
      return `ID: ${rule.phone_number_id || '-'}`
    default:
      return '-'
  }
}
