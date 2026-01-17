<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import NodeConfigForm from '@/components/workflows/NodeConfigForm.vue'
import ConditionEditorDialog from '@/components/workflows/ConditionEditorDialog.vue'
import type { NodeInstance, WorkflowTransition, NodeDefinition, NodeInstanceUpdate, TransitionUpdate, TransitionCondition } from '@/types/workflow.types'

const props = defineProps<{
  selectedNode: NodeInstance | null
  selectedEdge: WorkflowTransition | null
  getNodeDefinition: (id: string) => NodeDefinition | undefined
}>()

const emit = defineEmits<{
  (e: 'updateNode', nodeId: string, updates: NodeInstanceUpdate): void
  (e: 'deleteNode', node: NodeInstance): void
  (e: 'updateTransition', edgeId: string, updates: TransitionUpdate): void
  (e: 'deleteTransition', edgeId: string): void
}>()

const showConditionEditor = ref(false)

function onSaveCondition(condition: TransitionCondition | null) {
  if (!props.selectedEdge) return
  emit('updateTransition', props.selectedEdge.id, { condition: condition || undefined })
}
</script>

<template>
  <Card class="properties-panel">
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-sliders-h" />
        <span>Propiedades</span>
      </div>
    </template>
    <template #content>
      <!-- Node Properties -->
      <div v-if="selectedNode">
        <h4 class="text-sm font-semibold text-gray-700 mb-4">Nodo Seleccionado</h4>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
            <InputText
              :modelValue="selectedNode.display_label"
              class="w-full"
              @update:modelValue="(v) => emit('updateNode', selectedNode!.id, { display_label: v })"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <Textarea
              :modelValue="selectedNode.description || ''"
              rows="2"
              class="w-full"
              @update:modelValue="(v) => emit('updateNode', selectedNode!.id, { description: v })"
            />
          </div>

          <div class="flex items-center gap-2">
            <ToggleSwitch
              :modelValue="selectedNode.is_entry_point"
              @update:modelValue="(v) => emit('updateNode', selectedNode!.id, { is_entry_point: v })"
            />
            <span class="text-sm text-gray-600">Punto de entrada</span>
          </div>

          <div class="flex items-center gap-2">
            <ToggleSwitch
              :modelValue="selectedNode.is_active"
              @update:modelValue="(v) => emit('updateNode', selectedNode!.id, { is_active: v })"
            />
            <span class="text-sm text-gray-600">Activo</span>
          </div>

          <Divider />

          <!-- Node Configuration -->
          <div>
            <h5 class="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Configuración del Nodo</h5>
            <NodeConfigForm
              :config="selectedNode.config || {}"
              :nodeDefinition="getNodeDefinition(selectedNode.node_definition_id)"
              @update:config="(v) => emit('updateNode', selectedNode!.id, { config: v })"
            />
          </div>

          <Divider />

          <div class="flex gap-2">
            <Button
              label="Eliminar"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              outlined
              @click="emit('deleteNode', selectedNode)"
            />
          </div>
        </div>
      </div>

      <!-- Edge Properties -->
      <div v-else-if="selectedEdge">
        <h4 class="text-sm font-semibold text-gray-700 mb-4">Transición Seleccionada</h4>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Etiqueta</label>
            <InputText
              :modelValue="selectedEdge.label || ''"
              class="w-full"
              placeholder="Etiqueta opcional"
              @update:modelValue="(v) => emit('updateTransition', selectedEdge!.id, { label: v })"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
            <InputText
              :modelValue="String(selectedEdge.priority)"
              class="w-full"
              type="number"
              @update:modelValue="(v) => emit('updateTransition', selectedEdge!.id, { priority: Number(v) })"
            />
          </div>

          <Divider />

          <!-- Condition Editor -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-2">Condición</label>
            <div v-if="selectedEdge.condition" class="condition-preview p-3 rounded-md bg-purple-50 border border-purple-200 mb-2">
              <div class="flex items-center gap-2 text-sm">
                <Tag :value="selectedEdge.condition.type" severity="secondary" class="text-xs" />
                <span v-if="selectedEdge.condition.value" class="text-purple-700">
                  {{ selectedEdge.condition.field || '' }}
                  {{ selectedEdge.condition.operator || '' }}
                  {{ selectedEdge.condition.value }}
                </span>
                <span v-else-if="(selectedEdge.condition as any).expression" class="text-purple-700 font-mono text-xs truncate">
                  {{ (selectedEdge.condition as any).expression }}
                </span>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400 mb-2">
              Sin condición (siempre ejecuta)
            </div>
            <Button
              :label="selectedEdge.condition ? 'Editar Condición' : 'Agregar Condición'"
              :icon="selectedEdge.condition ? 'pi pi-pencil' : 'pi pi-plus'"
              severity="secondary"
              size="small"
              outlined
              class="w-full"
              @click="showConditionEditor = true"
            />
          </div>

          <Divider />

          <div class="flex gap-2">
            <Button
              label="Eliminar"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              outlined
              @click="emit('deleteTransition', selectedEdge!.id)"
            />
          </div>
        </div>
      </div>

      <!-- No Selection -->
      <div v-else class="text-center py-8">
        <i class="pi pi-info-circle text-3xl text-gray-300" />
        <p class="text-gray-400 mt-2 text-sm">Selecciona un nodo o transición para ver sus propiedades</p>
      </div>

      <!-- Condition Editor Dialog -->
      <ConditionEditorDialog
        v-model:visible="showConditionEditor"
        :condition="selectedEdge?.condition || null"
        @save="onSaveCondition"
      />
    </template>
  </Card>
</template>

<style scoped>
.properties-panel {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}
</style>
