<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useDomains } from '@/composables/useDomains'
import { useAuthStore } from '@/stores/auth.store'
import { intentMappingsApi } from '@/api/intentMappings.api'
import { agentCatalogApi } from '@/api/agentCatalog.api'
import type {
  IntentMapping,
  IntentMappingCreate,
  IntentMappingUpdate
} from '@/types/intentMappings.types'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const toast = useToast()
const authStore = useAuthStore()
const { fetchDomains, getDomainOptions, getDomainLabel, getDomainColor } = useDomains()

const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const organizationId = computed(() => authStore.currentOrgId || SYSTEM_ORG_ID)
const domainOptions = computed(() => getDomainOptions(true))

// State
const mappings = ref<IntentMapping[]>([])
const availableAgents = ref<string[]>([])
const loading = ref(false)
const seeding = ref(false)
const reloading = ref(false)

// Dialog state
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const editingMapping = ref<IntentMapping | null>(null)
const deleteDialogOpen = ref(false)
const deletingMapping = ref<IntentMapping | null>(null)

// Create form
const newMapping = ref<IntentMappingCreate>({
  intent_key: '',
  intent_name: '',
  intent_description: '',
  agent_key: '',
  domain_key: null,
  confidence_threshold: 0.75,
  requires_handoff: false,
  priority: 50,
  is_enabled: true,
  examples: []
})
const newExamplesText = ref('')

// Filter state
const domainFilter = ref('all')
const enabledFilter = ref(false)
const searchText = ref('')

// Stats
const stats = computed(() => {
  const byDomain: Record<string, number> = {}
  mappings.value.forEach((m) => {
    const key = m.domain_key || 'global'
    byDomain[key] = (byDomain[key] || 0) + 1
  })
  return {
    total: mappings.value.length,
    enabled: mappings.value.filter((m) => m.is_enabled).length,
    system: mappings.value.filter((m) => m.system).length,
    byDomain
  }
})

// Filtered mappings
const filteredMappings = computed(() => {
  let result = mappings.value

  if (domainFilter.value !== 'all') {
    const filterVal = domainFilter.value === 'global' ? null : domainFilter.value
    result = result.filter((m) => m.domain_key === filterVal)
  }

  if (enabledFilter.value) {
    result = result.filter((m) => m.is_enabled)
  }

  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    result = result.filter(
      (m) =>
        m.intent_key.toLowerCase().includes(q) ||
        m.intent_name.toLowerCase().includes(q) ||
        m.agent_key.toLowerCase().includes(q)
    )
  }

  return result.sort((a, b) => b.priority - a.priority)
})

// Domain badge variant helper
function getDomainBadgeVariant(
  domainKey: string | null
): 'info' | 'success' | 'warning' | 'default' | 'secondary' {
  const color = getDomainColor(domainKey)
  const map: Record<string, 'info' | 'success' | 'warning' | 'default' | 'secondary'> = {
    info: 'info',
    success: 'success',
    warn: 'warning',
    help: 'default',
    secondary: 'secondary'
  }
  return map[color] || 'secondary'
}

// Fetch data
async function fetchMappings() {
  loading.value = true
  try {
    const response = await intentMappingsApi.list(organizationId.value)
    mappings.value = response.mappings
  } catch {
    toast.error('No se pudieron cargar los mapeos de intents')
  } finally {
    loading.value = false
  }
}

async function fetchAgentKeys() {
  try {
    availableAgents.value = await agentCatalogApi.getEnabledKeys()
  } catch {
    // Non-critical, user can still type manually
  }
}

// Seed intents
async function seedIntents() {
  seeding.value = true
  try {
    const result = await intentMappingsApi.seedIntents(organizationId.value)
    toast.success(`${result.mappings_created} intents creados`, 'Seed completado')
    await fetchMappings()
  } catch {
    toast.error('No se pudieron crear los intents builtin')
  } finally {
    seeding.value = false
  }
}

// Reload config cache
async function reloadCache() {
  reloading.value = true
  try {
    await intentMappingsApi.reloadConfigCache()
    toast.success('Cache de configuracion recargado')
  } catch {
    toast.error('No se pudo recargar el cache')
  } finally {
    reloading.value = false
  }
}

// Create
function openCreateDialog() {
  newMapping.value = {
    intent_key: '',
    intent_name: '',
    intent_description: '',
    agent_key: '',
    domain_key: null,
    confidence_threshold: 0.75,
    requires_handoff: false,
    priority: 50,
    is_enabled: true,
    examples: []
  }
  newExamplesText.value = ''
  createDialogVisible.value = true
}

