<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { chatApi, type BypassRuleOption } from '@/api/chat.api'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

const store = useChatStore()
const bypassRules = ref<BypassRuleOption[]>([])
const selectedRule = ref<BypassRuleOption | null>(null)
const loadingRules = ref(false)

// Load bypass rules when simulate bypass is enabled
onMounted(async () => {
  if (store.webhookSimulation.simulateBypass) {
    await loadBypassRules()
  }
})

watch(() => store.webhookSimulation.simulateBypass, async (enabled) => {
  if (enabled) {
    await loadBypassRules()
  } else {
    selectedRule.value = null
  }
})

async function loadBypassRules() {
  loadingRules.value = true
  try {
    bypassRules.value = await chatApi.getAvailableBypassRules()
  } catch (e) {
    console.error('Failed to load bypass rules:', e)
    bypassRules.value = []
  } finally {
    loadingRules.value = false
  }
}

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

function handleDidChange(event: Event) {
  const target = event.target as HTMLInputElement
  store.updateWebhookSimulation({ did: target.value || null })
}

function handleOrgIdChange(event: Event) {
  const target = event.target as HTMLInputElement
  store.updateWebhookSimulation({ organizationId: target.value || null })
}

function handlePharmacyIdChange(event: Event) {
  const target = event.target as HTMLInputElement
  store.updateWebhookSimulation({ pharmacyId: target.value || null })
}

function handleSimulateBypassChange(value: boolean) {
  store.updateWebhookSimulation({ simulateBypass: value })
}

function onRuleSelected(rule: BypassRuleOption | null) {
  selectedRule.value = rule
  if (rule) {
    // Auto-populate fields based on rule type
    if (rule.type === 'whatsapp_phone_number_id' && rule.phone_number_id) {
      store.updateWebhookSimulation({ did: rule.phone_number_id })
    }
    if (rule.type === 'phone_number' && rule.pattern) {
      // Remove wildcard and use as phone prefix
      const phone = rule.pattern.replace('*', '') + '000001'
      store.updateWebhookSimulation({ phoneNumber: phone })
    }
    if (rule.type === 'phone_number_list' && rule.phone_numbers?.length) {
      store.updateWebhookSimulation({ phoneNumber: rule.phone_numbers[0] })
    }
  }
}

function getRuleTypeLabel(type: string): string {
  switch (type) {
    case 'phone_number': return 'Pattern'
    case 'phone_number_list': return 'List'
    case 'whatsapp_phone_number_id': return 'DID'
    default: return type
  }
}

function getRuleValue(rule: BypassRuleOption): string {
  if (rule.type === 'whatsapp_phone_number_id') {
    return rule.phone_number_id || ''
  }
  if (rule.type === 'phone_number') {
    return rule.pattern || ''
  }
  if (rule.type === 'phone_number_list') {
    return rule.phone_numbers?.slice(0, 2).join(', ') + (rule.phone_numbers && rule.phone_numbers.length > 2 ? '...' : '')
  }
  return ''
}
</script>

<template>
  <div class="webhook-simulation-panel p-4">
    <h3 class="text-lg font-semibold mb-4">Simulacion de Webhook</h3>

    <Message severity="info" :closable="false" class="mb-4">
      <template #default>
        <div class="text-sm">
          Este modo simula el flujo exacto de WhatsApp usando
          <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">process_webhook_message()</code>.
          Util para detectar errores antes de deploy.
        </div>
      </template>
    </Message>

    <div class="space-y-4">
      <!-- Toggle principal -->
      <div class="flex items-center gap-3">
        <Checkbox
          :modelValue="store.webhookSimulation.enabled"
          @update:modelValue="handleEnabledChange"
          :binary="true"
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
          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Telefono simulado</label>
          <InputText
            :modelValue="store.webhookSimulation.phoneNumber"
            @input="handlePhoneChange"
            class="w-full"
            placeholder="5492645631000"
          />
          <small class="text-gray-400 dark:text-gray-500 text-xs">
            Sin prefijo 'web_' para simular produccion
          </small>
        </div>

        <!-- Nombre de usuario -->
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Nombre usuario</label>
          <InputText
            :modelValue="store.webhookSimulation.userName"
            @input="handleNameChange"
            class="w-full"
            placeholder="Web Tester"
          />
        </div>

        <!-- Toggle: Simular Bypass Rules -->
        <div class="flex items-center gap-3 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <Checkbox
            :modelValue="store.webhookSimulation.simulateBypass"
            @update:modelValue="handleSimulateBypassChange"
            :binary="true"
          />
          <div>
            <label class="font-medium cursor-pointer">Simular Bypass Rules</label>
            <small class="block text-gray-500 dark:text-gray-400">
              Evalua bypass routing como produccion Chattigo
            </small>
          </div>
        </div>

        <!-- Bypass Rules Section (when simulate bypass enabled) -->
        <div v-if="store.webhookSimulation.simulateBypass" class="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <!-- Bypass Rule Dropdown -->
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Seleccionar Bypass Rule</label>
            <Select
              v-model="selectedRule"
              :options="bypassRules"
              optionLabel="name"
              placeholder="Selecciona una regla..."
              class="w-full"
              :loading="loadingRules"
              showClear
              @change="onRuleSelected(selectedRule)"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <Tag :value="getRuleTypeLabel(option.type)" size="small" :severity="option.type === 'whatsapp_phone_number_id' ? 'success' : 'info'" />
                  <span>{{ option.name }}</span>
                  <small class="text-gray-400 dark:text-gray-500 ml-auto">
                    {{ getRuleValue(option) }}
                  </small>
                </div>
              </template>
              <template #value="{ value }">
                <div v-if="value" class="flex items-center gap-2">
                  <Tag :value="getRuleTypeLabel(value.type)" size="small" />
                  <span>{{ value.name }}</span>
                </div>
                <span v-else>Selecciona una regla...</span>
              </template>
            </Select>
            <small class="text-gray-400 dark:text-gray-500 text-xs">
              Selecciona una regla para auto-poblar phone/DID
            </small>
          </div>

          <!-- DID (Bot Phone) -->
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">DID (Bot Phone)</label>
            <InputText
              :modelValue="store.webhookSimulation.did || ''"
              @input="handleDidChange"
              class="w-full"
              placeholder="5493446405060"
            />
            <small class="text-gray-400 dark:text-gray-500 text-xs">
              Numero del bot para bypass rules tipo whatsapp_phone_number_id
            </small>
          </div>
        </div>

        <!-- Manual Overrides (when NOT using bypass simulation) -->
        <div v-if="!store.webhookSimulation.simulateBypass" class="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Overrides manuales (opcional)</p>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Organization ID</label>
            <InputText
              :modelValue="store.webhookSimulation.organizationId || ''"
              @input="handleOrgIdChange"
              class="w-full"
              placeholder="UUID de organizacion"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Pharmacy ID</label>
            <InputText
              :modelValue="store.webhookSimulation.pharmacyId || ''"
              @input="handlePharmacyIdChange"
              class="w-full"
              placeholder="UUID de farmacia"
            />
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
                <li v-if="store.webhookSimulation.simulateBypass">
                  <strong>Bypass activo:</strong> evalua reglas de bypass como Chattigo
                </li>
                <li>Session ID: <code>web_[telefono]</code></li>
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
