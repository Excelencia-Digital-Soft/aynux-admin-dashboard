import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { workflowApi } from "@/api/workflow.api";
import type {
  NodeDefinition,
  NodeDefinitionCreate,
  NodeDefinitionUpdate,
  RoutingRule,
  RoutingRuleCreate,
  RoutingRuleUpdate,
  ReminderSchedule,
  ReminderScheduleCreate,
  ReminderScheduleUpdate,
  MessageTemplate,
  MessageTemplateCreate,
  MessageTemplateUpdate,
} from "@/types/workflow.types";

export const useWorkflowCatalogStore = defineStore("workflow-catalog", () => {
  // State
  const nodeDefinitions = ref<NodeDefinition[]>([]);
  const routingRules = ref<RoutingRule[]>([]);
  const reminderSchedules = ref<ReminderSchedule[]>([]);
  const messageTemplates = ref<MessageTemplate[]>([]);

  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getNodeDefinitionById = computed(() => {
    return (id: string) => nodeDefinitions.value.find((d) => d.id === id);
  });

  const getNodeDefinitionByKey = computed(() => {
    return (key: string) =>
      nodeDefinitions.value.find((d) => d.node_key === key);
  });

  const nodeDefinitionsByCategory = computed(() => {
    const grouped: Record<string, NodeDefinition[]> = {};
    for (const def of nodeDefinitions.value) {
      const category = def.category || "Otros";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(def);
    }
    return grouped;
  });

  // Actions
  function reset() {
    nodeDefinitions.value = [];
    routingRules.value = [];
    reminderSchedules.value = [];
    messageTemplates.value = [];
    error.value = null;
  }

  // Node Definitions
  async function loadNodeDefinitions(filters?: {
    node_type?: string;
    category?: string;
    active_only?: boolean;
  }) {
    isLoading.value = true;
    try {
      const response = await workflowApi.listNodeDefinitions(filters);
      nodeDefinitions.value = response.nodes;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to load node definitions";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function createNodeDefinition(
    data: NodeDefinitionCreate,
  ): Promise<NodeDefinition> {
    isSaving.value = true;
    try {
      const created = await workflowApi.createNodeDefinition(data);
      nodeDefinitions.value.push(created);
      return created;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create node definition";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateNodeDefinition(
    nodeDefId: string,
    updates: NodeDefinitionUpdate,
  ): Promise<NodeDefinition> {
    isSaving.value = true;
    try {
      const updated = await workflowApi.updateNodeDefinition(nodeDefId, updates);
      const idx = nodeDefinitions.value.findIndex((n) => n.id === nodeDefId);
      if (idx !== -1) nodeDefinitions.value[idx] = updated;
      return updated;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update node definition";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteNodeDefinition(nodeDefId: string): Promise<void> {
    isSaving.value = true;
    try {
      await workflowApi.deleteNodeDefinition(nodeDefId);
      nodeDefinitions.value = nodeDefinitions.value.filter(
        (n) => n.id !== nodeDefId,
      );
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete node definition";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  // Routing Rules
  async function loadRoutingRules(
    institutionConfigId: string,
    filters?: { rule_type?: string; active_only?: boolean },
  ) {
    try {
      const response = await workflowApi.listRoutingRules(
        institutionConfigId,
        filters,
      );
      routingRules.value = response.rules;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to load routing rules";
      throw e;
    }
  }

  async function createRoutingRule(
    rule: RoutingRuleCreate,
  ): Promise<RoutingRule> {
    isSaving.value = true;
    try {
      const created = await workflowApi.createRoutingRule(rule);
      routingRules.value.push(created);
      return created;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create routing rule";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateRoutingRule(ruleId: string, updates: RoutingRuleUpdate) {
    isSaving.value = true;
    try {
      const updated = await workflowApi.updateRoutingRule(ruleId, updates);
      const idx = routingRules.value.findIndex((r) => r.id === ruleId);
      if (idx !== -1) routingRules.value[idx] = updated;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update routing rule";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteRoutingRule(ruleId: string) {
    isSaving.value = true;
    try {
      await workflowApi.deleteRoutingRule(ruleId);
      routingRules.value = routingRules.value.filter((r) => r.id !== ruleId);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete routing rule";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  // Reminder Schedules
  async function loadReminderSchedules(
    institutionConfigId: string,
    filters?: { trigger_type?: string; active_only?: boolean },
  ) {
    try {
      const response = await workflowApi.listReminderSchedules(
        institutionConfigId,
        filters,
      );
      reminderSchedules.value = response.schedules;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to load reminder schedules";
      throw e;
    }
  }

  async function createReminderSchedule(
    schedule: ReminderScheduleCreate,
  ): Promise<ReminderSchedule> {
    isSaving.value = true;
    try {
      const created = await workflowApi.createReminderSchedule(schedule);
      reminderSchedules.value.push(created);
      return created;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create reminder schedule";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateReminderSchedule(
    scheduleId: string,
    updates: ReminderScheduleUpdate,
  ) {
    isSaving.value = true;
    try {
      const updated = await workflowApi.updateReminderSchedule(
        scheduleId,
        updates,
      );
      const idx = reminderSchedules.value.findIndex((s) => s.id === scheduleId);
      if (idx !== -1) reminderSchedules.value[idx] = updated;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update reminder schedule";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteReminderSchedule(scheduleId: string) {
    isSaving.value = true;
    try {
      await workflowApi.deleteReminderSchedule(scheduleId);
      reminderSchedules.value = reminderSchedules.value.filter(
        (s) => s.id !== scheduleId,
      );
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete reminder schedule";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  // Message Templates
  async function loadMessageTemplates(
    institutionConfigId?: string,
    filters?: {
      template_type?: string;
      include_global?: boolean;
      active_only?: boolean;
    },
  ) {
    try {
      const response = await workflowApi.listMessageTemplates(
        institutionConfigId,
        filters,
      );
      messageTemplates.value = response.templates;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to load message templates";
      throw e;
    }
  }

  async function createMessageTemplate(
    template: MessageTemplateCreate,
  ): Promise<MessageTemplate> {
    isSaving.value = true;
    try {
      const created = await workflowApi.createMessageTemplate(template);
      messageTemplates.value.push(created);
      return created;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create message template";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateMessageTemplate(
    templateId: string,
    updates: MessageTemplateUpdate,
  ) {
    isSaving.value = true;
    try {
      const updated = await workflowApi.updateMessageTemplate(
        templateId,
        updates,
      );
      const idx = messageTemplates.value.findIndex((t) => t.id === templateId);
      if (idx !== -1) messageTemplates.value[idx] = updated;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update message template";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteMessageTemplate(templateId: string) {
    isSaving.value = true;
    try {
      await workflowApi.deleteMessageTemplate(templateId);
      messageTemplates.value = messageTemplates.value.filter(
        (t) => t.id !== templateId,
      );
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete message template";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    // State
    nodeDefinitions,
    routingRules,
    reminderSchedules,
    messageTemplates,
    isLoading,
    isSaving,
    error,

    // Getters
    getNodeDefinitionById,
    getNodeDefinitionByKey,
    nodeDefinitionsByCategory,

    // Actions
    reset,
    loadNodeDefinitions,
    createNodeDefinition,
    updateNodeDefinition,
    deleteNodeDefinition,
    loadRoutingRules,
    createRoutingRule,
    updateRoutingRule,
    deleteRoutingRule,
    loadReminderSchedules,
    createReminderSchedule,
    updateReminderSchedule,
    deleteReminderSchedule,
    loadMessageTemplates,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
  };
});
