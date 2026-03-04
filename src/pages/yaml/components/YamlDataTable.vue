<template>
  <Card>
    <CardHeader>
      <div class="flex justify-between items-center">
        <CardTitle class="flex items-center gap-2 text-base">
          <component :is="isTask ? ListTodo : Code" class="h-4 w-4" />
          {{ isTask ? 'Tasks de Chatbot' : 'Templates YAML' }}
        </CardTitle>
        <div class="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            @click="$emit('refresh')"
            :disabled="loading"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="$emit('fetch-analytics')"
            title="Actualizar estadísticas"
          >
            <BarChart3 class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <Spinner size="lg" />
      </div>

      <!-- Table -->
      <div v-else-if="currentItems.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/50">
              <th class="w-10 p-3">
                <Checkbox
                  :checked="allSelected"
                  @update:checked="toggleSelectAll"
                />
              </th>
              <th class="p-3 text-left font-medium text-muted-foreground">Key</th>
              <th class="p-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th v-if="!isTask" class="p-3 text-left font-medium text-muted-foreground">Dominio</th>
              <th v-if="isTask" class="p-3 text-left font-medium text-muted-foreground">Crítico</th>
              <th class="p-3 text-left font-medium text-muted-foreground">Origen</th>
              <th class="p-3 text-left font-medium text-muted-foreground">Estado</th>
              <th v-if="!isTask" class="p-3 text-left font-medium text-muted-foreground">Bloqueo</th>
              <th class="p-3 text-left font-medium text-muted-foreground">Actualizado</th>
              <th class="p-3 text-left font-medium text-muted-foreground min-w-[200px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="data in currentItems"
              :key="data.key"
              class="border-b hover:bg-muted/50 transition-colors"
            >
              <td class="p-3">
                <Checkbox
                  :checked="isItemSelected(data)"
                  @update:checked="(val: boolean) => toggleItemSelection(data, val)"
                />
              </td>
              <td class="p-3">
                <Badge variant="secondary" class="font-mono text-xs">{{ data.key }}</Badge>
              </td>
              <td class="p-3">
                <div>
                  <div class="font-medium">{{ data.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ data.description }}</div>
                </div>
              </td>
              <!-- Domain (Prompts only) -->
              <td v-if="!isTask" class="p-3">
                <Badge :variant="getDomainVariant((data as any).metadata?.domain)">
                  <component :is="getDomainIcon((data as any).metadata?.domain)" class="mr-1 h-3 w-3" />
                  {{ (data as any).metadata?.domain }}
                </Badge>
              </td>
              <!-- Critical (Tasks only) -->
              <td v-if="isTask" class="p-3">
                <Badge v-if="(data as any).metadata?.is_critical" variant="destructive">
                  <AlertTriangle class="mr-1 h-3 w-3" />
                  Crítico
                </Badge>
                <span v-else class="text-muted-foreground">-</span>
              </td>
              <td class="p-3">
                <Badge :variant="data.source === 'file' ? 'info' : 'success'">
                  <component :is="data.source === 'file' ? FolderOpen : Database" class="mr-1 h-3 w-3" />
                  {{ data.source }}
                </Badge>
              </td>
              <td class="p-3">
                <Badge :variant="!!data.active ? 'success' : 'destructive'">
                  <component :is="!!data.active ? Check : X" class="mr-1 h-3 w-3" />
                  {{ !!data.active ? 'Activo' : 'Inactivo' }}
                </Badge>
              </td>
              <!-- Lock (Prompts only) -->
              <td v-if="!isTask" class="p-3">
                <span v-if="isPromptLocked(data.key)" class="text-orange-500 flex items-center gap-1 text-sm">
                  <Lock class="h-3.5 w-3.5" />
                  {{ lockingUser(data.key) }}
                </span>
                <span v-else class="text-green-500 flex items-center gap-1 text-sm">
                  <Unlock class="h-3.5 w-3.5" />
                  Disponible
                </span>
              </td>
              <td class="p-3">
                <div class="text-sm">{{ formatDate(data.updated_at) }}</div>
              </td>
              <td class="p-3">
                <div class="flex space-x-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    class="h-7 w-7"
                    @click.exact="$emit('edit', data.key)"
                    @click.ctrl="$emit('edit-new-tab', data.key)"
                    @click.meta="$emit('edit-new-tab', data.key)"
                    :disabled="!isTask && !!isPromptLocked(data.key)"
                    title="Editar (Ctrl+click: nueva pestaña)"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    class="h-7 w-7"
                    @click="$emit('preview', data.key)"
                    title="Vista previa"
                  >
                    <Eye class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    class="h-7 w-7"
                    @click="$emit('test', data.key)"
                    title="Test"
                  >
                    <Play class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    v-if="!isTask"
                    variant="secondary"
                    size="icon"
                    class="h-7 w-7"
                    @click="$emit('versions', data.key)"
                    title="Historial"
                  >
                    <History class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    v-if="!isTask"
                    :variant="data.active ? 'destructive' : 'default'"
                    size="icon"
                    class="h-7 w-7"
                    @click="togglePrompt(data.key, !data.active)"
                    :title="data.active ? 'Desactivar' : 'Activar'"
                  >
                    <component :is="data.active ? EyeOff : Eye" class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 text-muted-foreground">
        No se encontraron resultados
      </div>

      <!-- Pagination -->
      <div v-if="!loading && pagination.total > pagination.pageSize" class="flex justify-between items-center mt-4 pt-4 border-t">
        <span class="text-sm text-muted-foreground">
          Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ pagination.total }}
        </span>
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1"
            @click="goToPage(pagination.page - 1)"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page * pagination.pageSize >= pagination.total"
            @click="goToPage(pagination.page + 1)"
          >
            Siguiente
          </Button>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedItems.length > 0" class="mt-4 p-3 border rounded-lg bg-muted/30">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <span class="text-sm font-medium">
            {{ selectedItems.length }} {{ isTask ? 'task(s)' : 'template(s)' }} seleccionado(s)
          </span>
          <div class="flex space-x-2">
            <Button
              v-if="!isTask"
              size="sm"
              @click="bulkToggle(true)"
            >
              <Check class="mr-2 h-3.5 w-3.5" />
              Activar seleccionados
            </Button>
            <Button
              v-if="!isTask"
              variant="destructive"
              size="sm"
              @click="bulkToggle(false)"
            >
              <X class="mr-2 h-3.5 w-3.5" />
              Desactivar seleccionados
            </Button>
            <Button
              variant="destructive"
              size="sm"
              @click="bulkDelete"
            >
              <Trash2 class="mr-2 h-3.5 w-3.5" />
              Eliminar seleccionados
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import type { YamlPrompt, YamlTask, YamlFormatter } from '@/types/yaml.types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  Code,
  ListTodo,
  RefreshCw,
  BarChart3,
  Pencil,
  Eye,
  EyeOff,
  Play,
  History,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
  FolderOpen,
  Database,
  AlertTriangle,
  Users,
  Heart,
  ShoppingCart,
  Star,
  Network,
  Wrench,
  Settings,
  Package,
  Folder
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'fetch-analytics'): void
  (e: 'edit', key: string): void
  (e: 'edit-new-tab', key: string): void
  (e: 'preview', key: string): void
  (e: 'test', key: string): void
  (e: 'versions', key: string): void
}>()

