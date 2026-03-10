/**
 * Workflow Node Types
 *
 * Node definitions, instances, config, WhatsApp message types, and error handling.
 */

// =============================================================================
// WHATSAPP RESPONSE CONFIG TYPES
// =============================================================================

export const WHATSAPP_CONSTRAINTS = {
  BUTTON_MAX: 3,
  BUTTON_TITLE_MAX: 20,
  LIST_ITEMS_MAX: 10,
  LIST_TITLE_MAX: 24,
  LIST_DESCRIPTION_MAX: 72,
  BUTTON_TEXT_MAX: 20,
} as const;

export interface WhatsAppButton {
  id: string;
  title: string;
  /** Optional next node for dynamic routing */
  next_node?: string;
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
  /** Optional next node for dynamic routing */
  next_node?: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

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

export interface NodeDefinitionListResponse {
  nodes: NodeDefinition[];
  total: number;
  categories: string[];
}

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
// NODE INSTANCE TYPES
// =============================================================================

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

export interface NodeInstanceCreate {
  node_definition_id: string;
  instance_key: string;
  display_label: string;
  config?: Record<string, unknown>;
  position_x?: number;
  position_y?: number;
  is_entry_point?: boolean;
}

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
// ERROR HANDLING CONFIG TYPES
// =============================================================================

export interface NodeErrorConfig {
  on_error: "stop" | "retry" | "fallback" | "continue";
  max_retries?: number;
  retry_delay_ms?: number;
  backoff_multiplier?: number;
  fallback_node_id?: string;
  timeout_ms?: number;
}
