import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { 
  TemplateType, 
  YamlFilters, 
  PaginationState,
  PreviewResponse,
  TestResult,
  ValidationResult
} from '@/types/yaml.types'

export const useYamlSharedStore = defineStore('yaml-shared', () => {
  // Template Type State (discriminator for prompts vs tasks)
  const templateType = ref<TemplateType>('prompt')
  
  // Shared UI State
  const loading = ref(false)
  const error = ref<string | null>(null)
  
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
  
  // Editor State
  const editorContent = ref('')
  const editorDirty = ref(false)
  const validation = ref<ValidationResult | null>(null)
  const preview = ref<PreviewResponse | null>(null)
  const testResult = ref<TestResult | null>(null)

  // Actions
  function setTemplateType(type: TemplateType) {
    templateType.value = type
    // Reset pagination when switching types
    pagination.value.page = 1
  }

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
  
  function setEditorContent(content: string) {
    editorContent.value = content
    editorDirty.value = true
  }

  function resetEditorState() {
    editorContent.value = ''
    editorDirty.value = false
    validation.value = null
    preview.value = null
    testResult.value = null
  }

  return {
    templateType,
    loading,
    error,
    filters,
    pagination,
    editorContent,
    editorDirty,
    validation,
    preview,
    testResult,
    
    setTemplateType,
    setFilters,
    setPagination,
    clearError,
    setEditorContent,
    resetEditorState
  }
})
