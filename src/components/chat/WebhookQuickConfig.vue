<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { chatApi, type BypassRuleOption } from '@/api/chat.api'
import type { BusinessDomain } from '@/types/chat.types'

import Button from 'primevue/button'
import Popover from 'primevue/popover'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'

const store = useChatStore()
const popoverRef = ref<InstanceType<typeof Popover> | null>(null)
const bypassRules = ref<BypassRuleOption[]>([])
const selectedRule = ref<BypassRuleOption | null>(null)
const loadingRules = ref(false)

interface PresetConfig {
  enabled: boolean
  simulateBypass: boolean
  did: string | null
  phoneNumber?: string
  userName?: string
  businessDomain: BusinessDomain
}

interface Preset {
  id: string
  label: string
  icon: string
  config: PresetConfig
}

const presets: Preset[] = [
  {
    id: 'medical',
    label: 'Turnos Medicos',
    icon: 'pi-calendar-plus',
    config: {
      enabled: true,
      simulateBypass: true,
      did: 'TEST_MEDICAL_001',
      phoneNumber: '5491100001234',
      userName: 'Test Patient',
      businessDomain: 'medical_appointments'
    }
  },
  {
    id: 'excelencia',
    label: 'Excelencia',
    icon: 'pi-desktop',
    config: {
      enabled: true,
      simulateBypass: false,
      did: null,
      businessDomain: 'excelencia'
    }
  }
]

async function toggle(event: Event) {
  popoverRef.value?.toggle(event)
  if (!bypassRules.value.length) {
    await loadBypassRules()
  }
}

async function loadBypassRules() {
  loadingRules.value = true
  try {
    bypassRules.value = await chatApi.getAvailableBypassRules()
  } catch (e) {
    console.error('Failed to load bypass rules:', e)
  } finally {
    loadingRules.value = false
  }
}

function applyPreset(preset: Preset) {
  store.updateWebhookSimulation(preset.config)
  if (preset.config.did) {
    const match = bypassRules.value.find(r => r.phone_number_id === preset.config.did)
    if (match) {
      selectedRule.value = match
    }
  }
}

function onRuleSelected(rule: BypassRuleOption | null) {
  selectedRule.value = rule
  if (rule?.phone_number_id) {
    store.updateWebhookSimulation({ did: rule.phone_number_id })
  }
}

function openFullConfig() {
  emit('open-full-config')
  popoverRef.value?.hide()
}

const emit = defineEmits<{
  'open-full-config': []
}>()
</script>

<template>
  <div class="webhook-quick-config">
    <Button
      icon="pi pi-bolt"
      :severity="store.webhookSimulation.enabled ? 'success' : 'secondary'"
      size="small"
      v-tooltip.bottom="'Webhook Config'"
      :badge="store.webhookSimulation.enabled ? 'ON' : undefined"
      badgeSeverity="success"
      @click="toggle"
    />

    <Popover ref="popoverRef">
      <div class="popover-content">
        <div class="flex items-center justify-between mb-3">
          <h4 class="popover-title">Webhook Simulation</h4>
          <Checkbox
            :modelValue="store.webhookSimulation.enabled"
            @update:modelValue="store.updateWebhookSimulation({ enabled: $event })"
            :binary="true"
          />
        </div>

        <!-- Quick Presets -->
        <div class="mb-3">
          <p class="popover-label mb-2">Presets:</p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="preset in presets"
              :key="preset.id"
              :icon="'pi ' + preset.icon"
              :label="preset.label"
              size="small"
              severity="secondary"
              outlined
              @click="applyPreset(preset)"
            />
          </div>
        </div>

        <Divider class="my-3" />

        <!-- Current Config -->
        <div v-if="store.webhookSimulation.enabled" class="space-y-3">
          <div>
            <label class="popover-label block mb-1">Telefono</label>
            <InputText
              :modelValue="store.webhookSimulation.phoneNumber"
              @update:modelValue="store.updateWebhookSimulation({ phoneNumber: String($event) })"
              class="w-full"
              size="small"
              placeholder="Phone number"
            />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox
              :modelValue="store.webhookSimulation.simulateBypass"
              @update:modelValue="store.updateWebhookSimulation({ simulateBypass: $event })"
              :binary="true"
            />
            <span class="popover-text">Bypass Rules</span>
          </div>

          <div v-if="store.webhookSimulation.simulateBypass">
            <Select
              v-model="selectedRule"
              :options="bypassRules"
              optionLabel="name"
              placeholder="Select bypass rule..."
              class="w-full"
              :loading="loadingRules"
              @change="onRuleSelected(selectedRule)"
            />
          </div>
        </div>

        <Divider class="my-3" />

        <Button
          label="Config Completa"
          icon="pi pi-external-link"
          severity="secondary"
          size="small"
          class="w-full"
          @click="openFullConfig"
        />
      </div>
    </Popover>
  </div>
</template>

<style scoped>
.popover-content {
  padding: 0.75rem;
  min-width: 320px;
}

.popover-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

.popover-label {
  font-size: 0.75rem;
  opacity: 0.7;
}

.popover-text {
  font-size: 0.875rem;
}
</style>
