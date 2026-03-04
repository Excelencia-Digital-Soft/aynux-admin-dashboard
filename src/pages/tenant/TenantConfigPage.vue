<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOrganization } from '@/composables/useOrganization'
import type { TenantConfigUpdateRequest } from '@/types/organization.types'
import {
  Save, Palette, Bot, SlidersHorizontal, Link, RefreshCw, Copy, Building
} from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import TenantAgentSelection from '@/components/tenant/TenantAgentSelection.vue'

const authStore = useAuthStore()
const {
  tenantConfig,
  isLoading,
  fetchTenantConfig,
  updateTenantConfig,
  regenerateApiKey
} = useOrganization()

const activeTab = ref('branding')
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

function handleNumberInput(field: 'daily_message_limit' | 'max_context_tokens' | 'max_response_tokens', event: Event) {
  const value = (event.target as HTMLInputElement).value
  formData.value[field] = value ? Number(value) : undefined
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
        <h1 class="text-2xl font-bold text-foreground">Configuracion del Tenant</h1>
        <p class="text-muted-foreground mt-1">
          Personaliza el comportamiento del agente para tu organizacion
        </p>
      </div>
      <Button
        @click="handleSave"
        :disabled="!hasChanges || isLoading"
      >
        <Save class="mr-2 h-4 w-4" />
        Guardar Cambios
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !tenantConfig" class="flex justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- No org selected -->
    <Card v-else-if="!currentOrgId">
      <CardContent class="p-6">
        <div class="text-center py-8 text-muted-foreground">
          <Building class="h-10 w-10 mx-auto mb-2" />
          <p>Selecciona una organizacion para configurar</p>
        </div>
      </CardContent>
    </Card>

    <!-- Config form -->
    <Card v-else>
      <CardContent class="p-0">
        <Tabs v-model="activeTab">
          <TabsList class="w-full justify-start rounded-none border-b bg-transparent px-4 pt-4">
            <TabsTrigger value="branding" class="gap-1.5">
              <Palette class="h-3.5 w-3.5" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="agent" class="gap-1.5">
              <Bot class="h-3.5 w-3.5" />
              Agente
            </TabsTrigger>
            <TabsTrigger value="limits" class="gap-1.5">
              <SlidersHorizontal class="h-3.5 w-3.5" />
              Limites
            </TabsTrigger>
            <TabsTrigger value="integration" class="gap-1.5">
              <Link class="h-3.5 w-3.5" />
              Integracion
            </TabsTrigger>
          </TabsList>

          <!-- Branding Tab -->
          <TabsContent value="branding" class="p-6">
            <div class="max-w-2xl space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1">
                    Color primario
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      :value="formData.primary_color || '#3B82F6'"
                      @input="(e) => { formData.primary_color = (e.target as HTMLInputElement).value }"
                      class="w-10 h-10 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
                    />
                    <Input v-model="formData.primary_color" placeholder="#3B82F6" class="flex-1" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1">
                    Color secundario
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      :value="formData.secondary_color || '#10B981'"
                      @input="(e) => { formData.secondary_color = (e.target as HTMLInputElement).value }"
                      class="w-10 h-10 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
                    />
                    <Input v-model="formData.secondary_color" placeholder="#10B981" class="flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <!-- Agent Tab -->
          <TabsContent value="agent" class="p-6">
            <div class="max-w-2xl space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Nombre del agente
                </label>
                <Input
                  v-model="formData.agent_name"
                  placeholder="Ej: Asistente Virtual"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
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
                <label class="block text-sm font-medium text-foreground mb-1">
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
                <label class="block text-sm font-medium text-foreground mb-1">
                  Instrucciones del sistema
                </label>
                <Textarea
                  v-model="formData.agent_instructions"
                  rows="6"
                  placeholder="Instrucciones especificas para el comportamiento del agente..."
                  class="w-full font-mono text-sm"
                />
                <p class="text-xs text-muted-foreground mt-1">
                  Estas instrucciones se añaden al prompt del sistema
                </p>
              </div>

              <Separator />

              <div class="mt-6">
                <h3 class="text-lg font-medium text-foreground mb-4">Agentes Habilitados</h3>
                <p class="text-sm text-muted-foreground mb-4">
                  Configura que agentes estan disponibles para esta organizacion
                </p>
                <TenantAgentSelection :org-id="currentOrgId!" />
              </div>
            </div>
          </TabsContent>

          <!-- Limits Tab -->
          <TabsContent value="limits" class="p-6">
            <div class="max-w-2xl space-y-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1">
                    Mensajes diarios
                  </label>
                  <Input
                    type="number"
                    :value="formData.daily_message_limit ?? ''"
                    @input="handleNumberInput('daily_message_limit', $event)"
                    min="0"
                    placeholder="Sin limite"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1">
                    Max tokens contexto
                  </label>
                  <Input
                    type="number"
                    :value="formData.max_context_tokens ?? ''"
                    @input="handleNumberInput('max_context_tokens', $event)"
                    min="100"
                    max="128000"
                    placeholder="4096"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1">
                    Max tokens respuesta
                  </label>
                  <Input
                    type="number"
                    :value="formData.max_response_tokens ?? ''"
                    @input="handleNumberInput('max_response_tokens', $event)"
                    min="100"
                    max="16000"
                    placeholder="2048"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <!-- Integration Tab -->
          <TabsContent value="integration" class="p-6">
            <div class="max-w-2xl space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Webhook URL
                </label>
                <Input
                  v-model="formData.webhook_url"
                  placeholder="https://your-domain.com/webhook"
                  class="w-full"
                />
                <p class="text-xs text-muted-foreground mt-1">
                  URL donde se enviaran eventos del sistema
                </p>
              </div>

              <Separator />

              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  API Key
                </label>
                <div class="flex items-center gap-2">
                  <Input
                    :value="tenantConfig?.api_key ? '••••••••••••••••' : 'No generada'"
                    disabled
                    class="flex-1"
                  />
                  <Button
                    variant="secondary"
                    @click="handleRegenerateApiKey"
                    :disabled="isLoading"
                  >
                    <RefreshCw class="mr-2 h-4 w-4" />
                    Regenerar
                  </Button>
                </div>
                <Alert variant="warning" class="mt-2">
                  <AlertDescription class="text-sm">
                    Regenerar la API Key invalidara la anterior
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <!-- API Key Dialog -->
    <Dialog v-model:open="showApiKeyDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva API Key</DialogTitle>
          <DialogDescription class="sr-only">Tu nueva API Key generada</DialogDescription>
        </DialogHeader>

        <Alert variant="success">
          <AlertDescription>API Key generada exitosamente</AlertDescription>
        </Alert>

        <div class="mt-4">
          <label class="block text-sm font-medium text-foreground mb-1">
            Tu nueva API Key:
          </label>
          <div class="flex gap-2">
            <Input :value="newApiKey ?? ''" readonly class="flex-1 font-mono" />
            <Button variant="secondary" size="icon" @click="copyApiKey" title="Copiar">
              <Copy class="h-4 w-4" />
            </Button>
          </div>
          <p class="text-xs text-destructive mt-2">
            Guarda esta clave ahora. No podras verla de nuevo.
          </p>
        </div>

        <DialogFooter>
          <Button @click="showApiKeyDialog = false; newApiKey = null">Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
