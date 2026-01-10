import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useKnowledge } from '@/composables/useKnowledge'
import { useAuthStore } from '@/stores/auth.store'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'

/**
 * Composable for KnowledgeBasePage specific logic.
 * Wraps useKnowledge and adds page-specific functionality.
 */

export interface UseKnowledgeBasePageOptions {
  syncUrl?: boolean
  autoFetchAgents?: boolean
}

export interface AgentOption {
  value: string
  label: string
}

export function useKnowledgeBasePage(options: UseKnowledgeBasePageOptions = {}) {
  const { syncUrl = true, autoFetchAgents = true } = options

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const { fetchDocuments } = useKnowledge()

  // State
  const activeTab = ref('0')
  const selectedSource = ref((route.query.source as string) || 'all')
  const selectedAgentKey = ref((route.query.agent as string) || '')
  const availableAgents = ref<AgentOption[]>([])
  const loadingAgents = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentOrgId = computed(() => authStore.currentOrganization?.id || '')
  const showAgentSelector = computed(() => selectedSource.value === 'agent')
  const hasAgents = computed(() => availableAgents.value.length > 0)

  /**
   * Format agent key to display label.
   * Replaces underscores with spaces and capitalizes words.
   */
  function formatAgentLabel(agentKey: string): string {
    return agentKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  /**
   * Fetch available agents from API.
   */
  async function fetchAgents(force = false): Promise<void> {
    if (availableAgents.value.length > 0 && !force) return

    loadingAgents.value = true
    error.value = null
    try {
      const response = await agentKnowledgeApi.getAvailableAgents()
      availableAgents.value = response.agents.map((agentKey) => ({
        value: agentKey,
        label: formatAgentLabel(agentKey)
      }))
    } catch (err) {
      error.value = 'Error al cargar agentes'
      console.error('Error fetching agents:', err)
    } finally {
      loadingAgents.value = false
    }
  }

  /**
   * Handle document selection from search.
   */
  function handleSearchSelect(docId: string): void {
    activeTab.value = '0'
  }

  /**
   * Handle agent selection from dashboard.
   */
  function handleSelectAgentFromDashboard(agentKey: string): void {
    selectedSource.value = 'agent'
    selectedAgentKey.value = agentKey
    activeTab.value = '0'
  }

  /**
   * Navigate to upload page.
   */
  function goToUpload(): void {
    router.push('/upload-documents')
  }

  /**
   * Reset filters to defaults.
   */
  function resetFilters(): void {
    selectedSource.value = 'all'
    selectedAgentKey.value = ''
  }

  // Sync filter changes to URL
  if (syncUrl) {
    watch([selectedSource, selectedAgentKey], ([source, agent]) => {
      const query: Record<string, string> = {}
      if (source && source !== 'all') query.source = source
      if (agent) query.agent = agent
      router.replace({ query })
    })
  }

  // Watch for source changes to fetch agents
  watch(selectedSource, (newSource) => {
    if (newSource === 'agent' && autoFetchAgents) {
      fetchAgents()
    } else {
      selectedAgentKey.value = ''
    }
  })

  // Initialize on mount
  onMounted(() => {
    fetchDocuments()
    if (selectedSource.value === 'agent' && autoFetchAgents) {
      fetchAgents()
    }
  })

  return {
    // State
    activeTab,
    selectedSource,
    selectedAgentKey,
    availableAgents,
    loadingAgents,
    error,
    // Computed
    currentOrgId,
    showAgentSelector,
    hasAgents,
    // Utilities
    formatAgentLabel,
    // Actions
    fetchAgents,
    handleSearchSelect,
    handleSelectAgentFromDashboard,
    goToUpload,
    resetFilters
  }
}

export default useKnowledgeBasePage
