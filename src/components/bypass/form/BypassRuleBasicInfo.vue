<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import type { BypassRuleCreateRequest } from '@/types/bypassRules.types'

// Using generic type for the model to match the structure we expect
// Note: We use a loose type here or import the exact type. 
// Since the form data has extra fields not in CreateRequest (like ID sometimes in editing), 
// we'll define a compatible interface or use 'any' for the model to avoid strict type issues 
// with the large formData object, or better, define the specific shape.
const formData = defineModel<any>('formData', { required: true })
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <i class="pi pi-info-circle" />
      Informacion Basica
    </h3>

    <!-- Name -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Nombre de la Regla *
      </label>
      <InputText
        v-model="formData.rule_name"
        placeholder="Ej: VIP Argentina"
        class="w-full"
      />
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"> Descripcion </label>
      <Textarea
        v-model="formData.description"
        rows="2"
        placeholder="Descripcion opcional de la regla"
        class="w-full"
      />
    </div>

    <!-- Priority -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"> Prioridad * </label>
      <InputNumber v-model="formData.priority" :min="1" :max="1000" class="w-full" />
      <p class="text-xs text-gray-400 mt-1">
        Mayor numero = mayor prioridad. Las reglas se evaluan en orden descendente.
      </p>
    </div>
  </div>
</template>
