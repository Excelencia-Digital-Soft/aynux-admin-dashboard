<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useWorkflowExecutionHistory } from '@/composables/useWorkflowExecutionHistory'
import WorkflowExecutionDetail from './WorkflowExecutionDetail.vue'

const props = defineProps<{
  institutionConfigId?: string
}>()

const history = useWorkflowExecutionHistory()

onMounted(() => {
  if (props.institutionConfigId) {
    history.setFilters({ institution_config_id: props.institutionConfigId })
  }
  history.loadLogs()
  history.loadStats()
})

watch(() => props.institutionConfigId, (id) => {
  if (id) {
    history.setFilters({ institution_config_id: id })
    history.loadLogs()
    history.loadStats()
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function handleStatusFilter(value: string) {
  const newFilters = { ...history.filters.value }
  if (value === 'all') {
    delete newFilters.is_error
  } else {
    newFilters.is_error = value === 'error'
  }
  history.setFilters(newFilters)
  history.loadLogs()
}
</script>

<template>
  <div class="executions-tab">
    <!-- Stats Row -->
    <div v-if="history.stats.value" class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ history.stats.value.total_executions }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-red-400">{{ history.stats.value.error_count }}</span>
        <span class="stat-label">Errores</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ (history.stats.value.error_rate * 100).toFixed(1) }}%</span>
        <span class="stat-label">Tasa error</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ formatDuration(history.stats.value.avg_duration_ms) }}</span>
        <span class="stat-label">Promedio</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ formatDuration(history.stats.value.p95_duration_ms) }}</span>
        <span class="stat-label">P95</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <Select @update:model-value="handleStatusFilter">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="success">Exitosos</SelectItem>
          <SelectItem value="error">Errores</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" @click="history.loadLogs(); history.loadStats()">
        <i class="pi pi-refresh mr-2" />
        Actualizar
      </Button>
    </div>

    <!-- Table -->
    <div class="executions-table-wrapper">
      <div v-if="history.isLoading.value" class="loading-state">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>Cargando ejecuciones...</span>
      </div>

      <div v-else-if="history.logs.value.length === 0" class="empty-state">
        <i class="pi pi-inbox text-3xl opacity-40" />
        <span>No hay ejecuciones registradas</span>
      </div>

      <table v-else class="executions-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Dominio</th>
            <th>Entrada</th>
            <th>Estado</th>
            <th>Duracion</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in history.logs.value"
            :key="log.id"
            class="log-row"
            @click="history.loadLogDetail(log.id)"
          >
            <td class="text-muted-foreground">{{ formatDate(log.created_at) }}</td>
            <td>
              <Badge variant="outline">{{ log.domain_key }}</Badge>
            </td>
            <td class="input-cell">{{ log.input_message?.substring(0, 50) || '-' }}</td>
            <td>
              <Badge :variant="log.is_error ? 'destructive' : 'default'" class="text-xs">
                {{ log.is_error ? 'Error' : 'OK' }}
              </Badge>
            </td>
            <td class="text-muted-foreground">{{ formatDuration(log.execution_ms) }}</td>
            <td>
              <Button variant="ghost" size="icon" class="h-7 w-7">
                <i class="pi pi-chevron-right text-xs" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="history.totalPages.value > 1" class="pagination-bar">
      <Button variant="outline" size="sm" :disabled="history.page.value <= 1" @click="history.prevPage()">
        <i class="pi pi-chevron-left" />
      </Button>
      <span class="pagination-info">
        Pagina {{ history.page.value }} de {{ history.totalPages.value }}
        ({{ history.total.value }} resultados)
      </span>
      <Button variant="outline" size="sm" :disabled="history.page.value >= history.totalPages.value" @click="history.nextPage()">
        <i class="pi pi-chevron-right" />
      </Button>
    </div>

    <!-- Detail Sheet -->
    <WorkflowExecutionDetail
      :log="history.selectedLog.value"
      :is-loading="history.isLoadingDetail.value"
      @close="history.closeDetail()"
    />
  </div>
</template>

<style scoped>
.executions-tab {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.stats-row {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.executions-table-wrapper {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.executions-table {
  width: 100%;
  border-collapse: collapse;
}

.executions-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: rgba(12, 29, 61, 0.95);
}

.log-row {
  cursor: pointer;
  transition: background 0.15s;
}

.log-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.log-row td {
  padding: 10px 12px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.input-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.pagination-info {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>
