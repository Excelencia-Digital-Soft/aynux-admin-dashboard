<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useEnavTesting } from '@/composables/useEnavTesting'
import type { EnavWebhookConfig } from '@/composables/useEnavTesting'
import type { InteractiveButton, InteractiveListItem } from '@/types/chat.types'
import {
  RefreshCw, Send, FileText, ChevronsUpDown, MessageSquare
} from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Copy } from 'lucide-vue-next'

import EnavChatMessage from './components/EnavChatMessage.vue'
import EnavDebugPanel from './components/EnavDebugPanel.vue'

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
} = useEnavTesting()

const chatContainer = ref<HTMLElement | null>(null)
const quickActionsOpen = ref(true)
const listDrawerOpen = ref(false)
const activeListItems = ref<InteractiveListItem[]>([])

const quickActions = [
  { label: 'Descargar DDJJ', message: 'Quiero descargar mi DDJJ' },
  { label: 'Consultar CIU', message: 'Necesito mi CIU' },
  { label: 'Comprobante pesada', message: 'Necesito un comprobante de pesada' },
  { label: 'Hola', message: 'Hola' }
]

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

function openListDrawer(items: InteractiveListItem[]) {
  activeListItems.value = items
  listDrawerOpen.value = true
}

async function handleDrawerListSelect(item: InteractiveListItem) {
  listDrawerOpen.value = false
  await handleListSelect(item)
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

function handleUpdateConfig(updates: Partial<EnavWebhookConfig>) {
  updateWebhookConfig(updates)
}
</script>

<template>
  <div class="enav-testing-page p-4 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <FileText class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            ENAV Testing
          </h1>
          <p class="text-sm text-muted-foreground">
            Prueba el agente de DDJJ / CIU para vinateros
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
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <FileText class="h-5 w-5" />
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
                <EnavChatMessage
                  v-for="(msg, idx) in messages"
                  :key="msg.id"
                  :message="msg"
                  :is-last-message="idx === messages.length - 1"
                  :is-sending="isSending"
                  :format-time="formatTime"
                  @button-click="handleButtonClick"
                  @open-list="openListDrawer"
                />

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
                  class="bg-purple-500 border-purple-500 hover:bg-purple-600 text-white"
                >
                  <Send class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- List Items Bottom Drawer -->
        <Sheet v-model:open="listDrawerOpen">
          <SheetContent side="bottom" class="!h-auto !max-h-[60vh] rounded-t-2xl">
            <SheetHeader class="pb-3 border-b border-border">
              <SheetTitle class="text-base font-semibold">Opciones</SheetTitle>
            </SheetHeader>
            <SheetDescription class="sr-only">Selecciona una opcion de la lista</SheetDescription>
            <div class="overflow-y-auto flex-1 py-2 space-y-1">
              <button
                v-for="item in activeListItems"
                :key="item.id"
                class="w-full text-left p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex flex-col gap-0.5"
                @click="handleDrawerListSelect(item)"
              >
                <span class="font-medium text-sm text-foreground">{{ item.titulo }}</span>
                <span v-if="item.descripcion" class="text-xs text-muted-foreground">
                  {{ item.descripcion }}
                </span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <EnavDebugPanel
          :webhook-config="webhookConfig"
          :has-session="hasSession"
          :session-id="sessionId"
          :message-count="messageCount"
          :execution-steps="executionSteps"
          :graph-state="graphState"
          @update-config="handleUpdateConfig"
          @clear-config="clearWebhookConfig"
        />

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
.enav-testing-page {
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

code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
