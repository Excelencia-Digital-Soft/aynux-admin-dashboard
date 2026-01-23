<script setup lang="ts">
/**
 * NodeDefinitionsDialog - Dialog for managing node definitions from within the workflow editor
 *
 * CRUD interface for node definitions catalog embedded in a dialog.
 */
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ColorPicker from 'primevue/colorpicker'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import IconPicker from '@/components/workflows/IconPicker.vue'
import { useWorkflowCatalogStore } from '@/stores/workflow/catalog.store'
import type { NodeDefinition, NodeDefinitionCreate, NodeDefinitionUpdate } from '@/types/workflow.types'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'definitionsUpdated'): void
}>()

const catalogStore = useWorkflowCatalogStore()
const confirm = useConfirm()
const toast = useToast()

// Filters
const searchQuery = ref('')
const categoryFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)

// Edit dialog
const showEditDialog = ref(false)
const isCreating = ref(false)
const editingDefinition = ref<Partial<NodeDefinition>>({})

// Node type options
const nodeTypeOptions = [
  { label: 'Conversacion', value: 'conversation' },
  { label: 'Enrutamiento', value: 'routing' },
  { label: 'Integracion', value: 'integration' },
  { label: 'Utilidad', value: 'utility' }
]

// Category options (common ones + custom)
const categoryOptions = computed(() => {
  const categories = new Set<string>()
  catalogStore.nodeDefinitions.forEach(d => {
    if (d.category) categories.add(d.category)
  })
  // Add common defaults
  ;['Conversacion', 'Enrutamiento', 'Integracion', 'Utilidad', 'custom'].forEach(c => categories.add(c))
  return Array.from(categories).sort().map(c => ({ label: c, value: c }))
})

// Filtered definitions
const filteredDefinitions = computed(() => {
  let result = [...catalogStore.nodeDefinitions]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(d =>
      d.display_name.toLowerCase().includes(q) ||
      d.node_key.toLowerCase().includes(q) ||
      (d.description?.toLowerCase().includes(q))
    )
  }

  if (categoryFilter.value) {
    result = result.filter(d => d.category === categoryFilter.value)
  }

  if (typeFilter.value) {
    result = result.filter(d => d.node_type === typeFilter.value)
  }

  return result
})

// Load data when dialog opens
watch(() => props.visible, async (visible) => {
  if (visible) {
    await loadDefinitions()
  }
})

async function loadDefinitions() {
  try {
    await catalogStore.loadNodeDefinitions()
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las definiciones',
      life: 3000
    })
  }
}

function openCreateDialog() {
  isCreating.value = true
  editingDefinition.value = {
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
  showEditDialog.value = true
}

function openEditDialog(definition: NodeDefinition) {
  isCreating.value = false
  editingDefinition.value = { ...definition }
  showEditDialog.value = true
}

async function saveDefinition() {
  try {
    if (isCreating.value) {
      const createData: NodeDefinitionCreate = {
        node_key: editingDefinition.value.node_key!,
        node_type: editingDefinition.value.node_type || 'conversation',
        display_name: editingDefinition.value.display_name!,
        description: editingDefinition.value.description || undefined,
        icon: editingDefinition.value.icon || 'pi-circle',
        color: editingDefinition.value.color || '#64748b',
        category: editingDefinition.value.category || 'custom',
        config_schema: editingDefinition.value.config_schema || {},
        default_config: editingDefinition.value.default_config || {},
        inputs: editingDefinition.value.inputs || ['default'],
        outputs: editingDefinition.value.outputs || ['default']
      }
      await catalogStore.createNodeDefinition(createData)
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Definicion de nodo creada',
        life: 3000
      })
    } else {
      const updateData: NodeDefinitionUpdate = {
        display_name: editingDefinition.value.display_name,
        description: editingDefinition.value.description ?? undefined,
        icon: editingDefinition.value.icon,
        color: editingDefinition.value.color,
        category: editingDefinition.value.category,
        config_schema: editingDefinition.value.config_schema ?? undefined,
        default_config: editingDefinition.value.default_config,
        inputs: editingDefinition.value.inputs,
        outputs: editingDefinition.value.outputs,
        is_active: editingDefinition.value.is_active
      }
      await catalogStore.updateNodeDefinition(editingDefinition.value.id!, updateData)
      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Definicion de nodo actualizada',
        life: 3000
      })
    }
    showEditDialog.value = false
    emit('definitionsUpdated')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: isCreating.value ? 'No se pudo crear' : 'No se pudo actualizar',
      life: 3000
    })
  }
}

function confirmDelete(definition: NodeDefinition) {
  confirm.require({
    message: `¿Eliminar la definicion "${definition.display_name}"? Esta accion no se puede deshacer.`,
    header: 'Confirmar eliminacion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await catalogStore.deleteNodeDefinition(definition.id)
        toast.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Definicion de nodo eliminada',
          life: 3000
        })
        emit('definitionsUpdated')
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar. Puede estar en uso.',
          life: 3000
        })
      }
    }
  })
}

