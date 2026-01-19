/**
 * Workflow Builder Store Facade
 *
 * This store aggregates functionality from:
 * - workflow/core.store.ts (Workflow CRUD, Context)
 * - workflow/catalog.store.ts (Node Definitions, Templates, Rules)
 * - workflow/editor.store.ts (Graph, Instances, Transitions, Selection)
 *
 * Maintained for backward compatibility and ease of use.
 */

import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useWorkflowCoreStore } from "./workflow/core.store";
import { useWorkflowCatalogStore } from "./workflow/catalog.store";
import { useWorkflowEditorStore } from "./workflow/editor.store";
import type { VueFlowImportRequest } from "@/types/workflow.types";

export const useWorkflowStore = defineStore("workflow", () => {
  const coreStore = useWorkflowCoreStore();
  const catalogStore = useWorkflowCatalogStore();
  const editorStore = useWorkflowEditorStore();

  // ===========================================================================
  // STATE & GETTERS (Mapped)
  // ===========================================================================

  // Use storeToRefs for state properties to maintain reactivity when destructured
  const { currentWorkflow, workflows, institutionConfigId } =
    storeToRefs(coreStore);

  const { nodeDefinitions, routingRules, reminderSchedules, messageTemplates } =
    storeToRefs(catalogStore);

  const {
    nodeInstances,
    transitions,
    nodes,
    edges,
    annotations,
    selectedNodeId,
    selectedEdgeId,
    isDirty,
  } = storeToRefs(editorStore);

  // Loading state aggregation
  const isLoading = computed(
    () =>
      coreStore.isLoading || catalogStore.isLoading || editorStore.isLoading,
  );
  const isSaving = computed(
    () => coreStore.isSaving || catalogStore.isSaving || editorStore.isSaving,
  );
  const error = computed(
    () => coreStore.error || catalogStore.error || editorStore.error,
  );

  // Getters aggregation
  const selectedNode = computed(() => editorStore.selectedNode);
  const selectedEdge = computed(() => editorStore.selectedEdge);
  const entryNode = computed(() => editorStore.entryNode);
  const validationErrors = computed(() => editorStore.validationErrors);
  const hasValidationErrors = computed(() => editorStore.hasValidationErrors);

  const getNodeDefinitionById = computed(
    () => catalogStore.getNodeDefinitionById,
  );
  const getNodeDefinitionByKey = computed(
    () => catalogStore.getNodeDefinitionByKey,
  );
  const nodeDefinitionsByCategory = computed(
    () => catalogStore.nodeDefinitionsByCategory,
  );

  function hasUnsavedChanges() {
    return isDirty.value;
  }

  function clearError() {
    coreStore.error = null;
    catalogStore.error = null;
    editorStore.error = null;
  }

  // ===========================================================================
  // ACTIONS (Orchestration & Delegation)
  // ===========================================================================

  // Core & Orchestration
  async function loadWorkflow(workflowId: string) {
    try {
      // 1. Load workflow metadata
      await coreStore.loadWorkflow(workflowId);

      // 2. Load graph data (instances, transitions)
      await editorStore.loadGraphData(workflowId);
    } catch (e) {
      // Errors handled in respective stores
      throw e;
    }
  }

  async function importWorkflow(importData: VueFlowImportRequest) {
    await editorStore.importWorkflow(importData);
    // Reload workflow to reflect changes
    if (coreStore.currentWorkflow) {
      await loadWorkflow(coreStore.currentWorkflow.id);
    }
  }

  function reset() {
    coreStore.reset();
    catalogStore.reset();
    editorStore.reset();
  }

  // Delegations
  return {
    // State
    currentWorkflow,
    workflows,
    institutionConfigId,
    nodeDefinitions,
    routingRules,
    reminderSchedules,
    messageTemplates,
    nodeInstances,
    transitions,
    nodes,
    edges,
    annotations,
    selectedNodeId,
    selectedEdgeId,
    isDirty,
    isLoading,
    isSaving,
    error,

    // Getters
    selectedNode,
    selectedEdge,
    entryNode,
    validationErrors,
    hasValidationErrors,
    getNodeDefinitionById,
    getNodeDefinitionByKey,
    nodeDefinitionsByCategory,
    hasUnsavedChanges,

    // Core Actions
    setInstitutionContext: coreStore.setInstitutionContext,
    loadWorkflows: coreStore.loadWorkflows,
    createWorkflow: coreStore.createWorkflow,
    updateWorkflow: coreStore.updateWorkflow,
    deleteWorkflow: coreStore.deleteWorkflow,
    publishWorkflow: coreStore.publishWorkflow,

    // Catalog Actions
    loadNodeDefinitions: catalogStore.loadNodeDefinitions,
    loadRoutingRules: catalogStore.loadRoutingRules,
    createRoutingRule: catalogStore.createRoutingRule,
    updateRoutingRule: catalogStore.updateRoutingRule,
    deleteRoutingRule: catalogStore.deleteRoutingRule,
    loadReminderSchedules: catalogStore.loadReminderSchedules,
    createReminderSchedule: catalogStore.createReminderSchedule,
    updateReminderSchedule: catalogStore.updateReminderSchedule,
    deleteReminderSchedule: catalogStore.deleteReminderSchedule,
    loadMessageTemplates: catalogStore.loadMessageTemplates,
    createMessageTemplate: catalogStore.createMessageTemplate,
    updateMessageTemplate: catalogStore.updateMessageTemplate,
    deleteMessageTemplate: catalogStore.deleteMessageTemplate,

    // Editor Actions
    addNodeInstance: editorStore.addNodeInstance,
    updateNodeInstance: editorStore.updateNodeInstance,
    deleteNodeInstance: editorStore.deleteNodeInstance,
    addTransition: editorStore.addTransition,
    updateTransition: editorStore.updateTransition,
    deleteTransition: editorStore.deleteTransition,
    updateNodePosition: editorStore.updateNodePosition,
    saveCanvasState: editorStore.saveCanvasState,
    selectNode: editorStore.selectNode,
    selectEdge: editorStore.selectEdge,
    clearSelection: editorStore.clearSelection,
    addAnnotation: editorStore.addAnnotation,
    updateAnnotation: editorStore.updateAnnotation,
    deleteAnnotation: editorStore.deleteAnnotation,
    updateAnnotationPosition: editorStore.updateAnnotationPosition,
    exportWorkflow: editorStore.exportWorkflow,

    // Orchestrated Actions
    loadWorkflow,
    importWorkflow,
    reset,
    clearError,
    generateGraph: editorStore.generateGraph, // Exposed if needed manually
  };
});
