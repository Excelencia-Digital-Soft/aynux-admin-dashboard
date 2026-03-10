/**
 * Workflow Execution Types
 *
 * Manual execution, execution history, pinned data, and response preview.
 */

// =============================================================================
// MANUAL EXECUTION TYPES
// =============================================================================

export interface ManualExecutionRequest {
  domain_key: string;
  institution_config_id: string;
  test_input: string;
  phone_override?: string;
  pinned_data?: Record<string, Record<string, unknown>>;
}

export interface ManualExecutionStartResponse {
  execution_id: string;
  message: string;
}

export interface ManualExecutionResultResponse {
  execution_id: string;
  status: "running" | "completed" | "error";
  response_text: string | null;
  exit_node: string | null;
  response_type: string | null;
  is_error: boolean;
  error_detail: string | null;
  execution_ms: number;
}

export type WorkflowSSEEventType =
  | "node_started"
  | "node_completed"
  | "node_error"
  | "edge_data"
  | "execution_complete"
  | "execution_error";

export type NodeExecutionStatus = "idle" | "running" | "completed" | "error";

export interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
}

// =============================================================================
// EXECUTION HISTORY TYPES
// =============================================================================

export interface ExecutionLogSummary {
  id: string;
  conversation_id: string;
  domain_key: string;
  input_message: string | null;
  output_message: string | null;
  entry_node: string | null;
  exit_node: string | null;
  response_type: string | null;
  is_error: boolean;
  error_detail: string | null;
  execution_ms: number;
  attempt_count: number;
  created_at: string | null;
}

export interface ExecutionLogDetail extends ExecutionLogSummary {
  workflow_id: string | null;
  institution_config_id: string;
  trace: Array<Record<string, unknown>>;
  edge_data: Record<string, unknown> | null;
  state_snapshot: Record<string, unknown> | null;
}

export interface ExecutionLogFilters {
  institution_config_id?: string;
  domain_key?: string;
  is_error?: boolean;
  conversation_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginatedExecutionLogs {
  items: ExecutionLogSummary[];
  total: number;
  page: number;
  size: number;
}

export interface ExecutionStats {
  total_executions: number;
  error_count: number;
  error_rate: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  node_hit_counts: Record<string, number>;
}

// =============================================================================
// PINNED DATA TYPES
// =============================================================================

export interface PinnedDataRequest {
  data: Record<string, unknown>;
}

export interface PinnedDataResponse {
  node_instance_id: string;
  is_pinned: boolean;
  pinned_data: Record<string, unknown> | null;
}

export interface WorkflowPinnedDataResponse {
  workflow_id: string;
  pinned_nodes: Record<string, Record<string, unknown>>;
}

export interface ReplayRequest {
  from_node_id: string;
}

export interface ReplayResponse {
  execution_id: string;
  message: string;
}

// =============================================================================
// RESPONSE PREVIEW TYPES
// =============================================================================

export interface ResponsePreviewRequest {
  domain_key: string;
  node_id: string;
  template_text: string;
  variables?: Record<string, string>;
  use_llm?: boolean;
  user_message?: string;
}

export interface ResponsePreviewResponse {
  rendered_template: string;
  rendered_llm: string | null;
  unknown_variables: string[];
  missing_variables: string[];
}

export interface ResponseValidateRequest {
  domain_key: string;
  node_id: string;
  template_text: string;
}

export interface ResponseValidateResponse {
  is_valid: boolean;
  unknown_variables: string[];
  errors: string[];
}

export interface ResponseVariablesResponse {
  node_id: string;
  available_variables: string[];
  mock_values: Record<string, string>;
}
