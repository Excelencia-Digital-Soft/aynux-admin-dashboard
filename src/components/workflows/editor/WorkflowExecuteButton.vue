<script setup lang="ts">
/**
 * WorkflowExecuteButton - n8n-style prominent execute button
 *
 * Features:
 * - Position: Bottom center
 * - Coral/red gradient style
 * - Loading animation when executing
 * - Keyboard shortcut hint
 */
import { computed } from 'vue'

const props = defineProps<{
  isExecuting: boolean
  disabled?: boolean
  hasNodes?: boolean
}>()

const emit = defineEmits<{
  (e: 'execute'): void
}>()

const buttonText = computed(() => {
  if (props.isExecuting) return 'Ejecutando...'
  return 'Ejecutar workflow'
})

const isDisabled = computed(() => {
  return props.disabled || props.isExecuting || !props.hasNodes
})
</script>

<template>
  <div class="n8n-execute-container">
    <button
      class="n8n-execute-button"
      :class="{ executing: isExecuting }"
      :disabled="isDisabled"
      @click="emit('execute')"
    >
      <span class="button-content">
        <i :class="['pi', isExecuting ? 'pi-spin pi-spinner' : 'pi-play']" />
        <span class="button-text">{{ buttonText }}</span>
      </span>
      <span v-if="!isExecuting" class="keyboard-hint">F5</span>
    </button>
  </div>
</template>

<style scoped>
.n8n-execute-container {
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.n8n-execute-button {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    0 4px 16px rgba(239, 68, 68, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.1) inset;
}

.n8n-execute-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(239, 68, 68, 0.5),
    0 0 0 2px rgba(255, 255, 255, 0.2) inset;
}

.n8n-execute-button:active:not(:disabled) {
  transform: translateY(0);
}

.n8n-execute-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.n8n-execute-button.executing {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow:
    0 4px 16px rgba(139, 92, 246, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.1) inset;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-content i {
  font-size: 16px;
}

.button-text {
  white-space: nowrap;
}

.keyboard-hint {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
</style>
