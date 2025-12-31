<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { marked } from 'marked'
import type { ConversationMessage } from '@/types/chat.types'

import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

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
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth'
      })
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
      role="log"
      aria-label="Historial de conversacion"
      aria-live="polite"
    >
      <!-- Empty state -->
      <div v-if="messages.length === 0 && !isStreaming && !isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="pi pi-comments" />
        </div>
        <p class="empty-title">Inicia una conversacion</p>
        <p class="empty-subtitle">Escribe un mensaje para probar el agente</p>
      </div>

      <!-- Messages -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-bubble"
        :class="[`message-${message.role}`]"
        role="article"
        :aria-label="`Mensaje de ${message.role === 'user' ? 'usuario' : 'agente'}`"
        tabindex="0"
        @click="emit('messageClick', message)"
        @keydown.enter="emit('messageClick', message)"
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

      <!-- Typing indicator (when loading but no streaming content yet) -->
      <div v-if="isLoading && !streamingContent" class="message-bubble message-assistant typing-indicator">
        <div class="message-header">
          <span class="message-role">
            <i class="pi pi-android" />
            Agente
          </span>
        </div>
        <div class="dots-container">
          <span class="dot" style="animation-delay: 0ms" />
          <span class="dot" style="animation-delay: 150ms" />
          <span class="dot" style="animation-delay: 300ms" />
        </div>
      </div>

      <!-- Streaming message (when content is arriving) -->
      <div v-if="isStreaming && streamingContent" class="message-bubble message-assistant message-streaming">
        <div class="message-header">
          <span class="message-role">
            <i class="pi pi-android" />
            Agente
          </span>
          <span class="streaming-badge">
            <span class="streaming-dot" />
            Escribiendo
          </span>
        </div>
        <div
          class="message-content prose prose-sm max-w-none"
          v-html="renderMarkdown(streamingContent)"
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

/* Container with slate background */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f8fafc; /* slate-50 */
}

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-icon i {
  font-size: 1.5rem;
  color: #0284c7;
}

.empty-title {
  color: #475569;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.empty-subtitle {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

/* Base message bubble */
.message-bubble {
  max-width: 80%;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  animation: message-slide-in 0.25s ease-out;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.message-bubble:focus {
  outline: none;
}

.message-bubble:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

/* User message - blue gradient, cut bottom-right corner */
.message-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0c4a6e;
  border-radius: 0.75rem 0.75rem 0.25rem 0.75rem;
  box-shadow: 0 1px 3px rgba(14, 165, 233, 0.15);
}

.message-user .message-role,
.message-user .message-time {
  color: #0369a1;
}

.message-user .message-metadata {
  color: #0284c7;
  border-top-color: rgba(2, 132, 199, 0.2);
}

/* Assistant message - white, cut bottom-left corner */
.message-assistant {
  align-self: flex-start;
  background: white;
  color: #1e293b;
  border-radius: 0.75rem 0.75rem 0.75rem 0.25rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.message-assistant .message-role,
.message-assistant .message-time {
  color: #64748b;
}

.message-assistant .message-metadata {
  color: #94a3b8;
  border-top-color: rgba(148, 163, 184, 0.2);
}

/* System message */
.message-system {
  align-self: center;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  max-width: 90%;
  text-align: center;
}

/* Message header */
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
  gap: 0.35rem;
  font-weight: 600;
}

.message-role i {
  font-size: 0.8rem;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* Message content */
.message-content {
  line-height: 1.6;
  word-wrap: break-word;
}

.message-content :deep(p) {
  margin: 0;
}

.message-content :deep(p + p) {
  margin-top: 0.5rem;
}

.message-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin: 0.5rem 0;
  font-size: 0.8rem;
}

.message-content :deep(code:not(pre code)) {
  background: rgba(0, 0, 0, 0.06);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.message-content :deep(li) {
  margin: 0.25rem 0;
}

/* Message metadata */
.message-metadata {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.375rem;
  border-top: 1px solid;
  font-size: 0.65rem;
  opacity: 0.7;
}

.metadata-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.metadata-item i {
  font-size: 0.6rem;
}

/* Typing indicator */
.typing-indicator {
  padding: 0.75rem 1rem;
}

.dots-container {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  padding: 0.25rem 0;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #94a3b8;
  border-radius: 50%;
  animation: typing-bounce 1s ease-in-out infinite;
}

/* Streaming indicator */
.streaming-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  color: #059669;
  font-weight: 500;
}

.streaming-dot {
  width: 0.4rem;
  height: 0.4rem;
  background: #059669;
  border-radius: 50%;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.message-streaming .message-content::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1rem;
  background: currentColor;
  margin-left: 2px;
  animation: cursor-blink 1s step-end infinite;
  vertical-align: text-bottom;
}

/* Animations */
@keyframes message-slide-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

@keyframes cursor-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Input area */
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
  border-radius: 0.5rem;
}

.send-button {
  align-self: flex-end;
  border-radius: 0.5rem;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .message-bubble {
    max-width: 75%;
  }
}

@media (min-width: 1024px) {
  .message-bubble {
    max-width: 70%;
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .message-bubble:hover {
    transform: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .message-bubble:active {
    transform: scale(0.98);
  }
}
</style>
