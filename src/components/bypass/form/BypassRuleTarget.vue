<script setup lang="ts">
import Select from 'primevue/select'
import type { Pharmacy } from '@/api/pharmacy.api'
import type { Institution } from '@/api/medical.api'

const formData = defineModel<any>('formData', { required: true })

defineProps<{
  availableAgents: string[]
  loadingAgents: boolean
  domainOptions: any[]
  availablePharmacies: Pharmacy[]
  loadingPharmacies: boolean
  availableInstitutions: Institution[]
  loadingInstitutions: boolean
  showPharmacySelector: boolean
  showInstitutionSelector: boolean
}>()
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <i class="pi pi-directions-alt" />
      Destino
    </h3>

    <div class="grid grid-cols-2 gap-4">
      <!-- Target Agent -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"> Agente Destino * </label>
        <Select
          v-model="formData.target_agent"
          :options="availableAgents"
          placeholder="Seleccionar agente"
          class="w-full"
          :loading="loadingAgents"
        />
      </div>

      <!-- Target Domain -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"> Dominio </label>
        <Select
          v-model="formData.target_domain"
          :options="domainOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Opcional"
          class="w-full"
        />
      </div>
    </div>

    <!-- Pharmacy Selector -->
    <div v-if="showPharmacySelector" class="mt-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Farmacia *
      </label>
      <Select
        v-model="formData.pharmacy_id"
        :options="availablePharmacies"
        optionLabel="name"
        optionValue="id"
        placeholder="Seleccionar farmacia"
        class="w-full"
        :loading="loadingPharmacies"
      />
      <p class="text-xs text-gray-400 mt-1">
        Selecciona la farmacia a la que se vinculara esta regla.
      </p>
    </div>

    <!-- Institution Selector -->
    <div v-if="showInstitutionSelector" class="mt-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Institucion Medica *
      </label>
      <Select
        v-model="formData.institution_id"
        :options="availableInstitutions"
        optionLabel="name"
        optionValue="id"
        placeholder="Seleccionar institucion"
        class="w-full"
        :loading="loadingInstitutions"
      />
      <p class="text-xs text-gray-400 mt-1">
        Selecciona la institucion medica a la que se vinculara esta regla.
      </p>
    </div>
  </div>
</template>
