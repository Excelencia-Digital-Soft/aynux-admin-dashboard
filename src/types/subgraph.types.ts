// =============================================================================
// Subgraph Types - Visualization definitions for domain-specific LangGraph subgraphs
// =============================================================================
// Static definitions for PharmacyGraph, EcommerceGraph, and CreditGraph
// Used by SubgraphFlowDialog.vue for Vue Flow visualization
// =============================================================================

/**
 * Node types for subgraph visualization
 */
export type SubgraphNodeType = 'entry' | 'router' | 'operation' | 'end'

/**
 * A node in the subgraph visualization
 */
export interface SubgraphNode {
  id: string
  type: SubgraphNodeType
  label: string
  description?: string
  icon?: string
}

/**
 * An edge connecting two nodes in the subgraph
 */
export interface SubgraphEdge {
  from: string
  to: string
  label?: string
  condition?: string
  isConditional?: boolean
}

/**
 * Complete definition of a subgraph for visualization
 */
export interface SubgraphDefinition {
  graphName: string
  displayName: string
  description: string
  domainKey: string
  domainColor: string
  entryNode: string
  nodes: SubgraphNode[]
  edges: SubgraphEdge[]
}

// =============================================================================
// Subgraph Definitions
// =============================================================================

/**
 * PharmacyGraph - Multi-step customer debt inquiry workflow (V2)
 *
 * Flow:
 *   Entry: pharmacy_router
 *   router → [auth_plex | debt_manager | payment_processor | account_switcher | info_node | END]
 *   auth_plex → [debt_manager | payment_processor | END]
 *   debt_manager → END
 *   payment_processor → END
 *   account_switcher → [debt_manager | END]
 *   info_node → END
 */
const PharmacyGraphDefinition: SubgraphDefinition = {
  graphName: 'PharmacyGraph',
  displayName: 'Flujo de Farmacia (V2)',
  description:
    'Autenticación Plex, consulta de deuda, pagos y gestión de cuentas (Arquitectura V2)',
  domainKey: 'pharmacy',
  domainColor: '#14b8a6',
  entryNode: 'pharmacy_router',
  nodes: [
    {
      id: 'pharmacy_router',
      type: 'router',
      label: 'Router Supervisor',
      description: 'Enrutamiento basado en DB y estado actual',
      icon: 'pi-sitemap'
    },
    {
      id: 'auth_plex',
      type: 'operation',
      label: 'Autenticación Plex',
      description: 'Valida identidad contra ERP Plex (DNI/Cuenta)',
      icon: 'pi-id-card'
    },
    {
      id: 'debt_manager',
      type: 'operation',
      label: 'Gestor de Deuda',
      description: 'Consulta saldos y detalles de facturas',
      icon: 'pi-dollar'
    },
    {
      id: 'payment_processor',
      type: 'operation',
      label: 'Procesador Pagos',
      description: 'Genera links de pago y valida montos',
      icon: 'pi-credit-card'
    },
    {
      id: 'account_switcher',
      type: 'operation',
      label: 'Selector Cuenta',
      description: 'Cambia entre cuentas asociadas o nuevas',
      icon: 'pi-users'
    },
    {
      id: 'info_node',
      type: 'operation',
      label: 'Info Farmacia',
      description: 'Información general, horarios y contacto',
      icon: 'pi-info-circle'
    },
    {
      id: 'end',
      type: 'end',
      label: 'Fin / Respuesta',
      description: 'Formatea respuesta y termina turno',
      icon: 'pi-check'
    }
  ],
  edges: [
    // From Router
    { from: 'pharmacy_router', to: 'auth_plex', label: 'Requiere auth' },
    { from: 'pharmacy_router', to: 'debt_manager', label: 'Consultar deuda' },
    { from: 'pharmacy_router', to: 'payment_processor', label: 'Pagar' },
    { from: 'pharmacy_router', to: 'account_switcher', label: 'Cambiar cuenta' },
    { from: 'pharmacy_router', to: 'info_node', label: 'Información' },
    { from: 'pharmacy_router', to: 'end', label: 'Respuesta directa', isConditional: true },

    // From Auth Plex
    { from: 'auth_plex', to: 'debt_manager', label: 'Auth OK → Deuda' },
    { from: 'auth_plex', to: 'payment_processor', label: 'Auth OK → Pago' },
    { from: 'auth_plex', to: 'end', label: 'Falló / Canceló', isConditional: true },

    // From Account Switcher
    { from: 'account_switcher', to: 'debt_manager', label: 'Cuenta seleccionada' },
    { from: 'account_switcher', to: 'end', label: 'Cancelado', isConditional: true },

    // Operation Nodes to End (via Response Formatter)
    { from: 'debt_manager', to: 'end' },
    { from: 'payment_processor', to: 'end' },
    { from: 'info_node', to: 'end' }
  ]
}

/**
 * EcommerceGraph - Product search, promotions, tracking, and invoicing
 *
 * Flow:
 *   Entry: ecommerce_router (router is entry point)
 *   router → [product | promotions | tracking | invoice | END]
 *   all_nodes → END
 */
