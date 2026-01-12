import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock vue-router
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  }),
  useRoute: () => ({
    query: {}
  })
}))

// Mock useKnowledge
vi.mock('@/composables/useKnowledge', () => ({
  useKnowledge: () => ({
    fetchDocuments: vi.fn()
  })
}))

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    currentOrganization: { id: 'org-123', name: 'Test Org' }
  })
}))

// Mock agent knowledge API
vi.mock('@/api/agentKnowledge.api', () => ({
  agentKnowledgeApi: {
    getAvailableAgents: vi.fn()
  }
}))

import { useKnowledgeBasePage } from '@/composables/useKnowledgeBasePage'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'

describe('useKnowledgeBasePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const {
        activeTab,
        selectedSource,
        selectedAgentKey,
        availableAgents,
        loadingAgents,
        showAgentSelector
      } = useKnowledgeBasePage({ syncUrl: false, autoFetchAgents: false })

      expect(activeTab.value).toBe('0')
      expect(selectedSource.value).toBe('all')
      expect(selectedAgentKey.value).toBe('')
      expect(availableAgents.value).toEqual([])
      expect(loadingAgents.value).toBe(false)
      expect(showAgentSelector.value).toBe(false)
    })

    it('should compute currentOrgId from auth store', () => {
      const { currentOrgId } = useKnowledgeBasePage({ syncUrl: false, autoFetchAgents: false })

      expect(currentOrgId.value).toBe('org-123')
    })
  })

  describe('fetchAgents', () => {
    it('should fetch available agents', async () => {
      vi.mocked(agentKnowledgeApi.getAvailableAgents).mockResolvedValue({
        agents: ['greeting_agent', 'support_agent']
      })

      const { fetchAgents, availableAgents, loadingAgents } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      expect(loadingAgents.value).toBe(false)

      const fetchPromise = fetchAgents()
      expect(loadingAgents.value).toBe(true)

      await fetchPromise

      expect(loadingAgents.value).toBe(false)
      expect(availableAgents.value).toEqual([
        { value: 'greeting_agent', label: 'Greeting Agent' },
        { value: 'support_agent', label: 'Support Agent' }
      ])
    })

    it('should not refetch if agents already loaded', async () => {
      vi.mocked(agentKnowledgeApi.getAvailableAgents).mockResolvedValue({
        agents: ['greeting_agent']
      })

      const { fetchAgents, availableAgents } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      await fetchAgents()
      await fetchAgents() // Second call

      expect(agentKnowledgeApi.getAvailableAgents).toHaveBeenCalledTimes(1)
    })

    it('should force refetch when force=true', async () => {
      vi.mocked(agentKnowledgeApi.getAvailableAgents).mockResolvedValue({
        agents: ['greeting_agent']
      })

      const { fetchAgents } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      await fetchAgents()
      await fetchAgents(true) // Force refetch

      expect(agentKnowledgeApi.getAvailableAgents).toHaveBeenCalledTimes(2)
    })

    it('should handle fetch errors', async () => {
      vi.mocked(agentKnowledgeApi.getAvailableAgents).mockRejectedValue(new Error('API Error'))

      const { fetchAgents, availableAgents, loadingAgents, error } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      await fetchAgents()

      expect(loadingAgents.value).toBe(false)
      expect(availableAgents.value).toEqual([])
      expect(error.value).toBe('Error al cargar agentes')
    })
  })

  describe('formatAgentLabel', () => {
    it('should format agent labels correctly', () => {
      const { formatAgentLabel } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      expect(formatAgentLabel('greeting_agent')).toBe('Greeting Agent')
      expect(formatAgentLabel('support_agent')).toBe('Support Agent')
      expect(formatAgentLabel('excelencia_invoice_agent')).toBe('Excelencia Invoice Agent')
    })
  })

  describe('showAgentSelector', () => {
    it('should be true when source is agent', () => {
      const { selectedSource, showAgentSelector } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      expect(showAgentSelector.value).toBe(false)

      selectedSource.value = 'agent'

      expect(showAgentSelector.value).toBe(true)
    })
  })

  describe('handleSearchSelect', () => {
    it('should switch to browse tab', () => {
      const { handleSearchSelect, activeTab } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      activeTab.value = '1' // Search tab

      handleSearchSelect('doc-123')

      expect(activeTab.value).toBe('0') // Browse tab
    })
  })

  describe('handleSelectAgentFromDashboard', () => {
    it('should set source, agent, and switch to browse tab', () => {
      const { handleSelectAgentFromDashboard, selectedSource, selectedAgentKey, activeTab } =
        useKnowledgeBasePage({
          syncUrl: false,
          autoFetchAgents: false
        })

      activeTab.value = '2' // Dashboard tab

      handleSelectAgentFromDashboard('support_agent')

      expect(selectedSource.value).toBe('agent')
      expect(selectedAgentKey.value).toBe('support_agent')
      expect(activeTab.value).toBe('0')
    })
  })

  describe('goToUpload', () => {
    it('should navigate to upload page', () => {
      const { goToUpload } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      goToUpload()

      expect(mockPush).toHaveBeenCalledWith('/upload-documents')
    })
  })

  describe('resetFilters', () => {
    it('should reset source and agent to defaults', () => {
      const { resetFilters, selectedSource, selectedAgentKey } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      selectedSource.value = 'agent'
      selectedAgentKey.value = 'support_agent'

      resetFilters()

      expect(selectedSource.value).toBe('all')
      expect(selectedAgentKey.value).toBe('')
    })
  })

  describe('hasAgents computed', () => {
    it('should be true when agents are loaded', async () => {
      vi.mocked(agentKnowledgeApi.getAvailableAgents).mockResolvedValue({
        agents: ['greeting_agent']
      })

      const { fetchAgents, hasAgents } = useKnowledgeBasePage({
        syncUrl: false,
        autoFetchAgents: false
      })

      expect(hasAgents.value).toBe(false)

      await fetchAgents()

      expect(hasAgents.value).toBe(true)
    })
  })
})
