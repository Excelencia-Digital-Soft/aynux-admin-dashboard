<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

defineProps<{
  modelValue: string
  useStreaming: boolean
  isLoading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:useStreaming', value: boolean): void
  (e: 'send'): void
}>()

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('send')
  }
}
</script>

<template>
  <div class="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
    <div class="flex gap-3 items-end">
      <div class="flex-1 relative">
        <InputText
          :modelValue="modelValue"
          @update:modelValue="(v) => emit('update:modelValue', v ?? '')"
          placeholder="Escribe un mensaje..."
          class="w-full pr-10"
          @keypress="handleKeyPress"
          :disabled="disabled"
        />
      </div>
      <Button
        icon="pi pi-send"
        @click="emit('send')"
        :loading="isLoading"
        :disabled="disabled || !modelValue.trim()"
        class="h-10 w-10"
        rounded
      />
    </div>
    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-2 text-xs text-gray-400">
        <span>Enter para enviar</span>
      </div>
      <div class="flex items-center gap-2">
        <Button
          :icon="useStreaming ? 'pi pi-bolt' : 'pi pi-pause'"
          :label="useStreaming ? 'Streaming' : 'Normal'"
          size="small"
          :severity="useStreaming ? 'success' : 'secondary'"
          text
          @click="emit('update:useStreaming', !useStreaming)"
          v-tooltip.top="useStreaming ? 'Modo streaming activo' : 'Modo normal'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
}
</style>
