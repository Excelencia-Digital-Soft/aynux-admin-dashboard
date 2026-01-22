<script setup lang="ts">
/**
 * NodeDefinitionsPage - Manage workflow node definitions catalog
 *
 * Allows creating, editing, and deleting custom node definitions
 * for use in the workflow editor.
 */
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useWorkflowCatalogStore } from '@/stores/workflow/catalog.store'
import type {
  NodeDefinition,
  NodeDefinitionCreate,
  NodeDefinitionUpdate
} from '@/types/workflow.types'
import IconPicker from '@/components/workflows/IconPicker.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ColorPicker from 'primevue/colorpicker'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const catalogStore = useWorkflowCatalogStore()

// State
const loading = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const editingNodeDef = ref<NodeDefinition | null>(null)
const newNodeDef = ref<NodeDefinitionCreate>({
  node_key: '',
  node_type: 'conversation',
  display_name: '',
  description: '',
  icon: 'pi-circle',
  color: '#64748b',
  category: 'custom',
  config_schema: {},
  default_config: {},
  inputs: ['default'],
  outputs: ['default']
})

// JSON editors state
const configSchemaJson = ref('')
const defaultConfigJson = ref('')
const editConfigSchemaJson = ref('')
const editDefaultConfigJson = ref('')

// Filters
const categoryFilter = ref<string | undefined>(undefined)
const typeFilter = ref<string | undefined>(undefined)
const activeOnlyFilter = ref(false)

// Options
const nodeTypeOptions = [
  { value: 'conversation', label: 'Conversation' },
  { value: 'routing', label: 'Routing' },
  { value: 'integration', label: 'Integration' },
  { value: 'utility', label: 'Utility' }
]

const categoryOptions = computed(() => {
  const categories = new Set(catalogStore.nodeDefinitions.map((n) => n.category))
  return [
    { value: undefined, label: 'Todas las categorias' },
    ...Array.from(categories).map((c) => ({ value: c, label: c }))
  ]
})

const typeFilterOptions = [
  { value: undefined, label: 'Todos los tipos' },
  ...nodeTypeOptions
]

// Stats
const stats = computed(() => {
  const defs = catalogStore.nodeDefinitions
  const byCategory: Record<string, number> = {}
  defs.forEach((d) => {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1
  })
  return {
    total: defs.length,
    active: defs.filter((d) => d.is_active).length,
    builtin: defs.filter((d) => d.is_builtin).length,
    custom: defs.filter((d) => !d.is_builtin).length,
    byCategory
  }
})

// Filtered definitions
const filteredDefinitions = computed(() => {
  let defs = catalogStore.nodeDefinitions
  if (categoryFilter.value) {
    defs = defs.filter((d) => d.category === categoryFilter.value)
  }
  if (typeFilter.value) {
    defs = defs.filter((d) => d.node_type === typeFilter.value)
  }
  if (activeOnlyFilter.value) {
    defs = defs.filter((d) => d.is_active)
  }
  return defs
})

// Fetch definitions
async function fetchDefinitions() {
  loading.value = true
  try {
    await catalogStore.loadNodeDefinitions({ active_only: false })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las definiciones de nodos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Get node type severity
function getNodeTypeSeverity(
  type: string
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
  const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    conversation: 'info',
    routing: 'warn',
    integration: 'success',
    utility: 'secondary'
  }
  return map[type] || 'secondary'
}

// Open create dialog
function openCreateDialog() {
  newNodeDef.value = {
    node_key: '',
    node_type: 'conversation',
    display_name: '',
    description: '',
    icon: 'pi-circle',
    color: '#64748b',
    category: 'custom',
    config_schema: {},
    default_config: {},
    inputs: ['default'],
    outputs: ['default']
  }
  configSchemaJson.value = '{}'
  defaultConfigJson.value = '{}'
  createDialogVisible.value = true
}

// Create node definition
async function createNodeDefinition() {
  if (!newNodeDef.value.node_key || !newNodeDef.value.display_name) {
    toast.add({
      severity: 'warn',
      summary: 'Campos requeridos',
      detail: 'Node Key y Nombre son obligatorios',
      life: 3000
    })
    return
  }

  // Parse JSON fields
  try {
    newNodeDef.value.config_schema = JSON.parse(configSchemaJson.value || '{}')
    newNodeDef.value.default_config = JSON.parse(defaultConfigJson.value || '{}')
  } catch {
    toast.add({
      severity: 'error',
      summary: 'JSON invalido',
      detail: 'Revisa el formato JSON de config_schema o default_config',
      life: 3000
    })
    return
  }

  // Add # prefix to color if missing
  if (newNodeDef.value.color && !newNodeDef.value.color.startsWith('#')) {
    newNodeDef.value.color = `#${newNodeDef.value.color}`
  }

  try {
    await catalogStore.createNodeDefinition(newNodeDef.value)
    toast.add({
      severity: 'success',
      summary: 'Definicion creada',
      detail: newNodeDef.value.display_name,
      life: 2000
    })
    createDialogVisible.value = false
  } catch (error: unknown) {
    const errorDetail =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'No se pudo crear la definicion'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorDetail || 'No se pudo crear la definicion',
      life: 3000
    })
  }
}

