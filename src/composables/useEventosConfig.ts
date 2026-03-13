import { computed } from 'vue'
import { useEventosStore } from '@/stores/eventos.store'
import { eventosConfigApi } from '@/api/eventosConfig.api'
import { useToast } from '@/composables/useToast'
import type {
  SchoolCreateRequest,
  SchoolUpdateRequest,
  VenueCreateRequest,
  VenueUpdateRequest,
  MenuConfigCreateRequest,
  MenuConfigUpdateRequest,
  FormTemplateUpdateRequest,
  CompanyInfoUpdateRequest
} from '@/types/eventosConfig.types'

export function useEventosConfig() {
  const store = useEventosStore()
  const toast = useToast()

  // ============ Computed State ============

  const schools = computed(() => store.filteredSchools)
  const venues = computed(() => store.filteredVenues)
  const menus = computed(() => store.menus)
  const menusByKey = computed(() => store.menusByKey)
  const allMenuKeys = computed(() => store.allMenuKeys)
  const allFormTypes = computed(() => store.allFormTypes)
  const forms = computed(() => store.forms)
  const leads = computed(() => store.filteredLeads)
  const companyInfo = computed(() => store.companyInfo)
  const isLoading = computed(() => store.isLoading)

  // Counts (unfiltered)
  const schoolsCount = computed(() => store.schools.length)
  const venuesCount = computed(() => store.venues.length)
  const menusCount = computed(() => store.menus.length)
  const formsCount = computed(() => store.forms.length)
  const leadsCount = computed(() => store.leads.length)

  // ============ Schools ============

  async function fetchSchools(organizationId: string) {
    store.setLoading(true)
    try {
      const data = await eventosConfigApi.listSchools(organizationId)
      store.setSchools(data)
    } catch {
      toast.error('Error al cargar colegios')
    } finally {
      store.setLoading(false)
    }
  }

  async function createSchool(payload: SchoolCreateRequest) {
    store.setLoading(true)
    try {
      const school = await eventosConfigApi.createSchool(payload)
      store.addSchool(school)
      store.closeSchoolDialog()
      toast.success('Colegio creado exitosamente')
      return school
    } catch {
      toast.error('Error al crear colegio')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateSchool(schoolId: number, payload: SchoolUpdateRequest) {
    store.setLoading(true)
    try {
      const school = await eventosConfigApi.updateSchool(schoolId, payload)
      store.updateSchool(school)
      store.closeSchoolDialog()
      toast.success('Colegio actualizado exitosamente')
      return school
    } catch {
      toast.error('Error al actualizar colegio')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteSchool(schoolId: number) {
    store.setLoading(true)
    try {
      await eventosConfigApi.deleteSchool(schoolId)
      store.removeSchool(schoolId)
      store.closeDeleteSchoolDialog()
      toast.success('Colegio eliminado exitosamente')
      return true
    } catch {
      toast.error('Error al eliminar colegio')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  async function toggleSchoolActive(schoolId: number, isActive: boolean) {
    try {
      const school = await eventosConfigApi.updateSchool(schoolId, { is_active: isActive })
      store.updateSchool(school)
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  // ============ Venues ============

  async function fetchVenues(organizationId: string) {
    try {
      const data = await eventosConfigApi.listVenues(organizationId)
      store.setVenues(data)
    } catch {
      toast.error('Error al cargar salones')
    }
  }

  async function createVenue(payload: VenueCreateRequest) {
    store.setLoading(true)
    try {
      const venue = await eventosConfigApi.createVenue(payload)
      store.addVenue(venue)
      store.closeVenueDialog()
      toast.success('Salon creado exitosamente')
      return venue
    } catch {
      toast.error('Error al crear salon')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateVenue(venueId: number, payload: VenueUpdateRequest) {
    store.setLoading(true)
    try {
      const venue = await eventosConfigApi.updateVenue(venueId, payload)
      store.updateVenue(venue)
      store.closeVenueDialog()
      toast.success('Salon actualizado exitosamente')
      return venue
    } catch {
      toast.error('Error al actualizar salon')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteVenue(venueId: number) {
    store.setLoading(true)
    try {
      await eventosConfigApi.deleteVenue(venueId)
      store.removeVenue(venueId)
      store.closeDeleteVenueDialog()
      toast.success('Salon eliminado exitosamente')
      return true
    } catch {
      toast.error('Error al eliminar salon')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  async function toggleVenueActive(venueId: number, isActive: boolean) {
    try {
      const venue = await eventosConfigApi.updateVenue(venueId, { is_active: isActive })
      store.updateVenue(venue)
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  // ============ Menus ============

  async function fetchMenus(organizationId: string) {
    try {
      const data = await eventosConfigApi.listMenus(organizationId)
      store.setMenus(data)
    } catch {
      toast.error('Error al cargar menus')
    }
  }

  async function createMenu(payload: MenuConfigCreateRequest) {
    try {
      const menu = await eventosConfigApi.createMenu(payload)
      store.addMenu(menu)
      toast.success('Opcion de menu creada')
      return menu
    } catch {
      toast.error('Error al crear opcion de menu')
      return null
    }
  }

  async function updateMenu(menuId: number, payload: MenuConfigUpdateRequest) {
    try {
      const menu = await eventosConfigApi.updateMenu(menuId, payload)
      store.updateMenu(menu)
      return menu
    } catch {
      toast.error('Error al actualizar menu')
      return null
    }
  }

  // ============ Forms ============

  async function fetchForms(organizationId: string) {
    try {
      const data = await eventosConfigApi.listForms(organizationId)
      store.setForms(data)
    } catch {
      toast.error('Error al cargar formularios')
    }
  }

  async function updateForm(formId: number, payload: FormTemplateUpdateRequest) {
    store.setLoading(true)
    try {
      const form = await eventosConfigApi.updateForm(formId, payload)
      store.updateForm(form)
      store.closeFormDialog()
      toast.success('Formulario actualizado exitosamente')
      return form
    } catch {
      toast.error('Error al actualizar formulario')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Leads ============

  async function fetchLeads(organizationId: string) {
    try {
      const data = await eventosConfigApi.listLeads(organizationId)
      store.setLeads(data)
    } catch {
      toast.error('Error al cargar leads')
    }
  }

  async function updateLeadStatus(leadId: string, status: string) {
    try {
      const lead = await eventosConfigApi.updateLeadStatus(leadId, { status })
      store.updateLead(lead)
      toast.success('Estado actualizado')
      return lead
    } catch {
      toast.error('Error al actualizar estado del lead')
      return null
    }
  }

  // ============ Company Info ============

  async function fetchCompanyInfo(organizationId: string) {
    try {
      const data = await eventosConfigApi.getCompanyInfo(organizationId)
      store.setCompanyInfo(data)
    } catch {
      toast.error('Error al cargar datos de empresa')
    }
  }

  async function updateCompanyInfo(organizationId: string, payload: CompanyInfoUpdateRequest) {
    store.setLoading(true)
    try {
      const info = await eventosConfigApi.updateCompanyInfo(organizationId, payload)
      store.setCompanyInfo(info)
      toast.success('Datos de empresa actualizados')
      return info
    } catch {
      toast.error('Error al actualizar datos de empresa')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Seed Defaults ============

  async function seedDefaults(organizationId: string) {
    store.setLoading(true)
    try {
      const result = await eventosConfigApi.seedDefaults(organizationId)
      const total = Object.values(result).reduce((a, b) => a + b, 0)
      if (total > 0) {
        await fetchAll(organizationId)
        toast.success(`Datos por defecto cargados (${total} registros)`)
      } else {
        toast.info('Todos los datos ya existen, no se cargaron nuevos registros')
      }
      return result
    } catch {
      toast.error('Error al cargar datos por defecto')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Fetch All ============

  async function fetchAll(organizationId: string) {
    store.setLoading(true)
    try {
      await Promise.all([
        fetchSchools(organizationId),
        fetchVenues(organizationId),
        fetchMenus(organizationId),
        fetchForms(organizationId),
        fetchLeads(organizationId),
        fetchCompanyInfo(organizationId)
      ])
    } finally {
      store.setLoading(false)
    }
  }

  return {
    // State
    schools,
    venues,
    menus,
    menusByKey,
    forms,
    leads,
    companyInfo,
    isLoading,

    // Counts
    schoolsCount,
    venuesCount,
    menusCount,
    formsCount,
    leadsCount,

    // Schools
    fetchSchools,
    createSchool,
    updateSchool,
    deleteSchool,
    toggleSchoolActive,

    // Venues
    fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    toggleVenueActive,

    // Menus
    fetchMenus,
    createMenu,
    updateMenu,
    allMenuKeys,
    allFormTypes,

    // Forms
    fetchForms,
    updateForm,

    // Leads
    fetchLeads,
    updateLeadStatus,

    // Company Info
    fetchCompanyInfo,
    updateCompanyInfo,

    // Seed
    seedDefaults,

    // Bulk
    fetchAll,

    // Store passthrough
    openSchoolDialog: store.openSchoolDialog,
    closeSchoolDialog: store.closeSchoolDialog,
    openDeleteSchoolDialog: store.openDeleteSchoolDialog,
    closeDeleteSchoolDialog: store.closeDeleteSchoolDialog,
    openVenueDialog: store.openVenueDialog,
    closeVenueDialog: store.closeVenueDialog,
    openDeleteVenueDialog: store.openDeleteVenueDialog,
    closeDeleteVenueDialog: store.closeDeleteVenueDialog,
    openFormDialog: store.openFormDialog,
    closeFormDialog: store.closeFormDialog,
    openPdfDialog: store.openPdfDialog,
    closePdfDialog: store.closePdfDialog,
    setSchoolYearFilter: store.setSchoolYearFilter,
    setVenuesCategoryFilter: store.setVenuesCategoryFilter,
    setLeadsStatusFilter: store.setLeadsStatusFilter
  }
}
