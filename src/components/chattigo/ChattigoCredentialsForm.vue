<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import type {
  ChattigoCredentialCreateRequest,
  ChattigoCredentialUpdateRequest
} from '@/types/chattigoCredentials.types'
import { CHATTIGO_DEFAULTS, validateDID } from '@/types/chattigoCredentials.types'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Password from 'primevue/password'
import Message from 'primevue/message'
import ToggleSwitch from 'primevue/toggleswitch'

const store = useChattigoCredentialsStore()
const authStore = useAuthStore()
const toast = useToast()
const { createCredential, updateCredential, isLoading, closeCredentialDialog } =
  useChattigoCredentials()

// Form state
const formData = ref({
  did: '',
  name: '',
  username: '',
  password: '',
  login_url: '',
  base_url: '',
  bot_name: '',
  token_refresh_hours: CHATTIGO_DEFAULTS.TOKEN_REFRESH_HOURS,
  enabled: true
})

// Track if credentials have been modified (they come masked as ***)
const credentialsModified = ref({
  username: false,
  password: false
})

const isEditing = computed(() => store.editingCredential !== null)
const dialogTitle = computed(() =>
  isEditing.value ? 'Editar Credencial Chattigo' : 'Nueva Credencial Chattigo'
)

// Validation
const didError = computed(() => {
  if (!formData.value.did) return ''
  if (!validateDID(formData.value.did)) {
    return 'El DID debe tener entre 10 y 15 dígitos'
  }
  return ''
})

const canSave = computed(() => {
  // Basic validation
  if (!formData.value.name.trim()) return false
  if (!formData.value.did || !validateDID(formData.value.did)) return false

  // For create: username and password are required
  if (!isEditing.value) {
    if (!formData.value.username.trim()) return false
    if (!formData.value.password.trim()) return false
  }

  return true
})

// Watch for editing credential changes
watch(
  () => store.editingCredential,
  (credential) => {
    if (credential) {
      formData.value = {
        did: credential.did,
        name: credential.name,
        username: credential.username, // Will be "***"
        password: credential.password, // Will be "***"
        login_url: credential.login_url,
        base_url: credential.base_url,
        bot_name: credential.bot_name,
        token_refresh_hours: credential.token_refresh_hours,
        enabled: credential.enabled
      }
      // Reset credential modification tracking
      credentialsModified.value = {
        username: false,
        password: false
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  formData.value = {
    did: '',
    name: '',
    username: '',
    password: '',
    login_url: '',
    base_url: '',
    bot_name: '',
    token_refresh_hours: CHATTIGO_DEFAULTS.TOKEN_REFRESH_HOURS,
    enabled: true
  }
  credentialsModified.value = {
    username: false,
    password: false
  }
}

function onCredentialChange(field: 'username' | 'password') {
  credentialsModified.value[field] = true
}

async function copyToClipboard(text: string, fieldName: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'info',
      summary: 'Copiado',
      detail: `${fieldName} copiado al portapapeles`,
      life: 2000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo copiar al portapapeles',
      life: 3000
    })
  }
}

async function handleSubmit() {
  if (!canSave.value) return

  if (isEditing.value && store.editingCredential) {
    // Build update request - only include modified credentials
    const updateData: ChattigoCredentialUpdateRequest = {
      name: formData.value.name,
      login_url: formData.value.login_url || undefined,
      base_url: formData.value.base_url || undefined,
      bot_name: formData.value.bot_name || undefined,
      token_refresh_hours: formData.value.token_refresh_hours,
      enabled: formData.value.enabled
    }

    // Only include credentials if they were modified
    if (credentialsModified.value.username) {
      updateData.username = formData.value.username || undefined
    }
    if (credentialsModified.value.password) {
      updateData.password = formData.value.password || undefined
    }

    await updateCredential(store.editingCredential.did, updateData)
  } else {
    // Create request
    const currentOrgId = authStore.currentOrganization?.id
    if (!currentOrgId) {
      console.error('No organization selected')
      return
    }

    const createData: ChattigoCredentialCreateRequest = {
      did: formData.value.did,
      name: formData.value.name,
      username: formData.value.username,
      password: formData.value.password,
      login_url: formData.value.login_url || undefined,
      base_url: formData.value.base_url || undefined,
      bot_name: formData.value.bot_name || undefined,
      token_refresh_hours: formData.value.token_refresh_hours,
      enabled: formData.value.enabled,
      organization_id: currentOrgId
    }

    await createCredential(createData)
  }
}

