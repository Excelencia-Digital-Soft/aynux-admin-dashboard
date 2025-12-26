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
  prompt_key: string
  version: string
  content: string
  metadata: PromptMetadata
  created_by: string
  created_at: string
  change_description?: string
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