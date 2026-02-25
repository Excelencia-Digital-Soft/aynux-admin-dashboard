<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { domainApi } from '@/api/domain.api'
import { useDomains } from '@/composables/useDomains'
import type { Domain, DomainCreateRequest, DomainUpdateRequest } from '@/types/domain.types'

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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const toast = useToast()
const { reset: resetDomainsCache } = useDomains()

// State
const domains = ref<Domain[]>([])
const loading = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const editingDomain = ref<Domain | null>(null)
const newDomain = ref<DomainCreateRequest>({
  domain_key: '',
  display_name: '',
  description: '',
  icon: 'pi-globe',
  color: 'info',
  enabled: true,
  sort_order: 0
})

// Delete confirmation state
const deleteDialogOpen = ref(false)
const deletingDomain = ref<Domain | null>(null)

// Color options for select
const colorOptions = [
  { value: 'info', label: 'Info (Azul)' },
  { value: 'success', label: 'Success (Verde)' },
  { value: 'warn', label: 'Warn (Amarillo)' },
  { value: 'help', label: 'Help (Morado)' },
  { value: 'secondary', label: 'Secondary (Gris)' }
]

// Color mapping from PrimeVue severity to shadcn Badge variant
function getColorBadgeVariant(color: string) {
  switch (color) {
    case 'info':
      return 'info' as const
    case 'success':
      return 'success' as const
    case 'warn':
      return 'warning' as const
    case 'help':
      return 'default' as const
    case 'secondary':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

// Stats
const stats = computed(() => ({
  total: domains.value.length,
  enabled: domains.value.filter((d) => d.enabled).length,
  disabled: domains.value.filter((d) => !d.enabled).length
}))

// Sorted domains
const sortedDomains = computed(() =>
  [...domains.value].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
)

// Fetch domains
async function fetchDomains() {
  loading.value = true
  try {
    const response = await domainApi.list(false)
    domains.value = response.domains
  } catch {
    toast.error('No se pudieron cargar los dominios')
  } finally {
    loading.value = false
  }
}

// Toggle domain enabled
async function toggleDomain(domain: Domain) {
  try {
    const updated = await domainApi.toggle(domain.id)
    const index = domains.value.findIndex((d) => d.id === domain.id)
    if (index !== -1) {
      domains.value[index] = updated
    }
    resetDomainsCache()
    toast.info(
      domain.display_name,
      updated.enabled ? 'Dominio habilitado' : 'Dominio deshabilitado'
    )
  } catch {
    toast.error('No se pudo cambiar el estado')
  }
}

// Edit domain
function openEditDialog(domain: Domain) {
  editingDomain.value = { ...domain }
  editDialogVisible.value = true
}

async function saveDomain() {
  if (!editingDomain.value) return

  try {
    const updateData: DomainUpdateRequest = {
      display_name: editingDomain.value.display_name,
      description: editingDomain.value.description || undefined,
      icon: editingDomain.value.icon || undefined,
      color: editingDomain.value.color || undefined,
      enabled: editingDomain.value.enabled,
      sort_order: editingDomain.value.sort_order
    }
    const updated = await domainApi.update(editingDomain.value.id, updateData)
    const index = domains.value.findIndex((d) => d.id === updated.id)
    if (index !== -1) {
      domains.value[index] = updated
    }
    resetDomainsCache()
    editDialogVisible.value = false
    toast.success(updated.display_name, 'Dominio actualizado')
  } catch {
    toast.error('No se pudo actualizar el dominio')
  }
}

// Create domain
function openCreateDialog() {
  newDomain.value = {
    domain_key: '',
    display_name: '',
    description: '',
    icon: 'pi-globe',
    color: 'info',
    enabled: true,
    sort_order: domains.value.length + 1
  }
  createDialogVisible.value = true
}

async function createDomain() {
  if (!newDomain.value.domain_key || !newDomain.value.display_name) {
    toast.warn('Domain key y nombre son obligatorios', 'Campos requeridos')
    return
  }

  try {
    const created = await domainApi.create(newDomain.value)
    domains.value.push(created)
    resetDomainsCache()
    createDialogVisible.value = false
    toast.success(created.display_name, 'Dominio creado')
  } catch (error: unknown) {
    const message =
      error instanceof Error && 'response' in error
        ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          'No se pudo crear el dominio')
        : 'No se pudo crear el dominio'
    toast.error(message)
  }
}

// Delete domain
function confirmDelete(domain: Domain) {
  deletingDomain.value = domain
  deleteDialogOpen.value = true
}

async function deleteDomain() {
  if (!deletingDomain.value) return
  const domain = deletingDomain.value

  try {
    await domainApi.delete(domain.id)
    domains.value = domains.value.filter((d) => d.id !== domain.id)
    resetDomainsCache()
    deleteDialogOpen.value = false
    toast.success(domain.display_name, 'Dominio eliminado')
  } catch {
    toast.error('No se pudo eliminar el dominio')
  }
}

// Initialize
onMounted(fetchDomains)
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Dominios</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Administra los dominios de negocio del sistema
        </p>
      </div>
      <Button @click="openCreateDialog">
        <i class="pi pi-plus mr-2" />
        Nuevo Dominio
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total Dominios</div>
        </CardContent>
      </Card>
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ stats.enabled }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Habilitados</div>
        </CardContent>
      </Card>
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-gray-400 dark:text-gray-500">
            {{ stats.disabled }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Deshabilitados</div>
        </CardContent>
      </Card>
    </div>

    <!-- Table -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <i class="pi pi-spin pi-spinner text-2xl mb-2" />
          <p>Cargando dominios...</p>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="sortedDomains.length === 0"
          class="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <i class="pi pi-globe text-4xl mb-2" />
          <p>No hay dominios registrados</p>
        </div>

        <!-- Table -->
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[80px]">Orden</TableHead>
              <TableHead class="min-w-[200px]">Dominio</TableHead>
              <TableHead class="min-w-[200px]">Descripcion</TableHead>
              <TableHead class="w-[120px]">Color</TableHead>
              <TableHead class="w-[100px]">Estado</TableHead>
              <TableHead class="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="domain in sortedDomains" :key="domain.id">
              <!-- Sort Order -->
              <TableCell>
                <span class="font-mono text-sm">{{ domain.sort_order }}</span>
              </TableCell>

              <!-- Icon & Name -->
              <TableCell>
                <div class="flex items-center gap-3">
                  <i
                    :class="`pi ${domain.icon || 'pi-globe'} text-xl text-gray-600 dark:text-gray-400`"
                  />
                  <div>
                    <div class="font-medium text-gray-800 dark:text-gray-100">
                      {{ domain.display_name }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {{ domain.domain_key }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <!-- Description -->
              <TableCell>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ domain.description || '-' }}
                </span>
              </TableCell>

              <!-- Color -->
              <TableCell>
                <Badge :variant="getColorBadgeVariant(domain.color || 'info')">
                  {{ domain.color || 'info' }}
                </Badge>
              </TableCell>

              <!-- Status -->
              <TableCell>
                <Switch
                  :checked="domain.enabled"
                  @update:checked="toggleDomain(domain)"
                />
              </TableCell>

              <!-- Actions -->
              <TableCell>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon" @click="openEditDialog(domain)">
                    <i class="pi pi-pencil text-sm" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive hover:text-destructive"
                    @click="confirmDelete(domain)"
                  >
                    <i class="pi pi-trash text-sm" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editDialogVisible">
      <DialogContent class="sm:max-w-[500px] glass-dialog">
        <DialogHeader>
          <DialogTitle>Editar Dominio</DialogTitle>
          <DialogDescription class="sr-only">
            Editar configuracion del dominio
          </DialogDescription>
        </DialogHeader>

        <div v-if="editingDomain" class="flex flex-col gap-4 py-4">
          <Alert>
            <AlertDescription>
              <strong>Domain Key:</strong> {{ editingDomain.domain_key }}
              <br />
              <span class="text-xs text-muted-foreground">El key no se puede modificar</span>
            </AlertDescription>
          </Alert>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <Input v-model="editingDomain.display_name" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripcion
            </label>
            <Textarea :model-value="editingDomain.description ?? ''" @update:model-value="editingDomain.description = $event" :rows="2" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icono (PrimeIcons)
              </label>
              <Input :model-value="editingDomain.icon ?? ''" @update:model-value="editingDomain.icon = String($event)" placeholder="pi-globe" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <Select :model-value="editingDomain.color ?? 'info'" @update:model-value="editingDomain.color = $event">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Orden
            </label>
            <Input v-model.number="editingDomain.sort_order" type="number" min="0" />
          </div>

          <div class="flex items-center gap-2">
            <Switch v-model:checked="editingDomain.enabled" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="editDialogVisible = false">Cancelar</Button>
          <Button @click="saveDomain">
            <i class="pi pi-check mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog v-model:open="createDialogVisible">
      <DialogContent class="sm:max-w-[500px] glass-dialog">
        <DialogHeader>
          <DialogTitle>Nuevo Dominio</DialogTitle>
          <DialogDescription class="sr-only">Crear un nuevo dominio</DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain Key <span class="text-red-500">*</span>
            </label>
            <Input v-model="newDomain.domain_key" placeholder="mi_dominio" />
            <p class="text-xs text-muted-foreground mt-1">
              Identificador unico, sin espacios (ej: pharmacy)
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span class="text-red-500">*</span>
            </label>
            <Input v-model="newDomain.display_name" placeholder="Mi Dominio" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripcion
            </label>
            <Textarea
              v-model="newDomain.description"
              :rows="2"
              placeholder="Descripcion opcional..."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icono (PrimeIcons)
              </label>
              <Input v-model="newDomain.icon" placeholder="pi-globe" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <Select v-model="newDomain.color">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Orden
            </label>
            <Input v-model.number="newDomain.sort_order" type="number" min="0" />
          </div>

          <div class="flex items-center gap-2">
            <Switch v-model:checked="newDomain.enabled" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createDialogVisible = false">Cancelar</Button>
          <Button @click="createDomain">
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
            ¿Estas seguro de eliminar el dominio "{{ deletingDomain?.display_name }}"? Esta accion
            no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="deleteDomain"
          >
            Si, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
