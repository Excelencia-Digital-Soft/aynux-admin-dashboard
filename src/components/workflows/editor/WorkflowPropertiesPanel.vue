<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import NodeConfigForm from '@/components/workflows/NodeConfigForm.vue'
import ConditionEditorDialog from '@/components/workflows/ConditionEditorDialog.vue'
import type { NodeInstance, WorkflowTransition, NodeDefinition, NodeInstanceUpdate, TransitionUpdate, TransitionCondition } from '@/types/workflow.types'

const props = defineProps<{
  visible: boolean
  selectedNode: NodeInstance | null
  selectedEdge: WorkflowTransition | null
  getNodeDefinition: (id: string) => NodeDefinition | undefined
  nodeInstances?: NodeInstance[]
}>()

// Computed for available nodes dropdown
const availableNodes = computed(() => {
  return (props.nodeInstances ?? []).map(node => ({
    id: node.id,
    key: node.instance_key,
    label: node.display_label || node.instance_key
  }))
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'updateNode', nodeId: string, updates: NodeInstanceUpdate): void
  (e: 'deleteNode', node: NodeInstance): void
  (e: 'updateTransition', edgeId: string, updates: TransitionUpdate): void
  (e: 'deleteTransition', edgeId: string): void
}>()

const showConditionEditor = ref(false)
const isFullscreen = ref(false)

// Computed properties for sheet configuration
const sheetSide = computed(() => isFullscreen.value ? 'bottom' : 'right')

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// Local config state for pending changes (avoids immediate API calls on each edit)
const localConfig = ref<Record<string, unknown>>({})
const hasUnsavedConfig = ref(false)

// Local state for node basic properties (display_label, description, is_entry_point, is_active)
const localNodeProps = ref({
  display_label: '',
  description: '',
  is_entry_point: false,
  is_active: false
})
const hasUnsavedNodeProps = ref(false)

// Local state for transition properties (label, priority)
const localTransitionProps = ref({
  label: '',
  priority: 0
})
const hasUnsavedTransitionProps = ref(false)

// Sync local config and node props when selected node changes
watch(
  () => props.selectedNode,
  (newNode, oldNode) => {
    const hasUnsaved = hasUnsavedConfig.value || hasUnsavedNodeProps.value

    // If switching nodes with unsaved changes, prompt for confirmation
    if (hasUnsaved && oldNode && newNode?.id !== oldNode.id) {
      const discard = window.confirm(
        'Tienes cambios sin guardar. ¿Deseas descartarlos?'
      )

      if (!discard) {
        // Save pending changes before switching
        if (hasUnsavedConfig.value) {
          emit('updateNode', oldNode.id, { config: localConfig.value })
        }
        if (hasUnsavedNodeProps.value) {
          emit('updateNode', oldNode.id, {
            display_label: localNodeProps.value.display_label,
            description: localNodeProps.value.description,
            is_entry_point: localNodeProps.value.is_entry_point,
            is_active: localNodeProps.value.is_active
          })
        }
      }
    }

    // Reset to new node values
    if (newNode) {
      localConfig.value = { ...(newNode.config || {}) }
      hasUnsavedConfig.value = false
      localNodeProps.value = {
        display_label: newNode.display_label || '',
        description: newNode.description || '',
        is_entry_point: newNode.is_entry_point || false,
        is_active: newNode.is_active !== false // default to true if undefined
      }
      hasUnsavedNodeProps.value = false
    } else {
      localConfig.value = {}
      hasUnsavedConfig.value = false
      localNodeProps.value = { display_label: '', description: '', is_entry_point: false, is_active: false }
      hasUnsavedNodeProps.value = false
    }
  },
  { immediate: true }
)

// Sync local transition props when selected edge changes
watch(
  () => props.selectedEdge,
  (edge) => {
    if (edge) {
      localTransitionProps.value = {
        label: edge.label || '',
        priority: edge.priority || 0
      }
      hasUnsavedTransitionProps.value = false
    } else {
      localTransitionProps.value = { label: '', priority: 0 }
      hasUnsavedTransitionProps.value = false
    }
  },
  { immediate: true }
)

// Handle config changes from NodeConfigForm - accumulate locally without emitting
function onConfigChange(newConfig: Record<string, unknown>) {
  localConfig.value = newConfig
  hasUnsavedConfig.value = true
}

// Save accumulated config changes to the node
function saveConfig() {
  if (props.selectedNode && hasUnsavedConfig.value) {
    emit('updateNode', props.selectedNode.id, { config: localConfig.value })
    hasUnsavedConfig.value = false
  }
}

