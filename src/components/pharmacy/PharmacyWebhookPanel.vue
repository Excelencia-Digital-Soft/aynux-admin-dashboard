<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PharmacyWebhookConfig, BypassRuleOption } from '@/api/pharmacy.api'
import { pharmacyApi } from '@/api/pharmacy.api'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

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

function onRuleSelected(rule: BypassRuleOption) {
  selectedRule.value = rule
  if (rule) {
    if (rule.type === 'whatsapp_phone_number_id' && rule.phone_number_id) {
      emit('update', { did: rule.phone_number_id })
    }
    if (rule.type === 'phone_number' && rule.pattern) {
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

function getRuleTypeBadgeVariant(type: string) {
  return type === 'whatsapp_phone_number_id' ? 'success' as const : 'info' as const
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
  <div class="webhook-panel p-4 rounded-lg bg-card">
    <h3 class="text-lg font-semibold text-foreground mb-4">Simulacion Webhook</h3>

    <Alert variant="info" class="mb-4">
      <AlertDescription>
        <div class="text-sm">
          Este modo simula el flujo de WhatsApp usando
          <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">PharmacyGraph</code>.
        </div>
      </AlertDescription>
    </Alert>

    <div class="space-y-4">
      <!-- Toggle -->
      <div class="flex items-center gap-3">
        <Switch
          :checked="config.enabled"
          @update:checked="handleEnabledChange"
        />
        <label class="font-medium cursor-pointer text-foreground" @click="emit('update', { enabled: !config.enabled })">
          Activar Modo Webhook
        </label>
        <Badge v-if="config.enabled" variant="success" class="ml-2">Activo</Badge>
      </div>

      <!-- Config (visible cuando activo) -->
      <div v-if="config.enabled" class="space-y-3 pl-4 border-l-2 border-green-300 ml-2">
        <div>
          <label class="text-sm text-muted-foreground block mb-1">Telefono simulado</label>
          <div class="flex gap-2">
            <Input
              :model-value="config.phoneNumber"
              @input="handlePhoneChange"
              class="flex-1"
              placeholder="2645631000"
              :disabled="hasSession"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    size="icon"
                    @click="handleResetPhone"
                    :disabled="hasSession || isDefaultPhone"
                  >
                    <i class="pi pi-refresh text-sm" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Restaurar default</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <!-- Phone Presets -->
          <div class="flex flex-wrap gap-1 mt-2">
            <Badge
              v-for="preset in PHONE_PRESETS"
              :key="preset.value"
              :variant="config.phoneNumber === preset.value ? 'success' : 'secondary'"
              :class="`cursor-pointer text-xs ${hasSession ? 'opacity-50' : ''}`"
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

          <small class="text-muted-foreground text-xs block mt-1">
            Selecciona un preset o ingresa un numero personalizado
          </small>
        </div>

        <div>
          <label class="text-sm text-muted-foreground block mb-1">Nombre usuario</label>
          <Input
            :model-value="config.userName"
            @input="handleNameChange"
            placeholder="Pharmacy Tester"
            :disabled="hasSession"
          />
        </div>

        <div>
          <label class="text-sm text-muted-foreground block mb-1">Dominio</label>
          <div class="flex items-center gap-2">
            <Badge variant="success">Pharmacy</Badge>
            <span class="text-xs text-muted-foreground">(PharmacyGraph)</span>
          </div>
        </div>

        <!-- Toggle: Simular Bypass Rules -->
        <div class="flex items-center gap-3 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <Switch
            :checked="config.simulateBypass"
            @update:checked="handleSimulateBypassChange"
            :disabled="hasSession"
          />
          <div>
            <label class="font-medium cursor-pointer text-foreground">Simular Bypass Rules</label>
            <small class="block text-muted-foreground">
              Usa bypass rules para auto-poblar phone/DID
            </small>
          </div>
        </div>

        <!-- Bypass Rules Section (when simulate bypass enabled) -->
        <div v-if="config.simulateBypass" class="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <!-- Bypass Rule Selector -->
          <div>
            <label class="text-sm text-muted-foreground block mb-1">Seleccionar Bypass Rule</label>
            <div v-if="loadingRules" class="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <i class="pi pi-spin pi-spinner" />
              Cargando reglas...
            </div>
            <div v-else class="space-y-1 max-h-40 overflow-y-auto">
              <div
                v-for="rule in bypassRules"
                :key="rule.name"
                :class="[
                  'flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors',
                  selectedRule?.name === rule.name
                    ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="!hasSession && onRuleSelected(rule)"
              >
                <Badge :variant="getRuleTypeBadgeVariant(rule.type)" class="text-xs">
                  {{ getRuleTypeLabel(rule.type) }}
                </Badge>
                <span class="text-foreground">{{ rule.name }}</span>
                <small class="text-muted-foreground ml-auto">
                  {{ getRuleValue(rule) }}
                </small>
              </div>
            </div>
            <small class="text-muted-foreground text-xs">
              Selecciona una regla para auto-poblar phone/DID
            </small>
          </div>

          <!-- DID (Bot Phone) -->
          <div>
            <label class="text-sm text-muted-foreground block mb-1">DID (Bot Phone)</label>
            <Input
              :model-value="config.did || ''"
              @input="handleDidChange"
              placeholder="5493446405060"
              :disabled="hasSession"
            />
            <small class="text-muted-foreground text-xs">
              Numero del bot para bypass rules tipo whatsapp_phone_number_id
            </small>
          </div>
        </div>

        <!-- Manual Overrides (when NOT using bypass simulation) -->
        <div v-if="!config.simulateBypass" class="space-y-3 p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground font-medium">Overrides manuales (opcional)</p>
          <div>
            <label class="text-sm text-muted-foreground block mb-1">Organization ID</label>
            <Input
              :model-value="config.organizationId || ''"
              @input="handleOrgIdChange"
              placeholder="UUID de organizacion"
              :disabled="hasSession"
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground block mb-1">Pharmacy ID</label>
            <Input
              :model-value="config.pharmacyId || ''"
              @input="handlePharmacyIdChange"
              placeholder="UUID de farmacia"
              :disabled="hasSession"
            />
          </div>
        </div>

        <!-- Info adicional -->
        <Alert class="mt-4">
          <AlertDescription>
            <div class="text-xs">
              <strong>Flujo de procesamiento:</strong>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>Usa <code class="bg-muted px-1 rounded">PharmacyGraph</code> directamente</li>
                <li>Agente: <code class="bg-muted px-1 rounded">pharmacy_operations_agent</code></li>
                <li>Session ID: <code class="bg-muted px-1 rounded">pharmacy_test_[uuid]</code></li>
                <li v-if="config.simulateBypass">
                  <strong>Bypass activo:</strong> auto-poblado de phone/DID
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  </div>
</template>

<style scoped>
code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
