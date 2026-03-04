/**
 * Composable for managing simulator sessions and conversation state.
 */

import { ref, computed } from 'vue'
import { simulatorApi } from '@/api/simulator.api'
import type {
  SendMessageResponse,
  SimulatorTrace,
  SimulatorButton,
  SimulatorListItem,
} from '@/api/simulator.api'

export interface SimulatorMessage {
  id: number
  role: 'user' | 'bot'
  text: string
  buttons?: SimulatorButton[] | null
  listItems?: SimulatorListItem[] | null
  trace?: SimulatorTrace | null
  stateSnapshot?: Record<string, unknown> | null
}

export function useSimulator() {
  const sessionId = ref<string | null>(null)
  const institutionName = ref<string>('')
  const messages = ref<SimulatorMessage[]>([])
  const isLoading = ref(false)
  const isCreatingSession = ref(false)
  const error = ref<string | null>(null)
  const currentTrace = ref<SimulatorTrace | null>(null)
  const currentStateSnapshot = ref<Record<string, unknown>>({})
  const highlightedNodeId = ref<string | null>(null)

  let messageCounter = 0

  const isSessionActive = computed(() => sessionId.value !== null)

  async function createSession(
    organizationId: string,
    institutionConfigId?: string | null,
  ): Promise<void> {
    isCreatingSession.value = true
    error.value = null

    try {
      const result = await simulatorApi.createSession({
        organization_id: organizationId,
        institution_config_id: institutionConfigId,
      })
      sessionId.value = result.session_id
      institutionName.value = result.institution_name
      messages.value = []
      messageCounter = 0
      currentTrace.value = null
      currentStateSnapshot.value = {}
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to create session'
      throw e
    } finally {
      isCreatingSession.value = false
    }
  }

  async function sendMessage(text: string, choiceId?: string | null): Promise<void> {
    if (!sessionId.value) return

    isLoading.value = true
    error.value = null

    // Add user message immediately
    messages.value.push({
      id: ++messageCounter,
      role: 'user',
      text: choiceId ? `[${choiceId}]` : text,
    })

    try {
      const result: SendMessageResponse = await simulatorApi.sendMessage({
        session_id: sessionId.value,
        text: text || '',
        choice_id: choiceId,
      })

      // Add bot response
      messages.value.push({
        id: ++messageCounter,
        role: 'bot',
        text: result.response_text,
        buttons: result.response_buttons,
        listItems: result.response_list_items,
        trace: result.trace,
        stateSnapshot: result.state_snapshot,
      })

      // Update current trace and state
      currentTrace.value = result.trace
      currentStateSnapshot.value = result.state_snapshot

      // Highlight the current node in the graph
      if (result.trace?.current_node) {
        highlightedNodeId.value = result.trace.current_node
        // Auto-clear highlight after 5 seconds
        setTimeout(() => {
          highlightedNodeId.value = null
        }, 5000)
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to send message'
      // Add error message to chat
      messages.value.push({
        id: ++messageCounter,
        role: 'bot',
        text: `Error: ${error.value}`,
      })
    } finally {
      isLoading.value = false
    }
  }

  async function endSession(): Promise<void> {
    if (!sessionId.value) return

    try {
      await simulatorApi.deleteSession(sessionId.value)
    } catch {
      // Ignore cleanup errors
    }

    sessionId.value = null
    institutionName.value = ''
    messages.value = []
    currentTrace.value = null
    currentStateSnapshot.value = {}
    highlightedNodeId.value = null
    messageCounter = 0
  }

  function handleButtonClick(buttonId: string, buttonTitle: string) {
    sendMessage(buttonTitle, buttonId)
  }

  function handleListSelect(itemId: string, itemTitle: string) {
    sendMessage(itemTitle, itemId)
  }

  return {
    // State
    sessionId,
    institutionName,
    messages,
    isLoading,
    isCreatingSession,
    error,
    currentTrace,
    currentStateSnapshot,
    highlightedNodeId,
    isSessionActive,

    // Actions
    createSession,
    sendMessage,
    endSession,
    handleButtonClick,
    handleListSelect,
  }
}
