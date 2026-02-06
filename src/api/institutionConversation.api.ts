/**
 * API client for institution conversation history endpoints.
 *
 * Base URL: /admin/organizations/{orgId}/institution-configs/{configId}
 */

import apiClient from '@/api'
import type {
  InstitutionCustomerListResponse,
  InstitutionTimelineResponse,
  InstitutionTimelineFilters,
  InstitutionConversation,
  InstitutionConversationStats
} from '@/types/institutionConversation.types'

const BASE_URL = '/admin/organizations'

function configUrl(orgId: string, configId: string): string {
  return `${BASE_URL}/${orgId}/institution-configs/${configId}`
}

export const institutionConversationApi = {
  async getCustomers(
    orgId: string,
    configId: string,
    params: {
      page?: number
      pageSize?: number
      search?: string
    } = {}
  ): Promise<InstitutionCustomerListResponse> {
    const { data } = await apiClient.get<InstitutionCustomerListResponse>(
      `${configUrl(orgId, configId)}/customers`,
      {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 25,
          search: params.search
        }
      }
    )
    return data
  },

  async getTimeline(
    orgId: string,
    configId: string,
    params: {
      page?: number
      pageSize?: number
      filters?: InstitutionTimelineFilters
    } = {}
  ): Promise<InstitutionTimelineResponse> {
    const { data } = await apiClient.get<InstitutionTimelineResponse>(
      `${configUrl(orgId, configId)}/timeline`,
      {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 50,
          start_date: params.filters?.start_date,
          end_date: params.filters?.end_date,
          sender_type: params.filters?.sender_type,
          user_phone: params.filters?.user_phone,
          search: params.filters?.search
        }
      }
    )
    return data
  },

  async getConversation(
    orgId: string,
    configId: string,
    conversationId: string,
    params: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<InstitutionConversation> {
    const { data } = await apiClient.get<InstitutionConversation>(
      `${configUrl(orgId, configId)}/conversations/${conversationId}`,
      {
        params: {
          limit: params.limit || 50,
          offset: params.offset || 0
        }
      }
    )
    return data
  },

  async getStats(orgId: string, configId: string): Promise<InstitutionConversationStats> {
    const { data } = await apiClient.get<InstitutionConversationStats>(
      `${configUrl(orgId, configId)}/stats`
    )
    return data
  }
}
