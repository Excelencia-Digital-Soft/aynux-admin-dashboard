import apiClient from '@/api/index'

export interface CosechaRecord {
  id: number
  fecha: string | null
  descvariedad: string | null
  neto: number | null
  azucar: number | null
  clienterazonsocial: string | null
  codigotransporte: string | null
  bruto: number | null
  tara: number | null
  tipocosecha: string | null
  tipocomercializacion: string | null
  choferdescripcion: string | null
  observacion: string | null
}

export interface CosechaTotals {
  sum_neto: number
  sum_bruto: number
  sum_tara: number
}

export interface CosechaConsultaResponse {
  items: CosechaRecord[]
  total: number
  page: number
  page_size: number
  total_pages: number
  clientecodigo: string
  clienterazonsocial: string | null
  totals: CosechaTotals
}

export interface CosechaConsultaParams {
  clientecodigo: string
  periodo?: string
  fecha_desde?: string
  fecha_hasta?: string
  page?: number
  page_size?: number
}

export async function consultaCosecha(
  params: CosechaConsultaParams
): Promise<CosechaConsultaResponse> {
  const { data } = await apiClient.get<CosechaConsultaResponse>('/enav/consulta', { params })
  return data
}
