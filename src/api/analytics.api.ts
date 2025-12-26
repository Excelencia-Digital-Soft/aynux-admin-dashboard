import apiClient from './index'
import type { RagMetrics, RagQueryLog, EmbeddingStats } from '@/types/document.types'

const ANALYTICS_URL = '/admin/analytics'

export interface AnalyticsDateRange {
  start_date?: string
  end_date?: string
  days?: number
}

export const analyticsApi = {
  /**
   * Get RAG metrics for dashboard
   */
  async getRagMetrics(params: AnalyticsDateRange = {}): Promise<RagMetrics> {
    const { data } = await apiClient.get<RagMetrics>(`${ANALYTICS_URL}/rag/metrics`, {
      params: {
        days: params.days || 30,
        start_date: params.start_date,
        end_date: params.end_date
      }
    })
    return data
  },

  /**
   * Get RAG query logs with pagination
   */
  async getRagQueryLogs(params: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  } = {}): Promise<{ logs: RagQueryLog[]; total: number }> {
    const { data } = await apiClient.get<{ logs: RagQueryLog[]; total: number }>(
      `${ANALYTICS_URL}/rag/queries`,
      {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 50,
          start_date: params.startDate,
          end_date: params.endDate
        }
      }
    )
    return data
  },

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<EmbeddingStats> {
    const { data } = await apiClient.get<EmbeddingStats>(`${ANALYTICS_URL}/embeddings/stats`)
    return data
  },

  /**
   * Get documents without embeddings
   */
  async getDocumentsWithoutEmbedding(params: {
    page?: number
    pageSize?: number
  } = {}): Promise<{ documents: Array<{ id: string; title: string; document_type: string }>; total: number }> {
    const { data } = await apiClient.get(`${ANALYTICS_URL}/embeddings/missing`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 25
      }
    })
    return data
  },

  /**
   * Get performance metrics over time
   */
  async getPerformanceTimeSeries(params: {
    metric: 'latency' | 'token_count' | 'relevance'
    granularity?: 'hour' | 'day' | 'week'
    days?: number
  }): Promise<Array<{ timestamp: string; value: number }>> {
    const { data } = await apiClient.get<Array<{ timestamp: string; value: number }>>(
      `${ANALYTICS_URL}/rag/timeseries`,
      {
        params: {
          metric: params.metric,
          granularity: params.granularity || 'day',
          days: params.days || 30
        }
      }
    )
    return data
  },

  /**
   * Export analytics data
   */
  async exportData(params: {
    type: 'rag_queries' | 'embeddings' | 'metrics'
    format: 'csv' | 'json'
    startDate?: string
    endDate?: string
  }): Promise<Blob> {
    const { data } = await apiClient.get(`${ANALYTICS_URL}/export`, {
      params,
      responseType: 'blob'
    })
    return data
  }
}

export default analyticsApi
