<script setup lang="ts">
/**
 * IntentPanel - Detail panel for intent nodes
 *
 * Shows intent information, editable patterns, and mapping configuration.
 */
import { ref, computed, watch } from 'vue'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import type { IntentNodeData } from '../types'
import type { IntentAgentMapping, FlowAgentConfig } from '@/types/intentConfigs.types'
import type { MatchType, PhrasePattern } from '@/types/domainIntents.types'
import { getStatusConfig } from '../types'
import { formatAgentName } from '../utils/graphLayout'
import { domainIntentsApi } from '@/api/domainIntents.api'
import EditablePatternList from './EditablePatternList.vue'
import EditablePhraseList from './EditablePhraseList.vue'

interface Props {
  data: IntentNodeData
  intentMappings: IntentAgentMapping[]
  flowAgents: FlowAgentConfig[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updateIntent', intentId: string, updates: Record<string, unknown>): void
  (e: 'deleteIntent', domainKey: string, intentId: string, intentName: string): void
  (e: 'createMapping', domainKey: string, intentKey: string, agentKey: string): void
  (e: 'updateMapping', mappingId: string, updates: Record<string, unknown>): void
  (e: 'deleteMapping', mappingId: string): void
  (e: 'refresh'): void
}>()

const toast = useToast()

// Local state
const editMode = ref(false)
const localIsEnabled = ref(props.data.isEnabled)
const selectedAgentKey = ref<string | null>(props.data.agentKey)
const confidenceThreshold = ref(props.data.confidence * 100)

// Loading states for pattern operations
const loadingLemmas = ref(false)
const loadingKeywords = ref(false)
const loadingPhrases = ref(false)
const loadingConfirmations = ref(false)

// Delete confirmation state
const showDeleteConfirm = ref(false)

// Watch for data changes
watch(() => props.data, (newData) => {
  localIsEnabled.value = newData.isEnabled
  selectedAgentKey.value = newData.agentKey
  confidenceThreshold.value = newData.confidence * 100
}, { immediate: true })

// Status
const statusConfig = computed(() => getStatusConfig(props.data.status))

// Intent ID helper
const intentId = computed(() => props.data.intent?.id ?? '')

// Available agents for mapping
const agentOptions = computed(() => {
  const agents = new Set<string>()
  props.intentMappings.forEach(m => agents.add(m.agent_key))
  props.flowAgents.forEach(f => agents.add(f.agent_key))
  return Array.from(agents).map(key => ({
    label: formatAgentName(key),
    value: key
  }))
})

// Check if agent is flow agent
const isFlowAgent = computed(() => {
  if (!selectedAgentKey.value) return false
  return props.flowAgents.some(
    f => f.agent_key === selectedAgentKey.value && f.is_flow_agent
  )
})

// Handlers
function toggleEdit() {
  editMode.value = !editMode.value
}

function handleEnableToggle() {
  if (!props.data.intent) return
  emit('updateIntent', props.data.intent.id, { is_enabled: localIsEnabled.value })
}

function handleAgentChange() {
  if (!selectedAgentKey.value) return

  if (props.data.mapping) {
    // Update existing mapping
    emit('updateMapping', props.data.mapping.id, { agent_key: selectedAgentKey.value })
  } else {
    // Create new mapping
    emit('createMapping', props.data.domainKey, props.data.intentKey, selectedAgentKey.value)
  }
}

function handleConfidenceChange() {
  if (!props.data.mapping) return
  emit('updateMapping', props.data.mapping.id, {
    confidence_threshold: confidenceThreshold.value / 100
  })
}

function handleDeleteMapping() {
  if (!props.data.mapping) return
  emit('deleteMapping', props.data.mapping.id)
}

function handleDeleteIntent() {
  if (!props.data.intent) return
  emit('deleteIntent', props.data.domainKey, props.data.intent.id, props.data.intentName)
  showDeleteConfirm.value = false
}

// Pattern CRUD handlers

// Lemmas
async function handleAddLemma(lemma: string) {
  if (!intentId.value) return
  loadingLemmas.value = true
  try {
    await domainIntentsApi.addLemmas(props.data.domainKey, intentId.value, [lemma])
    toast.add({
      severity: 'success',
      summary: 'Lemma agregado',
      detail: `"${lemma}" agregado correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo agregar el lemma',
      life: 3000
    })
  } finally {
    loadingLemmas.value = false
  }
}

async function handleRemoveLemma(lemma: string) {
  if (!intentId.value) return
  loadingLemmas.value = true
  try {
    await domainIntentsApi.removeLemmas(props.data.domainKey, intentId.value, [lemma])
    toast.add({
      severity: 'info',
      summary: 'Lemma eliminado',
      detail: `"${lemma}" eliminado correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el lemma',
      life: 3000
    })
  } finally {
    loadingLemmas.value = false
  }
}

// Keywords
async function handleAddKeyword(keyword: string) {
  if (!intentId.value) return
  loadingKeywords.value = true
  try {
    await domainIntentsApi.addKeywords(props.data.domainKey, intentId.value, [keyword])
    toast.add({
      severity: 'success',
      summary: 'Keyword agregado',
      detail: `"${keyword}" agregado correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo agregar el keyword',
      life: 3000
    })
  } finally {
    loadingKeywords.value = false
  }
}

async function handleRemoveKeyword(keyword: string) {
  if (!intentId.value) return
  loadingKeywords.value = true
  try {
    await domainIntentsApi.removeKeywords(props.data.domainKey, intentId.value, [keyword])
    toast.add({
      severity: 'info',
      summary: 'Keyword eliminado',
      detail: `"${keyword}" eliminado correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el keyword',
      life: 3000
    })
  } finally {
    loadingKeywords.value = false
  }
}

// Phrases
async function handleAddPhrase(phrase: string, matchType: MatchType) {
  if (!intentId.value) return
  loadingPhrases.value = true
  try {
    const phrasePattern: PhrasePattern = { value: phrase, match_type: matchType }
    await domainIntentsApi.addPhrases(props.data.domainKey, intentId.value, [phrasePattern])
    toast.add({
      severity: 'success',
      summary: 'Frase agregada',
      detail: `"${phrase}" agregada correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo agregar la frase',
      life: 3000
    })
  } finally {
    loadingPhrases.value = false
  }
}

async function handleRemovePhrase(phrase: string) {
  if (!intentId.value) return
  loadingPhrases.value = true
  try {
    await domainIntentsApi.removePhrases(props.data.domainKey, intentId.value, [phrase])
    toast.add({
      severity: 'info',
      summary: 'Frase eliminada',
      detail: `"${phrase}" eliminada correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar la frase',
      life: 3000
    })
  } finally {
    loadingPhrases.value = false
  }
}

// Confirmations
async function handleAddConfirmation(pattern: string, matchType: MatchType) {
  if (!intentId.value) return
  loadingConfirmations.value = true
  try {
    const confirmPattern: PhrasePattern = { value: pattern, match_type: matchType }
    await domainIntentsApi.addConfirmations(props.data.domainKey, intentId.value, [confirmPattern])
    toast.add({
      severity: 'success',
      summary: 'Confirmacion agregada',
      detail: `"${pattern}" agregada correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo agregar la confirmacion',
      life: 3000
    })
  } finally {
    loadingConfirmations.value = false
  }
}

// Confirmations - Remove
async function handleRemoveConfirmation(pattern: string) {
  if (!intentId.value) return
  loadingConfirmations.value = true
  try {
    await domainIntentsApi.removeConfirmations(props.data.domainKey, intentId.value, [pattern])
    toast.add({
      severity: 'info',
      summary: 'Confirmacion eliminada',
      detail: `"${pattern}" eliminada correctamente`,
      life: 2000
    })
    emit('refresh')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar la confirmacion',
      life: 3000
    })
  } finally {
    loadingConfirmations.value = false
  }
}
</script>

<template>
  <div class="intent-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-info">
        <div class="header-row">
          <h3>{{ data.intentName }}</h3>
          <Tag
            :value="statusConfig.label"
            :style="{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }"
          />
        </div>
        <p class="intent-key">{{ data.intentKey }}</p>
      </div>
      <div class="header-actions">
        <ToggleSwitch
          v-model="localIsEnabled"
          @change="handleEnableToggle"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          @click="showDeleteConfirm = true"
          v-tooltip="'Eliminar intent'"
        />
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="delete-confirm">
      <div class="delete-confirm-content">
        <i class="pi pi-exclamation-triangle" />
        <span>Eliminar "{{ data.intentName }}"?</span>
      </div>
      <div class="delete-confirm-actions">
        <Button label="Cancelar" severity="secondary" text size="small" @click="showDeleteConfirm = false" />
        <Button label="Eliminar" severity="danger" size="small" @click="handleDeleteIntent" />
      </div>
    </div>

    <Divider />

    <!-- Pattern Summary -->
    <div class="section">
      <h4>Patrones de deteccion</h4>
      <div class="pattern-summary">
        <div class="pattern-stat" title="Lemmas">
          <i class="pi pi-book" />
          <span>{{ data.lemmaCount }} lemmas</span>
        </div>
        <div class="pattern-stat" title="Frases">
          <i class="pi pi-comments" />
          <span>{{ data.phraseCount }} frases</span>
        </div>
        <div class="pattern-stat" title="Keywords">
          <i class="pi pi-key" />
          <span>{{ data.keywordCount }} keywords</span>
        </div>
      </div>

      <!-- Editable patterns -->
      <div v-if="data.intent" class="patterns-detail">
        <!-- Lemmas -->
        <EditablePatternList
          :items="data.intent.lemmas || []"
          label="Lemmas"
          severity="secondary"
          placeholder="Agregar lemma..."
          :loading="loadingLemmas"
          @add="handleAddLemma"
          @remove="handleRemoveLemma"
        />

        <!-- Keywords -->
        <EditablePatternList
          :items="data.intent.keywords || []"
          label="Keywords"
          severity="info"
          placeholder="Agregar keyword..."
          :loading="loadingKeywords"
          @add="handleAddKeyword"
          @remove="handleRemoveKeyword"
        />

        <!-- Phrases -->
        <EditablePhraseList
          :phrases="data.intent.phrases || []"
          label="Frases"
          severity="success"
          placeholder="Nueva frase..."
          :loading="loadingPhrases"
          @add="handleAddPhrase"
          @remove="handleRemovePhrase"
        />

        <!-- Confirmation Patterns -->
        <EditablePhraseList
          v-if="data.intent.confirmation_patterns && data.intent.confirmation_patterns.length > 0"
          :phrases="data.intent.confirmation_patterns"
          label="Confirmaciones"
          severity="warn"
          placeholder="Nuevo patron..."
          :loading="loadingConfirmations"
          :is-confirmation="true"
          @add="handleAddConfirmation"
          @remove="handleRemoveConfirmation"
        />
      </div>
    </div>

    <Divider />

    <!-- Agent Mapping -->
    <div class="section">
      <h4>Mapeo a Agente</h4>

      <div class="mapping-config">
        <div class="config-row">
          <label>Agente destino</label>
          <Select
            v-model="selectedAgentKey"
            :options="agentOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar agente"
            class="w-full"
            @change="handleAgentChange"
          />
        </div>

        <div v-if="selectedAgentKey" class="config-row">
          <div class="agent-info">
            <i class="pi pi-android" />
            <span>{{ formatAgentName(selectedAgentKey) }}</span>
            <Tag
              v-if="isFlowAgent"
              value="FLOW"
              severity="warn"
              class="flow-badge"
            />
          </div>
        </div>

        <div v-if="data.mapping" class="config-row">
          <label>Umbral de confianza: {{ confidenceThreshold.toFixed(0) }}%</label>
          <Slider
            v-model="confidenceThreshold"
            :min="10"
            :max="100"
            class="w-full"
            @slideend="handleConfidenceChange"
          />
        </div>

        <div v-if="data.mapping" class="config-actions">
          <Button
            label="Eliminar mapeo"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="handleDeleteMapping"
          />
        </div>
      </div>

      <div v-if="!selectedAgentKey" class="no-mapping-warning">
        <i class="pi pi-exclamation-triangle" />
        <span>Este intent no esta mapeado a ningun agente</span>
      </div>
    </div>

    <!-- Mapping Details -->
    <div v-if="data.mapping" class="section">
      <h4>Detalles del mapeo</h4>
      <div class="mapping-details">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value monospace">{{ data.mapping.id.slice(0, 8) }}...</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Prioridad:</span>
          <span class="detail-value">{{ data.mapping.priority }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Requiere handoff:</span>
          <span class="detail-value">{{ data.mapping.requires_handoff ? 'Si' : 'No' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Habilitado:</span>
          <span class="detail-value">{{ data.mapping.is_enabled ? 'Si' : 'No' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intent-panel {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--red-50);
  border: 1px solid var(--red-200);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.delete-confirm-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--red-700);
  font-size: 0.875rem;
}

.delete-confirm-content i {
  color: var(--red-500);
}

.delete-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Dark mode overrides */
:root.dark .delete-confirm,
.dark-mode .delete-confirm,
[data-theme="dark"] .delete-confirm {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

:root.dark .delete-confirm-content,
.dark-mode .delete-confirm-content,
[data-theme="dark"] .delete-confirm-content {
  color: var(--red-400);
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.intent-key {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  font-family: monospace;
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

.pattern-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.pattern-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-color);
}

.pattern-stat i {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.patterns-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mapping-config {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.config-row label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
}

.agent-info i {
  color: var(--primary-color);
}

.flow-badge {
  font-size: 0.6rem;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
}

.no-mapping-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--yellow-50);
  border: 1px solid var(--yellow-200);
  border-radius: 0.375rem;
  color: var(--yellow-700);
  font-size: 0.875rem;
}

/* Dark mode overrides */
:root.dark .no-mapping-warning,
.dark-mode .no-mapping-warning,
[data-theme="dark"] .no-mapping-warning {
  background: rgba(234, 179, 8, 0.15);
  border-color: rgba(234, 179, 8, 0.3);
  color: var(--yellow-400);
}

:root.dark .agent-info,
.dark-mode .agent-info,
[data-theme="dark"] .agent-info {
  background: var(--surface-100);
}

:root.dark .mapping-details,
.dark-mode .mapping-details,
[data-theme="dark"] .mapping-details {
  background: var(--surface-100);
}

.mapping-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-color);
}

.monospace {
  font-family: monospace;
}

.w-full {
  width: 100%;
}
</style>
