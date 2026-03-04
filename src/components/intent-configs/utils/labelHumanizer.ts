/**
 * labelHumanizer - Centralized utility for mapping technical codes
 * to user-friendly Spanish labels for the Graph Topology UI.
 *
 * All humanization logic lives here to avoid duplication across components.
 */

const TARGET_INTENT_MAP: Record<string, string> = {
  human_escalation: 'Transferir a humano',
  cancel_flow: 'Cancelar conversación',
  show_menu: 'Mostrar menú',
  main_menu: 'Menú principal',
  greeting: 'Saludo',
  goodbye: 'Despedida',
  confirm: 'Confirmar',
  deny: 'Rechazar',
  help: 'Ayuda',
  back: 'Volver atrás',
  restart: 'Reiniciar',
  schedule_appointment: 'Agendar turno',
  cancel_appointment: 'Cancelar turno',
  reschedule_appointment: 'Reprogramar turno',
  check_appointment: 'Consultar turno',
  check_debt: 'Consultar deuda',
  make_payment: 'Realizar pago',
  check_balance: 'Consultar saldo',
  register: 'Registrarse',
  login: 'Identificarse',
  logout: 'Cerrar sesión',
  switch_account: 'Cambiar cuenta',
}

export function humanizeTargetIntent(key: string): string {
  if (TARGET_INTENT_MAP[key]) return TARGET_INTENT_MAP[key]
  // Fallback: underscores → spaces + capitalize first letter
  return key
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

const NODE_ID_MAP: Record<string, string> = {
  human_escalation_node: 'Transferir a humano',
  main_menu_node: 'Menú principal',
  payment_processor: 'Procesador de pagos',
  debt_manager: 'Gestor de deudas',
  account_switcher: 'Cambio de cuenta',
  auth_plex: 'Identificación',
  info_node: 'Información',
  turnos: 'Turnos',
  registro: 'Registro',
  reschedule: 'Reprogramación',
  session: 'Sesión',
  response_formatter: 'Formateador de respuesta',
  router: 'Distribuidor',
}

export function humanizeNodeId(id: string): string {
  if (NODE_ID_MAP[id]) return NODE_ID_MAP[id]
  return id
    .replace(/_node$/, '')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

const AWAITING_TYPE_MAP: Record<string, string> = {
  awaiting_date: 'Fecha',
  awaiting_time: 'Hora',
  awaiting_amount: 'Monto',
  awaiting_confirmation: 'Confirmación',
  awaiting_selection: 'Selección',
  awaiting_input: 'Texto libre',
  awaiting_payment: 'Pago',
  awaiting_document: 'Documento',
  awaiting_name: 'Nombre',
  awaiting_phone: 'Teléfono',
  awaiting_email: 'Email',
  awaiting_dni: 'DNI',
  awaiting_auth: 'Identificación',
  awaiting_account: 'Cuenta',
}

export function humanizeAwaitingType(type: string): string {
  if (AWAITING_TYPE_MAP[type]) return AWAITING_TYPE_MAP[type]
  return type
    .replace(/^awaiting_/, '')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function humanizeResponseIntent(intent: string): string {
  return humanizeTargetIntent(intent)
}

export interface PriorityDisplay {
  label: string
  color: string
}

export function getPriorityDisplay(priority: number): PriorityDisplay {
  if (priority >= 80) return { label: 'Alta', color: '#10b981' }
  if (priority >= 40) return { label: 'Media', color: '#f59e0b' }
  return { label: 'Baja', color: '#6b7280' }
}

export const CONFIG_TYPE_LABELS: Record<string, { label: string; tooltip: string }> = {
  global_keyword: {
    label: 'Palabras clave globales',
    tooltip: 'Palabras que el usuario puede escribir en cualquier momento, como "menú", "cancelar" o "ayuda"',
  },
  button_mapping: {
    label: 'Botones de WhatsApp',
    tooltip: 'Se activa cuando el usuario toca un botón de respuesta rápida',
  },
  menu_option: {
    label: 'Opciones de menú',
    tooltip: 'Se activa cuando el usuario escribe un número (1, 2, 3...)',
  },
  list_selection: {
    label: 'Listas de WhatsApp',
    tooltip: 'Se activa cuando el usuario elige de una lista',
  },
  intent_node_mapping: {
    label: 'Detección por IA',
    tooltip: 'Reglas de respaldo que usan inteligencia artificial',
  },
}

export function getConfigTypeLabel(type: string): string {
  return CONFIG_TYPE_LABELS[type]?.label || type
}

export function getConfigTypeTooltip(type: string): string | null {
  return CONFIG_TYPE_LABELS[type]?.tooltip || null
}

export const ACTION_NODE_BADGE_MAP: Record<string, string> = {
  auth_plex: 'IDENTIF.',
  debt_manager: 'DEUDAS',
  payment_processor: 'PAGOS',
  account_switcher: 'CUENTAS',
  info_node: 'INFO',
  turnos: 'TURNOS',
  registro: 'REGISTRO',
  reschedule: 'REPROG.',
  session: 'SESIÓN',
}