function handleClose() {
  resetForm()
  closeCredentialDialog()
}
</script>

<template>
  <Dialog
    :visible="store.showCredentialDialog"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '550px' }"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Basic Info Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-whatsapp text-green-500" />
          Información Básica
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <!-- DID -->
          <div class="col-span-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              DID (Número WhatsApp) *
            </label>
            <InputText
              v-model="formData.did"
              placeholder="5492644710400"
              class="w-full"
              :disabled="isEditing"
              :class="{ 'p-invalid': didError }"
            />
            <small v-if="didError" class="text-red-500">{{ didError }}</small>
            <small v-else class="text-gray-500">10-15 dígitos, sin espacios ni guiones</small>
          </div>

          <!-- Name -->
          <div class="col-span-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1"> Nombre * </label>
            <InputText v-model="formData.name" placeholder="Turmedica" class="w-full" />
          </div>

          <!-- Bot Name -->
          <div class="col-span-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1"> Nombre del Bot </label>
            <InputText
              v-model="formData.bot_name"
              :placeholder="CHATTIGO_DEFAULTS.BOT_NAME"
              class="w-full"
            />
          </div>

          <!-- Enabled -->
          <div class="col-span-2 md:col-span-1 flex items-center gap-3 pt-6">
            <ToggleSwitch v-model="formData.enabled" />
            <label class="text-sm text-gray-700">Habilitado</label>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Credentials Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-lock text-orange-500" />
          Credenciales
        </h3>

        <Message v-if="isEditing" severity="info" :closable="false" class="mb-3">
          Las credenciales están enmascaradas. Solo se actualizarán si las modificas.
        </Message>

        <div class="grid grid-cols-2 gap-4">
          <!-- Username -->
          <div class="col-span-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Usuario {{ !isEditing ? '*' : '' }}
            </label>
            <Password
              v-model="formData.username"
              placeholder="Usuario Chattigo ISV"
              class="w-full"
              :feedback="false"
              toggleMask
              @input="onCredentialChange('username')"
            />
          </div>

          <!-- Password -->
          <div class="col-span-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {{ !isEditing ? '*' : '' }}
            </label>
            <Password
              v-model="formData.password"
              placeholder="Contraseña Chattigo ISV"
              class="w-full"
              :feedback="false"
              toggleMask
              @input="onCredentialChange('password')"
            />
          </div>
        </div>
      </div>

      <Divider />

      <!-- URLs Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-link text-blue-500" />
          URLs de Configuración
        </h3>

        <div class="space-y-4">
          <!-- Login URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> URL de Login </label>
            <div class="flex gap-2">
              <InputText
                v-model="formData.login_url"
                :placeholder="CHATTIGO_DEFAULTS.LOGIN_URL"
                class="flex-1 text-sm"
              />
              <Button
                icon="pi pi-copy"
                severity="secondary"
                v-tooltip.top="'Copiar URL'"
                @click="copyToClipboard(formData.login_url || CHATTIGO_DEFAULTS.LOGIN_URL, 'Login URL')"
              />
            </div>
          </div>

          <!-- Base URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> URL Base API </label>
            <div class="flex gap-2">
              <InputText
                v-model="formData.base_url"
                :placeholder="CHATTIGO_DEFAULTS.BASE_URL"
                class="flex-1 text-sm"
              />
              <Button
                icon="pi pi-copy"
                severity="secondary"
                v-tooltip.top="'Copiar URL'"
                @click="copyToClipboard(formData.base_url || CHATTIGO_DEFAULTS.BASE_URL, 'Base URL')"
              />
            </div>
            <small class="text-gray-500">Mensajes se envían a: {base_url}/v15.0/{did}/messages</small>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Advanced Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-cog text-gray-500" />
          Configuración Avanzada
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <!-- Token Refresh Hours -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Refresh de Token (horas)
            </label>
            <InputNumber
              v-model="formData.token_refresh_hours"
              :min="1"
              :max="24"
              class="w-full"
              showButtons
            />
            <small class="text-gray-500">Tokens expiran en 8h, refresh recomendado: 7h</small>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" :disabled="isLoading" @click="handleClose" />
      <Button
        :label="isEditing ? 'Actualizar' : 'Crear'"
        :icon="isEditing ? 'pi pi-check' : 'pi pi-plus'"
        :loading="isLoading"
        :disabled="!canSave"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>
