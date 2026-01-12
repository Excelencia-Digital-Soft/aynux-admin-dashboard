<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import type { PharmacyCustomer } from '@/types/pharmacyConfig.types'
import { formatPhoneNumber } from '@/types/pharmacyConfig.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

const props = defineProps<{
  pharmacyId: string
}>()

const emit = defineEmits<{
  (e: 'selectCustomer', customer: PharmacyCustomer): void
}>()

const store = usePharmacyStore()
const {
  customers,
  totalCustomers,
  isLoading,
  fetchCustomers,
  setCustomerPage,
  setCustomerFilters
} = usePharmacyConfig()

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

function onPageChange(event: { page: number; rows: number }) {
  setCustomerPage(event.page + 1)
  fetchCustomers(props.pharmacyId)
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setCustomerFilters({ search: value || undefined })
  fetchCustomers(props.pharmacyId)
}

function handleRowClick(customer: PharmacyCustomer) {
  emit('selectCustomer', customer)
}

// Watch for pharmacy changes
watch(
  () => props.pharmacyId,
  (newId) => {
    if (newId) {
      fetchCustomers(newId)
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.pharmacyId) {
    fetchCustomers(props.pharmacyId)
  }
})
</script>

<template>
  <div class="pharmacy-customer-list">
    <!-- Search -->
    <div class="mb-4">
      <IconField class="w-full md:w-80">
        <InputIcon class="pi pi-search" />
        <InputText
          placeholder="Buscar por telefono..."
          class="w-full"
          @input="handleSearch"
        />
      </IconField>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && customers.length === 0" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else
      :value="customers"
      :loading="isLoading"
      stripedRows
      class="p-datatable-sm cursor-pointer"
      @row-click="(e) => handleRowClick(e.data)"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-users text-4xl mb-2" />
          <p>No se encontraron clientes</p>
        </div>
      </template>

      <Column field="user_phone" header="Cliente" style="min-width: 180px">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="pi pi-user text-blue-500" />
            </div>
            <div>
              <div class="font-medium">{{ formatPhoneNumber(data.user_phone) }}</div>
              <div class="text-xs text-gray-500">
                {{ data.total_messages }} mensajes
              </div>
            </div>
          </div>
        </template>
      </Column>

      <Column field="last_activity" header="Ultima Actividad" style="width: 180px">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="text-sm font-medium">{{ formatRelativeTime(data.last_activity) }}</span>
            <span class="text-xs text-gray-400">{{ formatDate(data.last_activity) }}</span>
          </div>
        </template>
      </Column>

      <Column field="total_messages" header="Mensajes" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="String(data.total_messages)" severity="info" />
        </template>
      </Column>

      <Column field="rolling_summary" header="Resumen" style="min-width: 200px">
        <template #body="{ data }">
          <p class="text-sm text-gray-600 italic">
            {{ truncateSummary(data.rolling_summary) }}
          </p>
        </template>
      </Column>

      <Column header="" style="width: 60px">
        <template #body="{ data }">
          <Button
            icon="pi pi-comments"
            severity="secondary"
            text
            rounded
            size="small"
            @click.stop="handleRowClick(data)"
            v-tooltip="'Ver conversacion'"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Pagination -->
    <Paginator
      v-if="totalCustomers > 0"
      :first="(store.customerPage - 1) * store.customerPageSize"
      :rows="store.customerPageSize"
      :totalRecords="totalCustomers"
      :rowsPerPageOptions="[10, 25, 50]"
      @page="onPageChange"
      class="mt-4"
    />
  </div>
</template>
