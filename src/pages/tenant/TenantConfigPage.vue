<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOrganization } from '@/composables/useOrganization'
import type { TenantConfigUpdateRequest } from '@/types/organization.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import ColorPicker from 'primevue/colorpicker'
import Checkbox from 'primevue/checkbox'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

const authStore = useAuthStore()
const {
  tenantConfig,
  isLoading,
  fetchTenantConfig,
  updateTenantConfig,
  regenerateApiKey
} = useOrganization()

const activeTab = ref('0')
const showApiKeyDialog = ref(false)
const newApiKey = ref<string | null>(null)
const hasChanges = ref(false)

// Form state
const formData = ref({
  primary_color: '',
  secondary_color: '',
  agent_name: '',
  agent_greeting: '',
  agent_personality: '',
  agent_instructions: '',
  daily_message_limit: undefined as number | undefined,
  max_context_tokens: undefined as number | undefined,
  max_response_tokens: undefined as number | undefined,
  webhook_url: ''
})

const currentOrgId = computed(() => authStore.currentOrgId)

// Watch for config changes
watch(tenantConfig, (config) => {
  if (config) {
    formData.value = {
      primary_color: config.primary_color || '',
      secondary_color: config.secondary_color || '',
      agent_name: config.agent_name || '',
      agent_greeting: config.agent_greeting || '',
      agent_personality: config.agent_personality || '',
      agent_instructions: config.agent_instructions || '',
      daily_message_limit: config.daily_message_limit,
      max_context_tokens: config.max_context_tokens,
      max_response_tokens: config.max_response_tokens,
      webhook_url: config.webhook_url || ''
    }
    hasChanges.value = false
  }
}, { immediate: true })

// Track changes
watch(formData, () => {
  hasChanges.value = true
}, { deep: true })

async function handleSave() {
  if (!currentOrgId.value) return

  const updateData: TenantConfigUpdateRequest = {
    primary_color: formData.value.primary_color || undefined,
    secondary_color: formData.value.secondary_color || undefined,
    agent_name: formData.value.agent_name || undefined,
    agent_greeting: formData.value.agent_greeting || undefined,
    agent_personality: formData.value.agent_personality || undefined,
    agent_instructions: formData.value.agent_instructions || undefined,
    daily_message_limit: formData.value.daily_message_limit,
    max_context_tokens: formData.value.max_context_tokens,
    max_response_tokens: formData.value.max_response_tokens,
    webhook_url: formData.value.webhook_url || undefined
  }

  await updateTenantConfig(updateData, currentOrgId.value)
  hasChanges.value = false
}

async function handleRegenerateApiKey() {
  if (!currentOrgId.value) return

  const key = await regenerateApiKey(currentOrgId.value)
  if (key) {
    newApiKey.value = key
    showApiKeyDialog.value = true
  }
}

function copyApiKey() {
  if (newApiKey.value) {
    navigator.clipboard.writeText(newApiKey.value)
  }
}

onMounted(() => {
  if (currentOrgId.value) {
    fetchTenantConfig(currentOrgId.value)
  }
})
</script>

