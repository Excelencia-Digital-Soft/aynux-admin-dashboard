<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useBypassRules } from '@/composables/useBypassRules'
import { agentApi } from '@/api/agent.api'
import type {
  BypassRuleCreateRequest,
  BypassRuleUpdateRequest,
  BypassRuleType,
  TargetDomain
} from '@/types/bypassRules.types'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Chip from 'primevue/chip'

const store = useBypassRulesStore()
const { createRule, updateRule, isLoading, closeRuleDialog } = useBypassRules()

// Available agents (fetched on mount)
const availableAgents = ref<string[]>([])
const loadingAgents = ref(false)

// Form state
const formData = ref({
  rule_name: '',
  description: '',
  rule_type: 'phone_number' as BypassRuleType,
  pattern: '',
  phone_numbers: [] as string[],
  phone_number_id: '',
  target_agent: '',
  target_domain: undefined as TargetDomain | undefined,
  priority: 100,
  enabled: true
})

// For phone number list input
const newPhoneNumber = ref('')

// Options
const ruleTypeOptions = [
  { label: 'Patron de Telefono', value: 'phone_number' },
  { label: 'Lista de Telefonos', value: 'phone_number_list' },
  { label: 'WhatsApp Phone ID', value: 'whatsapp_phone_number_id' }
]

const domainOptions = [
  { label: 'Sin dominio especifico', value: undefined },
  { label: 'Excelencia', value: 'excelencia' },
  { label: 'Salud', value: 'healthcare' },
  { label: 'Credito', value: 'credit' },
  { label: 'E-commerce', value: 'ecommerce' }
]

const isEditing = computed(() => store.editingRule !== null)
const dialogTitle = computed(() =>
  isEditing.value ? 'Editar Regla de Bypass' : 'Nueva Regla de Bypass'
)

const canSave = computed(() => {
  // Base validation
  if (!formData.value.rule_name.trim()) return false
  if (!formData.value.target_agent) return false

  // Type-specific validation
  switch (formData.value.rule_type) {
    case 'phone_number':
      return !!formData.value.pattern?.trim()
    case 'phone_number_list':
      return formData.value.phone_numbers.length > 0
    case 'whatsapp_phone_number_id':
      return !!formData.value.phone_number_id?.trim()
    default:
      return false
  }
})

