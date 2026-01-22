import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useYamlSharedStore } from './shared.store'
import tasksApi from '@/api/tasks.api'
import type {
  YamlTask,
  TaskListParams,
  PaginatedTaskResponse,
  TaskAnalytics,
  TaskTestResult,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskTestRequest
} from '@/types/yaml.types'

export const useYamlTasksStore = defineStore('yaml-tasks', () => {
  const shared = useYamlSharedStore()

  // Tasks State
  const tasks = ref<YamlTask[]>([])
  const currentTask = ref<YamlTask | null>(null)
  const taskAnalytics = ref<TaskAnalytics | null>(null)
  const taskTestResult = ref<TaskTestResult | null>(null)

  // Getters
  const filteredTasks = computed(() => {
    let filtered = [...(tasks.value || [])]
    const { filters } = shared

    if (filters.domain) {
      // Extract domain from task key (e.g., 'pharmacy.greeting.default' → 'pharmacy')
      filtered = filtered.filter(t => t.key.split('.')[0] === filters.domain)
    }

    if (filters.source) {
      filtered = filtered.filter(t => t.source === filters.source)
    }

    if (filters.active !== null) {
      filtered = filtered.filter(t => t.active === filters.active)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.key.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  })

  const paginatedTasks = computed(() => {
    const start = (shared.pagination.page - 1) * shared.pagination.pageSize
    const end = start + shared.pagination.pageSize
    return filteredTasks.value.slice(start, end)
  })

  const taskDomains = computed(() => {
    const domainSet = new Set<string>()
    ;(tasks.value || []).forEach(t => {
      const domain = t.key.split('.')[0]
      if (domain) domainSet.add(domain)
    })
    return Array.from(domainSet).sort()
  })

  // Actions
  async function fetchTasks(params: TaskListParams = {}) {
    shared.loading = true
    shared.error = null

    try {
      const queryParams = {
        domain: shared.filters.domain || undefined,
        source: shared.filters.source || undefined,
        is_active: shared.filters.active || undefined,
        ...params,
        page: shared.pagination.page,
        pageSize: shared.pagination.pageSize
      }

      const response: PaginatedTaskResponse = await tasksApi.list(queryParams)

      tasks.value = response?.items || []
      shared.pagination.total = response?.total || 0
      shared.pagination.page = response?.page || 1
    } catch (err: any) {
      shared.error = err.message || 'Error fetching tasks'
      console.error('Error fetching tasks:', err)
    } finally {
      shared.loading = false
    }
  }

  async function fetchTaskByKey(key: string) {
    shared.loading = true
    shared.error = null

    try {
      currentTask.value = await tasksApi.getByKey(key)
      shared.editorContent = currentTask.value.template
      shared.editorDirty = false
    } catch (err: any) {
      shared.error = err.message || 'Error fetching task'
      console.error('Error fetching task:', err)
    } finally {
      shared.loading = false
    }
  }

  async function createTask(taskData: CreateTaskRequest) {
    shared.loading = true
    shared.error = null

    try {
      const newTask = await tasksApi.create(taskData)
      tasks.value.unshift(newTask)
      shared.pagination.total++

      return newTask
    } catch (err: any) {
      shared.error = err.message || 'Error creating task'
      console.error('Error creating task:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function updateTask(key: string, updateData: UpdateTaskRequest) {
    shared.loading = true
    shared.error = null

    try {
      const updatedTask = await tasksApi.update(key, updateData)

      // Update in tasks array
      const index = tasks.value.findIndex(t => t.key === key)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }

      // Update current task if it's the same
      if (currentTask.value?.key === key) {
        currentTask.value = updatedTask
      }

      shared.editorDirty = false

      return updatedTask
    } catch (err: any) {
      shared.error = err.message || 'Error updating task'
      console.error('Error updating task:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function deleteTask(key: string) {
    shared.loading = true
    shared.error = null

    try {
      await tasksApi.delete(key)

      // Remove from tasks array
      const index = tasks.value.findIndex(t => t.key === key)
      if (index !== -1) {
        tasks.value.splice(index, 1)
      }

      shared.pagination.total--

      // Clear current task if it's the same
      if (currentTask.value?.key === key) {
        currentTask.value = null
      }
    } catch (err: any) {
      shared.error = err.message || 'Error deleting task'
      console.error('Error deleting task:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function testTask(key: string, testData: TaskTestRequest) {
    shared.loading = true
    shared.error = null

    try {
      taskTestResult.value = await tasksApi.testTask(key, testData)
      return taskTestResult.value
    } catch (err: any) {
      shared.error = err.message || 'Error testing task'
      console.error('Error testing task:', err)
      throw err
    } finally {
      shared.loading = false
    }
  }

  async function fetchTaskAnalytics() {
    try {
      taskAnalytics.value = await tasksApi.getAnalytics()
      return taskAnalytics.value
    } catch (err: any) {
      shared.error = err.message || 'Error fetching task analytics'
      console.error('Error fetching task analytics:', err)
    }
  }

  function setCurrentTask(task: YamlTask | null) {
    currentTask.value = task
    if (task) {
      shared.editorContent = task.template
      shared.editorDirty = false
    }
  }

  function clearCurrentTask() {
    currentTask.value = null
    shared.resetEditorState()
    taskTestResult.value = null
  }

  return {
    tasks,
    currentTask,
    taskAnalytics,
    taskTestResult,
    
    filteredTasks,
    paginatedTasks,
    taskDomains,
    
    fetchTasks,
    fetchTaskByKey,
    createTask,
    updateTask,
    deleteTask,
    testTask,
    fetchTaskAnalytics,
    setCurrentTask,
    clearCurrentTask
  }
})
