import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { workflowApi } from "@/api/workflow.api";
import { useWorkflowCoreStore } from "./core.store";
import { useWorkflowCatalogStore } from "./catalog.store";
import type {
  NodeInstance,
  NodeInstanceCreate,
  NodeInstanceUpdate,
  WorkflowTransition,
  TransitionCreate,
  TransitionUpdate,
  WorkflowNode,
  WorkflowEdge,
  WorkflowAnnotation,
  CanvasState,
  VueFlowImportRequest,
} from "@/types/workflow.types";

export const useWorkflowEditorStore = defineStore("workflow-editor", () => {
  const coreStore = useWorkflowCoreStore();
  const catalogStore = useWorkflowCatalogStore();

  // State
  const nodeInstances = ref<NodeInstance[]>([]);
  const transitions = ref<WorkflowTransition[]>([]);

  // Vue Flow state
  const nodes = ref<WorkflowNode[]>([]);
  const edges = ref<WorkflowEdge[]>([]);
  const annotations = ref<WorkflowAnnotation[]>([]);

  // Selection
  const selectedNodeId = ref<string | null>(null);
  const selectedEdgeId = ref<string | null>(null);

  const isDirty = ref(false);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    return (
      nodeInstances.value.find((n) => n.id === selectedNodeId.value) || null
    );
  });

  const selectedEdge = computed(() => {
    if (!selectedEdgeId.value) return null;
    return transitions.value.find((t) => t.id === selectedEdgeId.value) || null;
  });

  const entryNode = computed(() => {
    return nodeInstances.value.find((n) => n.is_entry_point) || null;
  });

  const hasUnsavedChanges = computed(() => isDirty.value);

  // Validation Logic
  const validationErrors = computed(() => {
    const errors: Array<{
      type: "error" | "warning";
      message: string;
      nodeId?: string;
    }> = [];

    if (!coreStore.currentWorkflow || nodeInstances.value.length === 0) {
      return errors;
    }

    // 1. Check for entry point
    const entryNodes = nodeInstances.value.filter((n) => n.is_entry_point);
    if (entryNodes.length === 0) {
      errors.push({
        type: "error",
        message: "No hay punto de entrada definido",
      });
    } else if (entryNodes.length > 1) {
      errors.push({
        type: "warning",
        message: `Hay ${entryNodes.length} puntos de entrada (solo se usará uno)`,
      });
    }

    // 2. Check that entry point has outgoing transitions
    if (entryNodes.length > 0) {
      const entryNode = entryNodes[0];
      const entryHasOutgoing = transitions.value.some(
        (t) => t.source_node_id === entryNode.id,
      );
      if (!entryHasOutgoing && nodeInstances.value.length > 1) {
        errors.push({
          type: "warning",
          message: `El punto de entrada "${entryNode.display_label}" no tiene transiciones salientes`,
          nodeId: entryNode.id,
        });
      }
    }

    // 3. Find orphan nodes
    const connectedNodeIds = new Set<string>();
    transitions.value.forEach((t) => {
      connectedNodeIds.add(t.source_node_id);
      connectedNodeIds.add(t.target_node_id);
    });

    const orphanNodes = nodeInstances.value.filter(
      (n) => !n.is_entry_point && !connectedNodeIds.has(n.id),
    );
    orphanNodes.forEach((n) => {
      errors.push({
        type: "warning",
        message: `Nodo "${n.display_label}" no está conectado`,
        nodeId: n.id,
      });
    });

    // 4. Check for transitions to non-existent nodes
    const nodeIds = new Set(nodeInstances.value.map((n) => n.id));
    transitions.value.forEach((t) => {
      if (!nodeIds.has(t.source_node_id)) {
        errors.push({
          type: "error",
          message: "Transición desde nodo inexistente",
        });
      }
      if (!nodeIds.has(t.target_node_id)) {
        errors.push({
          type: "error",
          message: "Transición hacia nodo inexistente",
        });
      }
    });

    // 5. Check for dead-end nodes
    const nodesWithOutgoing = new Set(
      transitions.value.map((t) => t.source_node_id),
    );
    const deadEndNodes = nodeInstances.value.filter(
      (n) => !nodesWithOutgoing.has(n.id) && n.node_type !== "utility",
    );
    if (deadEndNodes.length > 0 && nodeInstances.value.length > 1) {
      deadEndNodes.forEach((n) => {
        if (!n.is_entry_point || nodeInstances.value.length > 1) {
          errors.push({
            type: "warning",
            message: `Nodo "${n.display_label}" es un punto muerto (sin salidas)`,
            nodeId: n.id,
          });
        }
      });
    }

    return errors;
  });

  const hasValidationErrors = computed(() => {
    return validationErrors.value.some((e) => e.type === "error");
  });

  // Actions
  function reset() {
    nodeInstances.value = [];
    transitions.value = [];
    nodes.value = [];
    edges.value = [];
    annotations.value = [];
    selectedNodeId.value = null;
    selectedEdgeId.value = null;
    isDirty.value = false;
    error.value = null;
  }

  // Graph Generation
  function generateGraph() {
    const newNodes: WorkflowNode[] = [];
    const newEdges: WorkflowEdge[] = [];

    // Nodes
    for (const instance of nodeInstances.value) {
      const definition = catalogStore.getNodeDefinitionById(
        instance.node_definition_id,
      );

      newNodes.push({
        id: instance.id,
        type: instance.node_type || definition?.node_type || "default",
        position: {
          x: instance.position_x,
          y: instance.position_y,
        },
        data: {
          label: instance.display_label,
          nodeInstance: instance,
          nodeDefinition: definition,
          isEntryPoint: instance.is_entry_point,
          icon: instance.icon || definition?.icon,
          color: instance.color || definition?.color,
        },
      });
    }

    // Build a set of valid node IDs for quick lookup
    const validNodeIds = new Set(nodeInstances.value.map(n => n.id));

    // Edges - only include transitions with valid source and target node IDs
    console.log(`[Workflow] generateGraph: processing ${transitions.value.length} transitions, ${validNodeIds.size} valid nodes`);
    for (const transition of transitions.value) {
      const sourceId = transition.source_node_id;
      const targetId = transition.target_node_id;

      // Skip transitions missing source or target (Vue Flow requires both to be non-empty strings)
      if (!sourceId || !targetId || typeof sourceId !== 'string' || typeof targetId !== 'string') {
        console.warn(
          `[Workflow] Skipping transition ${transition.id}: invalid source=${JSON.stringify(sourceId)}, target=${JSON.stringify(targetId)}`
        );
        continue;
      }

      // Skip transitions referencing non-existent nodes
      if (!validNodeIds.has(sourceId) || !validNodeIds.has(targetId)) {
        console.warn(
          `[Workflow] Skipping transition ${transition.id}: source node ${sourceId} exists=${validNodeIds.has(sourceId)}, target node ${targetId} exists=${validNodeIds.has(targetId)}`
        );
        continue;
      }

      newEdges.push({
        id: transition.id,
        source: sourceId,
        target: targetId,
        sourceHandle: transition.source_output || undefined,
        targetHandle: transition.target_input || undefined,
        type: transition.condition ? "condition" : "default",
        label: transition.label || undefined,
        animated: !!transition.condition,
        data: {
          transition,
          condition: transition.condition || undefined,
        },
      });
    }

    // Annotations
    for (const annotation of annotations.value) {
      newNodes.push({
        id: annotation.id,
        type: "annotation",
        position: annotation.position,
        data: {
          label: annotation.content,
          content: annotation.content,
          color: annotation.color || "yellow",
          type: annotation.type || "sticky",
        },
      });
    }

    // Final validation: ensure all edges have valid source and target that exist in the node list
    // This catches any edge cases where edges might have been constructed incorrectly
    const nodeIdSet = new Set(newNodes.filter(n => n.type !== 'annotation').map(n => n.id));
    const validatedEdges = newEdges.filter(edge => {
      if (!edge.source || !edge.target) {
        console.warn(`[Workflow] Final validation: Removing edge ${edge.id} - missing source or target`);
        return false;
      }
      if (!nodeIdSet.has(edge.source)) {
        console.warn(`[Workflow] Final validation: Removing edge ${edge.id} - source node ${edge.source} not in graph`);
        return false;
      }
      if (!nodeIdSet.has(edge.target)) {
        console.warn(`[Workflow] Final validation: Removing edge ${edge.id} - target node ${edge.target} not in graph`);
        return false;
      }
      return true;
    });

    if (validatedEdges.length !== newEdges.length) {
      console.warn(`[Workflow] Removed ${newEdges.length - validatedEdges.length} invalid edges during final validation`);
    }

    // Set nodes and edges synchronously
    // Vue Flow needs both to be set in the same render cycle to properly validate edges against nodes
    nodes.value = newNodes;
    edges.value = validatedEdges;
  }

  async function loadGraphData(workflowId: string) {
    isLoading.value = true;
    try {
      const [fetchedNodes, fetchedTransitions] = await Promise.all([
        workflowApi.listNodeInstances(workflowId),
        workflowApi.listTransitions(workflowId),
      ]);
      nodeInstances.value = fetchedNodes;
      transitions.value = fetchedTransitions;

      // Load annotations from core store's current workflow if available
      if (coreStore.currentWorkflow?.canvas_state?.annotations) {
        annotations.value = coreStore.currentWorkflow.canvas_state.annotations;
      } else {
        annotations.value = [];
      }

      generateGraph();
      isDirty.value = false;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to load graph data";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  // Node Instances CRUD
  async function addNodeInstance(
    node: NodeInstanceCreate,
  ): Promise<NodeInstance> {
    if (!coreStore.currentWorkflow) throw new Error("No workflow loaded");
    isSaving.value = true;
    try {
      const created = await workflowApi.createNodeInstance(
        coreStore.currentWorkflow.id,
        node,
      );
      nodeInstances.value.push(created);
      generateGraph();
      isDirty.value = true;
      return created;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to add node";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateNodeInstance(
    nodeId: string,
    updates: NodeInstanceUpdate,
  ) {
    if (!coreStore.currentWorkflow) return;
    isSaving.value = true;
    try {
      const updated = await workflowApi.updateNodeInstance(
        coreStore.currentWorkflow.id,
        nodeId,
        updates,
      );

      // Update nodeInstances in place, merging API response with local updates
      // (API may not return all fields like description, is_active)
      const instanceIdx = nodeInstances.value.findIndex((n) => n.id === nodeId);
      if (instanceIdx !== -1) {
        nodeInstances.value[instanceIdx] = {
          ...nodeInstances.value[instanceIdx],
          ...updated,
          // Preserve fields from updates that API doesn't return
          description: updates.description ?? updated.description ?? nodeInstances.value[instanceIdx].description,
          is_active: updates.is_active ?? updated.is_active ?? nodeInstances.value[instanceIdx].is_active,
        };
      }

      // Update the corresponding Vue Flow node in place (avoid full graph regeneration)
      const nodeIdx = nodes.value.findIndex((n) => n.id === nodeId);
      if (nodeIdx !== -1 && instanceIdx !== -1) {
        const mergedInstance = nodeInstances.value[instanceIdx];
        const definition = catalogStore.getNodeDefinitionById(mergedInstance.node_definition_id);
        // Update node data in place using the merged instance
        nodes.value[nodeIdx] = {
          ...nodes.value[nodeIdx],
          position: {
            x: mergedInstance.position_x,
            y: mergedInstance.position_y,
          },
          data: {
            ...nodes.value[nodeIdx].data,
            label: mergedInstance.display_label,
            nodeInstance: mergedInstance,
            nodeDefinition: definition,
            isEntryPoint: mergedInstance.is_entry_point,
            icon: mergedInstance.icon || definition?.icon,
            color: mergedInstance.color || definition?.color,
          },
        };
      }

      isDirty.value = true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to update node";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteNodeInstance(nodeId: string) {
    if (!coreStore.currentWorkflow) return;
    isSaving.value = true;
    try {
      await workflowApi.deleteNodeInstance(
        coreStore.currentWorkflow.id,
        nodeId,
      );
      nodeInstances.value = nodeInstances.value.filter((n) => n.id !== nodeId);

      // Remove connected transitions locally
      transitions.value = transitions.value.filter(
        (t) => t.source_node_id !== nodeId && t.target_node_id !== nodeId,
      );

      generateGraph();
      isDirty.value = true;

      if (selectedNodeId.value === nodeId) {
        selectedNodeId.value = null;
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to delete node";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  // Transitions CRUD
  async function addTransition(
    transition: TransitionCreate,
  ): Promise<WorkflowTransition> {
    if (!coreStore.currentWorkflow) throw new Error("No workflow loaded");
    isSaving.value = true;
    try {
      const created = await workflowApi.createTransition(
        coreStore.currentWorkflow.id,
        transition,
      );
      transitions.value.push(created);
      generateGraph();
      isDirty.value = true;
      return created;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to add transition";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateTransition(
    transitionId: string,
    updates: TransitionUpdate,
  ) {
    if (!coreStore.currentWorkflow) return;
    isSaving.value = true;
    try {
      const updated = await workflowApi.updateTransition(
        coreStore.currentWorkflow.id,
        transitionId,
        updates,
      );

      // Update transitions in place
      const transitionIdx = transitions.value.findIndex((t) => t.id === transitionId);
      if (transitionIdx !== -1) {
        transitions.value[transitionIdx] = updated;
      }

      // Update the corresponding Vue Flow edge in place (avoid full graph regeneration)
      const edgeIdx = edges.value.findIndex((e) => e.id === transitionId);
      if (edgeIdx !== -1) {
        edges.value[edgeIdx] = {
          ...edges.value[edgeIdx],
          sourceHandle: updated.source_output || undefined,
          targetHandle: updated.target_input || undefined,
          type: updated.condition ? "condition" : "default",
          label: updated.label || undefined,
          animated: !!updated.condition,
          data: {
            transition: updated,
            condition: updated.condition || undefined,
          },
        };
      }

      isDirty.value = true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update transition";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteTransition(transitionId: string) {
    if (!coreStore.currentWorkflow) return;
    isSaving.value = true;
    try {
      await workflowApi.deleteTransition(
        coreStore.currentWorkflow.id,
        transitionId,
      );
      transitions.value = transitions.value.filter(
        (t) => t.id !== transitionId,
      );
      generateGraph();
      isDirty.value = true;

      if (selectedEdgeId.value === transitionId) {
        selectedEdgeId.value = null;
      }
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete transition";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  // Graph Operations
  function updateNodePosition(
    nodeId: string,
    position: { x: number; y: number },
  ) {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.position = position;
      isDirty.value = true;
    }
    const instance = nodeInstances.value.find((n) => n.id === nodeId);
    if (instance) {
      instance.position_x = position.x;
      instance.position_y = position.y;
    }
  }

  async function saveCanvasState(canvasState: CanvasState) {
    if (!coreStore.currentWorkflow) return;
    await coreStore.updateWorkflow({ canvas_state: canvasState });
  }

  // Selection
  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId;
    selectedEdgeId.value = null;
  }

  function selectEdge(edgeId: string | null) {
    selectedEdgeId.value = edgeId;
    selectedNodeId.value = null;
  }

  function clearSelection() {
    selectedNodeId.value = null;
    selectedEdgeId.value = null;
  }

  // Annotations
  function addAnnotation(
    annotation: Omit<WorkflowAnnotation, "id" | "created_at">,
  ): WorkflowAnnotation {
    const newAnnotation: WorkflowAnnotation = {
      ...annotation,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    annotations.value.push(newAnnotation);

    // Add node directly without regenerating entire graph (preserves edges)
    nodes.value.push({
      id: newAnnotation.id,
      type: "annotation",
      position: newAnnotation.position,
      data: {
        label: newAnnotation.content,
        content: newAnnotation.content,
        color: newAnnotation.color || "yellow",
        type: newAnnotation.type || "sticky",
      },
    });

    isDirty.value = true;
    return newAnnotation;
  }

  function updateAnnotation(
    annotationId: string,
    updates: Partial<WorkflowAnnotation>,
  ) {
    const idx = annotations.value.findIndex((a) => a.id === annotationId);
    if (idx !== -1) {
      annotations.value[idx] = {
        ...annotations.value[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Update node directly without regenerating entire graph (preserves edges)
      const node = nodes.value.find((n) => n.id === annotationId);
      if (node) {
        if (updates.position) node.position = updates.position;
        if (updates.content !== undefined) {
          node.data.label = updates.content;
          node.data.content = updates.content;
        }
        if (updates.color !== undefined) node.data.color = updates.color;
        if (updates.type !== undefined) node.data.type = updates.type;
      }

      isDirty.value = true;
    }
  }

  function deleteAnnotation(annotationId: string) {
    annotations.value = annotations.value.filter((a) => a.id !== annotationId);
    // Remove node directly without regenerating entire graph (preserves edges)
    nodes.value = nodes.value.filter((n) => n.id !== annotationId);
    isDirty.value = true;
  }

  function updateAnnotationPosition(
    annotationId: string,
    position: { x: number; y: number },
  ) {
    const annotation = annotations.value.find((a) => a.id === annotationId);
    if (annotation) {
      annotation.position = position;
      annotation.updated_at = new Date().toISOString();
    }

    // Also update the node position directly (preserves edges)
    const node = nodes.value.find((n) => n.id === annotationId);
    if (node) {
      node.position = position;
    }

    isDirty.value = true;
  }

  // Import/Export
  async function exportWorkflow() {
    if (!coreStore.currentWorkflow) throw new Error("No workflow loaded");
    try {
      return await workflowApi.exportWorkflow(coreStore.currentWorkflow.id);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to export workflow";
      throw e;
    }
  }

  async function importWorkflow(importData: VueFlowImportRequest) {
    if (!coreStore.currentWorkflow) throw new Error("No workflow loaded");
    isSaving.value = true;
    try {
      const result = await workflowApi.importWorkflow(
        coreStore.currentWorkflow.id,
        importData,
      );
      // We rely on the orchestrator to reload
      return result;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to import workflow";
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    // State
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
    hasUnsavedChanges,
    validationErrors,
    hasValidationErrors,

    // Actions
    reset,
    generateGraph,
    loadGraphData,
    addNodeInstance,
    updateNodeInstance,
    deleteNodeInstance,
    addTransition,
    updateTransition,
    deleteTransition,
    updateNodePosition,
    saveCanvasState,
    selectNode,
    selectEdge,
    clearSelection,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    updateAnnotationPosition,
    exportWorkflow,
    importWorkflow,
  };
});
