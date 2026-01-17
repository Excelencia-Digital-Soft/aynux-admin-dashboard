<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { usePharmacyTesting } from '@/composables/usePharmacyTesting'
import {
  usePharmacyStream,
  type StreamButton,
  type StreamListItem,
  type StreamMetadata
} from '@/composables/usePharmacyStream'
import { useToast } from '@/composables/useToast'
import PharmacyWebhookPanel from '@/components/pharmacy/PharmacyWebhookPanel.vue'
import type { PharmacyTestMessage } from '@/api/pharmacy.api'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Dialog from 'primevue/dialog'

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
  formatTime,
  formatDateTime
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
const chatContainer = ref<HTMLElement | null>(null)
const useStreaming = ref(true)

// Extended message type with metadata
interface ExtendedMessage extends PharmacyTestMessage {
  metadata?: StreamMetadata
}

// Auto-scroll when streaming content changes
watch(streamContent, () => {
  scrollToBottom()
})

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage().then(scrollToBottom)
  }
}

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
    toast.error('Se requiere un DID (numero de WhatsApp del negocio)')
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
    toast.error(streamError.value || 'Error al procesar seleccion')
    messages.value.pop()
  }
  await scrollToBottom()
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
    toast.error(streamError.value || 'Error al procesar seleccion')
    messages.value.pop()
  }
  await scrollToBottom()
}

async function handleSendMessage() {
  await sendMessage()
  await scrollToBottom()
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

// Phase display helpers
function getPhaseLabel(phase: string | null): string {
  const labels: Record<string, string> = {
    thinking: 'Analizando',
    processing: 'Procesando',
    generating: 'Generando',
    complete: 'Completado',
    error: 'Error'
  }
  return phase ? labels[phase] || phase : ''
}

function getPhaseSeverity(phase: string | null): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
  const severities: Record<string, 'info' | 'warn' | 'success' | 'danger' | 'secondary'> = {
    thinking: 'info',
    processing: 'warn',
    generating: 'success',
    complete: 'success',
    error: 'danger'
  }
  return phase ? severities[phase] || 'secondary' : 'secondary'
}

// Check if message has interactive elements in metadata
function hasInteractiveButtons(msg: ExtendedMessage): boolean {
  return msg.metadata?.response_type === 'buttons' &&
    (msg.metadata?.response_buttons?.length ?? 0) > 0
}

function hasInteractiveList(msg: ExtendedMessage): boolean {
  return msg.metadata?.response_type === 'list' &&
    (msg.metadata?.response_list_items?.length ?? 0) > 0
}
</script>

