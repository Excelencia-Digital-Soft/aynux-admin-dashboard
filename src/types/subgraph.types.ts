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
 * PharmacyGraph - Multi-step customer debt inquiry workflow
 *
 * Flow:
 *   Entry: customer_identification_node
 *   identification → [router | registration | END]
 *   registration → [router | END]
 *   router → [debt_check | confirmation | invoice | payment_link | END]
 *   debt_check → [router | payment_link | END]
 *   confirmation → [router | payment_link | END]
 *   invoice → END
 *   payment_link → END
 */
const PharmacyGraphDefinition: SubgraphDefinition = {
  graphName: 'PharmacyGraph',
  displayName: 'Flujo de Farmacia',
  description:
    'Identificación de cliente, consulta de deuda, confirmación y generación de comprobantes',
  domainKey: 'pharmacy',
  domainColor: '#14b8a6',
  entryNode: 'customer_identification_node',
  nodes: [
    {
      id: 'customer_identification_node',
      type: 'entry',
      label: 'Identificación Cliente',
      description: 'Identifica al cliente por teléfono o documento',
      icon: 'pi-id-card'
    },
    {
      id: 'customer_registration_node',
      type: 'operation',
      label: 'Registro Cliente',
      description: 'Registra nuevos clientes en el sistema',
      icon: 'pi-user-plus'
    },
    {
      id: 'pharmacy_router',
      type: 'router',
      label: 'Router Farmacia',
      description: 'Analiza intención y dirige al nodo correspondiente',
      icon: 'pi-sitemap'
    },
    {
      id: 'debt_check_node',
      type: 'operation',
      label: 'Consulta Deuda',
      description: 'Consulta deuda pendiente del cliente',
      icon: 'pi-dollar'
    },
    {
      id: 'confirmation_node',
      type: 'operation',
      label: 'Confirmación',
      description: 'Solicita confirmación del cliente',
      icon: 'pi-check-circle'
    },
    {
      id: 'invoice_generation_node',
      type: 'operation',
      label: 'Generación Recibo',
      description: 'Genera comprobante de pago',
      icon: 'pi-file'
    },
    {
      id: 'payment_link_node',
      type: 'operation',
      label: 'Link de Pago',
      description: 'Genera enlace de pago electrónico',
      icon: 'pi-link'
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
    // From customer_identification_node
    {
      from: 'customer_identification_node',
      to: 'pharmacy_router',
      label: 'Identificado',
      condition: 'customer_identified'
    },
    {
      from: 'customer_identification_node',
      to: 'customer_registration_node',
      label: 'Registrar',
      condition: 'register_prompt',
      isConditional: true
    },
    {
      from: 'customer_identification_node',
      to: 'end',
      label: 'Cancelar/Espera',
      isConditional: true
    },
    // From customer_registration_node
    {
      from: 'customer_registration_node',
      to: 'pharmacy_router',
      label: 'Registrado'
    },
    {
      from: 'customer_registration_node',
      to: 'end',
      label: 'Espera datos',
      isConditional: true
    },
    // From pharmacy_router
    { from: 'pharmacy_router', to: 'debt_check_node', label: 'debt_query' },
    { from: 'pharmacy_router', to: 'confirmation_node', label: 'confirm' },
    { from: 'pharmacy_router', to: 'invoice_generation_node', label: 'invoice' },
    { from: 'pharmacy_router', to: 'payment_link_node', label: 'payment_link' },
    { from: 'pharmacy_router', to: 'end', label: 'fallback', isConditional: true },
    // From debt_check_node
    { from: 'debt_check_node', to: 'pharmacy_router', label: 'Continuar' },
    {
      from: 'debt_check_node',
      to: 'payment_link_node',
      label: 'Confirmar pago',
      condition: 'debt_confirmed',
      isConditional: true
    },
    { from: 'debt_check_node', to: 'end', label: 'Espera', isConditional: true },
    // From confirmation_node
    {
      from: 'confirmation_node',
      to: 'payment_link_node',
      label: 'Proceder',
      condition: 'confirmed',
      isConditional: true
    },
    { from: 'confirmation_node', to: 'pharmacy_router', label: 'Continuar' },
    { from: 'confirmation_node', to: 'end', label: 'Espera', isConditional: true },
    // Terminal nodes
    { from: 'invoice_generation_node', to: 'end' },
    { from: 'payment_link_node', to: 'end' }
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
