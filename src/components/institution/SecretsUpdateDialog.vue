<script setup lang="ts">
/**
 * SecretsUpdateDialog - Dialog for updating encrypted credentials.
 *
 * This is a write-only operation. Secrets are never returned from the API.
 */

import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Password from 'primevue/password'
import Message from 'primevue/message'
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

// ============================================================
// Computed
// ============================================================

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const authType = computed(() => props.config?.settings?.auth?.type || 'none')

const showApiKey = computed(() => authType.value === 'api_key')
const showPassword = computed(() =>
  authType.value === 'basic' || authType.value === 'soap_wss'
)
const showClientSecret = computed(() => authType.value === 'oauth2')

const canSave = computed(() => {
  // At least one field must have a value
  return apiKey.value.trim() || password.value.trim() || clientSecret.value.trim()
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

  emit('save', secrets)
}

function handleClose() {
  dialogVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="`Credenciales - ${institutionName}`"
    :modal="true"
    :closable="!loading"
    :style="{ width: '450px' }"
    class="secrets-update-dialog"
  >
    <div class="space-y-4">
      <Message severity="info" :closable="false">
        <i class="pi pi-shield mr-2" />
        Las credenciales se almacenan encriptadas y nunca se muestran.
      </Message>

      <!-- API Key -->
      <div v-if="showApiKey" class="field">
        <label for="api_key" class="block text-sm font-medium text-gray-700 mb-1">
          API Key
        </label>
        <Password
          id="api_key"
          v-model="apiKey"
          class="w-full"
          :feedback="false"
          toggleMask
          placeholder="Ingrese el API Key"
        />
        <small v-if="config?.has_secrets" class="text-green-600">
          <i class="pi pi-check mr-1" />
          Credencial existente. Dejar vacio para mantener la actual.
        </small>
      </div>

      <!-- Password (Basic Auth / SOAP WSS) -->
      <div v-if="showPassword" class="field">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          {{ authType === 'soap_wss' ? 'Password WS-Security' : 'Password' }}
        </label>
        <Password
          id="password"
          v-model="password"
          class="w-full"
          :feedback="false"
          toggleMask
          placeholder="Ingrese la contrasena"
        />
        <small v-if="config?.has_secrets" class="text-green-600">
          <i class="pi pi-check mr-1" />
          Credencial existente. Dejar vacio para mantener la actual.
        </small>
      </div>

      <!-- Client Secret (OAuth2) -->
      <div v-if="showClientSecret" class="field">
        <label for="client_secret" class="block text-sm font-medium text-gray-700 mb-1">
          Client Secret
        </label>
        <Password
          id="client_secret"
          v-model="clientSecret"
          class="w-full"
          :feedback="false"
          toggleMask
          placeholder="Ingrese el Client Secret"
        />
        <small v-if="config?.has_secrets" class="text-green-600">
          <i class="pi pi-check mr-1" />
          Credencial existente. Dejar vacio para mantener la actual.
        </small>
      </div>

      <!-- No auth configured -->
      <div v-if="authType === 'none'" class="flex flex-col gap-3">
        <Message severity="warn" :closable="false">
          Esta institucion no tiene autenticacion configurada.
          Primero configure el tipo de autenticacion en la seccion "Autenticacion".
        </Message>
        <Button
          label="Configurar Autenticacion"
          icon="pi pi-cog"
          outlined
          size="small"
          @click="emit('configure-auth')"
        />
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="handleClose"
          :disabled="loading"
        />
        <Button
          label="Guardar Credenciales"
          icon="pi pi-lock"
          @click="handleSave"
          :loading="loading"
          :disabled="!canSave || authType === 'none'"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.secrets-update-dialog :deep(.p-password) {
  width: 100%;
}

.secrets-update-dialog :deep(.p-password input) {
  width: 100%;
}
</style>