// Watch for editing rule changes
watch(
  () => store.editingRule,
  (rule) => {
    if (rule) {
      formData.value = {
        rule_name: rule.rule_name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        pattern: rule.pattern || '',
        phone_numbers: rule.phone_numbers ? [...rule.phone_numbers] : [],
        phone_number_id: rule.phone_number_id || '',
        target_agent: rule.target_agent,
        target_domain: rule.target_domain || undefined,
        priority: rule.priority,
        enabled: rule.enabled
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  formData.value = {
    rule_name: '',
    description: '',
    rule_type: 'phone_number',
    pattern: '',
    phone_numbers: [],
    phone_number_id: '',
    target_agent: '',
    target_domain: undefined,
    priority: 100,
    enabled: true
  }
  newPhoneNumber.value = ''
}

function addPhoneNumber() {
  const number = newPhoneNumber.value.trim()
  if (number && !formData.value.phone_numbers.includes(number)) {
    formData.value.phone_numbers.push(number)
    newPhoneNumber.value = ''
  }
}

function removePhoneNumber(number: string) {
  formData.value.phone_numbers = formData.value.phone_numbers.filter((n) => n !== number)
}

async function fetchAgents() {
  loadingAgents.value = true
  try {
    const response = await agentApi.getEnabledAgents()
    // Handle both array and object responses
    availableAgents.value = Array.isArray(response) ? response : (response as any)?.agents || []
  } catch (error) {
    console.error('Error fetching agents:', error)
    availableAgents.value = []
  } finally {
    loadingAgents.value = false
  }
}

async function handleSubmit() {
  if (!canSave.value) return

  // Build request data based on rule type
  const baseData = {
    rule_name: formData.value.rule_name,
    description: formData.value.description || undefined,
    rule_type: formData.value.rule_type,
    target_agent: formData.value.target_agent,
    target_domain: formData.value.target_domain,
    priority: formData.value.priority,
    enabled: formData.value.enabled
  }

  // Add type-specific fields
  let typeFields = {}
  switch (formData.value.rule_type) {
    case 'phone_number':
      typeFields = { pattern: formData.value.pattern }
      break
    case 'phone_number_list':
      typeFields = { phone_numbers: formData.value.phone_numbers }
      break
    case 'whatsapp_phone_number_id':
      typeFields = { phone_number_id: formData.value.phone_number_id }
      break
  }

  if (isEditing.value && store.editingRule) {
    const updateData: BypassRuleUpdateRequest = { ...baseData, ...typeFields }
    await updateRule(store.editingRule.id, updateData)
  } else {
    const createData: BypassRuleCreateRequest = { ...baseData, ...typeFields }
    await createRule(createData)
  }
}

function handleClose() {
  resetForm()
  closeRuleDialog()
}

onMounted(() => {
  fetchAgents()
})
</script>

<template>
  <Dialog
    :visible="store.showRuleDialog"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '600px' }"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Basic Info Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-info-circle" />
          Informacion Basica
        </h3>

        <div class="space-y-3">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Regla *
            </label>
            <InputText
              v-model="formData.rule_name"
              placeholder="Ej: VIP Argentina"
              class="w-full"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Descripcion </label>
            <Textarea
              v-model="formData.description"
              rows="2"
              placeholder="Descripcion opcional de la regla"
              class="w-full"
            />
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Prioridad * </label>
            <InputNumber v-model="formData.priority" :min="1" :max="1000" class="w-full" />
            <p class="text-xs text-gray-400 mt-1">
              Mayor numero = mayor prioridad. Las reglas se evaluan en orden descendente.
            </p>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Rule Type Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-filter" />
          Condicion de Coincidencia
        </h3>

        <!-- Rule Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"> Tipo de Regla * </label>
          <Select
            v-model="formData.rule_type"
            :options="ruleTypeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <!-- Phone Number Pattern -->
        <div v-if="formData.rule_type === 'phone_number'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Patron de Telefono *
          </label>
          <InputText
            v-model="formData.pattern"
            placeholder="Ej: 549* (numeros de Argentina)"
            class="w-full"
          />
          <p class="text-xs text-gray-400 mt-1">
            Usa * como comodin. Ej: "549*" coincide con todos los numeros de Argentina.
          </p>
        </div>

        <!-- Phone Number List -->
        <div v-else-if="formData.rule_type === 'phone_number_list'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Lista de Telefonos *
          </label>

          <div class="flex gap-2 mb-2">
            <InputText
              v-model="newPhoneNumber"
              placeholder="Agregar numero (ej: 5491155667788)"
              class="flex-1"
              @keyup.enter="addPhoneNumber"
            />
            <Button icon="pi pi-plus" :disabled="!newPhoneNumber.trim()" @click="addPhoneNumber" />
          </div>

          <div
            v-if="formData.phone_numbers.length > 0"
            class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded"
          >
            <Chip
              v-for="number in formData.phone_numbers"
              :key="number"
              :label="number"
              removable
              @remove="removePhoneNumber(number)"
            />
          </div>
          <p v-else class="text-xs text-gray-400">Agrega al menos un numero de telefono.</p>
        </div>

        <!-- WhatsApp Phone Number ID -->
        <div v-else-if="formData.rule_type === 'whatsapp_phone_number_id'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Phone Number ID *
          </label>
          <InputText
            v-model="formData.phone_number_id"
            placeholder="Ej: 123456789012345"
            class="w-full"
          />
          <p class="text-xs text-gray-400 mt-1">
            ID del numero de WhatsApp Business (de Meta Business Manager).
          </p>
        </div>
      </div>

      <Divider />

      <!-- Target Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-directions-alt" />
          Destino
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <!-- Target Agent -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Agente Destino * </label>
            <Select
              v-model="formData.target_agent"
              :options="availableAgents"
              placeholder="Seleccionar agente"
              class="w-full"
              :loading="loadingAgents"
            />
          </div>

          <!-- Target Domain -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Dominio </label>
            <Select
              v-model="formData.target_domain"
              :options="domainOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Opcional"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Validation Message -->
      <Message v-if="!canSave && formData.rule_name" severity="warn" :closable="false">
        Completa todos los campos requeridos segun el tipo de regla seleccionado.
      </Message>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" :disabled="isLoading" @click="handleClose" />
      <Button
        :label="isEditing ? 'Guardar' : 'Crear'"
        icon="pi pi-check"
        :disabled="!canSave"
        :loading="isLoading"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>
