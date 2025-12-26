<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { UPLOAD_DESTINATIONS } from '@/utils/constants'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import type { UploadDestination } from '@/types/document.types'

import Card from 'primevue/card'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  modelValue: UploadDestination
  agentKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'global',
  agentKey: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: UploadDestination): void
  (e: 'update:agentKey', value: string): void
}>()

const authStore = useAuthStore()
const currentOrgId = computed(() => authStore.currentOrganization?.id)

// Available agents
const availableAgents = ref<Array<{ value: string; label: string }>>([])
const selectedAgent = ref(props.agentKey)
const loadingAgents = ref(false)

// Filter available destinations based on context
const availableDestinations = computed(() => {
  return UPLOAD_DESTINATIONS.filter((dest) => {
    // Hide tenant if no org selected
    if (dest.requiresOrg && !currentOrgId.value) return false
    return true
  })
})

// Fetch available agents on mount
onMounted(async () => {
  await fetchAgents()
})

async function fetchAgents() {
  if (availableAgents.value.length > 0) return

  loadingAgents.value = true
  try {
    const response = await agentKnowledgeApi.getAvailableAgents()
    availableAgents.value = response.agents.map((agentKey) => ({
      value: agentKey,
      label: formatAgentLabel(agentKey)
    }))
  } catch (error) {
    console.error('Error fetching agents:', error)
  } finally {
    loadingAgents.value = false
  }
}

function formatAgentLabel(agentKey: string): string {
  return agentKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function handleDestinationChange(dest: UploadDestination) {
  emit('update:modelValue', dest)
  if (dest !== 'agent') {
    selectedAgent.value = ''
    emit('update:agentKey', '')
  }
}

watch(selectedAgent, (val) => {
  emit('update:agentKey', val)
})

// Sync with prop
watch(
  () => props.agentKey,
  (val) => {
    selectedAgent.value = val
  }
)
</script>

<template>
  <div class="destination-selector">
    <label class="block text-sm font-semibold text-gray-700 mb-3">
      Destino del documento
    </label>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <Card
        v-for="dest in availableDestinations"
        :key="dest.value"
        :class="[
          'cursor-pointer transition-all border-2 hover:shadow-md',
          modelValue === dest.value
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-gray-300'
        ]"
        @click="handleDestinationChange(dest.value)"
      >
        <template #content>
          <div class="flex items-start gap-3 p-1">
            <RadioButton
              :modelValue="modelValue"
              :value="dest.value"
              @update:modelValue="handleDestinationChange"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <i :class="['pi', dest.icon, 'text-lg']" />
                <span class="font-medium text-sm">{{ dest.label }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ dest.description }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Agent selector (shown when agent destination is selected) -->
    <div v-if="modelValue === 'agent'" class="mt-4 p-4 bg-gray-50 rounded-lg">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Seleccionar Agente
      </label>

      <div v-if="loadingAgents" class="flex items-center gap-2 text-gray-500">
        <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
        <span class="text-sm">Cargando agentes...</span>
      </div>

      <Select
        v-else
        v-model="selectedAgent"
        :options="availableAgents"
        optionLabel="label"
        optionValue="value"
        placeholder="Selecciona un agente"
        class="w-full"
        :disabled="availableAgents.length === 0"
      />

      <Message
        v-if="!loadingAgents && availableAgents.length === 0"
        severity="warn"
        :closable="false"
        class="mt-2"
      >
        No hay agentes disponibles
      </Message>

      <Message
        v-if="modelValue === 'agent' && !selectedAgent && availableAgents.length > 0"
        severity="info"
        :closable="false"
        class="mt-2"
      >
        Selecciona un agente para continuar
      </Message>
    </div>

    <!-- Warning for tenant without org -->
    <Message
      v-if="modelValue === 'tenant' && !currentOrgId"
      severity="warn"
      :closable="false"
      class="mt-2"
    >
      Debes seleccionar una organizacion para subir documentos del tenant.
    </Message>
  </div>
</template>

<style scoped>
.destination-selector :deep(.p-card-content) {
  padding: 0.5rem;
}

.destination-selector :deep(.p-card-body) {
  padding: 0.5rem;
}
</style>
