import { ref, computed } from 'vue'
import { workflowApi } from '@/api/workflow.api'
import type {
  ExecutionLogSummary,
  ExecutionLogDetail,
  ExecutionLogFilters,
  ExecutionStats,
  PaginatedExecutionLogs
} from '@/types/workflow-execution.types'

export function useWorkflowExecutionHistory() {
  const logs = ref<ExecutionLogSummary[]>([])
  const total = ref(0)
  const page = ref(1)
  const size = ref(20)
  const isLoading = ref(false)
  const filters = ref<ExecutionLogFilters>({})
  const stats = ref<ExecutionStats | null>(null)
  const selectedLog = ref<ExecutionLogDetail | null>(null)
  const isLoadingDetail = ref(false)

  const totalPages = computed(() => Math.ceil(total.value / size.value))

  async function loadLogs() {
    isLoading.value = true
    try {
      const result = await workflowApi.listExecutionLogs(filters.value, page.value, size.value)
      logs.value = result.items
      total.value = result.total
    } catch (error) {
      console.error('Failed to load execution logs:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadStats() {
    try {
      stats.value = await workflowApi.getExecutionStats(filters.value)
    } catch (error) {
      console.error('Failed to load execution stats:', error)
    }
  }

  async function loadLogDetail(logId: string) {
    isLoadingDetail.value = true
    try {
      selectedLog.value = await workflowApi.getExecutionLog(logId)
    } catch (error) {
      console.error('Failed to load execution log detail:', error)
    } finally {
      isLoadingDetail.value = false
    }
  }

  function setFilters(newFilters: ExecutionLogFilters) {
    filters.value = newFilters
    page.value = 1
  }

  function nextPage() {
    if (page.value < totalPages.value) {
      page.value++
      loadLogs()
    }
  }

  function prevPage() {
    if (page.value > 1) {
      page.value--
      loadLogs()
    }
  }

  function goToPage(p: number) {
    page.value = p
    loadLogs()
  }

  function closeDetail() {
    selectedLog.value = null
  }

  return {
    logs,
    total,
    page,
    size,
    isLoading,
    filters,
    stats,
    selectedLog,
    isLoadingDetail,
    totalPages,
    loadLogs,
    loadStats,
    loadLogDetail,
    setFilters,
    nextPage,
    prevPage,
    goToPage,
    closeDetail
  }
}
