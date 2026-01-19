<script setup lang="ts">
/**
 * AgentPanel - Detail panel for agent nodes
 *
 * Shows agent information, flow configuration, and incoming mappings.
 */
import { ref, computed, watch } from 'vue'
import ToggleSwitch from 'primevue/toggleswitch'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import type { AgentNodeData } from '../types'
import type { IntentAgentMapping, FlowAgentConfig } from '@/types/intentConfigs.types'

interface Props {
  data: AgentNodeData
  intentMappings: IntentAgentMapping[]
  flowAgents: FlowAgentConfig[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updateFlowAgent', agentKey: string, updates: Record<string, unknown>): void
}>()

// Local state for flow config
const isFlowAgent = ref(props.data.isFlowAgent)
const maxTurns = ref(props.data.flowConfig?.max_turns || 10)
const isEnabled = ref(props.data.isEnabled)

// Watch for data changes
watch(() => props.data, (newData) => {
  isFlowAgent.value = newData.isFlowAgent
  maxTurns.value = newData.flowConfig?.max_turns || 10
  isEnabled.value = newData.isEnabled
}, { immediate: true })

// Incoming mappings for this agent
const incomingMappings = computed(() => {
  return props.intentMappings.filter(m => m.agent_key === props.data.agentKey)
})

// Handlers
function handleFlowToggle() {
  emit('updateFlowAgent', props.data.agentKey, { is_flow_agent: isFlowAgent.value })
}

function handleMaxTurnsChange() {
  emit('updateFlowAgent', props.data.agentKey, { max_turns: maxTurns.value })
}

function handleEnableToggle() {
  emit('updateFlowAgent', props.data.agentKey, { is_enabled: isEnabled.value })
}
</script>

<template>
  <div class="agent-panel">
    <!-- Header -->
    <div class="panel-header" :style="{ borderLeftColor: data.color }">
      <div class="header-icon" :style="{ backgroundColor: data.color }">
        <i class="pi pi-android" />
      </div>
      <div class="header-info">
        <div class="header-row">
          <h3>{{ data.displayName }}</h3>
          <Tag
            v-if="data.isFlowAgent"
            value="FLOW"
            severity="warning"
          />
        </div>
        <p class="agent-key">{{ data.agentKey }}</p>
      </div>
    </div>

    <Divider />

    <!-- Stats -->
    <div class="section">
      <h4>Estadísticas</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ data.mappingCount }}</span>
          <span class="stat-label">Intents mapeados</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ data.keywordCount }}</span>
          <span class="stat-label">Keywords</span>
        </div>
      </div>
    </div>

    <Divider />

    <!-- Flow Configuration -->
    <div class="section">
      <h4>Configuración de Flow</h4>

      <div class="flow-config">
        <div class="config-row">
          <div class="config-label">
            <span>Flow Agent</span>
            <span class="config-hint">Permite conversaciones multi-turno</span>
          </div>
          <ToggleSwitch v-model="isFlowAgent" @change="handleFlowToggle" />
        </div>

        <div v-if="isFlowAgent" class="config-row">
          <div class="config-label">
            <span>Max turnos</span>
            <span class="config-hint">Límite de turnos de conversación</span>
          </div>
          <InputNumber
            v-model="maxTurns"
            :min="1"
            :max="50"
            showButtons
            buttonLayout="horizontal"
            :step="1"
            class="max-turns-input"
            @update:model-value="handleMaxTurnsChange"
          />
        </div>

        <div class="config-row">
          <div class="config-label">
            <span>Habilitado</span>
            <span class="config-hint">El agente está activo</span>
          </div>
          <ToggleSwitch v-model="isEnabled" @change="handleEnableToggle" />
        </div>
      </div>

      <div v-if="data.flowConfig" class="flow-details">
        <div class="detail-row">
          <span>Timeout:</span>
          <span>{{ data.flowConfig.timeout_seconds }}s</span>
        </div>
      </div>
    </div>

    <Divider />

    <!-- Incoming Mappings -->
    <div class="section">
      <h4>Intents entrantes ({{ incomingMappings.length }})</h4>

      <div v-if="incomingMappings.length > 0" class="mappings-list">
        <div
          v-for="mapping in incomingMappings"
          :key="mapping.id"
          class="mapping-item"
        >
          <div class="mapping-info">
            <span class="mapping-name">{{ mapping.intent_name }}</span>
            <span class="mapping-key">{{ mapping.intent_key }}</span>
          </div>
          <div class="mapping-meta">
            <Tag
              :value="`${(mapping.confidence_threshold * 100).toFixed(0)}%`"
              severity="secondary"
              class="confidence-tag"
            />
            <span
              class="status-dot"
              :class="{ enabled: mapping.is_enabled, disabled: !mapping.is_enabled }"
            />
          </div>
        </div>
      </div>

      <div v-else class="no-mappings">
        <i class="pi pi-info-circle" />
        <span>No hay intents mapeados a este agente</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-panel {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 1rem;
  border-left: 4px solid;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-icon i {
  font-size: 1.25rem;
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

.agent-key {
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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.flow-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-label {
  display: flex;
  flex-direction: column;
}

.config-label span:first-child {
  font-size: 0.9rem;
  color: var(--text-color);
}

.config-hint {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.max-turns-input {
  width: 120px;
}

.flow-details {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.detail-row span:first-child {
  color: var(--text-color-secondary);
}

.mappings-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.mapping-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
}

.mapping-info {
  display: flex;
  flex-direction: column;
}

.mapping-name {
  font-size: 0.875rem;
  color: var(--text-color);
}

.mapping-key {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.mapping-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confidence-tag {
  font-size: 0.65rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.enabled {
  background: var(--green-500);
}

.status-dot.disabled {
  background: var(--red-500);
}

.no-mappings {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}
</style>
