// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  settings: OrganizationSettings
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  max_users?: number
  max_documents?: number
  features?: string[]
  custom_branding?: boolean
  api_access?: boolean
  webhook_url?: string
  allowed_domains?: string[]
}

export interface OrganizationCreateRequest {
  name: string
  slug: string
  description?: string
  settings?: Partial<OrganizationSettings>
}

export interface OrganizationUpdateRequest {
  name?: string
  description?: string
  logo_url?: string
  settings?: Partial<OrganizationSettings>
  status?: 'active' | 'inactive' | 'suspended'
}

// User types
export interface OrganizationUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  status: 'active' | 'inactive' | 'pending'
  organization_id: string
  last_login?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface UserCreateRequest {
  email: string
  full_name: string
  role: UserRole
  password?: string
  send_invite?: boolean
}

export interface UserUpdateRequest {
  full_name?: string
  role?: UserRole
  status?: 'active' | 'inactive'
}

export interface UserInvite {
  id: string
  email: string
  role: UserRole
  organization_id: string
  invited_by: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
}

// Tenant configuration
export interface TenantConfig {
  id: string
  organization_id: string

  // Branding
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  favicon_url?: string

  // Agent settings
  agent_name?: string
  agent_greeting?: string
  agent_personality?: string
  agent_instructions?: string

  // Features
  enabled_features: string[]
  disabled_features: string[]

  // Limits
  daily_message_limit?: number
  max_context_tokens?: number
  max_response_tokens?: number

  // Integration
  webhook_url?: string
  webhook_secret?: string
  api_key?: string

  // Custom fields
  custom_fields?: Record<string, unknown>

  created_at: string
  updated_at: string
}

export interface TenantConfigUpdateRequest {
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  agent_name?: string
  agent_greeting?: string
  agent_personality?: string
  agent_instructions?: string
  enabled_features?: string[]
  disabled_features?: string[]
  daily_message_limit?: number
  max_context_tokens?: number
  max_response_tokens?: number
  webhook_url?: string
  custom_fields?: Record<string, unknown>
}

// Tenant documents (organization-specific knowledge base)
export interface TenantDocument {
  id: string
  organization_id: string
  title: string
  content: string
  document_type: string
  category?: string
  tags?: string[]
  active: boolean
  has_embedding: boolean
  priority: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface TenantDocumentCreateRequest {
  title: string
  content: string
  document_type: string
  category?: string
  tags?: string[]
  priority?: number
}

export interface TenantDocumentUpdateRequest {
  title?: string
  content?: string
  document_type?: string
  category?: string
  tags?: string[]
  active?: boolean
  priority?: number
}

// Statistics
export interface OrganizationStats {
  total_users: number
  active_users: number
  total_documents: number
  total_messages: number
  storage_used_mb: number
  api_calls_today: number
  api_calls_month: number
}

export interface TenantDocumentStats {
  total_documents: number
  active_documents: number
  documents_with_embedding: number
  documents_by_type: Record<string, number>
  total_categories: number
}

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  admin: ['users.manage', 'documents.manage', 'config.manage', 'analytics.view'],
  editor: ['documents.manage', 'analytics.view'],
  viewer: ['documents.view', 'analytics.view']
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes('*') || permissions.includes(permission)
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Visor'
  }
  return labels[role] || role
}

export function getRoleSeverity(role: UserRole): 'danger' | 'warn' | 'info' | 'secondary' {
  const severities: Record<UserRole, 'danger' | 'warn' | 'info' | 'secondary'> = {
    owner: 'danger',
    admin: 'warn',
    editor: 'info',
    viewer: 'secondary'
  }
  return severities[role] || 'secondary'
}
