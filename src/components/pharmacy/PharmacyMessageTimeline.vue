<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import type { PharmacyMessage } from '@/types/pharmacyConfig.types'
import {
  formatPhoneNumber,
  getSenderTypeLabel,
  getSenderTypeSeverity
} from '@/types/pharmacyConfig.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

const props = defineProps<{
  pharmacyId: string
}>()

const emit = defineEmits<{
  (e: 'selectMessage', message: PharmacyMessage): void
}>()

const store = usePharmacyStore()
const {
  messages,
  totalMessages,
  isLoading,
  fetchTimeline,
  setTimelinePage,
  setTimelineFilters,
  clearTimelineFilters,
  hasTimelineFilters
} = usePharmacyConfig()

// Local filter state
const dateRange = ref<Date[] | null>(null)
const searchQuery = ref('')
const selectedSenderType = ref<string | undefined>(undefined)

const senderTypeOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Cliente', value: 'user' },
  { label: 'Agente', value: 'assistant' },
  { label: 'Sistema', value: 'system' }
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

function onPageChange(event: { page: number; rows: number }) {
  setTimelinePage(event.page + 1)
  fetchTimeline(props.pharmacyId)
}

function handleSearch() {
  setTimelineFilters({ search: searchQuery.value || undefined })
  fetchTimeline(props.pharmacyId)
}

function handleSenderTypeChange(value: string | undefined) {
  selectedSenderType.value = value
  setTimelineFilters({
    sender_type: value === 'all' ? undefined : (value as 'user' | 'assistant' | undefined)
  })
  fetchTimeline(props.pharmacyId)
}

function handleDateRangeChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    setTimelineFilters({
      start_date: start ? start.toISOString() : undefined,
      end_date: end ? end.toISOString() : undefined
    })
  } else {
    setTimelineFilters({
      start_date: undefined,
      end_date: undefined
    })
  }
  fetchTimeline(props.pharmacyId)
}

function handleClearFilters() {
  dateRange.value = null
  searchQuery.value = ''
  selectedSenderType.value = undefined
  clearTimelineFilters()
  fetchTimeline(props.pharmacyId)
}

// Watch for pharmacy changes
watch(
  () => props.pharmacyId,
  (newId) => {
    if (newId) {
      fetchTimeline(newId)
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.pharmacyId) {
    fetchTimeline(props.pharmacyId)
  }
})
</script>

<template>
  <div class="pharmacy-message-timeline">
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-4">
      <div class="flex-1 min-w-[200px]">
        <InputText
          v-model="searchQuery"
          placeholder="Buscar en mensajes..."
          class="w-full"
          @keyup.enter="handleSearch"
        />
      </div>

      <Select
        v-model="selectedSenderType"
        :options="senderTypeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo de mensaje"
        class="w-40"
        @update:model-value="handleSenderTypeChange"
      />

      <DatePicker
        v-model="dateRange"
        selectionMode="range"
        :manualInput="false"
        placeholder="Rango de fechas"
        dateFormat="dd/mm/yy"
        class="w-64"
        @update:model-value="handleDateRangeChange"
      />

      <Button
        v-if="hasTimelineFilters"
        icon="pi pi-filter-slash"
        severity="secondary"
        text
        @click="handleClearFilters"
        v-tooltip="'Limpiar filtros'"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && messages.length === 0" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="80px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else
      :value="messages"
      :loading="isLoading"
      stripedRows
      class="p-datatable-sm"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-inbox text-4xl mb-2" />
          <p>No se encontraron mensajes</p>
        </div>
      </template>

      <Column field="created_at" header="Fecha" :sortable="true" style="width: 180px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.created_at) }}</span>
        </template>
      </Column>

      <Column field="user_phone" header="Cliente" style="width: 150px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i class="pi pi-whatsapp text-green-500 text-sm" />
            <span class="text-sm">{{ formatPhoneNumber(data.user_phone) }}</span>
          </div>
        </template>
      </Column>

      <Column field="sender_type" header="Tipo" style="width: 100px">
        <template #body="{ data }">
          <Tag
            :severity="getSenderTypeSeverity(data.sender_type)"
            :value="getSenderTypeLabel(data.sender_type)"
          />
        </template>
      </Column>

      <Column field="content" header="Mensaje" style="min-width: 300px">
        <template #body="{ data }">
          <div class="text-sm">
            <p>{{ truncateContent(data.content) }}</p>
            <span v-if="data.agent_name" class="text-xs text-gray-400 mt-1">
              Agente: {{ data.agent_name }}
            </span>
          </div>
        </template>
      </Column>

      <Column header="" style="width: 60px">
        <template #body="{ data }">
          <Button
            icon="pi pi-external-link"
            severity="secondary"
            text
            rounded
            size="small"
            @click="emit('selectMessage', data)"
            v-tooltip="'Ver conversacion'"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Pagination -->
    <Paginator
      v-if="totalMessages > 0"
      :first="(store.timelinePage - 1) * store.timelinePageSize"
      :rows="store.timelinePageSize"
      :totalRecords="totalMessages"
      :rowsPerPageOptions="[25, 50, 100]"
      @page="onPageChange"
      class="mt-4"
    />
  </div>
</template>
