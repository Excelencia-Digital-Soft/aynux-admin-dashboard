<script setup lang="ts">
import type { PharmacyWebhookConfig } from '@/api/pharmacy.api'
import ToggleSwitch from 'primevue/toggleswitch'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

defineProps<{
  config: PharmacyWebhookConfig
  hasSession: boolean
}>()

const emit = defineEmits<{
  update: [config: Partial<PharmacyWebhookConfig>]
}>()

function handleEnabledChange(value: boolean) {
  emit('update', { enabled: value })
}

function handlePhoneChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { phoneNumber: target.value })
}

function handleNameChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { userName: target.value })
}
</script>

<template>
  <div class="webhook-panel p-4">
    <h3 class="text-lg font-semibold mb-4">Simulacion Webhook</h3>

    <Message severity="info" :closable="false" class="mb-4">
      <template #default>
        <div class="text-sm">
          Este modo simula el flujo de WhatsApp usando
          <code class="bg-blue-100 px-1 rounded">PharmacyGraph</code>.
        </div>
      </template>
    </Message>

    <div class="space-y-4">
      <!-- Toggle -->
      <div class="flex items-center gap-3">
        <ToggleSwitch
          :modelValue="config.enabled"
          @update:modelValue="handleEnabledChange"
        />
        <label class="font-medium cursor-pointer" @click="emit('update', { enabled: !config.enabled })">
          Activar Modo Webhook
        </label>
        <Tag v-if="config.enabled" value="Activo" severity="success" class="ml-2" />
      </div>

      <!-- Config (visible cuando activo) -->
      <div v-if="config.enabled" class="space-y-3 pl-4 border-l-2 border-green-300 ml-2">
        <div>
          <label class="text-sm text-gray-600 block mb-1">Telefono simulado</label>
          <InputText
            :modelValue="config.phoneNumber"
            @input="handlePhoneChange"
            class="w-full"
            placeholder="2645631000"
            :disabled="hasSession"
          />
          <small class="text-gray-400 text-xs">
            Numero de telefono para identificar cliente
          </small>
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">Nombre usuario</label>
          <InputText
            :modelValue="config.userName"
            @input="handleNameChange"
            class="w-full"
            placeholder="Pharmacy Tester"
            :disabled="hasSession"
          />
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">Dominio</label>
          <div class="flex items-center gap-2">
            <Tag value="Pharmacy" severity="success" />
            <span class="text-xs text-gray-500">(PharmacyGraph)</span>
          </div>
        </div>

        <!-- Info adicional -->
        <Message severity="secondary" :closable="false" class="mt-4">
          <template #default>
            <div class="text-xs">
              <strong>Flujo de procesamiento:</strong>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>Usa <code>PharmacyGraph</code> directamente</li>
                <li>Agente: <code>pharmacy_operations_agent</code></li>
                <li>Session ID: <code>pharmacy_test_[uuid]</code></li>
                <li>Maneja: deudas, pagos, consultas</li>
              </ul>
            </div>
          </template>
        </Message>
      </div>
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
