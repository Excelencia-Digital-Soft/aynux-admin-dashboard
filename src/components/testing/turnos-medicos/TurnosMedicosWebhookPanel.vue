<script setup lang="ts">
import { computed } from 'vue'
import type { MedicalWebhookConfig } from '@/types/turnosMedicos.types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

const props = defineProps<{
  config: MedicalWebhookConfig
  hasSession: boolean
  defaultPhone?: string
}>()

const emit = defineEmits<{
  update: [config: Partial<MedicalWebhookConfig>]
}>()

const DEFAULT_PHONE = props.defaultPhone || '5491100001234'

const PHONE_PRESETS = [
  { label: 'Default', value: DEFAULT_PHONE },
  { label: 'Test 1', value: '5491100001111' },
  { label: 'Test 2', value: '5491100002222' }
]

const isDefaultPhone = computed(() => props.config.phoneNumber === DEFAULT_PHONE)

function handlePhoneChange(value: string | number) {
  emit('update', { phoneNumber: String(value) })
}

function handleNameChange(value: string | number) {
  emit('update', { userName: String(value) })
}

function handleResetPhone() {
  emit('update', { phoneNumber: DEFAULT_PHONE })
}

function selectPreset(value: string) {
  emit('update', { phoneNumber: value })
}
</script>

<template>
  <div class="p-4 space-y-4">
    <h3 class="text-base font-semibold text-foreground">Configuracion Webhook</h3>

    <Alert variant="info" class="bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/50">
      <AlertDescription class="text-sm">
        Este modo simula el flujo de WhatsApp usando
        <code class="bg-blue-100/80 dark:bg-blue-800/40 px-1 rounded text-xs">TurnosMedicosGraph</code>.
      </AlertDescription>
    </Alert>

    <div class="space-y-4">
      <div>
        <label class="text-sm text-muted-foreground block mb-1.5">Telefono simulado</label>
        <div class="flex gap-2">
          <Input
            :model-value="config.phoneNumber"
            @update:model-value="handlePhoneChange"
            class="flex-1 bg-white/60 dark:bg-navy-900/40 backdrop-blur-sm border-white/20 dark:border-white/10"
            placeholder="5491100001234"
            :disabled="hasSession"
          />
          <Button
            variant="secondary"
            size="icon"
            class="shrink-0"
            @click="handleResetPhone"
            :disabled="hasSession || isDefaultPhone"
          >
            <i class="pi pi-refresh text-sm" />
          </Button>
        </div>

        <!-- Phone Presets -->
        <div class="flex flex-wrap gap-1.5 mt-2">
          <Badge
            v-for="preset in PHONE_PRESETS"
            :key="preset.value"
            :variant="config.phoneNumber === preset.value ? 'default' : 'secondary'"
            :class="`cursor-pointer text-xs transition-all duration-200 hover:shadow-sm ${hasSession ? 'opacity-50 pointer-events-none' : ''}`"
            @click="!hasSession && selectPreset(preset.value)"
          >
            {{ preset.label }}
          </Badge>
          <Badge
            v-if="!PHONE_PRESETS.some(p => p.value === config.phoneNumber)"
            variant="info"
            class="text-xs"
          >
            Custom
          </Badge>
        </div>

        <small class="text-muted-foreground text-xs block mt-1.5">
          Selecciona un preset o ingresa un numero personalizado
        </small>
      </div>

      <div>
        <label class="text-sm text-muted-foreground block mb-1.5">Nombre paciente</label>
        <Input
          :model-value="config.userName"
          @update:model-value="handleNameChange"
          class="bg-white/60 dark:bg-navy-900/40 backdrop-blur-sm border-white/20 dark:border-white/10"
          placeholder="Test Patient"
          :disabled="hasSession"
        />
      </div>

      <div>
        <label class="text-sm text-muted-foreground block mb-1.5">DID (WhatsApp ID)</label>
        <code class="text-xs break-all bg-white/40 dark:bg-navy-900/40 backdrop-blur-sm px-2 py-1.5 rounded-lg block border border-white/10 text-foreground">
          {{ config.did || 'Auto (desde institucion)' }}
        </code>
      </div>

      <div>
        <label class="text-sm text-muted-foreground block mb-1.5">Dominio</label>
        <div class="flex items-center gap-2">
          <Badge variant="info">Turnos Medicos</Badge>
          <span class="text-xs text-muted-foreground">(TurnosMedicosGraph)</span>
        </div>
      </div>

      <!-- Info adicional -->
      <Alert class="bg-white/40 dark:bg-navy-900/30 backdrop-blur-sm border-white/20 dark:border-white/10">
        <AlertDescription class="text-xs">
          <strong class="text-foreground">Flujo de procesamiento:</strong>
          <ul class="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
            <li>Usa <code class="text-xs">TurnosMedicosGraph</code> directamente</li>
            <li>Agente: <code class="text-xs">turnos_medicos_agent</code></li>
            <li>DID proviene de la institucion seleccionada</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  </div>
</template>
