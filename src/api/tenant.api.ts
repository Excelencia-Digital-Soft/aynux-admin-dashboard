import apiClient from './index'
import type {
  TenantConfig,
  TenantConfigUpdateRequest,
  TenantDocument,
  TenantDocumentCreateRequest,
  TenantDocumentUpdateRequest,
  TenantDocumentStats
} from '@/types/organization.types'

const TENANT_URL = '/admin/tenant'

export const tenantApi = {
  // ============ Configuration ============

  /**
   * Get tenant configuration
   */
  async getConfig(orgId: string): Promise<TenantConfig> {
    const { data } = await apiClient.get<TenantConfig>(`${TENANT_URL}/${orgId}/config`)
    return data
  },

  /**
   * Update tenant configuration
   */
  async updateConfig(
    orgId: string,
    configData: TenantConfigUpdateRequest
  ): Promise<TenantConfig> {
    const { data } = await apiClient.put<TenantConfig>(
      `${TENANT_URL}/${orgId}/config`,
      configData
    )
    return data
  },

  /**
   * Reset tenant configuration to defaults
   */
  async resetConfig(orgId: string): Promise<TenantConfig> {
    const { data } = await apiClient.post<TenantConfig>(
      `${TENANT_URL}/${orgId}/config/reset`
    )
    return data
  },

  /**
   * Generate new API key
   */
  async regenerateApiKey(orgId: string): Promise<{ api_key: string }> {
    const { data } = await apiClient.post<{ api_key: string }>(
      `${TENANT_URL}/${orgId}/config/regenerate-api-key`
    )
    return data
  },

  /**
   * Test webhook configuration
   */
  async testWebhook(orgId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `${TENANT_URL}/${orgId}/config/test-webhook`
    )
    return data
  },

  // ============ Documents ============

  /**
   * Get tenant documents
   */
  async getDocuments(orgId: string, params: {
    page?: number
    pageSize?: number
    documentType?: string
    category?: string
    activeOnly?: boolean
    search?: string
  } = {}): Promise<{ documents: TenantDocument[]; total: number }> {
    const { data } = await apiClient.get(`${TENANT_URL}/${orgId}/documents`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 25,
        document_type: params.documentType,
        category: params.category,
        active_only: params.activeOnly,
        search: params.search
      }
    })
    return data
  },

  /**
   * Get single document
   */
  async getDocument(orgId: string, docId: string): Promise<TenantDocument> {
    const { data } = await apiClient.get<TenantDocument>(
      `${TENANT_URL}/${orgId}/documents/${docId}`
    )
    return data
  },

  /**
   * Create tenant document
   */
  async createDocument(
    orgId: string,
    docData: TenantDocumentCreateRequest
  ): Promise<TenantDocument> {
    const { data } = await apiClient.post<TenantDocument>(
      `${TENANT_URL}/${orgId}/documents`,
      docData
    )
    return data
  },

  /**
   * Update tenant document
   */
  async updateDocument(
    orgId: string,
    docId: string,
    updateData: TenantDocumentUpdateRequest
  ): Promise<TenantDocument> {
    const { data } = await apiClient.put<TenantDocument>(
      `${TENANT_URL}/${orgId}/documents/${docId}`,
      updateData
    )
    return data
  },

  /**
   * Delete tenant document
   */
  async deleteDocument(orgId: string, docId: string, hardDelete = false): Promise<void> {
    await apiClient.delete(`${TENANT_URL}/${orgId}/documents/${docId}`, {
      params: { hard_delete: hardDelete }
    })
  },

  /**
   * Regenerate document embedding
   */
  async regenerateEmbedding(orgId: string, docId: string): Promise<void> {
    await apiClient.post(`${TENANT_URL}/${orgId}/documents/${docId}/regenerate-embedding`)
  },

  /**
   * Batch update documents
   */
  async batchUpdateDocuments(
    orgId: string,
    docIds: string[],
    updateData: Partial<TenantDocumentUpdateRequest>
  ): Promise<{ processed: number; failed: number }> {
    const { data } = await apiClient.put(
      `${TENANT_URL}/${orgId}/documents/batch`,
      { doc_ids: docIds, update_data: updateData }
    )
    return data
  },

  /**
   * Sync all tenant embeddings
   */
  async syncAllEmbeddings(orgId: string): Promise<{ synced: number; failed: number }> {
    const { data } = await apiClient.post(
      `${TENANT_URL}/${orgId}/documents/sync-embeddings`,
      {},
      { timeout: 300000 }
    )
    return data
  },

  /**
   * Get document statistics
   */
  async getDocumentStats(orgId: string): Promise<TenantDocumentStats> {
    const { data } = await apiClient.get<TenantDocumentStats>(
      `${TENANT_URL}/${orgId}/documents/stats`
    )
    return data
  },

  /**
   * Search tenant documents
   */
  async searchDocuments(orgId: string, params: {
    query: string
    maxResults?: number
    documentType?: string
  }): Promise<Array<{
    id: string
    title: string
    content: string
    similarity: number
  }>> {
    const { data } = await apiClient.post(
      `${TENANT_URL}/${orgId}/documents/search`,
      params
    )
    return data.results
  },

  /**
   * Upload document file (PDF)
   */
  async uploadDocument(
    orgId: string,
    file: File,
    metadata: {
      documentType: string
      category?: string
      tags?: string
    }
  ): Promise<TenantDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', metadata.documentType)
    if (metadata.category) formData.append('category', metadata.category)
    if (metadata.tags) formData.append('tags', metadata.tags)

    const { data } = await apiClient.post<TenantDocument>(
      `${TENANT_URL}/${orgId}/documents/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      }
    )
    return data
  },

  /**
   * Get available document types for tenant
   */
  async getDocumentTypes(orgId: string): Promise<Array<{ value: string; label: string }>> {
    const { data } = await apiClient.get(`${TENANT_URL}/${orgId}/document-types`)
    return data.types
  }
}

export default tenantApi
