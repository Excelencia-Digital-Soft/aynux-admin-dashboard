<script setup lang="ts">
import { ref } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import type { PharmacyConfig } from '@/types/pharmacyConfig.types'
import {
  getMPStatusSeverity,
  getMPStatusLabel,
  getCredentialsSeverity,
  getCredentialsLabel,
  formatPhoneNumber
} from '@/types/pharmacyConfig.types'

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
import { Pagination } from '@/components/ui/pagination'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const props = defineProps<{
  organizationId?: string
}>()

const emit = defineEmits<{
  (e: 'select', pharmacy: PharmacyConfig): void
  (e: 'edit', pharmacy: PharmacyConfig): void
  (e: 'delete', pharmacy: PharmacyConfig): void
}>()

const store = usePharmacyStore()
const {
  pharmacies,
  totalPharmacies,
  isLoading,
  fetchPharmacies,
  setPharmacyPage,
  setPharmacyFilters
} = usePharmacyConfig()

const mpFilterValue = ref('all')

function severityToBadgeVariant(severity: string): 'success' | 'warning' | 'destructive' | 'secondary' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
    success: 'success',
    warn: 'warning',
    danger: 'destructive',
    secondary: 'secondary',
    info: 'info'
  }
  return map[severity] || 'secondary'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES')
}

function onPageChange(page: number) {
  setPharmacyPage(page)
  fetchPharmacies(props.organizationId)
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setPharmacyFilters({ search: value || undefined })
  fetchPharmacies(props.organizationId)
}

function handleMPFilter(val: string) {
  mpFilterValue.value = val
  const mpEnabled = val === 'all' ? undefined : val === 'true'
  setPharmacyFilters({ mpEnabled })
  fetchPharmacies(props.organizationId)
}
</script>

<template>
  <div class="pharmacy-list">
    <!-- Filters -->
    <div class="flex gap-4 mb-4">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <Input
          placeholder="Buscar farmacias..."
          class="pl-9"
          @input="handleSearch"
        />
      </div>
      <Select :model-value="mpFilterValue" @update:model-value="handleMPFilter">
        <SelectTrigger class="w-48">
          <SelectValue placeholder="Mercado Pago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">MP Activo</SelectItem>
          <SelectItem value="false">MP Inactivo</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && pharmacies.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[60px] animate-pulse rounded bg-muted" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="pharmacies.length === 0"
      class="text-center py-8 text-muted-foreground"
    >
      <i class="pi pi-building text-4xl mb-2" />
      <p>No se encontraron farmacias</p>
    </div>

    <!-- Table -->
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="min-w-[200px]">Nombre</TableHead>
          <TableHead class="w-[150px]">Telefono</TableHead>
          <TableHead class="w-[150px]">WhatsApp</TableHead>
          <TableHead class="w-[140px]">Mercado Pago</TableHead>
          <TableHead class="w-[100px]">Modo</TableHead>
          <TableHead class="w-[120px]">Creada</TableHead>
          <TableHead class="w-[150px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="pharmacy in pharmacies"
          :key="pharmacy.id"
          class="cursor-pointer"
          @click="emit('select', pharmacy)"
        >
          <!-- Name -->
          <TableCell>
            <div class="flex items-center gap-3">
              <div
                v-if="pharmacy.pharmacy_logo_path"
                class="w-10 h-10 rounded-lg bg-cover bg-center"
                :style="{ backgroundImage: `url(${pharmacy.pharmacy_logo_path})` }"
              />
              <div v-else class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <i class="pi pi-shop text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div class="font-medium text-foreground">{{ pharmacy.pharmacy_name }}</div>
                <div v-if="pharmacy.organization_name" class="text-xs text-muted-foreground">
                  {{ pharmacy.organization_name }}
                </div>
              </div>
            </div>
          </TableCell>

          <!-- Phone -->
          <TableCell>
            <span class="text-sm text-foreground">{{ formatPhoneNumber(pharmacy.pharmacy_phone) }}</span>
          </TableCell>

          <!-- WhatsApp -->
          <TableCell>
            <div class="flex items-center gap-2">
              <i class="pi pi-whatsapp text-green-500" />
              <span class="text-sm text-foreground">{{ formatPhoneNumber(pharmacy.whatsapp_phone_number) }}</span>
            </div>
          </TableCell>

          <!-- Mercado Pago -->
          <TableCell>
            <div class="flex flex-col gap-1">
              <Badge :variant="severityToBadgeVariant(getMPStatusSeverity(pharmacy.mp_enabled))">
                {{ getMPStatusLabel(pharmacy.mp_enabled) }}
              </Badge>
              <Badge
                v-if="pharmacy.mp_enabled"
                :variant="severityToBadgeVariant(getCredentialsSeverity(pharmacy.has_mp_credentials))"
                class="text-xs"
              >
                {{ getCredentialsLabel(pharmacy.has_mp_credentials) }}
              </Badge>
            </div>
          </TableCell>

          <!-- Mode -->
          <TableCell>
            <Badge
              v-if="pharmacy.mp_enabled"
              :variant="pharmacy.mp_sandbox ? 'warning' : 'success'"
            >
              {{ pharmacy.mp_sandbox ? 'Sandbox' : 'Produccion' }}
            </Badge>
            <span v-else class="text-muted-foreground">-</span>
          </TableCell>

          <!-- Created -->
          <TableCell>
            <span class="text-sm text-muted-foreground">{{ formatDate(pharmacy.created_at) }}</span>
          </TableCell>

          <!-- Actions -->
          <TableCell>
            <div class="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop="emit('select', pharmacy)">
                      <i class="pi pi-eye text-sm" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Ver historial</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop="emit('edit', pharmacy)">
                      <i class="pi pi-pencil text-sm" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Editar</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click.stop="emit('delete', pharmacy)">
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

    <!-- Pagination -->
    <Pagination
      v-if="totalPharmacies > store.pharmacyPageSize"
      :total-records="totalPharmacies"
      :rows="store.pharmacyPageSize"
      :current-page="store.pharmacyPage"
      @page-change="onPageChange"
      class="mt-4"
    />
  </div>
</template>
