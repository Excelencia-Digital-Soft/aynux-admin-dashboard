import { defineStore } from "pinia";
import { ref } from "vue";
import { workflowApi } from "@/api/workflow.api";
import type {
  WorkflowDefinition,
  WorkflowCreate,
  WorkflowUpdate,
} from "@/types/workflow.types";

export const useWorkflowCoreStore = defineStore("workflow-core", () => {
  // State
  const currentWorkflow = ref<WorkflowDefinition | null>(null);
  const workflows = ref<WorkflowDefinition[]>([]);
  const institutionConfigId = ref<string | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  // Actions
  function setInstitutionContext(id: string) {
    institutionConfigId.value = id;
  }

  function reset() {
    currentWorkflow.value = null;
    workflows.value = [];
    error.value = null;
  }

  async function loadWorkflows(filters?: {
    workflow_type?: string;
    active_only?: boolean;
  }) {
    if (!institutionConfigId.value) {
      error.value = "Institution context not set";
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await workflowApi.listWorkflows(
        institutionConfigId.value,
        filters,
      );
      workflows.value = response.workflows;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to load workflows";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadWorkflow(workflowId: string): Promise<WorkflowDefinition> {
    isLoading.value = true;
    error.value = null;

    try {
      const workflow = await workflowApi.getWorkflow(workflowId);
      currentWorkflow.value = workflow;
      institutionConfigId.value = workflow.institution_config_id;
      return workflow;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to load workflow";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function createWorkflow(
    workflow: WorkflowCreate,
  ): Promise<WorkflowDefinition> {
    isSaving.value = true;
    error.value = null;

    try {
      const created = await workflowApi.createWorkflow(workflow);
      workflows.value.push(created);
      return created;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create workflow";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateWorkflow(updates: WorkflowUpdate) {
    if (!currentWorkflow.value) return;

    isSaving.value = true;
    error.value = null;

    try {
      const updated = await workflowApi.updateWorkflow(
        currentWorkflow.value.id,
        updates,
      );
      currentWorkflow.value = updated;

      // Update in list
      const idx = workflows.value.findIndex((w) => w.id === updated.id);
      if (idx !== -1) workflows.value[idx] = updated;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update workflow";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteWorkflow(workflowId: string) {
    isSaving.value = true;
    error.value = null;

    try {
      await workflowApi.deleteWorkflow(workflowId);
      workflows.value = workflows.value.filter((w) => w.id !== workflowId);

      if (currentWorkflow.value?.id === workflowId) {
        currentWorkflow.value = null;
      }
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete workflow";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function publishWorkflow() {
    if (!currentWorkflow.value) return;

    isSaving.value = true;
    error.value = null;

    try {
      const result = await workflowApi.publishWorkflow(
        currentWorkflow.value.id,
      );
      currentWorkflow.value.is_draft = result.is_draft;
      currentWorkflow.value.version = result.version;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to publish workflow";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    // State
    currentWorkflow,
    workflows,
    institutionConfigId,
    isLoading,
    isSaving,
    error,

    // Actions
    setInstitutionContext,
    reset,
    loadWorkflows,
    loadWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    publishWorkflow,
  };
});
