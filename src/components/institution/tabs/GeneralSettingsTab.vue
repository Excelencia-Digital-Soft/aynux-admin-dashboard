<script setup lang="ts">
/**
 * GeneralSettingsTab - General institution information.
 */

import { onMounted } from 'vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { INSTITUTION_TYPES } from '@/types/tenantInstitutionConfig.types'
import { useDomains } from '@/composables/useDomains'

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
const domainKey = defineModel<string | null>('domainKey', { required: true })
const enabled = defineModel<boolean>('enabled', { required: true })
const description = defineModel<string>('description', { required: true })
const institutionId = defineModel<string>('institutionId', { required: true })
const campaignId = defineModel<string>('campaignId', { required: true })
const hcwebInstitutionId = defineModel<string>('hcwebInstitutionId', { required: true })

// ============================================================
// Domains
// ============================================================

const { fetchDomains, getDomainOptions } = useDomains()

onMounted(() => {
  fetchDomains()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Institution Key -->
    <div>
      <label for="institution_key" class="block text-sm font-medium text-foreground mb-1">
        Clave de Institucion *
      </label>
      <Input
        id="institution_key"
        v-model="institutionKey"
        :disabled="isEditing"
        placeholder="ej: patologia_digestiva"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Identificador unico. Solo minusculas, numeros y guiones bajos.
      </p>
      <Alert v-if="isEditing" class="mt-2">
        <AlertDescription>
          La clave no puede ser modificada despues de la creacion.
        </AlertDescription>
      </Alert>
    </div>

    <!-- Institution Name -->
    <div>
      <label for="institution_name" class="block text-sm font-medium text-foreground mb-1">
        Nombre de Institucion *
      </label>
      <Input
        id="institution_name"
        v-model="institutionName"
        placeholder="ej: Clinica Patologia Digestiva"
      />
    </div>

    <!-- Institution Type -->
    <div>
      <label for="institution_type" class="block text-sm font-medium text-foreground mb-1">
        Tipo de Institucion
      </label>
      <Select v-model="institutionType">
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in INSTITUTION_TYPES" :key="t.value" :value="t.value">
            {{ t.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Domain Key -->
    <div>
      <label for="domain_key" class="block text-sm font-medium text-foreground mb-1">
        Dominio
      </label>
      <Select :model-value="domainKey ?? '_none'" @update:model-value="domainKey = $event === '_none' ? null : $event">
        <SelectTrigger>
          <SelectValue placeholder="Sin dominio especifico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">Sin dominio especifico</SelectItem>
          <SelectItem v-for="opt in getDomainOptions(false)" :key="opt.value ?? '_none'" :value="opt.value ?? '_none'">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p class="text-xs text-muted-foreground mt-1">
        Dominio asociado (ej: turnos_medicos, pharmacy). Opcional.
      </p>
    </div>

    <!-- External Institution ID -->
    <div>
      <label for="institution_id" class="block text-sm font-medium text-foreground mb-1">
        ID Externo de Institucion
      </label>
      <Input
        id="institution_id"
        v-model="institutionId"
        placeholder="ej: 123 (ID numerico del sistema externo)"
      />
      <p class="text-xs text-muted-foreground mt-1">
        ID numerico del sistema externo (HCWeb IdInstitucion). Opcional.
      </p>
    </div>

    <!-- Integration IDs Separator -->
    <div class="border-t pt-4 mt-4">
      <h4 class="text-sm font-semibold text-muted-foreground mb-3">IDs de Integracion</h4>

      <!-- Campaign ID -->
      <div class="mb-4">
        <label for="campaign_id" class="block text-sm font-medium text-foreground mb-1">
          Campaign ID
        </label>
        <Input
          id="campaign_id"
          v-model="campaignId"
          placeholder="ej: camp_12345"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Identificador de campana para integraciones externas. Opcional.
        </p>
      </div>

      <!-- HCWeb Institution ID -->
      <div>
        <label for="hcweb_institution_id" class="block text-sm font-medium text-foreground mb-1">
          HCWeb Institution ID
        </label>
        <Input
          id="hcweb_institution_id"
          v-model="hcwebInstitutionId"
          placeholder="ej: 456"
        />
        <p class="text-xs text-muted-foreground mt-1">
          ID de institucion en el sistema HCWeb. Opcional.
        </p>
      </div>
    </div>

    <!-- Enabled -->
    <div>
      <label class="block text-sm font-medium text-foreground mb-1">Estado</label>
      <div class="flex items-center gap-3">
        <Switch v-model:checked="enabled" />
        <span :class="enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
          {{ enabled ? 'Habilitado' : 'Deshabilitado' }}
        </span>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-foreground mb-1">
        Descripcion
      </label>
      <Textarea
        id="description"
        v-model="description"
        :rows="3"
        placeholder="Notas o descripcion adicional..."
      />
    </div>
  </div>
</template>
