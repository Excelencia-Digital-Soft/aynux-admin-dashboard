<template>
  <!-- Table Header / Toolbar -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
    <div class="relative w-full sm:w-72">
      <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
      <Input
        :model-value="searchQuery"
        placeholder="Buscar intents..."
        class="pl-9"
        @update:model-value="$emit('update:searchQuery', $event)"
        @input="$emit('search')"
      />
    </div>
    <div class="flex items-center gap-2">
      <Switch
        :checked="showOnlyEnabled"
        @update:checked="$emit('update:showOnlyEnabled', $event)"
      />
      <Label class="text-sm text-muted-foreground cursor-pointer">Solo activos</Label>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="glass-card flex items-center justify-center py-16">
    <i class="pi pi-spinner pi-spin text-2xl text-primary mr-3" />
    <span class="text-muted-foreground">Cargando intents...</span>
  </div>

  <!-- Empty State -->
  <div
    v-else-if="filteredCount === 0"
    class="glass-card flex flex-col items-center justify-center py-12 text-center"
  >
    <i class="pi pi-inbox text-4xl text-muted-foreground mb-4" />
    <p class="text-muted-foreground mb-4">No hay intents configurados para este dominio</p>
    <Button @click="$emit('createFirst')">
      <i class="pi pi-plus mr-2" />
      Crear primer intent
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
                Key
                <SortIcon field="intent_key" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead
              class="min-w-[200px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'name')"
            >
              <div class="flex items-center gap-1">
                Nombre
                <SortIcon field="name" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
            <TableHead
              class="w-[100px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="$emit('sort', 'weight')"
            >
              <div class="flex items-center gap-1">
                Peso
                <SortIcon field="weight" :sort-field="sortField" :sort-order="sortOrder" />
              </div>
            </TableHead>
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
            <TableHead class="w-[200px]">Patrones</TableHead>
            <TableHead class="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="intent in intents" :key="intent.id">
            <!-- Main Row -->
            <TableRow class="group hover:bg-muted/50 transition-colors">
              <!-- Expander -->
              <TableCell class="px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7"
                  @click="$emit('toggleRow', intent.id)"
                >
                  <i
                    class="pi text-xs transition-transform duration-200"
                    :class="expandedRows.has(intent.id) ? 'pi-chevron-down' : 'pi-chevron-right'"
                  />
                </Button>
              </TableCell>
              <!-- Key -->
              <TableCell>
                <code class="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                  {{ intent.intent_key }}
                </code>
              </TableCell>
              <!-- Name -->
              <TableCell class="font-medium text-foreground">{{ intent.name }}</TableCell>
              <!-- Weight -->
              <TableCell>
                <Badge :variant="getWeightVariant(intent.weight)">
                  {{ intent.weight.toFixed(2) }}
                </Badge>
              </TableCell>
              <!-- Priority -->
              <TableCell>
                <span class="inline-block bg-muted px-2 py-0.5 rounded text-sm font-semibold text-foreground">
                  {{ intent.priority }}
                </span>
              </TableCell>
              <!-- Status -->
              <TableCell>
                <Badge :variant="intent.is_enabled ? 'success' : 'secondary'">
                  {{ intent.is_enabled ? 'Activo' : 'Inactivo' }}
                </Badge>
              </TableCell>
              <!-- Pattern Counts -->
              <TableCell>
                <TooltipProvider>
                  <div class="flex gap-1.5 flex-wrap">
                    <Tooltip v-if="(intent.lemmas?.length ?? 0) > 0">
                      <TooltipTrigger as-child>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          <i class="pi pi-book text-[10px]" /> {{ intent.lemmas?.length ?? 0 }}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Lemmas</TooltipContent>
                    </Tooltip>
                    <Tooltip v-if="(intent.phrases?.length ?? 0) > 0">
                      <TooltipTrigger as-child>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          <i class="pi pi-comments text-[10px]" /> {{ intent.phrases?.length ?? 0 }}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Frases</TooltipContent>
                    </Tooltip>
                    <Tooltip v-if="(intent.confirmation_patterns?.length ?? 0) > 0">
                      <TooltipTrigger as-child>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                          <i class="pi pi-check-circle text-[10px]" /> {{ intent.confirmation_patterns?.length ?? 0 }}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Confirmaciones</TooltipContent>
                    </Tooltip>
                    <Tooltip v-if="(intent.keywords?.length ?? 0) > 0">
                      <TooltipTrigger as-child>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
                          <i class="pi pi-key text-[10px]" /> {{ intent.keywords?.length ?? 0 }}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Keywords</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </TableCell>
              <!-- Actions -->
              <TableCell>
                <div class="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                          @click="$emit('edit', intent)"
                        >
                          <i class="pi pi-pencil text-sm" />
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
                          @click="$emit('delete', intent)"
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
            <TableRow v-if="expandedRows.has(intent.id)">
              <TableCell :colspan="8" class="p-0 bg-muted/30 dark:bg-muted/10">
                <slot name="expanded-row" :intent="intent" />
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </CardContent>

    <!-- Pagination -->
    <CardFooter
      v-if="totalPages > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border"
    >
      <div class="text-sm text-muted-foreground">
        Mostrando {{ paginationStart }} a {{ paginationEnd }} de {{ filteredCount }} intents
      </div>
      <div class="flex items-center gap-2">
        <Select :model-value="String(pageSize)" @update:model-value="$emit('pageSizeChange', $event)">
          <SelectTrigger class="w-[80px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
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
          <span class="flex items-center px-2 text-sm text-muted-foreground">
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
import { h, defineComponent } from 'vue'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import type { DomainIntent } from '@/types/domainIntents.types'

defineProps<{
  intents: DomainIntent[]
  loading: boolean
  filteredCount: number
  searchQuery: string
  showOnlyEnabled: boolean
  sortField: string
  sortOrder: number
  currentPage: number
  pageSize: number
  totalPages: number
  paginationStart: number
  paginationEnd: number
  expandedRows: Set<string>
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:showOnlyEnabled', value: boolean): void
  (e: 'update:currentPage', value: number): void
  (e: 'sort', field: string): void
  (e: 'toggleRow', id: string): void
  (e: 'edit', intent: DomainIntent): void
  (e: 'delete', intent: DomainIntent): void
  (e: 'createFirst'): void
  (e: 'pageSizeChange', value: string): void
  (e: 'search'): void
}>()

// Inline SortIcon component (renders sort arrow indicators)
const SortIcon = defineComponent({
  props: {
    field: { type: String, required: true },
    sortField: { type: String, required: true },
    sortOrder: { type: Number, required: true }
  },
  setup(props) {
    return () =>
      h('span', { class: 'inline-flex flex-col leading-none ml-0.5 text-[10px]' }, [
        h('i', {
          class: [
            'pi pi-sort-up-fill',
            props.sortField === props.field && props.sortOrder === 1
              ? 'text-primary'
              : 'text-muted-foreground/40'
          ],
          style: 'margin-bottom: -2px'
        }),
        h('i', {
          class: [
            'pi pi-sort-down-fill',
            props.sortField === props.field && props.sortOrder === -1
              ? 'text-primary'
              : 'text-muted-foreground/40'
          ]
        })
      ])
  }
})

function getWeightVariant(weight: number): 'destructive' | 'warning' | 'success' | 'secondary' {
  if (weight >= 1.5) return 'destructive'
  if (weight >= 1.2) return 'warning'
  if (weight >= 1.0) return 'success'
  return 'secondary'
}
</script>
