<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import type {
  ChattigoCredentialCreateRequest,
  ChattigoCredentialUpdateRequest
} from '@/types/chattigoCredentials.types'
import { CHATTIGO_DEFAULTS, validateDID } from '@/types/chattigoCredentials.types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

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

// Password visibility toggles
const showUsername = ref(false)
const showPassword = ref(false)

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
    return 'El DID debe tener entre 10 y 15 digitos'
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
  showUsername.value = false
  showPassword.value = false
}

function onCredentialChange(field: 'username' | 'password') {
  credentialsModified.value[field] = true
}

async function copyToClipboard(text: string, fieldName: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.info(`${fieldName} copiado al portapapeles`, 'Copiado')
  } catch {
    toast.error('No se pudo copiar al portapapeles')
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
    :open="store.showCredentialDialog"
    @update:open="(val: boolean) => { if (!val) handleClose() }"
  >
    <DialogContent class="glass-dialog sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          Formulario para crear o editar credenciales de Chattigo
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Basic Info Section -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <i class="pi pi-whatsapp text-green-500" />
            Informacion Basica
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <!-- DID -->
            <div class="col-span-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DID (Numero WhatsApp) *
              </label>
              <Input
                v-model="formData.did"
                placeholder="5492644710400"
                :class="didError ? 'w-full border-destructive' : 'w-full'"
                :disabled="isEditing"
              />
              <small v-if="didError" class="text-destructive text-xs">{{ didError }}</small>
              <small v-else class="text-muted-foreground text-xs">10-15 digitos, sin espacios ni guiones</small>
            </div>

            <!-- Name -->
            <div class="col-span-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <Input v-model="formData.name" placeholder="Turmedica" class="w-full" />
            </div>

            <!-- Bot Name -->
            <div class="col-span-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Bot
              </label>
              <Input
                v-model="formData.bot_name"
                :placeholder="CHATTIGO_DEFAULTS.BOT_NAME"
                class="w-full"
              />
            </div>

            <!-- Enabled -->
            <div class="col-span-2 md:col-span-1 flex items-center gap-3 pt-6">
              <Switch
                :checked="formData.enabled"
                @update:checked="formData.enabled = $event"
              />
              <label class="text-sm text-gray-700 dark:text-gray-300">Habilitado</label>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Credentials Section -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <i class="pi pi-lock text-orange-500" />
            Credenciales
          </h3>

          <Alert v-if="isEditing" variant="info" class="mb-3">
            <AlertDescription>
              Las credenciales estan enmascaradas. Solo se actualizaran si las modificas.
            </AlertDescription>
          </Alert>

          <div class="grid grid-cols-2 gap-4">
            <!-- Username -->
            <div class="col-span-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario {{ !isEditing ? '*' : '' }}
              </label>
              <div class="relative">
                <Input
                  v-model="formData.username"
                  :type="showUsername ? 'text' : 'password'"
                  placeholder="Usuario Chattigo ISV"
                  class="w-full pr-10"
                  @input="onCredentialChange('username')"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  @click="showUsername = !showUsername"
                >
                  <i :class="showUsername ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-muted-foreground text-sm" />
                </Button>
              </div>
            </div>

            <!-- Password -->
            <div class="col-span-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contrasena {{ !isEditing ? '*' : '' }}
              </label>
              <div class="relative">
                <Input
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Contrasena Chattigo ISV"
                  class="w-full pr-10"
                  @input="onCredentialChange('password')"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-muted-foreground text-sm" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- URLs Section -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <i class="pi pi-link text-blue-500" />
            URLs de Configuracion
          </h3>

          <div class="space-y-4">
            <!-- Login URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL de Login
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="formData.login_url"
                  :placeholder="CHATTIGO_DEFAULTS.LOGIN_URL"
                  class="flex-1 text-sm"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="outline"
                        size="icon"
                        @click="copyToClipboard(formData.login_url || CHATTIGO_DEFAULTS.LOGIN_URL, 'Login URL')"
                      >
                        <i class="pi pi-copy text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copiar URL</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <!-- Base URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Base API
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="formData.base_url"
                  :placeholder="CHATTIGO_DEFAULTS.BASE_URL"
                  class="flex-1 text-sm"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="outline"
                        size="icon"
                        @click="copyToClipboard(formData.base_url || CHATTIGO_DEFAULTS.BASE_URL, 'Base URL')"
                      >
                        <i class="pi pi-copy text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copiar URL</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <small class="text-muted-foreground text-xs">
                Mensajes se envian a: {'{'}base_url{'}'}/v15.0/{'{'}did{'}'}/messages
              </small>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Advanced Section -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <i class="pi pi-cog text-gray-500 dark:text-gray-400" />
            Configuracion Avanzada
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <!-- Token Refresh Hours -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Refresh de Token (horas)
              </label>
              <Input
                v-model.number="formData.token_refresh_hours"
                type="number"
                :min="1"
                :max="24"
                class="w-full"
              />
              <small class="text-muted-foreground text-xs">
                Tokens expiran en 8h, refresh recomendado: 7h
              </small>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="handleClose">
          Cancelar
        </Button>
        <Button :disabled="!canSave || isLoading" @click="handleSubmit">
          <i v-if="isLoading" class="pi pi-spinner pi-spin mr-2" />
          <i v-else :class="isEditing ? 'pi pi-check mr-2' : 'pi pi-plus mr-2'" />
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
