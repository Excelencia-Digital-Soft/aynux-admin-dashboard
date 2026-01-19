<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'

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
  <Card class="mt-4">
    <template #title>
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-bolt" />
        <span>Acciones Rápidas</span>
      </div>
    </template>

    <template #content>
      <div class="grid grid-cols-2 gap-2">
        <Button
          v-for="action in quickActions"
          :key="action.label"
          :label="action.label"
          size="small"
          severity="secondary"
          outlined
          @click="emit('action', action.message)"
        />
      </div>
    </template>
  </Card>
</template>
