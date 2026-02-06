<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Badge from 'primevue/badge'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import { useEnavTesting } from '@/composables/useEnavTesting'
import type { InteractiveButton, InteractiveListItem } from '@/types/chat.types'

const {
  isSending,
  sessionId,
  messages,
  inputMessage,
  executionSteps,
  graphState,
  webhookConfig,
  hasSession,
  messageCount,
  sendMessage,
  sendButtonResponse,
  sendListResponse,
  clearSession,
  updateWebhookConfig,
  setQuickMessage,
  formatTime
} = useEnavTesting()

const chatContainer = ref<HTMLElement | null>(null)

// Phone presets for ENAV
const PHONE_PRESETS = [
  { label: 'Default', value: '5493446405060' },
  { label: 'Test 1', value: '5493446000001' },
  { label: 'Test 2', value: '5493446000002' }
]

// Quick action messages
const quickActions = [
  { label: 'Descargar DDJJ', message: 'Quiero descargar mi DDJJ' },
  { label: 'Consultar CIU', message: 'Necesito mi CIU' },
  { label: 'Comprobante pesada', message: 'Necesito un comprobante de pesada' },
  { label: 'Hola', message: 'Hola' }
]

const isDefaultPhone = computed(() => webhookConfig.value.phoneNumber === '5493446405060')

