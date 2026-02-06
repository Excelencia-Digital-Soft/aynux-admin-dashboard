<script setup lang="ts">
/**
 * WorkflowNodeEditModal - Large modal for editing workflow nodes (n8n-style)
 *
 * Features:
 * - Opens on double-click
 * - Large modal with two columns
 * - Tabs: Settings | Input | Output
 * - Contains all node configuration options
 */
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import NodeConfigForm from '@/components/workflows/NodeConfigForm.vue'
import type { NodeInstance, NodeDefinition, NodeInstanceUpdate } from '@/types/workflow.types'

const props = defineProps<{
  visible: boolean
  node: NodeInstance | null
  getNodeDefinition: (id: string) => NodeDefinition | undefined
  nodeInstances?: NodeInstance[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'updateNode', nodeId: string, updates: NodeInstanceUpdate): void
  (e: 'deleteNode', node: NodeInstance): void
}>()

const activeTab = ref('settings')

// Computed for available nodes dropdown
const availableNodes = computed(() => {
  return (props.nodeInstances ?? []).map(node => ({
    id: node.id,
    key: node.instance_key,
    label: node.display_label || node.instance_key
  }))
})

// Get node definition
const nodeDefinition = computed(() => {
  if (!props.node) return undefined
  return props.getNodeDefinition(props.node.node_definition_id)
})

// Local state for node properties
const localNodeProps = ref({
  display_label: '',
  description: '',
  is_entry_point: false,
  is_active: true
})

// Local config state
const localConfig = ref<Record<string, unknown>>({})
const hasUnsavedChanges = ref(false)

// Sync local state when node changes
watch(
  () => props.node,
  (newNode) => {
    if (newNode) {
      localNodeProps.value = {
        display_label: newNode.display_label || '',
        description: newNode.description || '',
        is_entry_point: newNode.is_entry_point || false,
        is_active: newNode.is_active !== false
      }
      localConfig.value = { ...(newNode.config || {}) }
      hasUnsavedChanges.value = false
      activeTab.value = 'settings'
    }
  },
  { immediate: true }
)

// Handle config changes
function onConfigChange(newConfig: Record<string, unknown>) {
  localConfig.value = newConfig
  hasUnsavedChanges.value = true
}

// Mark as changed when props change
function markChanged() {
  hasUnsavedChanges.value = true
}

// Save all changes
function saveChanges() {
  if (!props.node) return

  emit('updateNode', props.node.id, {
    display_label: localNodeProps.value.display_label,
    description: localNodeProps.value.description,
    is_entry_point: localNodeProps.value.is_entry_point,
    is_active: localNodeProps.value.is_active,
    config: localConfig.value
  })

  hasUnsavedChanges.value = false
}

// Discard changes and close
function discardAndClose() {
  hasUnsavedChanges.value = false
  emit('update:visible', false)
}

// Save and close
function saveAndClose() {
  saveChanges()
  emit('update:visible', false)
}

// Handle close with unsaved changes
function handleClose(open: boolean) {
  if (!open && hasUnsavedChanges.value) {
    const discard = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?')
    if (!discard) return
  }
  emit('update:visible', open)
}

// Delete node
function handleDelete() {
  if (props.node) {
    emit('deleteNode', props.node)
    emit('update:visible', false)
  }
}
</script>

