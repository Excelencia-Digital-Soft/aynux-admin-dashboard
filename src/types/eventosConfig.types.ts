// Eventos Configuration types

// ============================================================
// School Types
// ============================================================

export interface PriceEntry {
  label: string
  amount: number | null
}

export interface PaymentInfo {
  cash_address: string
  bank_name: string
  cbu: string
  alias: string
  cuit: string
  email: string
}

export interface EgresadosSchool {
  id: number
  organization_id: string
  school_name: string
  year: number
  event_date: string | null
  venue_name: string | null
  prices: PriceEntry[] | null
  payment_info: PaymentInfo[] | null
  enrollment_link: string | null
  is_active: boolean
  sort_order: number
}

export interface SchoolCreateRequest {
  organization_id: string
  school_name: string
  year: number
  event_date?: string | null
  venue_name?: string | null
  prices?: PriceEntry[] | null
  payment_info?: PaymentInfo[] | null
  enrollment_link?: string | null
  sort_order?: number
}

export interface SchoolUpdateRequest {
  school_name?: string
  year?: number
  event_date?: string | null
  venue_name?: string | null
  prices?: PriceEntry[] | null
  payment_info?: PaymentInfo[] | null
  enrollment_link?: string | null
  is_active?: boolean
  sort_order?: number
}

// ============================================================
// Venue Types
// ============================================================

export interface Venue {
  id: number
  organization_id: string
  name: string
  category: string
  capacity: number | null
  address: string | null
  description: string | null
  is_active: boolean
  sort_order: number
}

export interface VenueCreateRequest {
  organization_id: string
  name: string
  category: string
  capacity?: number | null
  address?: string | null
  description?: string | null
  sort_order?: number
}

export interface VenueUpdateRequest {
  name?: string
  category?: string
  capacity?: number | null
  address?: string | null
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

// ============================================================
// Menu Config Types
// ============================================================

export interface EventosMenuConfig {
  id: number
  organization_id: string
  menu_key: string
  option_number: number
  display_text: string
  target_menu_key: string | null
  target_action: string | null
  action_metadata: Record<string, unknown> | null
  is_enabled: boolean
  sort_order: number
}

export interface MenuConfigCreateRequest {
  organization_id: string
  menu_key: string
  option_number: number
  display_text: string
  target_menu_key?: string | null
  target_action?: string | null
  action_metadata?: Record<string, unknown> | null
  sort_order?: number
}

export interface MenuConfigUpdateRequest {
  display_text?: string
  target_menu_key?: string | null
  target_action?: string | null
  action_metadata?: Record<string, unknown> | null
  is_enabled?: boolean
  sort_order?: number
}

// ============================================================
// Form Template Types
// ============================================================

export interface FormField {
  name: string
  label: string
  type: string
  required: boolean
}

export interface FormTemplate {
  id: number
  organization_id: string
  form_type: string
  display_name: string
  instruction_text: string | null
  fields: FormField[] | null
  notification_tag: string | null
  is_active: boolean
}

export interface FormTemplateUpdateRequest {
  display_name?: string
  instruction_text?: string | null
  fields?: FormField[] | null
  notification_tag?: string | null
  is_active?: boolean
}

// ============================================================
// Lead Types
// ============================================================

export interface EventosLead {
  id: string
  organization_id: string
  user_phone: string
  category: string | null
  form_type: string | null
  raw_messages: unknown[] | null
  status: string
  created_at: string | null
}

export interface LeadStatusUpdateRequest {
  status: string
}

// ============================================================
// Company Info Types
// ============================================================

export interface CompanyInfo {
  id: number
  organization_id: string
  company_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  google_maps_link: string | null
  calendar_link: string | null
  business_hours: Record<string, string> | null
  payment_hours: string | null
  social_media: Record<string, string> | null
  additional_info: string | null
  static_pages: Record<string, string> | null
}

export interface CompanyInfoUpdateRequest {
  company_name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  google_maps_link?: string | null
  calendar_link?: string | null
  business_hours?: Record<string, string> | null
  payment_hours?: string | null
  social_media?: Record<string, string> | null
  additional_info?: string | null
  static_pages?: Record<string, string> | null
}

// ============================================================
// Helper Functions
// ============================================================

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    hotel: 'Hotel',
    quinta: 'Quinta',
    salon: 'Salon',
    otro: 'Otro'
  }
  return labels[category] || category
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    closed: 'Cerrado'
  }
  return labels[status] || status
}

export function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return `$${value.toLocaleString('es-AR')}`
}
