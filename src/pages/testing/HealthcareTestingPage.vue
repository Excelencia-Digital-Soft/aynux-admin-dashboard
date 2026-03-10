<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { useHealthcareTesting } from '@/composables/useHealthcareTesting'
import type { InteractiveButton, InteractiveListItem } from '@/types/chat.types'
import {
  RefreshCw, Send, Copy, Zap, Info, List,
  Network, Trash2, ChevronsUpDown, MessageSquare,
  Stethoscope
} from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

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
  copyChat,
  formatTime
} = useHealthcareTesting()

const chatContainer = ref<HTMLElement | null>(null)
const quickActionsOpen = ref(true)

const PHONE_PRESETS = [
  { label: 'Default', value: '5493446405060' },
  { label: 'Test 1', value: '5493446000001' },
  { label: 'Test 2', value: '5493446000002' }
]

const quickActions = [
  { label: 'Hola', message: 'Hola' },
  { label: 'Camas', message: 'Quiero ver las camas disponibles' },
  { label: 'Turno', message: 'Quiero sacar un turno' },
  { label: 'Internacion', message: 'Quiero consultar una internacion' },
  { label: 'Menu', message: 'menu' },
  { label: 'Ayuda', message: 'ayuda' },
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
  localStorage.removeItem('healthcare-webhook-config')
  updateWebhookConfig({
    enabled: true,
    phoneNumber: '5493446405060',
    userName: 'Test Paciente',
    did: null,
    simulateBypass: false,
    organizationId: null
  })
}

function linkifyText(text: string): string {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
}
</script>

