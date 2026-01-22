import { computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useYamlSharedStore } from './yaml/shared.store'
import { useYamlPromptsStore } from './yaml/prompts.store'
import { useYamlTasksStore } from './yaml/tasks.store'
import { useYamlFormattersStore } from './yaml/formatters.store'

export const useYamlStore = defineStore('yaml', () => {
  // Initialize sub-stores
  const sharedStore = useYamlSharedStore()
  const promptsStore = useYamlPromptsStore()
  const tasksStore = useYamlTasksStore()
  const formattersStore = useYamlFormattersStore()

  // Destructure state and getters to maintain reactivity when re-exporting
  const {
    templateType,
    loading,
    error,
    validation,
    filters,
    pagination,
    editorContent,
    editorDirty,
    preview,
    testResult
  } = storeToRefs(sharedStore)

  const {
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
    lockingUser
  } = storeToRefs(promptsStore)

  const {
    tasks,
    currentTask,
    taskAnalytics,
    taskTestResult,
    filteredTasks,
    paginatedTasks,
    taskDomains
  } = storeToRefs(tasksStore)

  const {
    formatters,
    currentFormatter,
    formatterAnalytics,
    formatterTestResult,
    filteredFormatters,
    paginatedFormatters,
    formatterDomains
  } = storeToRefs(formattersStore)

  // Unified Getters
  const currentTemplate = computed(() => {
    if (templateType.value === 'prompt') return currentPrompt.value
    if (templateType.value === 'task') return currentTask.value
    return currentFormatter.value
  })

  const currentItems = computed(() => {
    if (templateType.value === 'prompt') return filteredPrompts.value
    if (templateType.value === 'task') return filteredTasks.value
    return filteredFormatters.value
  })

  const paginatedItems = computed(() => {
    if (templateType.value === 'prompt') return paginatedPrompts.value
    if (templateType.value === 'task') return paginatedTasks.value
    return paginatedFormatters.value
  })

  // Unified Actions
  function clearCurrentTemplate() {
    if (templateType.value === 'prompt') {
      promptsStore.clearCurrentPrompt()
    } else if (templateType.value === 'task') {
      tasksStore.clearCurrentTask()
    } else {
      formattersStore.clearCurrentFormatter()
    }
  }

  return {
    // Template Type State
    templateType,

    // Prompts State
    prompts,
    currentPrompt,
    versions,

    // Tasks State
    tasks,
    currentTask,
    taskAnalytics,
    taskTestResult,

    // Formatters State
    formatters,
    currentFormatter,
    formatterAnalytics,
    formatterTestResult,

    // Shared State
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

    // Prompts Getters
    filteredPrompts,
    paginatedPrompts,
    domains,
    availableTags,
    isPromptLocked,
    lockingUser,

    // Tasks Getters
    filteredTasks,
    paginatedTasks,
    taskDomains,

    // Formatters Getters
    filteredFormatters,
    paginatedFormatters,
    formatterDomains,

    // Unified Getters
    currentTemplate,
    currentItems,
    paginatedItems,

    // Prompts Actions
    fetchPrompts: promptsStore.fetchPrompts,
    fetchPromptByKey: promptsStore.fetchPromptByKey,
    createPrompt: promptsStore.createPrompt,
    updatePrompt: promptsStore.updatePrompt,
    deletePrompt: promptsStore.deletePrompt,
    togglePromptActive: promptsStore.togglePromptActive,
    fetchVersions: promptsStore.fetchVersions,
    rollbackPrompt: promptsStore.rollbackPrompt,
    createVersion: promptsStore.createVersion,
    lockPrompt: promptsStore.lockPrompt,
    unlockPrompt: promptsStore.unlockPrompt,
    fetchLockStatus: promptsStore.fetchLockStatus,
    validateTemplate: promptsStore.validateTemplate,
    previewTemplate: promptsStore.previewTemplate,
    testPrompt: promptsStore.testPrompt,
    fetchAnalytics: promptsStore.fetchAnalytics,

    // Tasks Actions
    fetchTasks: tasksStore.fetchTasks,
    fetchTaskByKey: tasksStore.fetchTaskByKey,
    createTask: tasksStore.createTask,
    updateTask: tasksStore.updateTask,
    deleteTask: tasksStore.deleteTask,
    testTask: tasksStore.testTask,
    fetchTaskAnalytics: tasksStore.fetchTaskAnalytics,

    // Formatters Actions
    fetchFormatters: formattersStore.fetchFormatters,
    fetchFormatterByKey: formattersStore.fetchFormatterByKey,
    createFormatter: formattersStore.createFormatter,
    updateFormatter: formattersStore.updateFormatter,
    deleteFormatter: formattersStore.deleteFormatter,
    testFormatter: formattersStore.testFormatter,
    fetchFormatterAnalytics: formattersStore.fetchFormatterAnalytics,
    setCurrentFormatter: formattersStore.setCurrentFormatter,
    clearCurrentFormatter: formattersStore.clearCurrentFormatter,

    // Utility Actions
    setTemplateType: sharedStore.setTemplateType,
    setFilters: sharedStore.setFilters,
    setPagination: sharedStore.setPagination,
    clearError: sharedStore.clearError,
    setCurrentPrompt: promptsStore.setCurrentPrompt,
    setCurrentTask: tasksStore.setCurrentTask,
    setEditorContent: sharedStore.setEditorContent,
    clearCurrentPrompt: promptsStore.clearCurrentPrompt,
    clearCurrentTask: tasksStore.clearCurrentTask,
    clearCurrentTemplate
  }
})
