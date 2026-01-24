<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { usePharmacyTesting } from '@/composables/usePharmacyTesting'
import {
  usePharmacyStream,
  type StreamButton,
  type StreamListItem,
  type StreamMetadata
} from '@/composables/usePharmacyStream'
import { useToast } from '@/composables/useToast'
import type { PharmacyTestMessage } from '@/api/pharmacy.api'

// Components
import PharmacyTestHeader from '@/components/testing/pharmacy/PharmacyTestHeader.vue'
import PharmacyChatWindow from '@/components/testing/pharmacy/PharmacyChatWindow.vue'
import PharmacyChatInput from '@/components/testing/pharmacy/PharmacyChatInput.vue'
import PharmacyDebugPanel from '@/components/testing/pharmacy/PharmacyDebugPanel.vue'
import PharmacyQuickActions from '@/components/testing/pharmacy/PharmacyQuickActions.vue'

const DEFAULT_PHONE = '2645631000'

const {
  isLoading,
  isSending,
  pharmacies,
  selectedPharmacy,
  sessionId,
  messages,
  inputMessage,
  webhookConfig,
  executionSteps,
  graphState,
  conversationHistory,
  historyMessages,
  selectedConversation,
  isLoadingHistory,
  isDeletingHistory,
  showDeleteConfirm,
  hasSession,
  fetchPharmacies,
  sendMessage: sendMessageNonStream,
  clearSession,
  setQuickMessage,
  updateWebhookConfig,
  fetchHistory,
  selectConversation,
  deleteConversation,
  deleteAllHistory,
  formatTime
} = usePharmacyTesting({ defaultPhone: DEFAULT_PHONE })

// Streaming composable with full metadata support
const {
  isStreaming,
  streamContent,
  streamProgress,
  currentAgent,
  currentPhase,
  streamError,
  streamMetadata,
  sendMessageStream,
  sendInteractiveResponse,
  resetStream
} = usePharmacyStream()

const toast = useToast()
const useStreaming = ref(true)
const chatInputRef = ref<InstanceType<typeof PharmacyChatInput> | null>(null)

// Auto-focus input when response completes
watch([() => isStreaming.value, () => isSending.value], ([streaming, sending], [wasStreaming, wasSending]) => {
  // Focus input when streaming or sending finishes
  if ((wasStreaming && !streaming) || (wasSending && !sending)) {
    setTimeout(() => chatInputRef.value?.focus(), 100)
  }
})

// Extended message type with metadata
interface ExtendedMessage extends PharmacyTestMessage {
  metadata?: StreamMetadata
}

// Ensure messages array is treated as ExtendedMessage[]
const extendedMessages = computed(() => messages.value as ExtendedMessage[])

async function sendMessage() {
  if (!inputMessage.value.trim() || !selectedPharmacy.value) return

  if (useStreaming.value) {
    await sendMessageWithStream()
  } else {
    await sendMessageNonStream()
  }
}

async function sendMessageWithStream() {
  if (!inputMessage.value.trim() || !selectedPharmacy.value) return

  const did = webhookConfig.value.did || selectedPharmacy.value.code
  if (!did) {
    toast.error('Se requiere un DID (número de WhatsApp del negocio)')
    return
  }

  // Add user message immediately
  const userMessage: ExtendedMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMessage)

  const messageText = inputMessage.value
  inputMessage.value = ''
  resetStream()

  try {
    const result = await sendMessageStream(messageText, {
      phoneNumber: webhookConfig.value.phoneNumber,
      pharmacyId: selectedPharmacy.value.id,
      pharmacyCode: did,
      sessionId: sessionId.value || undefined
    })

    // Add assistant message with metadata
    const assistantMessage: ExtendedMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: result.content,
      timestamp: new Date().toISOString(),
      metadata: result.metadata
    }
    messages.value.push(assistantMessage)

    // Update session ID
    if (result.metadata.session_id) {
      sessionId.value = result.metadata.session_id
    } else if (!sessionId.value) {
      sessionId.value = `pharmacy_${webhookConfig.value.phoneNumber}`
    }
  } catch (err) {
    toast.error(streamError.value || 'Error al enviar mensaje')
    messages.value.pop()
    console.error('Error sending streamed message:', err)
  }
}

// Handle button click from streaming response
async function handleStreamButtonClick(button: StreamButton) {
  if (!selectedPharmacy.value) return

  const did = webhookConfig.value.did || selectedPharmacy.value.code
  if (!did) return

  // Add user's button selection as message
  const userMessage: ExtendedMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: button.titulo,
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMessage)
  resetStream()

  try {
    const result = await sendInteractiveResponse(
      { type: 'button_reply', id: button.id, title: button.titulo },
      {
        phoneNumber: webhookConfig.value.phoneNumber,
        pharmacyId: selectedPharmacy.value.id,
        pharmacyCode: did,
        sessionId: sessionId.value || undefined
      }
    )

    const assistantMessage: ExtendedMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: result.content,
      timestamp: new Date().toISOString(),
      metadata: result.metadata
    }
    messages.value.push(assistantMessage)
  } catch (err) {
    toast.error(streamError.value || 'Error al procesar selección')
    messages.value.pop()
  }
}

