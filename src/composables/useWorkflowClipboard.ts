/**
 * Composable for Workflow clipboard operations (copy/paste nodes)
 *
 * Provides copy, paste, and cut functionality for workflow nodes.
 */

import { ref, computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import type { NodeInstance } from '@/types/workflow.types'

export interface ClipboardNode {
  node_definition_id: string
  instance_key: string
  display_label: string
  config: Record<string, unknown>
  position_x: number
  position_y: number
  is_entry_point: boolean
  description?: string | null
  node_type?: string
}

const PASTE_OFFSET = { x: 50, y: 50 }

export function useWorkflowClipboard() {
  const store = useWorkflowStore()
  const toast = useToast()

  // Clipboard state (module-level to persist across component instances)
  const clipboard = ref<ClipboardNode | null>(null)
  const pasteCount = ref(0)

  // Computed
  const hasClipboard = computed(() => clipboard.value !== null)
  const selectedNode = computed(() => store.selectedNode)

  /**
   * Copy the currently selected node to clipboard
   */
  function copy(): boolean {
    const node = selectedNode.value
    if (!node) {
      toast.warn('No hay nodo seleccionado para copiar')
      return false
    }

    clipboard.value = {
      node_definition_id: node.node_definition_id,
      instance_key: node.instance_key,
      display_label: node.display_label,
      config: { ...node.config },
      position_x: node.position_x,
      position_y: node.position_y,
      is_entry_point: false, // Never copy entry point status
      description: node.description,
      node_type: node.node_type
    }

    pasteCount.value = 0
    toast.info('Nodo copiado al portapapeles')
    return true
  }

  /**
   * Paste the clipboard node to the canvas
   */
  async function paste(): Promise<NodeInstance | null> {
    if (!clipboard.value) {
      toast.warn('No hay nodo en el portapapeles')
      return null
    }

    if (!store.currentWorkflow) {
      toast.error('No hay workflow cargado')
      return null
    }

    pasteCount.value++

    // Calculate new position with offset
    const newPosition = {
      x: clipboard.value.position_x + (PASTE_OFFSET.x * pasteCount.value),
      y: clipboard.value.position_y + (PASTE_OFFSET.y * pasteCount.value)
    }

    // Generate unique instance key
    const timestamp = Date.now()
    const newInstanceKey = `${clipboard.value.instance_key}_copy_${timestamp}`

    try {
      const newNode = await store.addNodeInstance({
        node_definition_id: clipboard.value.node_definition_id,
        instance_key: newInstanceKey,
        display_label: `${clipboard.value.display_label} (copia)`,
        config: { ...clipboard.value.config },
        position_x: newPosition.x,
        position_y: newPosition.y,
        is_entry_point: false // Never paste as entry point
      })

      toast.success('Nodo pegado correctamente')

      // Select the newly pasted node
      store.selectNode(newNode.id)

      return newNode
    } catch (e) {
      toast.error('Error al pegar nodo')
      return null
    }
  }

  /**
   * Cut the currently selected node (copy + delete)
   */
  async function cut(): Promise<boolean> {
    const node = selectedNode.value
    if (!node) {
      toast.warn('No hay nodo seleccionado para cortar')
      return false
    }

    // Don't allow cutting entry point
    if (node.is_entry_point) {
      toast.warn('No se puede cortar el punto de entrada')
      return false
    }

    // Copy first
    const copied = copy()
    if (!copied) return false

    // Then delete
    try {
      await store.deleteNodeInstance(node.id)
      toast.info('Nodo cortado')
      return true
    } catch (e) {
      toast.error('Error al cortar nodo')
      return false
    }
  }

  /**
   * Clear the clipboard
   */
  function clear() {
    clipboard.value = null
    pasteCount.value = 0
  }

  /**
   * Duplicate the selected node (copy + immediate paste)
   */
  async function duplicate(): Promise<NodeInstance | null> {
    const copied = copy()
    if (!copied) return null
    return await paste()
  }

  return {
    clipboard,
    hasClipboard,
    copy,
    paste,
    cut,
    clear,
    duplicate
  }
}

export default useWorkflowClipboard
