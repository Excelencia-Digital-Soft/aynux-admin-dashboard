<script setup lang="ts">
/**
 * SchedulerSettingsTab - Background task scheduler configuration.
 */

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SchedulerSettings } from '@/types/tenantInstitutionConfig.types'
import { TIMEZONES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<SchedulerSettings>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Enabled Toggle -->
    <div>
      <label class="block text-sm font-medium text-foreground mb-1">
        Estado del Programador
      </label>
      <div class="flex items-center gap-3">
        <Switch v-model:checked="model.enabled" />
        <span :class="model.enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
          {{ model.enabled ? 'Habilitado' : 'Deshabilitado' }}
        </span>
      </div>
      <p class="text-xs text-muted-foreground mt-1">
        Habilitar tareas programadas como recordatorios de turnos
      </p>
    </div>

    <!-- Timezone -->
    <div>
      <label for="timezone" class="block text-sm font-medium text-foreground mb-1">
        Zona Horaria
      </label>
      <Select v-model="model.timezone" :disabled="!model.enabled">
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar zona horaria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Hours -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="morning_hour" class="block text-sm font-medium text-foreground mb-1">
          Hora de Manana
        </label>
        <Input
          id="morning_hour"
          v-model.number="model.morning_hour"
          type="number"
          min="0"
          max="23"
          :disabled="!model.enabled"
        />
        <p class="text-xs text-muted-foreground mt-1">Hora para tareas matutinas (0-23)</p>
      </div>

      <div>
        <label for="evening_hour" class="block text-sm font-medium text-foreground mb-1">
          Hora de Tarde
        </label>
        <Input
          id="evening_hour"
          v-model.number="model.evening_hour"
          type="number"
          min="0"
          max="23"
          :disabled="!model.enabled"
        />
        <p class="text-xs text-muted-foreground mt-1">Hora para tareas vespertinas (0-23)</p>
      </div>
    </div>

    <!-- Reminder Days -->
    <div>
      <label for="reminder_days_before" class="block text-sm font-medium text-foreground mb-1">
        Dias de Anticipacion para Recordatorios
      </label>
      <Input
        id="reminder_days_before"
        v-model.number="model.reminder_days_before"
        type="number"
        min="0"
        max="30"
        :disabled="!model.enabled"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Cuantos dias antes del turno enviar el recordatorio (0-30)
      </p>
    </div>
  </div>
</template>
