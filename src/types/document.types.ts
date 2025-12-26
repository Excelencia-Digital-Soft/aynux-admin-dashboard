export interface Document {
  id: string
  title: string
  content: string
  document_type: string
  category?: string
  tags?: string[]
  meta_data?: Record<string, unknown>
  active: boolean
  has_embedding: boolean
  embedding_model?: string
  created_at: string
  updated_at: string
}

export interface DocumentCreateRequest {
  title: string
  content: string
  document_type: string
  category?: string
  tags?: string[]
  meta_data?: Record<string, unknown>
}

export interface DocumentUpdateRequest {
  title?: string
  content?: string
  document_type?: string
  category?: string
  tags?: string[]
  meta_data?: Record<string, unknown>
  active?: boolean
}

export interface SearchResult {
  id: string
  title: string
  content: string
  document_type: string
  category?: string
  similarity: number
  snippet?: string
}

export interface SearchRequest {
  query: string
  max_results?: number
  document_type?: string
  category?: string
}

export interface KnowledgeListResponse {
  documents: Document[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface KnowledgeStats {
  total_documents: number
  total_active: number
  total_inactive: number
  documents_by_type: Record<string, number>
  documents_with_embedding: number
  documents_without_embedding: number
}

export interface BatchResult {
  success: boolean
  processed: number
  failed: number
  errors?: string[]
}

export type DocumentContext = 'global' | 'tenant'

// Embedding staleness status
export type EmbeddingStatus = 'fresh' | 'stale' | 'missing'

// Upload Destination Types
export type UploadDestination = 'global' | 'tenant' | 'agent'

export interface UploadDestinationOption {
  value: UploadDestination
  label: string
  icon: string
  description: string
  requiresOrg?: boolean
  requiresAgent?: boolean
}

// Agent Knowledge Types
export interface AgentKnowledge {
  id: string
  agent_key: string
  title: string
  content?: string
  content_preview?: string
  document_type: string
  category?: string
  tags?: string[]
  meta_data?: Record<string, unknown>
  has_embedding: boolean
  embedding_status: EmbeddingStatus
  embedding_updated_at?: string
  active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface AgentKnowledgeCreateRequest {
  title: string
  content: string
  document_type: string
  category?: string
  tags?: string[]
}

export interface AvailableAgentsResponse {
  agents: string[]
  total: number
}

export interface DocumentTypeConfig {
  label: string
  labelEs: string
  icon: string
  description: string
  global: boolean
  tenant: boolean
}

export interface DocumentFilter {
  documentType?: string
  category?: string
  activeOnly?: boolean
  page: number
  pageSize: number
}

// RAG Analytics Types
export interface RagQueryLog {
  id: string
  query: string
  context_used: string[]
  response: string
  token_count: number
  latency_ms: number
  relevance_score?: number
  user_feedback?: 'positive' | 'negative' | null
  created_at: string
}

export interface RagMetrics {
  total_queries: number
  avg_latency_ms: number
  avg_token_count: number
  avg_relevance_score: number
  positive_feedback_rate: number
  queries_by_day: Record<string, number>
  queries_by_hour: Record<string, number>
  top_document_types: Array<{ type: string; count: number }>
  latency_distribution: Array<{ range: string; count: number }>
}

export interface EmbeddingStats {
  total_documents: number
  with_embedding: number
  without_embedding: number
  embedding_models: Record<string, number>
  avg_embedding_size: number
  last_sync_at?: string
}

export interface BatchUploadItem {
  file?: File
  title: string
  content?: string
  document_type: string
  category?: string
  tags?: string[]
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

export interface BatchEditOperation {
  doc_ids: string[]
  operation: 'update' | 'delete' | 'activate' | 'deactivate' | 'regenerate_embedding'
  update_data?: Partial<DocumentUpdateRequest>
}
