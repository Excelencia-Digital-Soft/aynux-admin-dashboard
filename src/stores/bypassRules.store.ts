/**
 * Bypass Rules Store
 * Pinia store for managing bypass routing rules state
 */

import { defineStore } from 'pinia'
import type {
  BypassRule,
  BypassRuleFilters,
  BypassTestResponse,
  BypassRuleType
} from '@/types/bypassRules.types'

interface BypassRulesState {
  // Rules data
  rules: BypassRule[]
  totalRules: number
  enabledCount: number
  disabledCount: number
  selectedRule: BypassRule | null

  // Test results
  testResult: BypassTestResponse | null

  // UI State
  isLoading: boolean
  error: string | null

  // Filters
  filters: BypassRuleFilters

  // Dialogs
  showRuleDialog: boolean
  showDeleteDialog: boolean
  showTestDialog: boolean
  editingRule: BypassRule | null
  deletingRule: BypassRule | null
}

export const useBypassRulesStore = defineStore('bypassRules', {
  state: (): BypassRulesState => ({
    rules: [],
    totalRules: 0,
    enabledCount: 0,
    disabledCount: 0,
    selectedRule: null,

    testResult: null,

    isLoading: false,
    error: null,

    filters: {},

    showRuleDialog: false,
    showDeleteDialog: false,
    showTestDialog: false,
    editingRule: null,
    deletingRule: null
  }),

  getters: {
    /**
     * Get enabled rules only
     */
    enabledRules(): BypassRule[] {
      return this.rules.filter((r) => r.enabled)
    },

    /**
     * Get disabled rules only
     */
    disabledRules(): BypassRule[] {
      return this.rules.filter((r) => !r.enabled)
    },

    /**
     * Check if editing a rule
     */
    isEditingRule(): boolean {
      return this.editingRule !== null
    },

    /**
     * Get filtered rules
     */
    filteredRules(): BypassRule[] {
      let result = [...this.rules]

      const { search, enabled, ruleType } = this.filters

      if (search) {
        const searchLower = search.toLowerCase()
        result = result.filter(
          (r) =>
            r.rule_name.toLowerCase().includes(searchLower) ||
            r.description?.toLowerCase().includes(searchLower) ||
            r.target_agent.toLowerCase().includes(searchLower)
        )
      }

      if (enabled !== undefined) {
        result = result.filter((r) => r.enabled === enabled)
      }

      if (ruleType) {
        result = result.filter((r) => r.rule_type === ruleType)
      }

      return result
    },

    /**
     * Rules sorted by priority (descending)
     */
    sortedRules(): BypassRule[] {
      return [...this.filteredRules].sort((a, b) => b.priority - a.priority)
    },

    /**
     * Has active filters
     */
    hasFilters(): boolean {
      const f = this.filters
      return !!(f.search || f.enabled !== undefined || f.ruleType)
    }
  },

  actions: {
    // ============ Rules Actions ============

    setRules(rules: BypassRule[], total: number, enabledCount: number, disabledCount: number) {
      this.rules = rules
      this.totalRules = total
      this.enabledCount = enabledCount
      this.disabledCount = disabledCount
    },

    selectRule(rule: BypassRule | null) {
      this.selectedRule = rule
    },

    addRule(rule: BypassRule) {
      this.rules.push(rule)
      this.totalRules++
      if (rule.enabled) {
        this.enabledCount++
      } else {
        this.disabledCount++
      }
      // Re-sort by priority
      this.rules.sort((a, b) => b.priority - a.priority)
    },

    updateRule(rule: BypassRule) {
      const index = this.rules.findIndex((r) => r.id === rule.id)
      if (index >= 0) {
        const oldRule = this.rules[index]
        // Update enabled counts if changed
        if (oldRule.enabled !== rule.enabled) {
          if (rule.enabled) {
            this.enabledCount++
            this.disabledCount--
          } else {
            this.enabledCount--
            this.disabledCount++
          }
        }
        this.rules[index] = rule
      }
      if (this.selectedRule?.id === rule.id) {
        this.selectedRule = rule
      }
      // Re-sort by priority
      this.rules.sort((a, b) => b.priority - a.priority)
    },

    removeRule(ruleId: string) {
      const rule = this.rules.find((r) => r.id === ruleId)
      if (rule) {
        if (rule.enabled) {
          this.enabledCount--
        } else {
          this.disabledCount--
        }
      }
      this.rules = this.rules.filter((r) => r.id !== ruleId)
      this.totalRules--
      if (this.selectedRule?.id === ruleId) {
        this.selectedRule = null
      }
    },

    setRulesOrder(rules: BypassRule[]) {
      this.rules = rules
    },

    // ============ Test Actions ============

    setTestResult(result: BypassTestResponse | null) {
      this.testResult = result
    },

    clearTestResult() {
      this.testResult = null
    },

    // ============ UI Actions ============

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    // ============ Dialog Actions ============

    openRuleDialog(rule: BypassRule | null = null) {
      this.editingRule = rule
      this.showRuleDialog = true
    },

    closeRuleDialog() {
      this.showRuleDialog = false
      this.editingRule = null
    },

    openDeleteDialog(rule: BypassRule) {
      this.deletingRule = rule
      this.showDeleteDialog = true
    },

    closeDeleteDialog() {
      this.showDeleteDialog = false
      this.deletingRule = null
    },

    openTestDialog() {
      this.showTestDialog = true
      this.testResult = null
    },

    closeTestDialog() {
      this.showTestDialog = false
      this.testResult = null
    },

    // ============ Filter Actions ============

    setFilters(filters: Partial<BypassRuleFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {}
    },

    // ============ Reset ============

    reset() {
      this.$reset()
    }
  }
})
