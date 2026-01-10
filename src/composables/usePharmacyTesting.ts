import { ref, computed, watch, onMounted } from 'vue'
import { pharmacyApi } from '@/api/pharmacy.api'
import type {
  Pharmacy,
  PharmacyTestMessage,
  PharmacyWebhookConfig,
  ConversationContext,
  ConversationMessage
} from '@/api/pharmacy.api'
import { useToast } from '@/composables/useToast'

/**
 * Composable for pharmacy testing page.
 * Manages chat, session, webhook config, and conversation history.
 */

export interface UsePharmacyTestingOptions {
  defaultPhone?: string
  persistConfig?: boolean
  storageKey?: string
}

const DEFAULT_PHONE = '2645631000'
const STORAGE_KEY = 'pharmacy-webhook-config'

export function usePharmacyTesting(options: UsePharmacyTestingOptions = {}) {
  const {
    defaultPhone = DEFAULT_PHONE,
    persistConfig = true,
    storageKey = STORAGE_KEY
  } = options

  const toast = useToast()

  // Core state
  const isLoading = ref(false)
  const isSending = ref(false)
  const pharmacies = ref<Pharmacy[]>([])
  const selectedPharmacy = ref<Pharmacy | null>(null)
  const sessionId = ref<string | null>(null)
  const messages = ref<PharmacyTestMessage[]>([])
  const inputMessage = ref('')
  const executionSteps = ref<unknown[]>([])
  const graphState = ref<unknown | null>(null)

  // Webhook config
  const webhookConfig = ref<PharmacyWebhookConfig>({
    enabled: false,
    phoneNumber: defaultPhone,
    userName: 'Pharmacy Tester',
    did: null,
    simulateBypass: false,
    organizationId: null,
    pharmacyId: null
  })

  // History state
  const conversationHistory = ref<ConversationContext[]>([])
  const historyMessages = ref<ConversationMessage[]>([])
  const selectedConversation = ref<ConversationContext | null>(null)
  const isLoadingHistory = ref(false)
  const isDeletingHistory = ref(false)
  const showDeleteConfirm = ref(false)

  // Computed
  const hasSession = computed(() => !!sessionId.value)
  const hasPharmacies = computed(() => pharmacies.value.length > 0)
  const canSendMessage = computed(
    () => !!inputMessage.value.trim() && !!selectedPharmacy.value && !isSending.value
  )

  /**
   * Fetch available pharmacies.
   */
  async function fetchPharmacies(): Promise<void> {
    isLoading.value = true
    try {
      pharmacies.value = await pharmacyApi.getPharmacies()
      if (pharmacies.value.length > 0 && !selectedPharmacy.value) {
        selectedPharmacy.value = pharmacies.value[0]
      }
    } catch (err) {
      toast.error('Error al cargar farmacias')
      console.error('Error fetching pharmacies:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send a test message.
   */
  async function sendMessage(): Promise<void> {
    if (!inputMessage.value.trim() || !selectedPharmacy.value) return

    const userMessage: PharmacyTestMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.value,
      timestamp: new Date().toISOString()
    }

    messages.value.push(userMessage)
    const messageText = inputMessage.value
    inputMessage.value = ''

    isSending.value = true
    try {
      const response = await pharmacyApi.sendTestMessage({
        pharmacy_id: selectedPharmacy.value.id,
        message: messageText,
        session_id: sessionId.value || undefined,
        phone_number: webhookConfig.value.phoneNumber
      })

      if (response) {
        sessionId.value = response.session_id

        const assistantMessage: PharmacyTestMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          metadata: response.metadata
        }

        messages.value.push(assistantMessage)

        if (response.execution_steps) {
          executionSteps.value = response.execution_steps
        }
        if (response.graph_state) {
          graphState.value = response.graph_state
        }
      }
    } catch (err) {
      toast.error('Error al enviar mensaje')
      messages.value.pop() // Remove user message on error
      console.error('Error sending message:', err)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Clear current session.
   */
  async function clearSession(): Promise<void> {
    if (sessionId.value) {
      try {
        await pharmacyApi.clearSession(sessionId.value)
      } catch (err) {
        console.error('Error clearing session:', err)
      }
    }
    sessionId.value = null
    messages.value = []
    executionSteps.value = []
    graphState.value = null
    toast.info('Sesión reiniciada')
  }

  /**
   * Set quick message.
   */
  function setQuickMessage(message: string): void {
    inputMessage.value = message
  }

  /**
   * Format timestamp for display.
   */
  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format datetime for display.
   */
  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // History functions
  async function fetchHistory(): Promise<void> {
    if (!webhookConfig.value.phoneNumber) {
      toast.warn('Selecciona un teléfono primero')
      return
    }
    isLoadingHistory.value = true
    try {
      conversationHistory.value = await pharmacyApi.getConversationsByPhone(
        webhookConfig.value.phoneNumber
      )
      if (conversationHistory.value.length === 0) {
        toast.info('No hay historial para este teléfono')
      }
    } catch (err) {
      toast.error('Error al cargar historial')
      console.error('Error fetching history:', err)
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function selectConversation(conv: ConversationContext): Promise<void> {
    selectedConversation.value = conv
    isLoadingHistory.value = true
    try {
      historyMessages.value = await pharmacyApi.getConversationMessages(conv.conversation_id)
    } catch (err) {
      toast.error('Error al cargar mensajes')
      console.error('Error loading conversation messages:', err)
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function deleteConversation(conv: ConversationContext): Promise<void> {
    try {
      const success = await pharmacyApi.deleteConversation(conv.conversation_id)
      if (success) {
        conversationHistory.value = conversationHistory.value.filter(
          (c) => c.conversation_id !== conv.conversation_id
        )
        if (selectedConversation.value?.conversation_id === conv.conversation_id) {
          selectedConversation.value = null
          historyMessages.value = []
        }
        toast.success('Conversación eliminada')
      } else {
        toast.error('Error al eliminar conversación')
      }
    } catch (err) {
      toast.error('Error al eliminar conversación')
      console.error('Error deleting conversation:', err)
    }
  }

  async function deleteAllHistory(): Promise<void> {
    isDeletingHistory.value = true
    try {
      for (const conv of conversationHistory.value) {
        await pharmacyApi.deleteConversation(conv.conversation_id)
      }
      conversationHistory.value = []
      historyMessages.value = []
      selectedConversation.value = null
      toast.success('Historial eliminado completamente')
    } catch (err) {
      toast.error('Error al eliminar historial')
      console.error('Error deleting all history:', err)
    } finally {
      isDeletingHistory.value = false
      showDeleteConfirm.value = false
    }
  }

  function updateWebhookConfig(updates: Partial<PharmacyWebhookConfig>): void {
    webhookConfig.value = { ...webhookConfig.value, ...updates }
  }

  // Load config from localStorage on mount
  onMounted(() => {
    if (persistConfig) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          webhookConfig.value = JSON.parse(saved)
        } catch (e) {
          console.warn('Failed to parse pharmacy webhook config')
        }
      }
    }
    fetchPharmacies()
  })

  // Persist config to localStorage
  if (persistConfig) {
    watch(
      webhookConfig,
      (val) => {
        localStorage.setItem(storageKey, JSON.stringify(val))
      },
      { deep: true }
    )
  }

  // Clear history when phone changes
  watch(
    () => webhookConfig.value.phoneNumber,
    () => {
      conversationHistory.value = []
      historyMessages.value = []
      selectedConversation.value = null
    }
  )

  return {
    // Core state
    isLoading,
    isSending,
    pharmacies,
    selectedPharmacy,
    sessionId,
    messages,
    inputMessage,
    executionSteps,
    graphState,
    webhookConfig,
    // History state
    conversationHistory,
    historyMessages,
    selectedConversation,
    isLoadingHistory,
    isDeletingHistory,
    showDeleteConfirm,
    // Computed
    hasSession,
    hasPharmacies,
    canSendMessage,
    // Actions
    fetchPharmacies,
    sendMessage,
    clearSession,
    setQuickMessage,
    updateWebhookConfig,
    // History actions
    fetchHistory,
    selectConversation,
    deleteConversation,
    deleteAllHistory,
    // Utilities
    formatTime,
    formatDateTime
  }
}

export default usePharmacyTesting
