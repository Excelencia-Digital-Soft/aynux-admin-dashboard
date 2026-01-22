// ===== TEMPLATE TYPE DISCRIMINATOR =====
export type TemplateType = 'prompt' | 'task' | 'formatter'

// ===== PROMPTS: AI Templates with LLM metadata =====

// Core YAML Prompt Types
export interface YamlPrompt {
  key: string                    // Unique identifier: domain.subdomain.action
  name: string                   // Display name
  description: string            // What this prompt does
  version: string               // Semantic version
  template: string              // YAML content with {variables}
  metadata: PromptMetadata
  source: 'file' | 'database'   // Origin
  active: boolean               // Enable/disable
  locked_by?: string           // Editor lock
  locked_at?: string           // Lock timestamp
  tenant_id?: string           // Tenant-specific overrides
  created_at: string
  updated_at: string
}

export interface PromptMetadata {
  temperature: number
  max_tokens: number
  model: string
  tags: string[]
  variables: {
    required: string[]
    optional: string[]
  }
  domain: string              // agents, healthcare, ecommerce, etc.
}

// API Request/Response Types
export interface CreateYamlRequest extends Omit<YamlPrompt, 'key' | 'created_at' | 'updated_at' | 'locked_by' | 'locked_at'> {}
export interface UpdateYamlRequest extends Partial<Omit<CreateYamlRequest, 'source'>> {}

