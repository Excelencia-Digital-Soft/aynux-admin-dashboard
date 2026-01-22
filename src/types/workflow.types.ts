/**
 * Workflow Builder TypeScript Types
 *
 * Types for the visual workflow editor and configurable conversation flows.
 * Supports Vue Flow integration and multi-tenant workflow management.
 */

// =============================================================================
// WHATSAPP RESPONSE CONFIG TYPES
// =============================================================================

/**
 * WhatsApp constraints for interactive messages
 */
export const WHATSAPP_CONSTRAINTS = {
  BUTTON_MAX: 3,
  BUTTON_TITLE_MAX: 20,
  LIST_ITEMS_MAX: 10,
  LIST_TITLE_MAX: 24,
  LIST_DESCRIPTION_MAX: 72,
  BUTTON_TEXT_MAX: 20,
} as const;

/**
 * WhatsApp button configuration
 */
export interface WhatsAppButton {
  id: string;
  title: string;
}

/**
 * WhatsApp list row configuration
 */
export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

/**
 * WhatsApp list section configuration
 */
export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

/**
 * WhatsApp list configuration
 */
export interface ListConfig {
  button_text: string;
  sections: WhatsAppListSection[];
}

/**
 * Node response configuration for workflow nodes
 * Stored in NodeInstance.config.response_config
 */
export interface NodeResponseConfig {
  /** Response generation type: prompt (LLM) or template (fixed text with variables) */
  response_type: "prompt" | "template";
  /** WhatsApp message format */
  message_format: "text" | "buttons" | "list";
  /** Task description for LLM prompt generation */
  task_description?: string;
  /** Template text with {placeholders} for template response type */
  template_text?: string;
  /** Button configuration (max 3 buttons) */
  buttons?: WhatsAppButton[];
  /** List configuration for list message format */
  list_config?: ListConfig;
  /** Optional header text */
  header?: string;
  /** Optional footer text */
  footer?: string;
}

// =============================================================================
// NODE DEFINITION TYPES
// =============================================================================

/**
 * Node definition from the global catalog
 */
export interface NodeDefinition {
  id: string;
  node_key: string;
  node_type: "conversation" | "routing" | "integration" | "utility";
  python_class: string;
  python_module: string;
  display_name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  config_schema: Record<string, unknown> | null;
  default_config: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
  is_builtin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Node definition response for lists
 */
export interface NodeDefinitionListResponse {
  nodes: NodeDefinition[];
  total: number;
  categories: string[];
}

/**
 * Node definition create request
 */
export interface NodeDefinitionCreate {
  node_key: string;
  node_type?: "conversation" | "routing" | "integration" | "utility";
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  config_schema?: Record<string, unknown>;
  default_config?: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
}

/**
 * Node definition update request
 */
export interface NodeDefinitionUpdate {
  display_name?: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  config_schema?: Record<string, unknown>;
  default_config?: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
  is_active?: boolean;
}

// =============================================================================
// WORKFLOW DEFINITION TYPES
// =============================================================================

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  institution_config_id: string;
  workflow_key: string;
  workflow_type: "medical_appointment" | "pharmacy" | "custom";
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
}

/**
 * Workflow settings stored in JSONB
 */
export interface WorkflowSettings {
  nlu_enabled?: boolean;
  nlu_confidence_threshold?: number;
  fallback_to_buttons?: boolean;
  interaction_mode?: "buttons_only" | "nlu_only" | "hybrid";
  max_retries?: number;
  timeout_seconds?: number;
  [key: string]: unknown;
}

/**
 * Vue Flow canvas state
 */
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

/**
 * Workflow create request
 */
export interface WorkflowCreate {
  institution_config_id: string;
  workflow_key: string;
  workflow_type: "medical_appointment" | "pharmacy" | "custom";
  display_name: string;
  description?: string;
  settings?: WorkflowSettings;
  is_draft?: boolean;
}

/**
 * Workflow update request
 */
export interface WorkflowUpdate {
  display_name?: string;
  description?: string;
  settings?: WorkflowSettings;
  entry_node_id?: string;
  canvas_state?: CanvasState;
  is_draft?: boolean;
  is_active?: boolean;
}

/**
 * Workflow list response
 */
export interface WorkflowListResponse {
  workflows: WorkflowDefinition[];
  total: number;
}

/**
 * Workflow publish response
 */
export interface WorkflowPublishResponse {
  id: string;
  workflow_key: string;
  version: number;
  is_draft: boolean;
  published_at: string;
}

