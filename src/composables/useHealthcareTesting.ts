import { ref, computed, watch, onMounted } from 'vue'
import { chatApi } from '@/api/chat.api'
import { useToast } from '@/composables/useToast'
import type {
  WebhookSimulationRequest,
  WebhookSimulationResponse,
  ExecutionStep,
  InteractiveButton,
  InteractiveListItem
} from '@/types/chat.types'

export interface HealthcareTestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  responseType?: 'text' | 'buttons' | 'list'
  buttons?: InteractiveButton[]
  listItems?: InteractiveListItem[]
  metadata?: Record<string, unknown>
}

export interface HealthcareWebhookConfig {
  enabled: boolean
  phoneNumber: string
  userName: string
  did: string | null
  simulateBypass: boolean
  organizationId: string | null
}

const DEFAULT_PHONE = '5493446405060'
const DEFAULT_USER = 'Test Paciente'
const STORAGE_KEY = 'healthcare-webhook-config'

export function useHealthcareTesting() {
  const toast = useToast()

  // State
  const isSending = ref(false)
  const sessionId = ref<string | null>(null)
  const messages = ref<HealthcareTestMessage[]>([])
  const inputMessage = ref('')
  const executionSteps = ref<ExecutionStep[]>([])
  const graphState = ref<unknown | null>(null)

  // Webhook Config
  const webhookConfig = ref<HealthcareWebhookConfig>({
    enabled: true,
    phoneNumber: DEFAULT_PHONE,
    userName: DEFAULT_USER,
    did: null,
    simulateBypass: false,
    organizationId: null
  })

  // Computed
  const hasSession = computed(() => !!sessionId.value)
  const messageCount = computed(() => messages.value.length)

  // Actions
  async function sendMessage(): Promise<void> {
    if (!inputMessage.value.trim()) return

    isSending.value = true

    const userMessage: HealthcareTestMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.value,
      timestamp: new Date().toISOString()
    }
    messages.value.push(userMessage)

    const messageText = inputMessage.value
    inputMessage.value = ''

    try {
      const request: WebhookSimulationRequest = {
        message: messageText,
        phone_number: webhookConfig.value.phoneNumber,
        user_name: webhookConfig.value.userName,
        business_domain: 'healthcare',
        session_id: sessionId.value || undefined,
        debug: true,
        did: webhookConfig.value.did || undefined,
        simulate_bypass: webhookConfig.value.simulateBypass,
        organization_id: webhookConfig.value.organizationId || undefined
      }

      const response = await chatApi.testWebhookSimulation(request)
      handleResponse(response)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Error al enviar mensaje')
      messages.value.pop()
    } finally {
      isSending.value = false
    }
  }

  function handleResponse(response: WebhookSimulationResponse): void {
    if (response.session_id) {
      sessionId.value = response.session_id
    }

    if (response.execution_steps) {
      executionSteps.value = response.execution_steps
    }

    if (response.debug_info?.graph_state) {
      graphState.value = response.debug_info.graph_state
    }

    const assistantMessage: HealthcareTestMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.response,
      timestamp: new Date().toISOString(),
      responseType: response.response_type || 'text',
      buttons: response.response_buttons,
      listItems: response.response_list_items,
      metadata: {
        agent_used: response.agent_used,
        bypass_matched: response.debug_info?.bypass_matched,
        domain: 'healthcare',
        processing_time_ms: response.metadata?.processing_time_ms,
        ...response.debug_info,
        ...response.metadata
      }
    }

    messages.value.push(assistantMessage)
  }

  async function sendButtonResponse(button: InteractiveButton): Promise<void> {
    inputMessage.value = button.titulo
    await sendMessage()
  }

  async function sendListResponse(item: InteractiveListItem): Promise<void> {
    inputMessage.value = item.titulo
    await sendMessage()
  }

  function clearSession(): void {
    sessionId.value = null
    messages.value = []
    executionSteps.value = []
    graphState.value = null
    inputMessage.value = ''
    toast.info('Sesion limpiada')
  }

  function updateWebhookConfig(updates: Partial<HealthcareWebhookConfig>): void {
    webhookConfig.value = { ...webhookConfig.value, ...updates }
  }

  function setQuickMessage(message: string): void {
    inputMessage.value = message
  }

  function copyChat(): void {
    const text = messages.value
      .map((msg) => {
        const time = formatTime(msg.timestamp)
        const prefix = msg.role === 'user' ? 'Paciente' : 'Bot'
        return `[${time}] ${prefix}: ${msg.content}`
      })
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      toast.info('Chat copiado al portapapeles')
    })
  }

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Load config from localStorage on mount
  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        webhookConfig.value = { ...webhookConfig.value, ...parsed }
      } catch {
        console.warn('Failed to parse healthcare webhook config')
      }
    }
  })

  // Persist config to localStorage
  watch(
    webhookConfig,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    },
    { deep: true }
  )

  return {
    isSending,
    sessionId,
    messages,
    inputMessage,
    executionSteps,
    graphState,
    webhookConfig,
    hasSession,
    messageCount,
    sendMessage,
    sendButtonResponse,
    sendListResponse,
    clearSession,
    updateWebhookConfig,
    setQuickMessage,
    copyChat,
    formatTime
  }
}
