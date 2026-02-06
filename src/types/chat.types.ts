// Interactive message types (WhatsApp-style)
export interface InteractiveButton {
  id: string
  titulo: string
}

export interface InteractiveListItem {
  id: string
  titulo: string
  descripcion?: string
}

export interface InteractiveResponse {
  type: 'button_reply' | 'list_reply'
  id: string
  title: string
}

// Conversation types
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    tokens?: number
    latency_ms?: number
    model?: string
  }
  // Interactive message fields
  responseType?: 'text' | 'buttons' | 'list'
  buttons?: InteractiveButton[]
  listItems?: InteractiveListItem[]
  interactiveResponse?: InteractiveResponse
}

export interface ConversationThread {
  id: string
  title?: string
  messages: ConversationMessage[]
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

// Agent execution types
export interface ExecutionStep {
  id: string
  step_number: number
  node_type: 'start' | 'tool_call' | 'llm_call' | 'decision' | 'end' | 'error'
  name: string
  description?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  duration_ms?: number
  status: 'pending' | 'running' | 'completed' | 'error'
  error_message?: string
  timestamp: string
  children?: ExecutionStep[]
}

export interface AgentState {
  current_step: string
  context: Record<string, unknown>
  variables: Record<string, unknown>
  tool_calls: ToolCall[]
  reasoning_steps: ReasoningStep[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  duration_ms?: number
  status: 'pending' | 'running' | 'completed' | 'error'
  error?: string
}

export interface ReasoningStep {
  id: string
  thought: string
  action?: string
  observation?: string
  timestamp: string
}

// RAG search information for graph visualization
export interface RagInfo {
  used: boolean           // Si se usó RAG
  query?: string         // Query de búsqueda
  results_count?: number // Número de resultados
  duration_ms?: number   // Tiempo de búsqueda
  avg_similarity?: number // Similitud promedio (0-1)
  sources?: string[]     // Títulos de documentos encontrados
}

// Graph visualization types for Vue Flow
export interface GraphNode {
  id: string
  type: 'start' | 'tool' | 'llm' | 'decision' | 'end' | 'error' | 'custom'
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    status?: 'pending' | 'running' | 'completed' | 'error'
    duration_ms?: number
    icon?: string
    metadata?: Record<string, unknown>
    rag_info?: RagInfo  // RAG search metrics
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type?: 'default' | 'step' | 'conditional' | 'error'
  label?: string
  animated?: boolean
  style?: Record<string, string>
}

export interface ExecutionGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  layout?: 'dagre' | 'elk' | 'manual'
}

// Chat metrics
export interface ChatMetrics {
  total_messages: number
  total_tokens: number
  avg_response_time_ms: number
  tool_calls_count: number
  error_rate: number
  session_duration_ms: number
}

// Chat request/response
export interface ChatRequest {
  message: string
  thread_id?: string
  context?: Record<string, unknown>
  stream?: boolean
}

export interface ChatResponse {
  message: ConversationMessage
  thread_id: string
  execution_steps?: ExecutionStep[]
  agent_state?: AgentState
  metrics?: {
    tokens: number
    latency_ms: number
  }
}

export interface StreamChunk {
  type: 'token' | 'step' | 'tool_start' | 'tool_end' | 'done' | 'error'
  content?: string
  step?: ExecutionStep
  tool_call?: ToolCall
  error?: string
}

// Webhook simulation types
export type BusinessDomain = 'excelencia' | 'ecommerce' | 'healthcare' | 'credit' | 'pharmacy' | 'medical_appointments' | 'enav'

export interface WebhookSimulationConfig {
  enabled: boolean
  phoneNumber: string
  userName: string
  businessDomain: BusinessDomain
  // Chattigo simulation fields
  did: string | null
  simulateBypass: boolean
  organizationId: string | null
  pharmacyId: string | null
}

export interface WebhookSimulationRequest {
  message: string
  phone_number: string
  user_name: string
  business_domain: BusinessDomain
  session_id?: string
  debug: boolean
  // Chattigo simulation fields
  did?: string | null
  simulate_bypass?: boolean
  organization_id?: string | null
  pharmacy_id?: string | null
}

export interface WebhookSimulationResponse {
  session_id: string
  response: string
  agent_used: string
  execution_steps?: ExecutionStep[]
  // Interactive response fields
  response_type?: 'text' | 'buttons' | 'list'
  response_buttons?: InteractiveButton[]
  response_list_items?: InteractiveListItem[]
  debug_info?: {
    response_time_ms: number
    requires_human: boolean
    is_complete: boolean
    webhook_simulation: boolean
    channel: string
    business_domain: string
    bypass_matched?: boolean
    graph_state?: Record<string, unknown>
  }
  metadata?: {
    phone_number: string
    user_name: string
    processing_time_ms: number
    flow: string
    document_url?: string
    document_caption?: string
  }
}
