export interface ApiError {
  detail: string
  status_code?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface BatchResult {
  success: boolean
  processed: number
  failed: number
  errors?: string[]
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  version?: string
  uptime?: number
}
