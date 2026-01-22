/**
 * Workflow Builder API
 *
 * API client for managing configurable conversation workflows.
 * Supports workflow definitions, node instances, transitions,
 * routing rules, reminder schedules, and message templates.
 */

import apiClient from './index'
import type {
  WorkflowDefinition,
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowListResponse,
  WorkflowPublishResponse,
  NodeDefinition,
  NodeDefinitionCreate,
  NodeDefinitionUpdate,
  NodeDefinitionListResponse,
  NodeInstance,
  NodeInstanceCreate,
  NodeInstanceUpdate,
  WorkflowTransition,
  TransitionCreate,
  TransitionUpdate,
  RoutingRule,
  RoutingRuleCreate,
  RoutingRuleUpdate,
  RoutingRuleListResponse,
  ReminderSchedule,
  ReminderScheduleCreate,
  ReminderScheduleUpdate,
  ReminderScheduleListResponse,
  MessageTemplate,
  MessageTemplateCreate,
  MessageTemplateUpdate,
  MessageTemplateListResponse,
  VueFlowExport,
  VueFlowImportRequest
} from '@/types/workflow.types'

const BASE_URL = '/admin/workflows'
const REMINDER_URL = '/admin/reminder-schedules'
const TEMPLATE_URL = '/admin/message-templates'