// Discard pending changes and reset to original
function discardConfigChanges() {
  if (props.selectedNode) {
    localConfig.value = { ...(props.selectedNode.config || {}) }
    hasUnsavedConfig.value = false
  }
}

// Save node basic properties (display_label, description, is_entry_point, is_active)
function saveNodeProps() {
  if (props.selectedNode && hasUnsavedNodeProps.value) {
    emit('updateNode', props.selectedNode.id, {
      display_label: localNodeProps.value.display_label,
      description: localNodeProps.value.description,
      is_entry_point: localNodeProps.value.is_entry_point,
      is_active: localNodeProps.value.is_active
    })
    hasUnsavedNodeProps.value = false
  }
}

// Discard node property changes
function discardNodeProps() {
  if (props.selectedNode) {
    localNodeProps.value = {
      display_label: props.selectedNode.display_label || '',
      description: props.selectedNode.description || '',
      is_entry_point: props.selectedNode.is_entry_point || false,
      is_active: props.selectedNode.is_active !== false
    }
    hasUnsavedNodeProps.value = false
  }
}

// Save transition properties (label, priority)
function saveTransitionProps() {
  if (props.selectedEdge && hasUnsavedTransitionProps.value) {
    emit('updateTransition', props.selectedEdge.id, {
      label: localTransitionProps.value.label,
      priority: localTransitionProps.value.priority
    })
    hasUnsavedTransitionProps.value = false
  }
}

// Discard transition property changes
function discardTransitionProps() {
  if (props.selectedEdge) {
    localTransitionProps.value = {
      label: props.selectedEdge.label || '',
      priority: props.selectedEdge.priority || 0
    }
    hasUnsavedTransitionProps.value = false
  }
}

