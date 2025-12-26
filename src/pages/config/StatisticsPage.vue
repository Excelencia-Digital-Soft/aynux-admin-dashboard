<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import { useKnowledge } from '@/composables/useKnowledge'
import { getTypeLabel } from '@/utils/constants'
import type { KnowledgeStats } from '@/types/document.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const { getStats } = useKnowledge()

const stats = ref<KnowledgeStats | null>(null)
const isLoading = ref(false)

// Chart data
const documentsByTypeData = computed(() => {
  if (!stats.value?.documents_by_type) return null

  const entries = Object.entries(stats.value.documents_by_type)
  const labels = entries.map(([type]) => getTypeLabel(type))
  const data = entries.map(([, count]) => count)

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(14, 165, 233, 0.8)',
    'rgba(168, 162, 158, 0.8)'
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

const statusData = computed(() => {
  if (!stats.value) return null

  return {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        data: [stats.value.total_active, stats.value.total_inactive],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0
      }
    ]
  }
})

const embeddingData = computed(() => {
  if (!stats.value) return null

  return {
    labels: ['Con Embedding', 'Sin Embedding'],
    datasets: [
      {
        data: [stats.value.documents_with_embedding, stats.value.documents_without_embedding],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)'],
        borderWidth: 0
      }
    ]
  }
})

const typeDistributionData = computed(() => {
  if (!stats.value?.documents_by_type) return null

  const entries = Object.entries(stats.value.documents_by_type)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const labels = entries.map(([type]) => getTypeLabel(type))
  const data = entries.map(([, count]) => count)

  return {
    labels,
    datasets: [
      {
        label: 'Documentos',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        data
      }
    ]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: {
      display: false
    }
  }
}

const activePercentage = computed(() => {
  if (!stats.value || stats.value.total_documents === 0) return 0
  return Math.round((stats.value.total_active / stats.value.total_documents) * 100)
})

const embeddingPercentage = computed(() => {
  if (!stats.value || stats.value.total_documents === 0) return 0
  return Math.round((stats.value.documents_with_embedding / stats.value.total_documents) * 100)
})

async function loadStats() {
  isLoading.value = true
  try {
    const data = await getStats()
    if (data) {
      stats.value = data
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="statistics-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Estadisticas</h1>
        <p class="text-gray-500 mt-1">
          Metricas y distribucion de la base de conocimiento
        </p>
      </div>
      <Button
        icon="pi pi-refresh"
        severity="secondary"
        @click="loadStats"
        :loading="isLoading"
        v-tooltip="'Actualizar'"
      />
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !stats" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Stats content -->
    <template v-if="stats">
      <!-- Summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-database text-2xl text-blue-500 mb-2" />
              <div class="text-3xl font-bold text-gray-800">
                {{ stats.total_documents }}
              </div>
              <div class="text-sm text-gray-500">Total documentos</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-check-circle text-2xl text-green-500 mb-2" />
              <div class="text-3xl font-bold text-green-600">
                {{ stats.total_active }}
              </div>
              <div class="text-sm text-gray-500">Activos ({{ activePercentage }}%)</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-times-circle text-2xl text-red-500 mb-2" />
              <div class="text-3xl font-bold text-red-600">
                {{ stats.total_inactive }}
              </div>
              <div class="text-sm text-gray-500">Inactivos</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-sparkles text-2xl text-purple-500 mb-2" />
              <div class="text-3xl font-bold text-purple-600">
                {{ stats.documents_with_embedding }}
              </div>
              <div class="text-sm text-gray-500">Con embedding ({{ embeddingPercentage }}%)</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Type breakdown table -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-blue-500" />
            <span>Documentos por Tipo</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div
              v-for="(count, type) in stats.documents_by_type"
              :key="type"
              class="p-3 bg-gray-50 rounded-lg"
            >
              <div class="text-xl font-bold text-gray-800">{{ count }}</div>
              <div class="text-sm text-gray-500 truncate" :title="getTypeLabel(type as string)">
                {{ getTypeLabel(type as string) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-pie text-blue-500" />
              <span>Por Tipo</span>
            </div>
          </template>
          <template #content>
            <div class="h-64">
              <Doughnut
                v-if="documentsByTypeData"
                :data="documentsByTypeData"
                :options="doughnutOptions"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-pie text-green-500" />
              <span>Estado</span>
            </div>
          </template>
          <template #content>
            <div class="h-64">
              <Doughnut
                v-if="statusData"
                :data="statusData"
                :options="doughnutOptions"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-pie text-amber-500" />
              <span>Embeddings</span>
            </div>
          </template>
          <template #content>
            <div class="h-64">
              <Doughnut
                v-if="embeddingData"
                :data="embeddingData"
                :options="doughnutOptions"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Type distribution bar chart -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-purple-500" />
            <span>Distribucion por Tipo (Top 8)</span>
          </div>
        </template>
        <template #content>
          <div class="h-80">
            <Bar
              v-if="typeDistributionData"
              :data="typeDistributionData"
              :options="barOptions"
            />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<style scoped>
.statistics-page :deep(.p-card-content) {
  padding: 0.75rem;
}
</style>
