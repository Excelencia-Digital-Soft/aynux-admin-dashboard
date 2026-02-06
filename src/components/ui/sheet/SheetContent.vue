<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  type DialogContentEmits,
  type DialogContentProps,
  useForwardPropsEmits
} from 'radix-vue'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// Prevent sheet from closing when interacting with PrimeVue overlays (dropdowns, etc.)
function handleInteractOutside(event: Event) {
  const target = event.target as HTMLElement
  // Check if click is on a PrimeVue overlay element (includes filter inputs)
  if (target?.closest('.p-select-overlay, .p-select-filter, .p-select-filter-container, .p-dropdown-panel, .p-autocomplete-panel, .p-multiselect-panel, .p-cascadeselect-panel, .p-overlay-mask, .p-inputtext, .p-component-overlay')) {
    event.preventDefault()
  }
}

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 flex flex-col overflow-hidden',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 h-[99vh] max-h-[99vh] border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  }
)

type SheetVariants = VariantProps<typeof sheetVariants>

interface Props extends DialogContentProps {
  class?: string
  side?: SheetVariants['side']
}

const props = withDefaults(defineProps<Props>(), {
  side: 'right'
})

const emits = defineEmits<DialogContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, side: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="cn(sheetVariants({ side }), props.class)"
      @interact-outside="handleInteractOutside"
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
      >
        <i class="pi pi-times h-4 w-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
