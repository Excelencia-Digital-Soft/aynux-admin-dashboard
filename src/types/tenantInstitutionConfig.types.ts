/**
 * TypeScript types for TenantInstitutionConfig management.
 *
 * These types mirror the backend Pydantic schemas and SQLAlchemy models.
 * Used by API client, stores, and components.
 */

// ============================================================
// Connection Types
// ============================================================

export type ConnectionType = 'soap' | 'rest' | 'graphql'

export interface ConnectionSettings {
  type: ConnectionType
  base_url: string
  timeout_seconds?: number
  retry_count?: number
  verify_ssl?: boolean
}

// ============================================================
// Authentication Types (Discriminated Union)
// ============================================================

export type AuthType = 'none' | 'api_key' | 'basic' | 'oauth2' | 'soap_wss'

export interface NoAuth {
  type: 'none'
}

export interface ApiKeyAuth {
  type: 'api_key'
  header_name?: string
  query_param?: string
  prefix?: string
}

export interface BasicAuth {
  type: 'basic'
  username?: string
}

export interface OAuth2Auth {
  type: 'oauth2'
  token_url?: string
  client_id?: string
  scopes?: string[]
  grant_type?: string
}

export interface SoapWssAuth {
  type: 'soap_wss'
  username?: string
  password_type?: string
  must_understand?: boolean
}

export type AuthSettings = NoAuth | ApiKeyAuth | BasicAuth | OAuth2Auth | SoapWssAuth

// ============================================================
// Scheduler Settings
// ============================================================

export interface SchedulerSettings {
  enabled: boolean
  timezone: string
  morning_hour?: number
  evening_hour?: number
  reminder_days_before?: number
}

// ============================================================
// Branding Settings
// ============================================================

export interface BrandingSettings {
  display_name?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_path?: string
}

// ============================================================
// WhatsApp Settings
// ============================================================

export interface WhatsAppSettings {
  phone_number_id?: string
  business_account_id?: string
  verify_token?: string
}

// ============================================================
// Institution Settings (Root Schema)
// ============================================================

export interface InstitutionSettings {
  /** External system institution ID (e.g., HCWeb IdInstitucion) */
  institution_id?: string
  connection: ConnectionSettings
  auth: AuthSettings
  scheduler: SchedulerSettings
  branding?: BrandingSettings
  whatsapp?: WhatsAppSettings
  custom?: Record<string, unknown>
}

// ============================================================
// Institution Config Model
// ============================================================

export interface TenantInstitutionConfig {
  id: string
  organization_id: string
  institution_key: string
  institution_name: string
  institution_type: string
  enabled: boolean
  description?: string
  settings: InstitutionSettings
  has_secrets: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface InstitutionConfigCreateRequest {
  institution_key: string
  institution_name: string
  institution_type?: string
  enabled?: boolean
  description?: string
  settings?: Partial<InstitutionSettings>
}

export interface InstitutionConfigUpdateRequest {
  institution_name?: string
  institution_type?: string
  enabled?: boolean
  description?: string
  settings?: Partial<InstitutionSettings>
}

export interface InstitutionConfigSecretsRequest {
  api_key?: string
  password?: string
  client_secret?: string
}

export interface InstitutionConfigListResponse {
  items: TenantInstitutionConfig[]
  total: number
  enabled_count: number
  disabled_count: number
}

export interface InstitutionConfigListParams {
  page?: number
  page_size?: number
  institution_type?: string
  search?: string
  enabled_only?: boolean
}

// ============================================================
// Form State Types
// ============================================================

export interface InstitutionConfigFormState {
  // General tab
  institution_key: string
  institution_name: string
  institution_type: string
  enabled: boolean
  description: string
  /** External system institution ID (e.g., HCWeb IdInstitucion) */
  institution_id: string

  // Connection tab
  connection: ConnectionSettings

  // Auth tab
  auth: AuthSettings

  // Scheduler tab
  scheduler: SchedulerSettings

  // Branding tab
  branding: BrandingSettings

  // WhatsApp tab
  whatsapp: WhatsAppSettings