<template>
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="wf-node-edit-modal">
      <!-- Header -->
      <DialogHeader class="wf-modal-header">
        <div class="wf-header-left">
          <div
            v-if="nodeDefinition"
            class="wf-node-icon"
            :style="{ backgroundColor: nodeDefinition.color || '#64748b' }"
          >
            <i :class="['pi', nodeDefinition.icon || 'pi-circle']" />
          </div>
          <div class="wf-header-info">
            <DialogTitle class="wf-modal-title">
              {{ localNodeProps.display_label || 'Editar Nodo' }}
            </DialogTitle>
            <DialogDescription class="wf-modal-desc">
              {{ nodeDefinition?.display_name || 'Configuracion del nodo' }}
            </DialogDescription>
          </div>
        </div>
        <div class="wf-header-badges">
          <Badge v-if="hasUnsavedChanges" variant="outline" class="text-yellow-500 border-yellow-500">
            Sin guardar
          </Badge>
          <Badge v-if="localNodeProps.is_entry_point" variant="outline" class="text-green-500 border-green-500">
            Entrada
          </Badge>
        </div>
      </DialogHeader>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="wf-modal-tabs">
        <TabsList class="wf-tabs-list">
          <TabsTrigger value="settings">
            <i class="pi pi-cog mr-2 text-xs" />
            Configuracion
          </TabsTrigger>
          <TabsTrigger value="input">
            <i class="pi pi-sign-in mr-2 text-xs" />
            Entrada
          </TabsTrigger>
          <TabsTrigger value="output">
            <i class="pi pi-sign-out mr-2 text-xs" />
            Salida
          </TabsTrigger>
        </TabsList>

        <!-- Settings Tab -->
        <TabsContent value="settings" class="wf-tab-content">
          <div class="wf-settings-grid">
            <!-- Basic Properties -->
            <div class="wf-settings-section">
              <h3 class="wf-section-title">PROPIEDADES BASICAS</h3>

              <div class="wf-form-group">
                <Label for="node-name" class="text-xs text-muted-foreground">Nombre del nodo</Label>
                <Input
                  id="node-name"
                  v-model="localNodeProps.display_label"
                  placeholder="Nombre descriptivo"
                  @update:model-value="markChanged"
                />
              </div>

              <div class="wf-form-group">
                <Label for="node-description" class="text-xs text-muted-foreground">Descripcion</Label>
                <Textarea
                  id="node-description"
                  v-model="localNodeProps.description"
                  :rows="3"
                  placeholder="Descripcion opcional del nodo"
                  class="resize-none"
                  @update:model-value="markChanged"
                />
              </div>

              <div class="wf-form-inline">
                <Switch
                  v-model:checked="localNodeProps.is_entry_point"
                  @update:checked="markChanged"
                />
                <Label class="text-sm">Punto de entrada</Label>
              </div>

              <div class="wf-form-inline">
                <Switch
                  v-model:checked="localNodeProps.is_active"
                  @update:checked="markChanged"
                />
                <Label class="text-sm">Nodo activo</Label>
              </div>
            </div>

            <!-- Node Configuration -->
            <div class="wf-settings-section">
              <h3 class="wf-section-title">CONFIGURACION ESPECIFICA</h3>

              <div v-if="node && nodeDefinition" class="wf-config-wrapper">
                <NodeConfigForm
                  :config="localConfig"
                  :nodeDefinition="nodeDefinition"
                  :availableNodes="availableNodes"
                  @update:config="onConfigChange"
                />
              </div>
              <div v-else class="wf-empty-config">
                <i class="pi pi-info-circle text-2xl opacity-50" />
                <span class="text-sm">No hay configuracion disponible</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Input Tab -->
        <TabsContent value="input" class="wf-tab-content">
          <div class="wf-io-placeholder">
            <i class="pi pi-sign-in text-4xl opacity-30" />
            <h3 class="text-lg font-semibold">Datos de Entrada</h3>
            <p class="text-sm text-muted-foreground max-w-md text-center">
              Los datos de entrada se mostraran aqui durante la ejecucion del workflow.
            </p>
          </div>
        </TabsContent>

        <!-- Output Tab -->
        <TabsContent value="output" class="wf-tab-content">
          <div class="wf-io-placeholder">
            <i class="pi pi-sign-out text-4xl opacity-30" />
            <h3 class="text-lg font-semibold">Datos de Salida</h3>
            <p class="text-sm text-muted-foreground max-w-md text-center">
              Los datos de salida se mostraran aqui despues de ejecutar el nodo.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <!-- Footer -->
      <div class="wf-modal-footer">
        <Button
          variant="destructive"
          size="sm"
          @click="handleDelete"
        >
          <i class="pi pi-trash mr-2 text-xs" />
          Eliminar
        </Button>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="discardAndClose">
            Cancelar
          </Button>
          <Button
            size="sm"
            :disabled="!hasUnsavedChanges"
            @click="saveAndClose"
          >
            <i class="pi pi-save mr-2 text-xs" />
            Guardar
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style>
/* Global styles to override DialogContent */
.wf-node-edit-modal {
  width: 90vw !important;
  max-width: 900px !important;
  max-height: 80vh !important;
  padding: 0 !important;
  gap: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.wf-modal-header {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 16px 20px !important;
  border-bottom: 1px solid hsl(var(--border)) !important;
  flex-shrink: 0 !important;
  gap: 16px !important;
}

.wf-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wf-node-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wf-node-icon i {
  font-size: 1.25rem;
  color: white;
}

.wf-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wf-modal-title {
  font-size: 1rem !important;
  font-weight: 600 !important;
  margin: 0 !important;
}

.wf-modal-desc {
  font-size: 0.75rem !important;
  color: hsl(var(--muted-foreground)) !important;
  margin: 0 !important;
}

.wf-header-badges {
  display: flex;
  gap: 8px;
}

.wf-modal-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.wf-tabs-list {
  flex-shrink: 0;
  padding: 12px 20px 0;
}

.wf-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.wf-settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 640px) {
  .wf-settings-grid {
    grid-template-columns: 1fr;
  }
}

.wf-settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wf-section-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: hsl(var(--muted-foreground));
  margin-bottom: 4px;
}

.wf-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wf-form-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wf-config-wrapper {
  background: hsl(var(--muted) / 0.3);
  border-radius: 8px;
  padding: 12px;
}

.wf-empty-config {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: hsl(var(--muted-foreground));
  gap: 8px;
}

.wf-io-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  gap: 12px;
}

.wf-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid hsl(var(--border));
  flex-shrink: 0;
}
</style>
