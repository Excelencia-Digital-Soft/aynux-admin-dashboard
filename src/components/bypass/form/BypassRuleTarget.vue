<script setup lang="ts">
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Pharmacy } from '@/api/pharmacy.api'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'

const formData = defineModel<any>('formData', { required: true })

defineProps<{
  availableAgents: string[]
  loadingAgents: boolean
  domainOptions: any[]
  availablePharmacies: Pharmacy[]
  loadingPharmacies: boolean
  availableInstitutions: TenantInstitutionConfig[]
  loadingInstitutions: boolean
  showPharmacySelector: boolean
  showInstitutionSelector: boolean
}>()
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <i class="pi pi-directions-alt" />
      Destino
    </h3>

    <div class="grid grid-cols-2 gap-4">
      <!-- Target Agent -->
      <div>
        <Label class="text-gray-700 dark:text-gray-300">Agente Destino *</Label>
        <Select v-model="formData.target_agent">
          <SelectTrigger class="w-full mt-1">
            <SelectValue placeholder="Seleccionar agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="agent in availableAgents" :key="agent" :value="agent">
              {{ agent }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Target Domain -->
      <div>
        <Label class="text-gray-700 dark:text-gray-300">Dominio</Label>
        <Select v-model="formData.target_domain">
          <SelectTrigger class="w-full mt-1">
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in domainOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Pharmacy Selector -->
    <div v-if="showPharmacySelector" class="mt-4">
      <Label class="text-gray-700 dark:text-gray-300">Farmacia *</Label>
      <Select v-model="formData.pharmacy_id">
        <SelectTrigger class="w-full mt-1">
          <SelectValue placeholder="Seleccionar farmacia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="pharmacy in availablePharmacies"
            :key="pharmacy.id"
            :value="pharmacy.id"
          >
            {{ pharmacy.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Selecciona la farmacia a la que se vinculara esta regla.
      </p>
    </div>

    <!-- Institution Selector -->
    <div v-if="showInstitutionSelector" class="mt-4">
      <Label class="text-gray-700 dark:text-gray-300">Institucion *</Label>
      <Select v-model="formData.institution_id">
        <SelectTrigger class="w-full mt-1">
          <SelectValue placeholder="Seleccionar institucion" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="inst in availableInstitutions"
            :key="inst.id"
            :value="inst.id"
          >
            {{ inst.institution_name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Selecciona la institucion a la que se vinculara esta regla.
      </p>
    </div>
  </div>
</template>
