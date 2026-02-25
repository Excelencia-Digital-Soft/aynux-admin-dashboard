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
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Pruebas Farmacia</h1>
      <p class="text-muted-foreground mt-1">
        Simulador de conversación WhatsApp con streaming AI
      </p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" @click="emit('refresh')" :disabled="isLoading">
        <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
        <i v-else class="pi pi-refresh mr-2" />
        Actualizar
      </Button>
      <Button variant="destructive" @click="emit('clear')" :disabled="!hasSession">
        <i class="pi pi-trash mr-2" />
        Reiniciar
      </Button>
    </div>
  </div>
</template>