<template>
  <div class="pharmacy-testing-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Pruebas Farmacia</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Simulador de conversacion WhatsApp con streaming AI
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          icon="pi pi-refresh"
          label="Actualizar"
          severity="secondary"
          @click="fetchPharmacies"
          :loading="isLoading"
        />
        <Button
          icon="pi pi-trash"
          label="Reiniciar"
          severity="warn"
          @click="clearSession"
          :disabled="!hasSession"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Panel - AI SDK Style -->
      <div class="lg:col-span-2">
        <Card class="chat-card overflow-hidden">
          <template #header>
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-green-500 text-white">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <i class="pi pi-whatsapp text-xl" />
                </div>
                <div>
                  <div class="font-semibold">
                    {{ selectedPharmacy?.name || 'Seleccionar Farmacia' }}
                  </div>
                  <div class="text-xs text-green-100 flex items-center gap-2">
                    <span v-if="hasSession" class="flex items-center gap-1">
                      <span class="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                      Sesion activa
                    </span>
                    <span v-else>Sin sesion</span>
                    <span v-if="useStreaming" class="flex items-center gap-1">
                      <i class="pi pi-bolt text-yellow-300" />
                      Streaming
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Select
                  v-model="selectedPharmacy"
                  :options="pharmacies"
                  optionLabel="name"
                  placeholder="Farmacia"
                  class="w-48"
                  :disabled="hasSession"
                />
                <Button
                  icon="pi pi-copy"
                  severity="secondary"
                  text
                  rounded
                  v-tooltip.bottom="'Copiar chat'"
                  @click="copyAllChat"
                  :disabled="messages.length === 0"
                  class="text-white hover:bg-white/20"
                />
              </div>
            </div>
          </template>

          <template #content>
            <!-- Chat Messages -->
            <div
              ref="chatContainer"
              class="chat-messages h-[500px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
            >
              <!-- Empty state -->
              <div
                v-if="messages.length === 0 && !isStreaming"
                class="h-full flex items-center justify-center"
              >
                <div class="text-center text-gray-400 dark:text-gray-500">
                  <div class="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <i class="pi pi-comments text-3xl" />
                  </div>
                  <p class="text-lg font-medium">Inicia una conversacion</p>
                  <p class="text-sm mt-1">Escribe un mensaje o usa una accion rapida</p>
                </div>
              </div>

              <!-- Messages -->
              <div v-else class="space-y-4">
                <template v-for="(msg, idx) in messages" :key="msg.id">
                  <!-- User Message -->
                  <div v-if="msg.role === 'user'" class="flex justify-end">
                    <div class="max-w-[75%] bg-green-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
                      <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
                      <div class="text-xs text-green-100 mt-1 text-right">
                        {{ formatTime(msg.timestamp) }}
                      </div>
                    </div>
                  </div>

                  <!-- Assistant Message -->
                  <div v-else class="flex justify-start">
                    <div class="max-w-[80%]">
                      <!-- Message bubble -->
                      <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600">
                        <p class="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">
                          {{ msg.content }}
                        </p>

                        <!-- Interactive Buttons from metadata -->
                        <div
                          v-if="hasInteractiveButtons(msg as ExtendedMessage) && idx === messages.length - 1"
                          class="whatsapp-buttons-container"
                        >
                          <button
                            v-for="btn in (msg as ExtendedMessage).metadata?.response_buttons"
                            :key="btn.id"
                            class="whatsapp-action-btn"
                            @click="handleStreamButtonClick(btn)"
                            :disabled="isStreaming || isSending"
                          >
                            {{ btn.titulo }}
                          </button>
                        </div>

                        <!-- Interactive List from metadata -->
                        <div
                          v-if="hasInteractiveList(msg as ExtendedMessage) && idx === messages.length - 1"
                          class="mt-3 space-y-2"
                        >
                          <div
                            v-for="item in (msg as ExtendedMessage).metadata?.response_list_items"
                            :key="item.id"
                            class="p-2 bg-gray-50 dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                            @click="handleStreamListSelect(item)"
                          >
                            <div class="font-medium text-sm">{{ item.titulo }}</div>
                            <div v-if="item.descripcion" class="text-xs text-gray-500 dark:text-gray-400">
                              {{ item.descripcion }}
                            </div>
                          </div>
                        </div>

                        <!-- Metadata footer -->
                        <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                          <span class="text-xs text-gray-400 dark:text-gray-500">
                            {{ formatTime(msg.timestamp) }}
                          </span>
                          <template v-if="(msg as ExtendedMessage).metadata">
                            <Tag
                              v-if="(msg as ExtendedMessage).metadata?.bypass_matched"
                              value="Bypass"
                              severity="info"
                              class="text-xs"
                              style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
                            />
                            <Tag
                              v-if="(msg as ExtendedMessage).metadata?.domain"
                              :value="(msg as ExtendedMessage).metadata?.domain"
                              severity="secondary"
                              class="text-xs"
                              style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
                            />
                            <span
                              v-if="(msg as ExtendedMessage).metadata?.processing_time_ms"
                              class="text-xs text-gray-400 dark:text-gray-500"
                            >
                              {{ (msg as ExtendedMessage).metadata?.processing_time_ms }}ms
                            </span>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- AI SDK Style Streaming Indicator -->
                <div v-if="isStreaming" class="flex justify-start">
                  <div class="max-w-[80%]">
                    <!-- Status bar -->
                    <div class="flex items-center gap-2 mb-2">
                      <Tag
                        :value="getPhaseLabel(currentPhase)"
                        :severity="getPhaseSeverity(currentPhase)"
                        class="text-xs"
                      />
                      <Tag
                        v-if="currentAgent"
                        :value="currentAgent"
                        severity="secondary"
                        class="text-xs"
                        style="font-size: 0.65rem;"
                      />
                      <Tag
                        v-if="streamMetadata.bypass_matched"
                        value="Bypass"
                        severity="info"
                        class="text-xs"
                        style="font-size: 0.65rem;"
                      />
                    </div>

                    <!-- Progress bar -->
                    <div class="mb-2">
                      <ProgressBar
                        :value="streamProgress * 100"
                        :showValue="false"
                        style="height: 4px"
                        class="rounded-full"
                      />
                    </div>

                    <!-- Message bubble with streaming content -->
                    <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600">
                      <!-- Content with cursor -->
                      <div v-if="streamContent" class="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">
                        <span>{{ streamContent }}</span>
                        <span class="inline-block w-0.5 h-5 bg-green-500 animate-pulse ml-0.5 align-middle" />
                      </div>

                      <!-- Thinking animation -->
                      <div v-else class="flex items-center gap-2">
                        <div class="flex gap-1">
                          <span
                            class="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                            style="animation-delay: 0ms"
                          />
                          <span
                            class="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                            style="animation-delay: 150ms"
                          />
                          <span
                            class="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                            style="animation-delay: 300ms"
                          />
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                          {{ currentPhase === 'thinking' ? 'Analizando consulta...' : 'Generando respuesta...' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Non-streaming typing indicator -->
                <div v-else-if="isSending" class="flex justify-start">
                  <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm">
                    <div class="flex gap-1">
                      <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                      <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                      <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Area - AI SDK Style -->
            <div class="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <div class="flex gap-3 items-end">
                <div class="flex-1 relative">
                  <InputText
                    v-model="inputMessage"
                    placeholder="Escribe un mensaje..."
                    class="w-full pr-10"
                    @keypress="handleKeyPress"
                    :disabled="!selectedPharmacy || isSending || isStreaming"
                  />
                </div>
                <Button
                  icon="pi pi-send"
                  @click="handleSendMessage"
                  :loading="isSending || isStreaming"
                  :disabled="!inputMessage.trim() || !selectedPharmacy"
                  class="h-10 w-10"
                  rounded
                />
              </div>
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-2 text-xs text-gray-400">
                  <span>Enter para enviar</span>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    :icon="useStreaming ? 'pi pi-bolt' : 'pi pi-pause'"
                    :label="useStreaming ? 'Streaming' : 'Normal'"
                    size="small"
                    :severity="useStreaming ? 'success' : 'secondary'"
                    text
                    @click="useStreaming = !useStreaming"
                    v-tooltip.top="useStreaming ? 'Modo streaming activo' : 'Modo normal'"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Debug Panel -->
      <div>
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-code" />
              <span>Panel de Debug</span>
            </div>
          </template>

          <template #content>
            <Tabs value="0">
              <TabList>
                <Tab value="0">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-bolt" />
                    <span>Webhook</span>
                    <Tag
                      v-if="webhookConfig.enabled"
                      value="ON"
                      severity="success"
                      class="ml-1"
                      style="font-size: 0.65rem; padding: 0.1rem 0.3rem;"
                    />
                  </div>
                </Tab>
                <Tab value="1">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-info-circle" />
                    <span>Sesion</span>
                  </div>
                </Tab>
                <Tab value="2">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-list" />
                    <span>Pasos</span>
                  </div>
                </Tab>
                <Tab value="3">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-sitemap" />
                    <span>Estado</span>
                  </div>
                </Tab>
                <Tab value="4">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-history" />
                    <span>Historial</span>
                    <Tag
                      v-if="conversationHistory.length"
                      :value="conversationHistory.length"
                      severity="info"
                      class="ml-1"
                      style="font-size: 0.65rem; padding: 0.1rem 0.3rem;"
                    />
                  </div>
                </Tab>
              </TabList>

              <TabPanels>
                <!-- Webhook Config -->
                <TabPanel value="0">
                  <PharmacyWebhookPanel
                    :config="webhookConfig"
                    :has-session="hasSession"
                    :default-phone="DEFAULT_PHONE"
                    @update="updateWebhookConfig"
                  />
                </TabPanel>

                <!-- Session Info -->
                <TabPanel value="1">
                  <div class="space-y-4 p-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</label>
                      <code class="text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1">
                        {{ sessionId || 'N/A' }}
                      </code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Telefono</label>
                      <code class="text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1">
                        {{ webhookConfig.phoneNumber }}
                      </code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Farmacia</label>
                      <p class="text-sm mt-1">{{ selectedPharmacy?.name || 'No seleccionada' }}</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes</label>
                      <Tag :value="`${messages.length} mensajes`" severity="info" class="mt-1" />
                    </div>

                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Modo Streaming</label>
                      <div class="flex items-center gap-2">
                        <Tag
                          :value="useStreaming ? 'Activo' : 'Inactivo'"
                          :severity="useStreaming ? 'success' : 'secondary'"
                        />
                        <Button
                          :icon="useStreaming ? 'pi pi-pause' : 'pi pi-play'"
                          size="small"
                          :severity="useStreaming ? 'success' : 'secondary'"
                          text
                          rounded
                          @click="useStreaming = !useStreaming"
                        />
                      </div>
                    </div>

                    <!-- Streaming state display -->
                    <div v-if="isStreaming" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <div class="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Estado del Stream
                      </div>
                      <div class="space-y-2 text-xs">
                        <div class="flex justify-between">
                          <span class="text-gray-600 dark:text-gray-400">Fase:</span>
                          <Tag :value="getPhaseLabel(currentPhase)" :severity="getPhaseSeverity(currentPhase)" />
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600 dark:text-gray-400">Agente:</span>
                          <span class="font-mono">{{ currentAgent || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600 dark:text-gray-400">Progreso:</span>
                          <span>{{ Math.round(streamProgress * 100) }}%</span>
                        </div>
                        <div v-if="streamMetadata.bypass_matched" class="flex justify-between">
                          <span class="text-gray-600 dark:text-gray-400">Bypass:</span>
                          <Tag value="Matched" severity="info" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>

                <!-- Execution Steps -->
                <TabPanel value="2">
                  <div v-if="executionSteps.length === 0" class="text-center text-gray-400 dark:text-gray-500 py-4">
                    <i class="pi pi-list text-2xl mb-2" />
                    <p class="text-sm">Sin pasos de ejecucion</p>
                  </div>

                  <div v-else class="space-y-2 max-h-64 overflow-y-auto p-3">
                    <div
                      v-for="(step, idx) in executionSteps"
                      :key="idx"
                      class="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                    >
                      <pre class="overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
                    </div>
                  </div>
                </TabPanel>

                <!-- Graph State -->
                <TabPanel value="3">
                  <div v-if="!graphState && !streamMetadata.graph_state" class="text-center text-gray-400 dark:text-gray-500 py-4">
                    <i class="pi pi-sitemap text-2xl mb-2" />
                    <p class="text-sm">Sin estado de grafo</p>
                  </div>

                  <div v-else class="max-h-64 overflow-y-auto p-3">
                    <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">{{
                      JSON.stringify(streamMetadata.graph_state || graphState, null, 2)
                    }}</pre>
                  </div>
                </TabPanel>

                <!-- Message History -->
                <TabPanel value="4">
                  <div class="p-3 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Telefono:</span>
                        <code class="ml-2 text-xs">{{ webhookConfig.phoneNumber }}</code>
                      </div>
                      <Button
                        icon="pi pi-refresh"
                        label="Cargar"
                        size="small"
                        severity="secondary"
                        @click="fetchHistory"
                        :loading="isLoadingHistory"
                      />
                    </div>

                    <div v-if="conversationHistory.length > 0" class="space-y-2">
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block">
                        Conversaciones ({{ conversationHistory.length }})
                      </label>
                      <div class="max-h-32 overflow-y-auto space-y-1">
                        <div
                          v-for="conv in conversationHistory"
                          :key="conv.conversation_id"
                          :class="[
                            'flex items-center justify-between p-2 rounded cursor-pointer text-xs',
                            selectedConversation?.conversation_id === conv.conversation_id
                              ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          ]"
                          @click="selectConversation(conv)"
                        >
                          <div class="flex items-center gap-2 flex-1 min-w-0">
                            <i class="pi pi-comments text-gray-400" />
                            <span class="truncate">{{ conv.total_turns }} msgs</span>
                            <span class="text-gray-400">{{ formatDateTime(conv.last_activity) }}</span>
                          </div>
                          <Button
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            text
                            rounded
                            @click.stop="deleteConversation(conv)"
                          />
                        </div>
                      </div>
                    </div>

                    <div v-if="selectedConversation && historyMessages.length > 0" class="space-y-2">
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block">
                        Mensajes ({{ historyMessages.length }})
                      </label>
                      <div class="max-h-40 overflow-y-auto space-y-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div
                          v-for="(msg, idx) in historyMessages"
                          :key="idx"
                          :class="[
                            'p-2 rounded text-xs',
                            msg.sender_type === 'user'
                              ? 'ml-4 bg-green-100 dark:bg-green-900'
                              : msg.sender_type === 'assistant'
                                ? 'mr-4 bg-white dark:bg-gray-700'
                                : 'mx-auto bg-gray-200 dark:bg-gray-600 text-center'
                          ]"
                        >
                          <div class="flex items-center gap-2 mb-1">
                            <Tag
                              :value="msg.sender_type"
                              :severity="msg.sender_type === 'user' ? 'success' : msg.sender_type === 'assistant' ? 'info' : 'secondary'"
                              style="font-size: 0.6rem; padding: 0.1rem 0.25rem;"
                            />
                            <span class="text-gray-400 text-xs">{{ formatDateTime(msg.created_at) }}</span>
                          </div>
                          <div class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="!isLoadingHistory && conversationHistory.length === 0"
                      class="text-center text-gray-400 dark:text-gray-500 py-4"
                    >
                      <i class="pi pi-history text-2xl mb-2" />
                      <p class="text-sm">Presiona "Cargar" para ver historial</p>
                    </div>

                    <div v-if="isLoadingHistory" class="text-center py-4">
                      <ProgressSpinner style="width: 30px; height: 30px" />
                    </div>

                    <Button
                      v-if="conversationHistory.length > 0"
                      icon="pi pi-trash"
                      label="Eliminar Todo"
                      severity="danger"
                      size="small"
                      class="w-full"
                      @click="showDeleteConfirm = true"
                      :loading="isDeletingHistory"
                    />
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </template>
        </Card>

        <!-- Quick Actions -->
        <Card class="mt-4">
          <template #title>
            <div class="flex items-center gap-2 text-sm">
              <i class="pi pi-bolt" />
              <span>Acciones Rapidas</span>
            </div>
          </template>

          <template #content>
            <div class="grid grid-cols-2 gap-2">
              <Button
                label="Hola"
                size="small"
                severity="secondary"
                outlined
                @click="setQuickMessage('Hola, buenos dias')"
              />
              <Button
                label="Productos"
                size="small"
                severity="secondary"
                outlined
                @click="setQuickMessage('Que productos tienen?')"
              />
              <Button
                label="Precio"
                size="small"
                severity="secondary"
                outlined
                @click="setQuickMessage('Cuanto cuesta el paracetamol?')"
              />
              <Button
                label="Pedido"
                size="small"
                severity="secondary"
                outlined
                @click="setQuickMessage('Quiero hacer un pedido')"
              />
              <Button
                label="Ubicacion"
                size="small"
                severity="secondary"
                outlined
                @click="setQuickMessage('Donde estan ubicados?')"
              />
              <Button
                label="Horario"
                size="small"
                severity="secondary"
                outlined
                @click="setQuickMessage('Cual es su horario de atencion?')"
              />
            </div>
          </template>
        </Card>
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
            Esta accion eliminara <strong>TODAS</strong> las conversaciones para el telefono
            <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ webhookConfig.phoneNumber }}</code>.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Esta accion no se puede deshacer.
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
.pharmacy-testing-page :deep(.p-card-content) {
  padding: 0;
}

.pharmacy-testing-page :deep(.p-card-header) {
  padding: 0;
}

.chat-card :deep(.p-card-body) {
  padding: 0;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Smooth scrolling for chat */
.chat-messages {
  scroll-behavior: smooth;
}

/* Progress bar customization */
:deep(.p-progressbar) {
  background: #e5e7eb;
}

:deep(.p-progressbar-value) {
  background: linear-gradient(to right, #22c55e, #16a34a);
}

/* Input focus states */
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
}

/* WhatsApp-style interactive buttons */
.whatsapp-buttons-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(37, 211, 102, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.whatsapp-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(37, 211, 102, 0.3);
}

.whatsapp-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 211, 102, 0.4);
  background: linear-gradient(135deg, #2EE370 0%, #15A085 100%);
}

.whatsapp-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.whatsapp-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6b7280;
  box-shadow: none;
}
</style>
