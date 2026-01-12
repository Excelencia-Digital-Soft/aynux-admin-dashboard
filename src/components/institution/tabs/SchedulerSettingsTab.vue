<script setup lang="ts">
/**
 * SchedulerSettingsTab - Background task scheduler configuration.
 */

import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import type { SchedulerSettings } from '@/types/tenantInstitutionConfig.types'
import { TIMEZONES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<SchedulerSettings>({ required: true })
</script>

<template>
  <div class="scheduler-settings-tab space-y-4">
    <!-- Enabled Toggle -->
    <div class="field">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Estado del Programador
      </label>
      <div class="flex items-center gap-3">
        <ToggleSwitch v-model="model.enabled" />
        <span :class="model.enabled ? 'text-green-600' : 'text-gray-500'">
          {{ model.enabled ? 'Habilitado' : 'Deshabilitado' }}
        </span>
      </div>
      <small class="text-gray-500">
        Habilitar tareas programadas como recordatorios de turnos
      </small>
    </div>

    <!-- Timezone -->
    <div class="field">
      <label for="timezone" class="block text-sm font-medium text-gray-700 mb-1">
        Zona Horaria
      </label>
      <Select
        id="timezone"
        v-model="model.timezone"
        :options="TIMEZONES"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        placeholder="Seleccionar zona horaria"
        :disabled="!model.enabled"
      />
    </div>

    <!-- Hours -->
    <div class="grid grid-cols-2 gap-4">
      <div class="field">
        <label for="morning_hour" class="block text-sm font-medium text-gray-700 mb-1">
          Hora de Manana
        </label>
        <InputNumber
          id="morning_hour"
          v-model="model.morning_hour"
          :min="0"
          :max="23"
          class="w-full"
          showButtons
          :disabled="!model.enabled"
        />
        <small class="text-gray-500">Hora para tareas matutinas (0-23)</small>
      </div>

      <div class="field">
        <label for="evening_hour" class="block text-sm font-medium text-gray-700 mb-1">
          Hora de Tarde
        </label>
        <InputNumber
          id="evening_hour"
          v-model="model.evening_hour"
          :min="0"
          :max="23"
          class="w-full"
          showButtons
          :disabled="!model.enabled"
        />
        <small class="text-gray-500">Hora para tareas vespertinas (0-23)</small>
      </div>
    </div>

    <!-- Reminder Days -->
    <div class="field">
      <label for="reminder_days_before" class="block text-sm font-medium text-gray-700 mb-1">
        Dias de Anticipacion para Recordatorios
      </label>
      <InputNumber
        id="reminder_days_before"
        v-model="model.reminder_days_before"
        :min="0"
        :max="30"
        class="w-full"
        showButtons
        :disabled="!model.enabled"
      />
      <small class="text-gray-500">
        Cuantos dias antes del turno enviar el recordatorio (0-30)
      </small>
    </div>
  </div>
</template>
