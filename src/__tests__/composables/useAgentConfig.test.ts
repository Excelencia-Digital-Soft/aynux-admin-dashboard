import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentConfig } from '@/composables/useAgentConfig'

// Mock the agent API
vi.mock('@/api/agent.api', () => ({
  agentApi: {
    getConfig: vi.fn()
  }
}))

// Mock the toast composable
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    clear: vi.fn()
  })
}))

import { agentApi } from '@/api/agent.api'

describe('useAgentConfig', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const { config, isLoading, error, agentCount } = useAgentConfig({ autoFetch: false })

      expect(config.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(agentCount.value).toBe(0)
    })
  })

  describe('fetchConfig', () => {
    it('should fetch agent configuration successfully', async () => {
      const mockConfig = {
        enabled_agents: ['greeting_agent', 'support_agent', 'fallback_agent'],
        system_initialized: true
      }
      vi.mocked(agentApi.getConfig).mockResolvedValue(mockConfig)

      const { fetchConfig, config, isLoading, agentCount, isSystemInitialized } = useAgentConfig({
        autoFetch: false
      })

      expect(isLoading.value).toBe(false)

      const fetchPromise = fetchConfig()
      expect(isLoading.value).toBe(true)

      await fetchPromise

      expect(isLoading.value).toBe(false)
      expect(config.value).toEqual(mockConfig)
      expect(agentCount.value).toBe(3)
      expect(isSystemInitialized.value).toBe(true)
    })

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(agentApi.getConfig).mockRejectedValue(new Error('API Error'))

      const { fetchConfig, config, isLoading, error } = useAgentConfig({ autoFetch: false })

      await fetchConfig()

      expect(isLoading.value).toBe(false)
      expect(config.value).toBeNull()
      expect(error.value).toBe('Error al cargar configuración')
    })

    it('should handle null response from API', async () => {
      vi.mocked(agentApi.getConfig).mockResolvedValue(null)

      const { fetchConfig, config, agentCount } = useAgentConfig({ autoFetch: false })

      await fetchConfig()

      expect(config.value).toBeNull()
      expect(agentCount.value).toBe(0)
    })
  })

  describe('computed properties', () => {
    it('enabledAgents should return empty array when config is null', () => {
      const { enabledAgents } = useAgentConfig({ autoFetch: false })

      expect(enabledAgents.value).toEqual([])
    })

    it('enabledAgents should return agents list when config exists', async () => {
      const mockConfig = {
        enabled_agents: ['greeting_agent', 'support_agent'],
        system_initialized: true
      }
      vi.mocked(agentApi.getConfig).mockResolvedValue(mockConfig)

      const { fetchConfig, enabledAgents } = useAgentConfig({ autoFetch: false })

      await fetchConfig()

      expect(enabledAgents.value).toEqual(['greeting_agent', 'support_agent'])
    })

    it('isSystemInitialized should reflect system status', async () => {
      const mockConfig = {
        enabled_agents: [],
        system_initialized: false
      }
      vi.mocked(agentApi.getConfig).mockResolvedValue(mockConfig)

      const { fetchConfig, isSystemInitialized } = useAgentConfig({ autoFetch: false })

      expect(isSystemInitialized.value).toBe(false)

      await fetchConfig()

      expect(isSystemInitialized.value).toBe(false)
    })
  })

  describe('formatAgentName', () => {
    it('should format agent names correctly', () => {
      const { formatAgentName } = useAgentConfig({ autoFetch: false })

      expect(formatAgentName('greeting_agent')).toBe('Greeting')
      expect(formatAgentName('support_agent')).toBe('Support')
      expect(formatAgentName('excelencia_invoice_agent')).toBe('Excelencia Invoice')
      expect(formatAgentName('data_insights_agent')).toBe('Data Insights')
    })

    it('should handle edge cases', () => {
      const { formatAgentName } = useAgentConfig({ autoFetch: false })

      expect(formatAgentName('simple')).toBe('Simple')
      expect(formatAgentName('agent')).toBe('Agent')
      expect(formatAgentName('_agent')).toBe('')
    })
  })

  describe('getAgentIcon', () => {
    it('should return correct icon for known agents', () => {
      const { getAgentIcon } = useAgentConfig({ autoFetch: false })

      expect(getAgentIcon('greeting_agent')).toBe('pi-comments')
      expect(getAgentIcon('support_agent')).toBe('pi-headphones')
      expect(getAgentIcon('fallback_agent')).toBe('pi-question-circle')
      expect(getAgentIcon('farewell_agent')).toBe('pi-sign-out')
      expect(getAgentIcon('excelencia_agent')).toBe('pi-star')
      expect(getAgentIcon('excelencia_invoice_agent')).toBe('pi-file')
      expect(getAgentIcon('excelencia_promotions_agent')).toBe('pi-megaphone')
      expect(getAgentIcon('data_insights_agent')).toBe('pi-chart-bar')
    })

    it('should return fallback icon for unknown agents', () => {
      const { getAgentIcon } = useAgentConfig({ autoFetch: false })

      expect(getAgentIcon('unknown_agent')).toBe('pi-android')
      expect(getAgentIcon('custom_agent')).toBe('pi-android')
    })
  })

  describe('getAgentDescription', () => {
    it('should return correct description for known agents', () => {
      const { getAgentDescription } = useAgentConfig({ autoFetch: false })

      expect(getAgentDescription('greeting_agent')).toBe('Maneja saludos y bienvenida inicial')
      expect(getAgentDescription('support_agent')).toBe('Proporciona soporte y ayuda general')
      expect(getAgentDescription('fallback_agent')).toBe('Responde cuando no hay agente específico')
    })

    it('should return fallback description for unknown agents', () => {
      const { getAgentDescription } = useAgentConfig({ autoFetch: false })

      expect(getAgentDescription('unknown_agent')).toBe('Agente del sistema')
      expect(getAgentDescription('custom_agent')).toBe('Agente del sistema')
    })
  })

  describe('refresh', () => {
    it('should call fetchConfig', async () => {
      const mockConfig = {
        enabled_agents: ['greeting_agent'],
        system_initialized: true
      }
      vi.mocked(agentApi.getConfig).mockResolvedValue(mockConfig)

      const { refresh, config } = useAgentConfig({ autoFetch: false })

      await refresh()

      expect(agentApi.getConfig).toHaveBeenCalledTimes(1)
      expect(config.value).toEqual(mockConfig)
    })
  })
})
