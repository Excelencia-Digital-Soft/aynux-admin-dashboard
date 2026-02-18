<script setup lang="ts">
/**
 * ConnectionSettingsTab - External service connection configuration.
 */

import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import type { ConnectionSettings } from '@/types/tenantInstitutionConfig.types'
import { CONNECTION_TYPES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<ConnectionSettings>({ required: true })
</script>

<template>
  <div class="connection-settings-tab space-y-4">
    <!-- Connection Type -->
    <div class="field">
      <label for="connection_type" class="block text-sm font-medium text-gray-700 mb-1">
        Tipo de Conexion
      </label>
      <Select
        id="connection_type"
        v-model="model.type"
        :options="CONNECTION_TYPES"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        placeholder="Seleccionar tipo"
        appendTo="self"
      />
    </div>

    <!-- Base URL -->
    <div class="field">
      <label for="base_url" class="block text-sm font-medium text-gray-700 mb-1">
        URL Base
      </label>
      <InputText
        id="base_url"
        v-model="model.base_url"
        class="w-full"
        placeholder="https://api.example.com/v1"
      />
      <small class="text-gray-500">
        URL del servicio externo (SOAP endpoint, REST API, etc.)
      </small>
    </div>

    <!-- Namespace SOAP (only for SOAP connections) -->
    <div v-if="model.type === 'soap'" class="field">
      <label for="namespace" class="block text-sm font-medium text-gray-700 mb-1">
        Namespace SOAP
      </label>
      <InputText
        id="namespace"
        v-model="model.namespace"
        class="w-full"
        placeholder="http://tempuri.org/"
      />
      <small class="text-gray-500">
        Namespace del servicio SOAP (se usa en el envelope XML y header SOAPAction)
      </small>
    </div>

    <!-- Timeout -->
    <div class="field">
      <label for="timeout_seconds" class="block text-sm font-medium text-gray-700 mb-1">
        Timeout (segundos)
      </label>
      <InputNumber
        id="timeout_seconds"
        v-model="model.timeout_seconds"
        :min="1"
        :max="300"
        class="w-full"
        showButtons
      />
      <small class="text-gray-500">
        Tiempo maximo de espera para las solicitudes (1-300 segundos)
      </small>
    </div>

    <!-- Retry Count -->
    <div class="field">
      <label for="retry_count" class="block text-sm font-medium text-gray-700 mb-1">
        Reintentos
      </label>
      <InputNumber
        id="retry_count"
        v-model="model.retry_count"
        :min="0"
        :max="10"
        class="w-full"
        showButtons
      />
      <small class="text-gray-500">
        Numero de reintentos en caso de fallo (0-10)
      </small>
    </div>

    <!-- Verify SSL -->
    <div class="field">
      <div class="flex items-center gap-3">
        <Checkbox
          id="verify_ssl"
          v-model="model.verify_ssl"
          :binary="true"
        />
        <label for="verify_ssl" class="text-sm font-medium text-gray-700 cursor-pointer">
          Verificar certificado SSL
        </label>
      </div>
      <small class="text-gray-500 block mt-1">
        Desactivar solo para entornos de desarrollo o servicios internos
      </small>
    </div>
  </div>
</template>
