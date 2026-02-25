<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import type { PharmacyMessage } from '@/types/pharmacyConfig.types'
import {
  formatPhoneNumber,
  getSenderTypeLabel
} from '@/types/pharmacyConfig.types'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

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

const searchQuery = ref('')
const selectedSenderType = ref<string | undefined>(undefined)

const senderTypeOptions = [
  { label: 'Todos', value: 'all' },
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

function handleSearch() {
  setTimelineFilters({ search: searchQuery.value || undefined })
  fetchTimeline(props.pharmacyId)
}

function handleSenderTypeChange(value: string) {
  selectedSenderType.value = value === 'all' ? undefined : value
  setTimelineFilters({
    sender_type: value === 'all' ? undefined : (value as 'user' | 'assistant' | undefined)
  })
  fetchTimeline(props.pharmacyId)
}

function handleClearFilters() {
  searchQuery.value = ''
  selectedSenderType.value = undefined
  clearTimelineFilters()
  fetchTimeline(props.pharmacyId)
}

function getSenderBadgeVariant(type: string): 'default' | 'success' | 'secondary' | 'info' {
  const variants: Record<string, 'default' | 'success' | 'secondary' | 'info'> = {
    user: 'info',
    assistant: 'success',
    system: 'secondary'
  }
  return variants[type] || 'secondary'
}

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
    <div class="bg-white dark:bg-white/10 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/15 shadow-lg dark:shadow-2xl p-6">
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="flex-1 min-w-[200px]">
          <Input
            v-model="searchQuery"
            placeholder="Buscar en mensajes..."
            class="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20 text-foreground dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus-visible:ring-cyan-400/50"
            @keyup.enter="handleSearch"
          />
        </div>

        <Select :model-value="selectedSenderType || 'all'" @update:model-value="handleSenderTypeChange">
          <SelectTrigger class="w-40 bg-white dark:bg-white/10 border-gray-200 dark:border-white/20 text-foreground dark:text-white focus:ring-cyan-400/50">
            <SelectValue placeholder="Tipo de mensaje" />
          </SelectTrigger>
          <SelectContent class="bg-white dark:bg-slate-800/95 backdrop-blur-lg border-gray-200 dark:border-white/20 text-foreground dark:text-white">
            <SelectItem
              v-for="opt in senderTypeOptions"
              :key="opt.value"
              :value="opt.value"
              class="text-gray-700 dark:text-white/90 focus:bg-gray-100 dark:focus:bg-white/10 focus:text-gray-900 dark:focus:text-white"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          v-if="hasTimelineFilters"
          variant="ghost"
          size="sm"
          class="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          @click="handleClearFilters"
        >
          <i class="pi pi-filter-slash mr-2" />
          Limpiar
        </Button>
      </div>

      <div v-if="isLoading && messages.length === 0" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-20 bg-gray-50 dark:bg-white/5 rounded-lg animate-pulse" />
      </div>

      <Table v-else class="w-full">
        <TableHeader>
          <TableRow class="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Fecha</TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Cliente</TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Tipo</TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Mensaje</TableHead>
            <TableHead class="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="message in messages"
            :key="message.id"
            class="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            @click="emit('selectMessage', message)"
          >
            <TableCell>
              <span class="text-sm text-gray-700 dark:text-white/80">{{ formatDate(message.created_at) }}</span>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <i class="pi pi-whatsapp text-green-400 text-sm" />
                <span class="text-sm text-gray-700 dark:text-white/80">{{ formatPhoneNumber(message.user_phone) }}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="getSenderBadgeVariant(message.sender_type)">
                {{ getSenderTypeLabel(message.sender_type) }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="text-sm text-gray-600 dark:text-white/70 max-w-md">
                <p>{{ truncateContent(message.content) }}</p>
                <span v-if="message.agent_name" class="text-xs text-gray-400 dark:text-white/40 mt-1 block">
                  Agente: {{ message.agent_name }}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                @click.stop="emit('selectMessage', message)"
              >
                <i class="pi pi-external-link" />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="messages.length === 0">
            <TableCell colspan="5" class="text-center py-8">
              <div class="text-gray-400 dark:text-white/50">
                <i class="pi pi-inbox text-4xl mb-2" />
                <p>No se encontraron mensajes</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div v-if="totalMessages > 0" class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
        <span class="text-sm text-gray-400 dark:text-white/50">
          Mostrando {{ messages.length }} de {{ totalMessages }} mensajes
        </span>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            :disabled="store.timelinePage === 1"
            @click="setTimelinePage(store.timelinePage - 1); fetchTimeline(props.pharmacyId)"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            :disabled="messages.length < store.timelinePageSize"
            @click="setTimelinePage(store.timelinePage + 1); fetchTimeline(props.pharmacyId)"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
