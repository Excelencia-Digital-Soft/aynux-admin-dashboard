import { ref, computed } from 'vue'
import { consultaCosecha, type CosechaRecord, type CosechaConsultaResponse, type CosechaTotals } from '@/api/enav.api'

export interface PeriodoOption {
  label: string
  value: string
}

export const PERIODO_OPTIONS: PeriodoOption[] = [
  { label: 'Cosecha actual', value: 'cosecha_actual' },
  { label: 'Ultima semana', value: 'ultima_semana' },
  { label: 'Ultimo mes', value: 'ultimo_mes' },
  { label: 'Ultimos 3 meses', value: 'ultimos_3_meses' }
]

export function useEnavConsulta() {
  // Search state
  const clientecodigo = ref('')
  const periodo = ref('cosecha_actual')
  const useCustomRange = ref(false)
  const fechaDesde = ref<string | null>(null)
  const fechaHasta = ref<string | null>(null)

  // Results state
  const records = ref<CosechaRecord[]>([])
  const clienterazonsocial = ref<string | null>(null)
  const total = ref(0)
  const totalPages = ref(0)
  const totals = ref<CosechaTotals>({ sum_neto: 0, sum_bruto: 0, sum_tara: 0 })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasSearched = ref(false)

  // Pagination
  const page = ref(1)
  const pageSize = ref(25)

  const canSearch = computed(() => clientecodigo.value.trim().length > 0)

  async function search(newPage?: number) {
    if (!canSearch.value) return

    if (newPage !== undefined) {
      page.value = newPage
    }

    isLoading.value = true
    error.value = null

    try {
      const params: Record<string, string | number> = {
        clientecodigo: clientecodigo.value.trim(),
        page: page.value,
        page_size: pageSize.value
      }

      if (useCustomRange.value && fechaDesde.value && fechaHasta.value) {
        params.fecha_desde = fechaDesde.value
        params.fecha_hasta = fechaHasta.value
      } else {
        params.periodo = periodo.value
      }

      const data: CosechaConsultaResponse = await consultaCosecha(params as any)
      records.value = data.items
      total.value = data.total
      totalPages.value = data.total_pages
      clienterazonsocial.value = data.clienterazonsocial
      totals.value = data.totals
      hasSearched.value = true
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Error al consultar'
      error.value = message
      records.value = []
      total.value = 0
      totalPages.value = 0
    } finally {
      isLoading.value = false
    }
  }

  function onPageChange(newPage: number) {
    page.value = newPage // already 1-indexed from Pagination component
    search()
  }

  function resetSearch() {
    page.value = 1
    records.value = []
    total.value = 0
    totalPages.value = 0
    hasSearched.value = false
    error.value = null
    clienterazonsocial.value = null
  }

  function submitSearch() {
    page.value = 1
    search()
  }

  return {
    // Search state
    clientecodigo,
    periodo,
    useCustomRange,
    fechaDesde,
    fechaHasta,

    // Results
    records,
    clienterazonsocial,
    total,
    totalPages,
    totals,
    isLoading,
    error,
    hasSearched,

    // Pagination
    page,
    pageSize,

    // Computed
    canSearch,

    // Actions
    search,
    submitSearch,
    onPageChange,
    resetSearch
  }
}
