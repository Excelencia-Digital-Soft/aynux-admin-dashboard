<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <Card>
      <CardContent class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ currentAnalytics?.total || 0 }}</div>
          <div class="text-sm text-muted-foreground">Total {{ isTask ? 'Tasks' : 'Templates' }}</div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ currentAnalytics?.active || 0 }}</div>
          <div class="text-sm text-muted-foreground">Activos</div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="!isTask">
      <CardContent class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ lockedCount }}</div>
          <div class="text-sm text-muted-foreground">Bloqueados</div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="isTask">
      <CardContent class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ criticalTaskCount }}</div>
          <div class="text-sm text-muted-foreground">Criticos</div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ currentDomainsCount }}</div>
          <div class="text-sm text-muted-foreground">Dominios</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import { Card, CardContent } from '@/components/ui/card'
import type { YamlTask } from '@/types/yaml.types'

const yamlStore = useYamlStore()
const {
  templateType,
  analytics,
  taskAnalytics,
  formatterAnalytics,
  tasks,
  prompts,
  isPromptLocked,
  domains,
  taskDomains,
  formatterDomains
} = storeToRefs(yamlStore)

const isTask = computed(() => templateType.value === 'task')
const isFormatter = computed(() => templateType.value === 'formatter')

const currentAnalytics = computed(() => {
  if (isFormatter.value) {
    return {
      total: formatterAnalytics.value?.total_formatters || 0,
      active: formatterAnalytics.value?.active_formatters || 0
    }
  }
  if (isTask.value) {
    return {
      total: taskAnalytics.value?.total_tasks || 0,
      active: taskAnalytics.value?.active_tasks || 0
    }
  }
  return {
    total: analytics.value?.total_prompts || 0,
    active: analytics.value?.active_prompts || 0
  }
})

const criticalTaskCount = computed(() =>
  (tasks.value || []).filter((t: YamlTask) => t.metadata?.is_critical).length
)

const lockedCount = computed(() =>
  (prompts.value || []).filter(p => isPromptLocked.value(p.key)).length
)

const currentDomainsCount = computed(() => {
  if (isFormatter.value) return formatterDomains.value.length
  if (isTask.value) return taskDomains.value.length
  return domains.value.length
})
</script>
