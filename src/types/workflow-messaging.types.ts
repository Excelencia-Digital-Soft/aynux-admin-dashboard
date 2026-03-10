/**
 * Workflow Messaging Types
 *
 * Reminders, message templates, and trigger schedules.
 */

// =============================================================================
// REMINDER SCHEDULE TYPES
// =============================================================================

export interface ReminderButton {
  id: string;
  title: string;
}

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

export interface ReminderScheduleListResponse {
  schedules: ReminderSchedule[];
  total: number;
}

// =============================================================================
// MESSAGE TEMPLATE TYPES
// =============================================================================

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

export interface MessageTemplateListResponse {
  templates: MessageTemplate[];
  total: number;
}

// =============================================================================
// TRIGGER TYPES
// =============================================================================

export interface ScheduleType {
  domain_key: string;
  key: string;
  display_name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
}

export interface TriggerSchedule {
  id: string;
  institution_config_id: string;
  schedule_key: string;
  display_name: string;
  description: string | null;
  trigger_type: string;
  trigger_value: number;
  execution_hour: number;
  timezone: string;
  message_template_id: string | null;
  fallback_message: string | null;
  buttons: Array<Record<string, string>>;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  last_error: string | null;
  run_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface TriggerScheduleCreate {
  schedule_key: string;
  display_name: string;
  description?: string;
  trigger_type?: string;
  trigger_value?: number;
  execution_hour?: number;
  timezone?: string;
  message_template_id?: string;
  fallback_message?: string;
  buttons?: Array<Record<string, string>>;
  is_active?: boolean;
}

export interface TriggerScheduleUpdate {
  display_name?: string;
  description?: string;
  trigger_type?: string;
  trigger_value?: number;
  execution_hour?: number;
  timezone?: string;
  message_template_id?: string;
  fallback_message?: string;
  buttons?: Array<Record<string, string>>;
  is_active?: boolean;
}

export interface TriggerTestResponse {
  success: boolean;
  summary: string;
  records_processed: number;
}

export interface TriggerNextRuns {
  schedule_id: string;
  next_runs: string[];
}
