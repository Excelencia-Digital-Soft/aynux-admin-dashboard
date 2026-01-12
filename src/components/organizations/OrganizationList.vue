<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import type { Organization } from '@/types/organization.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'

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

const statusOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Suspendido', value: 'suspended' }
]

function getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
  const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'danger'
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

function onPageChange(event: { page: number; rows: number }) {
  setOrgPage(event.page + 1)
  fetchOrganizations()
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setOrgFilters({ search: value || undefined })
  fetchOrganizations()
}

function handleStatusFilter(status: string | undefined) {
  setOrgFilters({ status })
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
      <div class="flex-1">
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText
            placeholder="Buscar organizaciones..."
            class="w-full"
            @input="handleSearch"
          />
        </IconField>
      </div>
      <Select
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        class="w-40"
        @update:model-value="handleStatusFilter"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && organizations.length === 0" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else
      :value="organizations"
      :loading="isLoading"
      stripedRows
      class="p-datatable-sm"
      @row-click="(e) => emit('select', e.data)"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-building text-4xl mb-2" />
          <p>No se encontraron organizaciones</p>
        </div>
      </template>

      <Column field="name" header="Nombre" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <div
              v-if="data.logo_url"
              class="w-10 h-10 rounded-lg bg-cover bg-center"
              :style="{ backgroundImage: `url(${data.logo_url})` }"
            />
            <div v-else class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i class="pi pi-building text-blue-500" />
            </div>
            <div>
              <div class="font-medium">{{ data.name }}</div>
              <div class="text-xs text-gray-500">{{ data.slug }}</div>
            </div>
          </div>
        </template>
      </Column>

      <Column field="status" header="Estado" style="width: 120px">
        <template #body="{ data }">
          <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)" />
        </template>
      </Column>

      <Column header="Limites" style="width: 150px">
        <template #body="{ data }">
          <div class="text-sm">
            <span v-if="data.settings?.max_users">
              <i class="pi pi-users text-xs" /> {{ data.settings.max_users }} usuarios
            </span>
            <span v-else class="text-gray-400">Sin limite</span>
          </div>
        </template>
      </Column>

      <Column field="created_at" header="Creada" :sortable="true" style="width: 120px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.created_at) }}</span>
        </template>
      </Column>

      <Column header="Acciones" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-1">
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
      v-if="totalOrganizations > 0"
      :first="(store.orgPage - 1) * store.orgPageSize"
      :rows="store.orgPageSize"
      :totalRecords="totalOrganizations"
      :rowsPerPageOptions="[10, 25, 50]"
      @page="onPageChange"
      class="mt-4"
    />
  </div>
</template>
