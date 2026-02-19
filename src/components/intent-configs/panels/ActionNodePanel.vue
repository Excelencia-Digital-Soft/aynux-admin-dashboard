<script setup lang="ts">
/**
 * ActionNodePanel - Config panel for action nodes
 * Shows node details, awaiting types, and routing configs targeting this node
 */
import Tag from 'primevue/tag'
import InputSwitch from 'primevue/inputswitch'
import DetectionPatternsSection from './DetectionPatternsSection.vue'
import type { TopologyNodeData, RoutingConfigSummary, AwaitingTypeConfigSummary } from '../types'

interface Props {
  data: TopologyNodeData
  routingConfigs: RoutingConfigSummary[]
  awaitingTypeConfigs: AwaitingTypeConfigSummary[]
  domainKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggleRoutingConfig', configId: string, enabled: boolean): void
  (e: 'toggleAwaitingConfig', configId: string, enabled: boolean): void
  (e: 'updateRoutingConfig', configId: string, updates: Record<string, unknown>): void
}>()

function handleToggleRouting(config: RoutingConfigSummary) {
  emit('toggleRoutingConfig', config.id, !config.is_enabled)
}

function handleToggleAwaiting(config: AwaitingTypeConfigSummary) {
  emit('toggleAwaitingConfig', config.id, !config.is_enabled)
}

function handleToggleClearsContext(config: RoutingConfigSummary) {
  emit('updateRoutingConfig', config.id, { clears_context: !config.clears_context })
}

function handleToggleEscapeIntent(config: RoutingConfigSummary) {
  emit('updateRoutingConfig', config.id, { metadata: { is_escape_intent: !config.is_escape_intent } })
}
</script>

<template>
  <div class="action-panel">
    <div class="panel-header">
      <i :class="['pi', data.icon]" :style="{ color: data.color }" />
      <h3>{{ data.displayName }}</h3>
    </div>

    <p class="panel-description">{{ data.description }}</p>

    <!-- Awaiting Types Section -->
    <div v-if="awaitingTypeConfigs.length > 0" class="section">
      <h4 class="section-title">
        <i class="pi pi-clock" />
        Awaiting Types
      </h4>
      <div class="config-list">
        <div
          v-for="config in awaitingTypeConfigs"
          :key="config.id"
          class="config-item"
          :class="{ disabled: !config.is_enabled }"
        >
          <div class="config-row">
            <code class="awaiting-type">{{ config.awaiting_type }}</code>
            <InputSwitch
              :modelValue="config.is_enabled"
              @update:modelValue="() => handleToggleAwaiting(config)"
              class="small-switch"
            />
          </div>
          <div v-if="config.valid_response_intents.length > 0" class="response-intents">
            <span class="label">Intents validos:</span>
            <Tag
              v-for="intent in config.valid_response_intents"
              :key="intent"
              :value="intent"
              severity="info"
              class="mini-tag"
            />
          </div>
          <div v-if="config.display_name" class="config-name">
            {{ config.display_name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Accepts Awaiting Types (static) -->
    <div v-if="data.acceptsAwaitingTypes.length > 0" class="section">
      <h4 class="section-title">
        <i class="pi pi-check-circle" />
        Acepta tipos
      </h4>
      <div class="tags-row">
        <Tag
          v-for="at in data.acceptsAwaitingTypes"
          :key="at"
          :value="at"
          severity="secondary"
        />
      </div>
    </div>

    <!-- Routing Configs Targeting This Node -->
    <div v-if="routingConfigs.length > 0" class="section">
      <h4 class="section-title">
        <i class="pi pi-directions" />
        Routing Configs ({{ routingConfigs.length }})
      </h4>
      <div class="config-list">
        <div
          v-for="config in routingConfigs"
          :key="config.id"
          class="config-item"
          :class="{ disabled: !config.is_enabled }"
        >
          <div class="config-row">
            <div class="config-info">
              <Tag :value="config.config_type" severity="secondary" class="mini-tag" />
              <code>{{ config.trigger_value }}</code>
            </div>
            <InputSwitch
              :modelValue="config.is_enabled"
              @update:modelValue="() => handleToggleRouting(config)"
              class="small-switch"
              v-tooltip.left="'Activa o desactiva esta regla. Si esta desactivada, el trigger no sera procesado por el router.'"
            />
          </div>
          <div class="config-target-line">
            <i class="pi pi-arrow-right" />
            <span>{{ config.target_intent }}</span>
          </div>
          <div class="config-flags">
            <label class="flag-toggle">
              <InputSwitch
                :modelValue="config.clears_context"
                @update:modelValue="() => handleToggleClearsContext(config)"
                class="tiny-switch"
              />
              <span>Clear ctx</span>
              <i class="pi pi-question-circle help-icon" v-tooltip.top="'Limpia el contexto pendiente (awaiting_input) al activar esta ruta. Util para keywords como cancelar o hola que reinician el flujo.'" />
            </label>
            <label v-if="config.config_type === 'global_keyword'" class="flag-toggle">
              <InputSwitch
                :modelValue="config.is_escape_intent"
                @update:modelValue="() => handleToggleEscapeIntent(config)"
                class="tiny-switch"
              />
              <span>Escape</span>
              <i class="pi pi-question-circle help-icon" v-tooltip.top="'Permite interrumpir un flujo en espera (awaiting_input) para ejecutar esta accion. Sin esto, el keyword solo funciona fuera de flujos activos.'" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Detection Patterns -->
    <DetectionPatternsSection
      v-if="routingConfigs.length > 0"
      :domain-key="domainKey"
      :routing-configs="routingConfigs"
    />

    <!-- Empty State -->
    <div v-if="routingConfigs.length === 0 && awaitingTypeConfigs.length === 0" class="empty-configs">
      <i class="pi pi-info-circle" />
      <p>No hay configuraciones para este nodo</p>
    </div>
  </div>
</template>

<style scoped>
.action-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.panel-header i {
  font-size: 1.1rem;
}

.panel-description {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.section {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.section-title {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.section-title i {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-item {
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 0.375rem;
  font-size: 0.8rem;
}

.config-item.disabled {
  opacity: 0.5;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.config-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.awaiting-type {
  padding: 1px 6px;
  background: var(--surface-card);
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
}

.response-intents {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.375rem;
}

.response-intents .label {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.config-name {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.config-target-line {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.config-target-line i {
  font-size: 0.6rem;
}

.mini-tag {
  font-size: 0.6rem !important;
  padding: 1px 6px !important;
}

.small-switch {
  transform: scale(0.75);
}

.config-flags {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.375rem;
  padding-top: 0.375rem;
  border-top: 1px dashed var(--surface-border);
}

.flag-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.65rem;
  color: var(--text-color-secondary);
}

.tiny-switch {
  transform: scale(0.6);
}

.help-icon {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
  cursor: help;
  transition: opacity 0.15s;
}

.help-icon:hover {
  opacity: 1;
}

.empty-configs {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.empty-configs i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-configs p {
  margin: 0;
  font-size: 0.8rem;
}
</style>
