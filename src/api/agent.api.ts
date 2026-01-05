import api from './index'
import type {
  AgentConfigResponse,
  AgentModuleUpdateRequest,
  AgentSettingsUpdateRequest,
  SoftwareModule,
  SoftwareModuleCreateRequest,
  SoftwareModuleUpdateRequest,
  ModuleFilters
} from '@/types/agent.types'
import { adaptModules, adaptModule } from '@/adapters/moduleAdapter'

// Agent Configuration API
export const agentApi = {
  // Get agent configuration
  async getConfig(): Promise<AgentConfigResponse | null> {
    try {
      const response = await api.get('/admin/agents/config')
      return response.data
    } catch (error) {
      console.error('Failed to fetch agent config:', error)
      return null
    }
  },

  // Update agent modules
  async updateModules(
    modules: Record<string, AgentModuleUpdateRequest>,
    createBackup = true
  ): Promise<AgentConfigResponse | null> {
    try {
      const response = await api.patch('/admin/agents/modules', modules, {
        params: { create_backup: createBackup }
      })
      return response.data
    } catch (error) {
      console.error('Failed to update agent modules:', error)
      throw error
    }
  },

  // Update agent settings
  async updateSettings(settings: AgentSettingsUpdateRequest): Promise<AgentConfigResponse | null> {
    try {
      const response = await api.patch('/admin/agents/settings', settings)
      return response.data
    } catch (error) {
      console.error('Failed to update agent settings:', error)
      throw error
    }
  },

  // Get agent status
  async getStatus(): Promise<Record<string, unknown> | null> {
    try {
      const response = await api.get('/admin/agents/status')
      return response.data
    } catch (error) {
      console.error('Failed to fetch agent status:', error)
      return null
    }
  },

  // Get enabled agents
  async getEnabledAgents(): Promise<string[]> {
    try {
      const response = await api.get('/admin/agents/enabled')
      return response.data
    } catch (error) {
      console.error('Failed to fetch enabled agents:', error)
      return []
    }
  }
}

// Software Catalog API (Excelencia modules)
export const catalogApi = {
  // Get all modules
  async getModules(filters?: ModuleFilters): Promise<SoftwareModule[]> {
    try {
      const params: Record<string, string> = {}
      if (filters?.category) params.category = filters.category
      if (filters?.status) params.status = filters.status
      if (filters?.search) params.search = filters.search

      const response = await api.get('/admin/modules', { params })
      return adaptModules(response.data)
    } catch (error) {
      console.error('Failed to fetch modules:', error)
      return []
    }
  },

  // Get single module
  async getModule(moduleId: string): Promise<SoftwareModule | null> {
    try {
      const response = await api.get(`/admin/modules/${moduleId}`)
      return adaptModule(response.data)
    } catch (error) {
      console.error('Failed to fetch module:', error)
      return null
    }
  },

  // Create module
  async createModule(data: SoftwareModuleCreateRequest): Promise<SoftwareModule | null> {
    try {
      const response = await api.post('/admin/modules', data)
      return response.data
    } catch (error) {
      console.error('Failed to create module:', error)
      throw error
    }
  },

  // Update module
  async updateModule(
    moduleId: string,
    data: SoftwareModuleUpdateRequest
  ): Promise<SoftwareModule | null> {
    try {
      const response = await api.put(`/admin/modules/${moduleId}`, data)
      return response.data
    } catch (error) {
      console.error('Failed to update module:', error)
      throw error
    }
  },

  // Delete module (soft or hard)
  async deleteModule(moduleId: string, hardDelete = false): Promise<boolean> {
    try {
      await api.delete(`/admin/modules/${moduleId}`, {
        params: { hard_delete: hardDelete }
      })
      return true
    } catch (error) {
      console.error('Failed to delete module:', error)
      throw error
    }
  }
}
