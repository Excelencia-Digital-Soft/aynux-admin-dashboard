<template>
  <div class="domain-intents-panel">
    <!-- Stats Cards -->
    <div v-if="domain" class="stats-cards">
      <div class="stat-card">
        <i class="pi pi-list"></i>
        <div class="stat-content">
          <span class="stat-value">{{ intents.length }}</span>
          <span class="stat-label">Intents</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="pi pi-check-circle"></i>
        <div class="stat-content">
          <span class="stat-value">{{ enabledIntents }}</span>
          <span class="stat-label">Activos</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="pi pi-tags"></i>
        <div class="stat-content">
          <span class="stat-value">{{ totalPatterns }}</span>
          <span class="stat-label">Patrones</span>
        </div>
      </div>
    </div>

    <!-- No Domain Selected -->
    <div v-if="!domain" class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>Selecciona un Dominio</h3>
      <p>Elige un dominio del selector para ver y gestionar sus intents</p>
    </div>

    <!-- Intents Table -->
    <DataTable
      v-else
      :value="intents"
      :loading="loading"
      dataKey="id"
      stripedRows
      showGridlines
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[5, 10, 25, 50]"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} intents"
      v-model:expandedRows="expandedRows"
      class="intents-table"
    >
      <template #header>
        <div class="table-header">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Buscar intents..." @input="onSearch" />
          </span>
          <div class="header-actions">
            <ToggleSwitch v-model="showOnlyEnabled" />
            <label>Solo activos</label>
          </div>
        </div>
      </template>

      <Column expander style="width: 3rem" />

      <Column field="intent_key" header="Key" sortable style="min-width: 150px">
        <template #body="{ data }">
          <code class="intent-key">{{ data.intent_key }}</code>
        </template>
      </Column>

      <Column field="name" header="Nombre" sortable style="min-width: 200px" />

      <Column field="weight" header="Peso" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.weight.toFixed(2)" :severity="getWeightSeverity(data.weight)" />
        </template>
      </Column>

      <Column field="priority" header="Prioridad" sortable style="width: 100px">
        <template #body="{ data }">
          <span class="priority-badge">{{ data.priority }}</span>
        </template>
      </Column>

      <Column field="is_enabled" header="Estado" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.is_enabled ? 'Activo' : 'Inactivo'" :severity="data.is_enabled ? 'success' : 'secondary'" />
        </template>
      </Column>

      <Column header="Patrones" style="width: 200px">
        <template #body="{ data }">
          <div class="pattern-counts">
            <span v-if="getLemmaCount(data) > 0" class="pattern-badge lemma" v-tooltip="'Lemmas'">
              <i class="pi pi-book"></i> {{ getLemmaCount(data) }}
            </span>
            <span v-if="getPhraseCount(data) > 0" class="pattern-badge phrase" v-tooltip="'Frases'">
              <i class="pi pi-comments"></i> {{ getPhraseCount(data) }}
            </span>
            <span v-if="getConfirmationCount(data) > 0" class="pattern-badge confirmation" v-tooltip="'Confirmaciones'">
              <i class="pi pi-check-circle"></i> {{ getConfirmationCount(data) }}
            </span>
            <span v-if="getKeywordCount(data) > 0" class="pattern-badge keyword" v-tooltip="'Keywords'">
              <i class="pi pi-key"></i> {{ getKeywordCount(data) }}
            </span>
          </div>
        </template>
      </Column>

      <Column header="Acciones" style="width: 150px">
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
              @click="confirmDeleteIntent(data)"
            />
          </div>
        </template>
      </Column>

      <!-- Expanded Row - Pattern Details -->
      <template #expansion="{ data }">
        <div class="expanded-content">
          <Tabs value="0">
            <TabList>
              <Tab value="0">
                <i class="pi pi-book mr-2"></i>Lemmas ({{ getLemmaCount(data) }})
              </Tab>
              <Tab value="1">
                <i class="pi pi-comments mr-2"></i>Frases ({{ getPhraseCount(data) }})
              </Tab>
              <Tab value="2">
                <i class="pi pi-check-circle mr-2"></i>Confirmaciones ({{ getConfirmationCount(data) }})
              </Tab>
              <Tab value="3">
                <i class="pi pi-key mr-2"></i>Keywords ({{ getKeywordCount(data) }})
              </Tab>
            </TabList>
            <TabPanels>
              <!-- Lemmas Panel -->
              <TabPanel value="0">
                <div class="pattern-section">
                  <div class="pattern-input-row">
                    <InputText
                      v-model="newLemma"
                      placeholder="Agregar lemma (Enter para guardar)"
                      @keyup.enter="addLemma(data)"
                    />
                    <Button icon="pi pi-plus" @click="addLemma(data)" :disabled="!newLemma" />
                  </div>
                  <div class="pattern-chips">
                    <Chip
                      v-for="lemma in getLemmas(data)"
                      :key="lemma"
                      :label="lemma"
                      removable
                      @remove="removeLemma(data, lemma)"
                    />
                    <span v-if="getLemmaCount(data) === 0" class="no-patterns">
                      No hay lemmas configurados
                    </span>
                  </div>
                </div>
              </TabPanel>

              <!-- Phrases Panel -->
              <TabPanel value="1">
                <div class="pattern-section">
                  <div class="pattern-input-row phrase-input">
                    <InputText
                      v-model="newPhrase.value"
                      placeholder="Agregar frase"
                      class="phrase-text"
                    />
                    <Select
                      v-model="newPhrase.match_type"
                      :options="matchTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Tipo"
                      class="match-type-select"
                    />
                    <Button icon="pi pi-plus" @click="addPhrase(data)" :disabled="!newPhrase.value" />
                  </div>
                  <DataTable :value="getPhrases(data)" size="small" class="pattern-table">
                    <Column field="phrase" header="Frase" />
                    <Column field="match_type" header="Tipo" style="width: 120px">
                      <template #body="{ data: phraseData }">
                        <Tag :value="getMatchTypeLabel(phraseData.match_type)" :severity="getMatchTypeSeverity(phraseData.match_type)" />
                      </template>
                    </Column>
                    <Column style="width: 60px">
                      <template #body="{ data: phraseData }">
                        <Button icon="pi pi-trash" severity="danger" text size="small" @click="removePhrase(data, phraseData.phrase)" />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </TabPanel>

              <!-- Confirmations Panel -->
              <TabPanel value="2">
                <div class="pattern-section">
                  <div class="pattern-input-row phrase-input">
                    <InputText
                      v-model="newConfirmation.value"
                      placeholder="Agregar confirmación"
                      class="phrase-text"
                    />
                    <Select
                      v-model="newConfirmation.match_type"
                      :options="matchTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Tipo"
                      class="match-type-select"
                    />
                    <Button icon="pi pi-plus" @click="addConfirmation(data)" :disabled="!newConfirmation.value" />
                  </div>
                  <DataTable :value="getConfirmations(data)" size="small" class="pattern-table">
                    <Column field="pattern" header="Confirmación" />
                    <Column field="pattern_type" header="Tipo" style="width: 120px">
                      <template #body="{ data: confData }">
                        <Tag :value="getMatchTypeLabel(confData.pattern_type)" :severity="getMatchTypeSeverity(confData.pattern_type)" />
                      </template>
                    </Column>
                    <Column style="width: 60px">
                      <template #body>
                        <Button icon="pi pi-trash" severity="danger" text size="small" disabled v-tooltip="'Eliminar via edición de intent'" />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </TabPanel>

              <!-- Keywords Panel -->
              <TabPanel value="3">
                <div class="pattern-section">
                  <div class="pattern-input-row">
                    <InputText
                      v-model="newKeyword"
                      placeholder="Agregar keyword (Enter para guardar)"
                      @keyup.enter="addKeyword(data)"
                    />
                    <Button icon="pi pi-plus" @click="addKeyword(data)" :disabled="!newKeyword" />
                  </div>
                  <div class="pattern-chips">
                    <Chip
                      v-for="keyword in getKeywords(data)"
                      :key="keyword"
                      :label="keyword"
                      removable
                      @remove="removeKeyword(data, keyword)"
                    />
                    <span v-if="getKeywordCount(data) === 0" class="no-patterns">
                      No hay keywords configurados
                    </span>
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </template>

      <template #empty>
        <div class="empty-table">
          <i class="pi pi-inbox"></i>
          <p>No hay intents configurados para este dominio</p>
          <Button label="Crear primer intent" icon="pi pi-plus" @click="openCreateDialog" />
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="dialogTitle()"
      :modal="true"
      :style="{ width: '500px' }"
      class="intent-dialog"
    >
      <div class="dialog-content">
        <div class="field">
          <label for="intent_key">Intent Key *</label>
          <InputText
            id="intent_key"
            v-model="formData.intent_key"
            :disabled="isEditing()"
            placeholder="ej: check_stock, request_price"
            class="w-full"
          />
          <small class="text-muted">Identificador único del intent (snake_case)</small>
        </div>

        <div class="field">
          <label for="name">Nombre *</label>
          <InputText
            id="name"
            v-model="formData.name"
            placeholder="ej: Consulta de Stock"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="description">Descripción</label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="3"
            placeholder="Descripción del intent y cuándo se activa"
            class="w-full"
          />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="weight">Peso</label>
            <InputNumber
              id="weight"
              v-model="formData.weight"
              :min="0"
              :max="9.99"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
          <div class="field">
            <label for="priority">Prioridad</label>
            <InputNumber
              id="priority"
              v-model="formData.priority"
              :min="0"
              :max="100"
              class="w-full"
            />
          </div>
        </div>

        <div class="field-row">
          <div class="field checkbox-field">
            <Checkbox v-model="formData.is_enabled" :binary="true" inputId="is_enabled" />
            <label for="is_enabled">Activo</label>
          </div>
          <div class="field checkbox-field">
            <Checkbox v-model="formData.exact_match" :binary="true" inputId="exact_match" />
            <label for="exact_match">Match Exacto</label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="closeDialog" />
        <Button
          :label="submitLabel()"
          icon="pi pi-check"
          @click="saveIntent"
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Seed Dialog -->
    <Dialog
      v-model:visible="showSeedDialog"
      header="Sembrar Intents por Defecto"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="seed-dialog-content">
        <p>
          Esto creará los intents predefinidos para el dominio
          <strong>{{ domainName }}</strong>.
        </p>

        <div class="seed-option">
          <Checkbox v-model="seedOverwrite" :binary="true" inputId="seedOverwrite" />
          <label for="seedOverwrite">Sobrescribir intents existentes</label>
        </div>

        <Message v-if="seedOverwrite" severity="warn" :closable="false">
          Los intents existentes con las mismas claves serán reemplazados.
        </Message>

        <div v-if="lastSeedResult" class="seed-results">
          <Message :severity="lastSeedResult.success ? 'success' : 'warn'" :closable="false">
            <template #default>
              <div>
                <strong>{{ lastSeedResult.added }}</strong> intents creados,
                <strong>{{ lastSeedResult.skipped }}</strong> omitidos
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
          :loading="seedingIntents"
        />
      </template>
    </Dialog>

    <!-- Import Dialog -->
    <Dialog
      v-model:visible="showImportDialog"
      header="Importar Intents"
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

        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>Vista previa ({{ importPreview.length }} intents)</h4>
          <DataTable :value="importPreview" size="small" :rows="5" :paginator="importPreview.length > 5">
            <Column field="intent_key" header="Key" style="width: 40%" />
            <Column field="name" header="Nombre" style="width: 40%" />
            <Column field="priority" header="Prioridad" style="width: 20%" />
          </DataTable>
        </div>

        <div v-if="lastImportResult" class="import-results">
          <Message :severity="lastImportResult.success ? 'success' : 'warn'" :closable="false">
            <template #default>
              <div>
                <strong>{{ lastImportResult.created }}</strong> intents importados,
                <strong>{{ lastImportResult.skipped }}</strong> omitidos
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
          @click="importIntents"
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
import { ref, computed, watch, toRef } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import FileUpload from 'primevue/fileupload'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

