<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  (e: 'action', message: string): void
}>()

const quickActions = [
  { label: 'Hola', message: 'Hola, buenos dias' },
  { label: 'Productos', message: 'Que productos tienen?' },
  { label: 'Precio', message: 'Cuanto cuesta el paracetamol?' },
  { label: 'Pedido', message: 'Quiero hacer un pedido' },
  { label: 'Ubicación', message: 'Donde estan ubicados?' },
  { label: 'Horario', message: 'Cual es su horario de atencion?' }
]
</script>

<template>
  <Card class="mt-4 glass-card">
    <CardContent class="pt-6">
      <div class="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <i class="pi pi-bolt" />
        <span>Acciones Rápidas</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <Button
          v-for="action in quickActions"
          :key="action.label"
          variant="outline"
          size="sm"
          @click="emit('action', action.message)"
        >
          {{ action.label }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