// Handle list selection from streaming response
async function handleStreamListSelect(item: StreamListItem) {
  if (!selectedPharmacy.value) return

  const did = webhookConfig.value.did || selectedPharmacy.value.code
  if (!did) return

  const userMessage: ExtendedMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: item.titulo,
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMessage)
  resetStream()

  try {
    const result = await sendInteractiveResponse(
      { type: 'list_reply', id: item.id, title: item.titulo },
      {
        phoneNumber: webhookConfig.value.phoneNumber,
        pharmacyId: selectedPharmacy.value.id,
        pharmacyCode: did,
        sessionId: sessionId.value || undefined
      }
    )

    const assistantMessage: ExtendedMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: result.content,
      timestamp: new Date().toISOString(),
      metadata: result.metadata
    }
    messages.value.push(assistantMessage)
  } catch (err) {
    toast.error(streamError.value || 'Error al procesar selección')
    messages.value.pop()
  }
}

async function copyAllChat() {
  if (messages.value.length === 0) {
    toast.warn('No hay mensajes para copiar')
    return
  }

  const chatText = messages.value
    .map((msg) => {
      const time = formatTime(msg.timestamp)
      const role = msg.role === 'user' ? 'Usuario' : 'Asistente'
      return `[${time}] ${role}: ${msg.content}`
    })
    .join('\n\n')

  try {
    await navigator.clipboard.writeText(chatText)
    toast.success('Chat copiado al portapapeles')
  } catch (err) {
    console.error('Error copying chat:', err)
    toast.error('Error al copiar el chat')
  }
}
</script>

<template>
  <div class="pharmacy-testing-page">
    <PharmacyTestHeader
      :is-loading="isLoading"
      :has-session="hasSession"
      @refresh="fetchPharmacies"
      @clear="clearSession"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Panel -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div class="card-wrapper rounded-xl overflow-hidden border dark:border-gray-700 shadow-sm">
          <PharmacyChatWindow
            v-model:selected-pharmacy="selectedPharmacy"
            :messages="extendedMessages"
            :pharmacies="pharmacies"
            :has-session="hasSession"
            :use-streaming="useStreaming"
            :is-streaming="isStreaming"
            :is-sending="isSending"
            :stream-content="streamContent"
            :stream-progress="streamProgress"
            :current-phase="currentPhase"
            :current-agent="currentAgent"
            :stream-metadata="streamMetadata"
            @copy-chat="copyAllChat"
            @button-click="handleStreamButtonClick"
            @list-select="handleStreamListSelect"
          />

          <PharmacyChatInput
            ref="chatInputRef"
            v-model="inputMessage"
            v-model:use-streaming="useStreaming"
            :is-loading="isSending || isStreaming"
            :disabled="!selectedPharmacy"
            @send="sendMessage"
          />
        </div>
      </div>

      <!-- Right Sidebar -->
      <div>
        <PharmacyDebugPanel
          :webhook-config="webhookConfig"
          :has-session="hasSession"
          :default-phone="DEFAULT_PHONE"
          :session-id="sessionId"
          :selected-pharmacy="selectedPharmacy"
          :message-count="messages.length"
          :use-streaming="useStreaming"
          :is-streaming="isStreaming"
          :current-phase="currentPhase"
          :current-agent="currentAgent"
          :stream-progress="streamProgress"
          :stream-metadata="streamMetadata"
          :execution-steps="executionSteps"
          :graph-state="graphState"
          :conversation-history="conversationHistory"
          :selected-conversation="selectedConversation"
          :history-messages="historyMessages"
          :is-loading-history="isLoadingHistory"
          :is-deleting-history="isDeletingHistory"
          @update:webhook-config="updateWebhookConfig"
          @update:use-streaming="useStreaming = $event"
          @fetch-history="fetchHistory"
          @select-conversation="selectConversation"
          @delete-conversation="deleteConversation"
          @delete-history="showDeleteConfirm = true"
        />

        <PharmacyQuickActions
          @action="setQuickMessage"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteConfirm"
      modal
      header="Eliminar Historial"
      :style="{ width: '400px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-yellow-500 text-2xl" />
        <div>
          <p class="text-gray-700 dark:text-gray-300">
            Esta acción eliminará <strong>TODAS</strong> las conversaciones para el teléfono
            <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ webhookConfig.phoneNumber }}</code>.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showDeleteConfirm = false"
          :disabled="isDeletingHistory"
        />
        <Button
          label="Eliminar"
          severity="danger"
          icon="pi pi-trash"
          @click="deleteAllHistory"
          :loading="isDeletingHistory"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.pharmacy-testing-page {
  max-width: 100%;
}
</style>
