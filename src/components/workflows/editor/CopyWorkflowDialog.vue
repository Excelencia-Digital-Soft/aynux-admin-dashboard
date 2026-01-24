<script setup lang="ts">
/**
 * CopyWorkflowDialog - Dialog for copying a workflow from another institution
 *
 * Allows users to select a source institution and workflow, then copy it
 * to the current institution with a new key and display name.
 */
import { ref, watch, computed } from 'vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import { workflowApi } from '@/api/workflow.api'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'
import type { WorkflowDefinition, WorkflowCopyRequest } from '@/types/workflow.types'

const props = defineProps<{
  visible: boolean
  currentInstitutionId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'copied', result: { newWorkflowId: string; newWorkflowKey: string }): void
}>()

const toast = useToast()
const authStore = useAuthStore()

// State
const isLoading = ref(false)
const isCopying = ref(false)
const institutions = ref<TenantInstitutionConfig[]>([])
const sourceWorkflows = ref<WorkflowDefinition[]>([])
const selectedSourceInstitutionId = ref<string | undefined>(undefined)
const selectedSourceWorkflowId = ref<string | undefined>(undefined)
const newWorkflowKey = ref('')
const newDisplayName = ref('')
const isLoadingWorkflows = ref(false)

// Computed: filter out current institution from the list
const availableInstitutions = computed(() => {
  if (!props.currentInstitutionId) return institutions.value
  return institutions.value.filter((inst) => inst.id !== props.currentInstitutionId)
})

// Computed: selected workflow details
const selectedWorkflow = computed(() => {
  if (!selectedSourceWorkflowId.value) return null
  return sourceWorkflows.value.find((w) => w.id === selectedSourceWorkflowId.value) || null
})

// Computed: form validation
const isFormValid = computed(() => {
  return (
    selectedSourceInstitutionId.value &&
    selectedSourceWorkflowId.value &&
    newWorkflowKey.value.trim() !== '' &&
    newDisplayName.value.trim() !== ''
  )
})

// Load institutions when dialog opens
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadInstitutions()
    } else {
      resetForm()
    }
  }
)

// Load workflows when source institution changes
watch(selectedSourceInstitutionId, async (institutionId) => {
  sourceWorkflows.value = []
  selectedSourceWorkflowId.value = undefined
  newWorkflowKey.value = ''
  newDisplayName.value = ''

  if (institutionId) {
    await loadSourceWorkflows(institutionId)
  }
})

// Auto-populate key and name when workflow is selected
watch(selectedSourceWorkflowId, (workflowId) => {
  if (workflowId && selectedWorkflow.value) {
    newWorkflowKey.value = `${selectedWorkflow.value.workflow_key}_copy`
    newDisplayName.value = `${selectedWorkflow.value.display_name} (Copia)`
  } else {
    newWorkflowKey.value = ''
    newDisplayName.value = ''
  }
})

async function loadInstitutions() {
  const orgId = authStore.currentOrgId
  if (!orgId) {
    toast.error('Debe seleccionar una organizacion primero')
    return
  }

  isLoading.value = true
  try {
    const response = await tenantInstitutionConfigApi.list(orgId, {
      enabled_only: true
    })
    institutions.value = response.items
  } catch {
    toast.error('Error al cargar instituciones')
  } finally {
    isLoading.value = false
  }
}

async function loadSourceWorkflows(institutionId: string) {
  isLoadingWorkflows.value = true
  try {
    const response = await workflowApi.listWorkflowsByInstitution(institutionId)
    sourceWorkflows.value = response.workflows
  } catch {
    toast.error('Error al cargar workflows de la institucion')
  } finally {
    isLoadingWorkflows.value = false
  }
}

