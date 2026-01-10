<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import type { ChattigoCredential } from '@/types/chattigoCredentials.types'
import {
  getEnabledStatusSeverity,
  getEnabledStatusLabel,
  formatDID
} from '@/types/chattigoCredentials.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import ToggleSwitch from 'primevue/toggleswitch'

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

const enabledOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
]

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

function handleEnabledFilter(enabled: boolean | undefined) {
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
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchValue"
            placeholder="Buscar por nombre, DID o bot..."
            class="w-full"
            @input="handleSearch"
          />
        </IconField>
      </div>
      <Select
        :options="enabledOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        class="w-40"
        @update:model-value="handleEnabledFilter"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && filteredCredentials.length === 0" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else
      :value="filteredCredentials"
      :loading="isLoading"
      stripedRows
      class="p-datatable-sm"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-whatsapp text-4xl mb-2" />
          <p>No se encontraron credenciales de Chattigo</p>
          <p class="text-sm mt-1">Crea una nueva credencial para comenzar</p>
        </div>
      </template>

      <Column field="did" header="DID" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i class="pi pi-whatsapp text-green-500" />
            <div>
              <div class="font-mono text-sm">{{ formatDID(data.did) }}</div>
              <div class="text-xs text-gray-500">{{ data.did }}</div>
            </div>
          </div>
        </template>
      </Column>

      <Column field="name" header="Nombre" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-medium">{{ data.name }}</span>
        </template>
      </Column>

      <Column field="bot_name" header="Bot" style="width: 120px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i class="pi pi-android text-blue-500" />
            <span class="text-sm">{{ data.bot_name }}</span>
          </div>
        </template>
      </Column>

      <Column field="enabled" header="Estado" style="width: 120px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <ToggleSwitch
              :modelValue="data.enabled"
              @update:modelValue="handleToggleEnabled(data)"
            />
            <Tag
              :severity="getEnabledStatusSeverity(data.enabled)"
              :value="getEnabledStatusLabel(data.enabled)"
            />
          </div>
        </template>
      </Column>

      <Column field="token_refresh_hours" header="Refresh" style="width: 100px">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.token_refresh_hours }}h</span>
        </template>
      </Column>

      <Column field="updated_at" header="Actualizado" :sortable="true" style="width: 120px">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ formatDate(data.updated_at) }}</span>
        </template>
      </Column>

      <Column header="Acciones" style="width: 150px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-play"
              severity="success"
              text
              rounded
              size="small"
              v-tooltip="'Probar conexion'"
              @click.stop="emit('test', data)"
            />
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              v-tooltip="'Editar'"
              @click.stop="emit('edit', data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              v-tooltip="'Eliminar'"
              @click.stop="emit('delete', data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
