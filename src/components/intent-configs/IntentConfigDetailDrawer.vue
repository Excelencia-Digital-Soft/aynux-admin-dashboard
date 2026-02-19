<script setup lang="ts">
/**
 * IntentConfigDetailDrawer - Side drawer for editing selected graph nodes
 *
 * Adapts panel content based on selected node type:
 * - supervisor → RouterPanel (routing configs grouped by type)
 * - action → ActionNodePanel (awaiting types + routing configs)
 * - formatter → Description only
 * - terminal → No panel (START/END)
 */
import { computed } from 'vue'
import Drawer from 'primevue/drawer'

import RouterPanel from './panels/RouterPanel.vue'
import ActionNodePanel from './panels/ActionNodePanel.vue'

import type { SelectedNodeInfo } from './types'

// Props
interface Props {
  visible: boolean
  selectedNode: SelectedNodeInfo | null
  domainKey: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'toggleRoutingConfig', configId: string, enabled: boolean): void
  (e: 'toggleAwaitingConfig', configId: string, enabled: boolean): void
  (e: 'updateRoutingConfig', configId: string, updates: Record<string, unknown>): void
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const drawerTitle = computed(() => {
  if (!props.selectedNode) return 'Detalles'

  switch (props.selectedNode.nodeType) {
    case 'supervisor':
      return 'Router Supervisor'
    case 'action':
      return props.selectedNode.data.displayName
    case 'formatter':
      return 'Response Formatter'
    case 'terminal':
      return props.selectedNode.data.displayName
    default:
      return 'Detalles'
  }
})

function handleClose() {
  emit('close')
}

function handleToggleRouting(configId: string, enabled: boolean) {
  emit('toggleRoutingConfig', configId, enabled)
}

function handleToggleAwaiting(configId: string, enabled: boolean) {
  emit('toggleAwaitingConfig', configId, enabled)
}

function handleUpdateRouting(configId: string, updates: Record<string, unknown>) {
  emit('updateRoutingConfig', configId, updates)
}
</script>

<template>
  <Drawer
    v-model:visible="localVisible"
    :header="drawerTitle"
    position="right"
    class="topology-drawer"
    :style="{ width: '420px' }"
    @hide="handleClose"
  >
    <div v-if="selectedNode" class="drawer-content">
      <!-- Router Supervisor -->
      <RouterPanel
        v-if="selectedNode.nodeType === 'supervisor'"
        :routing-configs="selectedNode.routingConfigs"
        :domain-key="domainKey"
        @toggle-config="handleToggleRouting"
        @update-config="handleUpdateRouting"
      />

      <!-- Action Node -->
      <ActionNodePanel
        v-else-if="selectedNode.nodeType === 'action'"
        :data="selectedNode.data"
        :routing-configs="selectedNode.routingConfigs"
        :awaiting-type-configs="selectedNode.awaitingTypeConfigs"
        :domain-key="domainKey"
        @toggle-routing-config="handleToggleRouting"
        @toggle-awaiting-config="handleToggleAwaiting"
        @update-routing-config="handleUpdateRouting"
      />

      <!-- Formatter -->
      <div v-else-if="selectedNode.nodeType === 'formatter'" class="simple-panel">
        <div class="panel-header">
          <i :class="['pi', selectedNode.data.icon]" :style="{ color: selectedNode.data.color }" />
          <h3>{{ selectedNode.data.displayName }}</h3>
        </div>
        <p class="panel-description">{{ selectedNode.data.description }}</p>
      </div>

      <!-- Terminal (START/END) -->
      <div v-else class="simple-panel">
        <div class="panel-header">
          <i :class="['pi', selectedNode.data.icon]" :style="{ color: selectedNode.data.color }" />
          <h3>{{ selectedNode.data.displayName }}</h3>
        </div>
        <p class="panel-description">{{ selectedNode.data.description }}</p>
      </div>
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

.simple-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
</style>

<style>
/* Global styles for the drawer */
.topology-drawer.p-drawer {
  background: var(--surface-card, #ffffff) !important;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
}

.topology-drawer .p-drawer-content {
  padding: 1rem;
  background: var(--surface-card, #ffffff) !important;
  color: var(--text-color);
}

.topology-drawer .p-drawer-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-card, #ffffff) !important;
  color: var(--text-color);
}

/* Dark mode */
:root.dark .topology-drawer.p-drawer,
.dark-mode .topology-drawer.p-drawer,
[data-theme="dark"] .topology-drawer.p-drawer {
  background: #1e293b !important;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
}

:root.dark .topology-drawer .p-drawer-content,
.dark-mode .topology-drawer .p-drawer-content,
[data-theme="dark"] .topology-drawer .p-drawer-content {
  background: #1e293b !important;
}

:root.dark .topology-drawer .p-drawer-header,
.dark-mode .topology-drawer .p-drawer-header,
[data-theme="dark"] .topology-drawer .p-drawer-header {
  background: #1e293b !important;
  border-bottom-color: var(--surface-border);
}

:root.dark .topology-drawer .p-drawer-close-button,
.dark-mode .topology-drawer .p-drawer-close-button,
[data-theme="dark"] .topology-drawer .p-drawer-close-button {
  color: var(--text-color);
}
</style>
