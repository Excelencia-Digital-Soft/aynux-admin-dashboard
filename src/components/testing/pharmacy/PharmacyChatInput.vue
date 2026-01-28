<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

defineProps<{
  modelValue: string
  useStreaming: boolean
  isLoading: boolean
  disabled: boolean
  isTranscribing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:useStreaming', value: boolean): void
  (e: 'send'): void
  (e: 'sendAudio', file: File): void
}>()

const inputRef = ref<InstanceType<typeof InputText> | null>(null)
const audioInputRef = ref<HTMLInputElement | null>(null)

// Allowed audio formats
const ALLOWED_AUDIO_TYPES = 'audio/ogg,audio/opus,audio/mpeg,audio/wav,audio/mp4,audio/flac,audio/webm,audio/aac,.ogg,.opus,.mp3,.wav,.m4a,.flac,.webm,.aac'

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('send')
  }
}

function handleAudioSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('sendAudio', file)
    // Reset input so same file can be selected again
    target.value = ''
  }
}

function triggerAudioUpload() {
  audioInputRef.value?.click()
}

function focus() {
  const el = (inputRef.value as { $el?: HTMLElement } | null)?.$el
  el?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
    <!-- Hidden audio file input -->
    <input
      ref="audioInputRef"
      type="file"
      :accept="ALLOWED_AUDIO_TYPES"
      class="hidden"
      @change="handleAudioSelect"
    />

    <div class="flex gap-3 items-end">
      <div class="flex-1 relative">
        <InputText
          ref="inputRef"
          :modelValue="modelValue"
          @update:modelValue="(v) => emit('update:modelValue', v ?? '')"
          placeholder="Escribe un mensaje..."
          class="w-full pr-10"
          @keypress="handleKeyPress"
          :disabled="disabled"
        />
      </div>
      <!-- Audio upload button -->
      <Button
        icon="pi pi-microphone"
        @click="triggerAudioUpload"
        :loading="isTranscribing"
        :disabled="disabled"
        class="h-10 w-10"
        severity="secondary"
        rounded
        v-tooltip.top="'Enviar audio'"
      />
      <!-- Send text button -->
      <Button
        icon="pi pi-send"
        @click="emit('send')"
        :loading="isLoading && !isTranscribing"
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
