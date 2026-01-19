<script setup lang="ts">
/**
 * IntentConfigDetailDrawer - Side drawer for editing selected graph nodes
 *
 * Displays the appropriate panel based on the selected node type.
 */
import { computed } from 'vue'
import Drawer from 'primevue/drawer'

import DomainPanel from './panels/DomainPanel.vue'
import IntentPanel from './panels/IntentPanel.vue'
import AgentPanel from './panels/AgentPanel.vue'
import KeywordPanel from './panels/KeywordPanel.vue'

import type {
  SelectedNodeInfo,
  GraphNodeType,
  DomainNodeData,
  IntentNodeData,
  AgentNodeData,
  KeywordGroupNodeData
} from './types'
import type { IntentAgentMapping, FlowAgentConfig, KeywordAgentMapping } from '@/types/intentConfigs.types'

// Props
interface Props {
  visible: boolean
  selectedNode: SelectedNodeInfo | null
  intentMappings: IntentAgentMapping[]
  flowAgents: FlowAgentConfig[]
  keywordMappings: KeywordAgentMapping[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'updateIntent', intentId: string, updates: Record<string, unknown>): void
  (e: 'deleteIntent', domainKey: string, intentId: string, intentName: string): void
  (e: 'createMapping', domainKey: string, intentKey: string, agentKey: string): void
  (e: 'updateMapping', mappingId: string, updates: Record<string, unknown>): void
  (e: 'deleteMapping', mappingId: string): void
  (e: 'addKeywords', agentKey: string, keywords: string[]): void
  (e: 'deleteKeyword', keywordId: string): void
  (e: 'updateFlowAgent', agentKey: string, updates: Record<string, unknown>): void
  (e: 'refresh'): void
}>()

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const nodeType = computed(() => props.selectedNode?.nodeType || null)

const drawerTitle = computed(() => {
  if (!props.selectedNode) return 'Detalles'

  switch (props.selectedNode.nodeType) {
    case 'domain':
      return 'Dominio'
    case 'intent':
      return 'Intent'
    case 'agent':
      return 'Agente'
    case 'keyword-group':
      return 'Keywords'
    default:
      return 'Detalles'
  }
})

// Handlers
function handleClose() {
  emit('close')
}

// Emit wrappers
function handleUpdateIntent(intentId: string, updates: Record<string, unknown>) {
  emit('updateIntent', intentId, updates)
}

function handleDeleteIntent(domainKey: string, intentId: string, intentName: string) {
  emit('deleteIntent', domainKey, intentId, intentName)
}

function handleCreateMapping(domainKey: string, intentKey: string, agentKey: string) {
  emit('createMapping', domainKey, intentKey, agentKey)
}

function handleUpdateMapping(mappingId: string, updates: Record<string, unknown>) {
  emit('updateMapping', mappingId, updates)
}

function handleDeleteMapping(mappingId: string) {
  emit('deleteMapping', mappingId)
}

function handleAddKeywords(agentKey: string, keywords: string[]) {
  emit('addKeywords', agentKey, keywords)
}

function handleDeleteKeyword(keywordId: string) {
  emit('deleteKeyword', keywordId)
}

function handleUpdateFlowAgent(agentKey: string, updates: Record<string, unknown>) {
  emit('updateFlowAgent', agentKey, updates)
}

function handleRefresh() {
  emit('refresh')
}
</script>

<template>
  <Drawer
    v-model:visible="localVisible"
    :header="drawerTitle"
    position="right"
    class="intent-config-drawer"
    :style="{ width: '400px' }"
    @hide="handleClose"
  >
    <!-- Using PrimeVue's default close button -->

    <div v-if="selectedNode" class="drawer-content">
      <!-- Domain Panel -->
      <DomainPanel
        v-if="nodeType === 'domain'"
        :data="selectedNode.data as DomainNodeData"
      />

      <!-- Intent Panel -->
      <IntentPanel
        v-else-if="nodeType === 'intent'"
        :data="selectedNode.data as IntentNodeData"
        :intent-mappings="intentMappings"
        :flow-agents="flowAgents"
        @update-intent="handleUpdateIntent"
        @delete-intent="handleDeleteIntent"
        @create-mapping="handleCreateMapping"
        @update-mapping="handleUpdateMapping"
        @delete-mapping="handleDeleteMapping"
        @refresh="handleRefresh"
      />

      <!-- Agent Panel -->
      <AgentPanel
        v-else-if="nodeType === 'agent'"
        :data="selectedNode.data as AgentNodeData"
        :intent-mappings="intentMappings"
        :flow-agents="flowAgents"
        @update-flow-agent="handleUpdateFlowAgent"
      />

      <!-- Keyword Panel -->
      <KeywordPanel
        v-else-if="nodeType === 'keyword-group'"
        :data="selectedNode.data as KeywordGroupNodeData"
        @add-keywords="handleAddKeywords"
        @delete-keyword="handleDeleteKeyword"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="drawer-empty">
      <i class="pi pi-info-circle" />
      <p>Selecciona un nodo del grafo para ver sus detalles</p>
    </div>
  </Drawer>
</template>

<style scoped>
.drawer-content {
  padding: 0.5rem;
}

.drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-color-secondary);
  text-align: center;
}

.drawer-empty i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.drawer-empty p {
  margin: 0;
  max-width: 250px;
}
</style>

<style>
/* Global styles for the drawer - SOLID backgrounds */
.intent-config-drawer.p-drawer {
  background: var(--surface-card) !important;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
}

.intent-config-drawer .p-drawer-content {
  padding: 1rem;
  background: var(--surface-card) !important;
  color: var(--text-color);
}

.intent-config-drawer .p-drawer-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-card) !important;
  color: var(--text-color);
}

.intent-config-drawer .p-drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Dark mode - SOLID opaque backgrounds */
:root.dark .intent-config-drawer.p-drawer,
.dark-mode .intent-config-drawer.p-drawer,
[data-theme="dark"] .intent-config-drawer.p-drawer {
  background: #1e293b !important;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
}

:root.dark .intent-config-drawer .p-drawer-content,
.dark-mode .intent-config-drawer .p-drawer-content,
[data-theme="dark"] .intent-config-drawer .p-drawer-content {
  background: #1e293b !important;
  color: var(--text-color);
}

:root.dark .intent-config-drawer .p-drawer-header,
.dark-mode .intent-config-drawer .p-drawer-header,
[data-theme="dark"] .intent-config-drawer .p-drawer-header {
  background: #1e293b !important;
  color: var(--text-color);
  border-bottom-color: var(--surface-border);
}

/* Ensure close button is visible in dark mode */
:root.dark .intent-config-drawer .p-drawer-close-button,
.dark-mode .intent-config-drawer .p-drawer-close-button,
[data-theme="dark"] .intent-config-drawer .p-drawer-close-button {
  color: var(--text-color);
}

:root.dark .intent-config-drawer .p-drawer-close-button:hover,
.dark-mode .intent-config-drawer .p-drawer-close-button:hover,
[data-theme="dark"] .intent-config-drawer .p-drawer-close-button:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}
</style>
