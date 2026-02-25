<script setup lang="ts">
/**
 * NodeDefinitionsDialog - Dialog for managing node definitions from within the workflow editor
 *
 * CRUD interface for node definitions catalog embedded in a dialog.
 * Migrated from PrimeVue to shadcn-vue with glassmorphism.
 */
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pagination } from '@/components/ui/pagination'
import IconPicker from '@/components/workflows/IconPicker.vue'
import { useToast } from '@/composables/useToast'
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
const toast = useToast()

// Filters
const searchQuery = ref('')
const categoryFilter = ref<string>('')
const typeFilter = ref<string>('')

// Pagination
const currentPage = ref(1)
const rowsPerPage = ref(10)

// Sorting
const sortField = ref<'display_name' | 'node_type' | 'category'>('display_name')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Edit dialog
const showEditDialog = ref(false)
const isCreating = ref(false)
const editingDefinition = ref<Partial<NodeDefinition>>({})

// Delete confirmation
const showDeleteDialog = ref(false)
const deletingDefinition = ref<NodeDefinition | null>(null)

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

// Sorted definitions
const sortedDefinitions = computed(() => {
  const result = [...filteredDefinitions.value]
  result.sort((a, b) => {
    const aVal = (a[sortField.value] ?? '').toLowerCase()
    const bVal = (b[sortField.value] ?? '').toLowerCase()
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  return result
})

// Paginated definitions
const paginatedDefinitions = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return sortedDefinitions.value.slice(start, start + rowsPerPage.value)
})

const totalRecords = computed(() => filteredDefinitions.value.length)

// Reset to page 1 when filters change
watch([searchQuery, categoryFilter, typeFilter], () => {
  currentPage.value = 1
})

// Load data when dialog opens
watch(() => props.visible, async (visible) => {
  if (visible) {
    await loadDefinitions()
  }
})

function toggleSort(field: 'display_name' | 'node_type' | 'category') {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return 'pi pi-sort-alt'
  return sortDirection.value === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down'
}

async function loadDefinitions() {
  try {
    await catalogStore.loadNodeDefinitions()
  } catch (error) {
    console.error('[NodeDefinitionsDialog] Failed to load node definitions:', error)
    toast.error('No se pudieron cargar las definiciones')
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
      toast.success('Definicion de nodo creada')
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
      toast.success('Definicion de nodo actualizada')
    }
    showEditDialog.value = false
    emit('definitionsUpdated')
  } catch (error) {
    console.error('[NodeDefinitionsDialog] Failed to save node definition:', {
      isCreating: isCreating.value,
      nodeKey: editingDefinition.value.node_key,
      error
    })
    toast.error(isCreating.value ? 'No se pudo crear' : 'No se pudo actualizar')
  }
}

function confirmDelete(definition: NodeDefinition) {
  deletingDefinition.value = definition
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (!deletingDefinition.value) return

  try {
    await catalogStore.deleteNodeDefinition(deletingDefinition.value.id)
    toast.success('Definicion de nodo eliminada')
    emit('definitionsUpdated')
  } catch (error) {
    console.error('[NodeDefinitionsDialog] Failed to delete node definition:', {
      definitionId: deletingDefinition.value.id,
      nodeKey: deletingDefinition.value.node_key,
      error
    })
    toast.error('No se pudo eliminar. Puede estar en uso.')
  } finally {
    showDeleteDialog.value = false
    deletingDefinition.value = null
  }
}

function getTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    conversation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    routing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    integration: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    utility: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
  return map[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

function handleClose() {
  emit('update:visible', false)
}

function handlePageChange(page: number) {
  currentPage.value = page
}
</script>

<template>
  <!-- Main Dialog -->
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="sm:max-w-[1200px] w-[90vw] glass-dialog max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle class="text-lg font-semibold text-white">
          Gestionar Definiciones de Nodos
        </DialogTitle>
        <DialogDescription class="sr-only">Catalogo de definiciones de nodos disponibles</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto min-h-0">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <Button variant="default" @click="openCreateDialog">
            <i class="pi pi-plus mr-2" />
            Nuevo Nodo
          </Button>
          <div class="flex-1" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar..."
            class="w-48"
          />
          <Select v-model="categoryFilter">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="typeFilter">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem
                v-for="option in nodeTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Loading -->
        <div v-if="catalogStore.isLoading" class="flex justify-center py-8">
          <div class="animate-spin h-12 w-12 border-2 border-current border-t-transparent rounded-full text-muted-foreground" />
        </div>

        <!-- Data Table -->
        <template v-else>
          <div class="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow class="border-white/10 hover:bg-white/5">
                  <TableHead class="w-[60px] text-gray-300">Icono</TableHead>
                  <TableHead
                    class="text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                    @click="toggleSort('display_name')"
                  >
                    <div class="flex items-center gap-1">
                      Nombre
                      <i :class="getSortIcon('display_name')" class="text-xs" />
                    </div>
                  </TableHead>
                  <TableHead
                    class="w-[120px] text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                    @click="toggleSort('node_type')"
                  >
                    <div class="flex items-center gap-1">
                      Tipo
                      <i :class="getSortIcon('node_type')" class="text-xs" />
                    </div>
                  </TableHead>
                  <TableHead
                    class="w-[120px] text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                    @click="toggleSort('category')"
                  >
                    <div class="flex items-center gap-1">
                      Categoria
                      <i :class="getSortIcon('category')" class="text-xs" />
                    </div>
                  </TableHead>
                  <TableHead class="w-[80px] text-gray-300">Builtin</TableHead>
                  <TableHead class="w-[80px] text-gray-300">Activo</TableHead>
                  <TableHead class="w-[120px] text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="data in paginatedDefinitions"
                  :key="data.id"
                  class="border-white/10 hover:bg-white/5"
                >
                  <!-- Icon -->
                  <TableCell class="py-2 px-3">
                    <div
                      class="w-8 h-8 rounded flex items-center justify-center"
                      :style="{ backgroundColor: data.color + '20', color: data.color }"
                    >
                      <i :class="['pi', data.icon || 'pi-circle']" />
                    </div>
                  </TableCell>

                  <!-- Name -->
                  <TableCell class="py-2 px-3">
                    <div>
                      <div class="font-medium text-gray-100">{{ data.display_name }}</div>
                      <div class="text-sm text-gray-400">{{ data.node_key }}</div>
                    </div>
                  </TableCell>

                  <!-- Type -->
                  <TableCell class="py-2 px-3">
                    <Badge variant="secondary" :class="getTypeBadgeClass(data.node_type)">
                      {{ data.node_type }}
                    </Badge>
                  </TableCell>

                  <!-- Category -->
                  <TableCell class="py-2 px-3 text-gray-300">
                    {{ data.category }}
                  </TableCell>

                  <!-- Builtin -->
                  <TableCell class="py-2 px-3">
                    <i
                      v-if="data.is_builtin"
                      class="pi pi-lock text-gray-500"
                      title="Builtin"
                    />
                    <i
                      v-else
                      class="pi pi-unlock text-green-400"
                      title="Custom"
                    />
                  </TableCell>

                  <!-- Active -->
                  <TableCell class="py-2 px-3">
                    <Badge
                      :variant="data.is_active ? 'default' : 'destructive'"
                    >
                      {{ data.is_active ? 'Si' : 'No' }}
                    </Badge>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="py-2 px-3">
                    <div class="flex gap-1">
                      <Button
                        v-if="!data.is_builtin"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        @click="openEditDialog(data)"
                        title="Editar"
                      >
                        <i class="pi pi-pencil text-sm" />
                      </Button>
                      <Button
                        v-if="!data.is_builtin"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        @click="confirmDelete(data)"
                        title="Eliminar"
                      >
                        <i class="pi pi-trash text-sm" />
                      </Button>
                      <span
                        v-if="data.is_builtin"
                        class="text-gray-500 text-xs italic px-2 flex items-center"
                      >
                        Protegido
                      </span>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="paginatedDefinitions.length === 0">
                  <TableCell :colspan="7" class="py-8">
                    <Alert class="bg-blue-500/10 border-blue-500/20">
                      <AlertDescription class="text-center text-gray-300">
                        <i class="pi pi-info-circle mr-2" />
                        No se encontraron definiciones de nodos
                      </AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination -->
          <div v-if="totalRecords > rowsPerPage" class="flex items-center justify-between mt-4">
            <p class="text-sm text-gray-400">
              Mostrando {{ (currentPage - 1) * rowsPerPage + 1 }}-{{ Math.min(currentPage * rowsPerPage, totalRecords) }} de {{ totalRecords }}
            </p>
            <div class="flex items-center gap-2">
              <Select
                :model-value="String(rowsPerPage)"
                @update:model-value="(val: string) => { rowsPerPage = Number(val); currentPage = 1 }"
              >
                <SelectTrigger class="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <Pagination
                :total-records="totalRecords"
                :rows="rowsPerPage"
                :current-page="currentPage"
                @page-change="handlePageChange"
              />
            </div>
          </div>
        </template>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Edit/Create Dialog -->
  <Dialog :open="showEditDialog" @update:open="(val: boolean) => showEditDialog = val">
    <DialogContent class="sm:max-w-[600px] glass-dialog">
      <DialogHeader>
        <DialogTitle class="text-lg font-semibold text-white">
          {{ isCreating ? 'Nueva Definicion de Nodo' : 'Editar Definicion de Nodo' }}
        </DialogTitle>
        <DialogDescription class="sr-only">Formulario para configurar una definicion de nodo</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Node Key (create only) -->
        <div v-if="isCreating" class="grid gap-2">
          <Label class="text-gray-300">Clave (node_key) *</Label>
          <Input
            v-model="editingDefinition.node_key"
            placeholder="mi_nodo_custom"
          />
          <p class="text-xs text-gray-500">Solo letras minusculas, numeros y guiones bajos</p>
        </div>

        <!-- Display Name -->
        <div class="grid gap-2">
          <Label class="text-gray-300">Nombre *</Label>
          <Input
            v-model="editingDefinition.display_name"
            placeholder="Mi Nodo Custom"
          />
        </div>

        <!-- Description -->
        <div class="grid gap-2">
          <Label class="text-gray-300">Descripcion</Label>
          <Textarea
            :model-value="editingDefinition.description ?? ''"
            @update:model-value="editingDefinition.description = $event"
            :rows="2"
            placeholder="Descripcion del nodo..."
          />
        </div>

        <!-- Node Type -->
        <div class="grid gap-2">
          <Label class="text-gray-300">Tipo</Label>
          <Select v-model="editingDefinition.node_type">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in nodeTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Category (Input with datalist for editable behavior) -->
        <div class="grid gap-2">
          <Label class="text-gray-300">Categoria</Label>
          <Input
            v-model="editingDefinition.category"
            list="category-suggestions"
            placeholder="Seleccionar o escribir"
          />
          <datalist id="category-suggestions">
            <option
              v-for="option in categoryOptions"
              :key="option.value"
              :value="option.value"
            />
          </datalist>
        </div>

        <!-- Icon & Color -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label class="text-gray-300">Icono</Label>
            <IconPicker v-model="editingDefinition.icon" />
          </div>
          <div class="grid gap-2">
            <Label class="text-gray-300">Color</Label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="editingDefinition.color || '#64748b'"
                @input="editingDefinition.color = ($event.target as HTMLInputElement).value"
                class="w-10 h-10 rounded cursor-pointer border border-white/20 bg-transparent"
              />
              <Input
                v-model="editingDefinition.color"
                class="w-28"
                placeholder="#64748b"
              />
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="grid gap-2">
          <Label class="text-gray-300">Vista Previa</Label>
          <div
            class="flex items-center gap-3 p-3 rounded-md border border-white/10 bg-white/5"
            :style="{ borderLeftColor: editingDefinition.color, borderLeftWidth: '4px' }"
          >
            <div
              class="w-10 h-10 rounded flex items-center justify-center"
              :style="{ backgroundColor: (editingDefinition.color || '#64748b') + '20', color: editingDefinition.color }"
            >
              <i :class="['pi', editingDefinition.icon || 'pi-circle']" class="text-xl" />
            </div>
            <div>
              <div class="font-medium text-gray-100">
                {{ editingDefinition.display_name || 'Nombre del nodo' }}
              </div>
              <div class="text-sm text-gray-400">
                {{ editingDefinition.node_type || 'tipo' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showEditDialog = false">
          Cancelar
        </Button>
        <Button
          :disabled="catalogStore.isSaving"
          @click="saveDefinition"
        >
          <i v-if="catalogStore.isSaving" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ isCreating ? 'Crear' : 'Guardar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <AlertDialog :open="showDeleteDialog" @update:open="(val: boolean) => showDeleteDialog = val">
    <AlertDialogContent class="glass-dialog">
      <AlertDialogHeader>
        <AlertDialogTitle class="text-white">Confirmar eliminacion</AlertDialogTitle>
        <AlertDialogDescription class="text-gray-300">
          Eliminar la definicion "{{ deletingDefinition?.display_name }}"?
          Esta accion no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showDeleteDialog = false">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="executeDelete"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
