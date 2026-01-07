import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'

// Use empty string for relative URLs (production with Nginx proxy)
// Fallback to localhost only when variable is undefined (development)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:8080'
const API_V1_STR = import.meta.env.VITE_API_V1_STR || '/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_STR}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (Pinia persisted state)
    const authData = localStorage.getItem('auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed.accessToken) {
          config.headers.Authorization = `Bearer ${parsed.accessToken}`
        }
      } catch {
        // Invalid JSON in localStorage
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem('auth')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
