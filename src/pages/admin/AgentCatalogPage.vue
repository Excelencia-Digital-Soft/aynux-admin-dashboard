<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { agentCatalogApi } from '@/api/agentCatalog.api'
import { useDomains } from '@/composables/useDomains'
import type {
  AgentCatalogItem,
  AgentCatalogFilters,
  AgentCatalogCreate,
  AgentCatalogUpdate
} from '@/types/agentCatalog.types'
import {
  AGENT_TYPE_OPTIONS,
  getGraphInfo,
  getAgentTypeSeverity
} from '@/types/agentCatalog.types'

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
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import SubgraphFlowDialog from '@/components/agentCatalog/SubgraphFlowDialog.vue'

const toast = useToast()
const { fetchDomains, getDomainOptions, getDomainLabel, getDomainColor, getDomainIcon } = useDomains()

// Domain options from API
const domainOptions = computed(() => getDomainOptions(true))

// State
const agents = ref<AgentCatalogItem[]>([])
const loading = ref(false)
const seeding = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const editingAgent = ref<AgentCatalogItem | null>(null)
const newAgent = ref<AgentCatalogCreate>({
  agent_key: '',
  name: '',
  description: '',
  agent_type: 'custom',
  domain_key: undefined,
  enabled: true,
  priority: 50,
  keywords: []
})

// Delete dialog state
const deleteDialogOpen = ref(false)
const deletingAgent = ref<AgentCatalogItem | null>(null)

// Subgraph dialog state
const subgraphDialogVisible = ref(false)
const selectedGraphName = ref<string | null>(null)

// Filters
const filters = ref<AgentCatalogFilters>({
  domain_key: undefined,
  agent_type: undefined,
  enabled_only: false
})

// Local string-based filter state for shadcn Select
const domainFilter = ref('all')
const typeFilter = ref('all')

// Stats
const stats = computed(() => {
  const byDomain: Record<string, number> = {}
  agents.value.forEach((a) => {
    const key = a.domain_key || 'global'
    byDomain[key] = (byDomain[key] || 0) + 1
  })
  return {
    total: agents.value.length,
    enabled: agents.value.filter((a) => a.enabled).length,
    disabled: agents.value.filter((a) => !a.enabled).length,
    byDomain
  }
})