import { useDomainIntentsPanel } from '@/composables/useDomainIntentsPanel'
import { useIntentPatterns } from '@/composables/useIntentPatterns'
import { useIntentDialog } from '@/composables/useIntentDialog'
import type { DomainKey } from '@/types/domainIntents.types'
import { AVAILABLE_DOMAINS } from '@/types/domainIntents.types'

// Props
const props = defineProps<{
  domain: DomainKey | null
}>()

// Convert prop to ref
const selectedDomain = toRef(props, 'domain')

// Domain name for display
const domainName = computed(() => {
  if (!props.domain) return ''
  const domainConfig = AVAILABLE_DOMAINS.find(d => d.key === props.domain)
  return domainConfig?.name || props.domain
})

// Domain Intents composable (panel version - receives domain as prop)
const {
  intents,
  loading,
  expandedRows,
  searchQuery,
  showOnlyEnabled,
  // Seed state
  seedingIntents,
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
  enabledIntents,
  totalPatterns,
  // Actions
  loadIntents,
  onSearch,
  confirmDeleteIntent,
  // Seed actions
  openSeedDialog,
  closeSeedDialog,
  seedDefaults,
  // Export/Import actions
  exportIntents,
  openImportDialog,
  closeImportDialog,
  handleImportFileChange,
  importIntents
} = useDomainIntentsPanel(selectedDomain)

