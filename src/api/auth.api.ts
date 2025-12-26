import apiClient from './index'
import type { LoginRequest, LoginResponse, CurrentUserResponse } from '@/types/auth.types'
import type { HealthCheckResponse } from '@/types/api.types'

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // /auth/login expects JSON body with {email, password}
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password
    })
    return data
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } = await apiClient.get<CurrentUserResponse>('/auth/me')
    return data
  },

  /**
   * Logout (client-side only, clears token)
   */
  logout(): void {
    localStorage.removeItem('auth')
  },

  /**
   * Check API health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const { data } = await apiClient.get<HealthCheckResponse>('/health')
    return data
  },

  /**
   * Refresh token (if implemented)
   */
  async refreshToken(): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/refresh')
    return data
  }
}

export default authApi
