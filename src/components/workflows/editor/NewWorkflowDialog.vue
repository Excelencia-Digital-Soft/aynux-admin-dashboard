<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import { workflowTypeOptions } from '@/composables/useWorkflowEditor'
import type { WorkflowCreate } from '@/types/workflow.types'

const props = defineProps<{
  visible: boolean
  loading: boolean
  workflow: WorkflowCreate
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Dialog
    :visible="visible"
    header="Nuevo Workflow"
    :modal="true"
    :style="{ width: '500px' }"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Clave del Workflow *</label>
        <InputText v-model="workflow.workflow_key" class="w-full" placeholder="ej: medical_appointments_v1" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar *</label>
        <InputText v-model="workflow.display_name" class="w-full" placeholder="ej: Turnos Médicos" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <Select
          v-model="workflow.workflow_type"
          :options="workflowTypeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <Textarea v-model="workflow.description" rows="3" class="w-full" />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="emit('cancel')" />
      <Button
        label="Crear"
        icon="pi pi-check"
        severity="success"
        :disabled="!workflow.workflow_key || !workflow.display_name"
        :loading="loading"
        @click="emit('save')"
      />
    </template>
  </Dialog>
</template>
