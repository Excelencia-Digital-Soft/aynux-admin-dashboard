<script setup lang="ts">
/**
 * KeywordPanel - Detail panel for keyword group nodes
 *
 * Shows keywords for an agent with ability to add/remove.
 */
import { ref, computed } from 'vue'
import InputChips from 'primevue/inputchips'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Divider from 'primevue/divider'
import type { KeywordGroupNodeData } from '../types'
import type { KeywordAgentMapping, MatchType } from '@/types/intentConfigs.types'
import { formatAgentName } from '../utils/graphLayout'

interface Props {
  data: KeywordGroupNodeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'addKeywords', agentKey: string, keywords: string[]): void
  (e: 'deleteKeyword', keywordId: string): void
}>()

// Local state
const newKeywords = ref<string[]>([])
const searchFilter = ref('')

// Filtered keywords
const filteredKeywords = computed(() => {
  if (!searchFilter.value) return props.data.keywords
  const search = searchFilter.value.toLowerCase()
  return props.data.keywords.filter(k =>
    k.keyword.toLowerCase().includes(search)
  )
})

// Match type labels
const matchTypeLabels: Record<MatchType, string> = {
  exact: 'Exacto',
  contains: 'Contiene',
  prefix: 'Prefijo',
  regex: 'Regex'
}

// Handlers
function handleAddKeywords() {
  if (newKeywords.value.length === 0) return
  emit('addKeywords', props.data.agentKey, newKeywords.value)
  newKeywords.value = []
}

function handleDeleteKeyword(keywordId: string) {
  emit('deleteKeyword', keywordId)
}
</script>

<template>
  <div class="keyword-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-icon">
        <i class="pi pi-key" />
      </div>
      <div class="header-info">
        <h3>Keywords para {{ formatAgentName(data.agentKey) }}</h3>
        <p>{{ data.keywordCount }} keywords configurados</p>
      </div>
    </div>

    <Divider />

    <!-- Stats -->
    <div class="section">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ data.keywordCount }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value success">{{ data.enabledCount }}</span>
          <span class="stat-label">Activos</span>
        </div>
        <div class="stat-item">
          <span class="stat-value muted">{{ data.keywordCount - data.enabledCount }}</span>
          <span class="stat-label">Inactivos</span>
        </div>
      </div>
    </div>

    <Divider />

    <!-- Add Keywords -->
    <div class="section">
      <h4>Agregar keywords</h4>
      <div class="add-keywords-form">
        <InputChips
          v-model="newKeywords"
          separator=","
          placeholder="Escribe y presiona Enter o coma"
          class="w-full"
        />
        <Button
          label="Agregar"
          icon="pi pi-plus"
          :disabled="newKeywords.length === 0"
          @click="handleAddKeywords"
        />
      </div>
      <p class="form-hint">
        Separa múltiples keywords con coma o presiona Enter después de cada uno
      </p>
    </div>

    <Divider />

    <!-- Keywords List -->
    <div class="section">
      <div class="section-header">
        <h4>Keywords existentes</h4>
        <InputText
          v-model="searchFilter"
          placeholder="Buscar..."
          class="search-input"
        />
      </div>

      <DataTable
        :value="filteredKeywords"
        :rows="10"
        :paginator="filteredKeywords.length > 10"
        class="keywords-table"
        size="small"
        stripedRows
      >
        <Column field="keyword" header="Keyword" sortable>
          <template #body="{ data }">
            <span class="keyword-text">{{ data.keyword }}</span>
          </template>
        </Column>
        <Column field="match_type" header="Tipo" sortable style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="matchTypeLabels[data.match_type as MatchType]"
              severity="secondary"
            />
          </template>
        </Column>
        <Column field="is_enabled" header="Estado" style="width: 80px">
          <template #body="{ data }">
            <span
              class="status-indicator"
              :class="{ enabled: data.is_enabled, disabled: !data.is_enabled }"
            >
              {{ data.is_enabled ? 'ON' : 'OFF' }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 50px">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="handleDeleteKeyword(data.id)"
            />
          </template>
        </Column>
      </DataTable>

      <div v-if="filteredKeywords.length === 0" class="no-keywords">
        <i class="pi pi-search" />
        <span>No se encontraron keywords</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.keyword-panel {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
}

.header-icon i {
  font-size: 1.25rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color);
}

.header-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.section {
  padding: 0 0.25rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-header h4 {
  margin: 0;
}

.search-input {
  width: 150px;
  font-size: 0.875rem;
}

.stats-row {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-value.success {
  color: var(--green-500);
}

.stat-value.muted {
  color: var(--text-color-secondary);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.add-keywords-form {
  display: flex;
  gap: 0.5rem;
}

.form-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.keywords-table {
  font-size: 0.875rem;
}

.keyword-text {
  font-family: monospace;
}

.status-indicator {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-indicator.enabled {
  background: var(--green-100);
  color: var(--green-700);
}

.status-indicator.disabled {
  background: var(--red-100);
  color: var(--red-700);
}

/* Dark mode overrides */
:root.dark .status-indicator.enabled,
.dark-mode .status-indicator.enabled {
  background: rgba(34, 197, 94, 0.2);
  color: var(--green-400);
}

:root.dark .status-indicator.disabled,
.dark-mode .status-indicator.disabled {
  background: rgba(239, 68, 68, 0.2);
  color: var(--red-400);
}

.no-keywords {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.w-full {
  width: 100%;
  flex: 1;
}
</style>
