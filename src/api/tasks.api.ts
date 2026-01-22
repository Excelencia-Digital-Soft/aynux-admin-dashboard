import apiClient from './index'
import type {
  YamlTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskListParams,
  PaginatedTaskResponse,
  TaskAnalytics,
  TaskTestRequest,
  TaskTestResult
} from '@/types/yaml.types'

/**
 * TasksApi - API client for chatbot text templates (tasks).
 *
 * Tasks are simpler than prompts - they don't have LLM parameters
 * (temperature, max_tokens, model). They are text templates with
 * {variables} for rendering responses.
 */
class TasksApi {
  private readonly basePath = '/admin/tasks'

  // CRUD Operations
  async list(params: TaskListParams = {}): Promise<PaginatedTaskResponse> {
    const response = await apiClient.get(`${this.basePath}/`, { params })
    return response.data
  }

  async getByKey(key: string): Promise<YamlTask> {
    const response = await apiClient.get(`${this.basePath}/${key}`)
    return response.data
  }

  async create(task: CreateTaskRequest): Promise<YamlTask> {
    const response = await apiClient.post(`${this.basePath}/`, task)
    return response.data
  }

  async update(key: string, updateData: UpdateTaskRequest): Promise<YamlTask> {
    const response = await apiClient.put(`${this.basePath}/${key}`, updateData)
    return response.data
  }

  async delete(key: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${key}`)
  }

  // Testing - renders template without LLM call
  async testTask(key: string, testData: TaskTestRequest): Promise<TaskTestResult> {
    const response = await apiClient.post(`${this.basePath}/${key}/test`, testData)
    return response.data
  }

  // Analytics
  async getAnalytics(): Promise<TaskAnalytics> {
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

export const tasksApi = new TasksApi()
export default tasksApi