// Map domain color (PrimeVue severity) to Badge variant
function getDomainBadgeVariant(domainKey: string | null): 'info' | 'success' | 'warning' | 'default' | 'secondary' {
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

// Map agent type severity to Badge variant
function getAgentTypeBadgeVariant(agentType: string): 'info' | 'success' | 'warning' | 'secondary' {
  const severity = getAgentTypeSeverity(agentType)
  const map: Record<string, 'info' | 'success' | 'warning' | 'secondary'> = {
    info: 'info',
    success: 'success',
    warn: 'warning',
    secondary: 'secondary'
  }
  return map[severity] || 'secondary'
}

// Fetch agents
async function fetchAgents() {
  loading.value = true
  try {
    // Handle 'global' filter value
    const apiFilters = { ...filters.value }
    if (apiFilters.domain_key === 'global') {
      apiFilters.domain_key = ''
    }
    const response = await agentCatalogApi.list(apiFilters)
    agents.value = response.agents
  } catch {
    toast.error('No se pudieron cargar los agentes')
  } finally {
    loading.value = false
  }
}

// Seed builtin agents
async function seedBuiltin() {
  seeding.value = true
  try {
    const result = await agentCatalogApi.seedBuiltin()
    toast.success(
      `${result.created} creados, ${result.updated} actualizados, ${result.skipped} omitidos`,
      'Seed completado'
    )
    await fetchAgents()
  } catch {
    toast.error('No se pudieron crear los agentes builtin')
  } finally {
    seeding.value = false
  }
}

// Toggle agent enabled
async function toggleAgent(agent: AgentCatalogItem) {
  try {
    const updated = await agentCatalogApi.toggle(agent.id)
    const index = agents.value.findIndex((a) => a.id === agent.id)
    if (index !== -1) {
      agents.value[index] = updated
    }
    toast.info(agent.name, updated.enabled ? 'Agente habilitado' : 'Agente deshabilitado')
  } catch {
    toast.error('No se pudo actualizar el agente')
  }
}

// Open edit dialog
function openEditDialog(agent: AgentCatalogItem) {
  editingAgent.value = { ...agent }
  editDialogVisible.value = true
}

// Save edited agent
async function saveAgent() {
  if (!editingAgent.value) return

  try {
    const updateData: AgentCatalogUpdate = {
      name: editingAgent.value.name,
      description: editingAgent.value.description ?? undefined,
      domain_key: editingAgent.value.domain_key ?? undefined,
      priority: editingAgent.value.priority,
      enabled: editingAgent.value.enabled
    }

    const updated = await agentCatalogApi.update(editingAgent.value.id, updateData)

    const index = agents.value.findIndex((a) => a.id === editingAgent.value?.id)
    if (index !== -1) {
      agents.value[index] = updated
    }

    toast.success(updated.name, 'Agente actualizado')

    editDialogVisible.value = false
    editingAgent.value = null
  } catch {
    toast.error('No se pudo guardar el agente')
  }
}

// Open create dialog
function openCreateDialog() {
  newAgent.value = {
    agent_key: '',
    name: '',
    description: '',
    agent_type: 'custom',
    domain_key: undefined,
    enabled: true,
    priority: 50,
    keywords: []
  }
  createDialogVisible.value = true
}

// Create new agent
async function createAgent() {
  if (!newAgent.value.agent_key || !newAgent.value.name) {
    toast.warn('Agent Key y Nombre son obligatorios', 'Campos requeridos')
    return
  }

  try {
    const created = await agentCatalogApi.create(newAgent.value)
    agents.value.unshift(created)
    toast.success(created.name, 'Agente creado')
    createDialogVisible.value = false
  } catch (error: unknown) {
    const errorDetail =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'No se pudo crear el agente'
    toast.error(errorDetail || 'No se pudo crear el agente')
  }
}

// Delete agent
function confirmDelete(agent: AgentCatalogItem) {
  deletingAgent.value = agent
  deleteDialogOpen.value = true
}

async function deleteAgent() {
  if (!deletingAgent.value) return
  const agent = deletingAgent.value

  try {
    await agentCatalogApi.delete(agent.id)
    agents.value = agents.value.filter((a) => a.id !== agent.id)
    toast.success(agent.name, 'Agente eliminado')
    deleteDialogOpen.value = false
  } catch {
    toast.error('No se pudo eliminar el agente')
  }
}

// Filter handlers
function handleDomainFilter(val: string) {
  domainFilter.value = val
  filters.value.domain_key = val === 'all' ? undefined : val
  fetchAgents()
}

function handleTypeFilter(val: string) {
  typeFilter.value = val
  filters.value.agent_type = val === 'all' ? undefined : val
  fetchAgents()
}

function handleEnabledOnlyToggle(val: boolean) {
  filters.value.enabled_only = val
  fetchAgents()
}

// Get graph display info
function getGraphDisplay(agentKey: string) {
  const info = getGraphInfo(agentKey)
  return info.hasSubgraph ? `Main + ${info.graph}` : 'Main'
}

// Open subgraph visualization dialog
function openSubgraphDialog(agentKey: string) {
  const info = getGraphInfo(agentKey)
  if (info.hasSubgraph) {
    selectedGraphName.value = info.graph
    subgraphDialogVisible.value = true
  }
}

// Edit dialog domain select helpers
const editDomainValue = computed({
  get: () => editingAgent.value?.domain_key ?? '__null__',
  set: (val: string) => {
    if (editingAgent.value) {
      editingAgent.value.domain_key = val === '__null__' ? null : val
    }
  }
})

const newAgentDomainValue = computed({
  get: () => newAgent.value.domain_key ?? '__null__',
  set: (val: string) => {
    newAgent.value.domain_key = val === '__null__' ? undefined : val
  }
})

const newAgentTypeValue = computed({
  get: () => newAgent.value.agent_type ?? 'custom',
  set: (val: string) => {
    newAgent.value.agent_type = val as 'builtin' | 'specialized' | 'custom'
  }
})

// Initialize
onMounted(() => {
  fetchDomains()
  fetchAgents()
})
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Catalogo de Agentes</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Administra los agentes del grafo de LangGraph</p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          :disabled="seeding"
          @click="seedBuiltin"
        >
          <i v-if="seeding" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-database mr-2" />
          Seed Builtin
        </Button>
        <Button @click="openCreateDialog">
          <i class="pi pi-plus mr-2" />
          Nuevo Agente
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total agentes</div>
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
          <div class="text-3xl font-bold text-gray-400 dark:text-gray-500">{{ stats.disabled }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Deshabilitados</div>
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio</label>
            <Select :model-value="domainFilter" @update:model-value="handleDomainFilter">
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
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <Select :model-value="typeFilter" @update:model-value="handleTypeFilter">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem
                  v-for="opt in AGENT_TYPE_OPTIONS"
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
              :checked="filters.enabled_only ?? false"
              @update:checked="handleEnabledOnlyToggle"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">Solo habilitados</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Agents Table -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-12 text-muted-foreground">
          <i class="pi pi-spinner pi-spin text-2xl" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="agents.length === 0"
          class="text-center py-12 text-muted-foreground"
        >
          <i class="pi pi-android text-4xl mb-4" />
          <p>No hay agentes registrados</p>
          <p class="text-sm mt-2">Usa "Seed Builtin" para importar agentes predefinidos</p>
        </div>

        <!-- Table -->
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="min-w-[180px]">Agent Key</TableHead>
              <TableHead class="min-w-[200px]">Nombre</TableHead>
              <TableHead class="w-[120px]">Dominio</TableHead>
              <TableHead class="w-[150px]">Grafo</TableHead>
              <TableHead class="w-[120px]">Tipo</TableHead>
              <TableHead class="w-[100px]">Prioridad</TableHead>
              <TableHead class="w-[100px]">Habilitado</TableHead>
              <TableHead class="w-[130px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="agent in agents" :key="agent.id">
              <!-- Agent Key -->
              <TableCell>
                <div class="flex items-center gap-2">
                  <i :class="['pi', getDomainIcon(agent.domain_key) || 'pi-globe']" class="text-muted-foreground" />
                  <span class="font-mono text-sm text-foreground">{{ agent.agent_key }}</span>
                </div>
              </TableCell>

              <!-- Nombre -->
              <TableCell>
                <div>
                  <div class="font-medium text-foreground">{{ agent.name }}</div>
                  <div class="text-xs text-muted-foreground truncate max-w-xs" :title="agent.description || undefined">
                    {{ agent.description || '-' }}
                  </div>
                </div>
              </TableCell>

              <!-- Dominio -->
              <TableCell>
                <Badge :variant="getDomainBadgeVariant(agent.domain_key)">
                  {{ getDomainLabel(agent.domain_key) }}
                </Badge>
              </TableCell>

              <!-- Grafo -->
              <TableCell>
                <div class="flex items-center gap-1">
                  <Badge variant="secondary" class="text-xs">Main</Badge>
                  <Badge
                    v-if="getGraphInfo(agent.agent_key).hasSubgraph"
                    variant="info"
                    class="text-xs"
                  >
                    {{ getGraphInfo(agent.agent_key).graph }}
                  </Badge>
                </div>
              </TableCell>

              <!-- Tipo -->
              <TableCell>
                <Badge :variant="getAgentTypeBadgeVariant(agent.agent_type)">
                  {{ agent.agent_type }}
                </Badge>
              </TableCell>

              <!-- Prioridad -->
              <TableCell>
                <span class="font-mono text-sm text-foreground">{{ agent.priority }}</span>
              </TableCell>

              <!-- Habilitado -->
              <TableCell>
                <Switch
                  :checked="agent.enabled"
                  @update:checked="toggleAgent(agent)"
                />
              </TableCell>

              <!-- Acciones -->
              <TableCell>
                <div class="flex gap-1">
                  <TooltipProvider v-if="getGraphInfo(agent.agent_key).hasSubgraph">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-blue-600 hover:text-blue-700"
                          @click="openSubgraphDialog(agent.agent_key)"
                        >
                          <i class="pi pi-sitemap text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Ver Flow</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8"
                          @click="openEditDialog(agent)"
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
                          class="h-8 w-8 text-destructive hover:text-destructive"
                          @click="confirmDelete(agent)"
                        >
                          <i class="pi pi-trash text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Eliminar</p></TooltipContent>
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
      <DialogContent class="glass-dialog sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Agente</DialogTitle>
          <DialogDescription class="sr-only">Editar configuracion del agente</DialogDescription>
        </DialogHeader>

        <div v-if="editingAgent" class="flex flex-col gap-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <Input v-model="editingAgent.name" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
            <Textarea
              :model-value="editingAgent.description ?? ''"
              @update:model-value="editingAgent.description = $event"
              :rows="3"
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
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
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
              <Input
                v-model.number="editingAgent.priority"
                type="number"
                :min="0"
                :max="100"
                class="w-full"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Switch
              :checked="editingAgent.enabled"
              @update:checked="editingAgent.enabled = $event"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
          </div>

          <Alert variant="info">
            <AlertDescription>
              <p class="text-sm">
                <strong>Agent Key:</strong> {{ editingAgent.agent_key }}<br />
                <strong>Tipo:</strong> {{ editingAgent.agent_type }}<br />
                <strong>Grafo:</strong> {{ getGraphDisplay(editingAgent.agent_key) }}<br />
                <strong>Origen:</strong> {{ editingAgent.sync_source }}
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="editDialogVisible = false">Cancelar</Button>
          <Button @click="saveAgent">
            <i class="pi pi-check mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog v-model:open="createDialogVisible">
      <DialogContent class="glass-dialog sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Agente</DialogTitle>
          <DialogDescription class="sr-only">Crear un nuevo agente en el catalogo</DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent Key <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="newAgent.agent_key"
              class="w-full"
              placeholder="my_custom_agent"
            />
            <p class="text-xs text-muted-foreground mt-1">Identificador unico, sin espacios (ej: my_agent)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span class="text-red-500">*</span>
            </label>
            <Input v-model="newAgent.name" class="w-full" placeholder="Mi Agente Custom" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
            <Textarea
              v-model="newAgent.description"
              :rows="2"
              class="w-full"
              placeholder="Describe que hace este agente..."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <Select v-model="newAgentTypeValue">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in AGENT_TYPE_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio</label>
              <Select v-model="newAgentDomainValue">
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

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
              <Input
                v-model.number="newAgent.priority"
                type="number"
                :min="0"
                :max="100"
                class="w-full"
              />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <Switch
                :checked="newAgent.enabled ?? true"
                @update:checked="newAgent.enabled = $event"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
            </div>
          </div>

          <Alert variant="warning">
            <AlertDescription>
              <p class="text-sm">
                Los agentes custom requieren implementacion en el backend para funcionar. Este
                formulario solo crea el registro en la base de datos.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createDialogVisible = false">Cancelar</Button>
          <Button @click="createAgent">
            <i class="pi pi-plus mr-2" />
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent class="glass-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
          <AlertDialogDescription>
            Estas seguro de eliminar el agente "{{ deletingAgent?.name }}"? Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="deleteAgent"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Subgraph Flow Dialog -->
    <SubgraphFlowDialog
      v-model:visible="subgraphDialogVisible"
      :graphName="selectedGraphName"
    />
  </div>
</template>