async function createMapping() {
  if (!newMapping.value.intent_key || !newMapping.value.intent_name || !newMapping.value.agent_key) {
    toast.warn('Intent Key, Nombre y Agent Key son obligatorios', 'Campos requeridos')
    return
  }

  try {
    const data = {
      ...newMapping.value,
      examples: newExamplesText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    const created = await intentMappingsApi.create(data, organizationId.value)
    mappings.value.unshift(created)
    toast.success(created.intent_name, 'Mapeo creado')
    createDialogVisible.value = false
  } catch (error: unknown) {
    const errorDetail =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'No se pudo crear el mapeo'
    toast.error(errorDetail || 'No se pudo crear el mapeo')
  }
}

// Edit
const editExamplesText = ref('')

function openEditDialog(mapping: IntentMapping) {
  editingMapping.value = { ...mapping }
  editExamplesText.value = mapping.examples.join('\n')
  editDialogVisible.value = true
}

async function saveMapping() {
  if (!editingMapping.value) return

  try {
    const data: IntentMappingUpdate = {
      intent_name: editingMapping.value.intent_name,
      intent_description: editingMapping.value.intent_description ?? undefined,
      agent_key: editingMapping.value.agent_key,
      domain_key: editingMapping.value.domain_key,
      confidence_threshold: editingMapping.value.confidence_threshold,
      requires_handoff: editingMapping.value.requires_handoff,
      priority: editingMapping.value.priority,
      is_enabled: editingMapping.value.is_enabled,
      examples: editExamplesText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    const updated = await intentMappingsApi.update(
      editingMapping.value.id,
      data,
      organizationId.value
    )
    const index = mappings.value.findIndex((m) => m.id === editingMapping.value?.id)
    if (index !== -1) {
      mappings.value[index] = updated
    }
    toast.success(updated.intent_name, 'Mapeo actualizado')
    editDialogVisible.value = false
    editingMapping.value = null
  } catch {
    toast.error('No se pudo guardar el mapeo')
  }
}

// Delete
function confirmDelete(mapping: IntentMapping) {
  if (mapping.system) {
    toast.warn(`"${mapping.intent_key}" es un intent de sistema y no se puede eliminar`)
    return
  }
  deletingMapping.value = mapping
  deleteDialogOpen.value = true
}

async function deleteMapping() {
  if (!deletingMapping.value) return
  const mapping = deletingMapping.value

  try {
    await intentMappingsApi.delete(mapping.id, organizationId.value)
    mappings.value = mappings.value.filter((m) => m.id !== mapping.id)
    toast.success(mapping.intent_name, 'Mapeo eliminado')
    deleteDialogOpen.value = false
  } catch (error: unknown) {
    const errorDetail =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'No se pudo eliminar el mapeo'
    toast.error(errorDetail || 'No se pudo eliminar el mapeo')
  }
}

// Select helpers
const editDomainValue = computed({
  get: () => editingMapping.value?.domain_key ?? '__null__',
  set: (val: string) => {
    if (editingMapping.value) {
      editingMapping.value.domain_key = val === '__null__' ? null : val
    }
  }
})

const newDomainValue = computed({
  get: () => newMapping.value.domain_key ?? '__null__',
  set: (val: string) => {
    newMapping.value.domain_key = val === '__null__' ? null : val
  }
})

const editAgentValue = computed({
  get: () => editingMapping.value?.agent_key ?? '',
  set: (val: string) => {
    if (editingMapping.value) {
      editingMapping.value.agent_key = val
    }
  }
})

const newAgentValue = computed({
  get: () => newMapping.value.agent_key ?? '',
  set: (val: string) => {
    newMapping.value.agent_key = val
  }
})

// Init
onMounted(() => {
  fetchDomains()
  fetchMappings()
  fetchAgentKeys()
})
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Mapeo de Intents</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Administra los mapeos intent-agente (core.intent_agent_mappings)
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          :disabled="reloading"
          @click="reloadCache"
        >
          <i v-if="reloading" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-refresh mr-2" />
          Reload Cache
        </Button>
        <Button
          variant="outline"
          :disabled="seeding"
          @click="seedIntents"
        >
          <i v-if="seeding" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-database mr-2" />
          Seed Intents
        </Button>
        <Button @click="openCreateDialog">
          <i class="pi pi-plus mr-2" />
          Nuevo Mapeo
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total intents</div>
        </CardContent>
      </Card>
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">{{ stats.enabled }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Habilitados</div>
        </CardContent>
      </Card>
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ stats.system }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Sistema (protegidos)</div>
        </CardContent>
      </Card>
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="flex justify-center gap-1 flex-wrap">
            <Badge
              v-for="(count, domain) in stats.byDomain"
              :key="domain"
              :variant="getDomainBadgeVariant(domain === 'global' ? null : (domain as string))"
              class="text-xs"
            >
              {{ domain }}: {{ count }}
            </Badge>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Por dominio</div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="glass-panel mb-6">
      <CardContent class="pt-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <Input
              v-model="searchText"
              placeholder="Buscar por key, nombre o agente..."
              class="w-full"
            />
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio</label>
            <Select v-model="domainFilter">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los dominios</SelectItem>
                <SelectItem
                  v-for="opt in domainOptions"
                  :key="opt.value ?? 'global'"
                  :value="opt.value ?? 'global'"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-center gap-2 pt-6">
            <Switch
              :checked="enabledFilter"
              @update:checked="enabledFilter = $event"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">Solo habilitados</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <div v-if="loading" class="flex justify-center py-12 text-muted-foreground">
          <i class="pi pi-spinner pi-spin text-2xl" />
        </div>

        <div
          v-else-if="filteredMappings.length === 0"
          class="text-center py-12 text-muted-foreground"
        >
          <i class="pi pi-link text-4xl mb-4" />
          <p>No hay mapeos de intents</p>
          <p class="text-sm mt-2">Usa "Seed Intents" para importar mapeos predefinidos</p>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="min-w-[140px]">Intent Key</TableHead>
              <TableHead class="min-w-[160px]">Nombre</TableHead>
              <TableHead class="w-[120px]">Dominio</TableHead>
              <TableHead class="min-w-[140px]">Agent Key</TableHead>
              <TableHead class="w-[90px]">Confianza</TableHead>
              <TableHead class="w-[80px]">Prioridad</TableHead>
              <TableHead class="w-[80px]">Estado</TableHead>
              <TableHead class="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="mapping in filteredMappings" :key="mapping.id">
              <!-- Intent Key -->
              <TableCell>
                <div class="flex items-center gap-2">
                  <i v-if="mapping.system" class="pi pi-lock text-blue-500 text-xs" />
                  <span class="font-mono text-sm text-foreground">{{ mapping.intent_key }}</span>
                </div>
              </TableCell>

              <!-- Nombre -->
              <TableCell>
                <div>
                  <div class="font-medium text-foreground">{{ mapping.intent_name }}</div>
                  <div
                    class="text-xs text-muted-foreground truncate max-w-xs"
                    :title="mapping.intent_description || undefined"
                  >
                    {{ mapping.intent_description || '-' }}
                  </div>
                </div>
              </TableCell>

              <!-- Dominio -->
              <TableCell>
                <Badge :variant="getDomainBadgeVariant(mapping.domain_key)">
                  {{ getDomainLabel(mapping.domain_key) }}
                </Badge>
              </TableCell>

              <!-- Agent Key -->
              <TableCell>
                <span class="font-mono text-sm text-foreground">{{ mapping.agent_key }}</span>
              </TableCell>

              <!-- Confianza -->
              <TableCell>
                <span class="font-mono text-sm text-foreground">
                  {{ mapping.confidence_threshold.toFixed(2) }}
                </span>
              </TableCell>

              <!-- Prioridad -->
              <TableCell>
                <span class="font-mono text-sm text-foreground">{{ mapping.priority }}</span>
              </TableCell>

              <!-- Estado -->
              <TableCell>
                <Badge :variant="mapping.is_enabled ? 'success' : 'secondary'">
                  {{ mapping.is_enabled ? 'On' : 'Off' }}
                </Badge>
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
                          class="h-8 w-8"
                          @click="openEditDialog(mapping)"
                        >
                          <i class="pi pi-pencil text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Editar</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8"
                          :class="mapping.system
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-destructive hover:text-destructive'"
                          :disabled="mapping.system"
                          @click="confirmDelete(mapping)"
                        >
                          <i class="pi pi-trash text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ mapping.system ? 'Intent de sistema (protegido)' : 'Eliminar' }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editDialogVisible">
      <DialogContent class="glass-dialog sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Editar Mapeo de Intent</DialogTitle>
          <DialogDescription class="sr-only">Editar configuracion del mapeo intent-agente</DialogDescription>
        </DialogHeader>

        <div v-if="editingMapping" class="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intent Key</label>
            <Input :model-value="editingMapping.intent_key" disabled class="w-full bg-muted" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <Input v-model="editingMapping.intent_name" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
            <Textarea
              :model-value="editingMapping.intent_description ?? ''"
              @update:model-value="editingMapping.intent_description = $event"
              :rows="2"
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent Key</label>
              <Select v-model="editAgentValue">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="ak in availableAgents" :key="ak" :value="ak">
                    {{ ak }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio</label>
              <Select v-model="editDomainValue">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar dominio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in domainOptions"
                    :key="opt.value ?? '__null__'"
                    :value="opt.value ?? '__null__'"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confianza</label>
              <Input
                v-model.number="editingMapping.confidence_threshold"
                type="number"
                :min="0"
                :max="1"
                :step="0.05"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
              <Input
                v-model.number="editingMapping.priority"
                type="number"
                :min="0"
                :max="100"
                class="w-full"
              />
            </div>
            <div class="flex flex-col justify-end gap-2">
              <div class="flex items-center gap-2">
                <Switch
                  :checked="editingMapping.is_enabled"
                  @update:checked="editingMapping.is_enabled = $event"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
              </div>
              <div class="flex items-center gap-2">
                <Switch
                  :checked="editingMapping.requires_handoff"
                  @update:checked="editingMapping.requires_handoff = $event"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Handoff</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ejemplos (uno por linea)
            </label>
            <Textarea
              v-model="editExamplesText"
              :rows="4"
              class="w-full font-mono text-sm"
              placeholder="quiero sacar un turno&#10;turno medico&#10;agendar cita"
            />
          </div>

          <div v-if="editingMapping.system" class="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
            <i class="pi pi-lock" />
            <span>Intent de sistema - no se puede eliminar</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="editDialogVisible = false">Cancelar</Button>
          <Button @click="saveMapping">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog v-model:open="createDialogVisible">
      <DialogContent class="glass-dialog sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nuevo Mapeo de Intent</DialogTitle>
          <DialogDescription class="sr-only">Crear un nuevo mapeo intent-agente</DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intent Key *</label>
              <Input v-model="newMapping.intent_key" placeholder="mi_intent" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
              <Input v-model="newMapping.intent_name" placeholder="Mi Intent" class="w-full" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
            <Textarea
              :model-value="newMapping.intent_description ?? ''"
              @update:model-value="newMapping.intent_description = $event"
              :rows="2"
              class="w-full"
              placeholder="Describe que tipo de mensajes captura este intent"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent Key *</label>
              <Select v-model="newAgentValue">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="ak in availableAgents" :key="ak" :value="ak">
                    {{ ak }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio</label>
              <Select v-model="newDomainValue">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Global" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in domainOptions"
                    :key="opt.value ?? '__null__'"
                    :value="opt.value ?? '__null__'"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confianza</label>
              <Input
                v-model.number="newMapping.confidence_threshold"
                type="number"
                :min="0"
                :max="1"
                :step="0.05"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
              <Input
                v-model.number="newMapping.priority"
                type="number"
                :min="0"
                :max="100"
                class="w-full"
              />
            </div>
            <div class="flex flex-col justify-end gap-2">
              <div class="flex items-center gap-2">
                <Switch
                  :checked="newMapping.is_enabled ?? true"
                  @update:checked="newMapping.is_enabled = $event"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
              </div>
              <div class="flex items-center gap-2">
                <Switch
                  :checked="newMapping.requires_handoff ?? false"
                  @update:checked="newMapping.requires_handoff = $event"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Handoff</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ejemplos (uno por linea)
            </label>
            <Textarea
              v-model="newExamplesText"
              :rows="4"
              class="w-full font-mono text-sm"
              placeholder="frase ejemplo 1&#10;frase ejemplo 2&#10;frase ejemplo 3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createDialogVisible = false">Cancelar</Button>
          <Button @click="createMapping">Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar mapeo de intent</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar el mapeo <strong>"{{ deletingMapping?.intent_key }}"</strong>
            ({{ deletingMapping?.intent_name }}). Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="deleteMapping"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
