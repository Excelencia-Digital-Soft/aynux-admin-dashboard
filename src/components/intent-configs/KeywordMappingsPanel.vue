<template>
  <div class="keyword-mappings-panel">
    <!-- Header with actions -->
    <div class="panel-header">
      <div class="header-info">
        <h3>Keywords de Fallback</h3>
        <p class="text-muted">
          Palabras clave para routing cuando la deteccion de intent falla
        </p>
      </div>
      <div class="header-actions">
        <Button
          label="Agregar Keywords"
          icon="pi pi-plus"
          severity="success"
          @click="openBulkDialog"
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

    <!-- Filter by Agent -->
    <div class="filter-section">
      <Select
        v-model="selectedAgentFilter"
        :options="agentFilterOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Filtrar por agente"
        showClear
        class="agent-filter"
        @change="handleAgentFilterChange"
      />
      <div class="keyword-stats">
        <Tag severity="info" :value="`${filteredKeywords.length} keywords`" />
        <Tag
          v-if="selectedAgentFilter"
          severity="secondary"
          :value="formatAgentName(selectedAgentFilter)"
          removable
          @remove="selectedAgentFilter = null"
        />
      </div>
    </div>

    <!-- Keywords Grid by Agent -->
    <div v-if="groupedKeywords && Object.keys(groupedKeywords).length" class="keywords-groups">
      <div
        v-for="(keywords, agentKey) in groupedKeywords"
        :key="agentKey"
        class="agent-group"
      >
        <div class="group-header">
          <div class="agent-info">
            <i class="pi pi-android"></i>
            <span class="agent-name">{{ formatAgentName(agentKey as string) }}</span>
            <Tag
              v-if="isFlowAgent(agentKey as string)"
              value="FLOW"
              severity="warning"
              class="flow-badge"
            />
          </div>
          <Tag :value="`${keywords.length} keywords`" severity="info" />
        </div>
        <div class="keywords-chips">
          <Chip
            v-for="kw in keywords"
            :key="kw.id"
            :label="kw.keyword"
            :class="{ 'keyword-disabled': !kw.is_enabled }"
            removable
            @remove="confirmDeleteKeyword(kw)"
          >
            <template #icon>
              <i :class="getMatchTypeIcon(kw.match_type)" class="chip-icon"></i>
            </template>
          </Chip>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="pi pi-tag empty-icon"></i>
      <h4>No hay keywords configurados</h4>
      <p>Los keywords permiten routing basado en palabras clave cuando falla la deteccion de intent</p>
      <Button
        label="Agregar keywords"
        icon="pi pi-plus"
        @click="openBulkDialog"
        :disabled="!organizationId"
      />
    </div>

    <!-- Data Table (alternative view) -->
    <Accordion v-if="filteredKeywords.length" class="table-accordion">
      <AccordionPanel value="table">
        <AccordionHeader>
          <i class="pi pi-table mr-2"></i>
          Ver como tabla
        </AccordionHeader>
        <AccordionContent>
          <DataTable
            :value="filteredKeywords"
            :loading="loading"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            stripedRows
            removableSort
            sortField="keyword"
            :sortOrder="1"
            dataKey="id"
            class="keywords-table"
          >
            <Column field="keyword" header="Keyword" sortable style="min-width: 150px">
              <template #body="slotProps">
                <code class="keyword-code">{{ slotProps.data.keyword }}</code>
              </template>
            </Column>
            <Column field="agent_key" header="Agente" sortable style="min-width: 150px">
              <template #body="slotProps">
                {{ formatAgentName(slotProps.data.agent_key) }}
              </template>
            </Column>
            <Column field="match_type" header="Tipo" sortable style="width: 120px">
              <template #body="slotProps">
                <Tag :value="slotProps.data.match_type" :severity="getMatchTypeSeverity(slotProps.data.match_type)" />
              </template>
            </Column>
            <Column field="priority" header="Prioridad" sortable style="width: 100px" />
            <Column field="is_enabled" header="Estado" sortable style="width: 100px">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.is_enabled ? 'Activo' : 'Inactivo'"
                  :severity="slotProps.data.is_enabled ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column header="Acciones" style="width: 80px">
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="confirmDeleteKeyword(slotProps.data)"
                  v-tooltip="'Eliminar'"
                />
              </template>
            </Column>
          </DataTable>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <!-- Bulk Create Dialog -->
    <Dialog
      v-model:visible="showBulkDialog"
      header="Agregar Keywords"
      :modal="true"
      :closable="true"
      :style="{ width: '550px' }"
    >
      <div class="dialog-form">
        <!-- Agent -->
        <div class="form-field">
          <label for="bulk_agent">Agente *</label>
          <Select
            id="bulk_agent"
            v-model="bulkFormData.agent_key"
            :options="availableAgents"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar agente"
            class="w-full"
          />
        </div>

        <!-- Keywords Input -->
        <div class="form-field">
          <label for="keywords">Keywords *</label>
          <Chips
            id="keywords"
            v-model="bulkFormData.keywords"
            placeholder="Escribe y presiona Enter"
            class="w-full"
          />
          <small>Escribe cada keyword y presiona Enter para agregar</small>
        </div>

        <!-- Match Type -->
        <div class="form-field">
          <label for="match_type">Tipo de Match</label>
          <SelectButton
            v-model="bulkFormData.match_type"
            :options="matchTypeOptions"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <!-- Options -->
        <div class="form-row">
          <div class="form-field">
            <label for="priority">Prioridad</label>
            <InputNumber
              id="priority"
              v-model="bulkFormData.priority"
              :min="0"
              :max="100"
              class="w-full"
            />
          </div>
          <div class="form-field-inline" style="padding-top: 1.75rem">
            <Checkbox id="case_sensitive" v-model="bulkFormData.case_sensitive" binary />
            <label for="case_sensitive">Case Sensitive</label>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span v-if="bulkFormData.keywords.length" class="preview-count">
            {{ bulkFormData.keywords.length }} keywords a crear
          </span>
          <div class="dialog-actions">
            <Button label="Cancelar" severity="secondary" @click="closeBulkDialog" />
            <Button
              label="Crear Keywords"
              severity="primary"
              @click="handleBulkCreate"
              :loading="loading"
              :disabled="!isBulkFormValid"
            />
          </div>
        </div>
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
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Chips from 'primevue/chips'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import SelectButton from 'primevue/selectbutton'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import ConfirmDialog from 'primevue/confirmdialog'

