/**
 * Composable for Workflow connection validation
 *
 * Provides validation logic for edge connections between nodes.
 */

import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow.store'
import { useToast } from '@/composables/useToast'
import type { Connection } from '@vue-flow/core'

// Define valid connection matrix
// Key: source node type, Value: array of allowed target node types
const CONNECTION_MATRIX: Record<string, string[]> = {
  conversation: ['conversation', 'routing', 'utility', 'integration'],
  routing: ['conversation', 'integration', 'utility'],
  integration: ['conversation', 'routing', 'utility'],
  utility: ['conversation', 'routing', 'integration', 'utility']
}

// Define node type labels for user-friendly messages
const NODE_TYPE_LABELS: Record<string, string> = {
  conversation: 'Conversacion',
  routing: 'Enrutamiento',
  integration: 'Integracion',
  utility: 'Utilidad'
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export function useConnectionValidation() {
  const store = useWorkflowStore()
  const toast = useToast()

  // Get node instances
  const nodeInstances = computed(() => store.nodeInstances)
  const transitions = computed(() => store.transitions)

  /**
   * Get node type by node ID
   */
  function getNodeType(nodeId: string): string | null {
    const node = nodeInstances.value.find(n => n.id === nodeId)
    return node?.node_type || null
  }

  /**
   * Get node label by node ID
   */
  function getNodeLabel(nodeId: string): string {
    const node = nodeInstances.value.find(n => n.id === nodeId)
    return node?.display_label || 'Nodo desconocido'
  }

  /**
   * Check if a connection between two node types is valid
   */
  function isTypeConnectionValid(sourceType: string, targetType: string): boolean {
    const allowedTargets = CONNECTION_MATRIX[sourceType]
    if (!allowedTargets) {
      // If source type not in matrix, allow all connections
      return true
    }
    return allowedTargets.includes(targetType)
  }

  /**
   * Check if a connection would create a self-loop
   */
  function isSelfLoop(sourceId: string, targetId: string): boolean {
    return sourceId === targetId
  }

  /**
   * Check if a connection already exists
   */
  function connectionExists(sourceId: string, targetId: string): boolean {
    return transitions.value.some(
      t => t.source_node_id === sourceId && t.target_node_id === targetId
    )
  }

  /**
   * Validate a connection with full details
   */
  function validateConnection(connection: Connection): ValidationResult {
    const { source, target } = connection

    if (!source || !target) {
      return { valid: false, reason: 'Conexion incompleta' }
    }

    // Check self-loop
    if (isSelfLoop(source, target)) {
      return { valid: false, reason: 'No se permite conectar un nodo consigo mismo' }
    }

    // Check duplicate connection
    if (connectionExists(source, target)) {
      return { valid: false, reason: 'Ya existe una conexion entre estos nodos' }
    }

    // Get node types
    const sourceType = getNodeType(source)
    const targetType = getNodeType(target)

    if (!sourceType || !targetType) {
      return { valid: false, reason: 'Tipo de nodo no encontrado' }
    }

    // Check type compatibility
    if (!isTypeConnectionValid(sourceType, targetType)) {
      const sourceLabel = NODE_TYPE_LABELS[sourceType] || sourceType
      const targetLabel = NODE_TYPE_LABELS[targetType] || targetType
      return {
        valid: false,
        reason: `No se puede conectar ${sourceLabel} a ${targetLabel}`
      }
    }

    return { valid: true }
  }

  /**
   * Vue Flow compatible validation handler
   * Returns true if connection is valid, false otherwise
   */
  function isValidConnection(connection: Connection): boolean {
    const result = validateConnection(connection)

    if (!result.valid && result.reason) {
      // Show toast with validation error
      toast.warn(result.reason)
    }

    return result.valid
  }

  /**
   * Get allowed target types for a source node
   */
  function getAllowedTargetTypes(sourceNodeId: string): string[] {
    const sourceType = getNodeType(sourceNodeId)
    if (!sourceType) return []
    return CONNECTION_MATRIX[sourceType] || []
  }

  /**
   * Get valid targets for a source node
   */
  function getValidTargets(sourceNodeId: string): typeof nodeInstances.value {
    const allowedTypes = getAllowedTargetTypes(sourceNodeId)
    return nodeInstances.value.filter(node => {
      // Exclude self
      if (node.id === sourceNodeId) return false
      // Exclude existing connections
      if (connectionExists(sourceNodeId, node.id)) return false
      // Check type compatibility
      const nodeType = node.node_type
      return nodeType && allowedTypes.includes(nodeType)
    })
  }

  /**
   * Get connection matrix for debugging/display
   */
  function getConnectionMatrix() {
    return CONNECTION_MATRIX
  }

  /**
   * Get node type labels
   */
  function getNodeTypeLabels() {
    return NODE_TYPE_LABELS
  }

  return {
    // Validation
    validateConnection,
    isValidConnection,
    isTypeConnectionValid,
    isSelfLoop,
    connectionExists,

    // Helpers
    getNodeType,
    getNodeLabel,
    getAllowedTargetTypes,
    getValidTargets,
    getConnectionMatrix,
    getNodeTypeLabels
  }
}

export default useConnectionValidation
