import { ref, computed, onMounted } from 'vue'
import { agentApi } from '@/api/agent.api'
import { useToast } from '@/composables/useToast'
import type { AgentConfigResponse } from '@/types/agent.types'

/**
 * Composable for managing agent configuration display.
 * Extracts logic from AgentConfigPage for better testability.
 */

export interface UseAgentConfigOptions {
  autoFetch?: boolean
}

// Agent icons mapping
const agentIcons: Record<string, string> = {
  greeting_agent: 'pi-comments',
  support_agent: 'pi-headphones',
  fallback_agent: 'pi-question-circle',
  farewell_agent: 'pi-sign-out',
  excelencia_agent: 'pi-star',
  excelencia_invoice_agent: 'pi-file',
  excelencia_promotions_agent: 'pi-megaphone',
  data_insights_agent: 'pi-chart-bar'
}

// Agent descriptions
const agentDescriptions: Record<string, string> = {
  greeting_agent: 'Maneja saludos y bienvenida inicial',
  support_agent: 'Proporciona soporte y ayuda general',
  fallback_agent: 'Responde cuando no hay agente específico',
  farewell_agent: 'Maneja despedidas y cierre de conversación',
  excelencia_agent: 'Agente principal de Excelencia',
  excelencia_invoice_agent: 'Consultas de facturas y pagos',
  excelencia_promotions_agent: 'Información de promociones',
  data_insights_agent: 'Análisis de datos e insights'
}

export function useAgentConfig(options: UseAgentConfigOptions = {}) {
  const { autoFetch = true } = options

  const toast = useToast()

  // State
  const config = ref<AgentConfigResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const agentCount = computed(() => config.value?.enabled_agents?.length ?? 0)
  const isSystemInitialized = computed(() => config.value?.system_initialized ?? false)
  const enabledAgents = computed(() => config.value?.enabled_agents ?? [])

  /**
   * Format agent ID to display name.
   * Removes '_agent' suffix, replaces underscores with spaces, capitalizes words.
   */
  function formatAgentName(agentId: string): string {
    return agentId
      .replace(/_agent$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  /**
   * Get icon class for an agent.
   * Returns fallback icon if agent not in mapping.
   */
  function getAgentIcon(agentId: string): string {
    return agentIcons[agentId] || 'pi-android'
  }

  /**
   * Get description for an agent.
   * Returns generic description if agent not in mapping.
   */
  function getAgentDescription(agentId: string): string {
    return agentDescriptions[agentId] || 'Agente del sistema'
  }

  /**
   * Fetch agent configuration from API.
   */
  async function fetchConfig(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      config.value = await agentApi.getConfig()
      if (config.value) {
        toast.success('Configuración cargada')
      }
    } catch (err) {
      error.value = 'Error al cargar configuración'
      toast.error('Error al cargar configuración')
      console.error('Failed to fetch agent config:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh configuration from API.
   */
  async function refresh(): Promise<void> {
    await fetchConfig()
  }

  // Auto-fetch on mount if enabled
  if (autoFetch) {
    onMounted(fetchConfig)
  }

  return {
    // State
    config,
    isLoading,
    error,
    // Computed
    agentCount,
    isSystemInitialized,
    enabledAgents,
    // Utilities
    formatAgentName,
    getAgentIcon,
    getAgentDescription,
    // Actions
    fetchConfig,
    refresh
  }
}

export default useAgentConfig