import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type { KeywordAgentMapping, MatchType } from '@/types/intentConfigs.types'

// Props
const props = defineProps<{
  agentKey?: string | null
}>()

// Emits
const emit = defineEmits<{
  refresh: []
}>()

// Composables
const confirm = useConfirm()
const authStore = useAuthStore()
const {
  keywordMappings,
  loading,
  isFlowAgent,
  keywordsByAgent,
  fetchKeywords,
  createKeywordsBulk,
  deleteKeyword,
} = useIntentConfig()

// State
const showBulkDialog = ref(false)
const selectedAgentFilter = ref<string | null>(props.agentKey || null)

const bulkFormData = ref<{
  agent_key: string
  keywords: string[]
  match_type: MatchType
  case_sensitive: boolean
  priority: number
}>({
  agent_key: '',
  keywords: [],
  match_type: 'contains',
  case_sensitive: false,
  priority: 50,
})

// Computed
const organizationId = computed(() => authStore.currentOrgId)

const filteredKeywords = computed(() => {
  if (!selectedAgentFilter.value) return keywordMappings.value
  return keywordMappings.value.filter((k) => k.agent_key === selectedAgentFilter.value)
})

const groupedKeywords = computed(() => {
  const grouped: Record<string, KeywordAgentMapping[]> = {}
  for (const kw of filteredKeywords.value) {
    if (!grouped[kw.agent_key]) {
      grouped[kw.agent_key] = []
    }
    grouped[kw.agent_key].push(kw)
  }
  return grouped
})

