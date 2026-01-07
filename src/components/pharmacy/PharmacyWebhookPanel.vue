<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PharmacyWebhookConfig, BypassRuleOption } from '@/api/pharmacy.api'
import { pharmacyApi } from '@/api/pharmacy.api'
import ToggleSwitch from 'primevue/toggleswitch'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

const props = defineProps<{
  config: PharmacyWebhookConfig
  hasSession: boolean
  defaultPhone?: string
}>()

const emit = defineEmits<{
  update: [config: Partial<PharmacyWebhookConfig>]
}>()

const DEFAULT_PHONE = props.defaultPhone || '2645631000'

const PHONE_PRESETS = [
  { label: 'Default', value: DEFAULT_PHONE },
  { label: 'Test 1', value: '2645000001' },
  { label: 'Test 2', value: '2645000002' },
]

// Bypass rules state
const bypassRules = ref<BypassRuleOption[]>([])
const selectedRule = ref<BypassRuleOption | null>(null)
const loadingRules = ref(false)

const isDefaultPhone = computed(() => props.config.phoneNumber === DEFAULT_PHONE)

// Load bypass rules when simulate bypass is enabled
onMounted(async () => {
  if (props.config.simulateBypass) {
    await loadBypassRules()
  }
})

watch(() => props.config.simulateBypass, async (enabled) => {
  if (enabled) {
    await loadBypassRules()
  } else {
    selectedRule.value = null
  }
})

async function loadBypassRules() {
  loadingRules.value = true
  try {
    bypassRules.value = await pharmacyApi.getAvailableBypassRules()
  } catch (e) {
    console.error('Failed to load bypass rules:', e)
    bypassRules.value = []
  } finally {
    loadingRules.value = false
  }
}

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

function handleDidChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { did: target.value || null })
}

function handleOrgIdChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { organizationId: target.value || null })
}

function handlePharmacyIdChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update', { pharmacyId: target.value || null })
}

function handleSimulateBypassChange(value: boolean) {
  emit('update', { simulateBypass: value })
}

function handleResetPhone() {
  emit('update', { phoneNumber: DEFAULT_PHONE })
}

function selectPreset(value: string) {
  emit('update', { phoneNumber: value })
}

function onRuleSelected(rule: BypassRuleOption | null) {
  selectedRule.value = rule
  if (rule) {
    // Auto-populate fields based on rule type
    if (rule.type === 'whatsapp_phone_number_id' && rule.phone_number_id) {
      emit('update', { did: rule.phone_number_id })
    }
    if (rule.type === 'phone_number' && rule.pattern) {
      // Remove wildcard and use as phone prefix
      const phone = rule.pattern.replace('*', '') + '000001'
      emit('update', { phoneNumber: phone })
    }
    if (rule.type === 'phone_number_list' && rule.phone_numbers?.length) {
      emit('update', { phoneNumber: rule.phone_numbers[0] })
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
  <div class="webhook-panel p-4">
    <h3 class="text-lg font-semibold mb-4">Simulacion Webhook</h3>

    <Message severity="info" :closable="false" class="mb-4">
      <template #default>
        <div class="text-sm">
          Este modo simula el flujo de WhatsApp usando
          <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">PharmacyGraph</code>.
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
          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Telefono simulado</label>
          <div class="flex gap-2">
            <InputText
              :modelValue="config.phoneNumber"
              @input="handlePhoneChange"
              class="flex-1"
              placeholder="2645631000"
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
          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Nombre usuario</label>
          <InputText
            :modelValue="config.userName"
            @input="handleNameChange"
            class="w-full"
            placeholder="Pharmacy Tester"
            :disabled="hasSession"
          />
        </div>

        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Dominio</label>
          <div class="flex items-center gap-2">
            <Tag value="Pharmacy" severity="success" />
            <span class="text-xs text-gray-500 dark:text-gray-400">(PharmacyGraph)</span>
          </div>
        </div>

        <!-- Toggle: Simular Bypass Rules -->
        <div class="flex items-center gap-3 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <ToggleSwitch
            :modelValue="config.simulateBypass"
            @update:modelValue="handleSimulateBypassChange"
            :disabled="hasSession"
          />
          <div>
            <label class="font-medium cursor-pointer">Simular Bypass Rules</label>
            <small class="block text-gray-500 dark:text-gray-400">
              Usa bypass rules para auto-poblar phone/DID
            </small>
          </div>
        </div>

        <!-- Bypass Rules Section (when simulate bypass enabled) -->
        <div v-if="config.simulateBypass" class="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
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
              :disabled="hasSession"
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
              :modelValue="config.did || ''"
              @input="handleDidChange"
              class="w-full"
              placeholder="5493446405060"
              :disabled="hasSession"
            />
            <small class="text-gray-400 dark:text-gray-500 text-xs">
              Numero del bot para bypass rules tipo whatsapp_phone_number_id
            </small>
          </div>
        </div>

        <!-- Manual Overrides (when NOT using bypass simulation) -->
        <div v-if="!config.simulateBypass" class="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Overrides manuales (opcional)</p>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Organization ID</label>
            <InputText
              :modelValue="config.organizationId || ''"
              @input="handleOrgIdChange"
              class="w-full"
              placeholder="UUID de organizacion"
              :disabled="hasSession"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 block mb-1">Pharmacy ID</label>
            <InputText
              :modelValue="config.pharmacyId || ''"
              @input="handlePharmacyIdChange"
              class="w-full"
              placeholder="UUID de farmacia"
              :disabled="hasSession"
            />
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
                <li v-if="config.simulateBypass">
                  <strong>Bypass activo:</strong> auto-poblado de phone/DID
                </li>
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
