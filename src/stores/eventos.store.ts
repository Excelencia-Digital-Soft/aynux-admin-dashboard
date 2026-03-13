import { defineStore } from 'pinia'
import type {
  EgresadosSchool,
  Venue,
  EventosMenuConfig,
  FormTemplate,
  EventosLead,
  CompanyInfo
} from '@/types/eventosConfig.types'

interface EventosState {
  // Data
  schools: EgresadosSchool[]
  venues: Venue[]
  menus: EventosMenuConfig[]
  forms: FormTemplate[]
  leads: EventosLead[]
  companyInfo: CompanyInfo | null

  // Filters
  schoolYearFilter: number | null
  venuesCategoryFilter: string | null
  leadsStatusFilter: string | null

  // UI State
  isLoading: boolean
  error: string | null

  // Dialogs
  showSchoolDialog: boolean
  showDeleteSchoolDialog: boolean
  showVenueDialog: boolean
  showDeleteVenueDialog: boolean
  showFormDialog: boolean
  showPdfDialog: boolean
  editingSchool: EgresadosSchool | null
  deletingSchool: EgresadosSchool | null
  editingVenue: Venue | null
  deletingVenue: Venue | null
  editingForm: FormTemplate | null
  pdfSchool: EgresadosSchool | null
}

export const useEventosStore = defineStore('eventos', {
  state: (): EventosState => ({
    schools: [],
    venues: [],
    menus: [],
    forms: [],
    leads: [],
    companyInfo: null,

    schoolYearFilter: null,
    venuesCategoryFilter: null,
    leadsStatusFilter: null,

    isLoading: false,
    error: null,

    showSchoolDialog: false,
    showDeleteSchoolDialog: false,
    showVenueDialog: false,
    showDeleteVenueDialog: false,
    showFormDialog: false,
    showPdfDialog: false,
    editingSchool: null,
    deletingSchool: null,
    editingVenue: null,
    deletingVenue: null,
    editingForm: null,
    pdfSchool: null
  }),

  getters: {
    filteredSchools(): EgresadosSchool[] {
      if (!this.schoolYearFilter) return this.schools
      return this.schools.filter(s => s.year === this.schoolYearFilter)
    },

    filteredVenues(): Venue[] {
      if (!this.venuesCategoryFilter) return this.venues
      return this.venues.filter(v => v.category === this.venuesCategoryFilter)
    },

    filteredLeads(): EventosLead[] {
      if (!this.leadsStatusFilter) return this.leads
      return this.leads.filter(l => l.status === this.leadsStatusFilter)
    },

    menusByKey(): Record<string, EventosMenuConfig[]> {
      const groups: Record<string, EventosMenuConfig[]> = {}
      for (const menu of this.menus) {
        if (!groups[menu.menu_key]) groups[menu.menu_key] = []
        groups[menu.menu_key].push(menu)
      }
      for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => a.option_number - b.option_number)
      }
      return groups
    },

    allMenuKeys(): string[] {
      return [...new Set(this.menus.map(m => m.menu_key))].sort()
    },

    allFormTypes(): string[] {
      return this.forms.map(f => f.form_type).sort()
    }
  },

  actions: {
    // ============ Data Setters ============

    setSchools(schools: EgresadosSchool[]) { this.schools = schools },
    setVenues(venues: Venue[]) { this.venues = venues },
    setMenus(menus: EventosMenuConfig[]) { this.menus = menus },
    setForms(forms: FormTemplate[]) { this.forms = forms },
    setLeads(leads: EventosLead[]) { this.leads = leads },
    setCompanyInfo(info: CompanyInfo | null) { this.companyInfo = info },

    addSchool(school: EgresadosSchool) { this.schools.push(school) },
    updateSchool(school: EgresadosSchool) {
      const idx = this.schools.findIndex(s => s.id === school.id)
      if (idx >= 0) this.schools[idx] = school
    },
    removeSchool(schoolId: number) {
      this.schools = this.schools.filter(s => s.id !== schoolId)
    },

    addVenue(venue: Venue) { this.venues.push(venue) },
    updateVenue(venue: Venue) {
      const idx = this.venues.findIndex(v => v.id === venue.id)
      if (idx >= 0) this.venues[idx] = venue
    },
    removeVenue(venueId: number) {
      this.venues = this.venues.filter(v => v.id !== venueId)
    },

    addMenu(menu: EventosMenuConfig) { this.menus.push(menu) },

    updateMenu(menu: EventosMenuConfig) {
      const idx = this.menus.findIndex(m => m.id === menu.id)
      if (idx >= 0) this.menus[idx] = menu
    },

    updateForm(form: FormTemplate) {
      const idx = this.forms.findIndex(f => f.id === form.id)
      if (idx >= 0) this.forms[idx] = form
    },

    updateLead(lead: EventosLead) {
      const idx = this.leads.findIndex(l => l.id === lead.id)
      if (idx >= 0) this.leads[idx] = lead
    },

    // ============ UI ============

    setLoading(loading: boolean) { this.isLoading = loading },
    setError(error: string | null) { this.error = error },

    // ============ Filters ============

    setSchoolYearFilter(year: number | null) { this.schoolYearFilter = year },
    setVenuesCategoryFilter(cat: string | null) { this.venuesCategoryFilter = cat },
    setLeadsStatusFilter(status: string | null) { this.leadsStatusFilter = status },

    // ============ Dialogs ============

    openSchoolDialog(school: EgresadosSchool | null = null) {
      this.editingSchool = school
      this.showSchoolDialog = true
    },
    closeSchoolDialog() {
      this.showSchoolDialog = false
      this.editingSchool = null
    },

    openDeleteSchoolDialog(school: EgresadosSchool) {
      this.deletingSchool = school
      this.showDeleteSchoolDialog = true
    },
    closeDeleteSchoolDialog() {
      this.showDeleteSchoolDialog = false
      this.deletingSchool = null
    },

    openVenueDialog(venue: Venue | null = null) {
      this.editingVenue = venue
      this.showVenueDialog = true
    },
    closeVenueDialog() {
      this.showVenueDialog = false
      this.editingVenue = null
    },

    openDeleteVenueDialog(venue: Venue) {
      this.deletingVenue = venue
      this.showDeleteVenueDialog = true
    },
    closeDeleteVenueDialog() {
      this.showDeleteVenueDialog = false
      this.deletingVenue = null
    },

    openFormDialog(form: FormTemplate) {
      this.editingForm = form
      this.showFormDialog = true
    },
    closeFormDialog() {
      this.showFormDialog = false
      this.editingForm = null
    },

    openPdfDialog(school: EgresadosSchool) {
      this.pdfSchool = school
      this.showPdfDialog = true
    },
    closePdfDialog() {
      this.showPdfDialog = false
      this.pdfSchool = null
    }
  }
})
