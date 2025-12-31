import apiClient from './index'
import type {
  ChattigoCredential,
  ChattigoCredentialCreateRequest,
  ChattigoCredentialUpdateRequest,
  ChattigoTestResponse,
  ChattigoCacheStats
} from '@/types/chattigoCredentials.types'

const CHATTIGO_CREDENTIALS_URL = '/admin/chattigo-credentials'

export const chattigoCredentialsApi = {
  // ============ Credentials CRUD ============

  /**
   * List all Chattigo credentials (optional org filter)
   */
  async list(orgId?: string): Promise<ChattigoCredential[]> {
    const params = orgId ? { organization_id: orgId } : {}
    const { data } = await apiClient.get<{ credentials: ChattigoCredential[]; total: number }>(
      CHATTIGO_CREDENTIALS_URL,
      { params }
    )
    return data.credentials
  },

  /**
   * Get single credential by DID
   */
  async getByDid(did: string): Promise<ChattigoCredential> {
    const { data } = await apiClient.get<ChattigoCredential>(`${CHATTIGO_CREDENTIALS_URL}/${did}`)
    return data
  },

  /**
   * Create new Chattigo credentials
   */
  async create(createData: ChattigoCredentialCreateRequest): Promise<ChattigoCredential> {
    const { data } = await apiClient.post<ChattigoCredential>(
      CHATTIGO_CREDENTIALS_URL,
      createData
    )
    return data
  },

  /**
   * Update Chattigo credentials (partial update)
   */
  async update(
    did: string,
    updateData: ChattigoCredentialUpdateRequest
  ): Promise<ChattigoCredential> {
    const { data } = await apiClient.put<ChattigoCredential>(
      `${CHATTIGO_CREDENTIALS_URL}/${did}`,
      updateData
    )
    return data
  },

  /**
   * Delete Chattigo credentials
   */
  async delete(did: string): Promise<void> {
    await apiClient.delete(`${CHATTIGO_CREDENTIALS_URL}/${did}`)
  },

  // ============ Test & Cache ============

  /**
   * Test authentication for credentials
   */
  async test(did: string): Promise<ChattigoTestResponse> {
    const { data } = await apiClient.post<ChattigoTestResponse>(
      `${CHATTIGO_CREDENTIALS_URL}/${did}/test`
    )
    return data
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<ChattigoCacheStats> {
    const { data } = await apiClient.get<ChattigoCacheStats>(
      `${CHATTIGO_CREDENTIALS_URL}/cache/stats`
    )
    return data
  },

  /**
   * Invalidate token cache for a DID
   */
  async invalidateCache(did: string): Promise<void> {
    await apiClient.post(`${CHATTIGO_CREDENTIALS_URL}/cache/invalidate/${did}`)
  }
}

export default chattigoCredentialsApi
