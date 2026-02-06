/**
 * Composable for Workflow undo/redo functionality
 *
 * Uses VueUse's useManualRefHistory to track workflow state changes.
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { useManualRefHistory } from '@vueuse/core'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import type { NodeInstance, WorkflowTransition } from '@/types/workflow.types'

export interface WorkflowSnapshot {
  nodeInstances: NodeInstance[]
  transitions: WorkflowTransition[]
  timestamp: number
}

const MAX_HISTORY_SIZE = 50

export function useWorkflowHistory() {
  const store = useWorkflowStore()
  const toast = useToast()

  // Track if we're currently restoring (to avoid recording during restore)
  const isRestoring = ref(false)

  // Create snapshot ref
  const snapshot = ref<WorkflowSnapshot>({
    nodeInstances: [],
    transitions: [],
    timestamp: Date.now()
  })

  // Use manual ref history from VueUse
  const { history, undo: undoHistory, redo: redoHistory, canUndo, canRedo, commit } = useManualRefHistory(
    snapshot,
    {
      capacity: MAX_HISTORY_SIZE,
      clone: true
    }
  )

  // Computed states
  const historyLength = computed(() => history.value.length)
  const currentIndex = computed(() => {
    // Find current position in history
    return history.value.findIndex(
      (h) => h.snapshot.timestamp === snapshot.value.timestamp
    )
  })

  /**
   * Create a snapshot of the current workflow state
   */
  function createSnapshot(): WorkflowSnapshot {
    return {
      nodeInstances: JSON.parse(JSON.stringify(store.nodeInstances)),
      transitions: JSON.parse(JSON.stringify(store.transitions)),
      timestamp: Date.now()
    }
  }

  /**
   * Record the current state in history
   */
  function record() {
    if (isRestoring.value) return

    snapshot.value = createSnapshot()
    commit()
  }

  /**
   * Apply a snapshot to the store
   */
  function applySnapshot(snap: WorkflowSnapshot) {
    isRestoring.value = true

    try {
      // Update store's local state (not persisted to API)
      store.nodeInstances = JSON.parse(JSON.stringify(snap.nodeInstances))
      store.transitions = JSON.parse(JSON.stringify(snap.transitions))

      // Regenerate Vue Flow graph
      store.generateGraph()
      store.isDirty = true

      // Clear selection
      store.clearSelection()
    } finally {
      isRestoring.value = false
    }
  }

  /**
   * Undo last action
   */
  function undo(): boolean {
    if (!canUndo.value) {
      toast.warn('No hay acciones para deshacer')
      return false
    }

    undoHistory()
    applySnapshot(snapshot.value)
    toast.info('Deshecho')
    return true
  }

  /**
   * Redo last undone action
   */
  function redo(): boolean {
    if (!canRedo.value) {
      toast.warn('No hay acciones para rehacer')
      return false
    }

    redoHistory()
    applySnapshot(snapshot.value)
    toast.info('Rehecho')
    return true
  }

  /**
   * Clear history
   */
  function clear() {
    snapshot.value = createSnapshot()
    // Note: useManualRefHistory doesn't have a clear method,
    // but we reset by committing a new snapshot
    commit()
  }

  /**
   * Initialize history with current state
   */
  function initialize() {
    snapshot.value = createSnapshot()
    commit()
  }

  // Auto-record when workflow changes
  // We watch for deep changes in nodeInstances and transitions
  let recordTimeout: ReturnType<typeof setTimeout> | null = null

  watch(
    () => store.currentWorkflow?.id,
    (newId) => {
      if (newId) {
        // Initialize history when workflow changes
        initialize()
      }
    }
  )

  // Debounced recording for node/transition changes
  // This prevents recording during rapid changes
  watch(
    () => [store.nodeInstances.length, store.transitions.length],
    () => {
      if (isRestoring.value || !store.currentWorkflow) return

      // Clear existing timeout
      if (recordTimeout) {
        clearTimeout(recordTimeout)
      }

      // Debounce recording
      recordTimeout = setTimeout(() => {
        record()
      }, 500)
    }
  )

  // Cleanup on component unmount to prevent memory leaks
  onUnmounted(() => {
    if (recordTimeout) {
      clearTimeout(recordTimeout)
      recordTimeout = null
    }
  })

  return {
    // State
    canUndo,
    canRedo,
    historyLength,
    isRestoring,

    // Actions
    undo,
    redo,
    record,
    clear,
    initialize
  }
}

export default useWorkflowHistory