const yamlStore = useYamlStore()
const { confirmDelete } = useConfirm()
const toast = useToast()

const {
  loading,
  currentItems,
  pagination,
  templateType,
  isPromptLocked,
  lockingUser
} = storeToRefs(yamlStore)

const selectedItems = ref<(YamlPrompt | YamlTask | YamlFormatter)[]>([])

const isTask = computed(() => templateType.value === 'task')

// Selection
const allSelected = computed(() => {
  return currentItems.value.length > 0 &&
    currentItems.value.every((item: any) => selectedItems.value.some(s => s.key === item.key))
})

function isItemSelected(item: YamlPrompt | YamlTask | YamlFormatter): boolean {
  return selectedItems.value.some(s => s.key === item.key)
}

function toggleItemSelection(item: YamlPrompt | YamlTask | YamlFormatter, selected: boolean) {
  if (selected) {
    if (!isItemSelected(item)) {
      selectedItems.value.push(item)
    }
  } else {
    selectedItems.value = selectedItems.value.filter(s => s.key !== item.key)
  }
}

function toggleSelectAll(selected: boolean | 'indeterminate') {
  if (selected === true) {
    selectedItems.value = [...currentItems.value]
  } else {
    selectedItems.value = []
  }
}

// Pagination
const paginationStart = computed(() => (pagination.value.page - 1) * pagination.value.pageSize + 1)
const paginationEnd = computed(() => Math.min(pagination.value.page * pagination.value.pageSize, pagination.value.total))

