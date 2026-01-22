import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useYamlSharedStore } from './shared.store'
import formattersApi from '@/api/formatters.api'
import type {
  YamlFormatter,
  FormatterListParams,
  PaginatedFormatterResponse,
  FormatterAnalytics,
  FormatterTestResult,
  CreateFormatterRequest,
  UpdateFormatterRequest,
  FormatterTestRequest
} from '@/types/yaml.types'

export const useYamlFormattersStore = defineStore('yaml-formatters', () => {
  const shared = useYamlSharedStore()

  // Formatters State
  const formatters = ref<YamlFormatter[]>([])
  const currentFormatter = ref<YamlFormatter | null>(null)
  const formatterAnalytics = ref<FormatterAnalytics | null>(null)
  const formatterTestResult = ref<FormatterTestResult | null>(null)

  // Getters
  const filteredFormatters = computed(() => {
    let filtered = [...(formatters.value || [])]
    const { filters } = shared

    if (filters.domain) {
      // Extract domain from formatter key (e.g., 'pharmacy.formatter.debt_response' → 'pharmacy')
      filtered = filtered.filter(f => f.key.split('.')[0] === filters.domain)
    }

    if (filters.source) {
      filtered = filtered.filter(f => f.source === filters.source)
    }

    if (filters.active !== null) {
      filtered = filtered.filter(f => f.active === filters.active)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchLower) ||
        f.key.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  })

  const paginatedFormatters = computed(() => {
    const start = (shared.pagination.page - 1) * shared.pagination.pageSize
    const end = start + shared.pagination.pageSize
    return filteredFormatters.value.slice(start, end)
  })

  const formatterDomains = computed(() => {
    const domainSet = new Set<string>()
    ;(formatters.value || []).forEach(f => {
      const domain = f.key.split('.')[0]
      if (domain) domainSet.add(domain)
    })
    return Array.from(domainSet).sort()
  })

  // Actions
  async function fetchFormatters(params: FormatterListParams = {}) {
    shared.loading = true
    shared.error = null

    try {
      const queryParams = {
        domain: shared.filters.domain || undefined,
        source: shared.filters.source || undefined,
        is_active: shared.filters.active || undefined,
        search: shared.filters.search || undefined,
        ...params,
        page: shared.pagination.page,
        pageSize: shared.pagination.pageSize
      }

      const response: PaginatedFormatterResponse = await formattersApi.list(queryParams)

      formatters.value = response?.items || []
      shared.pagination.total = response?.total || 0
      shared.pagination.page = response?.page || 1
    } catch (err: any) {
      shared.error = err.message || 'Error fetching formatters'
      console.error('Error fetching formatters:', err)
    } finally {
      shared.loading = false
    }
  }

  async function fetchFormatterByKey(key: string) {
    shared.loading = true
    shared.error = null

    try {
      currentFormatter.value = await formattersApi.getByKey(key)
      shared.editorContent = currentFormatter.value.body_template
      shared.editorDirty = false
    } catch (err: any) {
      shared.error = err.message || 'Error fetching formatter'
      console.error('Error fetching formatter:', err)
    } finally {
      shared.loading = false
    }
  }

  async function createFormatter(formatterData: CreateFormatterRequest) {
    shared.loading = true
    shared.error = null

    try {
      const newFormatter = await formattersApi.create(formatterData)
      formatters.value.unshift(newFormatter)
      shared.pagination.total++

      return newFormatter
    } catch (err: any) {
      shared.error = err.message || 'Error creating formatter'
      console.error('Error creating formatter:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function updateFormatter(key: string, updateData: UpdateFormatterRequest) {
    shared.loading = true
    shared.error = null

    try {
      const updatedFormatter = await formattersApi.update(key, updateData)

      // Update in formatters array
      const index = formatters.value.findIndex(f => f.key === key)
      if (index !== -1) {
        formatters.value[index] = updatedFormatter
      }

      // Update current formatter if it's the same
      if (currentFormatter.value?.key === key) {
        currentFormatter.value = updatedFormatter
      }

      shared.editorDirty = false

      return updatedFormatter
    } catch (err: any) {
      shared.error = err.message || 'Error updating formatter'
      console.error('Error updating formatter:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function deleteFormatter(key: string) {
    shared.loading = true
    shared.error = null

    try {
      await formattersApi.delete(key)

      // Remove from formatters array
      const index = formatters.value.findIndex(f => f.key === key)
      if (index !== -1) {
        formatters.value.splice(index, 1)
      }

      shared.pagination.total--

      // Clear current formatter if it's the same
      if (currentFormatter.value?.key === key) {
        currentFormatter.value = null
      }
    } catch (err: any) {
      shared.error = err.message || 'Error deleting formatter'
      console.error('Error deleting formatter:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function testFormatter(key: string, testData: FormatterTestRequest) {
    shared.loading = true
    shared.error = null

    try {
      formatterTestResult.value = await formattersApi.testFormatter(key, testData)
      return formatterTestResult.value
    } catch (err: any) {
      shared.error = err.message || 'Error testing formatter'
      console.error('Error testing formatter:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function fetchFormatterAnalytics() {
    try {
      formatterAnalytics.value = await formattersApi.getAnalytics()
      return formatterAnalytics.value
    } catch (err: any) {
      shared.error = err.message || 'Error fetching formatter analytics'
      console.error('Error fetching formatter analytics:', err)
    }
  }

  function setCurrentFormatter(formatter: YamlFormatter | null) {
    currentFormatter.value = formatter
    if (formatter) {
      shared.editorContent = formatter.body_template
      shared.editorDirty = false
    }
  }

  function clearCurrentFormatter() {
    currentFormatter.value = null
    shared.resetEditorState()
    formatterTestResult.value = null
  }

  return {
    formatters,
    currentFormatter,
    formatterAnalytics,
    formatterTestResult,
    
    filteredFormatters,
    paginatedFormatters,
    formatterDomains,
    
    fetchFormatters,
    fetchFormatterByKey,
    createFormatter,
    updateFormatter,
    deleteFormatter,
    testFormatter,
    fetchFormatterAnalytics,
    setCurrentFormatter,
    clearCurrentFormatter
  }
})
