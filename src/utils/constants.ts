import type {
  DocumentTypeConfig,
  DocumentContext,
  UploadDestination,
  UploadDestinationOption
} from '@/types/document.types'

export const DOCUMENT_TYPES: Record<string, DocumentTypeConfig> = {
  // Common types (available in both contexts)
  general: {
    label: 'General',
    labelEs: 'General',
    icon: '📄',
    description: 'General purpose documents',
    global: true,
    tenant: true
  },
  faq: {
    label: 'FAQ',
    labelEs: 'Preguntas Frecuentes',
    icon: '❓',
    description: 'Frequently asked questions',
    global: true,
    tenant: true
  },
  // Global-only types (Excelencia knowledge base)
  mission_vision: {
    label: 'Mission & Vision',
    labelEs: 'Mision y Vision',
    icon: '🎯',
    description: 'Company mission and vision statements',
    global: true,
    tenant: false
  },
  contact_info: {
    label: 'Contact Info',
    labelEs: 'Informacion de Contacto',
    icon: '📞',
    description: 'Contact information and locations',
    global: true,
    tenant: false
  },
  software_catalog: {
    label: 'Software Catalog',
    labelEs: 'Catalogo de Software',
    icon: '💻',
    description: 'Software products and services catalog',
    global: true,
    tenant: false
  },
  clients: {
    label: 'Clients',
    labelEs: 'Clientes',
    icon: '👥',
    description: 'Client information and testimonials',
    global: true,
    tenant: false
  },
  success_stories: {
    label: 'Success Stories',
    labelEs: 'Casos de Exito',
    icon: '🏆',
    description: 'Success stories and case studies',
    global: true,
    tenant: false
  },
  // Tenant-only types
  guide: {
    label: 'Guide',
    labelEs: 'Guia',
    icon: '📖',
    description: 'User guides and manuals',
    global: false,
    tenant: true
  },
  policy: {
    label: 'Policy',
    labelEs: 'Politica',
    icon: '📜',
    description: 'Company policies and procedures',
    global: false,
    tenant: true
  },
  product_info: {
    label: 'Product Info',
    labelEs: 'Info de Producto',
    icon: '🛒',
    description: 'Product information and specifications',
    global: false,
    tenant: true
  },
  uploaded_pdf: {
    label: 'Uploaded PDF',
    labelEs: 'PDF Subido',
    icon: '📑',
    description: 'Uploaded PDF documents',
    global: false,
    tenant: true
  },
  training: {
    label: 'Training',
    labelEs: 'Capacitacion',
    icon: '🎓',
    description: 'Training materials and tutorials',
    global: false,
    tenant: true
  },
  support: {
    label: 'Support',
    labelEs: 'Soporte',
    icon: '🛟',
    description: 'Support documentation and troubleshooting',
    global: false,
    tenant: true
  }
}

export function getTypesForContext(
  context: DocumentContext,
  includeCommon = true
): string[] {
  const types: string[] = []
  for (const [key, config] of Object.entries(DOCUMENT_TYPES)) {
    if (context === 'global' && config.global) {
      types.push(key)
    } else if (context === 'tenant' && config.tenant) {
      types.push(key)
    }
  }
  return types
}

export function getTypeOptions(
  context: DocumentContext,
  language: 'en' | 'es' = 'es'
): Array<{ value: string; label: string }> {
  const types = getTypesForContext(context)
  return types.map((key) => {
    const config = DOCUMENT_TYPES[key]
    const label = language === 'es' ? config.labelEs : config.label
    return {
      value: key,
      label: `${config.icon} ${label}`
    }
  })
}

export function getTypeLabel(
  docType: string,
  language: 'en' | 'es' = 'es',
  includeIcon = true
): string {
  const config = DOCUMENT_TYPES[docType]
  if (!config) return docType

  const label = language === 'es' ? config.labelEs : config.label
  return includeIcon ? `${config.icon} ${label}` : label
}

export function getTypeIcon(docType: string): string {
  return DOCUMENT_TYPES[docType]?.icon || '📄'
}

// Page size options
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Default page size
export const DEFAULT_PAGE_SIZE = 25

// Upload Destination Options
export const UPLOAD_DESTINATIONS: UploadDestinationOption[] = [
  {
    value: 'global',
    label: 'Base de Conocimiento Global',
    icon: 'pi-globe',
    description: 'Documentos disponibles para todos los agentes'
  },
  {
    value: 'tenant',
    label: 'Documentos del Tenant',
    icon: 'pi-building',
    description: 'Documentos específicos de tu organización',
    requiresOrg: true
  },
  {
    value: 'agent',
    label: 'Conocimiento de Agente',
    icon: 'pi-user',
    description: 'Documentos específicos para un agente',
    requiresAgent: true
  }
]

// Knowledge Source Options (for filtering in Knowledge Base view)
export const KNOWLEDGE_SOURCE_OPTIONS = [
  { value: 'all', label: 'Todos', icon: 'pi-list' },
  { value: 'global', label: 'Global', icon: 'pi-globe' },
  { value: 'tenant', label: 'Tenant', icon: 'pi-building' },
  { value: 'agent', label: 'Agente', icon: 'pi-user' }
]

export function getDestinationLabel(destination: UploadDestination): string {
  const option = UPLOAD_DESTINATIONS.find((d) => d.value === destination)
  return option?.label || destination
}