<template>
  <div class="healthcare-testing-page p-4 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
          <Stethoscope class="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            Healthcare Testing
          </h1>
          <p class="text-sm text-muted-foreground">
            Prueba el agente de camas, turnos e internaciones (ZISMED)
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Badge v-if="hasSession" variant="info">{{ messageCount }}</Badge>
        <Button
          variant="ghost"
          size="icon"
          @click="clearSession"
          title="Limpiar sesion"
          :disabled="!hasSession"
        >
          <RefreshCw class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Panel -->
      <div class="lg:col-span-2">
        <Card class="overflow-hidden">
          <!-- Chat Header -->
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Stethoscope class="h-5 w-5" />
              </div>
              <div>
                <div class="font-semibold">Healthcare - ZISMED</div>
                <div class="text-xs text-teal-100 flex items-center gap-2">
                  <span v-if="hasSession" class="flex items-center gap-1">
                    <span class="w-2 h-2 bg-teal-300 rounded-full animate-pulse" />
                    Sesion activa
                  </span>
                  <span v-else>Sin sesion</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              title="Copiar chat"
              :disabled="messages.length === 0"
              class="text-white hover:bg-white/20"
              @click="copyChat"
            >
              <Copy class="h-4 w-4" />
            </Button>
          </div>

          <CardContent class="p-0">
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
                <div class="text-center text-muted-foreground">
                  <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <MessageSquare class="h-8 w-8" />
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
                    <div class="max-w-[75%] bg-teal-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
                      <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
                      <div class="text-xs text-teal-100 mt-1 text-right">
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

                        <!-- Interactive buttons -->
                        <div v-if="msg.buttons?.length && idx === messages.length - 1" class="healthcare-buttons-container">
                          <button
                            v-for="btn in msg.buttons"
                            :key="btn.id"
                            class="healthcare-action-btn"
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
                            <div v-if="item.descripcion" class="text-xs text-muted-foreground">
                              {{ item.descripcion }}
                            </div>
                          </div>
                        </div>

                        <!-- Metadata footer -->
                        <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                          <span class="text-xs text-muted-foreground">
                            {{ formatTime(msg.timestamp) }}
                          </span>
                          <Badge
                            v-if="msg.metadata?.bypass_matched"
                            variant="info"
                            class="text-[0.6rem] px-1.5 py-0"
                          >
                            Bypass
                          </Badge>
                          <Badge
                            v-if="msg.metadata?.domain"
                            variant="secondary"
                            class="text-[0.6rem] px-1.5 py-0"
                          >
                            {{ msg.metadata.domain }}
                          </Badge>
                          <span
                            v-if="msg.metadata?.processing_time_ms"
                            class="text-xs text-muted-foreground"
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
                      <span class="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                      <span class="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                      <span class="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input area -->
            <div class="p-4 border-t border-border">
              <div class="flex gap-2">
                <Textarea
                  v-model="inputMessage"
                  placeholder="Escribe tu mensaje..."
                  class="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  rows="1"
                  @keydown="handleKeydown"
                  :disabled="isSending"
                />
                <Button
                  @click="handleSend"
                  :disabled="!inputMessage.trim() || isSending"
                  class="bg-teal-500 border-teal-500 hover:bg-teal-600 text-white"
                >
                  <Send class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Debug Panel with Tabs -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="font-semibold text-sm">Panel de Debug</span>
            </div>

            <Tabs default-value="webhook">
              <TabsList class="w-full grid grid-cols-4">
                <TabsTrigger value="webhook" class="text-xs gap-1">
                  <Zap class="h-3 w-3" />
                  Webhook
                </TabsTrigger>
                <TabsTrigger value="session" class="text-xs gap-1">
                  <Info class="h-3 w-3" />
                  Sesion
                </TabsTrigger>
                <TabsTrigger value="steps" class="text-xs gap-1">
                  <List class="h-3 w-3" />
                  Pasos
                </TabsTrigger>
                <TabsTrigger value="state" class="text-xs gap-1">
                  <Network class="h-3 w-3" />
                  Estado
                </TabsTrigger>
              </TabsList>

              <!-- Webhook Config -->
              <TabsContent value="webhook">
                <div class="space-y-4 pt-2">
                  <div class="flex items-center justify-between">
                    <Alert variant="info" class="flex-1">
                      <AlertDescription class="text-sm">
                        Simula el flujo de WhatsApp para
                        <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">Healthcare</code>.
                      </AlertDescription>
                    </Alert>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="ml-2 h-8 w-8"
                      title="Limpiar config guardada"
                      @click="clearWebhookConfig"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <!-- Toggle -->
                  <div class="flex items-center gap-3">
                    <Checkbox
                      :checked="webhookConfig.enabled"
                      @update:checked="(val: boolean) => updateWebhookConfig({ enabled: val })"
                    />
                    <label class="font-medium cursor-pointer text-sm" @click="updateWebhookConfig({ enabled: !webhookConfig.enabled })">
                      Activar Modo Webhook
                    </label>
                  </div>

                  <!-- Config (visible cuando activo) -->
                  <div v-if="webhookConfig.enabled" class="space-y-3 pl-4 border-l-2 border-teal-300 ml-2">
                    <div>
                      <label class="text-sm text-muted-foreground block mb-1">Telefono simulado</label>
                      <div class="flex gap-2">
                        <Input
                          :model-value="webhookConfig.phoneNumber"
                          @input="(e: Event) => updateWebhookConfig({ phoneNumber: (e.target as HTMLInputElement).value })"
                          class="flex-1"
                          placeholder="5493446405060"
                          :disabled="hasSession"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          class="h-9 w-9"
                          @click="handleResetPhone"
                          :disabled="hasSession || isDefaultPhone"
                          title="Restaurar default"
                        >
                          <RefreshCw class="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <!-- Phone Presets -->
                      <div class="flex flex-wrap gap-1 mt-2">
                        <Badge
                          v-for="preset in PHONE_PRESETS"
                          :key="preset.value"
                          :variant="webhookConfig.phoneNumber === preset.value ? 'success' : 'secondary'"
                          :class="`cursor-pointer text-xs ${hasSession ? 'opacity-50' : ''}`"
                          @click="selectPreset(preset.value)"
                        >
                          {{ preset.label }}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label class="text-sm text-muted-foreground block mb-1">Nombre usuario</label>
                      <Input
                        :model-value="webhookConfig.userName"
                        @input="(e: Event) => updateWebhookConfig({ userName: (e.target as HTMLInputElement).value })"
                        class="w-full"
                        placeholder="Test Paciente"
                        :disabled="hasSession"
                      />
                    </div>

                    <div>
                      <label class="text-sm text-muted-foreground block mb-1">Dominio</label>
                      <div class="flex items-center gap-2">
                        <Badge variant="info">Healthcare</Badge>
                        <span class="text-xs text-muted-foreground">(ZISMED)</span>
                      </div>
                    </div>

                    <!-- Toggle: Simular Bypass Rules -->
                    <div class="flex items-center gap-3 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <Checkbox
                        :checked="webhookConfig.simulateBypass"
                        @update:checked="(val: boolean) => updateWebhookConfig({ simulateBypass: val })"
                      />
                      <div @click="updateWebhookConfig({ simulateBypass: !webhookConfig.simulateBypass })" class="cursor-pointer">
                        <label class="font-medium cursor-pointer text-sm">Simular Bypass Rules</label>
                        <small class="block text-muted-foreground">
                          Usa bypass rules para auto-poblar phone/DID
                        </small>
                      </div>
                    </div>

                    <!-- Bypass Rules Section -->
                    <div v-if="webhookConfig.simulateBypass" class="space-y-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                      <div>
                        <label class="text-sm text-muted-foreground block mb-1">DID (Bot Phone)</label>
                        <Input
                          :model-value="webhookConfig.did || ''"
                          @input="(e: Event) => updateWebhookConfig({ did: (e.target as HTMLInputElement).value || null })"
                          class="w-full"
                          placeholder="5493446405060"
                          :disabled="hasSession"
                        />
                        <small class="text-muted-foreground text-xs">
                          Numero del bot para bypass rules tipo whatsapp_phone_number_id
                        </small>
                      </div>
                    </div>

                    <!-- Manual Overrides -->
                    <div v-if="!webhookConfig.simulateBypass" class="space-y-3 p-3 bg-muted/50 rounded-lg">
                      <p class="text-xs text-muted-foreground font-medium">Overrides manuales (opcional)</p>
                      <div>
                        <label class="text-sm text-muted-foreground block mb-1">Organization ID</label>
                        <Input
                          :model-value="webhookConfig.organizationId || ''"
                          @input="(e: Event) => updateWebhookConfig({ organizationId: (e.target as HTMLInputElement).value || null })"
                          class="w-full"
                          placeholder="UUID de organizacion"
                          :disabled="hasSession"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <!-- Session Info -->
              <TabsContent value="session">
                <div class="space-y-4 pt-2">
                  <div>
                    <label class="block text-sm font-medium text-muted-foreground">Session ID</label>
                    <code class="text-xs break-all bg-muted px-2 py-1 rounded block mt-1">
                      {{ sessionId || 'N/A' }}
                    </code>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-muted-foreground">Telefono</label>
                    <code class="text-xs break-all bg-muted px-2 py-1 rounded block mt-1">
                      {{ webhookConfig.phoneNumber }}
                    </code>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-muted-foreground">Mensajes</label>
                    <Badge variant="info" class="mt-1">{{ messageCount }} mensajes</Badge>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-muted-foreground">Dominio</label>
                    <Badge variant="info" class="mt-1">healthcare</Badge>
                  </div>
                </div>
              </TabsContent>

              <!-- Execution Steps -->
              <TabsContent value="steps">
                <div v-if="executionSteps.length === 0" class="text-center text-muted-foreground py-4">
                  <List class="h-6 w-6 mx-auto mb-2" />
                  <p class="text-sm">Sin pasos de ejecucion</p>
                </div>

                <div v-else class="space-y-2 max-h-64 overflow-y-auto pt-2">
                  <div
                    v-for="(step, idx) in executionSteps"
                    :key="idx"
                    class="p-2 bg-muted/50 rounded text-xs"
                  >
                    <pre class="overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
                  </div>
                </div>
              </TabsContent>

              <!-- Graph State -->
              <TabsContent value="state">
                <div v-if="!graphState" class="text-center text-muted-foreground py-4">
                  <Network class="h-6 w-6 mx-auto mb-2" />
                  <p class="text-sm">Sin estado de grafo</p>
                </div>

                <div v-else class="max-h-64 overflow-y-auto pt-2">
                  <pre class="text-xs bg-muted/50 p-2 rounded">{{
                    JSON.stringify(graphState, null, 2)
                  }}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <!-- Quick Actions -->
        <Collapsible v-model:open="quickActionsOpen">
          <Card>
            <CardContent class="p-4">
              <CollapsibleTrigger as-child>
                <button class="flex items-center justify-between w-full text-left">
                  <span class="font-semibold text-sm">Acciones Rapidas</span>
                  <ChevronsUpDown class="h-4 w-4 text-muted-foreground" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div class="flex flex-wrap gap-2 mt-3">
                  <Button
                    v-for="action in quickActions"
                    :key="action.label"
                    variant="outline"
                    size="sm"
                    @click="setQuickMessage(action.message)"
                  >
                    {{ action.label }}
                  </Button>
                </div>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  </div>
</template>

<style scoped>
.healthcare-testing-page {
  min-height: calc(100vh - 8rem);
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

/* Healthcare-style interactive buttons */
.healthcare-buttons-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(20, 184, 166, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.healthcare-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(20, 184, 166, 0.3);
}

.healthcare-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(20, 184, 166, 0.4);
  background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
}

.healthcare-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.healthcare-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6b7280;
  box-shadow: none;
}

/* Message link styles */
:deep(.message-link) {
  color: #14b8a6;
  text-decoration: underline;
  word-break: break-all;
  transition: color 0.2s ease;
}

:deep(.message-link:hover) {
  color: #0d9488;
}

.dark-mode :deep(.message-link) {
  color: #5eead4;
}

.dark-mode :deep(.message-link:hover) {
  color: #99f6e4;
}

code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
