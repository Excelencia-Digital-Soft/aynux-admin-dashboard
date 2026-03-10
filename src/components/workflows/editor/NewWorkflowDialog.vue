<script setup lang="ts">
/**
 * NewWorkflowDialog - Dialog for creating a new workflow definition
 *
 * Collects institution, workflow key, display name, type, and description.
 * Institution dropdown is inside the dialog (required for DB FK).
 * Migrated from PrimeVue to shadcn-vue with glassmorphism.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { workflowTypeOptions } from '@/composables/useWorkflowEditor'
import type { WorkflowCreate } from '@/types/workflow-definition.types'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'

const props = defineProps<{
  visible: boolean
  loading: boolean
  workflow: WorkflowCreate
  institutions: TenantInstitutionConfig[]
  isLoadingInstitutions: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()

function handleClose() {
  emit('update:visible', false)
}

const canSave = computed(() =>
  props.workflow.institution_config_id &&
  props.workflow.workflow_key &&
  props.workflow.display_name &&
  !props.loading
)
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="sm:max-w-[500px] glass-dialog">
      <DialogHeader>
        <DialogTitle>Nuevo Workflow</DialogTitle>
        <DialogDescription class="sr-only">Crear una nueva definicion de workflow</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Institution -->
        <div class="grid gap-2">
          <Label for="workflow-institution" class="text-gray-700 dark:text-gray-300">
            Institucion *
          </Label>
          <Select
            :model-value="workflow.institution_config_id || undefined"
            :disabled="isLoadingInstitutions"
            @update:model-value="(v: string) => workflow.institution_config_id = v"
          >
            <SelectTrigger id="workflow-institution">
              <SelectValue
                :placeholder="isLoadingInstitutions ? 'Cargando...' : 'Selecciona institucion'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="inst in institutions"
                :key="inst.id"
                :value="inst.id"
              >
                {{ inst.institution_name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Workflow Key -->
        <div class="grid gap-2">
          <Label for="workflow-key" class="text-gray-700 dark:text-gray-300">
            Clave del Workflow *
          </Label>
          <Input
            id="workflow-key"
            v-model="workflow.workflow_key"
            placeholder="ej: mi_workflow_v1"
          />
        </div>

        <!-- Display Name -->
        <div class="grid gap-2">
          <Label for="workflow-name" class="text-gray-700 dark:text-gray-300">
            Nombre para mostrar *
          </Label>
          <Input
            id="workflow-name"
            v-model="workflow.display_name"
            placeholder="ej: Turnos Medicos"
          />
        </div>

        <!-- Workflow Type -->
        <div class="grid gap-2">
          <Label for="workflow-type" class="text-gray-700 dark:text-gray-300">
            Tipo
          </Label>
          <Select v-model="workflow.workflow_type">
            <SelectTrigger id="workflow-type">
              <SelectValue placeholder="Seleccione un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in workflowTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Description -->
        <div class="grid gap-2">
          <Label for="workflow-description" class="text-gray-700 dark:text-gray-300">
            Descripcion
          </Label>
          <Textarea
            id="workflow-description"
            v-model="workflow.description"
            :rows="3"
            placeholder="Descripcion del workflow..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" :disabled="loading" @click="emit('cancel')">
          Cancelar
        </Button>
        <Button
          :disabled="!canSave"
          @click="emit('save')"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ loading ? 'Creando...' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
