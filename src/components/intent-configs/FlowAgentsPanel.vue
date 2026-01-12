<template>
  <div class="flow-agents-panel">
    <!-- Header with actions -->
    <div class="panel-header">
      <div class="header-info">
        <h3>Flow Agents</h3>
        <p class="text-muted">
          Agentes que mantienen contexto en conversaciones multi-turn
        </p>
      </div>
      <div class="header-actions">
        <Button
          label="Nuevo Flow Agent"
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

    <!-- Cards Grid -->
    <div v-if="flowAgents.length" class="agents-grid">
      <Card
        v-for="agent in flowAgents"
        :key="agent.id"
        class="agent-card"
        :class="{ 'agent-disabled': !agent.is_enabled }"
      >
        <template #header>
          <div class="card-header">
            <div class="agent-icon-wrapper">
              <i class="pi pi-sitemap"></i>
            </div>
            <ToggleSwitch
              v-model="agent.is_enabled"
              @change="handleToggle(agent)"
              v-tooltip="agent.is_enabled ? 'Desactivar' : 'Activar'"
            />
          </div>
        </template>
        <template #title>
          <div class="agent-title">
            {{ formatAgentName(agent.agent_key) }}
            <Tag
              v-if="agent.is_flow_agent"
              value="FLOW"
              severity="warning"
              class="flow-tag"
            />
          </div>
        </template>
        <template #subtitle>
          <span class="agent-key">{{ agent.agent_key }}</span>
        </template>
        <template #content>
          <div class="agent-details">
            <p v-if="agent.flow_description" class="flow-description">
              {{ agent.flow_description }}
            </p>
            <div class="config-row">
              <div class="config-item">
                <i class="pi pi-sync"></i>
                <span>{{ agent.max_turns }} turnos max</span>
              </div>
              <div class="config-item">
                <i class="pi pi-clock"></i>
                <span>{{ formatTimeout(agent.timeout_seconds) }}</span>
              </div>
            </div>
            <div class="keywords-info" v-if="keywordCountForAgent(agent.agent_key) > 0">
              <i class="pi pi-tag"></i>
              <span>{{ keywordCountForAgent(agent.agent_key) }} keywords</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="card-actions">
            <Button
              icon="pi pi-pencil"
              label="Editar"
              severity="secondary"
              outlined
              size="small"
              @click="openEditDialog(agent)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="confirmDelete(agent)"
              v-tooltip="'Eliminar'"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="pi pi-sitemap empty-icon"></i>
      <h4>No hay Flow Agents configurados</h4>
      <p>Los Flow Agents mantienen contexto entre mensajes para conversaciones complejas</p>
      <Button
        label="Crear primer Flow Agent"
        icon="pi pi-plus"
        @click="openCreateDialog"
        :disabled="!organizationId"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="isEditing ? 'Editar Flow Agent' : 'Nuevo Flow Agent'"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <div class="dialog-form">
        <!-- Agent Key -->
        <div class="form-field">
          <label for="agent_key">Agente *</label>
          <Select
            v-if="!isEditing"
            id="agent_key"
            v-model="formData.agent_key"
            :options="availableAgents"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar agente"
            class="w-full"
          />
          <InputText
            v-else
            id="agent_key"
            :value="formatAgentName(formData.agent_key)"
            disabled
            class="w-full"
          />
        </div>

        <!-- Description -->
        <div class="form-field">
          <label for="flow_description">Descripcion del Flow</label>
          <Textarea
            id="flow_description"
            v-model="formData.flow_description"
            rows="3"
            class="w-full"
            placeholder="Describe el proposito del flujo multi-turn"
          />
        </div>

        <!-- Max Turns & Timeout -->
        <div class="form-row">
          <div class="form-field">
            <label for="max_turns">Max Turnos</label>
            <InputNumber
              id="max_turns"
              v-model="formData.max_turns"
              :min="1"
              :max="50"
              class="w-full"
            />
            <small>Numero maximo de intercambios</small>
          </div>
          <div class="form-field">
            <label for="timeout">Timeout (segundos)</label>
            <InputNumber
              id="timeout"
              v-model="formData.timeout_seconds"
              :min="60"
              :max="3600"
              :step="60"
              class="w-full"
            />
            <small>Expiracion del contexto</small>
          </div>
        </div>

        <!-- Flags -->
        <div class="form-row">
          <div class="form-field-inline">
            <Checkbox id="is_flow_agent" v-model="formData.is_flow_agent" binary />
            <label for="is_flow_agent">Es Flow Agent</label>
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
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import ConfirmDialog from 'primevue/confirmdialog'

