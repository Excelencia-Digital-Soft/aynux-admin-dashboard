export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  disabled: boolean
  scopes: string[]
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  slug: string
  name: string
  display_name?: string
  mode: 'generic' | 'multi_tenant'
  status: 'active' | 'suspended' | 'trial'
  role: string
  is_admin: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface CurrentUserResponse {
  user: User
  organizations: Organization[]
}

export interface AuthState {
  accessToken: string | null
  user: User | null
  organizations: Organization[]
  currentOrgId: string | null
  currentRole: string | null
  loginError: string | null
}
