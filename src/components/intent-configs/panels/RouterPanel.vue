<script setup lang="ts">
/**
 * RouterPanel - Config panel for the Router Supervisor node
 * Shows all routing configs grouped by config_type
 */
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
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
  (e: 'addConfig'): void
  (e: 'deleteConfig', configId: string): void
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

function handleDelete(configId: string) {
  emit('deleteConfig', configId)
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
  list_selection: 'List Selections',
  intent_node_mapping: 'Intent → Node'
}

function getTypeLabel(type: string): string {
  return configTypeLabels[type] || type
}

function getTypeVariant(type: string): 'destructive' | 'info' | 'warning' | 'secondary' | 'outline' {
  const map: Record<string, 'destructive' | 'info' | 'warning' | 'secondary' | 'outline'> = {
    global_keyword: 'destructive',
    button_mapping: 'info',
    menu_option: 'warning',
    list_selection: 'secondary',
    intent_node_mapping: 'outline'
  }
  return map[type] || 'secondary'
}
</script>

<template>
  <TooltipProvider>
    <div class="router-panel">
      <div class="panel-header">
        <i class="pi pi-sitemap" style="color: #8b5cf6" />
        <h3>Router Supervisor</h3>
      </div>

      <p class="panel-description">
        Enruta mensajes usando matchers de prioridad. Configura global keywords, buttons, y opciones de menu.
      </p>

      <div class="config-stats-row">
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
        <button class="add-rule-btn" @click="emit('addConfig')">
          <i class="pi pi-plus" />
          Agregar regla
        </button>
      </div>

      <!-- Config groups -->
      <div
        v-for="(configs, type) in groupedConfigs"
        :key="type"
        class="config-group"
      >
        <div class="group-header">
          <Badge :variant="getTypeVariant(type as string)">{{ getTypeLabel(type as string) }}</Badge>
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
              <div class="config-actions">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <div class="scale-75 flex-shrink-0">
                      <Switch
                        :checked="config.is_enabled"
                        @update:checked="() => handleToggleEnabled(config)"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Activa o desactiva esta regla. Si esta desactivada, el trigger no sera procesado por el router.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button class="delete-btn" @click="handleDelete(config.id)">
                      <i class="pi pi-trash" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Eliminar esta regla</TooltipContent>
                </Tooltip>
              </div>
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
                <div class="scale-[0.6]">
                  <Switch
                    :checked="config.clears_context"
                    @update:checked="() => handleToggleClearsContext(config)"
                  />
                </div>
                <span>Clear ctx</span>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <i class="pi pi-question-circle help-icon" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Limpia el contexto pendiente (awaiting_input) al activar esta ruta. Util para keywords como cancelar o hola que reinician el flujo.
                  </TooltipContent>
                </Tooltip>
              </label>
              <label v-if="config.config_type === 'global_keyword'" class="flag-toggle">
                <div class="scale-[0.6]">
                  <Switch
                    :checked="config.is_escape_intent"
                    @update:checked="() => handleToggleEscapeIntent(config)"
                  />
                </div>
                <span>Escape</span>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <i class="pi pi-question-circle help-icon" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Permite interrumpir un flujo en espera (awaiting_input) para ejecutar esta accion. Sin esto, el keyword solo funciona fuera de flujos activos.
                  </TooltipContent>
                </Tooltip>
              </label>
              <Badge v-if="config.requires_auth" variant="warning" class="text-[0.55rem] px-1 py-0">Auth</Badge>
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
  </TooltipProvider>
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

.config-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-rule-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border: 1.5px solid #8b5cf6;
  border-radius: 0.375rem;
  background: transparent;
  color: #8b5cf6;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.add-rule-btn:hover {
  background: rgba(139, 92, 246, 0.1);
}

.add-rule-btn i {
  font-size: 0.65rem;
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

.config-item:last-child {
  border-bottom: none;
}

.config-item.disabled {
  opacity: 0.5;
}

.config-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.15s;
}

.delete-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.delete-btn i {
  font-size: 0.65rem;
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
