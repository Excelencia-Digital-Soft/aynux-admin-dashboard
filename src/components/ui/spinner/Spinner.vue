<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3'
} as const
</script>

<template>
  <div
    :class="cn('animate-spin rounded-full border-primary border-t-transparent', sizeClasses[size], props.class)"
    role="status"
    aria-label="Loading"
  />
</template>