async function handleSend() {
  await sendMessage()
  await nextTick()
  scrollToBottom()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function handleButtonClick(button: InteractiveButton) {
  await sendButtonResponse(button)
  await nextTick()
  scrollToBottom()
}

async function handleListSelect(item: InteractiveListItem) {
  await sendListResponse(item)
  await nextTick()
  scrollToBottom()
}

function selectPreset(value: string) {
  if (!hasSession.value) {
    updateWebhookConfig({ phoneNumber: value })
  }
}

function handleResetPhone() {
  if (!hasSession.value) {
    updateWebhookConfig({ phoneNumber: '5493446405060' })
  }
}

function clearWebhookConfig() {
  localStorage.removeItem('enav-webhook-config')
  updateWebhookConfig({
    enabled: true,
    phoneNumber: '5493446405060',
    userName: 'Test Vinatero',
    did: null,
    simulateBypass: false,
    organizationId: null
  })
}

// Linkify URLs in text content
function linkifyText(text: string): string {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
}
</script>

<template>
  <div class="enav-testing-page p-4 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <i class="pi pi-file-pdf text-2xl text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-surface-800 dark:text-surface-100">
            ENAV Testing
          </h1>
          <p class="text-sm text-surface-500 dark:text-surface-400">
            Prueba el agente de DDJJ / CIU para vinateros
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Badge v-if="hasSession" :value="messageCount" severity="info" />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          @click="clearSession"
          v-tooltip.bottom="'Limpiar sesion'"
          :disabled="!hasSession"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Panel -->
      <div class="lg:col-span-2">
        <Card class="chat-card overflow-hidden">
          <template #header>
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <i class="pi pi-file-pdf text-xl" />
                </div>
                <div>
                  <div class="font-semibold">ENAV - Vinateros</div>
                  <div class="text-xs text-purple-100 flex items-center gap-2">
                    <span v-if="hasSession" class="flex items-center gap-1">
                      <span class="w-2 h-2 bg-purple-300 rounded-full animate-pulse" />
                      Sesion activa
                    </span>
                    <span v-else>Sin sesion</span>
                  </div>
                </div>
              </div>
              <Button
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                v-tooltip.bottom="'Copiar chat'"
                :disabled="messages.length === 0"
                class="text-white hover:bg-white/20"
              />
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
                v-if="messages.length === 0"
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
                    <div class="max-w-[75%] bg-purple-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
                      <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
                      <div class="text-xs text-purple-100 mt-1 text-right">
                        {{ formatTime(msg.timestamp) }}
                      </div>
                    </div>
                  </div>

                  <!-- Assistant Message -->
                  <div v-else class="flex justify-start">
                    <div class="max-w-[80%]">
                      <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600">
                        <p
                          class="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100"
                          v-html="linkifyText(msg.content)"
                        />

                        <!-- Document link -->
                        <div v-if="msg.documentUrl" class="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                          <a
                            :href="msg.documentUrl"
                            target="_blank"
                            class="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            <i class="pi pi-file-pdf text-lg" />
                            <span>{{ msg.documentCaption || 'Descargar PDF' }}</span>
                            <i class="pi pi-external-link text-xs" />
                          </a>
                        </div>

                        <!-- Interactive buttons -->
                        <div v-if="msg.buttons?.length && idx === messages.length - 1" class="enav-buttons-container">
                          <button
                            v-for="btn in msg.buttons"
                            :key="btn.id"
                            class="enav-action-btn"
                            @click="handleButtonClick(btn)"
                            :disabled="isSending"
                          >
                            {{ btn.titulo }}
                          </button>
                        </div>

                        <!-- Interactive list items -->
                        <div v-if="msg.listItems?.length && idx === messages.length - 1" class="mt-3 space-y-2">
                          <div
                            v-for="item in msg.listItems"
                            :key="item.id"
                            class="p-2 bg-gray-50 dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                            @click="handleListSelect(item)"
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
                          <Tag
                            v-if="msg.metadata?.bypass_matched"
                            value="Bypass"
                            severity="info"
                            class="text-xs"
                            style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
                          />
                          <Tag
                            v-if="msg.metadata?.domain"
                            :value="String(msg.metadata.domain)"
                            severity="secondary"
                            class="text-xs"
                            style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
                          />
                          <span
                            v-if="msg.metadata?.processing_time_ms"
                            class="text-xs text-gray-400 dark:text-gray-500"
                          >
                            {{ msg.metadata.processing_time_ms }}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Loading indicator -->
                <div v-if="isSending" class="flex justify-start">
                  <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm">
                    <div class="flex gap-1">
                      <span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                      <span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                      <span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input area -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex gap-2">
                <Textarea
                  v-model="inputMessage"
                  placeholder="Escribe tu mensaje..."
                  class="flex-1"
                  :autoResize="true"
                  rows="1"
                  @keydown="handleKeydown"
                  :disabled="isSending"
                />
                <Button
                  icon="pi pi-send"
                  @click="handleSend"
                  :loading="isSending"
                  :disabled="!inputMessage.trim()"
                  class="bg-purple-500 border-purple-500 hover:bg-purple-600"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Debug Panel with Tabs -->
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
              </TabList>

              <TabPanels>
                <!-- Webhook Config -->
                <TabPanel value="0">
                  <div class="webhook-panel p-3">
                    <div class="flex items-center justify-between mb-4">
                      <Message severity="info" :closable="false" class="flex-1">
                        <template #default>
                          <div class="text-sm">
                            Simula el flujo de WhatsApp para
                            <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">ENAV</code>.
                          </div>
                        </template>
                      </Message>
                      <Button
                        icon="pi pi-trash"
                        severity="secondary"
                        text
                        size="small"
                        v-tooltip.top="'Limpiar config guardada'"
                        @click="clearWebhookConfig"
                        class="ml-2"
                      />
                    </div>

                    <div class="space-y-4">
                      <!-- Toggle -->
                      <div class="flex items-center gap-3">
                        <Checkbox
                          :modelValue="webhookConfig.enabled"
                          @update:modelValue="(val: boolean) => updateWebhookConfig({ enabled: val })"
                          :binary="true"
                        />
                        <label class="font-medium cursor-pointer" @click="updateWebhookConfig({ enabled: !webhookConfig.enabled })">
                          Activar Modo Webhook
                        </label>
                      </div>

                      <!-- Config (visible cuando activo) -->
                      <div v-if="webhookConfig.enabled" class="space-y-3 pl-4 border-l-2 border-purple-300 ml-2">
                        <div>
                          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Telefono simulado</label>
                          <div class="flex gap-2">
                            <InputText
                              :modelValue="webhookConfig.phoneNumber"
                              @input="(e: Event) => updateWebhookConfig({ phoneNumber: (e.target as HTMLInputElement).value })"
                              class="flex-1"
                              placeholder="5493446405060"
                              :disabled="hasSession"
                            />
                            <Button
                              icon="pi pi-refresh"
                              severity="secondary"
                              size="small"
                              @click="handleResetPhone"
                              :disabled="hasSession || isDefaultPhone"
                              v-tooltip.top="'Restaurar default'"
                            />
                          </div>

                          <!-- Phone Presets -->
                          <div class="flex flex-wrap gap-1 mt-2">
                            <Tag
                              v-for="preset in PHONE_PRESETS"
                              :key="preset.value"
                              :value="preset.label"
                              :severity="webhookConfig.phoneNumber === preset.value ? 'success' : 'secondary'"
                              class="cursor-pointer text-xs"
                              :class="{ 'opacity-50': hasSession }"
                              @click="selectPreset(preset.value)"
                            />
                          </div>
                        </div>

                        <div>
                          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Nombre usuario</label>
                          <InputText
                            :modelValue="webhookConfig.userName"
                            @input="(e: Event) => updateWebhookConfig({ userName: (e.target as HTMLInputElement).value })"
                            class="w-full"
                            placeholder="Test Vinatero"
                            :disabled="hasSession"
                          />
                        </div>

                        <div>
                          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Dominio</label>
                          <div class="flex items-center gap-2">
                            <Tag value="ENAV" severity="info" />
                            <span class="text-xs text-gray-500 dark:text-gray-400">(DDJJ/CIU)</span>
                          </div>
                        </div>

                        <!-- Toggle: Simular Bypass Rules -->
                        <div class="flex items-center gap-3 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <Checkbox
                            :modelValue="webhookConfig.simulateBypass"
                            @update:modelValue="(val: boolean) => updateWebhookConfig({ simulateBypass: val })"
                            :binary="true"
                          />
                          <div @click="updateWebhookConfig({ simulateBypass: !webhookConfig.simulateBypass })" class="cursor-pointer">
                            <label class="font-medium cursor-pointer">Simular Bypass Rules</label>
                            <small class="block text-gray-500 dark:text-gray-400">
                              Usa bypass rules para auto-poblar phone/DID
                            </small>
                          </div>
                        </div>

                        <!-- Bypass Rules Section -->
                        <div v-if="webhookConfig.simulateBypass" class="space-y-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div>
                            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">DID (Bot Phone)</label>
                            <InputText
                              :modelValue="webhookConfig.did || ''"
                              @input="(e: Event) => updateWebhookConfig({ did: (e.target as HTMLInputElement).value || null })"
                              class="w-full"
                              placeholder="5493446405060"
                              :disabled="hasSession"
                            />
                            <small class="text-gray-400 dark:text-gray-500 text-xs">
                              Numero del bot para bypass rules tipo whatsapp_phone_number_id
                            </small>
                          </div>
                        </div>

                        <!-- Manual Overrides -->
                        <div v-if="!webhookConfig.simulateBypass" class="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Overrides manuales (opcional)</p>
                          <div>
                            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Organization ID</label>
                            <InputText
                              :modelValue="webhookConfig.organizationId || ''"
                              @input="(e: Event) => updateWebhookConfig({ organizationId: (e.target as HTMLInputElement).value || null })"
                              class="w-full"
                              placeholder="UUID de organizacion"
                              :disabled="hasSession"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes</label>
                      <Tag :value="`${messageCount} mensajes`" severity="info" class="mt-1" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Dominio</label>
                      <Tag value="enav" severity="info" class="mt-1" />
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
                  <div v-if="!graphState" class="text-center text-gray-400 dark:text-gray-500 py-4">
                    <i class="pi pi-sitemap text-2xl mb-2" />
                    <p class="text-sm">Sin estado de grafo</p>
                  </div>

                  <div v-else class="max-h-64 overflow-y-auto p-3">
                    <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">{{
                      JSON.stringify(graphState, null, 2)
                    }}</pre>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </template>
        </Card>

        <!-- Quick Actions -->
        <Panel header="Acciones Rapidas" toggleable>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="action in quickActions"
              :key="action.label"
              :label="action.label"
              size="small"
              severity="secondary"
              outlined
              @click="setQuickMessage(action.message)"
            />
          </div>
        </Panel>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enav-testing-page {
  min-height: calc(100vh - 8rem);
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

.chat-messages {
  scroll-behavior: smooth;
}

/* ENAV-style interactive buttons */
.enav-buttons-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(168, 85, 247, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.enav-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(168, 85, 247, 0.3);
}

.enav-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, #b76df8 0%, #8b5cf6 100%);
}

.enav-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.enav-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6b7280;
  box-shadow: none;
}

/* Message link styles */
:deep(.message-link) {
  color: #a855f7;
  text-decoration: underline;
  word-break: break-all;
  transition: color 0.2s ease;
}

:deep(.message-link:hover) {
  color: #9333ea;
}

.dark-mode :deep(.message-link) {
  color: #c084fc;
}

.dark-mode :deep(.message-link:hover) {
  color: #d8b4fe;
}

.webhook-panel {
  background: var(--surface-card);
}

code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
