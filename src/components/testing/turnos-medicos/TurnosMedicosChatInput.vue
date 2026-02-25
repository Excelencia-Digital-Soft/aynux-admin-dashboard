<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

defineProps<{
  modelValue: string
  isLoading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
}>()

const inputRef = ref<InstanceType<typeof Input> | null>(null)

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('send')
  }
}

function focus() {
  (inputRef.value?.$el as HTMLInputElement | undefined)?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="p-4 bg-white/70 dark:bg-navy-800/50 backdrop-blur-xl border-t border-white/20 dark:border-white/10">
    <div class="flex gap-3 items-end">
      <div class="flex-1">
        <Input
          ref="inputRef"
          :model-value="modelValue"
          @update:model-value="(v) => emit('update:modelValue', String(v))"
          placeholder="Escribe un mensaje..."
          class="bg-white/60 dark:bg-navy-900/40 backdrop-blur-sm border-white/20 dark:border-white/10 focus-visible:ring-violet-500/40"
          @keypress="handleKeyPress"
          :disabled="disabled"
        />
      </div>
      <Button
        size="icon"
        :loading="isLoading"
        :disabled="disabled || !modelValue.trim()"
        @click="emit('send')"
        class="h-10 w-10 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
      >
        <i v-if="!isLoading" class="pi pi-send" />
      </Button>
    </div>
    <div class="flex items-center mt-2">
      <span class="text-xs text-muted-foreground">Enter para enviar</span>
    </div>
  </div>
</template>
