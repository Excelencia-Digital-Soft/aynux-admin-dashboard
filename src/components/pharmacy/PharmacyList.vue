<script setup lang="ts">
import { onMounted } from 'vue'
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

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'

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

const mpOptions = [
  { label: 'Todos', value: undefined },
  { label: 'MP Activo', value: true },
  { label: 'MP Inactivo', value: false }
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES')
}

function onPageChange(event: { page: number; rows: number }) {
  setPharmacyPage(event.page + 1)
  fetchPharmacies()
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setPharmacyFilters({ search: value || undefined })
  fetchPharmacies()
}

function handleMPFilter(mpEnabled: boolean | undefined) {
  setPharmacyFilters({ mpEnabled })
  fetchPharmacies()
}

onMounted(() => {
  fetchPharmacies()
})
</script>

<template>
  <div class="pharmacy-list">
    <!-- Filters -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <InputText
          placeholder="Buscar farmacias..."
          class="w-full"
          @input="handleSearch"
        />
      </div>
      <Select
        :options="mpOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Mercado Pago"
        class="w-48"
        @update:model-value="handleMPFilter"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && pharmacies.length === 0" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else
      :value="pharmacies"
      :loading="isLoading"
      stripedRows
      class="p-datatable-sm"
      @row-click="(e) => emit('select', e.data)"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-building text-4xl mb-2" />
          <p>No se encontraron farmacias</p>
        </div>
      </template>

      <Column field="pharmacy_name" header="Nombre" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <div
              v-if="data.pharmacy_logo_path"
              class="w-10 h-10 rounded-lg bg-cover bg-center"
              :style="{ backgroundImage: `url(${data.pharmacy_logo_path})` }"
            />
            <div v-else class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i class="pi pi-shop text-green-600" />
            </div>
            <div>
              <div class="font-medium">{{ data.pharmacy_name }}</div>
              <div v-if="data.organization_name" class="text-xs text-gray-500">
                {{ data.organization_name }}
              </div>
            </div>
          </div>
        </template>
      </Column>

      <Column field="pharmacy_phone" header="Telefono" style="width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatPhoneNumber(data.pharmacy_phone) }}</span>
        </template>
      </Column>

      <Column field="whatsapp_phone_number" header="WhatsApp" style="width: 150px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i class="pi pi-whatsapp text-green-500" />
            <span class="text-sm">{{ formatPhoneNumber(data.whatsapp_phone_number) }}</span>
          </div>
        </template>
      </Column>

      <Column field="mp_enabled" header="Mercado Pago" style="width: 140px">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <Tag
              :severity="getMPStatusSeverity(data.mp_enabled)"
              :value="getMPStatusLabel(data.mp_enabled)"
            />
            <Tag
              v-if="data.mp_enabled"
              :severity="getCredentialsSeverity(data.has_mp_credentials)"
              :value="getCredentialsLabel(data.has_mp_credentials)"
              class="text-xs"
            />
          </div>
        </template>
      </Column>

      <Column field="mp_sandbox" header="Modo" style="width: 100px">
        <template #body="{ data }">
          <Tag
            v-if="data.mp_enabled"
            :severity="data.mp_sandbox ? 'warn' : 'success'"
            :value="data.mp_sandbox ? 'Sandbox' : 'Produccion'"
          />
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>

      <Column field="created_at" header="Creada" :sortable="true" style="width: 120px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.created_at) }}</span>
        </template>
      </Column>

      <Column header="Acciones" style="width: 150px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-eye"
              severity="info"
              text
              rounded
              size="small"
              @click.stop="emit('select', data)"
              v-tooltip="'Ver historial'"
            />
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              @click.stop="emit('edit', data)"
              v-tooltip="'Editar'"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click.stop="emit('delete', data)"
              v-tooltip="'Eliminar'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Pagination -->
    <Paginator
      v-if="totalPharmacies > 0"
      :first="(store.pharmacyPage - 1) * store.pharmacyPageSize"
      :rows="store.pharmacyPageSize"
      :totalRecords="totalPharmacies"
      :rowsPerPageOptions="[10, 25, 50]"
      @page="onPageChange"
      class="mt-4"
    />
  </div>
</template>
