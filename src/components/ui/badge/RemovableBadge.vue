<script setup lang="ts">
import { X } from 'lucide-vue-next'
import Badge from './Badge.vue'

interface Props {
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

withDefaults(defineProps<Props>(), {
  variant: 'secondary'
})

defineEmits<{
  (e: 'remove'): void
}>()
</script>

<template>
  <Badge :variant="variant" class="gap-1 pr-1">
    {{ label }}
    <button
      type="button"
      class="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      @click.stop="$emit('remove')"
    >
      <X class="h-3 w-3" />
    </button>
  </Badge>
</template>
