import { ref, computed, watch, onMounted } from 'vue'
import { medicalApi } from '@/api/medical.api'
import type {
  Institution,
  MedicalTestMessage,
  MedicalWebhookConfig,
  ConversationContext,
  ConversationMessage,
  InteractiveButton,
  InteractiveListItem
} from '@/api/medical.api'
import { useToast } from '@/composables/useToast'

/**
 * Composable for turnos medicos testing page.
 * Manages chat, session, institution selection, and conversation history.
 * Reuses the same backend API as medical testing (DID determines the domain agent).
 */

export interface UseTurnosMedicosTestingOptions {
  defaultPhone?: string
  persistConfig?: boolean
  storageKey?: string
}

const DEFAULT_PHONE = '5491100001234'
const STORAGE_KEY = 'turnos-medicos-webhook-config'

export function useTurnosMedicosTesting(options: UseTurnosMedicosTestingOptions = {}) {
  const {
    defaultPhone = DEFAULT_PHONE,
    persistConfig = true,
    storageKey = STORAGE_KEY
  } = options

  const toast = useToast()

  // Core state
  const isLoading = ref(false)
  const isSending = ref(false)
  const institutions = ref<Institution[]>([])
  const selectedInstitution = ref<Institution | null>(null)
  const sessionId = ref<string | null>(null)
  const messages = ref<MedicalTestMessage[]>([])
  const inputMessage = ref('')
  const executionSteps = ref<unknown[]>([])
  const graphState = ref<unknown | null>(null)

  // Webhook config
  const webhookConfig = ref<MedicalWebhookConfig>({
    enabled: true,
    phoneNumber: defaultPhone,
    userName: 'Test Patient',
    did: null
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
  const hasInstitutions = computed(() => institutions.value.length > 0)
  const canSendMessage = computed(
    () => !!inputMessage.value.trim() && !!selectedInstitution.value && !isSending.value
  )

  /**
   * Fetch available medical institutions.
   */
  async function fetchInstitutions(): Promise<void> {
    isLoading.value = true
    try {
      institutions.value = await medicalApi.getInstitutions()
      if (institutions.value.length > 0 && !selectedInstitution.value) {
        selectedInstitution.value = institutions.value[0]
        webhookConfig.value.did = institutions.value[0].code
      }
    } catch (err) {
      toast.error('Error al cargar instituciones medicas')
      console.error('Error fetching institutions:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send a test message.
   * DID (whatsapp_phone_number_id) is taken from selected institution.
   */
  async function sendMessage(): Promise<void> {
    if (!inputMessage.value.trim() || !selectedInstitution.value) return

    const did = selectedInstitution.value.code
    if (!did) {
      toast.error('La institucion no tiene un DID (WhatsApp ID) configurado')
      return
    }

    const userMessage: MedicalTestMessage = {
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
      const response = await medicalApi.sendTestMessage({
        whatsapp_phone_number_id: did,
        phone_number: webhookConfig.value.phoneNumber,
        message: messageText,
        session_id: sessionId.value || undefined
      })

      if (response) {
        sessionId.value = response.session_id

        const assistantMessage: MedicalTestMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          metadata: response.metadata,
          responseType: response.response_type as MedicalTestMessage['responseType'],
          buttons: response.response_buttons,
          listItems: response.response_list_items
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
      messages.value.pop()
      console.error('Error sending message:', err)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Send an interactive response (button click or list selection).
   */
  async function sendInteractiveResponse(
    type: 'button_reply' | 'list_reply',
    id: string,
    title: string
  ): Promise<void> {
    if (!selectedInstitution.value) return

    const did = selectedInstitution.value.code
    if (!did) {
      toast.error('La institucion no tiene un DID configurado')
      return
    }

    const userMessage: MedicalTestMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: title,
      timestamp: new Date().toISOString(),
      interactiveResponse: { type, id, title }
    }

    messages.value.push(userMessage)

    isSending.value = true
    try {
      const response = await medicalApi.sendTestMessage({
        whatsapp_phone_number_id: did,
        phone_number: webhookConfig.value.phoneNumber,
        interactive_response: { type, id, title },
        session_id: sessionId.value || undefined
      })

      if (response) {
        sessionId.value = response.session_id

        const assistantMessage: MedicalTestMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          metadata: response.metadata,
          responseType: response.response_type as MedicalTestMessage['responseType'],
          buttons: response.response_buttons,
          listItems: response.response_list_items
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
      toast.error('Error al enviar respuesta')
      messages.value.pop()
      console.error('Error sending interactive response:', err)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Handle button click from WhatsApp-style buttons.
   */
  async function handleButtonClick(button: InteractiveButton): Promise<void> {
    await sendInteractiveResponse('button_reply', button.id, button.titulo)
  }

  /**
   * Handle list item selection from WhatsApp-style list.
   */
  async function handleListSelect(item: InteractiveListItem): Promise<void> {
    await sendInteractiveResponse('list_reply', item.id, item.titulo)
  }

  /**
   * Clear current session.
   */
  function clearSession(): void {
    sessionId.value = null
    messages.value = []
    executionSteps.value = []
    graphState.value = null
    toast.info('Sesion reiniciada')
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

  /**
   * Update webhook config.
   */
  function updateWebhookConfig(updates: Partial<MedicalWebhookConfig>): void {
    webhookConfig.value = { ...webhookConfig.value, ...updates }
  }

  // History functions
  async function fetchHistory(): Promise<void> {
    if (!webhookConfig.value.phoneNumber) {
      toast.warn('Selecciona un telefono primero')
      return
    }
    isLoadingHistory.value = true
    try {
      conversationHistory.value = await medicalApi.getConversationsByPhone(
        webhookConfig.value.phoneNumber
      )
      if (conversationHistory.value.length === 0) {
        toast.info('No hay historial para este telefono')
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
      historyMessages.value = await medicalApi.getConversationMessages(conv.conversation_id)
    } catch (err) {
      toast.error('Error al cargar mensajes')
      console.error('Error loading conversation messages:', err)
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function deleteConversation(conv: ConversationContext): Promise<void> {
    try {
      const success = await medicalApi.deleteConversation(conv.conversation_id)
      if (success) {
        conversationHistory.value = conversationHistory.value.filter(
          (c) => c.conversation_id !== conv.conversation_id
        )
        if (selectedConversation.value?.conversation_id === conv.conversation_id) {
          selectedConversation.value = null
          historyMessages.value = []
        }
        toast.success('Conversacion eliminada')
      } else {
        toast.error('Error al eliminar conversacion')
      }
    } catch (err) {
      toast.error('Error al eliminar conversacion')
      console.error('Error deleting conversation:', err)
    }
  }

  async function deleteAllHistory(): Promise<void> {
    isDeletingHistory.value = true
    try {
      for (const conv of conversationHistory.value) {
        await medicalApi.deleteConversation(conv.conversation_id)
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

  // When institution changes, update DID
  watch(selectedInstitution, (newInst) => {
    if (newInst?.code) {
      webhookConfig.value.did = newInst.code
    }
  })

  // Clear history when phone changes
  watch(
    () => webhookConfig.value.phoneNumber,
    () => {
      conversationHistory.value = []
      historyMessages.value = []
      selectedConversation.value = null
    }
  )

  // Load config from localStorage on mount
  onMounted(() => {
    if (persistConfig) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          webhookConfig.value = JSON.parse(saved)
        } catch (e) {
          console.warn('Failed to parse turnos medicos webhook config')
        }
      }
    }
    fetchInstitutions()
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

  return {
    // Core state
    isLoading,
    isSending,
    institutions,
    selectedInstitution,
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
    hasInstitutions,
    canSendMessage,
    // Actions
    fetchInstitutions,
    sendMessage,
    sendInteractiveResponse,
    handleButtonClick,
    handleListSelect,
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

export default useTurnosMedicosTesting
