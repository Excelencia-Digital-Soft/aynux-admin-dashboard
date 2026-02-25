<script setup lang="ts">
import { ref } from 'vue'
import { useAIModelsAdmin } from '@/composables/useAIModelsAdmin'

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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const {
  models,
  loading,
  seeding,
  editDialogVisible,
  editingModel,
  filters,
  stats,
  fetchModels,
  seedExternal,
  toggleModel,
  openEditDialog,
  saveModel
} = useAIModelsAdmin()

// Local string-based filter state for shadcn Select
const providerFilter = ref('all')
const typeFilter = ref('all')

function getProviderBadgeVariant(provider: string): 'success' | 'info' | 'warning' | 'default' | 'secondary' | 'destructive' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'default' | 'secondary' | 'destructive'> = {
    vllm: 'success',
    openai: 'info',
    anthropic: 'warning',
    deepseek: 'secondary',
    groq: 'destructive'
  }
  return map[provider] || 'secondary'
}

function handleProviderFilter(val: string) {
  providerFilter.value = val
  filters.value.provider = val === 'all' ? undefined : val
  fetchModels()
}

function handleTypeFilter(val: string) {
  typeFilter.value = val
  filters.value.model_type = val === 'all' ? undefined : val
  fetchModels()
}

function handleEnabledOnlyToggle(val: boolean) {
  filters.value.enabled_only = val
  fetchModels()
}

function handleCloseEditDialog() {
  editDialogVisible.value = false
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestion de Modelos AI</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Administra los modelos de IA disponibles para los usuarios
        </p>
      </div>
      <Button
        variant="outline"
        :disabled="seeding"
        @click="seedExternal"
      >
        <i v-if="seeding" class="pi pi-spinner pi-spin mr-2" />
        <i v-else class="pi pi-cloud-download mr-2" />
        Seed Externos
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card class="glass-panel text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total modelos</div>
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
    </div>

    <!-- Filters -->
    <Card class="glass-panel mb-6">
      <CardContent class="pt-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
            <Select :model-value="providerFilter" @update:model-value="handleProviderFilter">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                <SelectItem value="vllm">vLLM (Local)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
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
                <SelectItem value="llm">LLM</SelectItem>
                <SelectItem value="embedding">Embedding</SelectItem>
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

    <!-- Models Table -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-12 text-muted-foreground">
          <i class="pi pi-spinner pi-spin text-2xl" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="models.length === 0"
          class="text-center py-12 text-muted-foreground"
        >
          <i class="pi pi-box text-4xl mb-4" />
          <p>No hay modelos registrados</p>
          <p class="text-sm mt-2">Usa "Seed Externos" para agregar modelos de proveedores externos</p>
        </div>

        <!-- Table -->
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="min-w-[200px]">Modelo</TableHead>
              <TableHead class="w-[120px]">Proveedor</TableHead>
              <TableHead class="w-[120px]">Familia</TableHead>
              <TableHead class="w-[100px]">Tamano</TableHead>
              <TableHead class="w-[100px]">Tipo</TableHead>
              <TableHead class="w-[140px]">Capacidades</TableHead>
              <TableHead class="w-[80px]">Orden</TableHead>
              <TableHead class="w-[100px]">Habilitado</TableHead>
              <TableHead class="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="model in models" :key="model.id">
              <!-- Modelo -->
              <TableCell>
                <div>
                  <div class="font-medium text-foreground">{{ model.display_name }}</div>
                  <div class="text-xs text-muted-foreground">{{ model.model_id }}</div>
                </div>
              </TableCell>

              <!-- Proveedor -->
              <TableCell>
                <Badge :variant="getProviderBadgeVariant(model.provider)">
                  {{ model.provider }}
                </Badge>
              </TableCell>

              <!-- Familia -->
              <TableCell>
                <span class="text-sm text-foreground">{{ model.family || '-' }}</span>
              </TableCell>

              <!-- Tamano -->
              <TableCell>
                <span class="text-sm text-foreground">{{ model.parameter_size || '-' }}</span>
              </TableCell>

              <!-- Tipo -->
              <TableCell>
                <Badge :variant="model.model_type === 'llm' ? 'info' : 'secondary'">
                  {{ model.model_type }}
                </Badge>
              </TableCell>

              <!-- Capacidades -->
              <TableCell>
                <div class="flex gap-1">
                  <Badge v-if="model.supports_functions" variant="success" class="text-xs">
                    Func
                  </Badge>
                  <Badge v-if="model.supports_vision" variant="warning" class="text-xs">
                    Vision
                  </Badge>
                </div>
              </TableCell>

              <!-- Orden -->
              <TableCell>
                <span class="text-sm font-mono text-foreground">{{ model.sort_order }}</span>
              </TableCell>

              <!-- Habilitado -->
              <TableCell>
                <Switch
                  :checked="model.is_enabled"
                  @update:checked="toggleModel(model)"
                />
              </TableCell>

              <!-- Acciones -->
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        @click="openEditDialog(model)"
                      >
                        <i class="pi pi-pencil text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
          <DialogTitle>Editar Modelo</DialogTitle>
          <DialogDescription class="sr-only">Editar configuracion del modelo AI</DialogDescription>
        </DialogHeader>

        <div v-if="editingModel" class="flex flex-col gap-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre para mostrar
            </label>
            <Input v-model="editingModel.display_name" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripcion
            </label>
            <Textarea
              :model-value="editingModel.description ?? ''"
              @update:model-value="editingModel.description = $event"
              :rows="3"
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Orden
              </label>
              <Input
                v-model.number="editingModel.sort_order"
                type="number"
                :min="0"
                :max="1000"
                class="w-full"
              />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <Switch
                :checked="editingModel.is_default"
                @update:checked="editingModel.is_default = $event"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Es modelo por defecto</span>
            </div>
          </div>

          <Alert variant="info">
            <AlertDescription>
              <p class="text-sm">
                <strong>ID:</strong> {{ editingModel.model_id }}<br />
                <strong>Proveedor:</strong> {{ editingModel.provider }}<br />
                <strong>Origen:</strong> {{ editingModel.sync_source }}
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="handleCloseEditDialog">Cancelar</Button>
          <Button @click="saveModel">
            <i class="pi pi-check mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
