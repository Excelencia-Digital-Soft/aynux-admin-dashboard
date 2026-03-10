<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { TriggerSchedule, TriggerScheduleCreate, ScheduleType } from '@/types/workflow-messaging.types'

const props = defineProps<{
  visible: boolean
  trigger: TriggerSchedule | null
  triggerTypes: ScheduleType[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: TriggerScheduleCreate): void
}>()

const form = ref<TriggerScheduleCreate>({
  schedule_key: '',
  display_name: '',
  trigger_type: 'days_before',
  trigger_value: 1,
  execution_hour: 9,
  timezone: 'America/Argentina/San_Juan',
  is_active: true
})

const isEditing = computed(() => props.trigger !== null)

watch(
  () => props.trigger,
  (t) => {
    if (t) {
      form.value = {
        schedule_key: t.schedule_key,
        display_name: t.display_name,
        description: t.description || undefined,
        trigger_type: t.trigger_type,
        trigger_value: t.trigger_value,
        execution_hour: t.execution_hour,
        timezone: t.timezone,
        message_template_id: t.message_template_id || undefined,
        fallback_message: t.fallback_message || undefined,
        is_active: t.is_active
      }
    } else {
      form.value = {
        schedule_key: '',
        display_name: '',
        trigger_type: 'days_before',
        trigger_value: 1,
        execution_hour: 9,
        timezone: 'America/Argentina/San_Juan',
        is_active: true
      }
    }
  },
  { immediate: true }
)

const canSave = computed(() => form.value.schedule_key && form.value.display_name)

function handleSave() {
  if (!canSave.value) return
  emit('save', { ...form.value })
}
</script>

<template>
  <Dialog :open="visible" @update:open="(v) => emit('update:visible', v)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Editar Trigger' : 'Nuevo Trigger' }}</DialogTitle>
        <DialogDescription>
          Configura cuando y como se ejecutara este trigger.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Clave</Label>
            <Input v-model="form.schedule_key" placeholder="reminder_24h" :disabled="isEditing" />
          </div>
          <div class="space-y-2">
            <Label>Nombre</Label>
            <Input v-model="form.display_name" placeholder="Recordatorio 24h" />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Descripcion</Label>
          <Textarea
            :model-value="form.description || ''"
            @update:model-value="(v) => form.description = v || undefined"
            :rows="2"
            class="resize-none"
            placeholder="Descripcion opcional..."
          />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>Tipo</Label>
            <Select v-model="form.trigger_type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days_before">Dias antes</SelectItem>
                <SelectItem value="hours_before">Horas antes</SelectItem>
                <SelectItem value="minutes_before">Minutos antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Valor</Label>
            <Input
              type="number"
              :model-value="form.trigger_value"
              @update:model-value="(v) => form.trigger_value = Number(v)"
              :min="1"
            />
          </div>
          <div class="space-y-2">
            <Label>Hora ejecucion</Label>
            <Input
              type="number"
              :model-value="form.execution_hour"
              @update:model-value="(v) => form.execution_hour = Number(v)"
              :min="0"
              :max="23"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Timezone</Label>
          <Input v-model="form.timezone" />
        </div>

        <div class="space-y-2">
          <Label>Mensaje fallback</Label>
          <Textarea
            :model-value="form.fallback_message || ''"
            @update:model-value="(v) => form.fallback_message = v || undefined"
            :rows="2"
            class="resize-none"
            placeholder="Mensaje si no hay template..."
          />
        </div>

        <div class="flex items-center gap-2">
          <Switch
            :checked="form.is_active ?? true"
            @update:checked="(v) => form.is_active = v"
          />
          <Label>Activo</Label>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="emit('update:visible', false)">Cancelar</Button>
        <Button :disabled="!canSave || isSaving" @click="handleSave">
          <i :class="['pi mr-2', isSaving ? 'pi-spin pi-spinner' : 'pi-save']" />
          {{ isEditing ? 'Guardar' : 'Crear' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