const EcommerceGraphDefinition: SubgraphDefinition = {
  graphName: 'EcommerceGraph',
  displayName: 'Flujo de E-commerce',
  description: 'Búsqueda de productos, promociones, seguimiento de pedidos y facturación',
  domainKey: 'ecommerce',
  domainColor: '#10b981',
  entryNode: 'ecommerce_router',
  nodes: [
    {
      id: 'ecommerce_router',
      type: 'router',
      label: 'Router E-commerce',
      description: 'Analiza intención con LLM y dirige al nodo correspondiente',
      icon: 'pi-shopping-cart'
    },
    {
      id: 'product_node',
      type: 'operation',
      label: 'Productos',
      description: 'Búsqueda y consulta de productos',
      icon: 'pi-box'
    },
    {
      id: 'promotions_node',
      type: 'operation',
      label: 'Promociones',
      description: 'Información de promociones activas',
      icon: 'pi-percentage'
    },
    {
      id: 'tracking_node',
      type: 'operation',
      label: 'Seguimiento',
      description: 'Seguimiento de pedidos',
      icon: 'pi-map-marker'
    },
    {
      id: 'invoice_node',
      type: 'operation',
      label: 'Factura',
      description: 'Consulta de facturas y comprobantes',
      icon: 'pi-file'
    },
    {
      id: 'end',
      type: 'end',
      label: 'Fin',
      description: 'Finaliza el flujo',
      icon: 'pi-check'
    }
  ],
  edges: [
    // From router to operation nodes
    { from: 'ecommerce_router', to: 'product_node', label: 'product_search' },
    { from: 'ecommerce_router', to: 'promotions_node', label: 'promotions' },
    { from: 'ecommerce_router', to: 'tracking_node', label: 'tracking' },
    { from: 'ecommerce_router', to: 'invoice_node', label: 'invoice' },
    { from: 'ecommerce_router', to: 'end', label: 'fallback', isConditional: true },
    // All operation nodes to END
    { from: 'product_node', to: 'end' },
    { from: 'promotions_node', to: 'end' },
    { from: 'tracking_node', to: 'end' },
    { from: 'invoice_node', to: 'end' }
  ]
}

/**
 * CreditGraph - Balance inquiry, payments, and payment schedules
 *
 * Flow:
 *   Entry: credit_router
 *   router → [balance | payment | schedule | END]
 *   all_nodes → END
 */
const CreditGraphDefinition: SubgraphDefinition = {
  graphName: 'CreditGraph',
  displayName: 'Flujo de Crédito',
  description: 'Consulta de saldo, pagos y cronograma de pagos',
  domainKey: 'credit',
  domainColor: '#f59e0b',
  entryNode: 'credit_router',
  nodes: [
    {
      id: 'credit_router',
      type: 'router',
      label: 'Router Crédito',
      description: 'Analiza intención por keywords y dirige al nodo correspondiente',
      icon: 'pi-wallet'
    },
    {
      id: 'balance_node',
      type: 'operation',
      label: 'Consulta Saldo',
      description: 'Consulta saldo y estado de cuenta',
      icon: 'pi-chart-bar'
    },
    {
      id: 'payment_node',
      type: 'operation',
      label: 'Pago',
      description: 'Procesa pagos y abonos',
      icon: 'pi-credit-card'
    },
    {
      id: 'schedule_node',
      type: 'operation',
      label: 'Cronograma',
      description: 'Muestra cronograma de pagos',
      icon: 'pi-calendar'
    },
    {
      id: 'end',
      type: 'end',
      label: 'Fin',
      description: 'Finaliza el flujo',
      icon: 'pi-check'
    }
  ],
  edges: [
    // From router to operation nodes
    { from: 'credit_router', to: 'balance_node', label: 'balance' },
    { from: 'credit_router', to: 'payment_node', label: 'payment' },
    { from: 'credit_router', to: 'schedule_node', label: 'schedule' },
    { from: 'credit_router', to: 'end', label: 'fallback', isConditional: true },
    // All operation nodes to END
    { from: 'balance_node', to: 'end' },
    { from: 'payment_node', to: 'end' },
    { from: 'schedule_node', to: 'end' }
  ]
}

// =============================================================================
// Exports
// =============================================================================

/**
 * Map of all subgraph definitions by graph name
 */
export const SUBGRAPH_DEFINITIONS: Record<string, SubgraphDefinition> = {
  PharmacyGraph: PharmacyGraphDefinition,
  EcommerceGraph: EcommerceGraphDefinition,
  CreditGraph: CreditGraphDefinition
}

/**
 * Get a subgraph definition by name
 */
export function getSubgraphDefinition(graphName: string): SubgraphDefinition | null {
  return SUBGRAPH_DEFINITIONS[graphName] || null
}

/**
 * Check if a subgraph definition exists
 */
export function hasSubgraphDefinition(graphName: string): boolean {
  return graphName in SUBGRAPH_DEFINITIONS
}
