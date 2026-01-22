<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Drawer from 'primevue/drawer'
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
  visible: boolean
  selectedNode: NodeInstance | null
  selectedEdge: WorkflowTransition | null
  getNodeDefinition: (id: string) => NodeDefinition | undefined
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'updateNode', nodeId: string, updates: NodeInstanceUpdate): void
  (e: 'deleteNode', node: NodeInstance): void
  (e: 'updateTransition', edgeId: string, updates: TransitionUpdate): void
  (e: 'deleteTransition', edgeId: string): void
}>()

const showConditionEditor = ref(false)
const isFullscreen = ref(false)

// Computed properties for drawer configuration
const drawerPosition = computed(() => isFullscreen.value ? 'full' : 'right')
const drawerClass = computed(() =>
  isFullscreen.value
    ? 'properties-drawer properties-drawer--fullscreen'
    : 'properties-drawer !w-full md:!w-96'
)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// Local config state for pending changes (avoids immediate API calls on each edit)
const localConfig = ref<Record<string, unknown>>({})
const hasUnsavedConfig = ref(false)

// Sync local config when selected node changes
watch(
  () => props.selectedNode,
  (node) => {
    if (node) {
      localConfig.value = { ...(node.config || {}) }
      hasUnsavedConfig.value = false
    } else {
      localConfig.value = {}
      hasUnsavedConfig.value = false
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

function onSaveCondition(condition: TransitionCondition | null) {
  if (!props.selectedEdge) return
  emit('updateTransition', props.selectedEdge.id, { condition: condition || undefined })
}
</script>

<template>
  <Drawer
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :position="drawerPosition"
    :class="drawerClass"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <i class="pi pi-sliders-h text-lg" />
          <span class="font-semibold">Propiedades</span>
        </div>
        <Button
          :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
          severity="secondary"
          text
          rounded
          size="small"
          v-tooltip.left="isFullscreen ? 'Minimizar' : 'Pantalla completa'"
          @click="toggleFullscreen"
        />
      </div>
    </template>

    <div class="properties-content">
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
            <div class="flex items-center justify-between mb-3">
              <h5 class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Configuración del Nodo</h5>
              <Tag v-if="hasUnsavedConfig" severity="warn" class="text-xs">Sin guardar</Tag>
            </div>
            <NodeConfigForm
              :config="localConfig"
              :nodeDefinition="getNodeDefinition(selectedNode.node_definition_id)"
              @update:config="onConfigChange"
            />

            <!-- Save/Discard buttons for config changes -->
            <div v-if="hasUnsavedConfig" class="flex gap-2 mt-4">
              <Button
                label="Guardar Configuración"
                icon="pi pi-save"
                severity="success"
                size="small"
                @click="saveConfig"
              />
              <Button
                label="Descartar"
                icon="pi pi-undo"
                severity="secondary"
                size="small"
                outlined
                @click="discardConfigChanges"
              />
            </div>
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
    </div>

    <!-- Condition Editor Dialog -->
    <ConditionEditorDialog
      v-model:visible="showConditionEditor"
      :condition="selectedEdge?.condition || null"
      @save="onSaveCondition"
    />
  </Drawer>
</template>

<style scoped>
.properties-content {
  padding: 0.5rem 0;
}
</style>

<style>
/* Drawer styles */
.properties-drawer .p-drawer-header {
  padding-right: 0.5rem;
}

/* Fullscreen mode - center content with max width */
.properties-drawer--fullscreen .p-drawer-content {
  display: flex;
  justify-content: center;
}

.properties-drawer--fullscreen .properties-content {
  width: 100%;
  max-width: 800px;
  padding: 1rem 2rem;
}

/* Drawer dark mode styles */
.dark-mode .properties-drawer .p-drawer-content {
  background-color: var(--aynux-navy-800) !important;
}

.dark-mode .properties-drawer .p-drawer-header {
  background-color: var(--aynux-navy-800) !important;
  border-bottom-color: var(--aynux-navy-700) !important;
}
</style>