export interface PaginatedYamlResponse {
  items: YamlPrompt[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface YamlListParams {
  page?: number
  pageSize?: number
  domain?: string
  source?: 'file' | 'database' | null
  active?: boolean | null
  search?: string
  tenant_id?: string
}

// Version Management
export interface PromptVersion {
  id: string
  prompt_id: string
  version: string
  template: string
  performance_metrics?: Record<string, unknown>
  is_active: boolean
  created_by: string | null
  created_at: string
  notes?: string | null
}

// Lock Management
export interface LockResponse {
  locked: boolean
  locked_by?: string
  locked_at?: string
  expires_at?: string
}

// Validation Types
export interface ValidationError {
  line: number
  column?: number
  message: string
  path: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  parsed_structure?: any
  detected_variables?: VariableInfo[]
}

export interface VariableInfo {
  name: string
  required: boolean
  type: string
  description?: string
  default_value?: any
}

// Testing Types
export interface TestData {
  variables: Record<string, any>
  context?: {
    user_id?: string
    tenant_id?: string
    session_id?: string
  }
}

export interface TestResult {
  success: boolean
  rendered_prompt: string
  model_response?: string
  execution_time: number
  token_usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  errors?: string[]
}

// Template Preview
export interface PreviewRequest {
  prompt_key: string
  variables: Record<string, any>
  tenant_id?: string
}

export interface PreviewResponse {
  rendered_template: string
  variables_used: string[]
  missing_variables: string[]
  valid: boolean
}

// Filter Options
export interface YamlFilters {
  domain: string | null
  source: 'file' | 'database' | null
  active: boolean | null
  search: string
  tags: string[]
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// Export/Import Types
export interface ExportOptions {
  include_inactive: boolean
  include_versions: boolean
  domains: string[]
  format: 'yaml' | 'json'
}

export interface ImportResult {
  success: boolean
  imported_count: number
  failed_count: number
  errors: ImportError[]
}

export interface ImportError {
  file_name: string
  line_number?: number
  error: string
}

// Editor State
export interface EditorState {
  content: string
  cursor_position: number
  selection?: {
    start: number
    end: number
  }
  dirty: boolean
  validation_result: ValidationResult | null
}

// Domain Configuration
export interface DomainConfig {
  key: string
  name: string
  name_es: string
  icon: string
  description: string
  color: string
  allowed_models: string[]
}

// Utility Types
export type YamlSource = 'file' | 'database'
export type PromptDomain = 'agents' | 'healthcare' | 'ecommerce' | 'excelencia' | 'orchestrator' | 'pharmacy' | 'product' | 'tools' | 'core'

// Model Options
export interface ModelOption {
  id: string
  name: string
  max_tokens: number
  supports_functions: boolean
  cost_per_token: number
}

// Search and Analytics
export interface YamlSearchResult {
  prompt: YamlPrompt
  relevance_score: number
  matched_fields: string[]
}

export interface YamlAnalytics {
  total_prompts: number
  active_prompts: number
  domains_count: Record<string, number>
  most_used_templates: Array<{
    prompt_key: string
    usage_count: number
  }>
  recent_changes: Array<{
    prompt_key: string
    changed_at: string
    changed_by: string
    change_type: 'created' | 'updated' | 'deleted'
  }>
}

// ===== TASKS: Chatbot text templates (no LLM params) =====

export interface TaskMetadata {
  tags: string[]
  variables: {
    required: string[]
    optional: string[]
  }
  is_critical: boolean  // Task-specific: marks critical operations
}

export interface YamlTask {
  key: string                    // Unique identifier: domain.flow.action
  name: string                   // Display name
  description: string            // Short description of what this task does
  version: string               // Semantic version
  template: string              // Text template with {variables} for rendering
  metadata: TaskMetadata
  source: 'file' | 'database'   // Origin
  active: boolean               // Enable/disable
  status: 'active' | 'placeholder' | 'missing'
  created_at?: string
  updated_at?: string
}

// Task API Request/Response Types
export interface CreateTaskRequest {
  key: string
  name: string
  description: string
  template?: string
  metadata?: Partial<TaskMetadata>
}

export interface UpdateTaskRequest {
  name?: string
  description?: string
  template?: string
  metadata?: Partial<TaskMetadata>
}

export interface PaginatedTaskResponse {
  items: YamlTask[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TaskListParams {
  page?: number
  pageSize?: number
  domain?: string
  source?: 'file' | 'database' | null
  is_active?: boolean | null
}

export interface TaskAnalytics {
  total_tasks: number
  active_tasks: number
  domains_count: Record<string, number>
}

export interface TaskTestRequest {
  variables: Record<string, any>
}

export interface TaskTestResult {
  success: boolean
  rendered_template?: string
  execution_time: number
  errors: string[]
  warnings: string[]
}

// ===== FORMATTERS: WhatsApp Interactive Message Templates =====

export type FormatterResponseType = 'text' | 'buttons' | 'list'

export interface FormatterButton {
  id: string
  titulo?: string
  titulo_template?: string
  descripcion?: string
  conditional?: string
}

export interface FormatterListItem {
  id: string
  titulo: string
  descripcion?: string
}

export interface FormatterMetadata {
  variables: {
    required: string[]
    optional: string[]
  }
  conditional_buttons?: Record<string, { show_when: string }>
}

export interface YamlFormatter {
  key: string                           // Unique identifier: domain.formatter.action
  name: string                          // Display name
  description: string                   // What this formatter does
  version: string                       // Semantic version
  response_type: FormatterResponseType  // text, buttons, or list
  title?: string                        // Title for interactive messages
  body_template: string                 // Message body with {variables}
  buttons?: FormatterButton[]           // Interactive buttons (for response_type: buttons)
  list_button_text?: string             // Text for list button (for response_type: list)
  list_item_add_person?: FormatterListItem  // Special list item for adding person
  awaiting_input?: string               // Input field expected from user
  is_complete?: boolean                 // Whether this ends the conversation
  metadata: FormatterMetadata
  source: 'file' | 'database'           // Origin
  active: boolean                       // Enable/disable
  created_at?: string
  updated_at?: string
}

// Formatter API Request/Response Types
export interface CreateFormatterRequest {
  key: string
  name: string
  description: string
  version?: string
  response_type: FormatterResponseType
  title?: string
  body_template: string
  buttons?: FormatterButton[]
  list_button_text?: string
  awaiting_input?: string
  is_complete?: boolean
  metadata?: Partial<FormatterMetadata>
}

export interface UpdateFormatterRequest {
  name?: string
  description?: string
  version?: string
  response_type?: FormatterResponseType
  title?: string
  body_template?: string
  buttons?: FormatterButton[]
  list_button_text?: string
  awaiting_input?: string
  is_complete?: boolean
  metadata?: Partial<FormatterMetadata>
}

export interface PaginatedFormatterResponse {
  items: YamlFormatter[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FormatterListParams {
  page?: number
  pageSize?: number
  domain?: string
  source?: 'file' | 'database' | null
  response_type?: FormatterResponseType | null
  is_active?: boolean | null
  search?: string
}

export interface FormatterAnalytics {
  total_formatters: number
  active_formatters: number
  domains_count: Record<string, number>
  response_types_count: Record<FormatterResponseType, number>
}

export interface FormatterTestRequest {
  variables: Record<string, any>
}

export interface FormatterTestResult {
  success: boolean
  rendered_body?: string
  rendered_buttons?: FormatterButton[]
  execution_time: number
  errors: string[]
  warnings: string[]
}

// ===== TYPE GUARDS =====

export function isPrompt(item: YamlPrompt | YamlTask | YamlFormatter): item is YamlPrompt {
  return 'metadata' in item && 'temperature' in (item.metadata as PromptMetadata)
}

export function isTask(item: YamlPrompt | YamlTask | YamlFormatter): item is YamlTask {
  return 'metadata' in item && 'is_critical' in (item.metadata as TaskMetadata)
}

export function isFormatter(item: YamlPrompt | YamlTask | YamlFormatter): item is YamlFormatter {
  return 'response_type' in item && 'body_template' in item
}

// Union type for all template types
export type YamlTemplate = YamlPrompt | YamlTask | YamlFormatter