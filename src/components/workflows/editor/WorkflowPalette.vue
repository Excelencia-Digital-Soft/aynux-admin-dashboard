<script setup lang="ts">
import { ref, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { nodeTypeColors, nodeTypeIcons } from '@/composables/useWorkflowEditor'
import type { NodeDefinition } from '@/types/workflow.types'

const props = defineProps<{
  isLoading: boolean
  nodeDefinitionsByCategory: Record<string, NodeDefinition[]>
}>()

const emit = defineEmits<{
  (e: 'addNode', definition: NodeDefinition): void
  (e: 'manageDefinitions'): void
}>()

const openCategories = ref<Record<string, boolean>>({})

// Initialize all categories as open whenever definitions change
watch(
  () => props.nodeDefinitionsByCategory,
  (categories) => {
    for (const category of Object.keys(categories)) {
      if (!(category in openCategories.value)) {
        openCategories.value[category] = true
      }
    }
  },
  { immediate: true }
)

function getNodeColor(nodeType: string): string {
  return nodeTypeColors[nodeType] || '#64748b'
}

function getNodeIcon(nodeType: string): string {
  return nodeTypeIcons[nodeType] || 'pi-circle'
}

function onDragStart(event: DragEvent, definition: NodeDefinition) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/workflow-node', JSON.stringify(definition))
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<template>
  <Card class="glass-panel overflow-y-auto max-h-[calc(100vh-200px)]">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-base">
          <i class="pi pi-th-large" />
          <span>Nodos</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          title="Gestionar definiciones de nodos"
          @click="emit('manageDefinitions')"
        >
          <i class="pi pi-cog" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="flex justify-center py-4">
        <div class="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
      </div>

      <div v-else class="space-y-1">
        <Collapsible
          v-for="(definitions, category) in nodeDefinitionsByCategory"
          :key="category"
          :open="openCategories[category]"
          @update:open="(v: boolean) => openCategories[category] = v"
        >
          <CollapsibleTrigger
            class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium hover:bg-white/5 rounded-md transition-colors"
          >
            {{ category }}
            <i
              class="pi pi-chevron-down text-xs transition-transform duration-200"
              :class="{ 'rotate-180': openCategories[category] }"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="flex flex-col gap-2 pt-1 pb-2">
              <div
                v-for="def in definitions"
                :key="def.id"
                class="palette-node"
                :style="{ borderLeftColor: getNodeColor(def.node_type) }"
                draggable="true"
                @dragstart="onDragStart($event, def)"
                @click="emit('addNode', def)"
              >
                <i
                  :class="['pi', def.icon || getNodeIcon(def.node_type)]"
                  :style="{ color: getNodeColor(def.node_type) }"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {{ def.display_name }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    {{ def.node_type }}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Alert
        v-if="!isLoading && Object.keys(nodeDefinitionsByCategory).length === 0"
        class="mt-4"
      >
        <i class="pi pi-info-circle" />
        <AlertDescription>
          No hay nodos disponibles. Crea definiciones de nodos primero.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>

<style scoped>
.palette-node {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 0.375rem;
  cursor: grab;
  transition: all 0.2s;
}

:root.dark .palette-node,
.dark .palette-node {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.palette-node:hover {
  background: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:root.dark .palette-node:hover,
.dark .palette-node:hover {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.palette-node:active {
  cursor: grabbing;
}
</style>
