import { ref } from 'vue'
import { workflowApi } from '@/api/workflow.api'
import type {
  ScheduleType,
  TriggerSchedule,
  TriggerScheduleCreate,
  TriggerScheduleUpdate
} from '@/types/workflow-messaging.types'

export function useWorkflowTriggers() {
  const triggers = ref<TriggerSchedule[]>([])
  const triggerTypes = ref<ScheduleType[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  async function loadTriggerTypes() {
    try {
      triggerTypes.value = await workflowApi.listTriggerTypes()
    } catch (error) {
      console.error('Failed to load trigger types:', error)
    }
  }

  async function loadTriggers(workflowId: string) {
    isLoading.value = true
    try {
      triggers.value = await workflowApi.listTriggers(workflowId)
    } catch (error) {
      console.error('Failed to load triggers:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createTrigger(workflowId: string, data: TriggerScheduleCreate): Promise<TriggerSchedule | null> {
    isSaving.value = true
    try {
      const trigger = await workflowApi.createTrigger(workflowId, data)
      triggers.value.push(trigger)
      return trigger
    } catch (error) {
      console.error('Failed to create trigger:', error)
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateTrigger(scheduleId: string, data: TriggerScheduleUpdate): Promise<boolean> {
    isSaving.value = true
    try {
      const updated = await workflowApi.updateTrigger(scheduleId, data)
      const idx = triggers.value.findIndex(t => t.id === scheduleId)
      if (idx >= 0) triggers.value[idx] = updated
      return true
    } catch (error) {
      console.error('Failed to update trigger:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deleteTrigger(scheduleId: string): Promise<boolean> {
    try {
      await workflowApi.deleteTrigger(scheduleId)
      triggers.value = triggers.value.filter(t => t.id !== scheduleId)
      return true
    } catch (error) {
      console.error('Failed to delete trigger:', error)
      return false
    }
  }

  async function testTrigger(scheduleId: string) {
    try {
      return await workflowApi.testTrigger(scheduleId)
    } catch (error) {
      console.error('Failed to test trigger:', error)
      return null
    }
  }

  async function getNextRuns(scheduleId: string, count?: number) {
    try {
      return await workflowApi.getTriggerNextRuns(scheduleId, count)
    } catch (error) {
      console.error('Failed to get next runs:', error)
      return null
    }
  }

  return {
    triggers,
    triggerTypes,
    isLoading,
    isSaving,
    loadTriggerTypes,
    loadTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    testTrigger,
    getNextRuns
  }
}