// =============================================================================
// NODE INSTANCE TYPES
// =============================================================================

/**
 * Node instance within a workflow
 */
export interface NodeInstance {
  id: string;
  workflow_id: string;
  node_definition_id: string;
  instance_key: string;
  display_label: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
  is_entry_point: boolean;
  is_active?: boolean;
  description?: string | null;
  // Joined from definition
  node_key?: string;
  node_type?: string;
  display_name?: string;
  icon?: string;
  color?: string;
}

/**
 * Node instance create request
 */
export interface NodeInstanceCreate {
  node_definition_id: string;
  instance_key: string;
  display_label: string;
  config?: Record<string, unknown>;
  position_x?: number;
  position_y?: number;
  is_entry_point?: boolean;
}

/**
 * Node instance update request
 */
export interface NodeInstanceUpdate {
  display_label?: string;
  config?: Record<string, unknown>;
  position_x?: number;
  position_y?: number;
  is_entry_point?: boolean;
  is_active?: boolean;
  description?: string | null;
}

// =============================================================================
// TRANSITION TYPES
// =============================================================================

/**
 * Workflow transition (edge between nodes)
 */
export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_output: string;
  target_input: string;
  condition: TransitionCondition | null;
  priority: number;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Condition for transition evaluation
 */
export interface TransitionCondition {
  type: "always" | "intent" | "entity" | "state" | "expression";
  value?: string;
  operator?: "eq" | "ne" | "gt" | "lt" | "contains" | "matches";
  field?: string;
  [key: string]: unknown;
}

/**
 * Transition create request
 */
export interface TransitionCreate {
  source_node_id: string;
  target_node_id: string;
  source_output?: string;
  target_input?: string;
  condition?: TransitionCondition;
  priority?: number;
  label?: string;
}

/**
 * Transition update request
 */
export interface TransitionUpdate {
  condition?: TransitionCondition;
  priority?: number;
  label?: string;
  is_active?: boolean;
}

// =============================================================================
// ROUTING RULE TYPES
// =============================================================================

/**
 * Routing rule for special handling (e.g., human handoff)
 */
