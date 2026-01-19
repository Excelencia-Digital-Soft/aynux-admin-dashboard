import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Stream event types from the backend ChatStreamEvent model.
 */
export type StreamEventType = 'thinking' | 'processing' | 'generating' | 'complete' | 'error'

/**
 * Interactive button from streaming response.
 */
export interface StreamButton {
  id: string
  titulo: string
}

/**
 * Interactive list item from streaming response.
 */
export interface StreamListItem {
  id: string
  titulo: string
  descripcion?: string
}

/**
 * Metadata from streaming response.
 */
export interface StreamMetadata {
  processing_time_ms?: number
  domain?: string
  organization_id?: string | null
  pharmacy_id?: string | null
  bypass_matched?: boolean
  session_id?: string
  response_type?: 'text' | 'buttons' | 'list'
  response_buttons?: StreamButton[]
  response_list_items?: StreamListItem[]
  graph_state?: {
    workflow_step?: string | null
    customer_identified?: boolean
    awaiting_confirmation?: boolean
  }
  // Index signature for Record<string, unknown> compatibility
  [key: string]: unknown
}

/**
 * Stream event received from SSE endpoint.
 */
export interface PharmacyStreamEvent {
  event_type: StreamEventType
  message: string
  agent_current?: string
  progress?: number
  metadata?: StreamMetadata
  timestamp?: string
}

/**
 * Complete stream result with all metadata.
 */
export interface StreamResult {
  content: string
  metadata: StreamMetadata
}

/**
 * Options for streaming a message.
 */
export interface PharmacyStreamOptions {
  phoneNumber: string
  pharmacyId: string
  pharmacyCode: string // DID (whatsapp_phone_number_id)
  sessionId?: string
}

/**
 * Composable for streaming pharmacy test messages using SSE.
 *
 * Provides real-time text streaming from the pharmacy agent,
 * compatible with Vercel AI SDK patterns with full metadata support.
 */
