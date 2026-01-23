<script setup lang="ts">
import { computed } from 'vue'
import { ProgressRoot, ProgressIndicator, type ProgressRootProps } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends ProgressRootProps {
  class?: string
  indicatorClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0
})

const delegatedProps = computed(() => {
  const { class: _, indicatorClass: __, ...delegated } = props
  return delegated
})
</script>

<template>
  <ProgressRoot
    v-bind="delegatedProps"
    :class="cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', props.class)"
  >
    <ProgressIndicator
      :class="cn('h-full w-full flex-1 bg-primary transition-all', props.indicatorClass)"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%)`"
    />
  </ProgressRoot>
</template>
