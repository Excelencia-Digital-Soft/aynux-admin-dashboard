/**
 * Composable for Workflow export/import operations
 *
 * Provides JSON export and import functionality for workflows.
 */

import { ref, computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import type {
  NodeInstance,
  WorkflowTransition,
  CanvasState,
  TransitionCondition
} from '@/types/workflow.types'

export interface WorkflowExportData {
  version: string
  workflow: {
    key: string
    name: string
    type: string
    description: string | null
  }
  nodes: ExportedNode[]
  edges: ExportedEdge[]
  canvas_state: CanvasState | null
  exported_at: string
}

export interface ExportedNode {
  instance_key: string
  node_definition_id: string
  display_label: string
  config: Record<string, unknown>
  position: { x: number; y: number }
  is_entry_point: boolean
  description: string | null
}

export interface ExportedEdge {
  source_key: string
  target_key: string
  source_output: string
  target_input: string
  condition: TransitionCondition | null
  priority: number
  label: string | null
}

const EXPORT_VERSION = '1.0.0'

export function useWorkflowExportImport() {
  const store = useWorkflowStore()
  const toast = useToast()

  // State
  const isExporting = ref(false)
  const isImporting = ref(false)
  const importPreview = ref<WorkflowExportData | null>(null)
  const importError = ref<string | null>(null)

  // Computed
  const currentWorkflow = computed(() => store.currentWorkflow)
  const nodeInstances = computed(() => store.nodeInstances)
  const transitions = computed(() => store.transitions)

  /**
   * Build instance key to node ID map
   */
  function buildKeyToIdMap(): Map<string, string> {
    const map = new Map<string, string>()
    for (const node of nodeInstances.value) {
      map.set(node.instance_key, node.id)
    }
    return map
  }

  /**
   * Build node ID to instance key map
   */
  function buildIdToKeyMap(): Map<string, string> {
    const map = new Map<string, string>()
    for (const node of nodeInstances.value) {
      map.set(node.id, node.instance_key)
    }
    return map
  }

  /**
   * Export workflow to JSON
   */
  function exportToJSON(): WorkflowExportData | null {
    if (!currentWorkflow.value) {
      toast.error('No hay workflow cargado para exportar')
      return null
    }

    const idToKeyMap = buildIdToKeyMap()

    // Convert nodes to export format
    const exportedNodes: ExportedNode[] = nodeInstances.value.map((node) => ({
      instance_key: node.instance_key,
      node_definition_id: node.node_definition_id,
      display_label: node.display_label,
      config: node.config,
      position: { x: node.position_x, y: node.position_y },
      is_entry_point: node.is_entry_point,
      description: node.description || null
    }))

    // Convert edges to export format (use instance keys instead of IDs)
    const exportedEdges: ExportedEdge[] = transitions.value.map((transition) => ({
      source_key: idToKeyMap.get(transition.source_node_id) || transition.source_node_id,
      target_key: idToKeyMap.get(transition.target_node_id) || transition.target_node_id,
      source_output: transition.source_output,
      target_input: transition.target_input,
      condition: transition.condition,
      priority: transition.priority,
      label: transition.label
    }))

    const exportData: WorkflowExportData = {
      version: EXPORT_VERSION,
      workflow: {
        key: currentWorkflow.value.workflow_key,
        name: currentWorkflow.value.display_name,
        type: currentWorkflow.value.workflow_type,
        description: currentWorkflow.value.description
      },
      nodes: exportedNodes,
      edges: exportedEdges,
      canvas_state: currentWorkflow.value.canvas_state,
      exported_at: new Date().toISOString()
    }

    return exportData
  }

  /**
   * Export workflow to file download
   */
  function exportToFile() {
    isExporting.value = true

    try {
      const exportData = exportToJSON()
      if (!exportData) return

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workflow-${exportData.workflow.key}-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Workflow exportado correctamente')
    } catch (e) {
      toast.error('Error al exportar workflow')
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Validate import data
   */
  function validateImportData(data: unknown): data is WorkflowExportData {
    if (!data || typeof data !== 'object') return false

    const d = data as Record<string, unknown>

    if (!d.version || typeof d.version !== 'string') return false
    if (!d.workflow || typeof d.workflow !== 'object') return false
    if (!Array.isArray(d.nodes)) return false
    if (!Array.isArray(d.edges)) return false

    return true
  }

  /**
   * Parse and preview import file
   */
  async function parseImportFile(file: File): Promise<WorkflowExportData | null> {
    importError.value = null
    importPreview.value = null

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!validateImportData(data)) {
        importError.value = 'Formato de archivo invalido'
        return null
      }

      importPreview.value = data
      return data
    } catch (e) {
      importError.value = 'Error al parsear el archivo JSON'
      return null
    }
  }

  /**
   * Import workflow from file
   */
  async function importFromFile(file: File): Promise<boolean> {
    if (!currentWorkflow.value) {
      toast.error('Debe cargar un workflow destino primero')
      return false
    }

    isImporting.value = true
    importError.value = null

    try {
      const data = await parseImportFile(file)
      if (!data) return false

      // Confirm import
      const confirmed = window.confirm(
        `Importar ${data.nodes.length} nodos y ${data.edges.length} transiciones?\n` +
        `Esto reemplazará el contenido actual del workflow.`
      )

      if (!confirmed) {
        isImporting.value = false
        return false
      }

      // Use store's import function
      await store.importWorkflow({
        nodes: data.nodes.map((node) => ({
          node_definition_id: node.node_definition_id,
          instance_key: node.instance_key,
          display_name: node.display_label,
          config: node.config,
          position_x: node.position.x,
          position_y: node.position.y,
          is_entry_point: node.is_entry_point
        })),
        edges: data.edges.map((edge) => ({
          source_instance_key: edge.source_key,
          target_instance_key: edge.target_key,
          condition: edge.condition || undefined,
          priority: edge.priority,
          label: edge.label || undefined
        })),
        canvas_state: data.canvas_state || undefined
      })

      toast.success('Workflow importado correctamente')
      importPreview.value = null
      return true
    } catch (e) {
      importError.value = e instanceof Error ? e.message : 'Error al importar workflow'
      toast.error('Error al importar workflow')
      return false
    } finally {
      isImporting.value = false
    }
  }

  /**
   * Clear import preview
   */
  function clearImportPreview() {
    importPreview.value = null
    importError.value = null
  }

  /**
   * Copy workflow to clipboard as JSON
   */
  async function copyToClipboard(): Promise<boolean> {
    try {
      const exportData = exportToJSON()
      if (!exportData) return false

      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      toast.success('Workflow copiado al portapapeles')
      return true
    } catch (e) {
      toast.error('Error al copiar al portapapeles')
      return false
    }
  }

  /**
   * Import workflow from clipboard
   */
  async function pasteFromClipboard(): Promise<boolean> {
    if (!currentWorkflow.value) {
      toast.error('Debe cargar un workflow destino primero')
      return false
    }

    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)

      if (!validateImportData(data)) {
        toast.error('El portapapeles no contiene un workflow valido')
        return false
      }

      importPreview.value = data
      return true
    } catch (e) {
      toast.error('Error al leer del portapapeles')
      return false
    }
  }

  return {
    // State
    isExporting,
    isImporting,
    importPreview,
    importError,

    // Actions
    exportToJSON,
    exportToFile,
    parseImportFile,
    importFromFile,
    clearImportPreview,
    copyToClipboard,
    pasteFromClipboard
  }
}

export default useWorkflowExportImport
