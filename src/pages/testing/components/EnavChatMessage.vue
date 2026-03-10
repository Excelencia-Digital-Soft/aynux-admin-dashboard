<script setup lang="ts">
import type { EnavTestMessage } from '@/composables/useEnavTesting'
import type { InteractiveButton, InteractiveListItem } from '@/types/chat.types'
import { FileText, List } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

defineProps<{
  message: EnavTestMessage
  isLastMessage: boolean
  isSending: boolean
  formatTime: (timestamp: string) => string
}>()

const emit = defineEmits<{
  'button-click': [button: InteractiveButton]
  'open-list': [items: InteractiveListItem[]]
}>()

function linkifyText(text: string): string {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
}
</script>

<template>
  <!-- User Message -->
  <div v-if="message.role === 'user'" class="flex justify-end">
    <div class="max-w-[75%] bg-purple-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
      <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
      <div class="text-xs text-purple-100 mt-1 text-right">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>

  <!-- Assistant Message -->
  <div v-else class="flex justify-start">
    <div class="max-w-[80%]">
      <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600">
        <p
          class="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100"
          v-html="linkifyText(message.content)"
        />

        <!-- Document link -->
        <div v-if="message.documentUrl" class="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <a
            :href="message.documentUrl"
            target="_blank"
            class="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
          >
            <FileText class="h-4 w-4" />
            <span>{{ message.documentCaption || 'Descargar PDF' }}</span>
          </a>
        </div>

        <!-- Analytics chart image -->
        <div v-if="message.imageUrl" class="mt-3">
          <a :href="message.imageUrl" target="_blank" rel="noopener noreferrer">
            <img
              :src="message.imageUrl"
              :alt="message.imageCaption || 'Grafico de estadisticas'"
              class="w-full rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
        </div>

        <!-- Interactive buttons -->
        <div v-if="message.buttons?.length && isLastMessage" class="enav-buttons-container">
          <button
            v-for="btn in message.buttons"
            :key="btn.id"
            class="enav-action-btn"
            @click="emit('button-click', btn)"
            :disabled="isSending"
          >
            {{ btn.titulo }}
          </button>
        </div>

        <!-- Interactive list trigger -->
        <div v-if="message.listItems?.length && isLastMessage" class="enav-buttons-container">
          <button
            class="enav-list-trigger"
            @click="emit('open-list', message.listItems!)"
            :disabled="isSending"
          >
            <List class="h-4 w-4" />
            Opciones
          </button>
        </div>

        <!-- Metadata footer -->
        <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          <span class="text-xs text-muted-foreground">
            {{ formatTime(message.timestamp) }}
          </span>
          <Badge
            v-if="message.metadata?.bypass_matched"
            variant="info"
            class="text-[0.6rem] px-1.5 py-0"
          >
            Bypass
          </Badge>
          <Badge
            v-if="message.metadata?.domain"
            variant="secondary"
            class="text-[0.6rem] px-1.5 py-0"
          >
            {{ message.metadata.domain }}
          </Badge>
          <span
            v-if="message.metadata?.processing_time_ms"
            class="text-xs text-muted-foreground"
          >
            {{ message.metadata.processing_time_ms }}ms
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

/* ENAV-style list trigger button */
.enav-list-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(168, 85, 247, 0.5);
  border-radius: 1.25rem;
  background: transparent;
  color: #a855f7;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.enav-list-trigger:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.08);
  border-color: #a855f7;
}

.enav-list-trigger:active:not(:disabled) {
  background: rgba(168, 85, 247, 0.15);
}

.enav-list-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>
