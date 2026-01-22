<script setup lang="ts">
import ToggleSwitch from 'primevue/toggleswitch'

const formData = defineModel<any>('formData', { required: true })
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <i class="pi pi-history" />
      Aislamiento de Historial
    </h3>

    <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <ToggleSwitch v-model="formData.isolated_history" />
      <div>
        <span class="text-sm font-medium text-gray-700">Historial Aislado</span>
        <p class="text-xs text-gray-500 mt-1">
          Cuando esta activo, este agente tendra un historial de conversacion separado
          de otros agentes. Util para separar contextos (ej: farmacia vs excelencia).
        </p>
      </div>
    </div>
  </div>
</template>
