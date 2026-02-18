<script setup lang="ts">
import { computed } from 'vue'
import type { MedicalWebhookConfig } from '@/api/medical.api'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

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

function handlePhoneChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { phoneNumber: target.value })
}

function handleNameChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { userName: target.value })
}

function handleResetPhone() {
  emit('update', { phoneNumber: DEFAULT_PHONE })
}

function selectPreset(value: string) {
  emit('update', { phoneNumber: value })
}
</script>

<template>
  <div class="webhook-panel p-4">
    <h3 class="text-lg font-semibold mb-4">Configuracion Webhook</h3>

    <Message severity="info" :closable="false" class="mb-4">
      <template #default>
        <div class="text-sm">
          Este modo simula el flujo de WhatsApp usando
          <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">MedicalAppointmentsGraph</code>.
        </div>
      </template>
    </Message>

    <div class="space-y-4">
      <div>
        <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Telefono simulado</label>
        <div class="flex gap-2">
          <InputText
            :modelValue="config.phoneNumber"
            @input="handlePhoneChange"
            class="flex-1"
            placeholder="5491100001234"
            :disabled="hasSession"
          />
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            @click="handleResetPhone"
            :disabled="hasSession || isDefaultPhone"
            v-tooltip.top="'Restaurar default'"
          />
        </div>

        <!-- Phone Presets -->
        <div class="flex flex-wrap gap-1 mt-2">
          <Tag
            v-for="preset in PHONE_PRESETS"
            :key="preset.value"
            :value="preset.label"
            :severity="config.phoneNumber === preset.value ? 'success' : 'secondary'"
            class="cursor-pointer text-xs"
            :class="{ 'opacity-50': hasSession }"
            @click="!hasSession && selectPreset(preset.value)"
          />
          <Tag
            v-if="!PHONE_PRESETS.some(p => p.value === config.phoneNumber)"
            value="Custom"
            severity="info"
            class="text-xs"
          />
        </div>

        <small class="text-gray-400 dark:text-gray-500 text-xs block mt-1">
          Selecciona un preset o ingresa un numero personalizado
        </small>
      </div>

      <div>
        <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Nombre paciente</label>
        <InputText
          :modelValue="config.userName"
          @input="handleNameChange"
          class="w-full"
          placeholder="Test Patient"
          :disabled="hasSession"
        />
      </div>

      <div>
        <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">DID (WhatsApp ID)</label>
        <code class="text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block">
          {{ config.did || 'Auto (desde institucion)' }}
        </code>
      </div>

      <div>
        <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Dominio</label>
        <div class="flex items-center gap-2">
          <Tag value="Medical Appointments" severity="info" />
          <span class="text-xs text-gray-500 dark:text-gray-400">(MedicalAppointmentsGraph)</span>
        </div>
      </div>

      <!-- Info adicional -->
      <Message severity="secondary" :closable="false" class="mt-4">
        <template #default>
          <div class="text-xs">
            <strong>Flujo de procesamiento:</strong>
            <ul class="list-disc list-inside mt-1 space-y-1">
              <li>Usa <code>MedicalAppointmentsGraph</code> directamente</li>
              <li>Agente: <code>medical_appointments_agent</code></li>
              <li>DID proviene de la institucion seleccionada</li>
            </ul>
          </div>
        </template>
      </Message>
    </div>
  </div>
</template>

<style scoped>
.webhook-panel {
  background: var(--surface-card);
  border-radius: 8px;
}

code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