// Open edit dialog
function openEditDialog(nodeDef: NodeDefinition) {
  editingNodeDef.value = { ...nodeDef }
  editConfigSchemaJson.value = JSON.stringify(nodeDef.config_schema || {}, null, 2)
  editDefaultConfigJson.value = JSON.stringify(nodeDef.default_config || {}, null, 2)
  editDialogVisible.value = true
}

// Save edited definition
async function saveNodeDefinition() {
  if (!editingNodeDef.value) return

  // Parse JSON fields
  let configSchema: Record<string, unknown>
  let defaultConfig: Record<string, unknown>
  try {
    configSchema = JSON.parse(editConfigSchemaJson.value || '{}')
    defaultConfig = JSON.parse(editDefaultConfigJson.value || '{}')
  } catch {
    toast.add({
      severity: 'error',
      summary: 'JSON invalido',
      detail: 'Revisa el formato JSON de config_schema o default_config',
      life: 3000
    })
    return
  }

  const updates: NodeDefinitionUpdate = {
    display_name: editingNodeDef.value.display_name,
    description: editingNodeDef.value.description ?? undefined,
    icon: editingNodeDef.value.icon ?? undefined,
    color: editingNodeDef.value.color ?? undefined,
    category: editingNodeDef.value.category,
    is_active: editingNodeDef.value.is_active
  }

  // Only include structural fields for non-builtin nodes
  if (!editingNodeDef.value.is_builtin) {
    updates.config_schema = configSchema
    updates.default_config = defaultConfig
    updates.inputs = editingNodeDef.value.inputs
    updates.outputs = editingNodeDef.value.outputs
  }

  try {
    await catalogStore.updateNodeDefinition(editingNodeDef.value.id, updates)
    toast.add({
      severity: 'success',
      summary: 'Definicion actualizada',
      detail: editingNodeDef.value.display_name,
      life: 2000
    })
    editDialogVisible.value = false
    editingNodeDef.value = null
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar la definicion',
      life: 3000
    })
  }
}

// Confirm delete
function confirmDelete(nodeDef: NodeDefinition) {
  if (nodeDef.is_builtin) {
    toast.add({
      severity: 'warn',
      summary: 'No permitido',
      detail: 'No se pueden eliminar nodos builtin',
      life: 3000
    })
    return
  }

  confirm.require({
    message: `Estas seguro de eliminar "${nodeDef.display_name}"? Esta accion no se puede deshacer.`,
    header: 'Confirmar eliminacion',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => deleteNodeDefinition(nodeDef)
  })
}

// Delete definition
async function deleteNodeDefinition(nodeDef: NodeDefinition) {
  try {
    await catalogStore.deleteNodeDefinition(nodeDef.id)
    toast.add({
      severity: 'success',
      summary: 'Definicion eliminada',
      detail: nodeDef.display_name,
      life: 2000
    })
  } catch (error: unknown) {
    const errorDetail =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'No se pudo eliminar la definicion'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorDetail || 'No se pudo eliminar la definicion',
      life: 3000
    })
  }
}

// Initialize
onMounted(() => {
  fetchDefinitions()
})
</script>

