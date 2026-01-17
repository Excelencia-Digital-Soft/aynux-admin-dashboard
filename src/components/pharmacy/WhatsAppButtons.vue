<script setup lang="ts">
import type { InteractiveButton } from '@/api/pharmacy.api'

interface Props {
  buttons: InteractiveButton[]
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  select: [button: InteractiveButton]
}>()

function handleClick(button: InteractiveButton) {
  emit('select', button)
}
</script>

<template>
  <div class="whatsapp-buttons-container">
    <div class="whatsapp-buttons">
      <button
        v-for="button in buttons"
        :key="button.id"
        class="whatsapp-btn"
        :disabled="disabled"
        @click="handleClick(button)"
      >
        <span class="btn-icon">📱</span>
        <span class="btn-text">{{ button.titulo }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.whatsapp-buttons-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(37, 211, 102, 0.2);
}

.whatsapp-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.whatsapp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  box-shadow: 0 2px 4px rgba(37, 211, 102, 0.3);
}

.whatsapp-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 211, 102, 0.4);
  background: linear-gradient(135deg, #2EE370 0%, #15A085 100%);
}

.whatsapp-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(37, 211, 102, 0.3);
}

.whatsapp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6b7280;
  box-shadow: none;
}

.btn-icon {
  font-size: 1rem;
  line-height: 1;
}

.btn-text {
  flex: 1;
}

/* Dark mode - use slightly brighter colors */
:root.dark .whatsapp-btn,
.dark .whatsapp-btn,
[data-theme="dark"] .whatsapp-btn {
  background: linear-gradient(135deg, #34d058 0%, #1db954 100%);
  box-shadow: 0 2px 4px rgba(52, 208, 88, 0.3);
}

:root.dark .whatsapp-btn:hover:not(:disabled),
.dark .whatsapp-btn:hover:not(:disabled),
[data-theme="dark"] .whatsapp-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3ee068 0%, #22d35e 100%);
  box-shadow: 0 4px 8px rgba(52, 208, 88, 0.4);
}

:root.dark .whatsapp-buttons-container,
.dark .whatsapp-buttons-container,
[data-theme="dark"] .whatsapp-buttons-container {
  border-top-color: rgba(52, 208, 88, 0.3);
}
</style>
