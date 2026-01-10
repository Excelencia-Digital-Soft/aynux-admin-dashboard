<template>
  <div class="response-configs-panel">
    <!-- Stats Cards -->
    <div v-if="domain" class="stats-cards">
      <div class="stat-card">
        <i class="pi pi-list"></i>
        <div class="stat-content">
          <span class="stat-value">{{ filteredConfigs.length }}</span>
          <span class="stat-label">Configuraciones</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="pi pi-check-circle"></i>
        <div class="stat-content">
          <span class="stat-value">{{ enabledConfigs }}</span>
          <span class="stat-label">Activas</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="pi pi-exclamation-triangle"></i>
        <div class="stat-content">
          <span class="stat-value">{{ criticalConfigs }}</span>
          <span class="stat-label">Críticas</span>
        </div>
      </div>
    </div>

    <!-- No Domain Selected -->
    <div v-if="!domain" class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>Selecciona un Dominio</h3>
      <p>Elige un dominio del selector para ver y gestionar las configuraciones de respuesta</p>
    </div>

    <!-- Configs Table -->
    <DataTable
      v-else
      :value="filteredConfigs"
      :loading="loading"
      dataKey="id"
      stripedRows
      showGridlines
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[5, 10, 25, 50]"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} configuraciones"
      v-model:expandedRows="expandedRows"
      class="configs-table"
    >
      <template #header>
        <div class="table-header">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Buscar configuraciones..." @input="onSearch" />
          </span>
          <div class="header-actions">
            <ToggleSwitch v-model="showOnlyEnabled" />
            <label>Solo activas</label>
            <ToggleSwitch v-model="showOnlyCritical" class="ml-3" />
            <label>Solo críticas</label>
          </div>
        </div>
      </template>

      <Column expander style="width: 3rem" />

      <Column field="intent_key" header="Intent Key" sortable style="min-width: 150px">
        <template #body="{ data }">
          <code class="intent-key">{{ data.intent_key }}</code>
        </template>
      </Column>

      <Column field="display_name" header="Nombre" sortable style="min-width: 180px">
        <template #body="{ data }">
          {{ data.display_name || '-' }}
        </template>
      </Column>

      <Column field="is_critical" header="Crítico" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag
            :value="data.is_critical ? 'Crítico' : 'Normal'"
            :severity="data.is_critical ? 'danger' : 'secondary'"
          />
        </template>
      </Column>

      <Column field="task_description" header="Tarea" style="min-width: 250px">
        <template #body="{ data }">
          <span class="task-description" v-tooltip="data.task_description">
            {{ truncateText(data.task_description, 50) }}
          </span>
        </template>
      </Column>

      <Column field="fallback_template_key" header="Template" style="min-width: 150px">
        <template #body="{ data }">
          <code class="template-key">{{ data.fallback_template_key }}</code>
        </template>
      </Column>

      <Column field="priority" header="Prioridad" sortable style="width: 100px">
        <template #body="{ data }">
          <span class="priority-badge">{{ data.priority }}</span>
        </template>
      </Column>

      <Column field="is_enabled" header="Estado" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag
            :value="data.is_enabled ? 'Activa' : 'Inactiva'"
            :severity="data.is_enabled ? 'success' : 'secondary'"
          />
        </template>
      </Column>

      <Column header="Acciones" style="width: 120px">
        <template #body="{ data }">
          <div class="action-buttons">
            <Button
              icon="pi pi-pencil"
              severity="info"
              text
              rounded
              v-tooltip="'Editar'"
              @click="openEditDialog(data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              v-tooltip="'Eliminar'"
              @click="confirmDeleteConfig(data)"
            />
          </div>
        </template>
      </Column>

      <!-- Expanded Row - Config Details -->
      <template #expansion="{ data }">
        <div class="expanded-content">
          <div class="detail-grid">
            <div class="detail-section">
              <h4>Descripción de Tarea</h4>
              <p class="full-description">{{ data.task_description }}</p>
            </div>

            <div class="detail-section">
              <h4>Detalles</h4>
              <div class="detail-row">
                <span class="detail-label">Template de Fallback:</span>
                <code>{{ data.fallback_template_key }}</code>
              </div>
              <div v-if="data.description" class="detail-row">
                <span class="detail-label">Descripción:</span>
                <span>{{ data.description }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Creado:</span>
                <span>{{ formatDate(data.created_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Actualizado:</span>
                <span>{{ formatDate(data.updated_at) }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>Acciones Rápidas</h4>
              <div class="quick-actions">
                <Button
                  :label="data.is_enabled ? 'Deshabilitar' : 'Habilitar'"
                  :icon="data.is_enabled ? 'pi pi-times' : 'pi pi-check'"
                  :severity="data.is_enabled ? 'secondary' : 'success'"
                  size="small"
                  outlined
                  @click="toggleEnabled(data)"
                />
                <Button
                  :label="data.is_critical ? 'Quitar Crítico' : 'Marcar Crítico'"
                  :icon="data.is_critical ? 'pi pi-minus' : 'pi pi-exclamation-triangle'"
                  :severity="data.is_critical ? 'secondary' : 'danger'"
                  size="small"
                  outlined
                  @click="toggleCritical(data)"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="empty-table">
          <i class="pi pi-inbox"></i>
          <p>No hay configuraciones para este dominio</p>
          <Button label="Crear primera configuración" icon="pi pi-plus" @click="openCreateDialog" />
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="dialogTitle()"
      :modal="true"
      :style="{ width: '600px' }"
      class="config-dialog"
    >
      <div class="dialog-content">
        <div class="field">
          <label for="intent_key">Intent Key *</label>
          <InputText
            id="intent_key"
            v-model="formData.intent_key"
            :disabled="isEditing()"
            placeholder="ej: greeting, payment_confirmation"
            class="w-full"
          />
          <small class="text-muted">Identificador único del intent (snake_case)</small>
        </div>

        <div class="field">
          <label for="display_name">Nombre para Mostrar</label>
          <InputText
            id="display_name"
            v-model="formData.display_name"
            placeholder="ej: Saludo Inicial"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="task_description">Descripción de Tarea *</label>
          <Textarea
            id="task_description"
            v-model="formData.task_description"
            rows="3"
            placeholder="Instrucción que se inyecta al LLM para generar la respuesta"
            class="w-full"
          />
          <small class="text-muted">Se inyecta en el system prompt del LLM</small>
        </div>

        <div class="field">
          <label for="fallback_template_key">Fallback Template Key *</label>
          <InputText
            id="fallback_template_key"
            v-model="formData.fallback_template_key"
            placeholder="ej: greeting, payment_confirmation"
            class="w-full"
          />
          <small class="text-muted">Clave del template en fallback_templates.yaml</small>
        </div>

        <div class="field">
          <label for="description">Descripción (opcional)</label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="2"
            placeholder="Notas adicionales sobre esta configuración"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="priority">Prioridad</label>
          <InputNumber
            id="priority"
            v-model="formData.priority"
            :min="0"
            :max="1000"
            class="w-full"
          />
          <small class="text-muted">Mayor número = mayor prioridad (0-1000)</small>
        </div>

        <div class="field-row">
          <div class="field checkbox-field">
            <Checkbox v-model="formData.is_critical" :binary="true" inputId="is_critical" />
            <label for="is_critical">Es Crítico</label>
            <small class="checkbox-hint">Siempre usa template fijo, nunca LLM</small>
          </div>
          <div class="field checkbox-field">
            <Checkbox v-model="formData.is_enabled" :binary="true" inputId="is_enabled" />
            <label for="is_enabled">Activo</label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="closeDialog" />
        <Button
          :label="submitLabel()"
          icon="pi pi-check"
          @click="saveConfig"
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Seed Dialog -->
    <Dialog
      v-model:visible="showSeedDialog"
      header="Sembrar Configuraciones por Defecto"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="seed-dialog-content">
        <p>
          Esto creará las configuraciones de respuesta predefinidas para el dominio
          <strong>{{ domainName }}</strong>.
        </p>

        <div class="seed-option">
          <Checkbox v-model="seedOverwrite" :binary="true" inputId="seedOverwrite" />
          <label for="seedOverwrite">Sobrescribir configuraciones existentes</label>
        </div>

        <Message v-if="seedOverwrite" severity="warn" :closable="false">
          Las configuraciones existentes con los mismos intents serán eliminadas primero.
        </Message>

        <!-- Seed Results -->
        <div v-if="lastSeedResult" class="seed-results">
          <Message :severity="lastSeedResult.success ? 'success' : 'warn'" :closable="false">
            <template #default>
              <div>
                <strong>{{ lastSeedResult.added }}</strong> configuraciones creadas,
                <strong>{{ lastSeedResult.skipped }}</strong> omitidas
              </div>
              <div v-if="lastSeedResult.errors?.length" class="seed-errors">
                <small>Errores:</small>
                <ul>
                  <li v-for="(error, idx) in lastSeedResult.errors" :key="idx">{{ error }}</li>
                </ul>
              </div>
            </template>
          </Message>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="closeSeedDialog" />
        <Button
          label="Sembrar"
          icon="pi pi-database"
          @click="seedDefaults"
          :loading="seedingConfigs"
        />
      </template>
    </Dialog>

    <!-- Import Dialog -->
    <Dialog
      v-model:visible="showImportDialog"
      header="Importar Configuraciones"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="import-dialog-content">
        <div class="field">
          <label>Archivo JSON</label>
          <FileUpload
            mode="basic"
            accept=".json"
            :maxFileSize="1000000"
            chooseLabel="Seleccionar archivo"
            :auto="false"
            @select="onFileSelect"
          />
          <small class="text-muted">Formato: archivo JSON exportado desde esta página</small>
        </div>

        <!-- Preview -->
        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>Vista previa ({{ importPreview.length }} configuraciones)</h4>
          <DataTable :value="importPreview" size="small" :rows="5" :paginator="importPreview.length > 5">
            <Column field="intent_key" header="Intent Key" style="width: 40%" />
            <Column field="display_name" header="Nombre" style="width: 35%" />
            <Column field="is_critical" header="Crítico" style="width: 25%">
              <template #body="{ data }">
                <Tag :value="data.is_critical ? 'Sí' : 'No'" :severity="data.is_critical ? 'danger' : 'secondary'" />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Import Results -->
        <div v-if="lastImportResult" class="import-results">
          <Message :severity="lastImportResult.success ? 'success' : 'warn'" :closable="false">
            <template #default>
              <div>
                <strong>{{ lastImportResult.created }}</strong> configuraciones importadas,
                <strong>{{ lastImportResult.skipped }}</strong> omitidas
              </div>
              <div v-if="lastImportResult.errors?.length" class="import-errors">
                <small>Errores:</small>
                <ul>
                  <li v-for="(error, idx) in lastImportResult.errors" :key="idx">{{ error }}</li>
                </ul>
              </div>
            </template>
          </Message>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="closeImportDialog" />
        <Button
          label="Importar"
          icon="pi pi-upload"
          @click="importConfigs"
          :loading="importing"
          :disabled="importPreview.length === 0"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, toRef } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import FileUpload from 'primevue/fileupload'

import { useResponseConfigs } from '@/composables/useResponseConfigs'
import { useResponseConfigDialog } from '@/composables/useResponseConfigDialog'
import type { DomainKey } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

// Props
const props = defineProps<{
  domain: DomainKey | null
}>()

// Emits
const emit = defineEmits<{
  (e: 'openSeed'): void
  (e: 'openImport'): void
  (e: 'export'): void
}>()

// Convert prop to ref for composables
const selectedDomain = toRef(props, 'domain')

// Response configs composable
const {
  configs,
  loading,
  expandedRows,
  searchQuery,
  showOnlyEnabled,
  showOnlyCritical,
  // Seed state
  seedingConfigs,
  showSeedDialog,
  seedOverwrite,
  lastSeedResult,
  // Import state
  importing,
  showImportDialog,
  importPreview,
  lastImportResult,
  // Computed
  organizationId,
  enabledConfigs,
  criticalConfigs,
  filteredConfigs,
  // Actions
  loadConfigs,
  onSearch,
  confirmDeleteConfig,
  toggleEnabled,
  toggleCritical,
  // Seed actions
  openSeedDialog,
  closeSeedDialog,
  seedDefaults,
  // Import actions
  openImportDialog,
  closeImportDialog,
  handleImportFileChange,
  importConfigs
} = useResponseConfigs(selectedDomain)

// Dialog composable
const {
  showDialog,
  saving,
  formData,
  isEditing,
  dialogTitle,
  submitLabel,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  saveConfig
} = useResponseConfigDialog(selectedDomain, organizationId, loadConfigs)

// Domain name for display
const domainName = computed(() => {
  if (!props.domain) return ''
  const domainConfig = AVAILABLE_DOMAINS.find(d => d.key === props.domain)
  return domainConfig?.name || props.domain
})

// Watch domain changes to reload
watch(() => props.domain, (newDomain) => {
  if (newDomain) {
    loadConfigs()
  }
}, { immediate: true })

// Helpers
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// File upload handler
function onFileSelect(event: { files: File[] }) {
  const file = event.files[0]
  if (file) {
    handleImportFileChange(file)
  }
}

// Expose methods for parent
defineExpose({
  openCreateDialog,
  openSeedDialog,
  openImportDialog,
  exportConfigs: () => {
    // Export is handled by composable
    const composable = useResponseConfigs(selectedDomain)
    composable.exportConfigs()
  }
})
</script>

<style scoped>
.response-configs-panel {
  padding: 0;
}

.stats-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.stat-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.empty-state i {
  font-size: 3rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  color: var(--text-color);
}

.empty-state p {
  color: var(--text-color-secondary);
  margin: 0;
}

.configs-table {
  background: var(--surface-card);
  border-radius: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.ml-3 {
  margin-left: 1rem;
}

.intent-key,
.template-key {
  font-family: monospace;
  font-size: 0.875rem;
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.task-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.expanded-content {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  margin: 0.5rem 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.full-description {
  background: var(--surface-card);
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.detail-label {
  color: var(--text-color-secondary);
  min-width: 120px;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-table {
  text-align: center;
  padding: 3rem;
}

.empty-table i {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  display: block;
}

.empty-table p {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

/* Dialog styles */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
  font-size: 0.875rem;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field {
  flex: 1;
}

.checkbox-field {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;
}

.checkbox-field label {
  font-weight: normal;
}

.checkbox-hint {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-left: 0.25rem;
}

.text-muted {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* Seed Dialog */
.seed-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.seed-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seed-results {
  margin-top: 1rem;
}

.seed-errors ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
}

/* Import Dialog */
.import-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-preview {
  margin-top: 1rem;
}

.import-preview h4 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
}

.import-results {
  margin-top: 1rem;
}

.import-errors ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
  }

  .table-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .field-row {
    flex-direction: column;
  }
}
</style>