async function handleCopy() {
  if (!props.currentInstitutionId) {
    toast.error('Debe seleccionar una institucion destino')
    return
  }

  if (!selectedSourceWorkflowId.value) {
    toast.error('Debe seleccionar un workflow origen')
    return
  }

  const request: WorkflowCopyRequest = {
    source_workflow_id: selectedSourceWorkflowId.value,
    target_institution_config_id: props.currentInstitutionId,
    new_workflow_key: newWorkflowKey.value.trim(),
    new_display_name: newDisplayName.value.trim()
  }

  isCopying.value = true
  try {
    const result = await workflowApi.copyWorkflowFromInstitution(request)
    toast.success(result.message)
    emit('copied', {
      newWorkflowId: result.new_workflow_id,
      newWorkflowKey: result.new_workflow_key
    })
    emit('update:visible', false)
  } catch (e: unknown) {
    const axiosError = e as { response?: { data?: { detail?: string } } }
    const detail = axiosError.response?.data?.detail
    toast.error(detail || 'Error al copiar workflow')
  } finally {
    isCopying.value = false
  }
}

function resetForm() {
  selectedSourceInstitutionId.value = undefined
  selectedSourceWorkflowId.value = undefined
  newWorkflowKey.value = ''
  newDisplayName.value = ''
  sourceWorkflows.value = []
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Copiar Workflow de Otra Institucion</DialogTitle>
        <DialogDescription>
          Seleccione una institucion y workflow para copiar a la institucion actual.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Source Institution -->
        <div class="grid gap-2">
          <Label for="source-institution">Institucion Origen</Label>
          <Select v-model="selectedSourceInstitutionId" :disabled="isLoading">
            <SelectTrigger id="source-institution">
              <SelectValue
                :placeholder="isLoading ? 'Cargando...' : 'Seleccione una institucion'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="inst in availableInstitutions"
                :key="inst.id"
                :value="inst.id"
              >
                {{ inst.institution_name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="availableInstitutions.length === 0 && !isLoading" class="text-sm text-muted-foreground">
            No hay otras instituciones disponibles para copiar.
          </p>
        </div>

        <!-- Source Workflow -->
        <div class="grid gap-2">
          <Label for="source-workflow">Workflow a Copiar</Label>
          <Select
            v-model="selectedSourceWorkflowId"
            :disabled="!selectedSourceInstitutionId || isLoadingWorkflows"
          >
            <SelectTrigger id="source-workflow">
              <SelectValue
                :placeholder="
                  isLoadingWorkflows
                    ? 'Cargando...'
                    : selectedSourceInstitutionId
                      ? 'Seleccione un workflow'
                      : 'Primero seleccione una institucion'
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="wf in sourceWorkflows"
                :key="wf.id"
                :value="wf.id"
              >
                {{ wf.display_name }} ({{ wf.workflow_key }})
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="sourceWorkflows.length === 0 && selectedSourceInstitutionId && !isLoadingWorkflows" class="text-sm text-muted-foreground">
            No hay workflows en esta institucion.
          </p>
        </div>

        <!-- Workflow Info -->
        <div v-if="selectedWorkflow" class="rounded-md bg-muted p-3 text-sm">
          <div class="flex items-center gap-2 text-muted-foreground">
            <i class="pi pi-info-circle" />
            <span>Workflow seleccionado:</span>
          </div>
          <div class="mt-1 font-medium">{{ selectedWorkflow.display_name }}</div>
          <div class="text-muted-foreground">
            Tipo: {{ selectedWorkflow.workflow_type }} |
            Version: {{ selectedWorkflow.version }} |
            Nodos: {{ selectedWorkflow.node_count ?? 0 }}
          </div>
        </div>

        <!-- New Workflow Key -->
        <div class="grid gap-2">
          <Label for="new-key">Nueva Clave del Workflow</Label>
          <Input
            id="new-key"
            v-model="newWorkflowKey"
            placeholder="ej: flujo_turnos_copy"
            :disabled="!selectedSourceWorkflowId"
          />
          <p class="text-xs text-muted-foreground">
            Identificador unico para el nuevo workflow (sin espacios).
          </p>
        </div>

        <!-- New Display Name -->
        <div class="grid gap-2">
          <Label for="new-name">Nuevo Nombre</Label>
          <Input
            id="new-name"
            v-model="newDisplayName"
            placeholder="ej: Flujo de Turnos (Copia)"
            :disabled="!selectedSourceWorkflowId"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="isCopying">
          Cancelar
        </Button>
        <Button
          @click="handleCopy"
          :disabled="!isFormValid || isCopying"
        >
          <i v-if="isCopying" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-copy mr-2" />
          {{ isCopying ? 'Copiando...' : 'Copiar Workflow' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
