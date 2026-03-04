<template>
  <!-- Table Header: Search + Filters -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
    <div class="relative w-full sm:w-80">
      <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
      <Input
        :model-value="searchQuery"
        placeholder="Buscar configuraciones..."
        class="pl-9 w-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10"
        @update:model-value="$emit('update:searchQuery', $event)"
      />
    </div>
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <Switch
          :checked="showOnlyEnabled"
          @update:checked="$emit('update:showOnlyEnabled', $event)"
        />
        <Label class="text-sm text-muted-foreground cursor-pointer">Solo activas</Label>
      </div>
      <div class="flex items-center gap-2">
        <Switch
          :checked="showOnlyCritical"
          @update:checked="$emit('update:showOnlyCritical', $event)"
        />
        <Label class="text-sm text-muted-foreground cursor-pointer">Solo criticas</Label>
      </div>
      <Select
        v-if="nodeFilterOptions?.length"
        :model-value="nodeFilter ?? '__all__'"
        @update:model-value="$emit('update:nodeFilter', $event === '__all__' ? null : $event)"
      >
        <SelectTrigger class="w-[180px] h-8 bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10">
          <SelectValue placeholder="Filtrar por nodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos los nodos</SelectItem>
          <SelectItem v-for="opt in nodeFilterOptions" :key="opt.id" :value="opt.id">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <!-- Loading Spinner -->
  <div v-if="loading" class="glass-card flex items-center justify-center py-16">
    <i class="pi pi-spin pi-spinner text-2xl text-primary mr-3" />
    <span class="text-muted-foreground">Cargando configuraciones...</span>
  </div>

  <!-- Empty State -->
  <div
    v-else-if="filteredCount === 0"
    class="glass-card text-center py-12"
  >
    <i class="pi pi-inbox text-4xl text-muted-foreground mb-4 block" />
    <p class="text-muted-foreground mb-4">No hay configuraciones para este dominio</p>
    <Button @click="$emit('createFirst')">
      <i class="pi pi-plus mr-2" />
      Crear primera configuracion
    </Button>
  </div>

  <!-- Data Table -->
  <Card v-else class="glass-card overflow-hidden">
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-10" />
            <TableHead
              class="min-w-[150px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'intent_key')"
            >
              <div class="flex items-center gap-1">
                Intent Key
                <SortIcon field="intent_key" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead v-if="nodeMap" class="min-w-[120px]">Nodo</TableHead>
            <TableHead
              class="min-w-[180px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'display_name')"
            >
              <div class="flex items-center gap-1">
                Nombre
                <SortIcon field="display_name" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead
              class="w-[100px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'is_critical')"
            >
              <div class="flex items-center gap-1">
                Critico
                <SortIcon field="is_critical" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead
              class="w-[100px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'response_type')"
            >
              <div class="flex items-center gap-1">
                Tipo
                <SortIcon field="response_type" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead class="min-w-[250px]">Tarea</TableHead>
            <TableHead class="min-w-[150px]">Template</TableHead>
            <TableHead class="w-[80px]">Botones</TableHead>
            <TableHead
              class="w-[100px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'priority')"
            >
              <div class="flex items-center gap-1">
                Prioridad
                <SortIcon field="priority" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead
              class="w-[100px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'is_enabled')"
            >
              <div class="flex items-center gap-1">
                Estado
                <SortIcon field="is_enabled" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead class="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="config in configs" :key="config.id">
            <!-- Main Row -->
            <TableRow class="group hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7"
                  @click="$emit('toggleRow', config.id)"
                >
                  <i
                    class="pi text-xs transition-transform duration-200"
                    :class="expandedRows.has(config.id) ? 'pi-chevron-down' : 'pi-chevron-right'"
                  />
                </Button>
              </TableCell>
              <TableCell>
                <code class="text-sm font-mono bg-muted/50 dark:bg-white/10 px-2 py-0.5 rounded">
                  {{ config.intent_key }}
                </code>
              </TableCell>
              <TableCell v-if="nodeMap">
                <Badge v-if="nodeMap[config.intent_key]" variant="outline" class="text-xs">
                  {{ nodeMap[config.intent_key].nodeDisplayName }}
                </Badge>
                <span v-else class="text-muted-foreground text-xs">&mdash;</span>
              </TableCell>
              <TableCell class="text-foreground">
                {{ config.display_name || '-' }}
              </TableCell>
              <TableCell>
                <Badge :variant="config.is_critical ? 'destructive' : 'secondary'">
                  {{ config.is_critical ? 'Critico' : 'Normal' }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="config.response_type === 'prompt' ? 'default' : 'outline'" :class="config.response_type === 'prompt' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'">
                  {{ config.response_type === 'prompt' ? 'Prompt' : 'Fija' }}
                </Badge>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <span class="text-sm text-muted-foreground cursor-help">
                        {{ truncateText(config.task_description, 50) }}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" class="max-w-sm">
                      <p class="text-sm">{{ config.task_description }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <code class="text-sm font-mono bg-muted/50 dark:bg-white/10 px-2 py-0.5 rounded">
                  {{ config.fallback_template_key }}
                </code>
              </TableCell>
              <TableCell>
                <Badge
                  v-if="config.buttons && config.buttons.length > 0"
                  variant="outline"
                  class="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                >
                  {{ config.buttons.length }}
                </Badge>
                <span v-else class="text-muted-foreground text-xs">&mdash;</span>
              </TableCell>
              <TableCell>
                <span class="inline-block px-2 py-0.5 bg-muted/50 dark:bg-white/10 rounded text-sm font-medium text-foreground">
                  {{ config.priority }}
                </span>
              </TableCell>
              <TableCell>
                <Badge :variant="config.is_enabled ? 'success' : 'secondary'">
                  {{ config.is_enabled ? 'Activa' : 'Inactiva' }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          @click="$emit('edit', config)"
                        >
                          <i class="pi pi-pencil text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          @click="$emit('delete', config)"
                        >
                          <i class="pi pi-trash text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>

            <!-- Expanded Row -->
            <TableRow v-if="expandedRows.has(config.id)">
              <TableCell :colspan="totalColumnCount" class="p-0">
                <div class="bg-muted/30 dark:bg-white/5 p-4 border-t border-border/50">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Task Description Section -->
                    <div class="glass-card p-4">
                      <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Descripcion de Tarea
                      </h4>
                      <p class="text-sm leading-relaxed whitespace-pre-wrap bg-background/50 dark:bg-white/5 rounded-lg p-3 text-foreground">
                        {{ config.task_description }}
                      </p>
                    </div>

                    <!-- Template Text Section -->
                    <div v-if="config.template_text" class="glass-card p-4">
                      <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        {{ config.response_type === 'prompt' ? 'System Prompt' : 'Texto de Plantilla' }}
                      </h4>
                      <pre class="text-sm leading-relaxed whitespace-pre-wrap bg-background/50 dark:bg-white/5 rounded-lg p-3 text-foreground font-mono">{{ config.template_text }}</pre>
                    </div>

                    <!-- Details Section -->
                    <div class="glass-card p-4">
                      <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Detalles
                      </h4>
                      <div class="space-y-2 text-sm">
                        <div class="flex gap-2">
                          <span class="text-muted-foreground min-w-[120px]">Tipo:</span>
                          <Badge :variant="config.response_type === 'prompt' ? 'default' : 'outline'" :class="config.response_type === 'prompt' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'">
                            {{ config.response_type === 'prompt' ? 'Prompt LLM' : 'Plantilla Fija' }}
                          </Badge>
                        </div>
                        <div class="flex gap-2">
                          <span class="text-muted-foreground min-w-[120px]">Template de Fallback:</span>
                          <code class="text-foreground">{{ config.fallback_template_key }}</code>
                        </div>
                        <div v-if="config.description" class="flex gap-2">
                          <span class="text-muted-foreground min-w-[120px]">Descripcion:</span>
                          <span class="text-foreground">{{ config.description }}</span>
                        </div>
                        <div class="flex gap-2">
                          <span class="text-muted-foreground min-w-[120px]">Creado:</span>
                          <span class="text-foreground">{{ formatDate(config.created_at) }}</span>
                        </div>
                        <div class="flex gap-2">
                          <span class="text-muted-foreground min-w-[120px]">Actualizado:</span>
                          <span class="text-foreground">{{ formatDate(config.updated_at) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Buttons Section -->
                    <div v-if="config.buttons && config.buttons.length > 0" class="glass-card p-4">
                      <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Botones WhatsApp ({{ config.buttons.length }})
                      </h4>
                      <div class="flex flex-wrap gap-2">
                        <div
                          v-for="btn in config.buttons"
                          :key="btn.id"
                          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
                        >
                          <code class="text-xs font-mono text-muted-foreground">{{ btn.id }}</code>
                          <span class="text-xs text-emerald-400 font-medium">{{ btn.title }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Quick Actions Section -->
                    <div class="glass-card p-4">
                      <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Acciones Rapidas
                      </h4>
                      <div class="flex flex-wrap gap-2">
                        <Button
                          :variant="config.is_enabled ? 'secondary' : 'default'"
                          size="sm"
                          class="gap-1.5"
                          @click="$emit('toggleEnabled', config)"
                        >
                          <i :class="config.is_enabled ? 'pi pi-times' : 'pi pi-check'" class="text-xs" />
                          {{ config.is_enabled ? 'Deshabilitar' : 'Habilitar' }}
                        </Button>
                        <Button
                          :variant="config.is_critical ? 'secondary' : 'destructive'"
                          size="sm"
                          class="gap-1.5"
                          @click="$emit('toggleCritical', config)"
                        >
                          <i :class="config.is_critical ? 'pi pi-minus' : 'pi pi-exclamation-triangle'" class="text-xs" />
                          {{ config.is_critical ? 'Quitar Critico' : 'Marcar Critico' }}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </CardContent>

    <!-- Pagination -->
    <CardFooter
      v-if="totalPages > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border/50"
    >
      <div class="text-sm text-muted-foreground">
        Mostrando {{ paginationStart }} a {{ paginationEnd }} de {{ filteredCount }} configuraciones
      </div>
      <div class="flex items-center gap-2">
        <Select
          :model-value="String(pageSize)"
          @update:model-value="$emit('pageSizeChange', $event)"
        >
          <SelectTrigger class="w-[80px] h-8 bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            :disabled="currentPage <= 1"
            @click="$emit('update:currentPage', 1)"
          >
            <i class="pi pi-angle-double-left text-xs" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            :disabled="currentPage <= 1"
            @click="$emit('update:currentPage', currentPage - 1)"
          >
            <i class="pi pi-angle-left text-xs" />
          </Button>
          <span class="text-sm text-muted-foreground px-2">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            :disabled="currentPage >= totalPages"
            @click="$emit('update:currentPage', currentPage + 1)"
          >
            <i class="pi pi-angle-right text-xs" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            :disabled="currentPage >= totalPages"
            @click="$emit('update:currentPage', totalPages)"
          >
            <i class="pi pi-angle-double-right text-xs" />
          </Button>
        </div>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { h, computed, defineComponent } from 'vue'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import type { ResponseConfig } from '@/types/responseConfigs.types'

const props = defineProps<{
  configs: ResponseConfig[]
  loading: boolean
  filteredCount: number
  searchQuery: string
  showOnlyEnabled: boolean
  showOnlyCritical: boolean
  sortField: string
  sortOrder: number
  currentPage: number
  pageSize: number
  totalPages: number
  paginationStart: number
  paginationEnd: number
  expandedRows: Set<string>
  nodeMap?: Record<string, { nodeId: string; nodeDisplayName: string }>
  nodeFilter?: string | null
  nodeFilterOptions?: { id: string; label: string }[]
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:showOnlyEnabled', value: boolean): void
  (e: 'update:showOnlyCritical', value: boolean): void
  (e: 'update:currentPage', value: number): void
  (e: 'update:nodeFilter', value: string | null): void
  (e: 'sort', field: string): void
  (e: 'toggleRow', id: string): void
  (e: 'edit', config: ResponseConfig): void
  (e: 'delete', config: ResponseConfig): void
  (e: 'toggleEnabled', config: ResponseConfig): void
  (e: 'toggleCritical', config: ResponseConfig): void
  (e: 'createFirst'): void
  (e: 'pageSizeChange', value: string): void
}>()

// --- Sort Icon inline component ---
const SortIcon = defineComponent({
  props: {
    field: { type: String, required: true },
    sortField: { type: String, required: true },
    sortOrder: { type: Number, required: true }
  },
  setup(props) {
    return () => {
      if (props.field === props.sortField) {
        return h('i', {
          class: `pi text-xs ml-0.5 ${props.sortOrder === 1 ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'}`
        })
      }
      return h('i', { class: 'pi pi-sort-alt text-xs ml-0.5 opacity-30' })
    }
  }
})

const totalColumnCount = computed(() => 11 + (props.nodeMap ? 1 : 0))

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
