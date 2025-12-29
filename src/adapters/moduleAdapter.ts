/**
 * Module Adapter
 *
 * Transforms API responses to ensure compatibility with SoftwareModule interface.
 * Provides defensive defaults for missing or malformed data.
 */

import type { SoftwareModule, ModuleCategory, ModuleStatus, PricingTier } from '@/types/agent.types'

// Valid values for enums
const VALID_CATEGORIES: ModuleCategory[] = [
  'salud',
  'hotelería',
  'financiero',
  'gremios',
  'productos',
  'servicios públicos',
  'general'
]

const VALID_STATUSES: ModuleStatus[] = ['active', 'beta', 'coming_soon', 'deprecated']

const VALID_TIERS: PricingTier[] = ['standard', 'premium', 'enterprise']

/**
 * Validates and normalizes a category value
 */
function normalizeCategory(value: unknown): ModuleCategory {
  if (typeof value === 'string' && VALID_CATEGORIES.includes(value as ModuleCategory)) {
    return value as ModuleCategory
  }
  return 'general'
}

/**
 * Validates and normalizes a status value
 */
function normalizeStatus(value: unknown): ModuleStatus {
  if (typeof value === 'string' && VALID_STATUSES.includes(value as ModuleStatus)) {
    return value as ModuleStatus
  }
  return 'active'
}

/**
 * Validates and normalizes a pricing tier value
 */
function normalizePricingTier(value: unknown): PricingTier {
  if (typeof value === 'string' && VALID_TIERS.includes(value as PricingTier)) {
    return value as PricingTier
  }
  return 'standard'
}

/**
 * Validates and normalizes a features array
 */
function normalizeFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((f): f is string => typeof f === 'string')
  }
  return []
}

/**
 * Validates and normalizes an ISO date string
 */
function normalizeDate(value: unknown): string {
  if (typeof value === 'string' && !isNaN(Date.parse(value))) {
    return value
  }
  return new Date().toISOString()
}

/**
 * Transform a single module response to SoftwareModule
 * Provides defensive defaults for all fields
 */
export function adaptModule(data: unknown): SoftwareModule {
  // Handle null/undefined
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid module data: expected object')
  }

  const raw = data as Record<string, unknown>
  const now = new Date().toISOString()

  return {
    id: String(raw.id ?? ''),
    code: String(raw.code ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    category: normalizeCategory(raw.category),
    status: normalizeStatus(raw.status),
    features: normalizeFeatures(raw.features),
    pricing_tier: normalizePricingTier(raw.pricing_tier),
    created_at: normalizeDate(raw.created_at) || now,
    updated_at: normalizeDate(raw.updated_at) || now
  }
}

/**
 * Transform an array of module responses to SoftwareModule[]
 * Filters out invalid entries and logs warnings
 */
export function adaptModules(data: unknown): SoftwareModule[] {
  if (!Array.isArray(data)) {
    console.warn('adaptModules: expected array, got', typeof data)
    return []
  }

  const modules: SoftwareModule[] = []

  for (const item of data) {
    try {
      modules.push(adaptModule(item))
    } catch (error) {
      console.warn('adaptModules: skipping invalid module', item, error)
    }
  }

  return modules
}
