import apiClient from './index'
import type {
  YamlPrompt,
  CreateYamlRequest,
  UpdateYamlRequest,
  YamlListParams,
  PaginatedYamlResponse,
  PromptVersion,
  LockResponse,
  ValidationResult,
  TestResult,
  TestData,
  PreviewRequest,
  PreviewResponse,
  ImportResult,
  ExportOptions,
  YamlAnalytics
} from '@/types/yaml.types'

class YamlApi {
  private readonly basePath = '/admin/prompts'

  // CRUD Operations
  async list(params: YamlListParams = {}): Promise<PaginatedYamlResponse> {
    // Note: Backend expects trailing slash for list endpoint
    const response = await apiClient.get(`${this.basePath}/`, { params })
    return response.data
  }

  async getByKey(key: string): Promise<YamlPrompt> {
    const response = await apiClient.get(`${this.basePath}/${key}`)
    return response.data
  }

  async create(prompt: CreateYamlRequest): Promise<YamlPrompt> {
    // Note: Backend expects trailing slash for create endpoint
    const response = await apiClient.post(`${this.basePath}/`, prompt)
    return response.data
  }

  async update(key: string, updateData: UpdateYamlRequest): Promise<YamlPrompt> {
    const response = await apiClient.put(`${this.basePath}/${key}`, updateData)
    return response.data
  }

  async delete(key: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${key}`)
  }

  async toggleActive(key: string, active: boolean): Promise<YamlPrompt> {
    const response = await apiClient.patch(`${this.basePath}/${key}/toggle`, { active })
    return response.data
  }

  // Version Management
  async getVersionHistory(key: string): Promise<PromptVersion[]> {
    const response = await apiClient.get(`${this.basePath}/${key}/versions`)
    return response.data
  }

  async rollback(key: string, versionId: string): Promise<YamlPrompt> {
    const response = await apiClient.post(`${this.basePath}/${key}/rollback`, { version_id: versionId })
    return response.data
  }

  async createVersion(key: string, description?: string): Promise<PromptVersion> {
    const response = await apiClient.post(`${this.basePath}/${key}/versions`, { description })
    return response.data
  }

  // Lock Management
  async lock(key: string): Promise<LockResponse> {
    const response = await apiClient.post(`${this.basePath}/${key}/lock`)
    return response.data
  }

  async unlock(key: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${key}/lock`)
  }

  async getLockStatus(key: string): Promise<LockResponse> {
    const response = await apiClient.get(`${this.basePath}/${key}/lock/status`)
    return response.data
  }

  async extendLock(key: string): Promise<LockResponse> {
    const response = await apiClient.post(`${this.basePath}/${key}/lock/extend`)
    return response.data
  }

  // Validation and Testing
  async validateTemplate(template: string): Promise<ValidationResult> {
    const response = await apiClient.post(`${this.basePath}/validate`, { template })
    return response.data
  }

  async previewTemplate(request: PreviewRequest): Promise<PreviewResponse> {
    const response = await apiClient.post(`${this.basePath}/preview`, request)
    return response.data
  }

  async testPrompt(key: string, testData: TestData): Promise<TestResult> {
    const response = await apiClient.post(`${this.basePath}/${key}/test`, testData)
    return response.data
  }

  // Bulk Operations
  async batchUpdate(updates: Array<{ key: string; data: UpdateYamlRequest }>): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post(`${this.basePath}/batch`, { updates })
    return response.data
  }

  async batchDelete(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.delete(`${this.basePath}/batch`, { data: { keys } })
    return response.data
  }

  async batchToggle(keys: string[], active: boolean): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post(`${this.basePath}/batch/toggle`, { keys, active })
    return response.data
  }

  // Search and Analytics
  async search(query: string, filters: Partial<YamlListParams> = {}): Promise<YamlPrompt[]> {
    const response = await apiClient.get(`${this.basePath}/search`, {
      params: { q: query, ...filters }
    })
    return response.data
  }

  async getAnalytics(): Promise<YamlAnalytics> {
    const response = await apiClient.get(`${this.basePath}/analytics`)
    return response.data
  }

  // Export/Import Operations
  async exportPrompts(options: ExportOptions): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/export`, {
      params: options,
      responseType: 'blob'
    })
    return response.data
  }

  async importPrompts(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post(`${this.basePath}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // Template and File Operations
  async reloadFromFilesystem(): Promise<{ reloaded_count: number; errors: string[] }> {
    const response = await apiClient.post(`${this.basePath}/reload`)
    return response.data
  }

  async getFilesystemStructure(): Promise<{
    domains: string[]
    templates: Array<{
      key: string
      file_path: string
      modified_at: string
    }>
  }> {
    const response = await apiClient.get(`${this.basePath}/filesystem`)
    return response.data
  }

  // Domain and Category Management
  async getDomains(): Promise<Array<{
    key: string
    name: string
    count: number
    last_modified: string
  }>> {
    const response = await apiClient.get(`${this.basePath}/domains`)
    return response.data
  }

  async getDomainPrompts(domain: string): Promise<YamlPrompt[]> {
    const response = await apiClient.get(`${this.basePath}/domains/${domain}`)
    return response.data
  }

  // Model and Template Suggestions
  async getAvailableModels(): Promise<Array<{
    id: string
    name: string
    max_tokens: number
    supports_functions: boolean
  }>> {
    const response = await apiClient.get(`${this.basePath}/models`)
    return response.data
  }

  async getTemplateSuggestions(domain?: string): Promise<Array<{
    key: string
    name: string
    description: string
    variables: string[]
  }>> {
    const response = await apiClient.get(`${this.basePath}/suggestions`, {
      params: { domain }
    })
    return response.data
  }

  // Collaboration and Change Tracking
  async getChangeHistory(key: string, limit = 50): Promise<Array<{
    id: string
    version: string
    changed_by: string
    changed_at: string
    changes: string[]
    rollback_available: boolean
  }>> {
    const response = await apiClient.get(`${this.basePath}/${key}/history`, {
      params: { limit }
    })
    return response.data
  }

  async compareVersions(key: string, fromVersion: string, toVersion: string): Promise<{
    diff: string
    summary: string
    changes: Array<{
      type: 'added' | 'removed' | 'modified'
      line: number
      content: string
    }>
  }> {
    const response = await apiClient.get(`${this.basePath}/${key}/compare`, {
      params: { from: fromVersion, to: toVersion }
    })
    return response.data
  }

  // Health and Status
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    total_prompts: number
    active_locks: number
    last_sync: string
    version_mismatches: string[]
  }> {
    const response = await apiClient.get(`${this.basePath}/status`)
    return response.data
  }
}

export const yamlApi = new YamlApi()
export default yamlApi