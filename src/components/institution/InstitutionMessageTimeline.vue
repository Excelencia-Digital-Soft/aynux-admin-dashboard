<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInstitutionConversation } from '@/composables/useInstitutionConversation'
import type { InstitutionMessage } from '@/types/institutionConversation.types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const props = defineProps<{
  orgId: string
  configId: string
}>()

const emit = defineEmits<{
  (e: 'selectMessage', message: InstitutionMessage): void
}>()

const {
  messages,
  totalMessages,
  isLoading,
  fetchTimeline,
  setTimelinePage,
  setTimelineFilters,
  store
} = useInstitutionConversation()

const searchQuery = ref('')
const selectedSenderType = ref('_all')

const ALL_TYPES_VALUE = '_all'

const senderTypeOptions = [
  { label: 'Todos', value: ALL_TYPES_VALUE },
  { label: 'Cliente', value: 'user' },
  { label: 'Agente', value: 'assistant' },
  { label: 'Sistema', value: 'system' }
]

function getSenderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    user: 'Cliente',
    assistant: 'Agente',
    system: 'Sistema'
  }
  return labels[type] || type
}

function getSenderTypeBadgeVariant(type: string) {
  switch (type) {
    case 'user':
      return 'info' as const
    case 'assistant':
      return 'success' as const
    default:
      return 'secondary' as const
  }
}

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

function handlePageChange(page: number) {
  setTimelinePage(page)
  fetchTimeline(props.orgId, props.configId)
}

function handleSearch() {
  setTimelineFilters({ search: searchQuery.value || undefined })
  fetchTimeline(props.orgId, props.configId)
}

function handleSenderTypeChange(value: string) {
  selectedSenderType.value = value
  const filterValue = value === ALL_TYPES_VALUE ? undefined : (value as 'user' | 'assistant')
  setTimelineFilters({ sender_type: filterValue })
  fetchTimeline(props.orgId, props.configId)
}

function handleClearFilters() {
  searchQuery.value = ''
  selectedSenderType.value = ALL_TYPES_VALUE
  store.clearTimelineFilters()
  fetchTimeline(props.orgId, props.configId)
}

watch(
  () => [props.orgId, props.configId] as const,
  ([orgId, configId]) => {
    if (orgId && configId) {
      fetchTimeline(orgId, configId)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-4 items-end">
      <div class="flex-1 min-w-[200px]">
        <Input
          v-model="searchQuery"
          placeholder="Buscar en mensajes..."
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="w-40">
        <Select :model-value="selectedSenderType" @update:model-value="handleSenderTypeChange">
          <SelectTrigger>
            <SelectValue placeholder="Tipo de mensaje" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in senderTypeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        v-if="store.hasTimelineFilters"
        variant="ghost"
        size="icon"
        @click="handleClearFilters"
      >
        <i class="pi pi-filter-slash" />
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && messages.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[80px] rounded-lg bg-muted animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="messages.length === 0" class="text-center py-8 text-muted-foreground">
      <i class="pi pi-inbox text-4xl mb-2" />
      <p>No se encontraron mensajes</p>
    </div>

    <!-- Table -->
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[180px]">Fecha</TableHead>
          <TableHead class="w-[150px]">Cliente</TableHead>
          <TableHead class="w-[100px]">Tipo</TableHead>
          <TableHead class="min-w-[300px]">Mensaje</TableHead>
          <TableHead class="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="message in messages" :key="message.id">
          <!-- Fecha -->
          <TableCell>
            <span class="text-sm text-foreground">{{ formatDate(message.created_at) }}</span>
          </TableCell>

          <!-- Cliente -->
          <TableCell>
            <div class="flex items-center gap-2">
              <i class="pi pi-whatsapp text-green-500 text-sm" />
              <span class="text-sm text-foreground">{{ formatPhoneNumber(message.user_phone) }}</span>
            </div>
          </TableCell>

          <!-- Tipo -->
          <TableCell>
            <Badge :variant="getSenderTypeBadgeVariant(message.sender_type)">
              {{ getSenderTypeLabel(message.sender_type) }}
            </Badge>
          </TableCell>

          <!-- Mensaje -->
          <TableCell>
            <div class="text-sm">
              <p class="text-foreground">{{ truncateContent(message.content) }}</p>
              <span v-if="message.agent_name" class="text-xs text-muted-foreground mt-1">
                Agente: {{ message.agent_name }}
              </span>
            </div>
          </TableCell>

          <!-- Action -->
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="emit('selectMessage', message)"
            >
              <i class="pi pi-external-link text-sm" />
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- Pagination -->
    <Pagination
      v-if="totalMessages > store.timelinePageSize"
      :totalRecords="totalMessages"
      :rows="store.timelinePageSize"
      :currentPage="store.timelinePage"
      @pageChange="handlePageChange"
      class="mt-4 justify-center"
    />
  </div>
</template>
