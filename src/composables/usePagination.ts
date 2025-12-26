import { ref, computed, watch } from 'vue'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/utils/constants'

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
}

export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    pageSizeOptions = PAGE_SIZE_OPTIONS
  } = options

  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalItems = ref(0)

  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value) || 1)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  const offset = computed(() => (currentPage.value - 1) * pageSize.value)

  const paginationInfo = computed(() => {
    const start = offset.value + 1
    const end = Math.min(offset.value + pageSize.value, totalItems.value)
    return {
      start,
      end,
      total: totalItems.value,
      showing: `${start}-${end} de ${totalItems.value}`
    }
  })

  function setPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }

  function firstPage() {
    currentPage.value = 1
  }

  function lastPage() {
    currentPage.value = totalPages.value
  }

  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
  }

  function setTotal(total: number) {
    totalItems.value = total
    // Adjust current page if it exceeds total pages
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    }
  }

  function reset() {
    currentPage.value = initialPage
    pageSize.value = initialPageSize
    totalItems.value = 0
  }

  return {
    // State
    currentPage,
    pageSize,
    totalItems,
    pageSizeOptions,

    // Computed
    totalPages,
    hasNextPage,
    hasPrevPage,
    offset,
    paginationInfo,

    // Actions
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotal,
    reset
  }
}
