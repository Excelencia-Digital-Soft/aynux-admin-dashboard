/**
 * Workflow Graph Types
 *
 * Transitions, conditions, and Vue Flow visualization types.
 */

import type { NodeInstance, NodeDefinition } from './workflow-node.types'
import type { CanvasState } from './workflow-definition.types'

// =============================================================================
// TRANSITION TYPES
// =============================================================================

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

export interface TransitionCondition {
  type: "always" | "intent" | "entity" | "state" | "expression";
  value?: string;
  operator?: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "contains" | "matches";
  field?: string;
  /** Custom expression for 'expression' type conditions */
  expression?: string;
}

export interface TransitionCreate {
  source_node_id: string;
  target_node_id: string;
  source_output?: string;
  target_input?: string;
  condition?: TransitionCondition;
  priority?: number;
  label?: string;
}

export interface TransitionUpdate {
  condition?: TransitionCondition;
  priority?: number;
  label?: string;
  is_active?: boolean;
}

// =============================================================================
// VUE FLOW TYPES
// =============================================================================

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  class?: string;
}

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

export interface WorkflowEdgeData {
  transition: WorkflowTransition;
  condition?: TransitionCondition;
}

export interface VueFlowExport {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  canvas_state: CanvasState;
  exported_at: string;
}

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
