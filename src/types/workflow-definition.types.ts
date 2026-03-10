/**
 * Workflow Definition Types
 *
 * Workflow definitions, settings, canvas state, annotations, groups, and copy operations.
 */

// =============================================================================
// ANNOTATION TYPES
// =============================================================================

export interface WorkflowAnnotation {
  id: string;
  type: "text" | "sticky";
  content: string;
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export type AnnotationColor =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "gray";

// =============================================================================
// GROUP TYPES
// =============================================================================

export interface WorkflowGroup {
  id: string;
  display_name: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  is_collapsed: boolean;
  node_ids: string[];
  color?: string;
}

// =============================================================================
// WORKFLOW DEFINITION TYPES
// =============================================================================

export interface WorkflowSettings {
  nlu_enabled?: boolean;
  nlu_confidence_threshold?: number;
  fallback_to_buttons?: boolean;
  interaction_mode?: "buttons_only" | "nlu_only" | "hybrid";
  max_retries?: number;
  timeout_seconds?: number;
  [key: string]: unknown;
}

export interface CanvasState {
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  annotations?: WorkflowAnnotation[];
  groups?: WorkflowGroup[];
  [key: string]: unknown;
}

export interface WorkflowDefinition {
  id: string;
  institution_config_id: string;
  workflow_key: string;
  workflow_type: "pharmacy" | "custom";
  display_name: string;
  description: string | null;
  version: number;
  is_draft: boolean;
  is_active: boolean;
  entry_node_id: string | null;
  settings: WorkflowSettings;
  canvas_state: CanvasState | null;
  created_at: string;
  updated_at: string | null;
  node_count?: number;
  institution_name?: string;
}

export interface WorkflowCreate {
  institution_config_id: string;
  workflow_key: string;
  workflow_type: "pharmacy" | "custom";
  display_name: string;
  description?: string;
  settings?: WorkflowSettings;
  is_draft?: boolean;
}

export interface WorkflowUpdate {
  display_name?: string;
  description?: string;
  settings?: WorkflowSettings;
  entry_node_id?: string;
  canvas_state?: CanvasState;
  is_draft?: boolean;
  is_active?: boolean;
}

export interface WorkflowListResponse {
  workflows: WorkflowDefinition[];
  total: number;
}

export interface WorkflowPublishResponse {
  id: string;
  workflow_key: string;
  version: number;
  is_draft: boolean;
  published_at: string;
}

// =============================================================================
// WORKFLOW COPY TYPES
// =============================================================================

export interface WorkflowCopyRequest {
  source_workflow_id: string;
  target_institution_config_id: string;
  new_workflow_key: string;
  new_display_name: string;
}

export interface WorkflowCopyResponse {
  success: boolean;
  new_workflow_id: string;
  new_workflow_key: string;
  nodes_copied: number;
  transitions_copied: number;
  message: string;
}

// =============================================================================
// WORKFLOW FILTERS
// =============================================================================

export interface WorkflowFilters {
  institution_config_id?: string;
  workflow_type?: string;
  is_active?: boolean;
  is_draft?: boolean;
}
