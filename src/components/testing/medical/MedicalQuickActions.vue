<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'

const emit = defineEmits<{
  (e: 'action', message: string): void
}>()

const quickActions = [
  { label: 'Hola', message: 'Hola, buenos dias' },
  { label: 'Turno', message: 'Quiero sacar un turno' },
  { label: 'Consultar', message: 'Quiero consultar mis turnos' },
  { label: 'Cancelar', message: 'Quiero cancelar un turno' },
  { label: 'Especialista', message: 'Quiero turno con Dr. Martinez' },
  { label: 'Disponibilidad', message: 'Que horarios tienen disponibles?' }
]
</script>

<template>
  <Card class="mt-4">
    <template #title>
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-bolt" />
        <span>Acciones Rapidas</span>
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
