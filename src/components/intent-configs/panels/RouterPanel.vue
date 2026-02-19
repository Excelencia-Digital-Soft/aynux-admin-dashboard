<script setup lang="ts">
/**
 * RouterPanel - Config panel for the Router Supervisor node
 * Shows all routing configs grouped by config_type
 */
import { computed } from 'vue'
import Tag from 'primevue/tag'
import InputSwitch from 'primevue/inputswitch'
import DetectionPatternsSection from './DetectionPatternsSection.vue'
import type { RoutingConfigSummary } from '../types'

interface Props {
  routingConfigs: RoutingConfigSummary[]
  domainKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggleConfig', configId: string, enabled: boolean): void
  (e: 'updateConfig', configId: string, updates: Record<string, unknown>): void
}>()

function handleToggleEnabled(config: RoutingConfigSummary) {
  emit('toggleConfig', config.id, !config.is_enabled)
}

function handleToggleClearsContext(config: RoutingConfigSummary) {
  emit('updateConfig', config.id, { clears_context: !config.clears_context })
}

function handleToggleEscapeIntent(config: RoutingConfigSummary) {
  emit('updateConfig', config.id, { metadata: { is_escape_intent: !config.is_escape_intent } })
}

// Group by config_type
const groupedConfigs = computed(() => {
  const groups: Record<string, RoutingConfigSummary[]> = {}
  for (const config of props.routingConfigs) {
    if (!groups[config.config_type]) {
      groups[config.config_type] = []
    }
    groups[config.config_type].push(config)
  }
  // Sort each group by priority desc
  for (const type of Object.keys(groups)) {
    groups[type].sort((a, b) => b.priority - a.priority)
  }
  return groups
})

const configTypeLabels: Record<string, string> = {
  global_keyword: 'Global Keywords',
  button_mapping: 'Button Mappings',
  menu_option: 'Menu Options',
  list_selection: 'List Selections'
}

function getTypeLabel(type: string): string {
  return configTypeLabels[type] || type
}

function getTypeSeverity(type: string): string {
  const map: Record<string, string> = {
    global_keyword: 'danger',
    button_mapping: 'info',
    menu_option: 'warn',
    list_selection: 'secondary'
  }
  return map[type] || 'secondary'
}
</script>

<template>
  <div class="router-panel">
    <div class="panel-header">
      <i class="pi pi-sitemap" style="color: #8b5cf6" />
      <h3>Router Supervisor</h3>
    </div>

    <p class="panel-description">
      Enruta mensajes usando matchers de prioridad. Configura global keywords, buttons, y opciones de menu.
    </p>

    <div class="config-stats">
      <div class="stat">
        <span class="stat-value">{{ routingConfigs.length }}</span>
        <span class="stat-label">Total configs</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ routingConfigs.filter(c => c.is_enabled).length }}</span>
        <span class="stat-label">Activas</span>
      </div>
    </div>

    <!-- Config groups -->
    <div
      v-for="(configs, type) in groupedConfigs"
      :key="type"
      class="config-group"
    >
      <div class="group-header">
        <Tag :value="getTypeLabel(type)" :severity="getTypeSeverity(type) as any" />
        <span class="group-count">{{ configs.length }}</span>
      </div>

      <div class="config-list">
        <div
          v-for="config in configs"
          :key="config.id"
          class="config-item"
          :class="{ disabled: !config.is_enabled }"
        >
          <div class="config-row">
            <div class="config-trigger">
              <code>{{ config.trigger_value }}</code>
            </div>
            <InputSwitch
              :modelValue="config.is_enabled"
              @update:modelValue="() => handleToggleEnabled(config)"
              class="small-switch"
              v-tooltip.left="'Activa o desactiva esta regla. Si esta desactivada, el trigger no sera procesado por el router.'"
            />
          </div>
          <div class="config-target">
            <i class="pi pi-arrow-right" />
            <span>{{ config.target_intent }}</span>
            <span v-if="config.target_node" class="target-node">
              ({{ config.target_node }})
            </span>
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
            <Tag v-if="config.requires_auth" value="Auth" severity="warn" class="mini-tag" />
            <span class="priority">P{{ config.priority }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="routingConfigs.length === 0" class="empty-configs">
      <i class="pi pi-info-circle" />
      <p>No hay routing configs para el router</p>
    </div>

    <!-- Detection Patterns -->
    <DetectionPatternsSection
      v-if="routingConfigs.length > 0"
      :domain-key="domainKey"
      :routing-configs="routingConfigs"
    />
  </div>
</template>

<style scoped>
.router-panel {
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

.panel-description {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.config-stats {
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.config-group {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  border-bottom: 1px solid var(--surface-border);
}

.group-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.config-list {
  display: flex;
  flex-direction: column;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  font-size: 0.8rem;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.small-switch {
  transform: scale(0.75);
  flex-shrink: 0;
}

.config-item:last-child {
  border-bottom: none;
}

.config-item.disabled {
  opacity: 0.5;
}

.config-trigger code {
  padding: 1px 6px;
  background: var(--surface-ground);
  border-radius: 3px;
  font-size: 0.75rem;
  color: var(--text-color);
}

.config-target {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.config-target i {
  font-size: 0.6rem;
}

.target-node {
  color: #8b5cf6;
  font-size: 0.7rem;
}

.config-flags {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.125rem;
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

.mini-tag {
  font-size: 0.55rem !important;
  padding: 1px 4px !important;
}

.priority {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  margin-left: auto;
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
