<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import type { PharmacyTestMessage } from '@/api/pharmacy.api'
import type { StreamMetadata, StreamButton, StreamListItem } from '@/composables/usePharmacyStream'

// Extended message type with metadata
interface ExtendedMessage extends PharmacyTestMessage {
  metadata?: StreamMetadata
}

const props = defineProps<{
  messages: ExtendedMessage[]
  selectedPharmacy: any
  pharmacies: any[]
  hasSession: boolean
  useStreaming: boolean
  isStreaming: boolean
  streamContent: string
  streamProgress: number
  currentPhase: string | null
  currentAgent: string | null
  streamMetadata: StreamMetadata
  isSending: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedPharmacy', value: any): void
  (e: 'copyChat'): void
  (e: 'buttonClick', button: StreamButton): void
  (e: 'listSelect', item: StreamListItem): void
}>()

const chatContainer = ref<HTMLElement | null>(null)

// Auto-scroll when streaming content changes
watch(() => props.streamContent, () => {
  scrollToBottom()
})

watch(() => props.messages.length, () => {
  scrollToBottom()
})

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Helpers
function formatTime(timestamp: string): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

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
                Sesión activa
              </span>
              <span v-else>Sin sesión</span>
              <span v-if="useStreaming" class="flex items-center gap-1">
                <i class="pi pi-bolt text-yellow-300" />
                Streaming
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Select
            :modelValue="selectedPharmacy"
            @update:modelValue="(v) => emit('update:selectedPharmacy', v)"
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
            @click="emit('copyChat')"
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
            <p class="text-lg font-medium">Inicia una conversación</p>
            <p class="text-sm mt-1">Escribe un mensaje o usa una acción rápida</p>
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
                    v-if="hasInteractiveButtons(msg) && idx === messages.length - 1"
                    class="whatsapp-buttons-container"
                  >
                    <button
                      v-for="btn in msg.metadata?.response_buttons"
                      :key="btn.id"
                      class="whatsapp-action-btn"
                      @click="emit('buttonClick', btn)"
                      :disabled="isStreaming || isSending"
                    >
                      {{ btn.titulo }}
                    </button>
                  </div>

                  <!-- Interactive List from metadata -->
                  <div
                    v-if="hasInteractiveList(msg) && idx === messages.length - 1"
                    class="mt-3 space-y-2"
                  >
                    <div
                      v-for="item in msg.metadata?.response_list_items"
                      :key="item.id"
                      class="p-2 bg-gray-50 dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                      @click="emit('listSelect', item)"
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
                    <template v-if="msg.metadata">
                      <Tag
                        v-if="msg.metadata?.bypass_matched"
                        value="Bypass"
                        severity="info"
                        class="text-xs"
                        style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
                      />
                      <Tag
                        v-if="msg.metadata?.domain"
                        :value="msg.metadata?.domain"
                        severity="secondary"
                        class="text-xs"
                        style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
                      />
                      <span
                        v-if="msg.metadata?.processing_time_ms"
                        class="text-xs text-gray-400 dark:text-gray-500"
                      >
                        {{ msg.metadata?.processing_time_ms }}ms
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
    </template>
  </Card>
</template>

<style scoped>
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

/* Progress bar customization */
:deep(.p-progressbar) {
  background: #e5e7eb;
}

:deep(.p-progressbar-value) {
  background: linear-gradient(to right, #22c55e, #16a34a);
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
