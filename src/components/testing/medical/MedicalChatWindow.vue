<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import type { MedicalTestMessage, Institution, InteractiveButton, InteractiveListItem } from '@/api/medical.api'

const props = defineProps<{
  messages: MedicalTestMessage[]
  selectedInstitution: Institution | null
  institutions: Institution[]
  hasSession: boolean
  isSending: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedInstitution', value: Institution | null): void
  (e: 'copyChat'): void
  (e: 'buttonClick', button: InteractiveButton): void
  (e: 'listSelect', item: InteractiveListItem): void
}>()

const chatContainer = ref<HTMLElement | null>(null)

watch(() => props.messages.length, () => {
  scrollToBottom()
})

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function formatTime(timestamp: string): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function hasInteractiveButtons(msg: MedicalTestMessage): boolean {
  return msg.responseType === 'buttons' &&
    (msg.buttons?.length ?? 0) > 0
}

function hasInteractiveList(msg: MedicalTestMessage): boolean {
  return msg.responseType === 'list' &&
    (msg.listItems?.length ?? 0) > 0
}

function linkifyText(text: string): string {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
}
</script>

<template>
  <Card class="chat-card overflow-hidden">
    <template #header>
      <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i class="pi pi-calendar-plus text-xl" />
          </div>
          <div>
            <div class="font-semibold">
              {{ selectedInstitution?.name || 'Seleccionar Institucion' }}
            </div>
            <div class="text-xs text-blue-100 flex items-center gap-2">
              <span v-if="hasSession" class="flex items-center gap-1">
                <span class="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                Sesion activa
              </span>
              <span v-else>Sin sesion</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Select
            :modelValue="selectedInstitution"
            @update:modelValue="(v) => emit('update:selectedInstitution', v)"
            :options="institutions"
            optionLabel="name"
            placeholder="Institucion"
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
          v-if="messages.length === 0 && !isSending"
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
              <div class="max-w-[75%] bg-blue-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
                <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
                <div class="text-xs text-blue-100 mt-1 text-right">
                  {{ formatTime(msg.timestamp) }}
                </div>
              </div>
            </div>

            <!-- Assistant Message -->
            <div v-else class="flex justify-start">
              <div class="max-w-[80%]">
                <!-- Message bubble -->
                <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600">
                  <p
                    class="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100"
                    v-html="linkifyText(msg.content)"
                  />

                  <!-- Interactive Buttons -->
                  <div
                    v-if="hasInteractiveButtons(msg) && idx === messages.length - 1"
                    class="whatsapp-buttons-container"
                  >
                    <button
                      v-for="btn in msg.buttons"
                      :key="btn.id"
                      class="whatsapp-action-btn"
                      @click="emit('buttonClick', btn)"
                      :disabled="isSending"
                    >
                      {{ btn.titulo }}
                    </button>
                  </div>

                  <!-- Interactive List -->
                  <div
                    v-if="hasInteractiveList(msg) && idx === messages.length - 1"
                    class="mt-3 space-y-2"
                  >
                    <div
                      v-for="item in msg.listItems"
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
                        :value="String(msg.metadata?.domain)"
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

          <!-- Typing indicator -->
          <div v-if="isSending" class="flex justify-start">
            <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm">
              <div class="flex gap-1">
                <span class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                <span class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                <span class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
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

/* WhatsApp-style interactive buttons */
.whatsapp-buttons-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(59, 130, 246, 0.3);
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
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.whatsapp-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
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

/* Message link styles */
:deep(.message-link) {
  color: #3b82f6;
  text-decoration: underline;
  word-break: break-all;
  transition: color 0.2s ease;
}

:deep(.message-link:hover) {
  color: #2563eb;
  text-decoration: underline;
}

.dark-mode :deep(.message-link) {
  color: #60a5fa;
}

.dark-mode :deep(.message-link:hover) {
  color: #93c5fd;
}
</style>
