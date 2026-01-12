<template>
  <div class="agent-mappings-panel">
    <!-- Header with actions -->
    <div class="panel-header">
      <div class="header-info">
        <h3>Mapeos Intent - Agente</h3>
        <p class="text-muted">
          Configura que agente maneja cada intent detectado
        </p>
      </div>
      <div class="header-actions">
        <Button
          label="Nuevo Mapping"
          icon="pi pi-plus"
          severity="success"
          @click="openCreateDialog"
          :disabled="!organizationId"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          @click="handleRefresh"
          :loading="loading"
          v-tooltip="'Refrescar'"
        />
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      :value="intentMappings"
      :loading="loading"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      stripedRows
      removableSort
      sortField="priority"
      :sortOrder="-1"
      dataKey="id"
      class="mappings-table"
      emptyMessage="No hay mappings configurados"
    >
      <!-- Intent Key -->
      <Column field="intent_key" header="Intent" sortable style="min-width: 150px">
        <template #body="slotProps">
          <div class="intent-cell">
            <Tag :value="slotProps.data.intent_key" severity="info" />
            <span v-if="slotProps.data.domain_key" class="domain-badge">
              {{ slotProps.data.domain_key }}
            </span>
          </div>
        </template>
      </Column>

      <!-- Intent Name -->
      <Column field="intent_name" header="Nombre" sortable style="min-width: 150px">
        <template #body="slotProps">
          <span>{{ slotProps.data.intent_name }}</span>
        </template>
      </Column>

      <!-- Agent Key -->
      <Column field="agent_key" header="Agente" sortable style="min-width: 180px">
        <template #body="slotProps">
          <div class="agent-cell">
            <i class="pi pi-android agent-icon"></i>
            <span>{{ formatAgentName(slotProps.data.agent_key) }}</span>
            <Tag
              v-if="isFlowAgent(slotProps.data.agent_key)"
              value="FLOW"
              severity="warning"
              class="flow-badge"
            />
          </div>
        </template>
      </Column>

      <!-- Priority -->
      <Column field="priority" header="Prioridad" sortable style="width: 120px">
        <template #body="slotProps">
          <div class="priority-cell">
            <ProgressBar
              :value="slotProps.data.priority"
              :showValue="false"
              style="height: 8px; width: 60px"
            />
            <span>{{ slotProps.data.priority }}</span>
          </div>
        </template>
      </Column>

      <!-- Confidence Threshold -->
      <Column field="confidence_threshold" header="Confianza" sortable style="width: 120px">
        <template #body="slotProps">
          <span>{{ (slotProps.data.confidence_threshold * 100).toFixed(0) }}%</span>
        </template>
      </Column>

      <!-- Status -->
      <Column field="is_enabled" header="Estado" sortable style="width: 100px">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.is_enabled ? 'Activo' : 'Inactivo'"
            :severity="slotProps.data.is_enabled ? 'success' : 'secondary'"
          />
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Acciones" style="width: 120px">
        <template #body="slotProps">
          <div class="actions-cell">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click="openEditDialog(slotProps.data)"
              v-tooltip="'Editar'"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="confirmDelete(slotProps.data)"
              v-tooltip="'Eliminar'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="isEditing ? 'Editar Mapping' : 'Nuevo Mapping'"
      :modal="true"
      :closable="true"
      :style="{ width: '550px' }"
    >
      <div class="dialog-form">
        <!-- Intent Key -->
        <div class="form-field">
          <label for="intent_key">Intent Key *</label>
          <InputText
            id="intent_key"
            v-model="formData.intent_key"
            :disabled="isEditing"
            placeholder="ej: saludo, soporte, excelencia"
            class="w-full"
          />
        </div>

        <!-- Intent Name -->
        <div class="form-field">
          <label for="intent_name">Nombre *</label>
          <InputText
            id="intent_name"
            v-model="formData.intent_name"
            placeholder="Nombre descriptivo"
            class="w-full"
          />
        </div>

        <!-- Agent Key -->
        <div class="form-field">
          <label for="agent_key">Agente *</label>
          <Select
            id="agent_key"
            v-model="formData.agent_key"
            :options="availableAgents"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar agente"
            class="w-full"
          />
        </div>

        <!-- Domain Key -->
        <div class="form-field">
          <label for="domain_key">Dominio</label>
          <Select
            id="domain_key"
            v-model="formData.domain_key"
            :options="domainOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Global (todos los dominios)"
            showClear
            class="w-full"
          />
        </div>

        <!-- Priority & Confidence -->
        <div class="form-row">
          <div class="form-field">
            <label for="priority">Prioridad (0-100)</label>
            <InputNumber
              id="priority"
              v-model="formData.priority"
              :min="0"
              :max="100"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label for="confidence">Confianza Minima</label>
            <InputNumber
              id="confidence"
              v-model="formData.confidence_threshold"
              :min="0"
              :max="1"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="form-field">
          <label for="description">Descripcion</label>
          <Textarea
            id="description"
            v-model="formData.intent_description"
            rows="2"
            class="w-full"
            placeholder="Descripcion opcional del intent"
          />
        </div>

        <!-- Flags -->
        <div class="form-row">
          <div class="form-field-inline">
            <Checkbox id="requires_handoff" v-model="formData.requires_handoff" binary />
            <label for="requires_handoff">Requiere Handoff</label>
          </div>
          <div class="form-field-inline">
            <Checkbox id="is_enabled" v-model="formData.is_enabled" binary />
            <label for="is_enabled">Habilitado</label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="closeDialog" />
        <Button
          :label="isEditing ? 'Guardar' : 'Crear'"
          severity="primary"
          @click="handleSave"
          :loading="loading"
          :disabled="!isFormValid"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import ConfirmDialog from 'primevue/confirmdialog'

