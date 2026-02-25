<script setup lang="ts">
import { Button } from '@/components/ui/button'

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
  <div class="mb-6 rounded-2xl bg-white/80 dark:bg-navy-800/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-500">
            Pruebas Turnos Medicos
          </span>
        </h1>
        <p class="text-muted-foreground mt-1">
          Simulador de conversacion WhatsApp para el dominio turnos_medicos
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="secondary"
          :loading="isLoading"
          @click="emit('refresh')"
        >
          <i class="pi pi-refresh mr-2" />
          Actualizar
        </Button>
        <Button
          variant="outline"
          class="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
          :disabled="!hasSession"
          @click="emit('clear')"
        >
          <i class="pi pi-trash mr-2" />
          Reiniciar
        </Button>
      </div>
    </div>
    <!-- Gradient accent line -->
    <div class="mt-4 h-0.5 rounded-full bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600 opacity-60" />
  </div>
</template>
