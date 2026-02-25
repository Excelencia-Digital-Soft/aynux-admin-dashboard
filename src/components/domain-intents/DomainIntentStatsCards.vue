<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <Card class="glass-card">
      <CardContent class="flex items-center gap-3 p-4">
        <i class="pi pi-list text-xl text-primary" />
        <div>
          <div class="text-2xl font-bold text-foreground">{{ totalCount }}</div>
          <div class="text-xs text-muted-foreground">Intents</div>
        </div>
      </CardContent>
    </Card>
    <Card class="glass-card">
      <CardContent class="flex items-center gap-3 p-4">
        <i class="pi pi-check-circle text-xl text-emerald-500" />
        <div>
          <div class="text-2xl font-bold text-foreground">{{ enabledCount }}</div>
          <div class="text-xs text-muted-foreground">Activos</div>
        </div>
      </CardContent>
    </Card>
    <Card class="glass-card">
      <CardContent class="flex items-center gap-3 p-4">
        <i class="pi pi-tags text-xl text-violet-500" />
        <div>
          <div class="text-2xl font-bold text-foreground">{{ totalPatterns }}</div>
          <div class="text-xs text-muted-foreground">Patrones</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'

defineProps<{
  totalCount: number
  enabledCount: number
  totalPatterns: number
}>()
</script>
