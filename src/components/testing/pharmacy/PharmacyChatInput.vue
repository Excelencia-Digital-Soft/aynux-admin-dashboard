<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

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

const inputRef = ref<HTMLInputElement | null>(null)
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
    target.value = ''
  }
}

function triggerAudioUpload() {
  audioInputRef.value?.click()
}

function focus() {
  inputRef.value?.focus()
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
        <Input
          ref="inputRef"
          :model-value="modelValue"
          @update:model-value="(v: string | number) => emit('update:modelValue', String(v ?? ''))"
          placeholder="Escribe un mensaje..."
          class="pr-10"
          @keypress="handleKeyPress"
          :disabled="disabled"
        />
      </div>
      <!-- Audio upload button -->
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="h-10 w-10"
              @click="triggerAudioUpload"
              :disabled="disabled || isTranscribing"
            >
              <i v-if="isTranscribing" class="pi pi-spin pi-spinner" />
              <i v-else class="pi pi-microphone" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Enviar audio</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <!-- Send text button -->
      <Button
        size="icon"
        class="h-10 w-10"
        @click="emit('send')"
        :disabled="disabled || !modelValue.trim() || (isLoading && !isTranscribing)"
      >
        <i v-if="isLoading && !isTranscribing" class="pi pi-spin pi-spinner" />
        <i v-else class="pi pi-send" />
      </Button>
    </div>
    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Enter para enviar</span>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :class="useStreaming ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'"
          @click="emit('update:useStreaming', !useStreaming)"
        >
          <i :class="useStreaming ? 'pi pi-bolt mr-1' : 'pi pi-pause mr-1'" />
          {{ useStreaming ? 'Streaming' : 'Normal' }}
        </Button>
      </div>
    </div>
  </div>
</template>
