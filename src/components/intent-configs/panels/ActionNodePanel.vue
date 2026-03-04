<script setup lang="ts">
/**
 * ActionNodePanel - Config panel for action nodes
 * Shows node details, awaiting types, and routing configs targeting this node
 */
import { toRef } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import DetectionPatternsSection from './DetectionPatternsSection.vue'
import type { TopologyNodeData, RoutingConfigSummary, AwaitingTypeConfigSummary } from '../types'
import { useGroupedRoutingConfigs } from '@/composables/useGroupedRoutingConfigs'
import {
  humanizeAwaitingType,
  humanizeResponseIntent,
  humanizeTargetIntent,
  getConfigTypeLabel,
  getPriorityDisplay
} from '../utils/labelHumanizer'

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
  (e: 'addConfig'): void
  (e: 'deleteRoutingConfig', configId: string): void
  (e: 'highlightDependency', routingConfigId: string | null): void
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

function handleDeleteRouting(configId: string) {
  emit('deleteRoutingConfig', configId)
}

// Group routing configs by config_type using shared composable
const { groupedConfigs, defaultOpenGroups } = useGroupedRoutingConfigs(
  toRef(props, 'routingConfigs')
)
</script>

<template>
  <TooltipProvider>
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
          Datos que espera el bot
        </h4>
        <div class="config-list">
          <div
            v-for="config in awaitingTypeConfigs"
            :key="config.id"
            class="config-item"
            :class="{ disabled: !config.is_enabled }"
          >
            <div class="config-row">
              <code class="awaiting-type">{{ humanizeAwaitingType(config.awaiting_type) }}</code>
              <div class="scale-75 flex-shrink-0">
                <Switch
                  :checked="config.is_enabled"
                  @update:checked="() => handleToggleAwaiting(config)"
                />
              </div>
            </div>
            <div v-if="config.valid_response_intents.length > 0" class="response-intents">
              <span class="label">Respuestas aceptadas:</span>
              <Badge
                v-for="intent in config.valid_response_intents"
                :key="intent"
                variant="info"
                class="text-[0.6rem] px-1.5 py-0"
              >
                {{ humanizeResponseIntent(intent) }}
              </Badge>
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
          Tipos de datos que procesa
        </h4>
        <div class="tags-row">
          <Badge
            v-for="at in data.acceptsAwaitingTypes"
            :key="at"
            variant="secondary"
          >
            {{ humanizeAwaitingType(at) }}
          </Badge>
        </div>
      </div>

      <!-- Routing Configs Targeting This Node (accordion) -->
      <div v-if="routingConfigs.length > 0" class="section">
        <div class="section-header-row">
          <h4 class="section-title">
            <i class="pi pi-directions" />
            Reglas de enrutamiento ({{ routingConfigs.length }})
          </h4>
          <button class="add-rule-btn" @click.stop="emit('addConfig')">
            <i class="pi pi-plus" />
          </button>
        </div>
        <Accordion
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
              <Badge variant="secondary" class="text-[0.65rem]">{{ getConfigTypeLabel(type as string) }}</Badge>
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
                    <div class="config-info">
                      <code>{{ config.trigger_value }}</code>
                    </div>
                    <div class="config-actions">
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <div class="scale-75 flex-shrink-0">
                            <Switch
                              :checked="config.is_enabled"
                              @update:checked="() => handleToggleRouting(config)"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          Si está desactivada, esta regla no se usará.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button class="delete-btn" @click.stop="handleDeleteRouting(config.id)">
                            <i class="pi pi-trash" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Eliminar esta regla</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div class="config-target-line">
                    <i class="pi pi-arrow-right" />
                    <span>{{ humanizeTargetIntent(config.target_intent) }}</span>
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
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
        <p>Este paso no tiene reglas configuradas todavía</p>
        <button class="add-rule-btn" @click="emit('addConfig')">
          <i class="pi pi-plus" />
          Agregar regla
        </button>
      </div>
    </div>
  </TooltipProvider>
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

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.section-header-row .section-title {
  margin: 0;
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

.add-rule-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border: 1.5px solid #8b5cf6;
  border-radius: 0.375rem;
  background: transparent;
  color: #8b5cf6;
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.add-rule-btn:hover {
  background: rgba(139, 92, 246, 0.1);
}

.add-rule-btn i {
  font-size: 0.6rem;
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

.routing-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.accordion-group {
  border: 1px solid var(--surface-border);
  border-radius: 0.375rem;
  overflow: hidden;
}

.routing-accordion :deep(.group-header) {
  padding: 0.375rem 0.5rem;
  background: var(--surface-ground);
  text-decoration: none;
  font-size: 0.8rem;
}

.routing-accordion :deep(.group-header:hover) {
  text-decoration: none;
}

.routing-accordion :deep(.group-header > svg) {
  color: var(--text-color-secondary);
  opacity: 0.5;
  width: 12px;
  height: 12px;
}

.routing-accordion :deep([data-radix-accordion-content]) {
  transition-duration: 200ms;
}

.routing-accordion :deep([data-radix-accordion-content] > div) {
  padding: 0;
}

.group-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-color-secondary);
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
