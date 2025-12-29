import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import yamlApi from '@/api/yaml.api'
import type {
  YamlPrompt,
  YamlListParams,
  PaginatedYamlResponse,
  PromptVersion,
  LockResponse,
  ValidationResult,
  TestResult,
  YamlFilters,
  PaginationState,
  YamlAnalytics,
  PreviewRequest,
  PreviewResponse
} from '@/types/yaml.types'

export const useYamlStore = defineStore('yaml', () => {
  // State
  const prompts = ref<YamlPrompt[]>([])
  const currentPrompt = ref<YamlPrompt | null>(null)
  const versions = ref<PromptVersion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const validation = ref<ValidationResult | null>(null)
  
  // Filters and Pagination
  const filters = ref<YamlFilters>({
    domain: null,
    source: null,
    active: null,
    search: '',
    tags: []
  })
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: 25,
    total: 0
  })
  
  // Lock State
  const lockedPrompts = ref<Map<string, LockResponse>>(new Map())
  const lockRefreshInterval = ref<number | null>(null)
  
  // Analytics
  const analytics = ref<YamlAnalytics | null>(null)
  
  // Editor State
  const editorContent = ref('')
  const editorDirty = ref(false)
  const preview = ref<PreviewResponse | null>(null)
  const testResult = ref<TestResult | null>(null)

  // Getters
  const filteredPrompts = computed(() => {
    let filtered = [...(prompts.value || [])]
    
    if (filters.value.domain) {
      filtered = filtered.filter(p => p.metadata.domain === filters.value.domain)
    }
    
    if (filters.value.source) {
      filtered = filtered.filter(p => p.source === filters.value.source)
    }
    
    if (filters.value.active !== null) {
      filtered = filtered.filter(p => p.active === filters.value.active)
    }
    
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.key.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.value.tags.length > 0) {
      filtered = filtered.filter(p => 
        filters.value.tags.some(tag => p.metadata.tags.includes(tag))
      )
    }
    
    return filtered
  })
  
  const paginatedPrompts = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return filteredPrompts.value.slice(start, end)
  })
  
  const domains = computed(() => {
    const domainSet = new Set<string>()
    ;(prompts.value || []).forEach(p => domainSet.add(p.metadata?.domain))
    return Array.from(domainSet).filter(Boolean).sort()
  })

  const availableTags = computed(() => {
    const tagSet = new Set<string>()
    ;(prompts.value || []).forEach(p => (p.metadata?.tags || []).forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  })
  
  const isPromptLocked = computed(() => (key: string) => {
    const lock = lockedPrompts.value.get(key)
    return lock?.locked && lock.locked_by
  })
  
  const lockingUser = computed(() => (key: string) => {
    return lockedPrompts.value.get(key)?.locked_by
  })

  // Actions
  async function fetchPrompts(params: YamlListParams = {}) {
    loading.value = true
    error.value = null
    
    try {
      const queryParams = {
        domain: filters.value.domain || undefined,
        source: filters.value.source || undefined,
        active: filters.value.active || undefined,
        search: filters.value.search || undefined,
        tags: filters.value.tags,
        ...params,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
      }
      
      const response: PaginatedYamlResponse = await yamlApi.list(queryParams)

      prompts.value = response?.items || []
      pagination.value.total = response?.total || 0
      pagination.value.page = response?.page || 1
    } catch (err: any) {
      error.value = err.message || 'Error fetching prompts'
      console.error('Error fetching prompts:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchPromptByKey(key: string) {
    loading.value = true
    error.value = null
    
    try {
      currentPrompt.value = await yamlApi.getByKey(key)
      editorContent.value = currentPrompt.value.template
      editorDirty.value = false
      
      // Check lock status
      await fetchLockStatus(key)
    } catch (err: any) {
      error.value = err.message || 'Error fetching prompt'
      console.error('Error fetching prompt:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function createPrompt(promptData: any) {
    loading.value = true
    error.value = null
    
    try {
      const newPrompt = await yamlApi.create(promptData)
      prompts.value.unshift(newPrompt)
      pagination.value.total++
      
      return newPrompt
    } catch (err: any) {
      error.value = err.message || 'Error creating prompt'
      console.error('Error creating prompt:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function updatePrompt(key: string, updateData: any) {
    loading.value = true
    error.value = null
    
    try {
      const updatedPrompt = await yamlApi.update(key, updateData)
      
      // Update in prompts array
      const index = prompts.value.findIndex(p => p.key === key)
      if (index !== -1) {
        prompts.value[index] = updatedPrompt
      }
      
      // Update current prompt if it's the same
      if (currentPrompt.value?.key === key) {
        currentPrompt.value = updatedPrompt
      }
      
      editorDirty.value = false
      
      return updatedPrompt
    } catch (err: any) {
      error.value = err.message || 'Error updating prompt'
      console.error('Error updating prompt:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function deletePrompt(key: string) {
    loading.value = true
    error.value = null
    
    try {
      await yamlApi.delete(key)
      
      // Remove from prompts array
      const index = prompts.value.findIndex(p => p.key === key)
      if (index !== -1) {
        prompts.value.splice(index, 1)
      }
      
      pagination.value.total--
      
      // Clear current prompt if it's the same
      if (currentPrompt.value?.key === key) {
        currentPrompt.value = null
      }
    } catch (err: any) {
      error.value = err.message || 'Error deleting prompt'
      console.error('Error deleting prompt:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function togglePromptActive(key: string, active: boolean) {
    try {
      const updatedPrompt = await yamlApi.toggleActive(key, active)
      
      // Update in prompts array
      const index = prompts.value.findIndex(p => p.key === key)
      if (index !== -1) {
        prompts.value[index] = updatedPrompt
      }
      
      // Update current prompt if it's the same
      if (currentPrompt.value?.key === key) {
        currentPrompt.value = updatedPrompt
      }
    } catch (err: any) {
      error.value = err.message || 'Error toggling prompt'
      console.error('Error toggling prompt:', err)
      throw err
    }
  }
  
  // Version Management
  async function fetchVersions(key: string) {
    loading.value = true
    error.value = null
    
    try {
      versions.value = await yamlApi.getVersionHistory(key)
    } catch (err: any) {
      error.value = err.message || 'Error fetching versions'
      console.error('Error fetching versions:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function rollbackPrompt(key: string, versionId: string) {
    loading.value = true
    error.value = null
    
    try {
      const rolledBackPrompt = await yamlApi.rollback(key, versionId)
      
      // Update in prompts array
      const index = prompts.value.findIndex(p => p.key === key)
      if (index !== -1) {
        prompts.value[index] = rolledBackPrompt
      }
      
      // Update current prompt if it's the same
      if (currentPrompt.value?.key === key) {
        currentPrompt.value = rolledBackPrompt
        editorContent.value = rolledBackPrompt.template
      }
      
      // Refresh versions
      await fetchVersions(key)
      
      return rolledBackPrompt
    } catch (err: any) {
      error.value = err.message || 'Error rolling back prompt'
      console.error('Error rolling back prompt:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function createVersion(key: string, description?: string) {
    try {
      const newVersion = await yamlApi.createVersion(key, description)
      
      // Refresh versions
      await fetchVersions(key)
      
      return newVersion
    } catch (err: any) {
      error.value = err.message || 'Error creating version'
      console.error('Error creating version:', err)
      throw err
    }
  }
  
  // Lock Management
  async function lockPrompt(key: string) {
    try {
      const lockResponse = await yamlApi.lock(key)
      lockedPrompts.value.set(key, lockResponse)
      
      // Start lock refresh interval
      startLockRefresh(key)
      
      return lockResponse
    } catch (err: any) {
      error.value = err.message || 'Error locking prompt'
      console.error('Error locking prompt:', err)
      throw err
    }
  }
  
  async function unlockPrompt(key: string) {
    try {
      await yamlApi.unlock(key)
      lockedPrompts.value.delete(key)
      
      // Stop lock refresh interval
      stopLockRefresh(key)
    } catch (err: any) {
      error.value = err.message || 'Error unlocking prompt'
      console.error('Error unlocking prompt:', err)
      throw err
    }
  }
  
  async function fetchLockStatus(key: string) {
    try {
      const lockResponse = await yamlApi.getLockStatus(key)
      lockedPrompts.value.set(key, lockResponse)
      return lockResponse
    } catch (err: any) {
      console.error('Error fetching lock status:', err)
      return null
    }
  }
  
  function startLockRefresh(key: string) {
    stopLockRefresh(key) // Clear any existing interval
    
    lockRefreshInterval.value = setInterval(async () => {
      await fetchLockStatus(key)
    }, 30000) // Refresh every 30 seconds
  }
  
  function stopLockRefresh(key?: string) {
    if (lockRefreshInterval.value) {
      clearInterval(lockRefreshInterval.value)
      lockRefreshInterval.value = null
    }
  }
  
  // Validation and Testing
  async function validateTemplate(template: string) {
    try {
      validation.value = await yamlApi.validateTemplate(template)
      return validation.value
    } catch (err: any) {
      error.value = err.message || 'Error validating template'
      console.error('Error validating template:', err)
      throw err
    }
  }
  
  async function previewTemplate(request: PreviewRequest) {
    try {
      preview.value = await yamlApi.previewTemplate(request)
      return preview.value
    } catch (err: any) {
      error.value = err.message || 'Error previewing template'
      console.error('Error previewing template:', err)
      throw err
    }
  }
  
  async function testPrompt(key: string, testData: any) {
    loading.value = true
    error.value = null
    
    try {
      testResult.value = await yamlApi.testPrompt(key, testData)
      return testResult.value
    } catch (err: any) {
      error.value = err.message || 'Error testing prompt'
      console.error('Error testing prompt:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Analytics
  async function fetchAnalytics() {
    try {
      analytics.value = await yamlApi.getAnalytics()
      return analytics.value
    } catch (err: any) {
      error.value = err.message || 'Error fetching analytics'
      console.error('Error fetching analytics:', err)
    }
  }
  
  // Utility Actions
  function setFilters(newFilters: Partial<YamlFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // Reset to first page when filters change
  }
  
  function setPagination(newPagination: Partial<PaginationState>) {
    pagination.value = { ...pagination.value, ...newPagination }
  }
  
  function clearError() {
    error.value = null
  }
  
  function setCurrentPrompt(prompt: YamlPrompt | null) {
    currentPrompt.value = prompt
    if (prompt) {
      editorContent.value = prompt.template
      editorDirty.value = false
    }
  }
  
  function setEditorContent(content: string) {
    editorContent.value = content
    editorDirty.value = true
  }
  
  function clearCurrentPrompt() {
    currentPrompt.value = null
    editorContent.value = ''
    editorDirty.value = false
    validation.value = null
    preview.value = null
    testResult.value = null
    stopLockRefresh()
  }

    return {
      // State
      prompts,
      currentPrompt,
      versions,
      loading,
      error,
      validation,
      filters,
      pagination,
      lockedPrompts,
      analytics,
      editorContent,
      editorDirty,
      preview,
      testResult,
      
      // Getters
      filteredPrompts,
      paginatedPrompts,
      domains,
      availableTags,
      isPromptLocked,
      lockingUser,
      
      // Actions
      fetchPrompts,
      fetchPromptByKey,
      createPrompt,
      updatePrompt,
      deletePrompt,
      togglePromptActive,
      fetchVersions,
      rollbackPrompt,
      createVersion,
      lockPrompt,
      unlockPrompt,
      fetchLockStatus,
      validateTemplate,
      previewTemplate,
      testPrompt,
      fetchAnalytics,
      setFilters,
      setPagination,
      clearError,
      setCurrentPrompt,
      setEditorContent,
      clearCurrentPrompt
    }
})