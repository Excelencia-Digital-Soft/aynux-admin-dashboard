import apiClient from './index'
import type {
  Document,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  SearchResult,
  SearchRequest,
  KnowledgeListResponse,
  KnowledgeStats,
  BatchResult
} from '@/types/document.types'

const KNOWLEDGE_ADMIN_URL = '/admin/knowledge'
const DOCUMENT_UPLOAD_URL = '/admin/documents'

export const knowledgeApi = {
  /**
   * Get paginated list of knowledge documents
   */
  async list(params: {
    documentType?: string
    category?: string
    activeOnly?: boolean
    page?: number
    pageSize?: number
  } = {}): Promise<KnowledgeListResponse> {
    const queryParams: Record<string, string | number | boolean> = {
      page: params.page || 1,
      page_size: params.pageSize || 25
    }
    if (params.documentType) queryParams.document_type = params.documentType
    if (params.category) queryParams.category = params.category
    if (params.activeOnly !== undefined) queryParams.active_only = params.activeOnly

    const { data } = await apiClient.get<KnowledgeListResponse>(KNOWLEDGE_ADMIN_URL, {
      params: queryParams
    })
    return data
  },

  /**
   * Get single document by ID
   */
  async getById(id: string): Promise<Document> {
    const { data } = await apiClient.get<Document>(`${KNOWLEDGE_ADMIN_URL}/${id}`)
    return data
  },

  /**
   * Create new document (text upload)
   */
  async create(documentData: DocumentCreateRequest): Promise<Document> {
    const { data } = await apiClient.post<Document>(
      `${DOCUMENT_UPLOAD_URL}/upload/text`,
      documentData
    )
    return data
  },

  /**
   * Update existing document
   */
  async update(
    id: string,
    updateData: DocumentUpdateRequest,
    regenerateEmbedding = true
  ): Promise<Document> {
    const { data } = await apiClient.put<Document>(
      `${KNOWLEDGE_ADMIN_URL}/${id}`,
      updateData,
      { params: { regenerate_embedding: regenerateEmbedding } }
    )
    return data
  },

  /**
   * Delete document (soft or hard delete)
   */
  async delete(id: string, hardDelete = false): Promise<void> {
    await apiClient.delete(`${KNOWLEDGE_ADMIN_URL}/${id}`, {
      params: { hard_delete: hardDelete }
    })
  },

  /**
   * Semantic search in knowledge base
   */
  async search(params: SearchRequest): Promise<SearchResult[]> {
    const { data } = await apiClient.post<{ results: SearchResult[] }>(
      `${KNOWLEDGE_ADMIN_URL}/search`,
      params
    )
    return data.results || []
  },

  /**
   * Regenerate embedding for a document
   */
  async regenerateEmbedding(id: string): Promise<void> {
    await apiClient.post(`${KNOWLEDGE_ADMIN_URL}/${id}/regenerate-embedding`)
  },

  /**
   * Sync all embeddings
   */
  async syncAllEmbeddings(): Promise<{ synced: number; failed: number }> {
    const { data } = await apiClient.post<{ synced: number; failed: number }>(
      `${KNOWLEDGE_ADMIN_URL}/sync-all`,
      {},
      { timeout: 300000 } // 5 minutes timeout
    )
    return data
  },

  /**
   * Get knowledge base statistics
   */
  async getStats(): Promise<KnowledgeStats> {
    const { data } = await apiClient.get<KnowledgeStats>(`${KNOWLEDGE_ADMIN_URL}/stats`)
    return data
  },

  /**
   * Upload PDF file
   */
  async uploadPdf(
    file: File,
    metadata: {
      title?: string
      documentType: string
      category?: string
      tags?: string
    }
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', metadata.documentType)
    if (metadata.title) formData.append('title', metadata.title)
    if (metadata.category) formData.append('category', metadata.category)
    if (metadata.tags) formData.append('tags', metadata.tags)

    const { data } = await apiClient.post<Document>(
      `${DOCUMENT_UPLOAD_URL}/upload/pdf`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      }
    )
    return data
  },

  /**
   * Batch update documents
   */
  async batchUpdate(
    docIds: string[],
    updateData: Partial<DocumentUpdateRequest>
  ): Promise<BatchResult> {
    const { data } = await apiClient.put<BatchResult>(
      `${KNOWLEDGE_ADMIN_URL}/batch-update`,
      { doc_ids: docIds, update_data: updateData }
    )
    return data
  },

  /**
   * Batch delete documents
   */
  async batchDelete(docIds: string[], hardDelete = false): Promise<BatchResult> {
    const { data } = await apiClient.delete<BatchResult>(
      `${KNOWLEDGE_ADMIN_URL}/batch-delete`,
      { data: { doc_ids: docIds, hard_delete: hardDelete } }
    )
    return data
  },

  /**
   * Batch regenerate embeddings
   */
  async batchRegenerateEmbeddings(docIds: string[]): Promise<BatchResult> {
    const { data } = await apiClient.post<BatchResult>(
      `${KNOWLEDGE_ADMIN_URL}/batch-regenerate-embeddings`,
      { doc_ids: docIds },
      { timeout: 120000 }
    )
    return data
  }
}

export default knowledgeApi
