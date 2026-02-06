import { onMounted, onUnmounted, type Ref } from 'vue'
import type { NodeInstance, WorkflowEdge } from '@/types/workflow.types'

export interface KeyboardShortcutHandlers {
  // Selection
  selectedNode: Ref<NodeInstance | null>
  selectedEdge: Ref<WorkflowEdge | null>
  hasWorkflow: Ref<boolean>
  hasNodes: Ref<boolean>
  isDirty: Ref<boolean>

  // Actions
  onDeleteNode: (node: NodeInstance) => void
  onDeleteTransition: (edgeId: string) => void
  onSave: () => void
  onExecute: () => void
  onCopy: () => void
  onPaste: () => void
  onCut: () => void
  onDuplicate: () => void
  onSearch: () => void
  onUndo: () => void
  onRedo: () => void
  onEscape: () => void
  onCloseDialogs?: () => void
}

/**
 * useWorkflowKeyboardShortcuts - Manages keyboard shortcuts
 *
 * Single responsibility: Register and handle keyboard shortcuts
 * for workflow editor operations.
 */
export function useWorkflowKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement

    // Ignore when typing in inputs
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey

    // Delete/Backspace - Delete selected item
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (handlers.selectedNode.value) {
        e.preventDefault()
        handlers.onDeleteNode(handlers.selectedNode.value)
      } else if (handlers.selectedEdge.value) {
        e.preventDefault()
        handlers.onDeleteTransition(handlers.selectedEdge.value.id)
      }
      return
    }

    // Escape - Deselect and close dialogs
    if (e.key === 'Escape') {
      handlers.onEscape()
      handlers.onCloseDialogs?.()
      return
    }

    // Ctrl+S - Save
    if (isCtrlOrMeta && e.key === 's') {
      e.preventDefault()
      if (handlers.hasWorkflow.value && handlers.isDirty.value) {
        handlers.onSave()
      }
      return
    }

    // F5 - Execute workflow
    if (e.key === 'F5') {
      e.preventDefault()
      if (handlers.hasWorkflow.value && handlers.hasNodes.value) {
        handlers.onExecute()
      }
      return
    }

    // Only process remaining shortcuts if workflow is loaded
    if (!handlers.hasWorkflow.value) return

    // Ctrl+C - Copy
    if (isCtrlOrMeta && e.key === 'c') {
      e.preventDefault()
      handlers.onCopy()
      return
    }

    // Ctrl+V - Paste
    if (isCtrlOrMeta && e.key === 'v') {
      e.preventDefault()
      handlers.onPaste()
      return
    }

    // Ctrl+X - Cut
    if (isCtrlOrMeta && e.key === 'x') {
      e.preventDefault()
      handlers.onCut()
      return
    }

    // Ctrl+D - Duplicate
    if (isCtrlOrMeta && e.key === 'd') {
      e.preventDefault()
      handlers.onDuplicate()
      return
    }

    // Ctrl+F - Search
    if (isCtrlOrMeta && e.key === 'f') {
      e.preventDefault()
      handlers.onSearch()
      return
    }

    // Ctrl+Z - Undo
    if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handlers.onUndo()
      return
    }

    // Ctrl+Y or Ctrl+Shift+Z - Redo
    if (isCtrlOrMeta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      handlers.onRedo()
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown
  }
}
