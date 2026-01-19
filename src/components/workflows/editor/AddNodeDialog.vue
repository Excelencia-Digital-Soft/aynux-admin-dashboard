<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import { nodeTypeIcons } from '@/composables/useWorkflowEditor'
import type { NodeDefinition, NodeInstanceCreate } from '@/types/workflow.types'

const props = defineProps<{
  visible: boolean
  definition: NodeDefinition | null
  newNode: NodeInstanceCreate
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'add'): void
  (e: 'cancel'): void
}>()

function getNodeIcon(nodeType: string): string {
  return nodeTypeIcons[nodeType] || 'pi-circle'
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Agregar Nodo"
    :modal="true"
    :style="{ width: '500px' }"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <div v-if="definition" class="flex flex-col gap-4">
      <Message severity="info" :closable="false">
        <div class="flex items-center gap-2">
          <i :class="['pi', definition.icon || getNodeIcon(definition.node_type)]" />
          <span>{{ definition.display_name }} ({{ definition.node_type }})</span>
        </div>
      </Message>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Clave de instancia *</label>
        <InputText v-model="newNode.instance_key" class="w-full" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar *</label>
        <InputText v-model="newNode.display_label" class="w-full" />
      </div>

      <div class="flex items-center gap-2">
        <ToggleSwitch v-model="newNode.is_entry_point" />
        <span class="text-sm text-gray-600">Es punto de entrada</span>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="emit('cancel')" />
      <Button
        label="Agregar"
        icon="pi pi-plus"
        severity="success"
        :disabled="!newNode.instance_key || !newNode.display_label"
        @click="emit('add')"
      />
    </template>
  </Dialog>
</template>