function goToPage(page: number) {
  yamlStore.setPagination({
    page,
    pageSize: pagination.value.pageSize
  })
  emit('refresh')
}

// Handlers
async function togglePrompt(key: string, active: boolean) {
  try {
    await yamlStore.togglePromptActive(key, active)
    toast.add({
      severity: 'success',
      summary: 'Estado actualizado',
      detail: `Template ${active ? 'activado' : 'desactivado'} exitosamente`,
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cambiar estado',
      life: 5000
    })
  }
}

async function bulkToggle(active: boolean) {
  const keys = selectedItems.value.map((p) => p.key)

  try {
    await Promise.all(keys.map(key => yamlStore.togglePromptActive(key, active)))

    toast.add({
      severity: 'success',
      summary: 'Operación masiva',
      detail: `${keys.length} templates ${active ? 'activados' : 'desactivados'}`,
      life: 3000
    })

    selectedItems.value = []
    emit('refresh')
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error en operación masiva',
      life: 5000
    })
  }
}

async function bulkDelete() {
  const keys = selectedItems.value.map((p) => p.key)
  const itemType = isTask.value ? 'tasks' : 'templates'

  const confirmed = await confirmDelete(
    `¿Está seguro de eliminar ${keys.length} ${itemType}?`
  )
  if (!confirmed) return

  try {
    if (isTask.value) {
      await Promise.all(keys.map(key => yamlStore.deleteTask(key)))
    } else if (templateType.value === 'formatter') {
      await Promise.all(keys.map(key => yamlStore.deleteFormatter(key)))
    } else {
      await Promise.all(keys.map(key => yamlStore.deletePrompt(key)))
    }

    toast.add({
      severity: 'success',
      summary: 'Eliminación masiva',
      detail: `${keys.length} ${itemType} eliminados`,
      life: 3000
    })

    selectedItems.value = []
    emit('refresh')
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error en eliminación masiva',
      life: 5000
    })
  }
}

// Helpers
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const formatted = dayjs(dateString).format('DD/MM/YYYY HH:mm')
  return formatted === 'Invalid Date' ? '-' : formatted
}

function getDomainIcon(domain: string): Component {
  const iconMap: Record<string, Component> = {
    'agents': Users,
    'healthcare': Heart,
    'ecommerce': ShoppingCart,
    'excelencia': Star,
    'orchestrator': Network,
    'pharmacy': Heart,
    'product': Package,
    'tools': Wrench,
    'core': Settings
  }
  return iconMap[domain] || Folder
}

function getDomainVariant(domain: string) {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'info' | 'success' | 'warning'> = {
    'agents': 'info',
    'healthcare': 'destructive',
    'ecommerce': 'success',
    'excelencia': 'warning',
    'orchestrator': 'secondary',
    'pharmacy': 'destructive',
    'product': 'info',
    'tools': 'secondary',
    'core': 'default'
  }
  return variantMap[domain] || 'secondary'
}
</script>
