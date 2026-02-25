import apiClient from './index'
import type {
  PharmacyConfig,
  PharmacyConfigCreateRequest,
  PharmacyConfigUpdateRequest,
  PharmacyConfigListResponse,
  PharmacyCustomerListResponse,
  PharmacyTimelineResponse,
  PharmacyTimelineFilters,
  PharmacyConversation,
  PharmacyStats,
  BulkDeleteResponse,
  SummarizeEvent
} from '@/types/pharmacyConfig.types'

const PHARMACY_CONFIG_URL = '/admin/pharmacy-config'

export const pharmacyConfigApi = {
  // ============ Pharmacy Config CRUD ============

  /**
   * List pharmacy configurations accessible by current user
   */
  async list(params: {
    page?: number
    pageSize?: number
    search?: string
    mpEnabled?: boolean
    organizationId?: string
  } = {}): Promise<PharmacyConfigListResponse> {
    const { data } = await apiClient.get<PharmacyConfigListResponse>(PHARMACY_CONFIG_URL, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 25,
        search: params.search,
        mp_enabled: params.mpEnabled,
        organization_id: params.organizationId
      }
    })
    return data
  },

  /**
   * Get single pharmacy configuration by ID
   */
  async getById(pharmacyId: string): Promise<PharmacyConfig> {
    const { data } = await apiClient.get<PharmacyConfig>(`${PHARMACY_CONFIG_URL}/${pharmacyId}`)
    return data
  },

  /**
   * Create new pharmacy configuration
   */
  async create(pharmacyData: PharmacyConfigCreateRequest): Promise<PharmacyConfig> {
    const { data } = await apiClient.post<PharmacyConfig>(PHARMACY_CONFIG_URL, pharmacyData)
    return data
  },

  /**
   * Update pharmacy configuration (partial update)
   */
  async update(
    pharmacyId: string,
    updateData: PharmacyConfigUpdateRequest
  ): Promise<PharmacyConfig> {
    const { data } = await apiClient.patch<PharmacyConfig>(
      `${PHARMACY_CONFIG_URL}/${pharmacyId}`,
      updateData
    )
    return data
  },

  /**
   * Delete pharmacy configuration
   */
  async delete(pharmacyId: string): Promise<void> {
    await apiClient.delete(`${PHARMACY_CONFIG_URL}/${pharmacyId}`)
  },

  // ============ Conversation History ============

  /**
   * Get customers who contacted the pharmacy
   */
  async getCustomers(
    pharmacyId: string,
    params: {
      page?: number
      pageSize?: number
      search?: string
    } = {}
  ): Promise<PharmacyCustomerListResponse> {
    const { data } = await apiClient.get<PharmacyCustomerListResponse>(
      `${PHARMACY_CONFIG_URL}/${pharmacyId}/customers`,
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

  /**
   * Get message timeline for a pharmacy
   */
  async getTimeline(
    pharmacyId: string,
    params: {
      page?: number
      pageSize?: number
      filters?: PharmacyTimelineFilters
    } = {}
  ): Promise<PharmacyTimelineResponse> {
    const { data } = await apiClient.get<PharmacyTimelineResponse>(
      `${PHARMACY_CONFIG_URL}/${pharmacyId}/timeline`,
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

  /**
   * Get full conversation thread for a customer
   */
  async getConversation(
    pharmacyId: string,
    conversationId: string,
    params: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<PharmacyConversation> {
    const { data } = await apiClient.get<PharmacyConversation>(
      `${PHARMACY_CONFIG_URL}/${pharmacyId}/conversations/${conversationId}`,
      {
        params: {
          limit: params.limit || 50,
          offset: params.offset || 0
        }
      }
    )
    return data
  },

  /**
   * Get pharmacy statistics
   */
  async getStats(pharmacyId: string): Promise<PharmacyStats> {
    const { data } = await apiClient.get<PharmacyStats>(
      `${PHARMACY_CONFIG_URL}/${pharmacyId}/stats`
    )
    return data
  },

  async deleteConversations(
    pharmacyId: string,
    conversationIds: string[]
  ): Promise<BulkDeleteResponse> {
    const { data } = await apiClient.delete<BulkDeleteResponse>(
      `${PHARMACY_CONFIG_URL}/${pharmacyId}/conversations`,
      { data: { conversation_ids: conversationIds } }
    )
    return data
  },

  async summarizeStream(
    pharmacyId: string,
    conversationIds: string[],
    onEvent: (event: SummarizeEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${apiClient.defaults.baseURL}${PHARMACY_CONFIG_URL}/${pharmacyId}/summarize-stream?conversation_ids=${conversationIds.join(',')}`

    const authData = localStorage.getItem('auth')
    const token = authData ? JSON.parse(authData).accessToken : null

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data) as SummarizeEvent
          onEvent(parsed)

          if (parsed.type === 'done') return
        } catch {
          console.error('Failed to parse SSE event:', data)
        }
      }
    }
  }
}

export default pharmacyConfigApi
