import apiClient from './index'
import type { AgentKnowledge, AvailableAgentsResponse } from '@/types/document.types'

export interface AgentKnowledgeUploadParams {
  title?: string
  documentType: string
  category?: string
  tags?: string
}

export interface AgentKnowledgeSearchParams {
  query: string
  maxResults?: number
  minSimilarity?: number
}

export interface AgentKnowledgeSearchResult {
  id: string
  title: string
  content: string
  similarity_score: number
  document_type: string
  category?: string
}

export interface AgentKnowledgeStats {
  total_documents: number
  active_documents: number
  documents_with_embedding: number
}

export const agentKnowledgeApi = {
  /**
   * Get list of available agents from ENABLED_AGENTS setting
   */
  async getAvailableAgents(): Promise<AvailableAgentsResponse> {
    const { data } = await apiClient.get<AvailableAgentsResponse>('/admin/agents/available')
    return data
  },

  /**
   * List knowledge documents for a specific agent
   */
  async list(
    agentKey: string,
    params: { activeOnly?: boolean; limit?: number } = {}
  ): Promise<AgentKnowledge[]> {
    const { data } = await apiClient.get<AgentKnowledge[]>(
      `/admin/agents/${agentKey}/knowledge`,
      { params: { active_only: params.activeOnly, limit: params.limit } }
    )
    return data
  },

  /**
   * Get a specific knowledge document
   */
  async getById(agentKey: string, docId: string): Promise<AgentKnowledge> {
    const { data } = await apiClient.get<AgentKnowledge>(
      `/admin/agents/${agentKey}/knowledge/${docId}`
    )
    return data
  },

  /**
   * Create a new text knowledge document
   */
  async create(
    agentKey: string,
    docData: {
      title: string
      content: string
      document_type: string
      category?: string
      tags?: string[]
    }
  ): Promise<AgentKnowledge> {
    const { data } = await apiClient.post<AgentKnowledge>(
      `/admin/agents/${agentKey}/knowledge`,
      docData
    )
    return data
  },

  /**
   * Upload a document file (PDF, DOCX, TXT, MD) to agent's knowledge base
   */
  async uploadDocument(
    agentKey: string,
    file: File,
    metadata: AgentKnowledgeUploadParams
  ): Promise<AgentKnowledge> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', metadata.documentType)
    if (metadata.title) formData.append('title', metadata.title)
    if (metadata.category) formData.append('category', metadata.category)
    if (metadata.tags) formData.append('tags', metadata.tags)

    const { data } = await apiClient.post<AgentKnowledge>(
      `/admin/agents/${agentKey}/knowledge/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60s for file uploads
      }
    )
    return data
  },

  /**
   * Search agent's knowledge base semantically
   */
  async search(
    agentKey: string,
    params: AgentKnowledgeSearchParams
  ): Promise<{ results: AgentKnowledgeSearchResult[]; total_results: number }> {
    const { data } = await apiClient.post(
      `/admin/agents/${agentKey}/knowledge/search`,
      {
        query: params.query,
        max_results: params.maxResults || 10,
        min_similarity: params.minSimilarity || 0.5
      }
    )
    return data
  },

  /**
   * Get statistics for agent's knowledge base
   */
  async getStats(agentKey: string): Promise<AgentKnowledgeStats> {
    const { data } = await apiClient.get<AgentKnowledgeStats>(
      `/admin/agents/${agentKey}/knowledge/stats`
    )
    return data
  },

  /**
   * Delete a knowledge document (soft or hard delete)
   */
  async delete(
    agentKey: string,
    docId: string,
    hardDelete = false
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete(
      `/admin/agents/${agentKey}/knowledge/${docId}`,
      { params: { hard_delete: hardDelete } }
    )
    return data
  },

  /**
   * Regenerate embedding for a document
   */
  async regenerateEmbedding(
    agentKey: string,
    docId: string
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post(
      `/admin/agents/${agentKey}/knowledge/${docId}/embedding`
    )
    return data
  }
}

export default agentKnowledgeApi
