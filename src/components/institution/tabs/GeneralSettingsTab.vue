<script setup lang="ts">
/**
 * GeneralSettingsTab - General institution information.
 */

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import { INSTITUTION_TYPES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Props & Model
// ============================================================

interface Props {
  isEditing?: boolean
}

defineProps<Props>()

const institutionKey = defineModel<string>('institutionKey', { required: true })
const institutionName = defineModel<string>('institutionName', { required: true })
const institutionType = defineModel<string>('institutionType', { required: true })
const enabled = defineModel<boolean>('enabled', { required: true })
const description = defineModel<string>('description', { required: true })
const institutionId = defineModel<string>('institutionId', { required: true })
const campaignId = defineModel<string>('campaignId', { required: true })
const hcwebInstitutionId = defineModel<string>('hcwebInstitutionId', { required: true })
</script>

<template>
  <div class="general-settings-tab space-y-4">
    <!-- Institution Key -->
    <div class="field">
      <label for="institution_key" class="block text-sm font-medium text-gray-700 mb-1">
        Clave de Institucion *
      </label>
      <InputText
        id="institution_key"
        v-model="institutionKey"
        class="w-full"
        :disabled="isEditing"
        placeholder="ej: patologia_digestiva"
      />
      <small class="text-gray-500">
        Identificador unico. Solo minusculas, numeros y guiones bajos.
      </small>
      <Message v-if="isEditing" severity="info" :closable="false" class="mt-2">
        La clave no puede ser modificada despues de la creacion.
      </Message>
    </div>

    <!-- Institution Name -->
    <div class="field">
      <label for="institution_name" class="block text-sm font-medium text-gray-700 mb-1">
        Nombre de Institucion *
      </label>
      <InputText
        id="institution_name"
        v-model="institutionName"
        class="w-full"
        placeholder="ej: Clinica Patologia Digestiva"
      />
    </div>

    <!-- Institution Type -->
    <div class="field">
      <label for="institution_type" class="block text-sm font-medium text-gray-700 mb-1">
        Tipo de Institucion
      </label>
      <Select
        id="institution_type"
        v-model="institutionType"
        :options="INSTITUTION_TYPES"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        placeholder="Seleccionar tipo"
        appendTo="self"
      />
    </div>

    <!-- External Institution ID (Optional - for HCWeb/SOAP integrations) -->
    <div class="field">
      <label for="institution_id" class="block text-sm font-medium text-gray-700 mb-1">
        ID Externo de Institucion
      </label>
      <InputText
        id="institution_id"
        v-model="institutionId"
        class="w-full"
        placeholder="ej: 123 (ID numerico del sistema externo)"
      />
      <small class="text-gray-500">
        ID numerico del sistema externo (HCWeb IdInstitucion). Opcional.
      </small>
    </div>

    <!-- Integration IDs Separator -->
    <div class="border-t pt-4 mt-4">
      <h4 class="text-sm font-semibold text-gray-600 mb-3">IDs de Integracion</h4>

      <!-- Campaign ID -->
      <div class="field mb-4">
        <label for="campaign_id" class="block text-sm font-medium text-gray-700 mb-1">
          Campaign ID
        </label>
        <InputText
          id="campaign_id"
          v-model="campaignId"
          class="w-full"
          placeholder="ej: camp_12345"
        />
        <small class="text-gray-500">
          Identificador de campana para integraciones externas. Opcional.
        </small>
      </div>

      <!-- HCWeb Institution ID -->
      <div class="field">
        <label for="hcweb_institution_id" class="block text-sm font-medium text-gray-700 mb-1">
          HCWeb Institution ID
        </label>
        <InputText
          id="hcweb_institution_id"
          v-model="hcwebInstitutionId"
          class="w-full"
          placeholder="ej: 456"
        />
        <small class="text-gray-500">
          ID de institucion en el sistema HCWeb. Opcional.
        </small>
      </div>
    </div>

    <!-- Enabled -->
    <div class="field">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Estado
      </label>
      <div class="flex items-center gap-3">
        <ToggleSwitch v-model="enabled" />
        <span :class="enabled ? 'text-green-600' : 'text-gray-500'">
          {{ enabled ? 'Habilitado' : 'Deshabilitado' }}
        </span>
      </div>
    </div>

    <!-- Description -->
    <div class="field">
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
        Descripcion
      </label>
      <Textarea
        id="description"
        v-model="description"
        class="w-full"
        rows="3"
        placeholder="Notas o descripcion adicional..."
      />
    </div>
  </div>
</template>
