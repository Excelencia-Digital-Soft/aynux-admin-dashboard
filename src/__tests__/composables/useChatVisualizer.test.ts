import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock chat API
vi.mock('@/api/chat.api', () => ({
  chatApi: {
    testWebhookSimulation: vi.fn(),
    sendMessageStream: vi.fn(),
    testAgent: vi.fn(),
    sendMessage: vi.fn(),
    getMetrics: vi.fn()
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

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123'
  }
})

import { useChatVisualizer } from '@/composables/useChatVisualizer'
import { useChatStore } from '@/stores/chat.store'
import { chatApi } from '@/api/chat.api'

describe('useChatVisualizer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const { activeTab, debugMode, showSettings, useStreaming, isProcessing } =
        useChatVisualizer({ autoLoadMetrics: false })

      expect(activeTab.value).toBe('0')
      expect(debugMode.value).toBe(true)
      expect(showSettings.value).toBe(false)
      expect(useStreaming.value).toBe(false)
      expect(isProcessing.value).toBe(false)
    })

    it('should accept custom options', () => {
      const { debugMode, useStreaming } = useChatVisualizer({
        defaultDebugMode: false,
        defaultStreaming: true,
        autoLoadMetrics: false
      })

      expect(debugMode.value).toBe(false)
      expect(useStreaming.value).toBe(true)
    })

    it('should provide store access', () => {
      const { store } = useChatVisualizer({ autoLoadMetrics: false })

      expect(store).toBeDefined()
      expect(typeof store.addMessage).toBe('function')
    })
  })

  describe('sendMessage', () => {
    it('should not send empty messages', async () => {
      const { sendMessage } = useChatVisualizer({ autoLoadMetrics: false })

      await sendMessage('')
      await sendMessage('   ')

      expect(chatApi.testAgent).not.toHaveBeenCalled()
    })

    it('should send message in debug mode', async () => {
      vi.mocked(chatApi.testAgent).mockResolvedValue({
        session_id: 'session-123',
        response: 'Hello from agent',
        execution_steps: [{ step: 1 }]
      })

      const { sendMessage, store, debugMode } = useChatVisualizer({ autoLoadMetrics: false })
      debugMode.value = true

      await sendMessage('Hello')

      expect(chatApi.testAgent).toHaveBeenCalledWith({
        message: 'Hello',
        debug: true,
        session_id: expect.any(String)
      })
    })

    it('should send message in non-debug mode', async () => {
      vi.mocked(chatApi.sendMessage).mockResolvedValue({
        message: { id: 'msg-1', role: 'assistant', content: 'Response', timestamp: '' }
      })

      const { sendMessage, debugMode } = useChatVisualizer({ autoLoadMetrics: false })
      debugMode.value = false

      await sendMessage('Hello')

      expect(chatApi.sendMessage).toHaveBeenCalled()
    })

    it('should use webhook simulation when enabled', async () => {
      vi.mocked(chatApi.testWebhookSimulation).mockResolvedValue({
        session_id: 'session-123',
        response: 'Webhook response',
        execution_steps: []
      })

      const { sendMessage, store, debugMode } = useChatVisualizer({ autoLoadMetrics: false })

      // Enable webhook simulation via store
      store.webhookSimulation.enabled = true
      store.webhookSimulation.phoneNumber = '1234567890'

      await sendMessage('Test webhook')

      expect(chatApi.testWebhookSimulation).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test webhook',
          phone_number: '1234567890'
        })
      )
    })

    it('should handle errors', async () => {
      vi.mocked(chatApi.testAgent).mockRejectedValue(new Error('API Error'))

      const { sendMessage, store, isProcessing } = useChatVisualizer({ autoLoadMetrics: false })

      await sendMessage('Hello')

      expect(store.error).toBe('API Error')
      expect(isProcessing.value).toBe(false)
    })

    it('should add error execution step on failure', async () => {
      vi.mocked(chatApi.testAgent).mockRejectedValue(new Error('Test error'))

      const { sendMessage, store } = useChatVisualizer({ autoLoadMetrics: false })

      await sendMessage('Hello')

      expect(store.executionSteps.length).toBeGreaterThan(0)
      const errorStep = store.executionSteps.find((s) => s.node_type === 'error')
      expect(errorStep).toBeDefined()
      expect(errorStep?.error_message).toBe('Test error')
    })
  })

  describe('handleNodeClick', () => {
    it('should switch to reasoning tab', () => {
      const { handleNodeClick, activeTab } = useChatVisualizer({ autoLoadMetrics: false })

      activeTab.value = '0'

      handleNodeClick('node-123')

      expect(activeTab.value).toBe('1')
    })
  })

  describe('clearChat', () => {
    it('should clear all threads and execution state', () => {
      const { clearChat, store } = useChatVisualizer({ autoLoadMetrics: false })

      // Add some data
      store.createNewThread()
      store.addMessage({ id: '1', role: 'user', content: 'test', timestamp: '' })

      clearChat()

      expect(store.threads.size).toBe(0)
    })
  })

  describe('newThread', () => {
    it('should create a new thread', () => {
      const { newThread, store } = useChatVisualizer({ autoLoadMetrics: false })

      const initialThreadCount = store.threads.size

      newThread()

      expect(store.threads.size).toBe(initialThreadCount + 1)
    })
  })

  describe('loadMetrics', () => {
    it('should load metrics from API', async () => {
      const mockMetrics = { total_sessions: 100, average_duration: 5.5 }
      vi.mocked(chatApi.getMetrics).mockResolvedValue(mockMetrics)

      const { loadMetrics, store } = useChatVisualizer({ autoLoadMetrics: false })

      await loadMetrics()

      expect(chatApi.getMetrics).toHaveBeenCalledWith({ days: 7 })
      expect(store.sessionMetrics).toEqual(mockMetrics)
    })

    it('should use custom metricsDays', async () => {
      vi.mocked(chatApi.getMetrics).mockResolvedValue({})

      const { loadMetrics } = useChatVisualizer({
        autoLoadMetrics: false,
        metricsDays: 30
      })

      await loadMetrics()

      expect(chatApi.getMetrics).toHaveBeenCalledWith({ days: 30 })
    })

    it('should handle metrics loading errors', async () => {
      vi.mocked(chatApi.getMetrics).mockRejectedValue(new Error('Metrics error'))

      const { loadMetrics } = useChatVisualizer({ autoLoadMetrics: false })

      // Should not throw
      await expect(loadMetrics()).resolves.not.toThrow()
    })
  })

  describe('settings', () => {
    it('toggleSettings should toggle showSettings', () => {
      const { toggleSettings, showSettings } = useChatVisualizer({ autoLoadMetrics: false })

      expect(showSettings.value).toBe(false)

      toggleSettings()
      expect(showSettings.value).toBe(true)

      toggleSettings()
      expect(showSettings.value).toBe(false)
    })

    it('closeSettings should set showSettings to false', () => {
      const { closeSettings, showSettings } = useChatVisualizer({ autoLoadMetrics: false })

      showSettings.value = true

      closeSettings()

      expect(showSettings.value).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error from store', () => {
      const { clearError, store } = useChatVisualizer({ autoLoadMetrics: false })

      store.setError('Test error')
      expect(store.error).toBe('Test error')

      clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('handleMessageClick', () => {
    it('should log message id', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const { handleMessageClick } = useChatVisualizer({ autoLoadMetrics: false })

      handleMessageClick({ id: 'msg-123', role: 'user', content: 'test', timestamp: '' })

      expect(consoleSpy).toHaveBeenCalledWith('Message clicked:', 'msg-123')
      consoleSpy.mockRestore()
    })
  })
})
