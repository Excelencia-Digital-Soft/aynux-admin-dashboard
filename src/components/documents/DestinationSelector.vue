<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { UPLOAD_DESTINATIONS } from '@/utils/constants'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import type { UploadDestination } from '@/types/document.types'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
      Destino del documento
    </label>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div
        v-for="dest in availableDestinations"
        :key="dest.value"
        :class="[
          'glass-panel cursor-pointer transition-all p-4 hover:shadow-md',
          modelValue === dest.value
            ? 'border-violet-500 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-500/10'
            : 'hover:border-gray-300 dark:hover:border-white/20'
        ]"
        @click="handleDestinationChange(dest.value)"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5">
            <div
              :class="[
                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                modelValue === dest.value
                  ? 'border-violet-500 dark:border-violet-400'
                  : 'border-gray-300 dark:border-gray-600'
              ]"
            >
              <div
                v-if="modelValue === dest.value"
                class="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400"
              />
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <i :class="['pi', dest.icon, 'text-lg']" />
              <span class="font-medium text-sm text-gray-800 dark:text-gray-200">{{ dest.label }}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ dest.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent selector (shown when agent destination is selected) -->
    <div v-if="modelValue === 'agent'" class="mt-4 p-4 glass-panel">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Seleccionar Agente
      </label>

      <div v-if="loadingAgents" class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <i class="pi pi-spin pi-spinner" />
        <span class="text-sm">Cargando agentes...</span>
      </div>

      <Select
        v-else
        v-model="selectedAgent"
        :disabled="availableAgents.length === 0"
      >
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Selecciona un agente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="agent in availableAgents"
            :key="agent.value"
            :value="agent.value"
          >
            {{ agent.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Alert
        v-if="!loadingAgents && availableAgents.length === 0"
        variant="warning"
        class="mt-2"
      >
        <AlertDescription>No hay agentes disponibles</AlertDescription>
      </Alert>

      <Alert
        v-if="modelValue === 'agent' && !selectedAgent && availableAgents.length > 0"
        variant="info"
        class="mt-2"
      >
        <AlertDescription>Selecciona un agente para continuar</AlertDescription>
      </Alert>
    </div>

    <!-- Warning for tenant without org -->
    <Alert
      v-if="modelValue === 'tenant' && !currentOrgId"
      variant="warning"
      class="mt-2"
    >
      <AlertDescription>
        Debes seleccionar una organizacion para subir documentos del tenant.
      </AlertDescription>
    </Alert>
  </div>
</template>
