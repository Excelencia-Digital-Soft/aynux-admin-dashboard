<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  isLoading: boolean
  hasSession: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Pruebas Turnos Medicos</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Simulador de conversacion WhatsApp para el dominio medical_appointments
      </p>
    </div>
    <div class="flex gap-2">
      <Button
        icon="pi pi-refresh"
        label="Actualizar"
        severity="secondary"
        @click="emit('refresh')"
        :loading="isLoading"
      />
      <Button
        icon="pi pi-trash"
        label="Reiniciar"
        severity="warn"
        @click="emit('clear')"
        :disabled="!hasSession"
      />
    </div>
  </div>
</template>
