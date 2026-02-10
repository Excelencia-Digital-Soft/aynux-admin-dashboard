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

export interface EnavTestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  responseType?: 'text' | 'buttons' | 'list' | 'document' | 'image'
  buttons?: InteractiveButton[]
  listItems?: InteractiveListItem[]
  documentUrl?: string
  documentCaption?: string
  imageUrl?: string
  imageCaption?: string
  metadata?: Record<string, unknown>
}

export interface EnavWebhookConfig {
  enabled: boolean
  phoneNumber: string
  userName: string
  did: string | null
  simulateBypass: boolean
  organizationId: string | null
}

const DEFAULT_PHONE = '5493446405060'
const DEFAULT_USER = 'Test Vinatero'
const STORAGE_KEY = 'enav-webhook-config'

export function useEnavTesting() {
  const toast = useToast()

  // State
  const isLoading = ref(false)
  const isSending = ref(false)
  const sessionId = ref<string | null>(null)
  const messages = ref<EnavTestMessage[]>([])
  const inputMessage = ref('')
  const executionSteps = ref<ExecutionStep[]>([])
  const graphState = ref<unknown | null>(null)

  // Webhook Config
  const webhookConfig = ref<EnavWebhookConfig>({
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

    // Add user message
    const userMessage: EnavTestMessage = {
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
        business_domain: 'enav',
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
      // Remove user message on error
      messages.value.pop()
    } finally {
      isSending.value = false
    }
  }

  function handleResponse(response: WebhookSimulationResponse): void {
    // Update session ID
    if (response.session_id) {
      sessionId.value = response.session_id
    }

    // Store execution steps
    if (response.execution_steps) {
      executionSteps.value = response.execution_steps
    }

    // Store graph state if available
    if (response.debug_info?.graph_state) {
      graphState.value = response.debug_info.graph_state
    }

    // Create assistant message
    const assistantMessage: EnavTestMessage = {
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
        domain: 'enav',
        processing_time_ms: response.metadata?.processing_time_ms,
        ...response.debug_info,
        ...response.metadata
      }
    }

    // Check for document in metadata
    if (response.metadata?.document_url) {
      assistantMessage.responseType = 'document'
      assistantMessage.documentUrl = response.metadata.document_url as string
      assistantMessage.documentCaption = response.metadata.document_caption as string
    }

    // Check for image in metadata
    if (response.response_type === 'image' && response.metadata?.image_url) {
      assistantMessage.responseType = 'image'
      assistantMessage.imageUrl = response.metadata.image_url as string
      assistantMessage.imageCaption = response.metadata.image_caption as string
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

  function updateWebhookConfig(updates: Partial<EnavWebhookConfig>): void {
    webhookConfig.value = { ...webhookConfig.value, ...updates }
  }

  function setQuickMessage(message: string): void {
    inputMessage.value = message
  }

  function copyChat(): void {
    const text = messages.value
      .map((msg) => {
        const time = formatTime(msg.timestamp)
        const prefix = msg.role === 'user' ? 'Usuario' : 'Bot'
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
      } catch (e) {
        console.warn('Failed to parse enav webhook config')
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
    // State
    isLoading,
    isSending,
    sessionId,
    messages,
    inputMessage,
    executionSteps,
    graphState,
    webhookConfig,

    // Computed
    hasSession,
    messageCount,

    // Actions
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
