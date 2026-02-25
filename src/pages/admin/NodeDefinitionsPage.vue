<script setup lang="ts">
/**
 * NodeDefinitionsPage - Manage workflow node definitions catalog
 *
 * Allows creating, editing, and deleting custom node definitions
 * for use in the workflow editor.
 *
 * Migrated from PrimeVue to shadcn-vue with glassmorphism styling.
 */
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useWorkflowCatalogStore } from '@/stores/workflow/catalog.store'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type {
  NodeDefinition,
  NodeDefinitionCreate,
  NodeDefinitionUpdate
} from '@/types/workflow.types'
import IconPicker from '@/components/workflows/IconPicker.vue'
import ConfirmDialogComponent from '@/components/shared/ConfirmDialog.vue'

// shadcn-vue components
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import { ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check, X } from 'lucide-vue-next'

const toast = useToast()
const confirmDialog = useConfirmDialog()
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
const categoryFilter = ref<string>('__all__')
const typeFilter = ref<string>('__all__')
const activeOnlyFilter = ref(false)

// Sorting & Pagination
const sortField = ref<string>('category')
const sortOrder = ref<1 | -1>(1)
const currentPage = ref(1)
const rowsPerPage = ref(15)

// Options
const nodeTypeOptions = [
  { value: 'conversation', label: 'Conversation' },
  { value: 'routing', label: 'Routing' },
  { value: 'integration', label: 'Integration' },
  { value: 'utility', label: 'Utility' }
]

const categoryOptions = computed(() => {
  const categories = new Set(catalogStore.nodeDefinitions.map((n) => n.category))
  return Array.from(categories).map((c) => ({ value: c, label: c }))
})

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
  if (categoryFilter.value && categoryFilter.value !== '__all__') {
    defs = defs.filter((d) => d.category === categoryFilter.value)
  }
  if (typeFilter.value && typeFilter.value !== '__all__') {
    defs = defs.filter((d) => d.node_type === typeFilter.value)
  }
  if (activeOnlyFilter.value) {
    defs = defs.filter((d) => d.is_active)
  }
  return defs
})

// Sorted data
const sortedData = computed(() => {
  const data = [...filteredDefinitions.value]
  if (!sortField.value) return data

  return data.sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortField.value]
    const bVal = (b as Record<string, unknown>)[sortField.value]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    let result = 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      result = aVal.localeCompare(bVal)
    } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      result = (aVal === bVal) ? 0 : aVal ? -1 : 1
    } else {
      result = String(aVal).localeCompare(String(bVal))
    }

    return result * sortOrder.value
  })
})

// Paginated data
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return sortedData.value.slice(start, start + rowsPerPage.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedData.value.length / rowsPerPage.value)))

const paginationStart = computed(() => {
  if (sortedData.value.length === 0) return 0
  return (currentPage.value - 1) * rowsPerPage.value + 1
})

const paginationEnd = computed(() =>
  Math.min(currentPage.value * rowsPerPage.value, sortedData.value.length)
)

// Sort handler
function handleSort(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 1 ? -1 : 1
  } else {
    sortField.value = field
    sortOrder.value = 1
  }
  currentPage.value = 1
}

