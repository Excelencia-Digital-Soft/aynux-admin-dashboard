<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<CollapsibleContentProps & { class?: string }>()
</script>

<template>
  <CollapsibleContent
    v-bind="props"
    :class="cn(
      'overflow-hidden transition-all data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up',
      props.class
    )"
  >
    <slot />
  </CollapsibleContent>
</template>
