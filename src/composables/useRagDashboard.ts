import { ref, computed, onMounted } from 'vue'
import { analyticsApi } from '@/api/analytics.api'
import { useToast } from '@/composables/useToast'
import type { RagQueryLog } from '@/types/document.types'

/**
 * Composable for managing RAG dashboard data and interactions.
 * Extracts logic from RagDashboardPage for better testability.
 */

export interface UseRagDashboardOptions {
  autoFetch?: boolean
  pageSize?: number
}

export function useRagDashboard(options: UseRagDashboardOptions = {}) {
  const { autoFetch = true, pageSize = 25 } = options

  const toast = useToast()

  // State
  const queryLogs = ref<RagQueryLog[]>([])
  const totalLogs = ref(0)
  const logsPage = ref(1)
  const logsLoading = ref(false)
  const selectedQuery = ref<RagQueryLog | null>(null)
  const showDetailDialog = ref(false)
  const exportLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasLogs = computed(() => queryLogs.value.length > 0)
  const totalPages = computed(() => Math.ceil(totalLogs.value / pageSize) || 1)

  /**
   * Load query logs from API with pagination.
   */
  async function loadQueryLogs(): Promise<void> {
    logsLoading.value = true
    error.value = null
    try {
      const result = await analyticsApi.getRagQueryLogs({
        page: logsPage.value,
        pageSize
      })
      queryLogs.value = result.logs
      totalLogs.value = result.total
    } catch (err) {
      error.value = 'Error al cargar historial de consultas'
      console.error('Error loading query logs:', err)
    } finally {
      logsLoading.value = false
    }
  }

  /**
   * Handle page change from DataTable.
   * DataTable uses 0-indexed pages, we convert to 1-indexed.
   */
  function onLogsPageChange(event: { page: number }): void {
    logsPage.value = event.page + 1
    loadQueryLogs()
  }

  /**
   * View details of a specific query.
   */
  function viewQueryDetail(query: RagQueryLog): void {
    selectedQuery.value = query
    showDetailDialog.value = true
  }

  /**
   * Close the query detail dialog.
   */
  function closeDetailDialog(): void {
    showDetailDialog.value = false
    selectedQuery.value = null
  }

  /**
   * Format date string to localized format.
   */
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'medium'
    })
  }

  /**
   * Format latency in milliseconds to human-readable format.
   */
  function formatLatency(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  /**
   * Get Tag severity for feedback value.
   */
  function getFeedbackSeverity(
    feedback: string | null | undefined
  ): 'success' | 'danger' | 'secondary' {
    if (feedback === 'positive') return 'success'
    if (feedback === 'negative') return 'danger'
    return 'secondary'
  }

  /**
   * Get display label for feedback value.
   */
  function getFeedbackLabel(feedback: string | null | undefined): string {
    if (feedback === 'positive') return 'Positivo'
    if (feedback === 'negative') return 'Negativo'
    return 'Sin feedback'
  }

  /**
   * Export data in specified format.
   * Creates a download link and triggers download.
   */
  async function handleExport(format: 'csv' | 'json'): Promise<void> {
    exportLoading.value = true
    try {
      const blob = await analyticsApi.exportData({
        type: 'rag_queries',
        format
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rag_queries.${format}`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Datos exportados en formato ${format.toUpperCase()}`)
    } catch (err) {
      toast.error('Error al exportar datos')
      console.error('Error exporting data:', err)
    } finally {
      exportLoading.value = false
    }
  }

  /**
   * Refresh query logs.
   */
  async function refresh(): Promise<void> {
    await loadQueryLogs()
  }

  // Auto-fetch on mount if enabled
  if (autoFetch) {
    onMounted(loadQueryLogs)
  }

  return {
    // State
    queryLogs,
    totalLogs,
    logsPage,
    logsLoading,
    selectedQuery,
    showDetailDialog,
    exportLoading,
    error,
    // Computed
    hasLogs,
    totalPages,
    // Actions
    loadQueryLogs,
    onLogsPageChange,
    viewQueryDetail,
    closeDetailDialog,
    handleExport,
    refresh,
    // Utilities
    formatDate,
    formatLatency,
    getFeedbackSeverity,
    getFeedbackLabel
  }
}

export default useRagDashboard
