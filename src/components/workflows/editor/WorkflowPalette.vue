<script setup lang="ts">
import Card from 'primevue/card'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import { nodeTypeColors, nodeTypeIcons } from '@/composables/useWorkflowEditor'
import type { NodeDefinition } from '@/types/workflow.types'

defineProps<{
  isLoading: boolean
  nodeDefinitionsByCategory: Record<string, NodeDefinition[]>
}>()

const emit = defineEmits<{
  (e: 'addNode', definition: NodeDefinition): void
  (e: 'manageDefinitions'): void
}>()

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
  <Card class="node-palette">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-th-large" />
          <span>Nodos</span>
        </div>
        <Button
          icon="pi pi-cog"
          severity="secondary"
          text
          rounded
          size="small"
          title="Gestionar definiciones de nodos"
          @click="emit('manageDefinitions')"
        />
      </div>
    </template>
    <template #content>
      <div v-if="isLoading" class="flex justify-center py-4">
        <ProgressSpinner style="width: 30px; height: 30px" />
      </div>

      <Accordion v-else :multiple="true" :activeIndex="[0, 1, 2, 3]">
        <AccordionPanel
          v-for="(definitions, category) in nodeDefinitionsByCategory"
          :key="category"
          :value="category"
        >
          <AccordionHeader>{{ category }}</AccordionHeader>
          <AccordionContent>
            <div class="palette-nodes">
              <div
                v-for="def in definitions"
                :key="def.id"
                class="palette-node"
                :style="{ borderLeftColor: getNodeColor(def.node_type) }"
                draggable="true"
                @dragstart="onDragStart($event, def)"
                @click="emit('addNode', def)"
              >
                <i :class="['pi', def.icon || getNodeIcon(def.node_type)]" :style="{ color: getNodeColor(def.node_type) }" />
                <div class="palette-node-info">
                  <div class="palette-node-name">{{ def.display_name }}</div>
                  <div class="palette-node-type">{{ def.node_type }}</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <Message v-if="Object.keys(nodeDefinitionsByCategory).length === 0" severity="info" :closable="false" class="mt-4">
        No hay nodos disponibles. Crea definiciones de nodos primero.
      </Message>
    </template>
  </Card>
</template>

<style scoped>
.node-palette {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.palette-nodes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

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

.palette-node:hover {
  background: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.palette-node:active {
  cursor: grabbing;
}

.palette-node-info {
  flex: 1;
  min-width: 0;
}

.palette-node-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.palette-node-type {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
