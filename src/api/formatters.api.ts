import apiClient from './index'
import type {
  YamlFormatter,
  CreateFormatterRequest,
  UpdateFormatterRequest,
  FormatterListParams,
  PaginatedFormatterResponse,
  FormatterAnalytics,
  FormatterTestRequest,
  FormatterTestResult
} from '@/types/yaml.types'

/**
 * FormattersApi - API client for WhatsApp interactive message templates (formatters).
 *
 * Formatters are templates for WhatsApp interactive messages with:
 * - response_type: text, buttons, or list
 * - body_template: message body with {variables}
 * - buttons: interactive buttons with dynamic titles
 * - awaiting_input: expected user input field
 */
class FormattersApi {
  private readonly basePath = '/admin/formatters'

  // CRUD Operations
  async list(params: FormatterListParams = {}): Promise<PaginatedFormatterResponse> {
    const response = await apiClient.get(`${this.basePath}/`, { params })
    return response.data
  }

  async getByKey(key: string): Promise<YamlFormatter> {
    const response = await apiClient.get(`${this.basePath}/${key}`)
    return response.data
  }

  async create(formatter: CreateFormatterRequest): Promise<YamlFormatter> {
    const response = await apiClient.post(`${this.basePath}/`, formatter)
    return response.data
  }

  async update(key: string, updateData: UpdateFormatterRequest): Promise<YamlFormatter> {
    const response = await apiClient.put(`${this.basePath}/${key}`, updateData)
    return response.data
  }

  async delete(key: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${key}`)
  }

  // Testing - renders template with provided variables
  async testFormatter(key: string, testData: FormatterTestRequest): Promise<FormatterTestResult> {
    const response = await apiClient.post(`${this.basePath}/${key}/test`, testData)
    return response.data
  }

  // Analytics
  async getAnalytics(): Promise<FormatterAnalytics> {
    const response = await apiClient.get(`${this.basePath}/analytics`)
    return response.data
  }

  // System Operations
  async getSystemStats(): Promise<{
    cache_stats: Record<string, any>
    system_info: {
      version: string
      manager_status: string
      cache_enabled: boolean
    }
  }> {
    const response = await apiClient.get(`${this.basePath}/system/stats`)
    return response.data
  }

  async clearCache(): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/cache/clear`)
    return response.data
  }
}

export const formattersApi = new FormattersApi()
export default formattersApi
