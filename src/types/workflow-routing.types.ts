/**
 * Workflow Routing Types
 *
 * Routing rules for special handling (handoffs, error thresholds, etc.).
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

export interface RoutingCondition {
  type: "specialty" | "error_count" | "time_range" | "custom";
  value: string | string[];
  operator?: string;
  [key: string]: unknown;
}

export interface RoutingAction {
  type: "redirect_node" | "human_handoff" | "end_conversation" | "custom";
  target_node_key?: string;
  message?: string;
  [key: string]: unknown;
}

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

export interface RoutingRuleUpdate {
  display_name?: string;
  description?: string;
  condition?: RoutingCondition;
  action?: RoutingAction;
  priority?: number;
  is_active?: boolean;
}

export interface RoutingRuleListResponse {
  rules: RoutingRule[];
  total: number;
}
