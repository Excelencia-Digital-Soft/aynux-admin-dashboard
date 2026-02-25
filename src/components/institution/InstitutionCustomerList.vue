<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInstitutionConversation } from '@/composables/useInstitutionConversation'
import type { InstitutionCustomer } from '@/types/institutionConversation.types'
import { formatPhoneNumber } from '@/types/institutionConversation.types'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'

const props = defineProps<{
  orgId: string
  configId: string
}>()

const emit = defineEmits<{
  (e: 'selectCustomer', customer: InstitutionCustomer): void
}>()

const {
  customers,
  totalCustomers,
  isLoading,
  fetchCustomers,
  setCustomerPage,
  setCustomerFilters,
  store
} = useInstitutionConversation()

const searchQuery = ref('')

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`
  if (days < 7) return `Hace ${days} dias`
  return formatDate(dateStr)
}

function truncateSummary(summary: string | null): string {
  if (!summary) return 'Sin resumen'
  return summary.length > 80 ? summary.substring(0, 80) + '...' : summary
}

function handlePageChange(page: number) {
  setCustomerPage(page)
  fetchCustomers(props.orgId, props.configId)
}

function handleSearch() {
  setCustomerFilters({ search: searchQuery.value || undefined })
  fetchCustomers(props.orgId, props.configId)
}

function handleRowClick(customer: InstitutionCustomer) {
  emit('selectCustomer', customer)
}

watch(
  () => [props.orgId, props.configId] as const,
  ([orgId, configId]) => {
    if (orgId && configId) {
      fetchCustomers(orgId, configId)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <!-- Search -->
    <div class="mb-4">
      <div class="relative w-full md:w-80">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar por telefono..."
          class="pl-9"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && customers.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[60px] rounded-lg bg-muted animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="customers.length === 0" class="text-center py-8 text-muted-foreground">
      <i class="pi pi-users text-4xl mb-2" />
      <p>No se encontraron clientes</p>
    </div>

    <!-- Table -->
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="min-w-[180px]">Cliente</TableHead>
          <TableHead class="w-[180px]">Ultima Actividad</TableHead>
          <TableHead class="w-[100px]">Mensajes</TableHead>
          <TableHead class="min-w-[200px]">Resumen</TableHead>
          <TableHead class="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="customer in customers"
          :key="customer.conversation_id"
          class="cursor-pointer"
          @click="handleRowClick(customer)"
        >
          <!-- Cliente -->
          <TableCell>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <i class="pi pi-user text-blue-500" />
              </div>
              <div>
                <div class="font-medium text-foreground">{{ formatPhoneNumber(customer.user_phone) }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ customer.total_messages }} mensajes
                </div>
              </div>
            </div>
          </TableCell>

          <!-- Ultima Actividad -->
          <TableCell>
            <div class="flex flex-col">
              <span class="text-sm font-medium text-foreground">{{ formatRelativeTime(customer.last_activity) }}</span>
              <span class="text-xs text-muted-foreground">{{ formatDate(customer.last_activity) }}</span>
            </div>
          </TableCell>

          <!-- Mensajes -->
          <TableCell>
            <Badge variant="info">{{ customer.total_messages }}</Badge>
          </TableCell>

          <!-- Resumen -->
          <TableCell>
            <p class="text-sm text-muted-foreground italic">
              {{ truncateSummary(customer.rolling_summary) }}
            </p>
          </TableCell>

          <!-- Action -->
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click.stop="handleRowClick(customer)"
            >
              <i class="pi pi-comments text-sm" />
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- Pagination -->
    <Pagination
      v-if="totalCustomers > store.customerPageSize"
      :totalRecords="totalCustomers"
      :rows="store.customerPageSize"
      :currentPage="store.customerPage"
      @pageChange="handlePageChange"
      class="mt-4 justify-center"
    />
  </div>
</template>
