<script setup lang="ts">
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'

interface MetricCard {
  label: string
  value: string | number
  icon?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
}

interface Props {
  metrics: MetricCard[]
  loading?: boolean
  columns?: 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: 4
})

function getColorClass(color: string = 'blue'): string {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  }
  return colorMap[color] || colorMap.blue
}

function getTrendClass(direction: string): string {
  if (direction === 'up') return 'text-green-600'
  if (direction === 'down') return 'text-red-600'
  return 'text-gray-500'
}

function getTrendIcon(direction: string): string {
  if (direction === 'up') return 'pi pi-arrow-up'
  if (direction === 'down') return 'pi pi-arrow-down'
  return 'pi pi-minus'
}

const gridClass = `grid grid-cols-1 md:grid-cols-${props.columns} gap-4`
</script>

<template>
  <div :class="gridClass">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <Card v-for="i in columns" :key="i">
        <template #content>
          <div class="text-center">
            <Skeleton height="2.5rem" class="mb-2" />
            <Skeleton height="1rem" width="60%" class="mx-auto" />
          </div>
        </template>
      </Card>
    </template>

    <!-- Metrics cards -->
    <template v-else>
      <Card v-for="metric in metrics" :key="metric.label">
        <template #content>
          <div class="text-center">
            <div v-if="metric.icon" class="mb-2">
              <i :class="[metric.icon, getColorClass(metric.color)]" class="text-xl" />
            </div>
            <div class="text-3xl font-bold" :class="getColorClass(metric.color)">
              {{ metric.value }}
            </div>
            <div class="text-sm text-gray-500 mt-1">{{ metric.label }}</div>
            <div v-if="metric.trend" class="flex items-center justify-center gap-1 mt-2 text-xs">
              <i :class="[getTrendIcon(metric.trend.direction), getTrendClass(metric.trend.direction)]" />
              <span :class="getTrendClass(metric.trend.direction)">
                {{ metric.trend.value > 0 ? '+' : '' }}{{ metric.trend.value }}%
              </span>
              <span class="text-gray-400">{{ metric.trend.label }}</span>
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<style scoped>
:deep(.p-card-content) {
  padding: 0.75rem;
}
</style>