const isBulkFormValid = computed(() => {
  return bulkFormData.value.agent_key !== '' && bulkFormData.value.keywords.length > 0
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

const agentFilterOptions = computed(() => {
  const uniqueAgents = [...new Set(keywordMappings.value.map((k) => k.agent_key))]
  return uniqueAgents.map((key) => ({
    label: formatAgentName(key),
    value: key,
  }))
})

const matchTypeOptions = [
  { label: 'Contains', value: 'contains' },
  { label: 'Exact', value: 'exact' },
  { label: 'Prefix', value: 'prefix' },
  { label: 'Regex', value: 'regex' },
]

// Helpers
function formatAgentName(agentKey: string): string {
  return agentKey
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getMatchTypeIcon(matchType: MatchType): string {
  switch (matchType) {
    case 'exact':
      return 'pi pi-equals'
    case 'contains':
      return 'pi pi-search'
    case 'prefix':
      return 'pi pi-arrow-right'
    case 'regex':
      return 'pi pi-code'
    default:
      return 'pi pi-tag'
  }
}

function getMatchTypeSeverity(matchType: MatchType): string {
  switch (matchType) {
    case 'exact':
      return 'success'
    case 'contains':
      return 'info'
    case 'prefix':
      return 'warning'
    case 'regex':
      return 'danger'
    default:
      return 'secondary'
  }
}

function resetBulkForm() {
  bulkFormData.value = {
    agent_key: selectedAgentFilter.value || '',
    keywords: [],
    match_type: 'contains',
    case_sensitive: false,
    priority: 50,
  }
}

// Dialog handlers
function openBulkDialog() {
  resetBulkForm()
  showBulkDialog.value = true
}

function closeBulkDialog() {
  showBulkDialog.value = false
  resetBulkForm()
}

async function handleBulkCreate() {
  if (!isBulkFormValid.value) return

  try {
    await createKeywordsBulk({
      agent_key: bulkFormData.value.agent_key,
      keywords: bulkFormData.value.keywords,
      match_type: bulkFormData.value.match_type,
      case_sensitive: bulkFormData.value.case_sensitive,
      priority: bulkFormData.value.priority,
    })
    closeBulkDialog()
  } catch (error) {
    // Error handled in composable
  }
}

function confirmDeleteKeyword(keyword: KeywordAgentMapping) {
  confirm.require({
    message: `¿Eliminar el keyword "${keyword.keyword}"?`,
    header: 'Confirmar Eliminacion',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteKeyword(keyword.id)
    },
  })
}

function handleAgentFilterChange() {
  if (organizationId.value) {
    fetchKeywords(selectedAgentFilter.value)
  }
}

async function handleRefresh() {
  await fetchKeywords(selectedAgentFilter.value)
  emit('refresh')
}

// Lifecycle
onMounted(() => {
  if (organizationId.value) {
    fetchKeywords(props.agentKey)
  }
})

// Watch for agent prop changes
watch(
  () => props.agentKey,
  (newAgent) => {
    selectedAgentFilter.value = newAgent || null
    if (organizationId.value) {
      fetchKeywords(newAgent)
    }
  }
)

// Watch for org changes
watch(organizationId, (newOrgId) => {
  if (newOrgId) {
    fetchKeywords(selectedAgentFilter.value)
  }
})

// Expose methods
defineExpose({
  openBulkDialog,
  refresh: handleRefresh,
})
</script>

<style scoped>
.keyword-mappings-panel {
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

/* Filter Section */
.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.agent-filter {
  min-width: 200px;
}

.keyword-stats {
  display: flex;
  gap: 0.5rem;
}

/* Keywords Groups */
.keywords-groups {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.agent-group {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.agent-info i {
  color: var(--primary-color);
}

.agent-name {
  font-weight: 600;
}

.flow-badge {
  font-size: 0.625rem;
}

.keywords-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keywords-chips :deep(.p-chip) {
  cursor: default;
}

.keywords-chips .keyword-disabled {
  opacity: 0.5;
}

.chip-icon {
  font-size: 0.75rem;
  margin-right: 0.25rem;
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

/* Table Accordion */
.table-accordion {
  margin-top: 1rem;
}

.keywords-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-ground);
}

.keyword-code {
  background: var(--surface-100);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
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

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preview-count {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
}

.w-full {
  width: 100%;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
