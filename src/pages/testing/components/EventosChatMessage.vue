<script setup lang="ts">
import type { EventosTestMessage } from '@/composables/useEventosTesting'
import type { InteractiveButton, InteractiveListItem } from '@/types/chat.types'
import { FileText, List } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

defineProps<{
  message: EventosTestMessage
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
    <div class="max-w-[75%] bg-amber-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
      <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
      <div class="text-xs text-amber-100 mt-1 text-right">
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
        <div v-if="message.documentUrl" class="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
          <a
            :href="message.documentUrl"
            target="_blank"
            class="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline"
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
        <div v-if="message.buttons?.length && isLastMessage" class="eventos-buttons-container">
          <button
            v-for="btn in message.buttons"
            :key="btn.id"
            class="eventos-action-btn"
            @click="emit('button-click', btn)"
            :disabled="isSending"
          >
            {{ btn.titulo }}
          </button>
        </div>

        <!-- Interactive list trigger -->
        <div v-if="message.listItems?.length && isLastMessage" class="eventos-buttons-container">
          <button
            class="eventos-list-trigger"
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
/* Eventos-style interactive buttons */
.eventos-buttons-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eventos-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.eventos-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.eventos-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.eventos-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6b7280;
  box-shadow: none;
}

/* Eventos-style list trigger button */
.eventos-list-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(245, 158, 11, 0.5);
  border-radius: 1.25rem;
  background: transparent;
  color: #f59e0b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.eventos-list-trigger:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.08);
  border-color: #f59e0b;
}

.eventos-list-trigger:active:not(:disabled) {
  background: rgba(245, 158, 11, 0.15);
}

.eventos-list-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Message link styles */
:deep(.message-link) {
  color: #f59e0b;
  text-decoration: underline;
  word-break: break-all;
  transition: color 0.2s ease;
}

:deep(.message-link:hover) {
  color: #d97706;
}

.dark-mode :deep(.message-link) {
  color: #fbbf24;
}

.dark-mode :deep(.message-link:hover) {
  color: #fde68a;
}
</style>
