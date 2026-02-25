<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { catalogApi } from '@/api/agent.api'
import { useToast } from '@/composables/useToast'
import type {
  SoftwareModule,
  SoftwareModuleCreateRequest,
  ModuleCategory,
  ModuleStatus,
  PricingTier
} from '@/types/agent.types'
import {
  categoryOptions,
  statusOptions,
  pricingOptions,
  getStatusSeverity,
  getTierSeverity
} from '@/types/agent.types'

import ModuleEditDialog from '@/components/excelencia/ModuleEditDialog.vue'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const toast = useToast()

const isLoading = ref(false)
const modules = ref<SoftwareModule[]>([])
const activeTab = ref('list')

// Filters
const filterCategory = ref<string>('all')
const filterStatus = ref<string>('all')
const searchQuery = ref('')

// Dialog state
const showModuleDialog = ref(false)
const editingModule = ref<SoftwareModule | null>(null)
const confirmDelete = ref<Record<string, boolean>>({})

// Form state
const moduleForm = ref({
  code: '',
  name: '',
  description: '',
  category: 'general' as ModuleCategory,
  status: 'active' as ModuleStatus,
  features: '',
  pricing_tier: 'standard' as PricingTier
})

const filteredModules = computed(() => {
  let result = modules.value

  if (filterCategory.value && filterCategory.value !== 'all') {
    result = result.filter((m) => m.category === filterCategory.value)
  }
  if (filterStatus.value && filterStatus.value !== 'all') {
    result = result.filter((m) => m.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    )
  }

  return result
})

function mapSeverityToBadge(severity: string) {
  const map: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'default'> = {
    success: 'success',
    info: 'info',
    warn: 'warning',
    secondary: 'secondary'
  }
  return map[severity] || 'default'
}

async function fetchModules() {
  isLoading.value = true
  try {
    modules.value = await catalogApi.getModules()
  } finally {
    isLoading.value = false
  }
}

function openModuleDialog(module: SoftwareModule | null = null) {
  editingModule.value = module
  showModuleDialog.value = true
}

function closeModuleDialog() {
  showModuleDialog.value = false
  editingModule.value = null
}

function onModuleDialogSaved() {
  closeModuleDialog()
  fetchModules()
}

