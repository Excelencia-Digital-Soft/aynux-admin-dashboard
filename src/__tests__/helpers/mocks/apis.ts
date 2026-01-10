import { vi } from 'vitest'

/**
 * API mock factories for testing composables.
 */

/**
 * Create agent API mock.
 */
export function createAgentApiMock() {
  return {
    getConfig: vi.fn().mockResolvedValue({
      enabled_agents: ['greeting_agent', 'support_agent', 'fallback_agent'],
      system_initialized: true
    }),
    updateModules: vi.fn(),
    updateSettings: vi.fn(),
    getStatus: vi.fn(),
    getEnabledAgents: vi.fn().mockResolvedValue([])
  }
}

/**
 * Create AI models API mock.
 */
export function createAIModelsApiMock() {
  return {
    list: vi.fn().mockResolvedValue({ models: [] }),
    getSelectOptions: vi.fn().mockResolvedValue([]),
    toggle: vi.fn(),
    update: vi.fn(),
    seedExternal: vi.fn().mockResolvedValue({ added: 0, skipped: 0 })
  }
}

/**
 * Create analytics API mock.
 */
export function createAnalyticsApiMock() {
  return {
    getRagQueryLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
    exportData: vi.fn().mockResolvedValue(new Blob())
  }
}

/**
 * Create pharmacy API mock.
 */
export function createPharmacyApiMock() {
  return {
    getPharmacies: vi.fn().mockResolvedValue([]),
    sendTestMessage: vi.fn().mockResolvedValue({
      session_id: 'session-123',
      response: 'Test response',
      execution_steps: []
    }),
    clearSession: vi.fn().mockResolvedValue(true),
    getConversationsByPhone: vi.fn().mockResolvedValue([]),
    getConversationMessages: vi.fn().mockResolvedValue([]),
    deleteConversation: vi.fn().mockResolvedValue(true)
  }
}

/**
 * Create chat API mock.
 */
export function createChatApiMock() {
  return {
    testAgent: vi.fn(),
    sendMessage: vi.fn(),
    sendMessageStream: vi.fn(),
    testWebhookSimulation: vi.fn(),
    getMetrics: vi.fn()
  }
}

/**
 * Create knowledge API mock.
 */
export function createKnowledgeApiMock() {
  return {
    getDocuments: vi.fn().mockResolvedValue({ documents: [], total: 0 }),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    searchDocuments: vi.fn().mockResolvedValue({ results: [] })
  }
}

/**
 * Create agent knowledge API mock.
 */
export function createAgentKnowledgeApiMock() {
  return {
    getAvailableAgents: vi.fn().mockResolvedValue([]),
    getByAgentKey: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue({ results: [] })
  }
}