// Intent Patterns composable
const {
  newLemma,
  newKeyword,
  newPhrase,
  newConfirmation,
  matchTypeOptions,
  getLemmas,
  getPhrases,
  getConfirmations,
  getKeywords,
  getLemmaCount,
  getPhraseCount,
  getConfirmationCount,
  getKeywordCount,
  getMatchTypeLabel,
  getMatchTypeSeverity,
  addLemma,
  addKeyword,
  addPhrase,
  addConfirmation,
  removeLemma,
  removePhrase,
  removeKeyword
} = useIntentPatterns(selectedDomain, loadIntents)

// Intent Dialog composable
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
  saveIntent
} = useIntentDialog(selectedDomain, organizationId, loadIntents)

// Watch domain changes
watch(() => props.domain, (newDomain) => {
  if (newDomain) {
    loadIntents()
  }
}, { immediate: true })

// UI helpers
function getWeightSeverity(weight: number): string {
  if (weight >= 1.5) return 'danger'
  if (weight >= 1.2) return 'warning'
  if (weight >= 1.0) return 'success'
  return 'secondary'
}

// FileUpload event handler
function onFileSelect(event: { files: File[] }) {
  handleImportFileChange(event.files[0] || null)
}

// Expose methods for parent
defineExpose({
  openCreateDialog,
  openSeedDialog,
  openImportDialog,
  exportIntents
})
</script>

