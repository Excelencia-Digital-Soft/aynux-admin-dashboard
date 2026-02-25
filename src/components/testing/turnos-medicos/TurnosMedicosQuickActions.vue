<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  (e: 'action', message: string): void
}>()

const quickActions = [
  { label: 'Hola', message: 'Hola, buenos dias', icon: 'pi pi-hand-wave' },
  { label: 'Turno', message: 'Quiero sacar un turno', icon: 'pi pi-calendar-plus' },
  { label: 'Consultar', message: 'Quiero consultar mis turnos', icon: 'pi pi-search' },
  { label: 'Cancelar', message: 'Quiero cancelar un turno', icon: 'pi pi-times-circle' },
  { label: 'Especialista', message: 'Quiero turno con Dr. Martinez', icon: 'pi pi-user' },
  { label: 'Disponibilidad', message: 'Que horarios tienen disponibles?', icon: 'pi pi-clock' }
]
</script>

<template>
  <Card class="mt-4 bg-white/70 dark:bg-navy-800/50 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl rounded-2xl overflow-hidden">
    <CardHeader class="pb-3">
      <CardTitle class="flex items-center gap-2 text-sm">
        <i class="pi pi-bolt text-cyan-500" />
        <span>Acciones Rapidas</span>
      </CardTitle>
    </CardHeader>

    <CardContent class="pt-0">
      <div class="grid grid-cols-2 gap-2">
        <Button
          v-for="action in quickActions"
          :key="action.label"
          variant="outline"
          size="sm"
          class="bg-white/50 dark:bg-navy-900/30 backdrop-blur-sm border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-navy-800/50 hover:shadow-md hover:shadow-violet-500/5 transition-all duration-200 justify-start"
          @click="emit('action', action.message)"
        >
          <i :class="[action.icon, 'mr-2 text-violet-500']" />
          {{ action.label }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
