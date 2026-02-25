<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import type { Organization } from '@/types/organization.types'

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

const emit = defineEmits<{
  (e: 'select', org: Organization): void
  (e: 'edit', org: Organization): void
  (e: 'delete', org: Organization): void
}>()

const store = useOrganizationStore()
const {
  organizations,
  totalOrganizations,
  isLoading,
  fetchOrganizations,
  setOrgPage,
  setOrgFilters
} = useOrganization()

const statusFilterValue = defineModel<string>('statusFilter', { default: 'all' })

function getStatusVariant(status: string): 'success' | 'warning' | 'destructive' | 'secondary' {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'destructive'
  }
  return map[status] || 'secondary'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido'
  }
  return map[status] || status
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES')
}

function onPageChange(page: number) {
  setOrgPage(page)
  fetchOrganizations()
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setOrgFilters({ search: value || undefined })
  fetchOrganizations()
}

function handleStatusFilter(val: string) {
  statusFilterValue.value = val
  setOrgFilters({ status: val === 'all' ? undefined : val })
  fetchOrganizations()
}

onMounted(() => {
  fetchOrganizations()
})
</script>

<template>
  <div class="organization-list">
    <!-- Filters -->
    <div class="flex gap-4 mb-4">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <Input
          placeholder="Buscar organizaciones..."
          class="pl-9"
          @input="handleSearch"
        />
      </div>
      <Select :model-value="statusFilterValue" @update:model-value="handleStatusFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Activo</SelectItem>
          <SelectItem value="inactive">Inactivo</SelectItem>
          <SelectItem value="suspended">Suspendido</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && organizations.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[60px] animate-pulse rounded bg-muted" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="organizations.length === 0"
      class="text-center py-8 text-muted-foreground"
    >
      <i class="pi pi-building text-4xl mb-2" />
      <p>No se encontraron organizaciones</p>
    </div>

    <!-- Table -->
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="min-w-[200px]">Nombre</TableHead>
          <TableHead class="w-[120px]">Estado</TableHead>
          <TableHead class="w-[150px]">Limites</TableHead>
          <TableHead class="w-[120px]">Creada</TableHead>
          <TableHead class="w-[120px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="org in organizations"
          :key="org.id"
          class="cursor-pointer"
          @click="emit('select', org)"
        >
          <!-- Name -->
          <TableCell>
            <div class="flex items-center gap-3">
              <div
                v-if="org.logo_url"
                class="w-10 h-10 rounded-lg bg-cover bg-center"
                :style="{ backgroundImage: `url(${org.logo_url})` }"
              />
              <div v-else class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <i class="pi pi-building text-primary" />
              </div>
              <div>
                <div class="font-medium text-foreground">{{ org.name }}</div>
                <div class="text-xs text-muted-foreground">{{ org.slug }}</div>
              </div>
            </div>
          </TableCell>

          <!-- Status -->
          <TableCell>
            <Badge :variant="getStatusVariant(org.status)">
              {{ getStatusLabel(org.status) }}
            </Badge>
          </TableCell>

          <!-- Limits -->
          <TableCell>
            <div class="text-sm">
              <span v-if="org.settings?.max_users" class="text-foreground">
                <i class="pi pi-users text-xs" /> {{ org.settings.max_users }} usuarios
              </span>
              <span v-else class="text-muted-foreground">Sin limite</span>
            </div>
          </TableCell>

          <!-- Created -->
          <TableCell>
            <span class="text-sm text-muted-foreground">{{ formatDate(org.created_at) }}</span>
          </TableCell>

          <!-- Actions -->
          <TableCell>
            <div class="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop="emit('edit', org)">
                      <i class="pi pi-pencil text-sm" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Editar</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click.stop="emit('delete', org)">
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
      v-if="totalOrganizations > store.orgPageSize"
      :total-records="totalOrganizations"
      :rows="store.orgPageSize"
      :current-page="store.orgPage"
      @page-change="onPageChange"
      class="mt-4"
    />
  </div>
</template>
