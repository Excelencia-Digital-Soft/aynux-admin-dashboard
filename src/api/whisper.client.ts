/**
 * Whisper API Client
 *
 * Separate axios client for the standalone Whisper transcription service.
 * This service runs independently on a different port (8091).
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'

// Whisper service URL - defaults to localhost:8091 for development
const WHISPER_API_URL =
  import.meta.env.VITE_WHISPER_API_URL !== undefined
    ? import.meta.env.VITE_WHISPER_API_URL
    : 'http://localhost:8091'
const WHISPER_API_V1_STR = '/api/v1'

export const whisperClient: AxiosInstance = axios.create({
  baseURL: `${WHISPER_API_URL}${WHISPER_API_V1_STR}`,
  // Extended timeout for transcription (5 minutes)
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for auth token (optional - Whisper service may not require auth)
whisperClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (Pinia persisted state)
    // Include auth token in case the Whisper service requires authentication
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
whisperClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Log Whisper-specific errors for debugging
    if (error.response) {
      console.error(`Whisper API error: ${error.response.status}`, error.response.data)
    } else if (error.request) {
      console.error('Whisper API unavailable - no response received')
    }
    return Promise.reject(error)
  }
)

export default whisperClient
