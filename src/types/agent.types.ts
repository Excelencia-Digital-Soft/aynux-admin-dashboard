// Agent configuration and settings types

export interface AgentModule {
  id: string
  name: string
  description: string
  target: string
  features: string[]
  enabled: boolean
}

export interface AgentSettings {
  model: string
  temperature: number
  max_response_length: number
  use_rag: boolean
  rag_max_results: number
}

export interface AgentConfig {
  modules: Record<string, AgentModule>
  settings: AgentSettings
}

export interface AgentModuleUpdateRequest {
  name?: string
  description?: string
  target?: string
  features?: string[]
  enabled?: boolean
}

export interface AgentSettingsUpdateRequest {
  model?: string
  temperature?: number
  max_response_length?: number
  use_rag?: boolean
  rag_max_results?: number
}

// Software catalog types (Excelencia)
export type ModuleCategory =
  | 'salud'
  | 'hotelería'
  | 'financiero'
  | 'gremios'
  | 'productos'
  | 'servicios públicos'
  | 'general'

export type ModuleStatus = 'active' | 'beta' | 'coming_soon' | 'deprecated'

export type PricingTier = 'standard' | 'premium' | 'enterprise'

export interface SoftwareModule {
  id: string
  code: string
  name: string
  description: string
  category: ModuleCategory
  status: ModuleStatus
  features: string[]
  pricing_tier: PricingTier
  created_at: string
  updated_at: string
}

export interface SoftwareModuleCreateRequest {
  code: string
  name: string
  category: ModuleCategory
  description?: string
  status?: ModuleStatus
  features?: string[]
  pricing_tier?: PricingTier
}

export interface SoftwareModuleUpdateRequest {
  name?: string
  description?: string
  category?: ModuleCategory
  status?: ModuleStatus
  features?: string[]
  pricing_tier?: PricingTier
}

export interface ModuleFilters {
  category?: ModuleCategory
  status?: ModuleStatus
  search?: string
}

// Helper functions
export const categoryOptions: { value: ModuleCategory; label: string }[] = [
  { value: 'salud', label: 'Salud' },
  { value: 'hotelería', label: 'Hotelería' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'gremios', label: 'Gremios' },
  { value: 'productos', label: 'Productos' },
  { value: 'servicios públicos', label: 'Servicios Públicos' },
  { value: 'general', label: 'General' }
]

export const statusOptions: { value: ModuleStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'beta', label: 'Beta' },
  { value: 'coming_soon', label: 'Próximamente' },
  { value: 'deprecated', label: 'Deprecado' }
]

export const pricingOptions: { value: PricingTier; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' }
]

export function getStatusSeverity(status: ModuleStatus): 'success' | 'info' | 'warn' | 'secondary' {
  const map: Record<ModuleStatus, 'success' | 'info' | 'warn' | 'secondary'> = {
    active: 'success',
    beta: 'info',
    coming_soon: 'warn',
    deprecated: 'secondary'
  }
  return map[status]
}

export function getTierSeverity(tier: PricingTier): 'secondary' | 'info' | 'warn' {
  const map: Record<PricingTier, 'secondary' | 'info' | 'warn'> = {
    standard: 'secondary',
    premium: 'info',
    enterprise: 'warn'
  }
  return map[tier]
}
