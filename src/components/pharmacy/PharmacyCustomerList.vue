<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import type { PharmacyCustomer } from '@/types/pharmacyConfig.types'
import { formatPhoneNumber } from '@/types/pharmacyConfig.types'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

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
  selectedCustomers,
  summarizeProgress,
  fetchCustomers,
  setCustomerPage,
  setCustomerFilters,
  toggleCustomerSelection,
  selectAllCustomers,
  clearCustomerSelection,
  deleteSelectedConversations,
  summarizeSelectedConversations,
  cancelSummarize
} = usePharmacyConfig()

const searchQuery = ref('')
const showDeleteDialog = ref(false)

const allSelected = computed(() => {
  return customers.value.length > 0 && selectedCustomers.value.length === customers.value.length
})

const someSelected = computed(() => {
  return selectedCustomers.value.length > 0 && selectedCustomers.value.length < customers.value.length
})

const customersWithoutSummary = computed(() => {
  return selectedCustomers.value.filter(c => !c.rolling_summary)
})

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

function handleSearch() {
  setCustomerFilters({ search: searchQuery.value || undefined })
  fetchCustomers(props.pharmacyId)
}

function handleToggleAll() {
  if (allSelected.value) {
    clearCustomerSelection()
  } else {
    selectAllCustomers()
  }
}

function handleRowClick(customer: PharmacyCustomer) {
  emit('selectCustomer', customer)
}

async function confirmDelete() {
  const success = await deleteSelectedConversations(props.pharmacyId)
  if (success) {
    showDeleteDialog.value = false
  }
}

async function handleSummarize() {
  await summarizeSelectedConversations(props.pharmacyId)
}

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
    <div class="bg-white dark:bg-white/10 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/15 shadow-lg dark:shadow-2xl p-6">
      <div class="flex flex-wrap items-center gap-4 mb-6">
        <div class="flex-1 min-w-[200px]">
          <Input
            v-model="searchQuery"
            placeholder="Buscar por telefono..."
            class="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20 text-foreground dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus-visible:ring-cyan-400/50"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="selectedCustomers.length > 0"
            variant="destructive"
            size="sm"
            class="bg-red-500/80 hover:bg-red-500 text-white"
            @click="showDeleteDialog = true"
          >
            <i class="pi pi-trash mr-2" />
            Eliminar ({{ selectedCustomers.length }})
          </Button>

          <Button
            v-if="customersWithoutSummary.length > 0"
            variant="default"
            size="sm"
            class="bg-gradient-to-r from-primary-500 to-cyan-500 text-white hover:from-primary-400 hover:to-cyan-400 border-0"
            :disabled="summarizeProgress.isRunning"
            @click="handleSummarize"
          >
            <i class="pi pi-sparkles mr-2" />
            Generar resumenes ({{ customersWithoutSummary.length }})
          </Button>

          <Button
            v-if="summarizeProgress.isRunning"
            variant="outline"
            size="sm"
            class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            @click="cancelSummarize"
          >
            <i class="pi pi-times mr-2" />
            Cancelar
          </Button>
        </div>
      </div>

      <div
        v-if="summarizeProgress.isRunning"
        class="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-white/70">
            Generando resumen {{ summarizeProgress.current }}/{{ summarizeProgress.total }}
          </span>
          <span class="text-xs text-gray-400 dark:text-white/50 font-mono">
            {{ summarizeProgress.currentConversationId?.slice(0, 12) }}...
          </span>
        </div>
        <Progress
          :model-value="(summarizeProgress.current / summarizeProgress.total) * 100"
          class="h-2 bg-gray-100 dark:bg-white/10"
          indicator-class="bg-gradient-to-r from-primary-500 to-cyan-500"
        />
      </div>

      <div v-if="isLoading && customers.length === 0" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 bg-gray-50 dark:bg-white/5 rounded-lg animate-pulse" />
      </div>

      <Table v-else class="w-full">
        <TableHeader>
          <TableRow class="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
            <TableHead class="w-12">
              <Checkbox
                :checked="allSelected"
                :indeterminate="someSelected"
                class="border-gray-300 dark:border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                @update:checked="handleToggleAll"
              />
            </TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Cliente</TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Ultima Actividad</TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Mensajes</TableHead>
            <TableHead class="text-gray-600 dark:text-white/70 font-medium">Resumen</TableHead>
            <TableHead class="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="customer in customers"
            :key="customer.conversation_id"
            :class="`border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${selectedCustomers.some(c => c.conversation_id === customer.conversation_id) ? 'bg-cyan-500/10' : ''}`"
            @click="handleRowClick(customer)"
          >
            <TableCell @click.stop>
              <Checkbox
                :checked="selectedCustomers.some(c => c.conversation_id === customer.conversation_id)"
                class="border-gray-300 dark:border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                @update:checked="toggleCustomerSelection(customer)"
              />
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center">
                  <i class="pi pi-user text-gray-600 dark:text-white/70" />
                </div>
                <div>
                  <div class="font-medium text-foreground dark:text-white">{{ formatPhoneNumber(customer.user_phone) }}</div>
                  <div class="text-xs text-gray-400 dark:text-white/50">
                    {{ customer.total_messages }} mensajes
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-foreground dark:text-white">{{ formatRelativeTime(customer.last_activity) }}</span>
                <span class="text-xs text-gray-400 dark:text-white/40">{{ formatDate(customer.last_activity) }}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="info" class="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {{ customer.total_messages }}
              </Badge>
            </TableCell>
            <TableCell>
              <p class="text-sm text-gray-500 dark:text-white/60 italic max-w-xs">
                {{ truncateSummary(customer.rolling_summary) }}
              </p>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                @click.stop="handleRowClick(customer)"
              >
                <i class="pi pi-comments" />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="customers.length === 0">
            <TableCell colspan="6" class="text-center py-8">
              <div class="text-gray-400 dark:text-white/50">
                <i class="pi pi-users text-4xl mb-2" />
                <p>No se encontraron clientes</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div v-if="totalCustomers > 0" class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
        <span class="text-sm text-gray-400 dark:text-white/50">
          Mostrando {{ customers.length }} de {{ totalCustomers }} clientes
        </span>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            :disabled="store.customerPage === 1"
            @click="setCustomerPage(store.customerPage - 1); fetchCustomers(props.pharmacyId)"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            :disabled="customers.length < store.customerPageSize"
            @click="setCustomerPage(store.customerPage + 1); fetchCustomers(props.pharmacyId)"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent class="bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 text-foreground dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
          <AlertDialogDescription class="text-gray-600 dark:text-white/70">
            Estas a punto de eliminar {{ selectedCustomers.length }} conversaciones.
            Esta accion no se puede deshacer. Se eliminaran todos los mensajes asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-500 hover:bg-red-600 text-white"
            @click="confirmDelete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