// Get badge variant for node type
function getNodeTypeBadgeVariant(
  type: string
): 'info' | 'warning' | 'success' | 'secondary' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
    conversation: 'info',
    routing: 'warning',
    integration: 'success',
    utility: 'secondary'
  }
  return map[type] || 'secondary'
}

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
async function confirmDelete(nodeDef: NodeDefinition) {
  if (nodeDef.is_builtin) {
    toast.add({
      severity: 'warn',
      summary: 'No permitido',
      detail: 'No se pueden eliminar nodos builtin',
      life: 3000
    })
    return
  }

  const confirmed = await confirmDialog.confirm({
    title: 'Confirmar eliminacion',
    message: `Estas seguro de eliminar "${nodeDef.display_name}"? Esta accion no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    cancelLabel: 'Cancelar',
    variant: 'destructive'
  })

  if (confirmed) {
    await deleteNodeDefinition(nodeDef)
  }
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
    <ConfirmDialogComponent />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Definiciones de Nodos</h1>
        <p class="text-muted-foreground mt-1">
          Administra el catalogo de tipos de nodos para el editor de workflows
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="w-4 h-4 mr-2" />
        Nueva Definicion
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-foreground">{{ stats.total }}</div>
            <div class="text-muted-foreground">Total</div>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats.active }}</div>
            <div class="text-muted-foreground">Activos</div>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats.builtin }}</div>
            <div class="text-muted-foreground">Builtin</div>
          </div>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ stats.custom }}</div>
            <div class="text-muted-foreground">Custom</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="glass-card mb-6">
      <CardContent class="pt-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-foreground mb-1">Categoria</label>
            <Select
              :model-value="categoryFilter"
              @update:model-value="(v: string) => { categoryFilter = v; currentPage = 1 }"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las categorias</SelectItem>
                <SelectItem
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-foreground mb-1">Tipo</label>
            <Select
              :model-value="typeFilter"
              @update:model-value="(v: string) => { typeFilter = v; currentPage = 1 }"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los tipos</SelectItem>
                <SelectItem
                  v-for="opt in nodeTypeOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-center gap-2 pt-6">
            <Switch
              :checked="activeOnlyFilter"
              @update:checked="(v: boolean) => { activeOnlyFilter = v; currentPage = 1 }"
            />
            <span class="text-sm text-muted-foreground">Solo activos</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Definitions Table -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-16">
          <Spinner size="lg" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="sortedData.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <i class="pi pi-box text-4xl text-muted-foreground mb-4" />
          <p class="text-muted-foreground">No hay definiciones de nodos</p>
        </div>

        <!-- Table -->
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  class="min-w-[180px] cursor-pointer select-none hover:text-foreground transition-colors"
                  @click="handleSort('node_key')"
                >
                  <div class="flex items-center gap-1">
                    Node Key
                    <span v-if="sortField === 'node_key'" class="text-primary">
                      <ChevronUp v-if="sortOrder === 1" class="w-3.5 h-3.5" />
                      <ChevronDown v-else class="w-3.5 h-3.5" />
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  class="min-w-[200px] cursor-pointer select-none hover:text-foreground transition-colors"
                  @click="handleSort('display_name')"
                >
                  <div class="flex items-center gap-1">
                    Nombre
                    <span v-if="sortField === 'display_name'" class="text-primary">
                      <ChevronUp v-if="sortOrder === 1" class="w-3.5 h-3.5" />
                      <ChevronDown v-else class="w-3.5 h-3.5" />
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  class="w-[120px] cursor-pointer select-none hover:text-foreground transition-colors"
                  @click="handleSort('category')"
                >
                  <div class="flex items-center gap-1">
                    Categoria
                    <span v-if="sortField === 'category'" class="text-primary">
                      <ChevronUp v-if="sortOrder === 1" class="w-3.5 h-3.5" />
                      <ChevronDown v-else class="w-3.5 h-3.5" />
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  class="w-[120px] cursor-pointer select-none hover:text-foreground transition-colors"
                  @click="handleSort('node_type')"
                >
                  <div class="flex items-center gap-1">
                    Tipo
                    <span v-if="sortField === 'node_type'" class="text-primary">
                      <ChevronUp v-if="sortOrder === 1" class="w-3.5 h-3.5" />
                      <ChevronDown v-else class="w-3.5 h-3.5" />
                    </span>
                  </div>
                </TableHead>
                <TableHead class="w-[100px]">Origen</TableHead>
                <TableHead
                  class="w-[80px] cursor-pointer select-none hover:text-foreground transition-colors"
                  @click="handleSort('is_active')"
                >
                  <div class="flex items-center gap-1">
                    Activo
                    <span v-if="sortField === 'is_active'" class="text-primary">
                      <ChevronUp v-if="sortOrder === 1" class="w-3.5 h-3.5" />
                      <ChevronDown v-else class="w-3.5 h-3.5" />
                    </span>
                  </div>
                </TableHead>
                <TableHead class="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="data in paginatedData"
                :key="data.id"
                class="group hover:bg-muted/50 transition-colors"
              >
                <!-- Node Key -->
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      :style="{ backgroundColor: data.color + '20', color: data.color }"
                    >
                      <i :class="`pi ${data.icon}`" />
                    </div>
                    <span class="font-mono text-sm">{{ data.node_key }}</span>
                  </div>
                </TableCell>

                <!-- Nombre -->
                <TableCell>
                  <div>
                    <div class="font-medium text-foreground">{{ data.display_name }}</div>
                    <div
                      class="text-xs text-muted-foreground truncate max-w-xs"
                      :title="data.description ?? undefined"
                    >
                      {{ data.description || '-' }}
                    </div>
                  </div>
                </TableCell>

                <!-- Categoria -->
                <TableCell>
                  <Badge variant="secondary">{{ data.category }}</Badge>
                </TableCell>

                <!-- Tipo -->
                <TableCell>
                  <Badge :variant="getNodeTypeBadgeVariant(data.node_type)">
                    {{ data.node_type }}
                  </Badge>
                </TableCell>

                <!-- Origen -->
                <TableCell>
                  <Badge :variant="data.is_builtin ? 'info' : 'success'">
                    {{ data.is_builtin ? 'Builtin' : 'Custom' }}
                  </Badge>
                </TableCell>

                <!-- Activo -->
                <TableCell>
                  <Check v-if="data.is_active" class="w-4 h-4 text-green-500" />
                  <X v-else class="w-4 h-4 text-muted-foreground" />
                </TableCell>

                <!-- Acciones -->
                <TableCell>
                  <div class="flex gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                            @click="openEditDialog(data)"
                          >
                            <Pencil class="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                            :disabled="data.is_builtin"
                            @click="confirmDelete(data)"
                          >
                            <Trash2 class="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {{ data.is_builtin ? 'No se puede eliminar' : 'Eliminar' }}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>

      <!-- Pagination -->
      <CardFooter
        v-if="!loading && sortedData.length > 0"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border"
      >
        <div class="text-sm text-muted-foreground">
          Mostrando {{ paginationStart }} a {{ paginationEnd }} de {{ sortedData.length }} definiciones
        </div>
        <div class="flex items-center gap-2">
          <Select
            :model-value="String(rowsPerPage)"
            @update:model-value="(v: string) => { rowsPerPage = Number(v); currentPage = 1 }"
          >
            <SelectTrigger class="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <div class="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :disabled="currentPage <= 1"
              @click="currentPage = currentPage - 1"
            >
              <i class="pi pi-angle-left text-xs" />
            </Button>
            <span class="flex items-center px-2 text-sm text-muted-foreground">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :disabled="currentPage >= totalPages"
              @click="currentPage = currentPage + 1"
            >
              <i class="pi pi-angle-right text-xs" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>

    <!-- Create Dialog -->
    <Dialog v-model:open="createDialogVisible">
      <DialogContent class="glass-dialog sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Definicion de Nodo</DialogTitle>
          <DialogDescription class="sr-only">
            Formulario para crear una nueva definicion de nodo de workflow
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Node Key <span class="text-destructive">*</span>
              </label>
              <Input
                v-model="newNodeDef.node_key"
                placeholder="my_custom_node"
              />
              <span class="text-xs text-muted-foreground">Identificador unico, snake_case</span>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Nombre <span class="text-destructive">*</span>
              </label>
              <Input
                v-model="newNodeDef.display_name"
                placeholder="Mi Nodo Custom"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Descripcion</label>
            <Textarea
              v-model="newNodeDef.description"
              rows="2"
              placeholder="Describe que hace este nodo..."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Tipo</label>
              <Select
                :model-value="newNodeDef.node_type"
                @update:model-value="(v: string) => { newNodeDef.node_type = v as NodeDefinitionCreate['node_type'] }"
              >
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in nodeTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Categoria</label>
              <Input v-model="newNodeDef.category" placeholder="custom" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Icono</label>
              <IconPicker v-model="newNodeDef.icon" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Color</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="newNodeDef.color"
                  class="w-10 h-10 rounded-md border border-border cursor-pointer bg-transparent p-0.5"
                  @input="(e) => { newNodeDef.color = (e.target as HTMLInputElement).value }"
                />
                <Input
                  v-model="newNodeDef.color"
                  class="flex-1"
                  placeholder="#64748b"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Config Schema (JSON)</label>
            <Textarea
              v-model="configSchemaJson"
              rows="4"
              class="font-mono text-sm"
              placeholder="{}"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Default Config (JSON)</label>
            <Textarea
              v-model="defaultConfigJson"
              rows="3"
              class="font-mono text-sm"
              placeholder="{}"
            />
          </div>

          <Alert variant="info">
            <AlertDescription class="text-sm">
              Los nodos custom usan un handler generico. Para funcionalidad avanzada,
              se requiere implementacion en el backend.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createDialogVisible = false">
            Cancelar
          </Button>
          <Button @click="createNodeDefinition">
            <Plus class="w-4 h-4 mr-2" />
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editDialogVisible">
      <DialogContent class="glass-dialog sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Definicion de Nodo</DialogTitle>
          <DialogDescription class="sr-only">
            Formulario para editar una definicion de nodo de workflow existente
          </DialogDescription>
        </DialogHeader>

        <div v-if="editingNodeDef" class="flex flex-col gap-4 py-4">
          <Alert v-if="editingNodeDef.is_builtin" variant="warning">
            <AlertDescription class="text-sm">
              Este es un nodo builtin. Solo se pueden editar campos de presentacion
              (nombre, descripcion, icono, color).
            </AlertDescription>
          </Alert>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Node Key</label>
              <Input :model-value="editingNodeDef.node_key" disabled />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Nombre</label>
              <Input v-model="editingNodeDef.display_name" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Descripcion</label>
            <Textarea :model-value="editingNodeDef.description ?? ''" @update:model-value="(v: string) => { if (editingNodeDef) editingNodeDef.description = v }" rows="2" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Icono</label>
              <IconPicker v-model="editingNodeDef.icon" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Color</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="editingNodeDef.color"
                  class="w-10 h-10 rounded-md border border-border cursor-pointer bg-transparent p-0.5"
                  @input="(e) => { editingNodeDef!.color = (e.target as HTMLInputElement).value }"
                />
                <Input v-model="editingNodeDef.color" class="flex-1" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Categoria</label>
              <Input v-model="editingNodeDef.category" />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <Switch
                :checked="editingNodeDef.is_active"
                @update:checked="(v: boolean) => { editingNodeDef!.is_active = v }"
              />
              <span class="text-sm text-foreground">Activo</span>
            </div>
          </div>

          <template v-if="!editingNodeDef.is_builtin">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Config Schema (JSON)</label>
              <Textarea
                v-model="editConfigSchemaJson"
                rows="4"
                class="font-mono text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Default Config (JSON)</label>
              <Textarea
                v-model="editDefaultConfigJson"
                rows="3"
                class="font-mono text-sm"
              />
            </div>
          </template>

          <div v-if="editingNodeDef.is_builtin" class="text-sm text-muted-foreground">
            <strong>Python Class:</strong> {{ editingNodeDef.python_class }}<br />
            <strong>Python Module:</strong> {{ editingNodeDef.python_module }}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="editDialogVisible = false">
            Cancelar
          </Button>
          <Button @click="saveNodeDefinition">
            <Check class="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.node-definitions-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
