<template>
  <div :class="['sim-message', `sim-message--${message.role}`]">
    <!-- Message bubble -->
    <div :class="['sim-bubble', `sim-bubble--${message.role}`]">
      <p class="sim-bubble__text" v-html="formattedText" />

      <!-- Buttons (bot messages only) -->
      <div v-if="message.buttons?.length" class="sim-bubble__buttons">
        <button
          v-for="btn in message.buttons"
          :key="btn.id"
          class="sim-btn"
          :disabled="disabled"
          @click="$emit('button-click', btn.id, btn.titulo)"
        >
          {{ btn.titulo }}
        </button>
      </div>

      <!-- List items (bot messages only) -->
      <div v-if="message.listItems?.length" class="sim-bubble__list">
        <button
          v-for="item in message.listItems"
          :key="item.id"
          class="sim-list-item"
          :disabled="disabled"
          @click="$emit('list-select', item.id, item.titulo)"
        >
          <span class="sim-list-item__title">{{ item.titulo }}</span>
          <span v-if="item.descripcion" class="sim-list-item__desc">{{ item.descripcion }}</span>
        </button>
      </div>
    </div>

    <!-- Trace indicator (bot messages only) -->
    <button
      v-if="message.trace && message.role === 'bot'"
      class="sim-trace-badge"
      @click="$emit('show-trace', message)"
    >
      <i class="pi pi-code" />
      {{ message.trace.current_node }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SimulatorMessage } from './useSimulator'

const props = defineProps<{
  message: SimulatorMessage
  disabled?: boolean
}>()

defineEmits<{
  'button-click': [id: string, title: string]
  'list-select': [id: string, title: string]
  'show-trace': [message: SimulatorMessage]
}>()

const formattedText = computed(() => {
  // Convert newlines to <br> and bold *text*
  return props.message.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
})
</script>

<style scoped>
.sim-message {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.sim-message--user {
  align-items: flex-end;
}

.sim-message--bot {
  align-items: flex-start;
}

.sim-bubble {
  max-width: 85%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  word-break: break-word;
}

.sim-bubble--user {
  background: #dcf8c6;
  border-bottom-right-radius: 0.25rem;
  color: #111;
}

.sim-bubble--bot {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 0.25rem;
  color: #111;
}

:root.dark-mode .sim-bubble--user {
  background: #005c4b;
  color: #e9edef;
}

:root.dark-mode .sim-bubble--bot {
  background: #1f2937;
  border-color: #374151;
  color: #e9edef;
}

.sim-bubble__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.sim-bubble__buttons {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

:root.dark-mode .sim-bubble__buttons {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.sim-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #25d366;
  border-radius: 0.5rem;
  background: transparent;
  color: #25d366;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.sim-btn:hover:not(:disabled) {
  background: #25d366;
  color: #fff;
}

.sim-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sim-bubble__list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

:root.dark-mode .sim-bubble__list {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.sim-list-item {
  display: flex;
  flex-direction: column;
  padding: 0.375rem 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.sim-list-item:hover:not(:disabled) {
  border-color: #25d366;
  background: rgba(37, 211, 102, 0.05);
}

.sim-list-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sim-list-item__title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111;
}

:root.dark-mode .sim-list-item__title {
  color: #e9edef;
}

.sim-list-item__desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

:root.dark-mode .sim-list-item {
  border-color: #374151;
}

.sim-trace-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.15s ease;
}

.sim-trace-badge:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #3b82f6;
}

:root.dark-mode .sim-trace-badge:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>
