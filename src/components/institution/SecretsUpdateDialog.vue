<script setup lang="ts">
/**
 * SecretsUpdateDialog - Dialog for updating encrypted credentials.
 *
 * This is a write-only operation. Secrets are never returned from the API.
 *
 * Migrated to shadcn-vue components.
 */

import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type {
  TenantInstitutionConfig,
  InstitutionConfigSecretsRequest
} from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  visible: boolean
  config?: TenantInstitutionConfig | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: null,
  loading: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [secrets: InstitutionConfigSecretsRequest]
  'configure-auth': []
}>()

// ============================================================
// State
// ============================================================

const apiKey = ref('')
const password = ref('')
const clientSecret = ref('')
const chattigoUsername = ref('')
const chattigoPassword = ref('')
const showApiKey = ref(false)
const showPassword = ref(false)
const showClientSecret = ref(false)
const showChattigoUsername = ref(false)
const showChattigoPassword = ref(false)

// ============================================================
// Computed
// ============================================================

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const authType = computed(() => props.config?.settings?.auth?.type || 'none')

const showApiKeyField = computed(() => authType.value === 'api_key')
const showPasswordField = computed(() =>
  authType.value === 'basic' || authType.value === 'soap_wss'
)
const showClientSecretField = computed(() => authType.value === 'oauth2')

const hasChattigoConfig = computed(() => {
  const chattigo = props.config?.settings?.chattigo
  return chattigo?.did && chattigo?.enabled
})

const canSave = computed(() => {
  return (
    apiKey.value.trim() ||
    password.value.trim() ||
    clientSecret.value.trim() ||
    chattigoUsername.value.trim() ||
    chattigoPassword.value.trim()
  )
})

const institutionName = computed(() =>
  props.config?.institution_name || 'Institucion'
)

// ============================================================
// Watchers
// ============================================================

watch(dialogVisible, (visible) => {
  if (visible) {
    // Clear form when dialog opens
    apiKey.value = ''
    password.value = ''
    clientSecret.value = ''
    chattigoUsername.value = ''
    chattigoPassword.value = ''
    showApiKey.value = false
    showPassword.value = false
    showClientSecret.value = false
    showChattigoUsername.value = false
    showChattigoPassword.value = false
  }
})

// ============================================================
// Methods
// ============================================================

function handleSave() {
  if (!canSave.value) return

  const secrets: InstitutionConfigSecretsRequest = {}

  if (apiKey.value.trim()) {
    secrets.api_key = apiKey.value.trim()
  }
  if (password.value.trim()) {
    secrets.password = password.value.trim()
  }
  if (clientSecret.value.trim()) {
    secrets.client_secret = clientSecret.value.trim()
  }
  if (chattigoUsername.value.trim()) {
    secrets.chattigo_username = chattigoUsername.value.trim()
  }
  if (chattigoPassword.value.trim()) {
    secrets.chattigo_password = chattigoPassword.value.trim()
  }

  emit('save', secrets)
}

function handleClose() {
  dialogVisible.value = false
}
</script>

