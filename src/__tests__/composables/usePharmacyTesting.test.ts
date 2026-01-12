import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock pharmacy API
vi.mock('@/api/pharmacy.api', () => ({
  pharmacyApi: {
    getPharmacies: vi.fn(),
    sendTestMessage: vi.fn(),
    clearSession: vi.fn(),
    getConversationsByPhone: vi.fn(),
    getConversationMessages: vi.fn(),
    deleteConversation: vi.fn()
  }
}))

// Mock toast
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  })
}))

import { usePharmacyTesting } from '@/composables/usePharmacyTesting'
import { pharmacyApi } from '@/api/pharmacy.api'

describe('usePharmacyTesting', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const {
        isLoading,
        isSending,
        pharmacies,
        selectedPharmacy,
        sessionId,
        messages,
        hasSession
      } = usePharmacyTesting()

      expect(isLoading.value).toBe(false)
      expect(isSending.value).toBe(false)
      expect(pharmacies.value).toEqual([])
      expect(selectedPharmacy.value).toBeNull()
      expect(sessionId.value).toBeNull()
      expect(messages.value).toEqual([])
      expect(hasSession.value).toBe(false)
    })

    it('should use custom default phone', () => {
      const { webhookConfig } = usePharmacyTesting({ defaultPhone: '1234567890' })

      expect(webhookConfig.value.phoneNumber).toBe('1234567890')
    })
  })

  describe('fetchPharmacies', () => {
    it('should fetch pharmacies and select first', async () => {
      const mockPharmacies = [
        { id: '1', name: 'Pharmacy A', code: 'PA', active: true },
        { id: '2', name: 'Pharmacy B', code: 'PB', active: true }
      ]
      vi.mocked(pharmacyApi.getPharmacies).mockResolvedValue(mockPharmacies)

      const { fetchPharmacies, pharmacies, selectedPharmacy, isLoading } = usePharmacyTesting()

      const promise = fetchPharmacies()
      expect(isLoading.value).toBe(true)

      await promise

      expect(isLoading.value).toBe(false)
      expect(pharmacies.value).toEqual(mockPharmacies)
      expect(selectedPharmacy.value).toEqual(mockPharmacies[0])
    })
  })

  describe('sendMessage', () => {
    it('should send message and receive response', async () => {
      const mockResponse = {
        session_id: 'session-123',
        response: 'Hello from assistant',
        execution_steps: [{ step: 1 }]
      }
      vi.mocked(pharmacyApi.sendTestMessage).mockResolvedValue(mockResponse)

      const { sendMessage, messages, sessionId, inputMessage, selectedPharmacy, executionSteps } =
        usePharmacyTesting()

      selectedPharmacy.value = { id: '1', name: 'Test', code: 'T', active: true }
      inputMessage.value = 'Hello'

      await sendMessage()

      expect(messages.value).toHaveLength(2)
      expect(messages.value[0].role).toBe('user')
      expect(messages.value[1].role).toBe('assistant')
      expect(sessionId.value).toBe('session-123')
      expect(inputMessage.value).toBe('')
      expect(executionSteps.value).toEqual([{ step: 1 }])
    })

    it('should not send if no pharmacy selected', async () => {
      const { sendMessage, inputMessage, messages } = usePharmacyTesting()

      inputMessage.value = 'Hello'

      await sendMessage()

      expect(pharmacyApi.sendTestMessage).not.toHaveBeenCalled()
      expect(messages.value).toHaveLength(0)
    })

    it('should remove user message on error', async () => {
      vi.mocked(pharmacyApi.sendTestMessage).mockRejectedValue(new Error('API Error'))

      const { sendMessage, messages, inputMessage, selectedPharmacy } = usePharmacyTesting()

      selectedPharmacy.value = { id: '1', name: 'Test', code: 'T', active: true }
      inputMessage.value = 'Hello'

      await sendMessage()

      expect(messages.value).toHaveLength(0)
    })
  })

  describe('clearSession', () => {
    it('should clear session and reset state', async () => {
      vi.mocked(pharmacyApi.clearSession).mockResolvedValue(true)

      const { clearSession, sessionId, messages, executionSteps, graphState } = usePharmacyTesting()

      sessionId.value = 'session-123'
      messages.value = [{ id: '1', role: 'user', content: 'test', timestamp: '' }]
      executionSteps.value = [{ step: 1 }]
      graphState.value = { state: 'test' }

      await clearSession()

      expect(pharmacyApi.clearSession).toHaveBeenCalledWith('session-123')
      expect(sessionId.value).toBeNull()
      expect(messages.value).toEqual([])
      expect(executionSteps.value).toEqual([])
      expect(graphState.value).toBeNull()
    })
  })

  describe('formatting utilities', () => {
    it('formatTime should format timestamp', () => {
      const { formatTime } = usePharmacyTesting()

      const result = formatTime('2024-01-15T10:30:00Z')

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('formatDateTime should format date and time', () => {
      const { formatDateTime } = usePharmacyTesting()

      const result = formatDateTime('2024-01-15T10:30:00Z')

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('history functions', () => {
    it('fetchHistory should load conversations', async () => {
      const mockHistory = [
        { conversation_id: 'c1', total_turns: 5, last_activity: '2024-01-15', summary: '', topic_history: [] }
      ]
      vi.mocked(pharmacyApi.getConversationsByPhone).mockResolvedValue(mockHistory)

      const { fetchHistory, conversationHistory, webhookConfig } = usePharmacyTesting()

      webhookConfig.value.phoneNumber = '1234567890'

      await fetchHistory()

      expect(conversationHistory.value).toEqual(mockHistory)
    })

    it('selectConversation should load messages', async () => {
      const mockMessages = [{ sender_type: 'user', content: 'Hello', agent_name: null, metadata: {}, created_at: '' }]
      vi.mocked(pharmacyApi.getConversationMessages).mockResolvedValue(mockMessages)

      const { selectConversation, historyMessages, selectedConversation } = usePharmacyTesting()

      const conv = { conversation_id: 'c1', total_turns: 5, last_activity: '', summary: '', topic_history: [] }

      await selectConversation(conv)

      expect(selectedConversation.value).toEqual(conv)
      expect(historyMessages.value).toEqual(mockMessages)
    })
  })

  describe('computed properties', () => {
    it('hasSession should reflect sessionId', () => {
      const { hasSession, sessionId } = usePharmacyTesting()

      expect(hasSession.value).toBe(false)

      sessionId.value = 'session-123'

      expect(hasSession.value).toBe(true)
    })

    it('canSendMessage should check conditions', () => {
      const { canSendMessage, inputMessage, selectedPharmacy, isSending } = usePharmacyTesting()

      expect(canSendMessage.value).toBe(false)

      inputMessage.value = 'Hello'
      expect(canSendMessage.value).toBe(false)

      selectedPharmacy.value = { id: '1', name: 'Test', code: 'T', active: true }
      expect(canSendMessage.value).toBe(true)

      isSending.value = true
      expect(canSendMessage.value).toBe(false)
    })
  })
})
