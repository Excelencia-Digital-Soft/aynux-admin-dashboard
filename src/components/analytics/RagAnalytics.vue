<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import { analyticsApi } from '@/api/analytics.api'
import type { RagMetrics } from '@/types/document.types'
import { RefreshCw, BarChart3, PieChart, TrendingUp, Clock } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
)

interface Props {
  refreshInterval?: number // in seconds, 0 = no auto refresh
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 0
})

const isLoading = ref(false)
const error = ref<string | null>(null)
const metrics = ref<RagMetrics | null>(null)
const selectedDays = ref('30')
const latencyTimeSeries = ref<Array<{ timestamp: string; value: number }>>([])

const daysOptions = [
  { label: 'Ultimos 7 dias', value: '7' },
  { label: 'Ultimos 30 dias', value: '30' },
  { label: 'Ultimos 90 dias', value: '90' }
]

// Chart data computations
const queriesByDayData = computed(() => {
  if (!metrics.value?.queries_by_day) return null

  const labels = Object.keys(metrics.value.queries_by_day).sort()
  const data = labels.map(label => metrics.value!.queries_by_day[label])

  return {
    labels,
    datasets: [
      {
        label: 'Consultas por dia',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        data
      }
    ]
  }
})

const documentTypesData = computed(() => {
  if (!metrics.value?.top_document_types) return null

  const labels = metrics.value.top_document_types.map(item => item.type)
  const data = metrics.value.top_document_types.map(item => item.count)

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)'
  ]

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0
      }
    ]
  }
})

const latencyDistributionData = computed(() => {
  if (!metrics.value?.latency_distribution) return null

  const labels = metrics.value.latency_distribution.map(item => item.range)
  const data = metrics.value.latency_distribution.map(item => item.count)

  return {
    labels,
    datasets: [
      {
        label: 'Distribucion de latencia',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        data
      }
    ]
  }
})

const latencyTimeSeriesData = computed(() => {
  if (latencyTimeSeries.value.length === 0) return null

  const labels = latencyTimeSeries.value.map(item =>
    new Date(item.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  )
  const data = latencyTimeSeries.value.map(item => item.value)

  return {
    labels,
    datasets: [
      {
        label: 'Latencia promedio (ms)',
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
        data
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
}

async function fetchMetrics() {
  isLoading.value = true
  error.value = null

  try {
    const [metricsData, timeSeriesData] = await Promise.all([
      analyticsApi.getRagMetrics({ days: Number(selectedDays.value) }),
      analyticsApi.getPerformanceTimeSeries({
        metric: 'latency',
        days: Number(selectedDays.value),
        granularity: 'day'
      })
    ])

    metrics.value = metricsData
    latencyTimeSeries.value = timeSeriesData
  } catch (err) {
    error.value = 'Error al cargar metricas'
    console.error('Error fetching RAG metrics:', err)
  } finally {
    isLoading.value = false
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(Math.round(value))
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

// Auto-refresh
let refreshTimer: ReturnType<typeof setInterval> | null = null

function setupAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)

  if (props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      fetchMetrics()
    }, props.refreshInterval * 1000)
  }
}

watch(selectedDays, () => {
  fetchMetrics()
})

onMounted(() => {
  fetchMetrics()
  setupAutoRefresh()
})

const selectedDaysLabel = computed(() => {
  return daysOptions.find(o => o.value === selectedDays.value)?.label ?? ''
})
</script>

<template>
  <div class="rag-analytics">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <Select v-model="selectedDays">
          <SelectTrigger class="w-48">
            <SelectValue :placeholder="selectedDaysLabel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in daysOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          @click="fetchMetrics"
          :disabled="isLoading"
          title="Actualizar"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !metrics" class="flex justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- Error state -->
    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Metrics content -->
    <template v-if="metrics">
      <!-- Summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">
                {{ formatNumber(metrics.total_queries) }}
              </div>
              <div class="text-sm text-muted-foreground mt-1">Total consultas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600">
                {{ formatNumber(metrics.avg_latency_ms) }}ms
              </div>
              <div class="text-sm text-muted-foreground mt-1">Latencia promedio</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-amber-600">
                {{ formatNumber(metrics.avg_token_count) }}
              </div>
              <div class="text-sm text-muted-foreground mt-1">Tokens promedio</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600">
                {{ formatPercentage(metrics.positive_feedback_rate) }}
              </div>
              <div class="text-sm text-muted-foreground mt-1">Feedback positivo</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Charts row 1 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-semibold flex items-center gap-2">
              <BarChart3 class="h-4 w-4 text-blue-500" />
              <span>Consultas por Dia</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="h-64">
              <Bar
                v-if="queriesByDayData"
                :data="queriesByDayData"
                :options="chartOptions"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-semibold flex items-center gap-2">
              <PieChart class="h-4 w-4 text-green-500" />
              <span>Tipos de Documentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="h-64">
              <Doughnut
                v-if="documentTypesData"
                :data="documentTypesData"
                :options="doughnutOptions"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Charts row 2 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-semibold flex items-center gap-2">
              <TrendingUp class="h-4 w-4 text-amber-500" />
              <span>Tendencia de Latencia</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="h-64">
              <Line
                v-if="latencyTimeSeriesData"
                :data="latencyTimeSeriesData"
                :options="chartOptions"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-semibold flex items-center gap-2">
              <Clock class="h-4 w-4 text-purple-500" />
              <span>Distribucion de Latencia</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="h-64">
              <Bar
                v-if="latencyDistributionData"
                :data="latencyDistributionData"
                :options="chartOptions"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
