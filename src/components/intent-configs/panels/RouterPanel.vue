<script setup lang="ts">
/**
 * RouterPanel - Config panel for the Router Supervisor node
 * Shows all routing configs grouped by config_type
 */
import { ref, toRef } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import DetectionPatternsSection from './DetectionPatternsSection.vue'
import type { RoutingConfigSummary } from '../types'
import { useGroupedRoutingConfigs } from '@/composables/useGroupedRoutingConfigs'
import {
  humanizeTargetIntent,
  humanizeNodeId,
  getPriorityDisplay,
  getConfigTypeLabel,
  getConfigTypeTooltip
} from '../utils/labelHumanizer'

interface AvailableNode {
  id: string
  displayName: string
}

interface Props {
  routingConfigs: RoutingConfigSummary[]
  domainKey: string
  availableNodes?: AvailableNode[]
}

const props = withDefaults(defineProps<Props>(), {
  availableNodes: () => []
})

const emit = defineEmits<{
  (e: 'toggleConfig', configId: string, enabled: boolean): void
  (e: 'updateConfig', configId: string, updates: Record<string, unknown>): void
  (e: 'addConfig'): void
  (e: 'deleteConfig', configId: string): void
  (e: 'highlightDependency', routingConfigId: string | null): void
}>()

// Inline edit state for target_node
const editingNodeConfigId = ref<string | null>(null)

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

function startEditNode(configId: string) {
  if (props.availableNodes.length > 0) {
    editingNodeConfigId.value = configId
  }
}

function handleNodeChange(configId: string, newNode: string) {
  editingNodeConfigId.value = null
  emit('updateConfig', configId, { target_node: newNode })
}

// Group by config_type using shared composable
const { groupedConfigs, defaultOpenGroups } = useGroupedRoutingConfigs(
  toRef(props, 'routingConfigs')
)

function getTypeLabel(type: string): string {
  return getConfigTypeLabel(type)
}

function getTypeTooltip(type: string): string | null {
  return getConfigTypeTooltip(type)
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
        <h3>Distribuidor de Mensajes</h3>
      </div>

      <p class="panel-description">
        Aquí se configuran las reglas que deciden a dónde va cada mensaje. Las reglas se revisan por orden de prioridad.
      </p>

      <div class="config-stats-row">
        <div class="config-stats">
          <div class="stat">
            <span class="stat-value">{{ routingConfigs.length }}</span>
            <span class="stat-label">Total reglas</span>
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

      <!-- Config groups (accordion) -->
      <Accordion
        v-if="Object.keys(groupedConfigs).length > 0"
        type="multiple"
        :default-value="defaultOpenGroups"
        class="routing-accordion"
      >
        <AccordionItem
          v-for="(configs, type) in groupedConfigs"
          :key="type"
          :value="type as string"
          class="accordion-group"
        >
          <AccordionTrigger class="group-header">
            <div class="group-header-left">
              <Badge :variant="getTypeVariant(type as string)">{{ getTypeLabel(type as string) }}</Badge>
              <Tooltip v-if="getTypeTooltip(type as string)">
                <TooltipTrigger as-child>
                  <i class="pi pi-question-circle help-icon" @click.stop />
                </TooltipTrigger>
                <TooltipContent side="top">{{ getTypeTooltip(type as string) }}</TooltipContent>
              </Tooltip>
            </div>
            <span class="group-count">{{ configs.length }}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div class="config-list">
              <div
                v-for="config in configs"
                :key="config.id"
                class="config-item"
                :class="{ disabled: !config.is_enabled }"
                @mouseenter="emit('highlightDependency', config.id)"
                @mouseleave="emit('highlightDependency', null)"
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
                        Si está desactivada, esta regla no se usará.
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="delete-btn" @click.stop="handleDelete(config.id)">
                          <i class="pi pi-trash" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Eliminar esta regla</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div class="config-target">
                  <i class="pi pi-arrow-right" />
                  <span>{{ humanizeTargetIntent(config.target_intent) }}</span>
                  <!-- Inline edit mode for target_node -->
                  <template v-if="editingNodeConfigId === config.id && availableNodes.length > 0">
                    <Select
                      :model-value="config.target_node || ''"
                      @update:model-value="(val: string) => handleNodeChange(config.id, val)"
                    >
                      <SelectTrigger class="inline-node-select" @click.stop>
                        <SelectValue placeholder="Nodo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="node in availableNodes"
                          :key="node.id"
                          :value="node.id"
                        >
                          {{ node.displayName }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </template>
                  <!-- Display mode -->
                  <Tooltip v-else-if="config.target_node">
                    <TooltipTrigger as-child>
                      <button
                        class="target-node-btn"
                        @click.stop="startEditNode(config.id)"
                      >
                        {{ humanizeNodeId(config.target_node) }}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Click para cambiar el paso destino</TooltipContent>
                  </Tooltip>
                </div>
                <div class="config-flags">
                  <label class="flag-toggle" @click.stop>
                    <div class="scale-[0.6]">
                      <Switch
                        :checked="config.clears_context"
                        @update:checked="() => handleToggleClearsContext(config)"
                      />
                    </div>
                    <span>Reiniciar</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <i class="pi pi-question-circle help-icon" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Al activar esta regla, el bot olvida lo que estaba preguntando y empieza de nuevo. Útil para palabras como "cancelar" o "menú".
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <label v-if="config.config_type === 'global_keyword'" class="flag-toggle" @click.stop>
                    <div class="scale-[0.6]">
                      <Switch
                        :checked="config.is_escape_intent"
                        @update:checked="() => handleToggleEscapeIntent(config)"
                      />
                    </div>
                    <span>Interrumpir</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <i class="pi pi-question-circle help-icon" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Permite que esta palabra funcione incluso cuando el bot está esperando una respuesta del usuario. Sin esto, solo funciona cuando el bot no está esperando nada.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <Tooltip v-if="config.requires_auth">
                    <TooltipTrigger as-child>
                      <Badge variant="warning" class="text-[0.55rem] px-1 py-0">Identificación</Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top">El usuario debe estar identificado antes de usar esta acción</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <span class="priority" :style="{ color: getPriorityDisplay(config.priority).color }">
                        {{ getPriorityDisplay(config.priority).label }}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">Prioridad: {{ config.priority }}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div v-if="routingConfigs.length === 0" class="empty-configs">
        <i class="pi pi-info-circle" />
        <p>No hay reglas configuradas</p>
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

.routing-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.accordion-group {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.routing-accordion :deep(.group-header) {
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  text-decoration: none;
}

.routing-accordion :deep(.group-header:hover) {
  text-decoration: none;
}

.routing-accordion :deep(.group-header > svg) {
  color: var(--text-color-secondary);
  opacity: 0.5;
  width: 14px;
  height: 14px;
}

.routing-accordion :deep([data-radix-accordion-content]) {
  transition-duration: 200ms;
}

.routing-accordion :deep([data-radix-accordion-content] > div) {
  padding: 0;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 0.375rem;
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

.target-node-btn {
  color: #8b5cf6;
  font-size: 0.7rem;
  background: none;
  border: 1px dashed transparent;
  border-radius: 3px;
  padding: 0 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.target-node-btn:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.06);
}

.inline-node-select {
  height: 24px;
  min-width: 140px;
  max-width: 180px;
  font-size: 0.7rem;
  padding: 0 6px;
  border-color: rgba(139, 92, 246, 0.4);
}

.inline-node-select:focus {
  border-color: #8b5cf6;
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