export const workflowApi = {
  // ===========================================================================
  // WORKFLOW DEFINITIONS
  // ===========================================================================

  /**
   * List workflows for an institution
   */
  async listWorkflows(
    institutionConfigId: string,
    filters?: { workflow_type?: string; active_only?: boolean; drafts_only?: boolean }
  ): Promise<WorkflowListResponse> {
    const params = new URLSearchParams({ institution_config_id: institutionConfigId })
    if (filters?.workflow_type) params.append('workflow_type', filters.workflow_type)
    if (filters?.active_only) params.append('active_only', 'true')
    if (filters?.drafts_only) params.append('drafts_only', 'true')

    const { data } = await apiClient.get<WorkflowListResponse>(`${BASE_URL}/?${params}`)
    return data
  },

  /**
   * Get a workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition> {
    const { data } = await apiClient.get<WorkflowDefinition>(`${BASE_URL}/${workflowId}`)
    return data
  },

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: WorkflowCreate): Promise<WorkflowDefinition> {
    const { data } = await apiClient.post<WorkflowDefinition>(BASE_URL, workflow)
    return data
  },

  /**
   * Update a workflow
   */
  async updateWorkflow(workflowId: string, workflow: WorkflowUpdate): Promise<WorkflowDefinition> {
    const { data } = await apiClient.put<WorkflowDefinition>(`${BASE_URL}/${workflowId}`, workflow)
    return data
  },

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${workflowId}`)
  },

  /**
   * Publish a workflow (finalize draft)
   */
  async publishWorkflow(workflowId: string): Promise<WorkflowPublishResponse> {
    const { data } = await apiClient.post<WorkflowPublishResponse>(
      `${BASE_URL}/${workflowId}/publish`
    )
    return data
  },

  // ===========================================================================
  // NODE DEFINITIONS (CATALOG)
  // ===========================================================================

  /**
   * List all available node definitions
   */
  async listNodeDefinitions(filters?: {
    node_type?: string
    category?: string
    active_only?: boolean
  }): Promise<NodeDefinitionListResponse> {
    const params = new URLSearchParams()
    if (filters?.node_type) params.append('node_type', filters.node_type)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.active_only) params.append('active_only', 'true')

    const url = params.toString() ? `${BASE_URL}/nodes/catalog?${params}` : `${BASE_URL}/nodes/catalog`
    const { data } = await apiClient.get<NodeDefinitionListResponse>(url)
    return data
  },

  /**
   * Get a node definition by ID
   */
  async getNodeDefinition(nodeDefId: string): Promise<NodeDefinition> {
    const { data } = await apiClient.get<NodeDefinition>(`${BASE_URL}/nodes/catalog/${nodeDefId}`)
    return data
  },

  /**
   * Create a new custom node definition
   */
  async createNodeDefinition(nodeDef: NodeDefinitionCreate): Promise<NodeDefinition> {
    const { data } = await apiClient.post<NodeDefinition>(`${BASE_URL}/nodes/catalog`, nodeDef)
    return data
  },

  /**
   * Update a node definition
   */
  async updateNodeDefinition(
    nodeDefId: string,
    nodeDef: NodeDefinitionUpdate
  ): Promise<NodeDefinition> {
    const { data } = await apiClient.put<NodeDefinition>(
      `${BASE_URL}/nodes/catalog/${nodeDefId}`,
      nodeDef
    )
    return data
  },

  /**
   * Delete a custom node definition (only if not in use)
   */
  async deleteNodeDefinition(nodeDefId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/nodes/catalog/${nodeDefId}`)
  },

  // ===========================================================================
  // NODE INSTANCES
  // ===========================================================================

  /**
   * List node instances in a workflow
   */
  async listNodeInstances(workflowId: string): Promise<NodeInstance[]> {
    const { data } = await apiClient.get<{ nodes: NodeInstance[]; total: number }>(
      `${BASE_URL}/${workflowId}/nodes`
    )
    return data.nodes
  },

  /**
   * Create a node instance in a workflow
   */
  async createNodeInstance(workflowId: string, node: NodeInstanceCreate): Promise<NodeInstance> {
    const { data } = await apiClient.post<NodeInstance>(`${BASE_URL}/${workflowId}/nodes`, node)
    return data
  },

  /**
   * Update a node instance
   */
  async updateNodeInstance(
    workflowId: string,
    nodeId: string,
    node: NodeInstanceUpdate
  ): Promise<NodeInstance> {
    const { data } = await apiClient.put<NodeInstance>(
      `${BASE_URL}/${workflowId}/nodes/${nodeId}`,
      node
    )
    return data
  },

  /**
   * Delete a node instance
   */
  async deleteNodeInstance(workflowId: string, nodeId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${workflowId}/nodes/${nodeId}`)
  },

  // ===========================================================================
  // TRANSITIONS
  // ===========================================================================

  /**
   * List transitions in a workflow
   */
  async listTransitions(workflowId: string): Promise<WorkflowTransition[]> {
    const { data } = await apiClient.get<{ transitions: WorkflowTransition[]; total: number }>(
      `${BASE_URL}/${workflowId}/transitions`
    )
    return data.transitions
  },

  /**
   * Create a transition in a workflow
   */
  async createTransition(
    workflowId: string,
    transition: TransitionCreate
  ): Promise<WorkflowTransition> {
    const { data } = await apiClient.post<WorkflowTransition>(
      `${BASE_URL}/${workflowId}/transitions`,
      transition
    )
    return data
  },

  /**
   * Update a transition
   */
  async updateTransition(
    workflowId: string,
    transitionId: string,
    transition: TransitionUpdate
  ): Promise<WorkflowTransition> {
    const { data } = await apiClient.put<WorkflowTransition>(
      `${BASE_URL}/${workflowId}/transitions/${transitionId}`,
      transition
    )
    return data
  },

  /**
   * Delete a transition
   */
  async deleteTransition(workflowId: string, transitionId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${workflowId}/transitions/${transitionId}`)
  },

  // ===========================================================================
  // VUE FLOW IMPORT/EXPORT
  // ===========================================================================

  /**
   * Export workflow for Vue Flow
   */
  async exportWorkflow(workflowId: string): Promise<VueFlowExport> {
    const { data } = await apiClient.get<VueFlowExport>(`${BASE_URL}/${workflowId}/export`)
    return data
  },

  /**
   * Import workflow from Vue Flow
   */
  async importWorkflow(
    workflowId: string,
    importData: VueFlowImportRequest
  ): Promise<{ nodes_created: number; transitions_created: number }> {
    const { data } = await apiClient.post<{ nodes_created: number; transitions_created: number }>(
      `${BASE_URL}/${workflowId}/import`,
      importData
    )
    return data
  },

  // ===========================================================================
  // ROUTING RULES
  // ===========================================================================

  /**
   * List routing rules for an institution
   */
  async listRoutingRules(
    institutionConfigId: string,
    filters?: { rule_type?: string; active_only?: boolean }
  ): Promise<RoutingRuleListResponse> {
    const params = new URLSearchParams({ institution_config_id: institutionConfigId })
    if (filters?.rule_type) params.append('rule_type', filters.rule_type)
    if (filters?.active_only) params.append('active_only', 'true')

    const { data } = await apiClient.get<RoutingRuleListResponse>(
      `${BASE_URL}/routing-rules?${params}`
    )
    return data
  },

  /**
   * Create a routing rule
   */
  async createRoutingRule(rule: RoutingRuleCreate): Promise<RoutingRule> {
    const { data } = await apiClient.post<RoutingRule>(`${BASE_URL}/routing-rules`, rule)
    return data
  },

  /**
   * Update a routing rule
   */
  async updateRoutingRule(ruleId: string, rule: RoutingRuleUpdate): Promise<RoutingRule> {
    const { data } = await apiClient.put<RoutingRule>(`${BASE_URL}/routing-rules/${ruleId}`, rule)
    return data
  },

  /**
   * Delete a routing rule
   */
  async deleteRoutingRule(ruleId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/routing-rules/${ruleId}`)
  },

  // ===========================================================================
  // REMINDER SCHEDULES
  // ===========================================================================

  /**
   * List reminder schedules for an institution
   */
  async listReminderSchedules(
    institutionConfigId: string,
    filters?: { trigger_type?: string; active_only?: boolean }
  ): Promise<ReminderScheduleListResponse> {
    const params = new URLSearchParams({ institution_config_id: institutionConfigId })
    if (filters?.trigger_type) params.append('trigger_type', filters.trigger_type)
    if (filters?.active_only) params.append('active_only', 'true')

    const { data } = await apiClient.get<ReminderScheduleListResponse>(`${REMINDER_URL}?${params}`)
    return data
  },

  /**
   * Get a reminder schedule by ID
   */
  async getReminderSchedule(scheduleId: string): Promise<ReminderSchedule> {
    const { data } = await apiClient.get<ReminderSchedule>(`${REMINDER_URL}/${scheduleId}`)
    return data
  },

  /**
   * Create a reminder schedule
   */
  async createReminderSchedule(schedule: ReminderScheduleCreate): Promise<ReminderSchedule> {
    const { data } = await apiClient.post<ReminderSchedule>(REMINDER_URL, schedule)
    return data
  },

  /**
   * Update a reminder schedule
   */
  async updateReminderSchedule(
    scheduleId: string,
    schedule: ReminderScheduleUpdate
  ): Promise<ReminderSchedule> {
    const { data } = await apiClient.put<ReminderSchedule>(
      `${REMINDER_URL}/${scheduleId}`,
      schedule
    )
    return data
  },

  /**
   * Delete a reminder schedule
   */
  async deleteReminderSchedule(scheduleId: string): Promise<void> {
    await apiClient.delete(`${REMINDER_URL}/${scheduleId}`)
  },

  // ===========================================================================
  // MESSAGE TEMPLATES
  // ===========================================================================

  /**
   * List message templates
   */
  async listMessageTemplates(
    institutionConfigId?: string,
    filters?: { template_type?: string; include_global?: boolean; active_only?: boolean }
  ): Promise<MessageTemplateListResponse> {
    const params = new URLSearchParams()
    if (institutionConfigId) params.append('institution_config_id', institutionConfigId)
    if (filters?.template_type) params.append('template_type', filters.template_type)
    if (filters?.include_global !== undefined)
      params.append('include_global', String(filters.include_global))
    if (filters?.active_only) params.append('active_only', 'true')

    const url = params.toString() ? `${TEMPLATE_URL}?${params}` : TEMPLATE_URL
    const { data } = await apiClient.get<MessageTemplateListResponse>(url)
    return data
  },

  /**
   * Get a message template by ID
   */
  async getMessageTemplate(templateId: string): Promise<MessageTemplate> {
    const { data } = await apiClient.get<MessageTemplate>(`${TEMPLATE_URL}/${templateId}`)
    return data
  },

  /**
   * Get a message template by key (with global fallback)
   */
  async getMessageTemplateByKey(
    templateKey: string,
    institutionConfigId?: string
  ): Promise<MessageTemplate> {
    const params = institutionConfigId
      ? `?institution_config_id=${institutionConfigId}`
      : ''
    const { data } = await apiClient.get<MessageTemplate>(
      `${TEMPLATE_URL}/by-key/${templateKey}${params}`
    )
    return data
  },

  /**
   * Create a message template
   */
  async createMessageTemplate(template: MessageTemplateCreate): Promise<MessageTemplate> {
    const { data } = await apiClient.post<MessageTemplate>(TEMPLATE_URL, template)
    return data
  },

  /**
   * Update a message template
   */
  async updateMessageTemplate(
    templateId: string,
    template: MessageTemplateUpdate
  ): Promise<MessageTemplate> {
    const { data } = await apiClient.put<MessageTemplate>(`${TEMPLATE_URL}/${templateId}`, template)
    return data
  },

  /**
   * Delete a message template
   */
  async deleteMessageTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`${TEMPLATE_URL}/${templateId}`)
  }
}

export default workflowApi
