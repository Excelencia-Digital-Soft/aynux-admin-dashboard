<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkflowTriggers } from '@/composables/useWorkflowTriggers'
import { useToast } from '@/composables/useToast'
import TriggerFormDialog from './TriggerFormDialog.vue'
import type { TriggerSchedule, TriggerScheduleCreate } from '@/types/workflow-messaging.types'

const props = defineProps<{
  visible: boolean
  workflowId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const toast = useToast()
const triggers = useWorkflowTriggers()
const showForm = ref(false)
const editingTrigger = ref<TriggerSchedule | null>(null)
const nextRuns = ref<Record<string, string[]>>({})

onMounted(async () => {
  await Promise.all([
    triggers.loadTriggers(props.workflowId),
    triggers.loadTriggerTypes()
  ])
})

function openCreateForm() {
  editingTrigger.value = null
  showForm.value = true
}

function openEditForm(trigger: TriggerSchedule) {
  editingTrigger.value = trigger
  showForm.value = true
}

async function handleSave(data: TriggerScheduleCreate) {
  if (editingTrigger.value) {
    const success = await triggers.updateTrigger(editingTrigger.value.id, data)
    if (success) {
      toast.success('Trigger actualizado')
      showForm.value = false
    }
  } else {
    const result = await triggers.createTrigger(props.workflowId, data)
    if (result) {
      toast.success('Trigger creado')
      showForm.value = false
    }
  }
}

async function handleDelete(id: string) {
  if (!window.confirm('Eliminar este trigger?')) return
  const success = await triggers.deleteTrigger(id)
  if (success) toast.success('Trigger eliminado')
}

async function handleTest(id: string) {
  const result = await triggers.testTrigger(id)
  if (result) {
    toast.success(result.summary)
  } else {
    toast.error('Error al ejecutar trigger')
  }
}

async function loadNextRuns(id: string) {
  const result = await triggers.getNextRuns(id, 5)
  if (result) {
    nextRuns.value[id] = result.next_runs
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es')
}
</script>

<template>
  <Sheet :open="visible" @update:open="(v) => emit('update:visible', v)">
    <SheetContent class="w-[520px] sm:max-w-[520px] overflow-y-auto triggers-sheet">
      <SheetHeader>
        <SheetTitle>Triggers</SheetTitle>
        <SheetDescription>Gestiona los triggers de ejecucion programada.</SheetDescription>
      </SheetHeader>

      <div class="triggers-content">
        <!-- Actions -->
        <div class="triggers-actions">
          <Button size="sm" @click="openCreateForm">
            <i class="pi pi-plus mr-2" />
            Nuevo Trigger
          </Button>
          <Button variant="outline" size="sm" @click="triggers.loadTriggers(workflowId)">
            <i class="pi pi-refresh mr-2" />
            Actualizar
          </Button>
        </div>

        <!-- Loading -->
        <div v-if="triggers.isLoading.value" class="triggers-loading">
          <i class="pi pi-spin pi-spinner text-xl" />
        </div>

        <!-- Empty -->
        <div v-else-if="triggers.triggers.value.length === 0" class="triggers-empty">
          <i class="pi pi-clock text-3xl opacity-30" />
          <span>No hay triggers configurados</span>
        </div>

        <!-- Trigger List -->
        <div v-else class="triggers-list">
          <div
            v-for="trigger in triggers.triggers.value"
            :key="trigger.id"
            class="trigger-card"
          >
            <div class="trigger-header">
              <div class="trigger-info">
                <span class="trigger-name">{{ trigger.display_name }}</span>
                <span class="trigger-key">{{ trigger.schedule_key }}</span>
              </div>
              <Badge :variant="trigger.is_active ? 'default' : 'secondary'">
                {{ trigger.is_active ? 'Activo' : 'Inactivo' }}
              </Badge>
            </div>

            <div class="trigger-details">
              <span>{{ trigger.trigger_value }} {{ trigger.trigger_type.replace('_', ' ') }}</span>
              <span>a las {{ trigger.execution_hour }}:00</span>
              <span>{{ trigger.timezone }}</span>
            </div>

            <div v-if="trigger.last_run_at" class="trigger-last-run">
              <span class="text-xs text-muted-foreground">
                Ultima ejecucion: {{ formatDate(trigger.last_run_at) }}
                <Badge v-if="trigger.last_run_status" variant="outline" class="ml-1 text-xs">
                  {{ trigger.last_run_status }}
                </Badge>
              </span>
            </div>

            <!-- Next Runs -->
            <div v-if="nextRuns[trigger.id]" class="trigger-next-runs">
              <span class="text-xs text-muted-foreground">Proximas ejecuciones:</span>
              <ul>
                <li v-for="run in nextRuns[trigger.id]" :key="run" class="text-xs">
                  {{ formatDate(run) }}
                </li>
              </ul>
            </div>

            <div class="trigger-actions">
              <Button variant="ghost" size="sm" @click="openEditForm(trigger)">
                <i class="pi pi-pencil mr-1" /> Editar
              </Button>
              <Button variant="ghost" size="sm" @click="handleTest(trigger.id)">
                <i class="pi pi-play mr-1" /> Test
              </Button>
              <Button variant="ghost" size="sm" @click="loadNextRuns(trigger.id)">
                <i class="pi pi-calendar mr-1" /> Proximas
              </Button>
              <Button variant="ghost" size="sm" class="text-destructive" @click="handleDelete(trigger.id)">
                <i class="pi pi-trash" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Create/Edit Dialog -->
  <TriggerFormDialog
    v-model:visible="showForm"
    :trigger="editingTrigger"
    :trigger-types="triggers.triggerTypes.value"
    :is-saving="triggers.isSaving.value"
    @save="handleSave"
  />
</template>

<style scoped>
.triggers-sheet {
  background: hsl(var(--background)) !important;
}

.triggers-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.triggers-actions {
  display: flex;
  gap: 8px;
}

.triggers-loading {
  display: flex;
  justify-content: center;
  padding: 32px;
  color: hsl(var(--muted-foreground));
}

.triggers-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: hsl(var(--muted-foreground));
  font-size: 0.85rem;
}

.triggers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trigger-card {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trigger-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.trigger-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trigger-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.trigger-key {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
  font-family: monospace;
}

.trigger-details {
  display: flex;
  gap: 8px;
  font-size: 0.78rem;
  color: hsl(var(--muted-foreground));
}

.trigger-details span::after {
  content: ' · ';
}

.trigger-details span:last-child::after {
  content: '';
}

.trigger-last-run {
  padding-top: 4px;
}

.trigger-next-runs {
  padding: 6px 8px;
  background: hsl(var(--muted) / 0.2);
  border-radius: 4px;
}

.trigger-next-runs ul {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
}

.trigger-actions {
  display: flex;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid hsl(var(--border));
}
</style>
