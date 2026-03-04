<script setup lang="ts">
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'

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

const gridClass = `grid grid-cols-1 md:grid-cols-${props.columns} gap-4`
</script>

<template>
  <div :class="gridClass">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <Card v-for="i in columns" :key="i">
        <CardContent class="p-4">
          <div class="text-center">
            <div class="h-10 w-24 mx-auto mb-2 rounded bg-muted animate-pulse" />
            <div class="h-4 w-16 mx-auto rounded bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Metrics cards -->
    <template v-else>
      <Card v-for="metric in metrics" :key="metric.label">
        <CardContent class="p-4">
          <div class="text-center">
            <div v-if="metric.icon" class="mb-2">
              <i :class="[metric.icon, getColorClass(metric.color)]" class="text-xl" />
            </div>
            <div class="text-3xl font-bold" :class="getColorClass(metric.color)">
              {{ metric.value }}
            </div>
            <div class="text-sm text-muted-foreground mt-1">{{ metric.label }}</div>
            <div v-if="metric.trend" class="flex items-center justify-center gap-1 mt-2 text-xs">
              <component
                :is="metric.trend.direction === 'up' ? TrendingUp : metric.trend.direction === 'down' ? TrendingDown : Minus"
                class="h-3 w-3"
                :class="getTrendClass(metric.trend.direction)"
              />
              <span :class="getTrendClass(metric.trend.direction)">
                {{ metric.trend.value > 0 ? '+' : '' }}{{ metric.trend.value }}%
              </span>
              <span class="text-muted-foreground">{{ metric.trend.label }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
