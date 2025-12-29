/**
 * Bypass Rules Composable
 * Composable for managing bypass routing rules with API calls and toast notifications
 */

import { computed } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useAuthStore } from '@/stores/auth.store'
import { bypassRulesApi } from '@/api/bypassRules.api'
import { useToast } from '@/composables/useToast'
import type {
  BypassRuleCreateRequest,
  BypassRuleUpdateRequest,
  BypassTestRequest,
  BypassReorderRequest,
  BypassRuleFilters
} from '@/types/bypassRules.types'

export function useBypassRules() {
  const store = useBypassRulesStore()
  const authStore = useAuthStore()
  const toast = useToast()

  // ============ Computed State ============

  const rules = computed(() => store.rules)
  const totalRules = computed(() => store.totalRules)
  const enabledCount = computed(() => store.enabledCount)
  const disabledCount = computed(() => store.disabledCount)
  const filteredRules = computed(() => store.filteredRules)
  const sortedRules = computed(() => store.sortedRules)
  const selectedRule = computed(() => store.selectedRule)
  const testResult = computed(() => store.testResult)

  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  // Dialog states
  const showRuleDialog = computed(() => store.showRuleDialog)
  const showDeleteDialog = computed(() => store.showDeleteDialog)
  const showTestDialog = computed(() => store.showTestDialog)
  const editingRule = computed(() => store.editingRule)
  const deletingRule = computed(() => store.deletingRule)
  const isEditing = computed(() => store.isEditingRule)

  // Filters
  const filters = computed(() => store.filters)
  const hasFilters = computed(() => store.hasFilters)

  // ============ Helper ============

  function getOrgId(): string | null {
    return authStore.currentOrgId
  }

  // ============ Rules CRUD ============

  async function fetchRules() {
    const orgId = getOrgId()
    if (!orgId) {
      toast.error('No hay organizacion seleccionada')
      return
    }

    store.setLoading(true)
    store.setError(null)

    try {
      const result = await bypassRulesApi.list(orgId)
      store.setRules(result.rules, result.total, result.enabled_count, result.disabled_count)
    } catch (err) {
      store.setError('Error al cargar reglas de bypass')
      toast.error('Error al cargar reglas de bypass')
    } finally {
      store.setLoading(false)
    }
  }

  async function getRule(ruleId: string) {
    const orgId = getOrgId()
    if (!orgId) return null

    store.setLoading(true)
    try {
      const rule = await bypassRulesApi.getById(orgId, ruleId)
      store.selectRule(rule)
      return rule
    } catch (err) {
      toast.error('Error al cargar regla')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function createRule(data: BypassRuleCreateRequest) {
    const orgId = getOrgId()
    if (!orgId) {
      toast.error('No hay organizacion seleccionada')
      return null
    }

    store.setLoading(true)
    try {
      const rule = await bypassRulesApi.create(orgId, data)
      store.addRule(rule)
      store.closeRuleDialog()
      toast.success('Regla creada exitosamente')
      return rule
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      const message = error.response?.data?.detail || 'Error al crear regla'
      toast.error(message)
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateRule(ruleId: string, data: BypassRuleUpdateRequest) {
    const orgId = getOrgId()
    if (!orgId) return null

    store.setLoading(true)
    try {
      const rule = await bypassRulesApi.update(orgId, ruleId, data)
      store.updateRule(rule)
      store.closeRuleDialog()
      toast.success('Regla actualizada exitosamente')
      return rule
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      const message = error.response?.data?.detail || 'Error al actualizar regla'
      toast.error(message)
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteRule(ruleId: string) {
    const orgId = getOrgId()
    if (!orgId) return false

    store.setLoading(true)
    try {
      await bypassRulesApi.delete(orgId, ruleId)
      store.removeRule(ruleId)
      store.closeDeleteDialog()
      toast.success('Regla eliminada exitosamente')
      return true
    } catch (err) {
      toast.error('Error al eliminar regla')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  async function toggleRule(ruleId: string) {
    const orgId = getOrgId()
    if (!orgId) return null

    try {
      const rule = await bypassRulesApi.toggle(orgId, ruleId)
      store.updateRule(rule)
      toast.success(rule.enabled ? 'Regla activada' : 'Regla desactivada')
      return rule
    } catch (err) {
      toast.error('Error al cambiar estado de regla')
      return null
    }
  }

  // ============ Reorder ============

  async function reorderRules(ruleIds: string[]) {
    const orgId = getOrgId()
    if (!orgId) return false

    store.setLoading(true)
    try {
      const reorderData: BypassReorderRequest = { rule_ids: ruleIds }
      const rules = await bypassRulesApi.reorder(orgId, reorderData)
      store.setRulesOrder(rules)
      toast.success('Orden actualizado exitosamente')
      return true
    } catch (err) {
      toast.error('Error al reordenar reglas')
      // Refetch to restore correct order
      await fetchRules()
      return false
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Test Routing ============

  async function testRouting(testData: BypassTestRequest) {
    const orgId = getOrgId()
    if (!orgId) {
      toast.error('No hay organizacion seleccionada')
      return null
    }

    store.setLoading(true)
    try {
      const result = await bypassRulesApi.testRouting(orgId, testData)
      store.setTestResult(result)
      return result
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      const message = error.response?.data?.detail || 'Error al probar enrutamiento'
      toast.error(message)
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Filter Actions ============

  function setFilters(newFilters: Partial<BypassRuleFilters>) {
    store.setFilters(newFilters)
  }

  function clearFilters() {
    store.clearFilters()
  }

  return {
    // State
    rules,
    totalRules,
    enabledCount,
    disabledCount,
    filteredRules,
    sortedRules,
    selectedRule,
    testResult,
    isLoading,
    error,

    // Dialog states
    showRuleDialog,
    showDeleteDialog,
    showTestDialog,
    editingRule,
    deletingRule,
    isEditing,

    // Filters
    filters,
    hasFilters,

    // CRUD operations
    fetchRules,
    getRule,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    reorderRules,
    testRouting,

    // Filter operations
    setFilters,
    clearFilters,

    // Store actions (passthrough)
    selectRule: store.selectRule,
    openRuleDialog: store.openRuleDialog,
    closeRuleDialog: store.closeRuleDialog,
    openDeleteDialog: store.openDeleteDialog,
    closeDeleteDialog: store.closeDeleteDialog,
    openTestDialog: store.openTestDialog,
    closeTestDialog: store.closeTestDialog,
    clearTestResult: store.clearTestResult
  }
}
