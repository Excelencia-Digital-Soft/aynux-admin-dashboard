<script lang="ts">
/**
 * GroupColorPicker - Color selector for workflow groups (n8n-style)
 *
 * Features:
 * - Predefined color palette (7 colors)
 * - Circular color swatches
 * - Popover UI
 */

// Predefined colors matching n8n style (exported for use in other components)
export const GROUP_COLORS = [
  { name: 'yellow', value: '#ca8a04', label: 'Amarillo' },
  { name: 'orange', value: '#ea580c', label: 'Naranja' },
  { name: 'red', value: '#dc2626', label: 'Rojo' },
  { name: 'green', value: '#16a34a', label: 'Verde' },
  { name: 'blue', value: '#2563eb', label: 'Azul' },
  { name: 'purple', value: '#9333ea', label: 'Morado' },
  { name: 'gray', value: '#6b7280', label: 'Gris' }
] as const

export type GroupColorName = typeof GROUP_COLORS[number]['name']
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)

const currentColor = computed(() => {
  return GROUP_COLORS.find(c => c.value === props.modelValue) || GROUP_COLORS[4] // Default blue
})

function selectColor(color: typeof GROUP_COLORS[number]) {
  emit('update:modelValue', color.value)
  isOpen.value = false
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="color-picker-trigger"
        :style="{ '--trigger-color': currentColor.value }"
      >
        <span class="color-indicator" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="color-picker-content" side="bottom" :side-offset="4">
      <div class="color-grid">
        <button
          v-for="color in GROUP_COLORS"
          :key="color.name"
          class="color-swatch"
          :class="{ 'is-selected': color.value === modelValue }"
          :style="{ '--swatch-color': color.value }"
          :title="color.label"
          @click="selectColor(color)"
        >
          <i v-if="color.value === modelValue" class="pi pi-check" />
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.color-picker-trigger {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--trigger-color);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.color-picker-content {
  width: auto !important;
  padding: 8px !important;
}

.color-grid {
  display: flex;
  gap: 6px;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  background-color: var(--swatch-color);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.color-swatch.is-selected {
  border-color: white;
  box-shadow: 0 0 0 2px var(--swatch-color);
}

.color-swatch i {
  font-size: 0.75rem;
  color: white;
}
</style>
