import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useYamlSharedStore } from './shared.store'
import yamlApi from '@/api/yaml.api'
import type {
  YamlPrompt,
  YamlListParams,
  PaginatedYamlResponse,
  PromptVersion,
  LockResponse,
  YamlAnalytics,
  PreviewRequest
} from '@/types/yaml.types'

export const useYamlPromptsStore = defineStore('yaml-prompts', () => {
  const shared = useYamlSharedStore()

  // Prompts State
  const prompts = ref<YamlPrompt[]>([])
  const currentPrompt = ref<YamlPrompt | null>(null)
  const versions = ref<PromptVersion[]>([])
  
  // Lock State
  const lockedPrompts = ref<Map<string, LockResponse>>(new Map())
  const lockRefreshInterval = ref<number | null>(null)
  
  // Analytics
  const analytics = ref<YamlAnalytics | null>(null)

  // Getters
  const filteredPrompts = computed(() => {
    let filtered = [...(prompts.value || [])]
    const { filters } = shared
    
    if (filters.domain) {
      filtered = filtered.filter(p => p.metadata.domain === filters.domain)
    }
    
    if (filters.source) {
      filtered = filtered.filter(p => p.source === filters.source)
    }
    
    if (filters.active !== null) {
      filtered = filtered.filter(p => p.active === filters.active)
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.key.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        filters.tags.some(tag => p.metadata.tags.includes(tag))
      )
    }
    
    return filtered
  })
  
  const paginatedPrompts = computed(() => {
    const start = (shared.pagination.page - 1) * shared.pagination.pageSize
    const end = start + shared.pagination.pageSize
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
    shared.loading = true
    shared.error = null
    
    try {
      const queryParams = {
        domain: shared.filters.domain || undefined,
        source: shared.filters.source || undefined,
        active: shared.filters.active || undefined,
        search: shared.filters.search || undefined,
        tags: shared.filters.tags,
        ...params,
        page: shared.pagination.page,
        pageSize: shared.pagination.pageSize
      }
      
      const response: PaginatedYamlResponse = await yamlApi.list(queryParams)

      prompts.value = response?.items || []
      shared.pagination.total = response?.total || 0
      shared.pagination.page = response?.page || 1
    } catch (err: any) {
      shared.error = err.message || 'Error fetching prompts'
      console.error('Error fetching prompts:', err)
    } finally {
      shared.loading = false
    }
  }
  
  async function fetchPromptByKey(key: string) {
    shared.loading = true
    shared.error = null
    
    try {
      currentPrompt.value = await yamlApi.getByKey(key)
      shared.editorContent = currentPrompt.value.template
      shared.editorDirty = false
      
      // Check lock status
      await fetchLockStatus(key)
    } catch (err: any) {
      shared.error = err.message || 'Error fetching prompt'
      console.error('Error fetching prompt:', err)
    } finally {
      shared.loading = false
    }
  }
  
  async function createPrompt(promptData: any) {
    shared.loading = true
    shared.error = null
    
    try {
      const newPrompt = await yamlApi.create(promptData)
      prompts.value.unshift(newPrompt)
      shared.pagination.total++
      
      return newPrompt
    } catch (err: any) {
      shared.error = err.message || 'Error creating prompt'
      console.error('Error creating prompt:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }
  
  async function updatePrompt(key: string, updateData: any) {
    shared.loading = true
    shared.error = null
    
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
      
      shared.editorDirty = false
      
      return updatedPrompt
    } catch (err: any) {
      shared.error = err.message || 'Error updating prompt'
      console.error('Error updating prompt:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }
  
  async function deletePrompt(key: string) {
    shared.loading = true
    shared.error = null
    
    try {
      await yamlApi.delete(key)
      
      // Remove from prompts array
      const index = prompts.value.findIndex(p => p.key === key)
      if (index !== -1) {
        prompts.value.splice(index, 1)
      }
      
      shared.pagination.total--
      
      // Clear current prompt if it's the same
      if (currentPrompt.value?.key === key) {
        currentPrompt.value = null
      }
    } catch (err: any) {
      shared.error = err.message || 'Error deleting prompt'
      console.error('Error deleting prompt:', err)
      throw err
    } finally {
      shared.loading = false
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
      shared.error = err.message || 'Error toggling prompt'
      console.error('Error toggling prompt:', err)
      throw err
    }
  }
  
  // Version Management
  async function fetchVersions(key: string) {
    shared.loading = true
    shared.error = null
    
    try {
      versions.value = await yamlApi.getVersionHistory(key)
    } catch (err: any) {
      shared.error = err.message || 'Error fetching versions'
      console.error('Error fetching versions:', err)
    } finally {
      shared.loading = false
    }
  }
  
  async function rollbackPrompt(key: string, versionId: string) {
    shared.loading = true
    shared.error = null
    
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
        shared.editorContent = rolledBackPrompt.template
      }
      
      // Refresh versions
      await fetchVersions(key)
      
      return rolledBackPrompt
    } catch (err: any) {
      shared.error = err.message || 'Error rolling back prompt'
      console.error('Error rolling back prompt:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }
  
  async function createVersion(key: string, description?: string) {
    try {
      const newVersion = await yamlApi.createVersion(key, description)
      
      // Refresh versions
      await fetchVersions(key)
      
      return newVersion
    } catch (err: any) {
      shared.error = err.message || 'Error creating version'
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
      shared.error = err.message || 'Error locking prompt'
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
      shared.error = err.message || 'Error unlocking prompt'
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
      shared.validation = await yamlApi.validateTemplate(template)
      return shared.validation
    } catch (err: any) {
      shared.error = err.message || 'Error validating template'
      console.error('Error validating template:', err)
      throw err
    }
  }
  
  async function previewTemplate(request: PreviewRequest) {
    try {
      shared.preview = await yamlApi.previewTemplate(request)
      return shared.preview
    } catch (err: any) {
      shared.error = err.message || 'Error previewing template'
      console.error('Error previewing template:', err)
      throw err
    }
  }
  
  async function testPrompt(key: string, testData: any) {
    shared.loading = true
    shared.error = null
    
    try {
      const result = await yamlApi.testPrompt(key, testData)
      shared.testResult = result
      return result
    } catch (err: any) {
      shared.error = err.message || 'Error testing prompt'
      console.error('Error testing prompt:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }
  
  // Analytics
  async function fetchAnalytics() {
    try {
      analytics.value = await yamlApi.getAnalytics()
      return analytics.value
    } catch (err: any) {
      shared.error = err.message || 'Error fetching analytics'
      console.error('Error fetching analytics:', err)
    }
  }

  function setCurrentPrompt(prompt: YamlPrompt | null) {
    currentPrompt.value = prompt
    if (prompt) {
      shared.editorContent = prompt.template
      shared.editorDirty = false
    }
  }
  
  function clearCurrentPrompt() {
    currentPrompt.value = null
    shared.resetEditorState()
    stopLockRefresh()
  }

  return {
    prompts,
    currentPrompt,
    versions,
    lockedPrompts,
    analytics,
    
    filteredPrompts,
    paginatedPrompts,
    domains,
    availableTags,
    isPromptLocked,
    lockingUser,
    
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
    setCurrentPrompt,
    clearCurrentPrompt
  }
})
