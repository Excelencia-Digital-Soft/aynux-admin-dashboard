<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  totalRecords: number
  rows: number
  currentPage: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1
})

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.totalRecords / props.rows))

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const current = props.currentPage
  const total = totalPages.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    pages.push(total)
  }

  return pages
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('pageChange', page)
  }
}
</script>

<template>
  <nav
    :class="cn('flex items-center justify-center gap-1', props.class)"
    role="navigation"
    aria-label="Pagination"
  >
    <Button
      variant="outline"
      size="icon"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
      class="h-9 w-9"
    >
      <i class="pi pi-chevron-left h-4 w-4" />
    </Button>

    <template v-for="(page, index) in visiblePages" :key="index">
      <span v-if="page === '...'" class="px-2 text-muted-foreground">...</span>
      <Button
        v-else
        :variant="page === currentPage ? 'default' : 'outline'"
        size="icon"
        @click="goToPage(page as number)"
        class="h-9 w-9"
      >
        {{ page }}
      </Button>
    </template>

    <Button
      variant="outline"
      size="icon"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
      class="h-9 w-9"
    >
      <i class="pi pi-chevron-right h-4 w-4" />
    </Button>
  </nav>
</template>
