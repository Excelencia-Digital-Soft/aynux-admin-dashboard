<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { marked } from 'marked'
import type { ConversationMessage } from '@/types/chat.types'

import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  readonly?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  maxHeight: '500px'
})

const emit = defineEmits<{
  (e: 'send', message: string): void
  (e: 'messageClick', message: ConversationMessage): void
}>()

const store = useChatStore()
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const messages = computed(() => store.currentMessages)
const isLoading = computed(() => store.isLoading)
const isStreaming = computed(() => store.isStreaming)
const streamingContent = computed(() => store.streamingContent)

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function renderMarkdown(content: string): string {
  try {
    return marked(content) as string
  } catch {
    return content
  }
}

function handleSend() {
  const message = messageInput.value.trim()
  if (!message || isLoading.value) return

  emit('send', message)
  messageInput.value = ''
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Auto-scroll when new messages arrive
watch(() => messages.value.length, scrollToBottom)
watch(() => streamingContent.value, scrollToBottom)
</script>

<template>
  <div class="conversation-history">
    <!-- Messages list -->
    <div
      ref="messagesContainer"
      class="messages-container"
      :style="{ maxHeight }"
    >
      <!-- Empty state -->
      <div v-if="messages.length === 0 && !isStreaming" class="empty-state">
        <i class="pi pi-comments text-4xl text-gray-300" />
        <p class="text-gray-400 mt-2">Inicia una conversacion</p>
        <p class="text-gray-300 text-sm">Escribe un mensaje para probar el agente</p>
      </div>

      <!-- Messages -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="[`message-${message.role}`]"
        @click="emit('messageClick', message)"
      >
        <div class="message-header">
          <span class="message-role">
            <i :class="message.role === 'user' ? 'pi pi-user' : 'pi pi-android'" />
            {{ message.role === 'user' ? 'Usuario' : 'Agente' }}
          </span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div
          class="message-content prose prose-sm max-w-none"
          v-html="renderMarkdown(message.content)"
        />
        <div v-if="message.metadata" class="message-metadata">
          <span v-if="message.metadata.tokens" class="metadata-item">
            <i class="pi pi-chart-bar" />
            {{ message.metadata.tokens }} tokens
          </span>
          <span v-if="message.metadata.latency_ms" class="metadata-item">
            <i class="pi pi-clock" />
            {{ message.metadata.latency_ms }}ms
          </span>
        </div>
      </div>

      <!-- Streaming message -->
      <div v-if="isStreaming" class="message message-assistant streaming">
        <div class="message-header">
          <span class="message-role">
            <i class="pi pi-android" />
            Agente
          </span>
          <ProgressSpinner
            style="width: 16px; height: 16px"
            strokeWidth="4"
          />
        </div>
        <div
          class="message-content prose prose-sm max-w-none"
          v-html="renderMarkdown(streamingContent || '...')"
        />
      </div>
    </div>

    <!-- Input area -->
    <div v-if="!readonly" class="input-area">
      <Textarea
        v-model="messageInput"
        placeholder="Escribe un mensaje..."
        :disabled="isLoading"
        :autoResize="true"
        rows="1"
        class="message-input"
        @keydown="handleKeydown"
      />
      <Button
        icon="pi pi-send"
        :disabled="!messageInput.trim() || isLoading"
        :loading="isLoading"
        @click="handleSend"
        class="send-button"
      />
    </div>
  </div>
</template>

<style scoped>
.conversation-history {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.message {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.message:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.message-user .message-role,
.message-user .message-time,
.message-user .metadata-item {
  color: rgba(255, 255, 255, 0.8);
}

.message-assistant {
  align-self: flex-start;
  background: #f1f5f9;
  color: #1e293b;
}

.message-system {
  align-self: center;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.875rem;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
}

.message-role {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
}

.message-time {
  color: #9ca3af;
}

.message-content {
  line-height: 1.5;
}

.message-content :deep(p) {
  margin: 0;
}

.message-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-content :deep(code) {
  font-size: 0.875em;
}

.message-metadata {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.streaming .message-content {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.message-input {
  flex: 1;
}

.message-input :deep(textarea) {
  resize: none;
  max-height: 120px;
}

.send-button {
  align-self: flex-end;
}
</style>