function onSaveCondition(condition: TransitionCondition | null) {
  if (!props.selectedEdge) return
  emit('updateTransition', props.selectedEdge.id, { condition: condition || undefined })
}
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <Sheet :open="visible" @update:open="emit('update:visible', $event)">
      <SheetContent
        :side="sheetSide"
        :class="`properties-sheet ${isFullscreen ? 'properties-sheet--fullscreen' : 'w-full md:w-96'}`"
      >
        <SheetHeader class="flex flex-row items-center justify-between space-y-0 pb-4 pr-10">
          <div class="flex items-center gap-2">
            <i class="pi pi-sliders-h text-lg" />
            <SheetTitle>Propiedades</SheetTitle>
          </div>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="toggleFullscreen"
              >
                <i :class="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" class="text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {{ isFullscreen ? 'Minimizar' : 'Pantalla completa' }}
            </TooltipContent>
          </Tooltip>
          <SheetDescription class="sr-only">
            Panel de propiedades para nodos y transiciones del workflow
          </SheetDescription>
        </SheetHeader>

        <div class="properties-content">
          <!-- Node Properties -->
          <div v-if="selectedNode">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-foreground">Nodo Seleccionado</h4>
              <Badge v-if="hasUnsavedNodeProps" variant="warning" class="text-xs">Sin guardar</Badge>
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="node-name" class="text-xs font-medium text-muted-foreground">Nombre</Label>
                <Input
                  id="node-name"
                  v-model="localNodeProps.display_label"
                  class="w-full"
                  @update:model-value="hasUnsavedNodeProps = true"
                />
              </div>

              <div class="space-y-2">
                <Label for="node-description" class="text-xs font-medium text-muted-foreground">Descripción</Label>
                <Textarea
                  id="node-description"
                  v-model="localNodeProps.description"
                  :rows="2"
                  class="w-full resize-none"
                  @update:model-value="hasUnsavedNodeProps = true"
                />
              </div>

              <div class="flex items-center gap-2">
                <Switch
                  v-model:checked="localNodeProps.is_entry_point"
                  @update:checked="hasUnsavedNodeProps = true"
                />
                <span class="text-sm text-muted-foreground">Punto de entrada</span>
              </div>

              <div class="flex items-center gap-2">
                <Switch
                  v-model:checked="localNodeProps.is_active"
                  @update:checked="hasUnsavedNodeProps = true"
                />
                <span class="text-sm text-muted-foreground">Activo</span>
              </div>

              <!-- Save/Discard buttons for node basic properties -->
              <div v-if="hasUnsavedNodeProps" class="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  class="bg-green-600 hover:bg-green-700"
                  @click="saveNodeProps"
                >
                  <i class="pi pi-save mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="discardNodeProps"
                >
                  <i class="pi pi-undo mr-2" />
                  Descartar
                </Button>
              </div>

              <Separator />

              <!-- Node Configuration -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h5 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configuración del Nodo</h5>
                  <Badge v-if="hasUnsavedConfig" variant="warning" class="text-xs">Sin guardar</Badge>
                </div>
                <NodeConfigForm
                  :config="localConfig"
                  :nodeDefinition="getNodeDefinition(selectedNode.node_definition_id)"
                  :availableNodes="availableNodes"
                  @update:config="onConfigChange"
                />

                <!-- Save/Discard buttons for config changes -->
                <div v-if="hasUnsavedConfig" class="flex gap-2 mt-4">
                  <Button
                    variant="default"
                    size="sm"
                    class="bg-green-600 hover:bg-green-700"
                    @click="saveConfig"
                  >
                    <i class="pi pi-save mr-2" />
                    Guardar Configuración
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    @click="discardConfigChanges"
                  >
                    <i class="pi pi-undo mr-2" />
                    Descartar
                  </Button>
                </div>
              </div>

              <Separator />

              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  @click="emit('deleteNode', selectedNode)"
                >
                  <i class="pi pi-trash mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>

          <!-- Edge Properties -->
          <div v-else-if="selectedEdge">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-foreground">Transición Seleccionada</h4>
              <Badge v-if="hasUnsavedTransitionProps" variant="warning" class="text-xs">Sin guardar</Badge>
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="edge-label" class="text-xs font-medium text-muted-foreground">Etiqueta</Label>
                <Input
                  id="edge-label"
                  v-model="localTransitionProps.label"
                  class="w-full"
                  placeholder="Etiqueta opcional"
                  @update:model-value="hasUnsavedTransitionProps = true"
                />
              </div>

              <div class="space-y-2">
                <Label for="edge-priority" class="text-xs font-medium text-muted-foreground">Prioridad</Label>
                <Input
                  id="edge-priority"
                  v-model.number="localTransitionProps.priority"
                  class="w-full"
                  type="number"
                  @update:model-value="hasUnsavedTransitionProps = true"
                />
              </div>

              <!-- Save/Discard buttons for transition properties -->
              <div v-if="hasUnsavedTransitionProps" class="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  class="bg-green-600 hover:bg-green-700"
                  @click="saveTransitionProps"
                >
                  <i class="pi pi-save mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="discardTransitionProps"
                >
                  <i class="pi pi-undo mr-2" />
                  Descartar
                </Button>
              </div>

              <Separator />

              <!-- Condition Editor -->
              <div>
                <Label class="text-xs font-medium text-muted-foreground mb-2 block">Condición</Label>
                <div v-if="selectedEdge.condition" class="condition-preview p-3 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 mb-2">
                  <div class="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" class="text-xs">{{ selectedEdge.condition.type }}</Badge>
                    <span v-if="selectedEdge.condition.value" class="text-purple-700 dark:text-purple-300">
                      {{ selectedEdge.condition.field || '' }}
                      {{ selectedEdge.condition.operator || '' }}
                      {{ selectedEdge.condition.value }}
                    </span>
                    <span v-else-if="selectedEdge.condition.expression" class="text-purple-700 dark:text-purple-300 font-mono text-xs truncate">
                      {{ selectedEdge.condition.expression }}
                    </span>
                  </div>
                </div>
                <div v-else class="text-sm text-muted-foreground mb-2">
                  Sin condición (siempre ejecuta)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  @click="showConditionEditor = true"
                >
                  <i :class="selectedEdge.condition ? 'pi pi-pencil' : 'pi pi-plus'" class="mr-2" />
                  {{ selectedEdge.condition ? 'Editar Condición' : 'Agregar Condición' }}
                </Button>
              </div>

              <Separator />

              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  @click="emit('deleteTransition', selectedEdge!.id)"
                >
                  <i class="pi pi-trash mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>

          <!-- No Selection -->
          <div v-else class="text-center py-8">
            <i class="pi pi-info-circle text-3xl text-muted-foreground/50" />
            <p class="text-muted-foreground mt-2 text-sm">Selecciona un nodo o transición para ver sus propiedades</p>
          </div>
        </div>

        <!-- Condition Editor Dialog -->
        <ConditionEditorDialog
          v-model:visible="showConditionEditor"
          :condition="selectedEdge?.condition || null"
          @save="onSaveCondition"
        />
      </SheetContent>
    </Sheet>
  </TooltipProvider>
</template>

<style scoped>
.properties-content {
  padding: 0.5rem 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0; /* Required for flex child to allow shrinking and enable scroll */
}

/* Fullscreen mode - use full width */
.properties-sheet--fullscreen {
  padding-bottom: 1rem;
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  inset: 0 !important;
}

.properties-sheet--fullscreen .properties-content {
  width: 100%;
  max-width: 100%;
  padding: 1rem 2rem;
  padding-bottom: 2rem;
}
</style>
