/**
 * Domain Intents Types - Multi-domain, multi-tenant intent pattern management
 * Unified structure replacing pharmacy-specific intent tables
 */

// Pattern type enum matching backend PatternType
export type PatternType = 'lemma' | 'phrase' | 'confirmation' | 'keyword'

// Match type enum for phrase/confirmation patterns
export type MatchType = 'exact' | 'contains' | 'prefix'

// Domain keys - extensible for future domains
export type DomainKey = 'pharmacy' | 'excelencia' | 'ecommerce' | 'healthcare' | string

// Phrase response from backend (for phrases)
export interface PhraseResponse {
  phrase: string
  match_type: string
}

// Confirmation pattern response from backend
export interface ConfirmationPatternResponse {
  pattern: string
  pattern_type: string
}

// Domain intent (main intent definition) - matches backend IntentResponse
export interface DomainIntent {
  id: string
  organization_id: string
  domain_key: DomainKey
  intent_key: string
  name: string
  description: string | null
  weight: number
  exact_match: boolean
  is_enabled: boolean
  priority: number
  lemmas: string[]
  phrases: PhraseResponse[]
  confirmation_patterns: ConfirmationPatternResponse[]
  keywords: string[]
  created_at: string | null
  updated_at: string | null
}

// Phrase pattern with match type (for phrases and confirmations)
export interface PhrasePattern {
  value: string
  match_type: MatchType
}

// Create intent request
export interface IntentCreate {
  intent_key: string
  name: string
  description?: string | null
  weight?: number
  exact_match?: boolean
  is_enabled?: boolean
  priority?: number
}

// Update intent request
export interface IntentUpdate {
  name?: string
  description?: string | null
  weight?: number
  exact_match?: boolean
  is_enabled?: boolean
  priority?: number
}

// Pattern create request (generic for all pattern types)
export interface PatternCreate {
  pattern_type: PatternType
  pattern_value: string
  match_type?: MatchType | null
  priority?: number
}

// Batch pattern create request
export interface PatternBatchCreate {
  patterns: PatternCreate[]
}

// Simple pattern create (for lemmas/keywords - just values)
export interface SimplePatternCreate {
  values: string[]
}

// Phrase pattern create (for phrases/confirmations - values with match types)
export interface PhrasePatternCreate {
  patterns: PhrasePattern[]
}

// API response types
export interface DomainIntentListResponse {
  intents: DomainIntent[]
  total: number
  domain_key: string
}

export interface PatternOperationResponse {
  success: boolean
  count: number
  message: string | null
}

// Filter options for intent list
export interface IntentFilterOptions {
  is_enabled?: boolean
  search?: string
  skip?: number
  limit?: number
}

// Domain configuration (for UI domain selector)
export interface DomainConfig {
  key: DomainKey
  name: string
  description: string
  icon: string
  color: string
  isCustom?: boolean // Flag for user-created domains
}

// Available domains for the organization
export const AVAILABLE_DOMAINS: DomainConfig[] = [
  {
    key: 'pharmacy',
    name: 'Farmacia',
    description: 'Intents para asistente de farmacia',
    icon: 'pi pi-heart',
    color: '#10b981'
  },
  {
    key: 'excelencia',
    name: 'Excelencia',
    description: 'Intents para software Excelencia',
    icon: 'pi pi-star',
    color: '#8b5cf6'
  },
  {
    key: 'ecommerce',
    name: 'E-Commerce',
    description: 'Intents para comercio electrónico',
    icon: 'pi pi-shopping-cart',
    color: '#f59e0b'
  },
  {
    key: 'healthcare',
    name: 'Salud',
    description: 'Intents para servicios de salud',
    icon: 'pi pi-heart-fill',
    color: '#ef4444'
  }
]

// Pattern type configuration (for UI)
export interface PatternTypeConfig {
  type: PatternType
  name: string
  description: string
  icon: string
  hasMatchType: boolean
  placeholder: string
}

export const PATTERN_TYPE_CONFIGS: PatternTypeConfig[] = [
  {
    type: 'lemma',
    name: 'Lemmas',
    description: 'Formas base de palabras (spaCy)',
    icon: 'pi pi-book',
    hasMatchType: false,
    placeholder: 'Ej: comprar, precio, disponible'
  },
  {
    type: 'phrase',
    name: 'Frases',
    description: 'Frases y expresiones comunes',
    icon: 'pi pi-comments',
    hasMatchType: true,
    placeholder: 'Ej: cuánto cuesta, tienen disponible'
  },
  {
    type: 'confirmation',
    name: 'Confirmaciones',
    description: 'Patrones de confirmación del usuario',
    icon: 'pi pi-check-circle',
    hasMatchType: true,
    placeholder: 'Ej: sí, ok, dale, perfecto'
  },
  {
    type: 'keyword',
    name: 'Keywords',
    description: 'Palabras clave de alta prioridad',
    icon: 'pi pi-key',
    hasMatchType: false,
    placeholder: 'Ej: urgente, emergencia, turno'
  }
]

// Match type options (for UI selectors)
export const MATCH_TYPE_OPTIONS = [
  { value: 'exact', label: 'Exacto', description: 'Coincidencia exacta de la frase' },
  { value: 'contains', label: 'Contiene', description: 'El mensaje contiene la frase' },
  { value: 'prefix', label: 'Prefijo', description: 'El mensaje comienza con la frase' }
]

// ============================================================================
// Cache and Seed Response Types
// ============================================================================

// Cache statistics response from backend
export interface CacheStatsResponse {
  memory_hits: number
  memory_misses: number
  memory_hit_rate: number
  redis_hits: number
  redis_misses: number
  redis_hit_rate: number
  db_loads: number
  invalidations: number
  cached_organizations: number
}

// Seed defaults response
export interface SeedResponse {
  success: boolean
  domain_key: string
  added: number
  skipped: number
  errors: string[] | null
}

// Bulk import response
export interface BulkImportResponse {
  success: boolean
  created: number
  skipped: number
  errors: string[] | null
}

// Intent export format (for JSON export/import)
export interface IntentExport {
  intent_key: string
  name: string
  description: string | null
  weight: number
  exact_match: boolean
  is_enabled: boolean
  priority: number
  lemmas: string[]
  phrases: PhraseResponse[]
  confirmation_patterns: ConfirmationPatternResponse[]
  keywords: string[]
}

// Export file format
export interface IntentsExportFile {
  domain_key: string
  organization_id: string
  exported_at: string
  intents: IntentExport[]
}
