<script setup lang="ts">
import { useChatStore } from '@/stores/chat.store'
import ToggleSwitch from 'primevue/toggleswitch'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

const store = useChatStore()

function handleEnabledChange(value: boolean) {
  store.updateWebhookSimulation({ enabled: value })
}

function handlePhoneChange(event: Event) {
  const target = event.target as HTMLInputElement
  store.updateWebhookSimulation({ phoneNumber: target.value })
}

function handleNameChange(event: Event) {
  const target = event.target as HTMLInputElement
  store.updateWebhookSimulation({ userName: target.value })
}
</script>

<template>
  <div class="webhook-simulation-panel p-4">
    <h3 class="text-lg font-semibold mb-4">Simulacion de Webhook</h3>

    <Message severity="info" :closable="false" class="mb-4">
      <template #default>
        <div class="text-sm">
          Este modo simula el flujo exacto de WhatsApp usando
          <code class="bg-blue-100 px-1 rounded">process_webhook_message()</code>.
          Util para detectar errores antes de deploy.
        </div>
      </template>
    </Message>

    <div class="space-y-4">
      <!-- Toggle principal -->
      <div class="flex items-center gap-3">
        <ToggleSwitch
          :modelValue="store.webhookSimulation.enabled"
          @update:modelValue="handleEnabledChange"
        />
        <label class="font-medium cursor-pointer" @click="store.toggleWebhookSimulation()">
          Activar Modo Webhook
        </label>
        <Tag
          v-if="store.webhookSimulation.enabled"
          value="Activo"
          severity="success"
          class="ml-2"
        />
      </div>

      <!-- Configuracion (solo visible cuando esta activo) -->
      <div
        v-if="store.webhookSimulation.enabled"
        class="space-y-3 pl-4 border-l-2 border-blue-300 ml-2"
      >
        <!-- Telefono simulado -->
        <div>
          <label class="text-sm text-gray-600 block mb-1">Telefono simulado</label>
          <InputText
            :modelValue="store.webhookSimulation.phoneNumber"
            @input="handlePhoneChange"
            class="w-full"
            placeholder="web_5491100001234"
          />
          <small class="text-gray-400 text-xs">
            Prefijo 'web_' para identificar origen
          </small>
        </div>

        <!-- Nombre de usuario -->
        <div>
          <label class="text-sm text-gray-600 block mb-1">Nombre usuario</label>
          <InputText
            :modelValue="store.webhookSimulation.userName"
            @input="handleNameChange"
            class="w-full"
            placeholder="Web Tester"
          />
        </div>

        <!-- Dominio (fijo) -->
        <div>
          <label class="text-sm text-gray-600 block mb-1">Dominio</label>
          <div class="flex items-center gap-2">
            <Tag value="Excelencia" severity="info" />
            <span class="text-xs text-gray-500">(unico activo en produccion)</span>
          </div>
        </div>

        <!-- Info adicional -->
        <Message severity="secondary" :closable="false" class="mt-4">
          <template #default>
            <div class="text-xs">
              <strong>Diferencias con /test:</strong>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>Usa <code>process_webhook_message()</code> (flujo produccion)</li>
                <li>Crea objetos WhatsAppMessage y Contact</li>
                <li>Session ID: <code>web_[telefono]</code></li>
                <li>Soporta routing por dominio</li>
              </ul>
            </div>
          </template>
        </Message>
      </div>
    </div>
  </div>
</template>

<style scoped>
.webhook-simulation-panel {
  background: var(--surface-card);
  border-radius: 8px;
}

code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