function getTypeSeverity(type: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
  const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
    conversation: 'info',
    routing: 'warn',
    integration: 'success',
    utility: 'secondary'
  }
  return map[type] || 'secondary'
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Gestionar Definiciones de Nodos"
    :modal="true"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    :contentStyle="{ minHeight: '500px' }"
  >
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <Button
        label="Nuevo Nodo"
        icon="pi pi-plus"
        severity="success"
        @click="openCreateDialog"
      />
      <div class="flex-1" />
      <InputText
        v-model="searchQuery"
        placeholder="Buscar..."
        class="w-48"
      />
      <Select
        v-model="categoryFilter"
        :options="categoryOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Categoria"
        :showClear="true"
        class="w-40"
      />
      <Select
        v-model="typeFilter"
        :options="nodeTypeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo"
        :showClear="true"
        class="w-40"
      />
    </div>

    <!-- Loading -->
    <div v-if="catalogStore.isLoading" class="flex justify-center py-8">
      <ProgressSpinner style="width: 50px; height: 50px" />
    </div>

    <!-- Data Table -->
    <DataTable
      v-else
      :value="filteredDefinitions"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20]"
      responsiveLayout="scroll"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="icon" header="Icono" style="width: 60px">
        <template #body="{ data }">
          <div
            class="w-8 h-8 rounded flex items-center justify-center"
            :style="{ backgroundColor: data.color + '20', color: data.color }"
          >
            <i :class="['pi', data.icon || 'pi-circle']" />
          </div>
        </template>
      </Column>

      <Column field="display_name" header="Nombre" sortable>
        <template #body="{ data }">
          <div>
            <div class="font-medium">{{ data.display_name }}</div>
            <div class="text-sm text-gray-500">{{ data.node_key }}</div>
          </div>
        </template>
      </Column>

      <Column field="node_type" header="Tipo" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag :value="data.node_type" :severity="getTypeSeverity(data.node_type)" />
        </template>
      </Column>

      <Column field="category" header="Categoria" sortable style="width: 120px" />

      <Column field="is_builtin" header="Builtin" style="width: 80px">
        <template #body="{ data }">
          <i v-if="data.is_builtin" class="pi pi-lock text-gray-400" title="Builtin" />
          <i v-else class="pi pi-unlock text-green-500" title="Custom" />
        </template>
      </Column>

      <Column field="is_active" header="Activo" style="width: 80px">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Si' : 'No'"
            :severity="data.is_active ? 'success' : 'danger'"
          />
        </template>
      </Column>

      <Column header="Acciones" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              v-if="!data.is_builtin"
              icon="pi pi-pencil"
              severity="info"
              text
              rounded
              size="small"
              @click="openEditDialog(data)"
              title="Editar"
            />
            <Button
              v-if="!data.is_builtin"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click="confirmDelete(data)"
              title="Eliminar"
            />
            <span v-if="data.is_builtin" class="text-gray-400 text-xs italic px-2">
              Protegido
            </span>
          </div>
        </template>
      </Column>

      <template #empty>
        <Message severity="info" :closable="false">
          No se encontraron definiciones de nodos
        </Message>
      </template>
    </DataTable>

    <!-- Edit/Create Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      :header="isCreating ? 'Nueva Definicion de Nodo' : 'Editar Definicion de Nodo'"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-4">
        <!-- Node Key (solo crear) -->
        <div v-if="isCreating" class="flex flex-col gap-1">
          <label class="font-medium text-sm">Clave (node_key) *</label>
          <InputText
            v-model="editingDefinition.node_key"
            placeholder="mi_nodo_custom"
            :disabled="!isCreating"
          />
          <small class="text-gray-500">Solo letras minusculas, numeros y guiones bajos</small>
        </div>

        <!-- Display Name -->
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Nombre *</label>
          <InputText
            v-model="editingDefinition.display_name"
            placeholder="Mi Nodo Custom"
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Descripcion</label>
          <Textarea
            v-model="editingDefinition.description"
            :rows="2"
            placeholder="Descripcion del nodo..."
          />
        </div>

        <!-- Node Type -->
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Tipo</label>
          <Select
            v-model="editingDefinition.node_type"
            :options="nodeTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
          />
        </div>

        <!-- Category -->
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Categoria</label>
          <Select
            v-model="editingDefinition.category"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            :editable="true"
            placeholder="Seleccionar o escribir"
          />
        </div>

        <!-- Icon & Color -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Icono</label>
            <IconPicker v-model="editingDefinition.icon" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Color</label>
            <div class="flex items-center gap-2">
              <ColorPicker v-model="editingDefinition.color" format="hex" />
              <InputText v-model="editingDefinition.color" class="w-24" />
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Vista Previa</label>
          <div
            class="flex items-center gap-3 p-3 rounded border"
            :style="{ borderLeftColor: editingDefinition.color, borderLeftWidth: '4px' }"
          >
            <div
              class="w-10 h-10 rounded flex items-center justify-center"
              :style="{ backgroundColor: (editingDefinition.color || '#64748b') + '20', color: editingDefinition.color }"
            >
              <i :class="['pi', editingDefinition.icon || 'pi-circle']" style="font-size: 1.25rem" />
            </div>
            <div>
              <div class="font-medium">{{ editingDefinition.display_name || 'Nombre del nodo' }}</div>
              <div class="text-sm text-gray-500">{{ editingDefinition.node_type || 'tipo' }}</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showEditDialog = false" />
        <Button
          :label="isCreating ? 'Crear' : 'Guardar'"
          icon="pi pi-check"
          :loading="catalogStore.isSaving"
          @click="saveDefinition"
        />
      </template>
    </Dialog>
  </Dialog>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
}
</style>