<template>
  <div class="node-definitions-page p-6">
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Definiciones de Nodos</h1>
        <p class="text-gray-500 mt-1">
          Administra el catalogo de tipos de nodos para el editor de workflows
        </p>
      </div>
      <Button
        label="Nueva Definicion"
        icon="pi pi-plus"
        severity="primary"
        @click="openCreateDialog"
      />
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-800">{{ stats.total }}</div>
            <div class="text-gray-500">Total</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats.active }}</div>
            <div class="text-gray-500">Activos</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats.builtin }}</div>
            <div class="text-gray-500">Builtin</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ stats.custom }}</div>
            <div class="text-gray-500">Custom</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <Select
              v-model="categoryFilter"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas"
              class="w-full"
            />
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="typeFilter"
              :options="typeFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
            />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <ToggleSwitch v-model="activeOnlyFilter" />
            <span class="text-sm text-gray-600">Solo activos</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Definitions Table -->
    <Card>
      <template #content>
        <div v-if="loading" class="flex justify-center py-8">
          <ProgressSpinner />
        </div>

        <DataTable
          v-else
          :value="filteredDefinitions"
          :paginator="true"
          :rows="15"
          :rowsPerPageOptions="[10, 15, 25, 50]"
          sortField="category"
          :sortOrder="1"
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-500">
              <i class="pi pi-box text-4xl mb-4" />
              <p>No hay definiciones de nodos</p>
            </div>
          </template>

          <Column field="node_key" header="Node Key" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded flex items-center justify-center"
                  :style="{ backgroundColor: data.color + '20', color: data.color }"
                >
                  <i :class="`pi ${data.icon}`" />
                </div>
                <div>
                  <div class="font-mono text-sm">{{ data.node_key }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="display_name" header="Nombre" sortable>
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.display_name }}</div>
                <div class="text-xs text-gray-400 truncate max-w-xs" :title="data.description">
                  {{ data.description || '-' }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="category" header="Categoria" sortable>
            <template #body="{ data }">
              <Tag :value="data.category" severity="secondary" />
            </template>
          </Column>

          <Column field="node_type" header="Tipo" sortable>
            <template #body="{ data }">
              <Tag :value="data.node_type" :severity="getNodeTypeSeverity(data.node_type)" />
            </template>
          </Column>

          <Column header="Origen" style="width: 100px">
            <template #body="{ data }">
              <Tag
                :value="data.is_builtin ? 'Builtin' : 'Custom'"
                :severity="data.is_builtin ? 'info' : 'success'"
              />
            </template>
          </Column>

          <Column field="is_active" header="Activo" style="width: 80px">
            <template #body="{ data }">
              <i
                :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-gray-400'"
              />
            </template>
          </Column>

          <Column header="Acciones" style="width: 100px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="openEditDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :disabled="data.is_builtin"
                  v-tooltip.top="data.is_builtin ? 'No se puede eliminar' : 'Eliminar'"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Create Dialog -->
    <Dialog
      v-model:visible="createDialogVisible"
      header="Nueva Definicion de Nodo"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Node Key <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="newNodeDef.node_key"
              class="w-full"
              placeholder="my_custom_node"
            />
            <small class="text-gray-400">Identificador unico, snake_case</small>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="newNodeDef.display_name"
              class="w-full"
              placeholder="Mi Nodo Custom"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea
            v-model="newNodeDef.description"
            rows="2"
            class="w-full"
            placeholder="Describe que hace este nodo..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="newNodeDef.node_type"
              :options="nodeTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <InputText v-model="newNodeDef.category" class="w-full" placeholder="custom" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icono</label>
            <IconPicker v-model="newNodeDef.icon" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div class="flex items-center gap-2">
              <ColorPicker v-model="newNodeDef.color" format="hex" />
              <InputText v-model="newNodeDef.color" class="flex-1" placeholder="#64748b" />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Config Schema (JSON)</label>
          <Textarea
            v-model="configSchemaJson"
            rows="4"
            class="w-full font-mono text-sm"
            placeholder="{}"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Default Config (JSON)</label>
          <Textarea
            v-model="defaultConfigJson"
            rows="3"
            class="w-full font-mono text-sm"
            placeholder="{}"
          />
        </div>

        <Message severity="info" :closable="false">
          <p class="text-sm">
            Los nodos custom usan un handler generico. Para funcionalidad avanzada,
            se requiere implementacion en el backend.
          </p>
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="createDialogVisible = false" />
        <Button label="Crear" icon="pi pi-plus" severity="success" @click="createNodeDefinition" />
      </template>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      header="Editar Definicion de Nodo"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="editingNodeDef" class="flex flex-col gap-4">
        <Message v-if="editingNodeDef.is_builtin" severity="warn" :closable="false">
          <p class="text-sm">
            Este es un nodo builtin. Solo se pueden editar campos de presentacion
            (nombre, descripcion, icono, color).
          </p>
        </Message>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Node Key</label>
            <InputText :modelValue="editingNodeDef.node_key" class="w-full" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <InputText v-model="editingNodeDef.display_name" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea v-model="editingNodeDef.description" rows="2" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icono</label>
            <IconPicker v-model="editingNodeDef.icon" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div class="flex items-center gap-2">
              <ColorPicker v-model="editingNodeDef.color" format="hex" />
              <InputText v-model="editingNodeDef.color" class="flex-1" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <InputText v-model="editingNodeDef.category" class="w-full" />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <ToggleSwitch v-model="editingNodeDef.is_active" />
            <span class="text-sm">Activo</span>
          </div>
        </div>

        <template v-if="!editingNodeDef.is_builtin">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Config Schema (JSON)</label>
            <Textarea
              v-model="editConfigSchemaJson"
              rows="4"
              class="w-full font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Default Config (JSON)</label>
            <Textarea
              v-model="editDefaultConfigJson"
              rows="3"
              class="w-full font-mono text-sm"
            />
          </div>
        </template>

        <div v-if="editingNodeDef.is_builtin" class="text-sm text-gray-500">
          <strong>Python Class:</strong> {{ editingNodeDef.python_class }}<br />
          <strong>Python Module:</strong> {{ editingNodeDef.python_module }}
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="editDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" severity="success" @click="saveNodeDefinition" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.node-definitions-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