<template>
  <Dialog :open="dialogVisible" @update:open="(val) => dialogVisible = val">
    <DialogContent class="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle>Credenciales - {{ institutionName }}</DialogTitle>
        <DialogDescription class="sr-only">
          Actualizar credenciales de autenticacion para esta institucion
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <Alert variant="info">
          <i class="pi pi-shield" />
          <AlertDescription>
            Las credenciales se almacenan encriptadas y nunca se muestran.
          </AlertDescription>
        </Alert>

        <!-- API Key -->
        <div v-if="showApiKeyField" class="space-y-2">
          <Label for="api_key">API Key</Label>
          <div class="relative">
            <Input
              id="api_key"
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="Ingrese el API Key"
              class="pr-10"
            />
            <button
              type="button"
              @click="showApiKey = !showApiKey"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <i :class="showApiKey ? 'pi pi-eye-slash' : 'pi pi-eye'" />
            </button>
          </div>
          <p v-if="config?.has_secrets" class="text-sm text-green-600">
            <i class="pi pi-check mr-1" />
            Credencial existente. Dejar vacio para mantener la actual.
          </p>
        </div>

        <!-- Password (Basic Auth / SOAP WSS) -->
        <div v-if="showPasswordField" class="space-y-2">
          <Label for="password">
            {{ authType === 'soap_wss' ? 'Password WS-Security' : 'Password' }}
          </Label>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ingrese la contrasena"
              class="pr-10"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
            </button>
          </div>
          <p v-if="config?.has_secrets" class="text-sm text-green-600">
            <i class="pi pi-check mr-1" />
            Credencial existente. Dejar vacio para mantener la actual.
          </p>
        </div>

        <!-- Client Secret (OAuth2) -->
        <div v-if="showClientSecretField" class="space-y-2">
          <Label for="client_secret">Client Secret</Label>
          <div class="relative">
            <Input
              id="client_secret"
              v-model="clientSecret"
              :type="showClientSecret ? 'text' : 'password'"
              placeholder="Ingrese el Client Secret"
              class="pr-10"
            />
            <button
              type="button"
              @click="showClientSecret = !showClientSecret"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <i :class="showClientSecret ? 'pi pi-eye-slash' : 'pi pi-eye'" />
            </button>
          </div>
          <p v-if="config?.has_secrets" class="text-sm text-green-600">
            <i class="pi pi-check mr-1" />
            Credencial existente. Dejar vacio para mantener la actual.
          </p>
        </div>

        <!-- Chattigo BSP Credentials -->
        <div v-if="hasChattigoConfig" class="space-y-3">
          <div class="border-t pt-3">
            <h4 class="text-sm font-semibold text-foreground mb-2">
              <i class="pi pi-comments mr-1" />
              Credenciales Chattigo BSP
            </h4>
          </div>

          <!-- Chattigo Username -->
          <div class="space-y-2">
            <Label for="chattigo_username">Usuario Chattigo BSP</Label>
            <div class="relative">
              <Input
                id="chattigo_username"
                v-model="chattigoUsername"
                :type="showChattigoUsername ? 'text' : 'password'"
                placeholder="Ingrese el usuario BSP"
                class="pr-10"
              />
              <button
                type="button"
                @click="showChattigoUsername = !showChattigoUsername"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <i :class="showChattigoUsername ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </button>
            </div>
          </div>

          <!-- Chattigo Password -->
          <div class="space-y-2">
            <Label for="chattigo_password">Contrasena Chattigo BSP</Label>
            <div class="relative">
              <Input
                id="chattigo_password"
                v-model="chattigoPassword"
                :type="showChattigoPassword ? 'text' : 'password'"
                placeholder="Ingrese la contrasena BSP"
                class="pr-10"
              />
              <button
                type="button"
                @click="showChattigoPassword = !showChattigoPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <i :class="showChattigoPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </button>
            </div>
          </div>

          <p v-if="config?.has_secrets" class="text-sm text-green-600">
            <i class="pi pi-check mr-1" />
            Credencial existente. Dejar vacio para mantener la actual.
          </p>
        </div>

        <!-- No auth configured -->
        <div v-if="authType === 'none' && !hasChattigoConfig" class="flex flex-col gap-3">
          <Alert variant="warning">
            <i class="pi pi-exclamation-triangle" />
            <AlertDescription>
              Esta institucion no tiene autenticacion ni Chattigo configurado.
              Configure autenticacion en la seccion "Auth" o Chattigo en la seccion "Chattigo".
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            @click="emit('configure-auth')"
          >
            <i class="pi pi-cog mr-2" />
            Configurar Autenticacion
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          @click="handleClose"
          :disabled="loading"
        >
          Cancelar
        </Button>
        <Button
          @click="handleSave"
          :loading="loading"
          :disabled="!canSave || (authType === 'none' && !hasChattigoConfig)"
        >
          <i class="pi pi-lock mr-2" />
          Guardar Credenciales
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
