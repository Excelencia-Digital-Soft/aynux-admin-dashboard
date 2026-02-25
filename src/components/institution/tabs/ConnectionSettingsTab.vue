<script setup lang="ts">
/**
 * ConnectionSettingsTab - External service connection configuration.
 */

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { ConnectionSettings } from '@/types/tenantInstitutionConfig.types'
import { CONNECTION_TYPES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<ConnectionSettings>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Connection Type -->
    <div>
      <label for="connection_type" class="block text-sm font-medium text-foreground mb-1">
        Tipo de Conexion
      </label>
      <Select v-model="model.type">
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in CONNECTION_TYPES" :key="t.value" :value="t.value">
            {{ t.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Base URL -->
    <div>
      <label for="base_url" class="block text-sm font-medium text-foreground mb-1">
        URL Base
      </label>
      <Input
        id="base_url"
        v-model="model.base_url"
        placeholder="https://api.example.com/v1"
      />
      <p class="text-xs text-muted-foreground mt-1">
        URL del servicio externo (SOAP endpoint, REST API, etc.)
      </p>
    </div>

    <!-- Namespace SOAP -->
    <div v-if="model.type === 'soap'">
      <label for="namespace" class="block text-sm font-medium text-foreground mb-1">
        Namespace SOAP
      </label>
      <Input
        id="namespace"
        v-model="model.namespace"
        placeholder="http://tempuri.org/"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Namespace del servicio SOAP (se usa en el envelope XML y header SOAPAction)
      </p>
    </div>

    <!-- Timeout -->
    <div>
      <label for="timeout_seconds" class="block text-sm font-medium text-foreground mb-1">
        Timeout (segundos)
      </label>
      <Input
        id="timeout_seconds"
        v-model.number="model.timeout_seconds"
        type="number"
        min="1"
        max="300"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Tiempo maximo de espera para las solicitudes (1-300 segundos)
      </p>
    </div>

    <!-- Retry Count -->
    <div>
      <label for="retry_count" class="block text-sm font-medium text-foreground mb-1">
        Reintentos
      </label>
      <Input
        id="retry_count"
        v-model.number="model.retry_count"
        type="number"
        min="0"
        max="10"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Numero de reintentos en caso de fallo (0-10)
      </p>
    </div>

    <!-- Verify SSL -->
    <div>
      <div class="flex items-center gap-3">
        <Checkbox
          id="verify_ssl"
          :checked="model.verify_ssl"
          @update:checked="model.verify_ssl = !!$event"
        />
        <label for="verify_ssl" class="text-sm font-medium text-foreground cursor-pointer">
          Verificar certificado SSL
        </label>
      </div>
      <p class="text-xs text-muted-foreground mt-1">
        Desactivar solo para entornos de desarrollo o servicios internos
      </p>
    </div>
  </div>
</template>
