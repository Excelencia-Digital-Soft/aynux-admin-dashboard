<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  defaultValue?: string | number
  modelValue?: string | number
  class?: string
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text'
})

const emits = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const attrs = useAttrs()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value ?? '')
})
</script>

<template>
  <input
    v-bind="attrs"
    v-model="modelValue"
    :type="type"
    :class="
      cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
</template>
