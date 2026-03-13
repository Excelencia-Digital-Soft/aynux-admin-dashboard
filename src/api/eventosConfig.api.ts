import apiClient from './index'
import type {
  EgresadosSchool,
  SchoolCreateRequest,
  SchoolUpdateRequest,
  Venue,
  VenueCreateRequest,
  VenueUpdateRequest,
  EventosMenuConfig,
  MenuConfigCreateRequest,
  MenuConfigUpdateRequest,
  FormTemplate,
  FormTemplateUpdateRequest,
  EventosLead,
  LeadStatusUpdateRequest,
  CompanyInfo,
  CompanyInfoUpdateRequest
} from '@/types/eventosConfig.types'

const BASE_URL = '/admin/eventos'

export const eventosConfigApi = {
  // ============ Schools ============

  async listSchools(organizationId: string, year?: number): Promise<EgresadosSchool[]> {
    const params: Record<string, string> = { organization_id: organizationId }
    if (year) params.year = String(year)
    const { data } = await apiClient.get<EgresadosSchool[]>(`${BASE_URL}/schools`, { params })
    return data
  },

  async createSchool(payload: SchoolCreateRequest): Promise<EgresadosSchool> {
    const { data } = await apiClient.post<EgresadosSchool>(`${BASE_URL}/schools`, payload)
    return data
  },

  async updateSchool(schoolId: number, payload: SchoolUpdateRequest): Promise<EgresadosSchool> {
    const { data } = await apiClient.put<EgresadosSchool>(`${BASE_URL}/schools/${schoolId}`, payload)
    return data
  },

  async deleteSchool(schoolId: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/schools/${schoolId}`)
  },

  // ============ Venues ============

  async listVenues(organizationId: string, category?: string): Promise<Venue[]> {
    const params: Record<string, string> = { organization_id: organizationId }
    if (category) params.category = category
    const { data } = await apiClient.get<Venue[]>(`${BASE_URL}/venues`, { params })
    return data
  },

  async createVenue(payload: VenueCreateRequest): Promise<Venue> {
    const { data } = await apiClient.post<Venue>(`${BASE_URL}/venues`, payload)
    return data
  },

  async updateVenue(venueId: number, payload: VenueUpdateRequest): Promise<Venue> {
    const { data } = await apiClient.put<Venue>(`${BASE_URL}/venues/${venueId}`, payload)
    return data
  },

  async deleteVenue(venueId: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/venues/${venueId}`)
  },

  // ============ Menus ============

  async listMenus(organizationId: string, menuKey?: string): Promise<EventosMenuConfig[]> {
    const params: Record<string, string> = { organization_id: organizationId }
    if (menuKey) params.menu_key = menuKey
    const { data } = await apiClient.get<EventosMenuConfig[]>(`${BASE_URL}/menus`, { params })
    return data
  },

  async createMenu(payload: MenuConfigCreateRequest): Promise<EventosMenuConfig> {
    const { data } = await apiClient.post<EventosMenuConfig>(`${BASE_URL}/menus`, payload)
    return data
  },

  async updateMenu(menuId: number, payload: MenuConfigUpdateRequest): Promise<EventosMenuConfig> {
    const { data } = await apiClient.put<EventosMenuConfig>(`${BASE_URL}/menus/${menuId}`, payload)
    return data
  },

  // ============ Forms ============

  async listForms(organizationId: string): Promise<FormTemplate[]> {
    const { data } = await apiClient.get<FormTemplate[]>(`${BASE_URL}/forms`, {
      params: { organization_id: organizationId }
    })
    return data
  },

  async updateForm(formId: number, payload: FormTemplateUpdateRequest): Promise<FormTemplate> {
    const { data } = await apiClient.put<FormTemplate>(`${BASE_URL}/forms/${formId}`, payload)
    return data
  },

  // ============ Company Info ============

  async getCompanyInfo(organizationId: string): Promise<CompanyInfo | null> {
    const { data } = await apiClient.get<CompanyInfo | Record<string, never>>(`${BASE_URL}/company-info`, {
      params: { organization_id: organizationId }
    })
    return data && 'id' in data ? data as CompanyInfo : null
  },

  async updateCompanyInfo(organizationId: string, payload: CompanyInfoUpdateRequest): Promise<CompanyInfo> {
    const { data } = await apiClient.put<CompanyInfo>(`${BASE_URL}/company-info`, payload, {
      params: { organization_id: organizationId }
    })
    return data
  },

  // ============ Seed Defaults ============

  async seedDefaults(organizationId: string): Promise<Record<string, number>> {
    const { data } = await apiClient.post<Record<string, number>>(
      `${BASE_URL}/seed-defaults`,
      null,
      { params: { organization_id: organizationId } }
    )
    return data
  },

  // ============ Leads ============

  async listLeads(organizationId: string, status?: string): Promise<EventosLead[]> {
    const params: Record<string, string> = { organization_id: organizationId }
    if (status) params.status = status
    const { data } = await apiClient.get<EventosLead[]>(`${BASE_URL}/leads`, { params })
    return data
  },

  async updateLeadStatus(leadId: string, payload: LeadStatusUpdateRequest): Promise<EventosLead> {
    const { data } = await apiClient.put<EventosLead>(`${BASE_URL}/leads/${leadId}/status`, payload)
    return data
  }
}

export default eventosConfigApi
