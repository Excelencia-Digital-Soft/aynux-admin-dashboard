<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import type { ChattigoCredential } from '@/types/chattigoCredentials.types'
import {
  getEnabledStatusLabel,
  formatDID
} from '@/types/chattigoCredentials.types'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const emit = defineEmits<{
  (e: 'edit', credential: ChattigoCredential): void
  (e: 'delete', credential: ChattigoCredential): void
  (e: 'test', credential: ChattigoCredential): void
}>()

const store = useChattigoCredentialsStore()
const {
  filteredCredentials,
  isLoading,
  fetchCredentials,
  setFilters,
  updateCredential
} = useChattigoCredentials()

const searchValue = ref('')
const enabledFilterValue = ref('all')

function getStatusBadgeVariant(enabled: boolean): 'success' | 'secondary' {
  return enabled ? 'success' : 'secondary'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchValue.value = value
  setFilters({ search: value || undefined })
}

function handleEnabledFilter(val: string) {
  enabledFilterValue.value = val
  let enabled: boolean | undefined
  if (val === 'true') enabled = true
  else if (val === 'false') enabled = false
  else enabled = undefined
  setFilters({ enabled })
}

async function handleToggleEnabled(credential: ChattigoCredential) {
  await updateCredential(credential.did, { enabled: !credential.enabled })
}

onMounted(() => {
  fetchCredentials()
})
</script>

<template>
  <div class="chattigo-credentials-list">
    <!-- Filters -->
    <div class="flex gap-4 mb-4 glass-panel rounded-lg p-4">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <Input
          v-model="searchValue"
          placeholder="Buscar por nombre, DID o bot..."
          class="pl-9 w-full"
          @input="handleSearch"
        />
      </div>
      <Select :model-value="enabledFilterValue" @update:model-value="handleEnabledFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activos</SelectItem>
          <SelectItem value="false">Inactivos</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && filteredCredentials.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded bg-muted" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredCredentials.length === 0"
      class="text-center py-8 text-muted-foreground"
    >
      <i class="pi pi-whatsapp text-4xl mb-2" />
      <p>No se encontraron credenciales de Chattigo</p>
      <p class="text-sm mt-1">Crea una nueva credencial para comenzar</p>
    </div>

    <!-- Table -->
    <div v-else class="glass-card rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="min-w-[160px]">DID</TableHead>
            <TableHead class="min-w-[150px]">Nombre</TableHead>
            <TableHead class="w-[120px]">Bot</TableHead>
            <TableHead class="w-[120px]">Estado</TableHead>
            <TableHead class="w-[100px]">Refresh</TableHead>
            <TableHead class="w-[120px]">Actualizado</TableHead>
            <TableHead class="w-[150px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="credential in filteredCredentials" :key="credential.did">
            <!-- DID -->
            <TableCell>
              <div class="flex items-center gap-2">
                <i class="pi pi-whatsapp text-green-500" />
                <div>
                  <div class="font-mono text-sm text-foreground">{{ formatDID(credential.did) }}</div>
                  <div class="text-xs text-muted-foreground">{{ credential.did }}</div>
                </div>
              </div>
            </TableCell>

            <!-- Nombre -->
            <TableCell>
              <span class="font-medium text-foreground">{{ credential.name }}</span>
            </TableCell>

            <!-- Bot -->
            <TableCell>
              <div class="flex items-center gap-2">
                <i class="pi pi-android text-blue-500" />
                <span class="text-sm text-foreground">{{ credential.bot_name }}</span>
              </div>
            </TableCell>

            <!-- Estado -->
            <TableCell>
              <div class="flex items-center gap-2">
                <Switch
                  :checked="credential.enabled"
                  @update:checked="handleToggleEnabled(credential)"
                />
                <Badge :variant="getStatusBadgeVariant(credential.enabled)">
                  {{ getEnabledStatusLabel(credential.enabled) }}
                </Badge>
              </div>
            </TableCell>

            <!-- Refresh -->
            <TableCell>
              <span class="text-sm text-muted-foreground">{{ credential.token_refresh_hours }}h</span>
            </TableCell>

            <!-- Actualizado -->
            <TableCell>
              <span class="text-sm text-muted-foreground">{{ formatDate(credential.updated_at) }}</span>
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
                        class="h-8 w-8 text-green-600 hover:text-green-700"
                        @click.stop="emit('test', credential)"
                      >
                        <i class="pi pi-play text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Probar conexion</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        @click.stop="emit('edit', credential)"
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
                        @click.stop="emit('delete', credential)"
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
    </div>
  </div>
</template>