export function usePharmacyStream() {
  const authStore = useAuthStore()

  // Core streaming state
  const isStreaming = ref(false)
  const streamContent = ref('')
  const streamProgress = ref(0)
  const currentAgent = ref<string | null>(null)
  const streamError = ref<string | null>(null)
  const currentPhase = ref<StreamEventType | null>(null)

  // Metadata from complete event
  const streamMetadata = ref<StreamMetadata>({})

  // Computed for interactive elements
  const hasButtons = computed(() =>
    streamMetadata.value.response_type === 'buttons' &&
    (streamMetadata.value.response_buttons?.length ?? 0) > 0
  )

  const hasList = computed(() =>
    streamMetadata.value.response_type === 'list' &&
    (streamMetadata.value.response_list_items?.length ?? 0) > 0
  )

  const hasInteractive = computed(() => hasButtons.value || hasList.value)

  const bypassMatched = computed(() => streamMetadata.value.bypass_matched ?? false)

  const processingTimeMs = computed(() => streamMetadata.value.processing_time_ms ?? 0)

  /**
   * Send a message with streaming response.
   * Returns the final complete message with metadata.
   */
  async function sendMessageStream(
    message: string,
    options: PharmacyStreamOptions
  ): Promise<StreamResult> {
    // Reset state
    isStreaming.value = true
    streamContent.value = ''
    streamProgress.value = 0
    currentAgent.value = null
    streamError.value = null
    currentPhase.value = null
    streamMetadata.value = {}

    try {
      const response = await fetch('/api/v1/admin/pharmacy/test/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.accessToken}`
        },
        body: JSON.stringify({
          message,
          phone_number: options.phoneNumber,
          whatsapp_phone_number_id: options.pharmacyCode,
          pharmacy_id: options.pharmacyId,
          session_id: options.sessionId
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const eventData = line.slice(6) // Remove 'data: ' prefix
            if (!eventData.trim()) continue

            const event: PharmacyStreamEvent = JSON.parse(eventData)

            // Update state based on event type
            currentPhase.value = event.event_type
            currentAgent.value = event.agent_current || null

            switch (event.event_type) {
              case 'thinking':
                if (event.progress !== undefined) {
                  streamProgress.value = event.progress
                }
                // Merge bypass_matched from thinking event metadata
                if (event.metadata?.bypass_matched !== undefined) {
                  streamMetadata.value.bypass_matched = event.metadata.bypass_matched
                }
                break

              case 'processing':
                if (event.progress !== undefined) {
                  streamProgress.value = event.progress
                }
                // Merge domain from processing event metadata
                if (event.metadata?.domain) {
                  streamMetadata.value.domain = event.metadata.domain
                }
                break

              case 'generating':
                // Append generated text to stream content
                if (event.message) {
                  streamContent.value = event.message
                }
                if (event.progress !== undefined) {
                  streamProgress.value = event.progress
                }
                break

              case 'complete':
                // Final message - use complete response
                if (event.message) {
                  streamContent.value = event.message
                }
                streamProgress.value = 1.0
                // Store full metadata
                if (event.metadata) {
                  streamMetadata.value = { ...streamMetadata.value, ...event.metadata }
                }
                break

              case 'error':
                streamError.value = event.message || 'Unknown error'
                break
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE event:', parseError)
          }
        }
      }

      return {
        content: streamContent.value,
        metadata: streamMetadata.value
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      streamError.value = errorMessage
      throw error
    } finally {
      isStreaming.value = false
    }
  }

  /**
   * Send an interactive response (button click or list selection).
   */
  async function sendInteractiveResponse(
    interactiveResponse: { type: 'button_reply' | 'list_reply'; id: string; title: string },
    options: PharmacyStreamOptions
  ): Promise<StreamResult> {
    // Reset state
    isStreaming.value = true
    streamContent.value = ''
    streamProgress.value = 0
    currentAgent.value = null
    streamError.value = null
    currentPhase.value = null
    streamMetadata.value = {}

    try {
      const response = await fetch('/api/v1/admin/pharmacy/test/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.accessToken}`
        },
        body: JSON.stringify({
          phone_number: options.phoneNumber,
          whatsapp_phone_number_id: options.pharmacyCode,
          pharmacy_id: options.pharmacyId,
          session_id: options.sessionId,
          interactive_response: interactiveResponse
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const eventData = line.slice(6)
            if (!eventData.trim()) continue

            const event: PharmacyStreamEvent = JSON.parse(eventData)
            currentPhase.value = event.event_type
            currentAgent.value = event.agent_current || null

            if (event.progress !== undefined) {
              streamProgress.value = event.progress
            }

            if (event.event_type === 'complete') {
              if (event.message) {
                streamContent.value = event.message
              }
              streamProgress.value = 1.0
              if (event.metadata) {
                streamMetadata.value = { ...streamMetadata.value, ...event.metadata }
              }
            } else if (event.event_type === 'error') {
              streamError.value = event.message || 'Unknown error'
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE event:', parseError)
          }
        }
      }

      return {
        content: streamContent.value,
        metadata: streamMetadata.value
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      streamError.value = errorMessage
      throw error
    } finally {
      isStreaming.value = false
    }
  }

  /**
   * Reset streaming state.
   */
  function resetStream(): void {
    isStreaming.value = false
    streamContent.value = ''
    streamProgress.value = 0
    currentAgent.value = null
    streamError.value = null
    currentPhase.value = null
    streamMetadata.value = {}
  }

  return {
    // Core state
    isStreaming,
    streamContent,
    streamProgress,
    currentAgent,
    streamError,
    currentPhase,

    // Metadata
    streamMetadata,
    hasButtons,
    hasList,
    hasInteractive,
    bypassMatched,
    processingTimeMs,

    // Actions
    sendMessageStream,
    sendInteractiveResponse,
    resetStream
  }
}

export default usePharmacyStream
