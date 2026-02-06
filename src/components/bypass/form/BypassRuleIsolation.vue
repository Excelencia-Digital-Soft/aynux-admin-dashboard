<script setup lang="ts">
import Checkbox from 'primevue/checkbox'

const formData = defineModel<any>('formData', { required: true })
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <i class="pi pi-history" />
      Aislamiento de Historial
    </h3>

    <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
      <Checkbox v-model="formData.isolated_history" :binary="true" />
      <div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Historial Aislado</span>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Cuando esta activo, este agente tendra un historial de conversacion separado
          de otros agentes. Util para separar contextos (ej: farmacia vs excelencia).
        </p>
      </div>
    </div>
  </div>
</template>