  // Custom tab (optional)
  custom: Record<string, unknown>
}

export interface SecretsFormState {
  api_key: string
  password: string
  client_secret: string
  updateSecrets: boolean
}

// ============================================================
// Constants
// ============================================================

export const CONNECTION_TYPES: { label: string; value: ConnectionType }[] = [
  { label: 'REST API', value: 'rest' },
  { label: 'SOAP', value: 'soap' },
  { label: 'GraphQL', value: 'graphql' }
]

export const AUTH_TYPES: { label: string; value: AuthType }[] = [
  { label: 'Sin autenticación', value: 'none' },
  { label: 'API Key', value: 'api_key' },
  { label: 'Basic Auth', value: 'basic' },
  { label: 'OAuth 2.0', value: 'oauth2' },
  { label: 'SOAP WS-Security', value: 'soap_wss' }
]

export const INSTITUTION_TYPES: { label: string; value: string }[] = [
  { label: 'Genérico', value: 'generic' },
  { label: 'Médico', value: 'medical' },
  { label: 'Farmacia', value: 'pharmacy' },
  { label: 'Laboratorio', value: 'laboratory' }
]

export const TIMEZONES: { label: string; value: string }[] = [
  { label: 'Argentina/Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { label: 'Argentina/San Juan', value: 'America/Argentina/San_Juan' },
  { label: 'Argentina/Córdoba', value: 'America/Argentina/Cordoba' },
  { label: 'Argentina/Mendoza', value: 'America/Argentina/Mendoza' },
  { label: 'Chile/Santiago', value: 'America/Santiago' },
  { label: 'Brasil/São Paulo', value: 'America/Sao_Paulo' },
  { label: 'UTC', value: 'UTC' }
]

// ============================================================
// Helper Functions
// ============================================================

export function getDefaultConnectionSettings(): ConnectionSettings {
  return {
    type: 'rest',
    base_url: '',
    timeout_seconds: 30,
    retry_count: 3,
    verify_ssl: true
  }
}

export function getDefaultAuthSettings(): NoAuth {
  return { type: 'none' }
}

export function getDefaultSchedulerSettings(): SchedulerSettings {
  return {
    enabled: true,
    timezone: 'America/Argentina/San_Juan',
    morning_hour: 9,
    evening_hour: 20,
    reminder_days_before: 1
  }
}

export function getDefaultBrandingSettings(): BrandingSettings {
  return {
    display_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo_path: ''
  }
}

export function getDefaultWhatsAppSettings(): WhatsAppSettings {
  return {
    phone_number_id: '',
    business_account_id: '',
    verify_token: ''
  }
}

export function getDefaultFormState(): InstitutionConfigFormState {
  return {
    institution_key: '',
    institution_name: '',
    institution_type: 'generic',
    enabled: true,
    description: '',
    institution_id: '',
    connection: getDefaultConnectionSettings(),
    auth: getDefaultAuthSettings(),
    scheduler: getDefaultSchedulerSettings(),
    branding: getDefaultBrandingSettings(),
    whatsapp: getDefaultWhatsAppSettings(),
    custom: {}
  }
}

export function configToFormState(config: TenantInstitutionConfig): InstitutionConfigFormState {
  return {
    institution_key: config.institution_key,
    institution_name: config.institution_name,
    institution_type: config.institution_type,
    enabled: config.enabled,
    description: config.description || '',
    institution_id: config.settings.institution_id || '',
    connection: config.settings.connection || getDefaultConnectionSettings(),
    auth: config.settings.auth || getDefaultAuthSettings(),
    scheduler: config.settings.scheduler || getDefaultSchedulerSettings(),
    branding: config.settings.branding || getDefaultBrandingSettings(),
    whatsapp: config.settings.whatsapp || getDefaultWhatsAppSettings(),
    custom: config.settings.custom || {}
  }
}

export function formStateToCreateRequest(
  state: InstitutionConfigFormState
): InstitutionConfigCreateRequest {
  return {
    institution_key: state.institution_key,
    institution_name: state.institution_name,
    institution_type: state.institution_type,
    enabled: state.enabled,
    description: state.description || undefined,
    settings: {
      institution_id: state.institution_id || undefined,
      connection: state.connection,
      auth: state.auth,
      scheduler: state.scheduler,
      branding: state.branding,
      whatsapp: state.whatsapp,
      custom: state.custom
    }
  }
}

export function formStateToUpdateRequest(
  state: InstitutionConfigFormState
): InstitutionConfigUpdateRequest {
  return {
    institution_name: state.institution_name,
    institution_type: state.institution_type,
    enabled: state.enabled,
    description: state.description || undefined,
    settings: {
      institution_id: state.institution_id || undefined,
      connection: state.connection,
      auth: state.auth,
      scheduler: state.scheduler,
      branding: state.branding,
      whatsapp: state.whatsapp,
      custom: state.custom
    }
  }
}