import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type {
  IntentAgentMapping,
  IntentAgentMappingCreate,
  IntentAgentMappingUpdate,
} from '@/types/intentConfigs.types'

// Props
const props = defineProps<{
  domainKey?: string | null
}>()

// Emits
const emit = defineEmits<{
  refresh: []
}>()

// Composables
const confirm = useConfirm()
const authStore = useAuthStore()
const {
  intentMappings,
  loading,
  isFlowAgent,
  fetchIntentMappings,
  createIntentMapping,
  updateIntentMapping,
  deleteIntentMapping,
} = useIntentConfig()

// State
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const formData = ref<{
  intent_key: string
  intent_name: string
  agent_key: string
  domain_key: string | null
  priority: number
  confidence_threshold: number
  intent_description: string | null
  requires_handoff: boolean
  is_enabled: boolean
}>({
  intent_key: '',
  intent_name: '',
  agent_key: '',
  domain_key: null,
  priority: 50,
  confidence_threshold: 0.75,
  intent_description: null,
  requires_handoff: false,
  is_enabled: true,
})

// Computed
const organizationId = computed(() => authStore.currentOrgId)

const isFormValid = computed(() => {
  return (
    formData.value.intent_key.trim() !== '' &&
    formData.value.intent_name.trim() !== '' &&
    formData.value.agent_key !== ''
  )
})

// Options
const availableAgents = [
  { label: 'Greeting Agent', value: 'greeting_agent' },
  { label: 'Support Agent', value: 'support_agent' },
  { label: 'Fallback Agent', value: 'fallback_agent' },
  { label: 'Farewell Agent', value: 'farewell_agent' },
  { label: 'Excelencia Agent', value: 'excelencia_agent' },
  { label: 'Excelencia Support Agent', value: 'excelencia_support_agent' },
  { label: 'Excelencia Invoice Agent', value: 'excelencia_invoice_agent' },
  { label: 'Excelencia Promotions Agent', value: 'excelencia_promotions_agent' },
  { label: 'Data Insights Agent', value: 'data_insights_agent' },
  { label: 'E-commerce Agent', value: 'ecommerce_agent' },
  { label: 'Product Agent', value: 'product_agent' },
  { label: 'Pharmacy Operations Agent', value: 'pharmacy_operations_agent' },
]

