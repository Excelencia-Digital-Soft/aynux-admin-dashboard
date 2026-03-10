<script setup lang="ts">
/**
 * AddNodeDialog - Dialog for adding a new node to the workflow
 *
 * Allows users to configure a new node instance with:
 * - Instance key (unique identifier)
 * - Display label (human-readable name)
 * - Entry point toggle
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { nodeTypeIcons } from '@/composables/useWorkflowEditor'
import type { NodeDefinition, NodeInstanceCreate } from '@/types/workflow-node.types'

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

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Agregar Nodo</DialogTitle>
        <DialogDescription class="sr-only">Configurar un nuevo nodo para el workflow</DialogDescription>
      </DialogHeader>

      <div v-if="definition" class="flex flex-col gap-4 py-4">
        <!-- Node type info -->
        <Alert variant="info">
          <AlertDescription>
            <div class="flex items-center gap-2">
              <i :class="['pi', definition.icon || getNodeIcon(definition.node_type)]" />
              <span>{{ definition.display_name }} ({{ definition.node_type }})</span>
            </div>
          </AlertDescription>
        </Alert>

        <!-- Instance key -->
        <div class="grid gap-2">
          <Label for="instance-key">Clave de instancia *</Label>
          <Input
            id="instance-key"
            v-model="newNode.instance_key"
            placeholder="ej: nodo_verificacion"
          />
        </div>

        <!-- Display label -->
        <div class="grid gap-2">
          <Label for="display-label">Nombre para mostrar *</Label>
          <Input
            id="display-label"
            v-model="newNode.display_label"
            placeholder="ej: Verificacion de datos"
          />
        </div>

        <!-- Entry point toggle -->
        <div class="flex items-center gap-3">
          <Switch
            :checked="newNode.is_entry_point"
            @update:checked="(v: boolean) => (newNode.is_entry_point = v)"
          />
          <Label class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            Es punto de entrada
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="emit('cancel')">
          Cancelar
        </Button>
        <Button
          :disabled="!newNode.instance_key || !newNode.display_label"
          @click="emit('add')"
        >
          <i class="pi pi-plus mr-2" />
          Agregar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