<template>
  <div class="tenant-config-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Configuracion del Tenant</h1>
        <p class="text-gray-500 mt-1">
          Personaliza el comportamiento del agente para tu organizacion
        </p>
      </div>
      <Button
        label="Guardar Cambios"
        icon="pi pi-save"
        @click="handleSave"
        :disabled="!hasChanges"
        :loading="isLoading"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !tenantConfig" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- No org selected -->
    <Card v-else-if="!currentOrgId">
      <template #content>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-building text-4xl mb-2" />
          <p>Selecciona una organizacion para configurar</p>
        </div>
      </template>
    </Card>

    <!-- Config form -->
    <Card v-else>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <div class="flex items-center gap-2">
                <i class="pi pi-palette" />
                <span>Branding</span>
              </div>
            </Tab>
            <Tab value="1">
              <div class="flex items-center gap-2">
                <i class="pi pi-android" />
                <span>Agente</span>
              </div>
            </Tab>
            <Tab value="2">
              <div class="flex items-center gap-2">
                <i class="pi pi-sliders-h" />
                <span>Limites</span>
              </div>
            </Tab>
            <Tab value="3">
              <div class="flex items-center gap-2">
                <i class="pi pi-link" />
                <span>Integracion</span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <!-- Branding Tab -->
            <TabPanel value="0">
              <div class="max-w-2xl space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Color primario
                    </label>
                    <div class="flex gap-2">
                      <ColorPicker v-model="formData.primary_color" />
                      <InputText v-model="formData.primary_color" placeholder="#3B82F6" class="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Color secundario
                    </label>
                    <div class="flex gap-2">
                      <ColorPicker v-model="formData.secondary_color" />
                      <InputText v-model="formData.secondary_color" placeholder="#10B981" class="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Agent Tab -->
            <TabPanel value="1">
              <div class="max-w-2xl space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del agente
                  </label>
                  <InputText
                    v-model="formData.agent_name"
                    placeholder="Ej: Asistente Virtual"
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Saludo inicial
                  </label>
                  <Textarea
                    v-model="formData.agent_greeting"
                    rows="2"
                    placeholder="Ej: Hola! Soy tu asistente virtual. Como puedo ayudarte hoy?"
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Personalidad
                  </label>
                  <Textarea
                    v-model="formData.agent_personality"
                    rows="3"
                    placeholder="Describe la personalidad del agente..."
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones del sistema
                  </label>
                  <Textarea
                    v-model="formData.agent_instructions"
                    rows="6"
                    placeholder="Instrucciones especificas para el comportamiento del agente..."
                    class="w-full font-mono text-sm"
                  />
                  <p class="text-xs text-gray-400 mt-1">
                    Estas instrucciones se añaden al prompt del sistema
                  </p>
                </div>
              </div>
            </TabPanel>

            <!-- Limits Tab -->
            <TabPanel value="2">
              <div class="max-w-2xl space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Mensajes diarios
                    </label>
                    <InputNumber
                      v-model="formData.daily_message_limit"
                      :min="0"
                      placeholder="Sin limite"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Max tokens contexto
                    </label>
                    <InputNumber
                      v-model="formData.max_context_tokens"
                      :min="100"
                      :max="128000"
                      placeholder="4096"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Max tokens respuesta
                    </label>
                    <InputNumber
                      v-model="formData.max_response_tokens"
                      :min="100"
                      :max="16000"
                      placeholder="2048"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Integration Tab -->
            <TabPanel value="3">
              <div class="max-w-2xl space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <InputText
                    v-model="formData.webhook_url"
                    placeholder="https://your-domain.com/webhook"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-400 mt-1">
                    URL donde se enviaran eventos del sistema
                  </p>
                </div>

                <Divider />

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div class="flex items-center gap-2">
                    <InputText
                      :value="tenantConfig?.api_key ? '••••••••••••••••' : 'No generada'"
                      disabled
                      class="flex-1"
                    />
                    <Button
                      label="Regenerar"
                      icon="pi pi-refresh"
                      severity="secondary"
                      @click="handleRegenerateApiKey"
                      :loading="isLoading"
                    />
                  </div>
                  <Message severity="warn" :closable="false" class="mt-2 text-sm">
                    Regenerar la API Key invalidara la anterior
                  </Message>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- API Key Dialog -->
    <Dialog
      v-model:visible="showApiKeyDialog"
      header="Nueva API Key"
      :modal="true"
      :style="{ width: '500px' }"
      :closable="false"
    >
      <Message severity="success" :closable="false">
        API Key generada exitosamente
      </Message>

      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tu nueva API Key:
        </label>
        <div class="flex gap-2">
          <InputText :value="newApiKey" readonly class="flex-1 font-mono" />
          <Button icon="pi pi-copy" severity="secondary" @click="copyApiKey" v-tooltip="'Copiar'" />
        </div>
        <p class="text-xs text-red-500 mt-2">
          Guarda esta clave ahora. No podras verla de nuevo.
        </p>
      </div>

      <template #footer>
        <Button label="Entendido" @click="showApiKeyDialog = false; newApiKey = null" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.tenant-config-page :deep(.p-card-content) {
  padding: 0;
}

.tenant-config-page :deep(.p-tabpanels) {
  padding: 1.5rem;
}
</style>