const domainOptions = [
  { label: 'Excelencia', value: 'excelencia' },
  { label: 'Pharmacy', value: 'pharmacy' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Healthcare', value: 'healthcare' },
]

// Helpers
function formatAgentName(agentKey: string): string {
  return agentKey
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function resetForm() {
  formData.value = {
    intent_key: '',
    intent_name: '',
    agent_key: '',
    domain_key: props.domainKey || null,
    priority: 50,
    confidence_threshold: 0.75,
    intent_description: null,
    requires_handoff: false,
    is_enabled: true,
  }
  isEditing.value = false
  editingId.value = null
}

// Dialog handlers
function openCreateDialog() {
  resetForm()
  showDialog.value = true
}

function openEditDialog(mapping: IntentAgentMapping) {
  isEditing.value = true
  editingId.value = mapping.id
  formData.value = {
    intent_key: mapping.intent_key,
    intent_name: mapping.intent_name,
    agent_key: mapping.agent_key,
    domain_key: mapping.domain_key,
    priority: mapping.priority,
    confidence_threshold: mapping.confidence_threshold,
    intent_description: mapping.intent_description,
    requires_handoff: mapping.requires_handoff,
    is_enabled: mapping.is_enabled,
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  resetForm()
}

async function handleSave() {
  if (!isFormValid.value) return

  try {
    if (isEditing.value && editingId.value) {
      const updateData: IntentAgentMappingUpdate = {
        intent_name: formData.value.intent_name,
        agent_key: formData.value.agent_key,
        domain_key: formData.value.domain_key,
        priority: formData.value.priority,
        confidence_threshold: formData.value.confidence_threshold,
        intent_description: formData.value.intent_description,
        requires_handoff: formData.value.requires_handoff,
        is_enabled: formData.value.is_enabled,
      }
      await updateIntentMapping(editingId.value, updateData)
    } else {
      const createData: IntentAgentMappingCreate = {
        intent_key: formData.value.intent_key,
        intent_name: formData.value.intent_name,
        agent_key: formData.value.agent_key,
        domain_key: formData.value.domain_key,
        priority: formData.value.priority,
        confidence_threshold: formData.value.confidence_threshold,
        intent_description: formData.value.intent_description,
        requires_handoff: formData.value.requires_handoff,
        is_enabled: formData.value.is_enabled,
      }
      await createIntentMapping(createData)
    }
    closeDialog()
  } catch (error) {
    // Error handled in composable
  }
}

function confirmDelete(mapping: IntentAgentMapping) {
  confirm.require({
    message: `¿Eliminar el mapping "${mapping.intent_key}" -> "${mapping.agent_key}"?`,
    header: 'Confirmar Eliminacion',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteIntentMapping(mapping.id)
    },
  })
}

async function handleRefresh() {
  await fetchIntentMappings(props.domainKey)
  emit('refresh')
}

// Lifecycle
onMounted(() => {
  if (organizationId.value) {
    fetchIntentMappings(props.domainKey)
  }
})

// Watch for domain changes
watch(
  () => props.domainKey,
  (newDomain) => {
    if (organizationId.value) {
      fetchIntentMappings(newDomain)
    }
  }
)

// Watch for org changes
watch(organizationId, (newOrgId) => {
  if (newOrgId) {
    fetchIntentMappings(props.domainKey)
  }
})

// Expose methods
defineExpose({
  openCreateDialog,
  refresh: handleRefresh,
})
</script>

<style scoped>
.agent-mappings-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.header-info .text-muted {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.mappings-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-ground);
}

.intent-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.domain-badge {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  background: var(--surface-100);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.agent-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.agent-icon {
  color: var(--primary-color);
}

.flow-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.25rem;
}

.priority-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actions-cell {
  display: flex;
  gap: 0.25rem;
}

/* Dialog Form */
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field label {
  font-weight: 500;
  font-size: 0.875rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-field-inline label {
  font-size: 0.875rem;
}

.w-full {
  width: 100%;
}
</style>
