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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'

import RouterPanel from './panels/RouterPanel.vue'
import ActionNodePanel from './panels/ActionNodePanel.vue'
import RoutingConfigCreateForm from './panels/RoutingConfigCreateForm.vue'

import type { SelectedNodeInfo } from './types'
import type { RoutingConfigCreate } from '@/types/routingConfigs.types'

// Props
interface AvailableNode {
  id: string
  displayName: string
}

interface Props {
  visible: boolean
  selectedNode: SelectedNodeInfo | null
  domainKey: string
  showCreateForm: boolean
  availableNodes: AvailableNode[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'toggleRoutingConfig', configId: string, enabled: boolean): void
  (e: 'toggleAwaitingConfig', configId: string, enabled: boolean): void
  (e: 'updateRoutingConfig', configId: string, updates: Record<string, unknown>): void
  (e: 'createRoutingConfig', data: RoutingConfigCreate): void
  (e: 'deleteRoutingConfig', configId: string): void
  (e: 'update:showCreateForm', value: boolean): void
}>()

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

function handleOpenChange(open: boolean) {
  emit('update:visible', open)
  if (!open) {
    emit('close')
  }
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

function handleAddConfig() {
  emit('update:showCreateForm', true)
}

function handleCancelCreate() {
  emit('update:showCreateForm', false)
}

function handleSaveCreate(data: RoutingConfigCreate) {
  emit('createRoutingConfig', data)
}

function handleDeleteRouting(configId: string) {
  emit('deleteRoutingConfig', configId)
}
</script>

<template>
  <Sheet :open="visible" @update:open="handleOpenChange">
    <SheetContent side="right" class="w-[420px] sm:max-w-[420px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ drawerTitle }}</SheetTitle>
        <SheetDescription class="sr-only">
          Panel de configuracion del nodo seleccionado
        </SheetDescription>
      </SheetHeader>

      <div v-if="selectedNode" class="flex flex-col gap-3 p-2">
        <!-- Create Form Mode -->
        <RoutingConfigCreateForm
          v-if="showCreateForm"
          :domain-key="domainKey"
          :target-node="selectedNode.nodeId"
          :available-nodes="availableNodes"
          @save="handleSaveCreate"
          @cancel="handleCancelCreate"
        />

        <!-- Normal View -->
        <template v-else>
          <!-- Router Supervisor -->
          <RouterPanel
            v-if="selectedNode.nodeType === 'supervisor'"
            :routing-configs="selectedNode.routingConfigs"
            :domain-key="domainKey"
            @toggle-config="handleToggleRouting"
            @update-config="handleUpdateRouting"
            @add-config="handleAddConfig"
            @delete-config="handleDeleteRouting"
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
            @add-config="handleAddConfig"
            @delete-routing-config="handleDeleteRouting"
          />

          <!-- Formatter -->
          <div v-else-if="selectedNode.nodeType === 'formatter'" class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <i :class="['pi', selectedNode.data.icon]" :style="{ color: selectedNode.data.color }" />
              <h3 class="m-0 text-base font-semibold text-foreground">{{ selectedNode.data.displayName }}</h3>
            </div>
            <p class="m-0 text-xs text-muted-foreground leading-relaxed">{{ selectedNode.data.description }}</p>
          </div>

          <!-- Terminal (START/END) -->
          <div v-else class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <i :class="['pi', selectedNode.data.icon]" :style="{ color: selectedNode.data.color }" />
              <h3 class="m-0 text-base font-semibold text-foreground">{{ selectedNode.data.displayName }}</h3>
            </div>
            <p class="m-0 text-xs text-muted-foreground leading-relaxed">{{ selectedNode.data.description }}</p>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-center">
        <i class="pi pi-info-circle text-4xl mb-4 opacity-50" />
        <p class="m-0 max-w-[250px]">Selecciona un nodo del grafo para ver sus detalles</p>
      </div>
    </SheetContent>
  </Sheet>
</template>
