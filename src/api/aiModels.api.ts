import apiClient from './index'

export interface AIModel {
  id: string
  model_id: string
  provider: 'vllm' | 'openai' | 'anthropic' | 'deepseek' | 'kimi' | 'groq'
  model_type: 'llm' | 'embedding'
  display_name: string
  description: string | null
  family: string | null
  parameter_size: string | null
  quantization_level: string | null
  context_window: number | null
  max_output_tokens: number | null
  supports_streaming: boolean
  supports_functions: boolean
  supports_vision: boolean
  is_enabled: boolean
  is_default: boolean
  sort_order: number
  capabilities: Record<string, unknown>
  sync_source: string
  last_synced_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AIModelSelectOption {
  value: string
  label: string
  provider: string | null
  family: string | null
  parameter_size: string | null
  supports_functions: boolean
  supports_vision: boolean
  max_tokens: number | null
  is_default: boolean
}

export interface AIModelListResponse {
  models: AIModel[]
  total: number
  enabled_count: number
  disabled_count: number
}

export interface SeedResult {
  added: number
  skipped: number
}

export interface AIModelCreate {
  model_id: string
  provider: string
  model_type?: string
  display_name: string
  description?: string
  family?: string
  parameter_size?: string
  context_window?: number
  max_output_tokens?: number
  supports_streaming?: boolean
  supports_functions?: boolean
  supports_vision?: boolean
  is_enabled?: boolean
  sort_order?: number
}

export interface AIModelUpdate {
  display_name?: string
  description?: string
  context_window?: number
  max_output_tokens?: number
  supports_functions?: boolean
  supports_vision?: boolean
  is_enabled?: boolean
  is_default?: boolean
  sort_order?: number
}

export interface AIModelFilters {
  provider?: string
  model_type?: string
  enabled_only?: boolean
}

class AIModelsApi {
  private readonly basePath = '/admin/ai-models'

  /**
   * List all AI models with optional filtering (admin view).
   */
  async list(filters: AIModelFilters = {}): Promise<AIModelListResponse> {
    const response = await apiClient.get(this.basePath, { params: filters })
    return response.data
  }

  /**
   * Get a single AI model by ID.
   */
  async getById(id: string): Promise<AIModel> {
    const response = await apiClient.get(`${this.basePath}/${id}`)
    return response.data
  }

  /**
   * Create a new AI model.
   */
  async create(data: AIModelCreate): Promise<AIModel> {
    const response = await apiClient.post(this.basePath, data)
    return response.data
  }

  /**
   * Update an existing AI model.
   */
  async update(id: string, data: AIModelUpdate): Promise<AIModel> {
    const response = await apiClient.put(`${this.basePath}/${id}`, data)
    return response.data
  }

  /**
   * Delete an AI model.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`)
  }

  /**
   * Toggle model enabled status.
   */
  async toggle(id: string): Promise<AIModel> {
    const response = await apiClient.post(`${this.basePath}/${id}/toggle`)
    return response.data
  }

  /**
   * Seed external provider models.
   */
  async seedExternal(): Promise<SeedResult> {
    const response = await apiClient.post(`${this.basePath}/seed/external`)
    return response.data
  }

  /**
   * Get enabled models for UI select components.
   * This is the endpoint used by YamlEditor and YamlTestDialog.
   */
  async getSelectOptions(modelType: 'llm' | 'embedding' = 'llm'): Promise<AIModelSelectOption[]> {
    const response = await apiClient.get(`${this.basePath}/select-options`, {
      params: { model_type: modelType }
    })
    return response.data
  }

  /**
   * Bulk enable models.
   */
  async bulkEnable(modelIds: string[]): Promise<{ updated: number }> {
    const response = await apiClient.post(`${this.basePath}/bulk/enable`, {
      model_ids: modelIds
    })
    return response.data
  }

  /**
   * Bulk disable models.
   */
  async bulkDisable(modelIds: string[]): Promise<{ updated: number }> {
    const response = await apiClient.post(`${this.basePath}/bulk/disable`, {
      model_ids: modelIds
    })
    return response.data
  }

  /**
   * Update sort order for multiple models.
   */
  async updateSortOrder(orders: Array<{ id: string; sort_order: number }>): Promise<{ updated: number }> {
    const response = await apiClient.post(`${this.basePath}/bulk/sort-order`, {
      orders
    })
    return response.data
  }
}

export const aiModelsApi = new AIModelsApi()
export default aiModelsApi