export interface RoutingRule {
  id: string;
  institution_config_id: string;
  rule_key: string;
  display_name: string;
  description: string | null;
  rule_type: "specialty_handoff" | "error_threshold" | "time_based" | "custom";
  condition: RoutingCondition;
  action: RoutingAction;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Routing condition
 */
export interface RoutingCondition {
  type: "specialty" | "error_count" | "time_range" | "custom";
  value: string | string[];
  operator?: string;
  [key: string]: unknown;
}

/**
 * Routing action
 */
export interface RoutingAction {
  type: "redirect_node" | "human_handoff" | "end_conversation" | "custom";
  target_node_key?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Routing rule create request
 */
export interface RoutingRuleCreate {
  institution_config_id: string;
  rule_key: string;
  display_name: string;
  description?: string;
  rule_type: string;
  condition: RoutingCondition;
  action: RoutingAction;
  priority?: number;
}

/**
 * Routing rule update request
 */
export interface RoutingRuleUpdate {
  display_name?: string;
  description?: string;
  condition?: RoutingCondition;
  action?: RoutingAction;
  priority?: number;
  is_active?: boolean;
}

/**
 * Routing rules list response
 */
export interface RoutingRuleListResponse {
  rules: RoutingRule[];
  total: number;
}

// =============================================================================
// REMINDER SCHEDULE TYPES
// =============================================================================

/**
 * Reminder schedule configuration
 */
export interface ReminderSchedule {
  id: string;
  institution_config_id: string;
  schedule_key: string;
  display_name: string;
  description: string | null;
  trigger_type: "days_before" | "hours_before" | "minutes_before";
  trigger_value: number;
  execution_hour: number;
  timezone: string;
  message_template_id: string | null;
  fallback_message: string | null;
  buttons: ReminderButton[];
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Button configuration for reminders
 */
export interface ReminderButton {
  id: string;
  title: string;
}

/**
 * Reminder schedule create request
 */
export interface ReminderScheduleCreate {
  institution_config_id: string;
  schedule_key: string;
  display_name: string;
  description?: string;
  trigger_type: string;
  trigger_value: number;
  execution_hour?: number;
  timezone?: string;
  message_template_id?: string;
  fallback_message?: string;
  buttons?: ReminderButton[];
  is_active?: boolean;
}

/**
 * Reminder schedule update request
 */
export interface ReminderScheduleUpdate {
  display_name?: string;
  description?: string;
  trigger_type?: string;
  trigger_value?: number;
  execution_hour?: number;
  timezone?: string;
  message_template_id?: string;
  fallback_message?: string;
  buttons?: ReminderButton[];
  is_active?: boolean;
}

/**
 * Reminder schedule list response
 */
export interface ReminderScheduleListResponse {
  schedules: ReminderSchedule[];
  total: number;
}

// =============================================================================
// MESSAGE TEMPLATE TYPES
// =============================================================================

/**
 * Message template configuration
 */
export interface MessageTemplate {
  id: string;
  institution_config_id: string | null;
  template_key: string;
  template_type: string;
  display_name: string;
  description: string | null;
  content: string;
  content_html: string | null;
  buttons: ReminderButton[];
  placeholders: string[];
  language: string;
  is_active: boolean;
  is_global: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Message template create request
 */
export interface MessageTemplateCreate {
  institution_config_id?: string;
  template_key: string;
  template_type: string;
  display_name: string;
  description?: string;
  content: string;
  content_html?: string;
  buttons?: ReminderButton[];
  placeholders?: string[];
  language?: string;
  is_active?: boolean;
}

/**
 * Message template update request
 */
export interface MessageTemplateUpdate {
  display_name?: string;
  description?: string;
  content?: string;
  content_html?: string;
  buttons?: ReminderButton[];
  placeholders?: string[];
  language?: string;
  is_active?: boolean;
}

/**
 * Message template list response
 */
export interface MessageTemplateListResponse {
  templates: MessageTemplate[];
  total: number;
}

// =============================================================================
// VUE FLOW TYPES
// =============================================================================

/**
 * Vue Flow node for workflow canvas
 */
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  class?: string;
}

/**
 * Workflow node data
 */
export interface WorkflowNodeData {
  label: string;
  nodeInstance?: NodeInstance;
  nodeDefinition?: NodeDefinition;
  isEntryPoint?: boolean;
  icon?: string;
  color?: string;
  // Annotation-specific properties
  content?: string;
  type?: string;
}

/**
 * Vue Flow edge for workflow canvas
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, string>;
  data?: WorkflowEdgeData;
}

/**
 * Workflow edge data
 */
export interface WorkflowEdgeData {
  transition: WorkflowTransition;
  condition?: TransitionCondition;
}

/**
 * Vue Flow export format
 */
export interface VueFlowExport {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  canvas_state: CanvasState;
  exported_at: string;
}

/**
 * Vue Flow import request
 */
export interface VueFlowImportRequest {
  nodes: Array<{
    node_definition_id: string;
    instance_key: string;
    display_name: string;
    config?: Record<string, unknown>;
    position_x: number;
    position_y: number;
    is_entry_point?: boolean;
  }>;
  edges: Array<{
    source_instance_key: string;
    target_instance_key: string;
    condition?: TransitionCondition;
    priority?: number;
    label?: string;
  }>;
  canvas_state?: CanvasState;
}

// =============================================================================
// STORE STATE TYPES
// =============================================================================

/**
 * Workflow store state
 */
export interface WorkflowState {
  // Current workflow
  currentWorkflow: WorkflowDefinition | null;
  nodeInstances: NodeInstance[];
  transitions: WorkflowTransition[];

  // Catalogs
  nodeDefinitions: NodeDefinition[];
  workflows: WorkflowDefinition[];

  // Routing rules (per institution)
  routingRules: RoutingRule[];

  // Reminder schedules (per institution)
  reminderSchedules: ReminderSchedule[];
  messageTemplates: MessageTemplate[];

  // Vue Flow state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // Annotations (stored in canvas_state)
  annotations: WorkflowAnnotation[];

  // UI state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDirty: boolean;

  // Loading state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Context
  institutionConfigId: string | null;
}

/**
 * Workflow filters
 */
export interface WorkflowFilters {
  institution_config_id?: string;
  workflow_type?: string;
  is_active?: boolean;
  is_draft?: boolean;
}

// =============================================================================
// ANNOTATION TYPES
// =============================================================================

/**
 * Workflow annotation (comment/note)
 */
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

/**
 * Annotation colors
 */
export type AnnotationColor =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "gray";

// =============================================================================
// GROUP TYPES (for future Node Grouping feature)
// =============================================================================

/**
 * Workflow group for organizing nodes
 */
export interface WorkflowGroup {
  id: string;
  display_name: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  is_collapsed: boolean;
  node_ids: string[];
  color?: string;
}
