import { ref, computed, watch, onMounted } from 'vue'
import { medicalApi } from '@/api/medical.api'
import type {
  Institution,
  MedicalTestMessage,
  MedicalWebhookConfig
} from '@/api/medical.api'
import { useToast } from '@/composables/useToast'

/**
 * Composable for medical appointments testing page.
 * Manages chat, session, and institution selection.
 */

export interface UseMedicalTestingOptions {
  defaultPhone?: string
  persistConfig?: boolean
  storageKey?: string
}

const DEFAULT_PHONE = '5491100001234'
const STORAGE_KEY = 'medical-webhook-config'

export function useMedicalTesting(options: UseMedicalTestingOptions = {}) {
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

  // Webhook config
  const webhookConfig = ref<MedicalWebhookConfig>({
    enabled: true,
    phoneNumber: defaultPhone,
    userName: 'Test Patient',
    did: null
  })

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
        // Update DID from selected institution
        webhookConfig.value.did = institutions.value[0].code
      }
    } catch (err) {
      toast.error('Error al cargar instituciones médicas')
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

    // DID is required - use institution's code
    const did = selectedInstitution.value.code
    if (!did) {
      toast.error('La institución no tiene un DID (WhatsApp ID) configurado')
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
          metadata: response.metadata
        }

        messages.value.push(assistantMessage)

        if (response.execution_steps) {
          executionSteps.value = response.execution_steps
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
  function clearSession(): void {
    sessionId.value = null
    messages.value = []
    executionSteps.value = []
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
   * Update webhook config.
   */
  function updateWebhookConfig(updates: Partial<MedicalWebhookConfig>): void {
    webhookConfig.value = { ...webhookConfig.value, ...updates }
  }

  // When institution changes, update DID
  watch(selectedInstitution, (newInst) => {
    if (newInst?.code) {
      webhookConfig.value.did = newInst.code
    }
  })

  // Load config from localStorage on mount
  onMounted(() => {
    if (persistConfig) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          webhookConfig.value = JSON.parse(saved)
        } catch (e) {
          console.warn('Failed to parse medical webhook config')
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
    webhookConfig,
    // Computed
    hasSession,
    hasInstitutions,
    canSendMessage,
    // Actions
    fetchInstitutions,
    sendMessage,
    clearSession,
    setQuickMessage,
    updateWebhookConfig,
    // Utilities
    formatTime
  }
}

export default useMedicalTesting