async function handleSaveModule() {
  isLoading.value = true
  try {
    const features = moduleForm.value.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    const createData: SoftwareModuleCreateRequest = {
      code: moduleForm.value.code,
      name: moduleForm.value.name,
      description: moduleForm.value.description,
      category: moduleForm.value.category,
      status: moduleForm.value.status,
      features,
      pricing_tier: moduleForm.value.pricing_tier
    }
    await catalogApi.createModule(createData)
    toast.success('Modulo creado')

    moduleForm.value = {
      code: '',
      name: '',
      description: '',
      category: 'general',
      status: 'active',
      features: '',
      pricing_tier: 'standard'
    }
    await fetchModules()
    activeTab.value = 'list'
  } catch (error) {
    toast.error('Error al guardar modulo')
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteModule(moduleId: string, hardDelete: boolean) {
  if (!hardDelete && !confirmDelete.value[moduleId]) {
    confirmDelete.value[moduleId] = true
    setTimeout(() => {
      delete confirmDelete.value[moduleId]
    }, 3000)
    return
  }

  isLoading.value = true
  try {
    await catalogApi.deleteModule(moduleId, hardDelete)
    toast.success(hardDelete ? 'Modulo eliminado' : 'Modulo deprecado')
    delete confirmDelete.value[moduleId]
    await fetchModules()
  } catch (error) {
    toast.error('Error al eliminar modulo')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchModules()
})
</script>

<template>
  <TooltipProvider>
    <div class="max-w-[1400px] mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Excelencia Management</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Catalogo de productos de software</p>
        </div>
        <Button @click="openModuleDialog(null)">
          <i class="pi pi-plus mr-2" />
          Nuevo Modulo
        </Button>
      </div>

      <!-- Main Content -->
      <Card class="glass-card overflow-hidden">
        <CardContent class="p-0">
          <Tabs v-model="activeTab" class="w-full">
            <TabsList class="w-full justify-start rounded-none border-b border-gray-200/50 dark:border-white/10 bg-transparent h-auto p-0">
              <TabsTrigger
                value="list"
                class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                <i class="pi pi-list mr-2" />
                Lista de Modulos
              </TabsTrigger>
              <TabsTrigger
                value="create"
                class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                <i class="pi pi-plus mr-2" />
                Crear Modulo
              </TabsTrigger>
            </TabsList>

            <!-- Module List Tab -->
            <TabsContent value="list" class="p-6 mt-0">
              <!-- Filters -->
              <div class="flex gap-4 mb-4">
                <Input
                  v-model="searchQuery"
                  placeholder="Buscar modulos..."
                  class="flex-1"
                />
                <Select v-model="filterCategory">
                  <SelectTrigger class="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorias</SelectItem>
                    <SelectItem
                      v-for="opt in categoryOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="filterStatus">
                  <SelectTrigger class="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  @click="fetchModules"
                  :disabled="isLoading"
                >
                  <i :class="['pi pi-refresh', { 'pi-spin': isLoading }]" />
                </Button>
              </div>

              <!-- Loading -->
              <div v-if="isLoading && modules.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl mb-2" />
                <p>Cargando modulos...</p>
              </div>

              <!-- Empty -->
              <div v-else-if="filteredModules.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="pi pi-box text-4xl mb-2" />
                <p>No hay modulos</p>
              </div>

              <!-- Table -->
              <Card v-else class="overflow-hidden border border-gray-200/50 dark:border-white/10 shadow-none">
                <CardContent class="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="w-[120px]">Codigo</TableHead>
                        <TableHead class="min-w-[200px]">Nombre</TableHead>
                        <TableHead class="w-[140px]">Categoria</TableHead>
                        <TableHead class="w-[120px]">Estado</TableHead>
                        <TableHead class="w-[120px]">Plan</TableHead>
                        <TableHead class="w-[200px]">Features</TableHead>
                        <TableHead class="w-[150px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="mod in filteredModules" :key="mod.id">
                        <TableCell>
                          <code class="text-sm bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                            {{ mod.code }}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div class="font-medium text-gray-800 dark:text-gray-100">{{ mod.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {{ mod.description }}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span class="capitalize text-gray-700 dark:text-gray-300">{{ mod.category }}</span>
                        </TableCell>
                        <TableCell>
                          <Badge :variant="mapSeverityToBadge(getStatusSeverity(mod.status))">
                            {{ mod.status }}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge :variant="mapSeverityToBadge(getTierSeverity(mod.pricing_tier))">
                            {{ mod.pricing_tier }}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div class="flex flex-wrap gap-1">
                            <Badge
                              v-for="(feat, idx) in (mod.features || []).slice(0, 3)"
                              :key="idx"
                              variant="outline"
                              class="text-xs"
                            >
                              {{ feat }}
                            </Badge>
                            <span v-if="(mod.features?.length || 0) > 3" class="text-xs text-gray-400 dark:text-gray-500 self-center">
                              +{{ mod.features!.length - 3 }}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <Button variant="ghost" size="icon" @click="openModuleDialog(mod)">
                                  <i class="pi pi-pencil text-sm" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>

                            <template v-if="!confirmDelete[mod.id]">
                              <Tooltip>
                                <TooltipTrigger as-child>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-amber-600 hover:text-amber-700 dark:text-amber-400"
                                    @click="handleDeleteModule(mod.id, false)"
                                  >
                                    <i class="pi pi-ban text-sm" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Deprecar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger as-child>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-destructive hover:text-destructive"
                                    @click="handleDeleteModule(mod.id, true)"
                                  >
                                    <i class="pi pi-trash text-sm" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </template>
                            <template v-else>
                              <Button
                                variant="ghost"
                                size="icon"
                                class="text-destructive hover:text-destructive"
                                @click="handleDeleteModule(mod.id, false)"
                              >
                                <i class="pi pi-check text-sm" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                @click="delete confirmDelete[mod.id]"
                              >
                                <i class="pi pi-times text-sm" />
                              </Button>
                            </template>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <!-- Create Module Tab -->
            <TabsContent value="create" class="p-6 mt-0">
              <div class="max-w-2xl">
                <Alert class="mb-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <i class="pi pi-info-circle text-blue-600 dark:text-blue-400" />
                  <AlertDescription class="text-blue-700 dark:text-blue-300">
                    Crear un nuevo producto de software en company_knowledge con
                    document_type: software_catalog
                  </AlertDescription>
                </Alert>

                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Codigo <span class="text-red-500">*</span>
                      </label>
                      <Input
                        v-model="moduleForm.code"
                        placeholder="Ej: MEDBOT-001"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre <span class="text-red-500">*</span>
                      </label>
                      <Input v-model="moduleForm.name" placeholder="Nombre del producto" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoria <span class="text-red-500">*</span>
                      </label>
                      <Select v-model="moduleForm.category">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
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
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                      <Select v-model="moduleForm.status">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="opt in statusOptions"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
                    <Textarea
                      v-model="moduleForm.description"
                      :rows="3"
                      placeholder="Descripcion del producto"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Features (uno por linea)
                      </label>
                      <Textarea
                        v-model="moduleForm.features"
                        :rows="5"
                        placeholder="chatbot&#10;whatsapp&#10;salud"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan de Precios</label>
                      <Select v-model="moduleForm.pricing_tier">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="opt in pricingOptions"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div class="pt-4">
                    <Button
                      @click="handleSaveModule"
                      :disabled="!moduleForm.code || !moduleForm.name || isLoading"
                    >
                      <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
                      <i v-else class="pi pi-plus mr-2" />
                      Crear Modulo
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <!-- Edit Module Dialog -->
      <ModuleEditDialog
        v-model:visible="showModuleDialog"
        :module="editingModule"
        @saved="onModuleDialogSaved"
        @cancelled="closeModuleDialog"
      />
    </div>
  </TooltipProvider>
</template>