<style scoped>
.domain-intents-panel {
  padding: 0;
}

.stats-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  min-width: 150px;
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
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--text-color-secondary);
  margin: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.intent-key {
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
  font-weight: 600;
}

.pattern-counts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pattern-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.pattern-badge.lemma {
  background: #dbeafe;
  color: #1d4ed8;
}

.pattern-badge.phrase {
  background: #dcfce7;
  color: #15803d;
}

.pattern-badge.confirmation {
  background: #fef3c7;
  color: #b45309;
}

.pattern-badge.keyword {
  background: #fce7f3;
  color: #be185d;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.expanded-content {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.pattern-section {
  padding: 1rem 0;
}

.pattern-input-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.pattern-input-row.phrase-input .phrase-text {
  flex: 1;
}

.pattern-input-row.phrase-input .match-type-select {
  width: 150px;
}

.pattern-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.no-patterns {
  color: var(--text-color-secondary);
  font-style: italic;
}

.pattern-table {
  margin-top: 0.5rem;
}

.empty-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  text-align: center;
}

.empty-table i {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-table p {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-weight: 500;
}

.field .text-muted {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
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

.mr-2 {
  margin-right: 0.5rem;
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
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.import-results {
  margin-top: 1rem;
}

/* Dark mode adjustments */
:deep(.dark-mode) .pattern-badge.lemma {
  background: #1e3a5f;
  color: #93c5fd;
}

:deep(.dark-mode) .pattern-badge.phrase {
  background: #14532d;
  color: #86efac;
}

:deep(.dark-mode) .pattern-badge.confirmation {
  background: #713f12;
  color: #fcd34d;
}

:deep(.dark-mode) .pattern-badge.keyword {
  background: #701a75;
  color: #f9a8d4;
}
</style>
