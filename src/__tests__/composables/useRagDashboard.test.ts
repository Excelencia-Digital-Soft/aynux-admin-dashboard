import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRagDashboard } from '@/composables/useRagDashboard'

// Mock the analytics API
vi.mock('@/api/analytics.api', () => ({
  analyticsApi: {
    getRagQueryLogs: vi.fn(),
    exportData: vi.fn()
  }
}))

// Mock the toast composable
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    clear: vi.fn()
  })
}))

import { analyticsApi } from '@/api/analytics.api'

describe('useRagDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const {
        queryLogs,
        totalLogs,
        logsPage,
        logsLoading,
        selectedQuery,
        showDetailDialog,
        hasLogs
      } = useRagDashboard({ autoFetch: false })

      expect(queryLogs.value).toEqual([])
      expect(totalLogs.value).toBe(0)
      expect(logsPage.value).toBe(1)
      expect(logsLoading.value).toBe(false)
      expect(selectedQuery.value).toBeNull()
      expect(showDetailDialog.value).toBe(false)
      expect(hasLogs.value).toBe(false)
    })
  })

  describe('loadQueryLogs', () => {
    it('should fetch query logs successfully', async () => {
      const mockLogs = [
        {
          id: '1',
          query: 'test query',
          response: 'test response',
          context_used: [],
          token_count: 100,
          latency_ms: 500,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          query: 'another query',
          response: 'another response',
          context_used: [],
          token_count: 150,
          latency_ms: 750,
          created_at: '2024-01-01T11:00:00Z'
        }
      ]
      vi.mocked(analyticsApi.getRagQueryLogs).mockResolvedValue({
        logs: mockLogs,
        total: 100
      })

      const { loadQueryLogs, queryLogs, totalLogs, logsLoading, hasLogs } = useRagDashboard({
        autoFetch: false
      })

      expect(logsLoading.value).toBe(false)

      const fetchPromise = loadQueryLogs()
      expect(logsLoading.value).toBe(true)

      await fetchPromise

      expect(logsLoading.value).toBe(false)
      expect(queryLogs.value).toEqual(mockLogs)
      expect(totalLogs.value).toBe(100)
      expect(hasLogs.value).toBe(true)
    })

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(analyticsApi.getRagQueryLogs).mockRejectedValue(new Error('API Error'))

      const { loadQueryLogs, queryLogs, logsLoading, error } = useRagDashboard({ autoFetch: false })

      await loadQueryLogs()

      expect(logsLoading.value).toBe(false)
      expect(queryLogs.value).toEqual([])
      expect(error.value).toBe('Error al cargar historial de consultas')
    })

    it('should use custom page size', async () => {
      vi.mocked(analyticsApi.getRagQueryLogs).mockResolvedValue({ logs: [], total: 0 })

      const { loadQueryLogs } = useRagDashboard({ autoFetch: false, pageSize: 50 })

      await loadQueryLogs()

      expect(analyticsApi.getRagQueryLogs).toHaveBeenCalledWith({
        page: 1,
        pageSize: 50
      })
    })
  })

  describe('pagination', () => {
    it('should handle page change correctly', async () => {
      vi.mocked(analyticsApi.getRagQueryLogs).mockResolvedValue({ logs: [], total: 0 })

      const { onLogsPageChange, logsPage } = useRagDashboard({ autoFetch: false })

      // DataTable uses 0-indexed pages
      onLogsPageChange({ page: 2 })

      expect(logsPage.value).toBe(3) // Converted to 1-indexed
      expect(analyticsApi.getRagQueryLogs).toHaveBeenCalledWith({
        page: 3,
        pageSize: 25
      })
    })

    it('should compute total pages correctly', async () => {
      vi.mocked(analyticsApi.getRagQueryLogs).mockResolvedValue({
        logs: [],
        total: 100
      })

      const { loadQueryLogs, totalPages } = useRagDashboard({ autoFetch: false, pageSize: 25 })

      expect(totalPages.value).toBe(1) // Before loading

      await loadQueryLogs()

      expect(totalPages.value).toBe(4) // 100 / 25 = 4
    })
  })

  describe('query detail dialog', () => {
    it('should open detail dialog with selected query', () => {
      const { viewQueryDetail, selectedQuery, showDetailDialog } = useRagDashboard({
        autoFetch: false
      })

      const mockQuery = {
        id: '1',
        query: 'test query',
        response: 'test response',
        context_used: ['doc1', 'doc2'],
        token_count: 100,
        latency_ms: 500,
        created_at: '2024-01-01T10:00:00Z'
      }

      viewQueryDetail(mockQuery)

      expect(selectedQuery.value).toEqual(mockQuery)
      expect(showDetailDialog.value).toBe(true)
    })

    it('should close detail dialog and clear selection', () => {
      const { viewQueryDetail, closeDetailDialog, selectedQuery, showDetailDialog } =
        useRagDashboard({ autoFetch: false })

      const mockQuery = {
        id: '1',
        query: 'test',
        response: 'response',
        context_used: [],
        token_count: 100,
        latency_ms: 500,
        created_at: '2024-01-01'
      }

      viewQueryDetail(mockQuery)
      expect(showDetailDialog.value).toBe(true)

      closeDetailDialog()

      expect(showDetailDialog.value).toBe(false)
      expect(selectedQuery.value).toBeNull()
    })
  })

  describe('export', () => {
    it('should export data as CSV', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' })
      vi.mocked(analyticsApi.exportData).mockResolvedValue(mockBlob)

      // Mock URL and anchor
      const createObjectURL = vi.fn().mockReturnValue('blob:url')
      const revokeObjectURL = vi.fn()
      global.URL.createObjectURL = createObjectURL
      global.URL.revokeObjectURL = revokeObjectURL

      const mockClick = vi.fn()
      vi.spyOn(document, 'createElement').mockReturnValue({
        click: mockClick,
        href: '',
        download: ''
      } as unknown as HTMLAnchorElement)

      const { handleExport, exportLoading } = useRagDashboard({ autoFetch: false })

      const exportPromise = handleExport('csv')
      expect(exportLoading.value).toBe(true)

      await exportPromise

      expect(exportLoading.value).toBe(false)
      expect(analyticsApi.exportData).toHaveBeenCalledWith({
        type: 'rag_queries',
        format: 'csv'
      })
      expect(mockClick).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:url')
    })

    it('should export data as JSON', async () => {
      const mockBlob = new Blob(['{"data": []}'], { type: 'application/json' })
      vi.mocked(analyticsApi.exportData).mockResolvedValue(mockBlob)

      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
      global.URL.revokeObjectURL = vi.fn()
      vi.spyOn(document, 'createElement').mockReturnValue({
        click: vi.fn(),
        href: '',
        download: ''
      } as unknown as HTMLAnchorElement)

      const { handleExport } = useRagDashboard({ autoFetch: false })

      await handleExport('json')

      expect(analyticsApi.exportData).toHaveBeenCalledWith({
        type: 'rag_queries',
        format: 'json'
      })
    })

    it('should handle export errors', async () => {
      vi.mocked(analyticsApi.exportData).mockRejectedValue(new Error('Export failed'))

      const { handleExport, exportLoading } = useRagDashboard({ autoFetch: false })

      await handleExport('csv')

      expect(exportLoading.value).toBe(false)
    })
  })

  describe('formatting helpers', () => {
    it('formatDate should format date correctly', () => {
      const { formatDate } = useRagDashboard({ autoFetch: false })

      const result = formatDate('2024-01-15T10:30:00Z')

      // Result depends on locale, just check it returns a string
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('formatLatency should format milliseconds correctly', () => {
      const { formatLatency } = useRagDashboard({ autoFetch: false })

      expect(formatLatency(500)).toBe('500ms')
      expect(formatLatency(999)).toBe('999ms')
      expect(formatLatency(1000)).toBe('1.00s')
      expect(formatLatency(1500)).toBe('1.50s')
      expect(formatLatency(2500)).toBe('2.50s')
    })

    it('getFeedbackSeverity should return correct severity', () => {
      const { getFeedbackSeverity } = useRagDashboard({ autoFetch: false })

      expect(getFeedbackSeverity('positive')).toBe('success')
      expect(getFeedbackSeverity('negative')).toBe('danger')
      expect(getFeedbackSeverity(null)).toBe('secondary')
      expect(getFeedbackSeverity(undefined)).toBe('secondary')
      expect(getFeedbackSeverity('other')).toBe('secondary')
    })

    it('getFeedbackLabel should return correct label', () => {
      const { getFeedbackLabel } = useRagDashboard({ autoFetch: false })

      expect(getFeedbackLabel('positive')).toBe('Positivo')
      expect(getFeedbackLabel('negative')).toBe('Negativo')
      expect(getFeedbackLabel(null)).toBe('Sin feedback')
      expect(getFeedbackLabel(undefined)).toBe('Sin feedback')
    })
  })

  describe('refresh', () => {
    it('should call loadQueryLogs', async () => {
      vi.mocked(analyticsApi.getRagQueryLogs).mockResolvedValue({ logs: [], total: 0 })

      const { refresh } = useRagDashboard({ autoFetch: false })

      await refresh()

      expect(analyticsApi.getRagQueryLogs).toHaveBeenCalledTimes(1)
    })
  })
})
