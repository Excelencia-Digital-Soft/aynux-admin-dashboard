/**
 * Composable for Workflow Editor page logic
 *
 * Provides workflow management, node palette, and Vue Flow integration.
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import type {
  NodeDefinition,
  NodeInstance,
  NodeInstanceCreate,
  NodeInstanceUpdate,
  TransitionCreate,
  TransitionUpdate,
  WorkflowCreate
} from '@/types/workflow.types'
import { extractErrorMessage } from '@/utils/typeGuards'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'

export interface UseWorkflowEditorOptions {
  autoFetch?: boolean
}

// Workflow type options
export const workflowTypeOptions = [
  { value: 'medical_appointment', label: 'Turnos Medicos' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'custom', label: 'Personalizado' }
]

// Node type colors
export const nodeTypeColors: Record<string, string> = {
  conversation: '#3b82f6',
  routing: '#8b5cf6',
  integration: '#10b981',
  utility: '#64748b'
}

// Node type icons
export const nodeTypeIcons: Record<string, string> = {
  conversation: 'pi-comments',
  routing: 'pi-sitemap',
  integration: 'pi-cloud',
  utility: 'pi-cog'
}

export function useWorkflowEditor(options: UseWorkflowEditorOptions = {}) {
  const { autoFetch = true } = options

  const toast = useToast()
  const store = useWorkflowStore()
  const authStore = useAuthStore()

  // Institution state
  const institutions = ref<TenantInstitutionConfig[]>([])
  const selectedInstitutionId = ref<string | null>(null)
  const isLoadingInstitutions = ref(false)

  // Local state
  const showWorkflowDialog = ref(false)
  const showNodeDialog = ref(false)
  const showTransitionDialog = ref(false)
  const showDeleteConfirm = ref(false)
  const deleteTarget = ref<{ type: 'workflow' | 'node' | 'transition'; id: string } | null>(null)

  // New workflow form
  const newWorkflow = ref<WorkflowCreate>({
    institution_config_id: '',
    workflow_key: '',
    workflow_type: 'medical_appointment',
    display_name: '',
    description: '',
    is_draft: true
  })

  // New node form
  const newNode = ref<NodeInstanceCreate>({
    node_definition_id: '',
    instance_key: '',
    display_label: '',
    config: {},
    position_x: 250,
    position_y: 250,
    is_entry_point: false
  })

  // New transition form
  const newTransition = ref<TransitionCreate>({
    source_node_id: '',
    target_node_id: '',
    source_output: 'default',
    target_input: 'default',
    priority: 0,
    label: ''
  })

  // Selected node definition for adding
  const selectedDefinition = ref<NodeDefinition | null>(null)

  // Computed
  const workflows = computed(() => store.workflows)
  const currentWorkflow = computed(() => store.currentWorkflow)
  const nodeDefinitions = computed(() => store.nodeDefinitions)
  const nodeDefinitionsByCategory = computed(() => store.nodeDefinitionsByCategory)
  const nodes = computed(() => store.nodes)
  const edges = computed(() => store.edges)
  const nodeInstances = computed(() => store.nodeInstances)
  const transitions = computed(() => store.transitions)
  const selectedNode = computed(() => store.selectedNode)
  const selectedEdge = computed(() => store.selectedEdge)
  const isLoading = computed(() => store.isLoading)
  const isSaving = computed(() => store.isSaving)
  const isDirty = computed(() => store.isDirty)
  const error = computed(() => store.error)

  // Institution context
  const institutionConfigId = computed(() => store.institutionConfigId)

  // Stats
  const stats = computed(() => ({
    totalWorkflows: store.workflows.length,
    totalNodes: store.nodeInstances.length,
    totalTransitions: store.transitions.length,
    isDraft: store.currentWorkflow?.is_draft ?? true
  }))

  // Selected institution (full object)
  const selectedInstitution = computed(() => {
    if (!selectedInstitutionId.value) return null
    return institutions.value.find((i) => i.id === selectedInstitutionId.value) || null
  })

  // Validation
  const validationErrors = computed(() => store.validationErrors)
  const hasValidationErrors = computed(() => store.hasValidationErrors)

  // Load institutions for current organization
  async function loadInstitutions() {
    const orgId = authStore.currentOrgId
    if (!orgId) {
      toast.error('Debe seleccionar una organizacion primero')
      return
    }

    isLoadingInstitutions.value = true
    try {
      const response = await tenantInstitutionConfigApi.list(orgId, {
        enabled_only: true,
        institution_type: 'medical'
      })
      institutions.value = response.items

      // Auto-select first institution if none selected
      if (response.items.length > 0 && !selectedInstitutionId.value) {
        selectedInstitutionId.value = response.items[0].id
      }
    } catch (e) {
      toast.error('Error al cargar instituciones')
    } finally {
      isLoadingInstitutions.value = false
    }
  }

  // Initialize with institution context
  async function initialize(instConfigId?: string) {
    // If institution ID provided, use it directly
    if (instConfigId) {
      selectedInstitutionId.value = instConfigId
      store.setInstitutionContext(instConfigId)
      await loadNodeDefinitions()
      await loadWorkflows()
      return
    }

    // Otherwise, load institutions first
    if (authStore.currentOrgId) {
      await loadInstitutions()
      // If we have a selected institution, initialize with it
      if (selectedInstitutionId.value) {
        store.setInstitutionContext(selectedInstitutionId.value)
        await loadNodeDefinitions()
        await loadWorkflows()
      }
    }
  }

  // Select a different institution
  async function selectInstitution(instConfigId: string) {
    selectedInstitutionId.value = instConfigId
    // Use custom reset() that preserves institutionConfigId, not $reset()
    store.reset()
    store.setInstitutionContext(instConfigId)
    await loadNodeDefinitions()
    await loadWorkflows()
  }

  // Load node definitions catalog
  async function loadNodeDefinitions() {
    try {
      await store.loadNodeDefinitions({ active_only: true })
    } catch (e) {
      toast.error('Error al cargar definiciones de nodos')
    }
  }

  // Load workflows
  async function loadWorkflows() {
    try {
      await store.loadWorkflows()
    } catch (e) {
      toast.error('Error al cargar workflows')
    }
  }

  // Load specific workflow
  async function loadWorkflow(workflowId: string) {
    try {
      await store.loadWorkflow(workflowId)
      toast.success('Workflow cargado correctamente')
    } catch (e) {
      toast.error('Error al cargar workflow')
    }
  }

  // Create new workflow
  async function createWorkflow() {
    if (!institutionConfigId.value) {
      toast.error('Debe seleccionar una institucion')
      return
    }

    newWorkflow.value.institution_config_id = institutionConfigId.value

    try {
      const created = await store.createWorkflow(newWorkflow.value)
      toast.success('Workflow creado correctamente')
      showWorkflowDialog.value = false
      resetWorkflowForm()
      await loadWorkflow(created.id)
    } catch (e) {
      toast.error('Error al crear workflow')
    }
  }

  // Save current workflow (update canvas state)
  async function saveWorkflow() {
    if (!currentWorkflow.value) return

    try {
      // Save any pending node position changes
      for (const node of nodeInstances.value) {
        const vfNode = nodes.value.find((n) => n.id === node.id)
        if (vfNode && (vfNode.position.x !== node.position_x || vfNode.position.y !== node.position_y)) {
          await store.updateNodeInstance(node.id, {
            position_x: vfNode.position.x,
            position_y: vfNode.position.y
          })
        }
      }

      toast.success('Workflow guardado correctamente')
    } catch (e) {
      toast.error('Error al guardar workflow')
    }
  }

  // Publish workflow
  async function publishWorkflow() {
    if (!currentWorkflow.value) return

    try {
      await store.publishWorkflow()
      toast.success('Workflow publicado correctamente')
    } catch (e) {
      toast.error('Error al publicar workflow')
    }
  }

  // Delete workflow
  async function deleteWorkflow(workflowId: string) {
    try {
      await store.deleteWorkflow(workflowId)
      toast.success('Workflow eliminado correctamente')
    } catch (e) {
      toast.error('Error al eliminar workflow')
    }
  }

  // Open node dialog with selected definition
  function openAddNodeDialog(definition: NodeDefinition) {
    selectedDefinition.value = definition
    newNode.value = {
      node_definition_id: definition.id,
      instance_key: `${definition.node_key}_${Date.now()}`,
      display_label: definition.display_name,
      config: { ...definition.default_config },
      position_x: 250 + Math.random() * 100,
      position_y: 250 + Math.random() * 100,
      is_entry_point: false
    }
    showNodeDialog.value = true
  }

  // Add node instance
  async function addNode() {
    if (!currentWorkflow.value) {
      toast.error('Debe cargar un workflow primero')
      return
    }

    try {
      await store.addNodeInstance(newNode.value)
      toast.success('Nodo agregado correctamente')
      showNodeDialog.value = false
      resetNodeForm()
    } catch (e) {
      toast.error('Error al agregar nodo')
    }
  }

  // Update node instance
  async function updateNode(nodeId: string, updates: NodeInstanceUpdate) {
    try {
      await store.updateNodeInstance(nodeId, updates)
      toast.success('Nodo actualizado correctamente')
    } catch (e) {
      toast.error('Error al actualizar nodo')
    }
  }

  // Delete node instance
  async function deleteNode(nodeId: string) {
    try {
      await store.deleteNodeInstance(nodeId)
      toast.success('Nodo eliminado correctamente')
    } catch (e) {
      toast.error('Error al eliminar nodo')
    }
  }

  // Add transition (edge)
  async function addTransition() {
    if (!currentWorkflow.value) {
      toast.error('Debe cargar un workflow primero')
      return
    }

    try {
      await store.addTransition(newTransition.value)
      toast.success('Transicion agregada correctamente')
      showTransitionDialog.value = false
      resetTransitionForm()
    } catch (e) {
      toast.error('Error al agregar transicion')
    }
  }

  // Update transition
  async function updateTransition(transitionId: string, updates: TransitionUpdate) {
    try {
      await store.updateTransition(transitionId, updates)
      toast.success('Transicion actualizada correctamente')
    } catch (e) {
      toast.error('Error al actualizar transicion')
    }
  }

  // Delete transition
  async function deleteTransition(transitionId: string) {
    try {
      await store.deleteTransition(transitionId)
      toast.success('Transicion eliminada correctamente')
    } catch (e) {
      toast.error('Error al eliminar transicion')
    }
  }

  // Handle Vue Flow edge connection
  async function onConnect(params: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) {
    if (!currentWorkflow.value) return

    // Log connection attempt for debugging
    console.log('[Workflow] Creating connection:', {
      source: params.source,
      target: params.target,
      workflowId: currentWorkflow.value.id
    })

    try {
      await store.addTransition({
        source_node_id: params.source,
        target_node_id: params.target,
        source_output: params.sourceHandle ?? 'default',
        target_input: params.targetHandle ?? 'default',
        priority: 0
      })
      toast.info('Conexion creada')
    } catch (e: unknown) {
      const errorMsg = extractErrorMessage(e, 'Error al crear conexion')
      console.error('[Workflow] Connection error:', e)
      toast.error(errorMsg)
    }
  }

  // Handle node position change
  function onNodeDragStop(nodeId: string, position: { x: number; y: number }) {
    store.updateNodePosition(nodeId, position)
  }

  // Handle node selection
  function onNodeClick(nodeId: string) {
    store.selectNode(nodeId)
  }

  // Handle edge selection
  function onEdgeClick(edgeId: string) {
    store.selectEdge(edgeId)
  }

  // Handle pane click (deselect)
  function onPaneClick() {
    store.clearSelection()
  }

  // Confirm delete
  function confirmDelete(type: 'workflow' | 'node' | 'transition', id: string) {
    deleteTarget.value = { type, id }
    showDeleteConfirm.value = true
  }

  // Execute delete
  async function executeDelete() {
    if (!deleteTarget.value) return

    const { type, id } = deleteTarget.value

    switch (type) {
      case 'workflow':
        await deleteWorkflow(id)
        break
      case 'node':
        await deleteNode(id)
        break
      case 'transition':
        await deleteTransition(id)
        break
    }

    showDeleteConfirm.value = false
    deleteTarget.value = null
  }

  // Reset forms
  function resetWorkflowForm() {
    newWorkflow.value = {
      institution_config_id: institutionConfigId.value || '',
      workflow_key: '',
      workflow_type: 'medical_appointment',
      display_name: '',
      description: '',
      is_draft: true
    }
  }

  function resetNodeForm() {
    newNode.value = {
      node_definition_id: '',
      instance_key: '',
      display_label: '',
      config: {},
      position_x: 250,
      position_y: 250,
      is_entry_point: false
    }
    selectedDefinition.value = null
  }

  function resetTransitionForm() {
    newTransition.value = {
      source_node_id: '',
      target_node_id: '',
      source_output: 'default',
      target_input: 'default',
      priority: 0,
      label: ''
    }
  }

  // Get node color by type
  function getNodeColor(nodeType: string): string {
    return nodeTypeColors[nodeType] || '#64748b'
  }

  // Get node icon by type
  function getNodeIcon(nodeType: string): string {
    return nodeTypeIcons[nodeType] || 'pi-circle'
  }

  // Auto-fetch on mount
  if (autoFetch) {
    onMounted(() => {
      if (authStore.currentOrgId) {
        initialize()
      }
    })
  }

  // Watch for org changes
  watch(
    () => authStore.currentOrgId,
    (newOrgId) => {
      if (newOrgId && autoFetch) {
        // Reset institution selection when org changes
        selectedInstitutionId.value = null
        institutions.value = []
        initialize()
      }
    }
  )

  return {
    // Institution state
    institutions,
    selectedInstitutionId,
    selectedInstitution,
    isLoadingInstitutions,

    // State
    showWorkflowDialog,
    showNodeDialog,
    showTransitionDialog,
    showDeleteConfirm,
    deleteTarget,
    newWorkflow,
    newNode,
    newTransition,
    selectedDefinition,

    // Computed from store
    workflows,
    currentWorkflow,
    nodeDefinitions,
    nodeDefinitionsByCategory,
    nodes,
    edges,
    nodeInstances,
    transitions,
    selectedNode,
    selectedEdge,
    isLoading,
    isSaving,
    isDirty,
    error,
    institutionConfigId,
    stats,
    validationErrors,
    hasValidationErrors,

    // Constants
    workflowTypeOptions,
    nodeTypeColors,
    nodeTypeIcons,

    // Actions
    initialize,
    loadInstitutions,
    selectInstitution,
    loadWorkflows,
    loadWorkflow,
    createWorkflow,
    saveWorkflow,
    publishWorkflow,
    deleteWorkflow,
    openAddNodeDialog,
    addNode,
    updateNode,
    deleteNode,
    addTransition,
    updateTransition,
    deleteTransition,

    // Vue Flow handlers
    onConnect,
    onNodeDragStop,
    onNodeClick,
    onEdgeClick,
    onPaneClick,

    // Dialog helpers
    confirmDelete,
    executeDelete,
    resetWorkflowForm,
    resetNodeForm,
    resetTransitionForm,

    // Utilities
    getNodeColor,
    getNodeIcon
  }
}

export default useWorkflowEditor