import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type { FlowAgentConfig, FlowAgentConfigCreate, FlowAgentConfigUpdate } from '@/types/intentConfigs.types'

// Emits
const emit = defineEmits<{
  refresh: []
}>()

// Composables
const confirm = useConfirm()
const authStore = useAuthStore()
const {
  flowAgents,
  loading,
  keywordCountForAgent,
  fetchFlowAgents,
  createFlowAgent,
  updateFlowAgent,
  deleteFlowAgent,
} = useIntentConfig()

// State
const showDialog = ref(false)
const isEditing = ref(false)
const editingAgentKey = ref<string | null>(null)

const formData = ref<{
  agent_key: string
  is_flow_agent: boolean
  flow_description: string | null
  max_turns: number
  timeout_seconds: number
  is_enabled: boolean
}>({
  agent_key: '',
  is_flow_agent: true,
  flow_description: null,
  max_turns: 10,
  timeout_seconds: 300,
  is_enabled: true,
})

// Computed
const organizationId = computed(() => authStore.currentOrgId)

const isFormValid = computed(() => formData.value.agent_key !== '')

// Options - agents that aren't already flow agents
const availableAgents = computed(() => {
  const existingKeys = new Set(flowAgents.value.map((f) => f.agent_key))
  return allAgents.filter((a) => !existingKeys.has(a.value))
})

const allAgents = [
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

// Helpers
function formatAgentName(agentKey: string): string {
  return agentKey
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTimeout(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

function resetForm() {
  formData.value = {
    agent_key: '',
    is_flow_agent: true,
    flow_description: null,
    max_turns: 10,
    timeout_seconds: 300,
    is_enabled: true,
  }
  isEditing.value = false
  editingAgentKey.value = null
}

// Dialog handlers
function openCreateDialog() {
  resetForm()
  showDialog.value = true
}

function openEditDialog(agent: FlowAgentConfig) {
  isEditing.value = true
  editingAgentKey.value = agent.agent_key
  formData.value = {
    agent_key: agent.agent_key,
    is_flow_agent: agent.is_flow_agent,
    flow_description: agent.flow_description,
    max_turns: agent.max_turns,
    timeout_seconds: agent.timeout_seconds,
    is_enabled: agent.is_enabled,
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
    if (isEditing.value && editingAgentKey.value) {
      const updateData: FlowAgentConfigUpdate = {
        is_flow_agent: formData.value.is_flow_agent,
        flow_description: formData.value.flow_description,
        max_turns: formData.value.max_turns,
        timeout_seconds: formData.value.timeout_seconds,
        is_enabled: formData.value.is_enabled,
      }
      await updateFlowAgent(editingAgentKey.value, updateData)
    } else {
      const createData: FlowAgentConfigCreate = {
        agent_key: formData.value.agent_key,
        is_flow_agent: formData.value.is_flow_agent,
        flow_description: formData.value.flow_description,
        max_turns: formData.value.max_turns,
        timeout_seconds: formData.value.timeout_seconds,
        is_enabled: formData.value.is_enabled,
      }
      await createFlowAgent(createData)
    }
    closeDialog()
  } catch (error) {
    // Error handled in composable
  }
}

async function handleToggle(agent: FlowAgentConfig) {
  try {
    await updateFlowAgent(agent.agent_key, { is_enabled: agent.is_enabled })
  } catch (error) {
    // Revert on error
    agent.is_enabled = !agent.is_enabled
  }
}

function confirmDelete(agent: FlowAgentConfig) {
  confirm.require({
    message: `¿Eliminar la configuracion de flow para "${formatAgentName(agent.agent_key)}"?`,
    header: 'Confirmar Eliminacion',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteFlowAgent(agent.agent_key)
    },
  })
}

async function handleRefresh() {
  await fetchFlowAgents()
  emit('refresh')
}

// Lifecycle
onMounted(() => {
  if (organizationId.value) {
    fetchFlowAgents()
  }
})

// Watch for org changes
watch(organizationId, (newOrgId) => {
  if (newOrgId) {
    fetchFlowAgents()
  }
})

// Expose methods
defineExpose({
  openCreateDialog,
  refresh: handleRefresh,
})
</script>

<style scoped>
.flow-agents-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
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

/* Agents Grid */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.agent-card {
  transition: all 0.2s ease;
}

.agent-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.agent-card.agent-disabled {
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0;
}

.agent-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-400));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.agent-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flow-tag {
  font-size: 0.625rem;
}

.agent-key {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.agent-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.flow-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.config-row {
  display: flex;
  gap: 1rem;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.config-item i {
  font-size: 0.875rem;
}

.keywords-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--primary-color);
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: var(--text-color-secondary);
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

.form-field small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
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
