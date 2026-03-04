/**
 * useConfigValidation Composable
 *
 * Manages validation state for the graph topology editor.
 * Fetches validation issues from the backend and provides
 * per-node issue counts for badge rendering.
 */

import { ref, computed } from 'vue'
import { validationApi, type ValidationIssue, type ValidationResult } from '@/api/validationApi'

export function useConfigValidation() {
  const validationResult = ref<ValidationResult | null>(null)
  const isValidating = ref(false)
  const validationError = ref<string | null>(null)

  /**
   * Fetch validation issues from the backend.
   */
  async function refreshValidation(domainKey: string, organizationId: string) {
    if (!domainKey || !organizationId) return

    isValidating.value = true
    validationError.value = null

    try {
      validationResult.value = await validationApi.validate(domainKey, organizationId)
    } catch (err) {
      console.error('Validation fetch failed:', err)
      validationError.value = 'No se pudo validar la configuración'
      validationResult.value = null
    } finally {
      isValidating.value = false
    }
  }

  /**
   * Per-node issue counts for badge rendering.
   */
  const nodeIssueMap = computed<Record<string, { critical: number; warning: number }>>(() => {
    const map: Record<string, { critical: number; warning: number }> = {}
    if (!validationResult.value) return map

    for (const issue of validationResult.value.issues) {
      const nodeId = issue.node_id
      if (!nodeId) continue
      if (!map[nodeId]) map[nodeId] = { critical: 0, warning: 0 }
      map[nodeId][issue.severity]++
    }
    return map
  })

  /**
   * Total issue counts for the stats bar.
   */
  const totalIssues = computed(() => {
    if (!validationResult.value) return { critical: 0, warning: 0, total: 0 }
    const critical = validationResult.value.issues.filter(i => i.severity === 'critical').length
    const warning = validationResult.value.issues.filter(i => i.severity === 'warning').length
    return { critical, warning, total: critical + warning }
  })

  /**
   * Get issues for a specific node.
   */
  function getNodeIssues(nodeId: string): ValidationIssue[] {
    if (!validationResult.value) return []
    return validationResult.value.issues.filter(i => i.node_id === nodeId)
  }

  return {
    validationResult,
    isValidating,
    validationError,
    nodeIssueMap,
    totalIssues,
    refreshValidation,
    getNodeIssues
  }
}
