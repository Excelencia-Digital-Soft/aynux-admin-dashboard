<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import { useAuthStore } from '@/stores/auth.store'
import type {
  PharmacyConfigCreateRequest,
  PharmacyConfigUpdateRequest
} from '@/types/pharmacyConfig.types'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Password from 'primevue/password'
import Message from 'primevue/message'

const store = usePharmacyStore()
const authStore = useAuthStore()
const { createPharmacy, updatePharmacy, isLoading, closePharmacyDialog } = usePharmacyConfig()

// Form state
const formData = ref({
  // Basic info
  pharmacy_name: '',
  pharmacy_address: '',
  pharmacy_phone: '',
  pharmacy_logo_path: '',

  // WhatsApp
  whatsapp_phone_number: '',

  // Mercado Pago
  mp_enabled: false,
  mp_access_token: '',
  mp_public_key: '',
  mp_webhook_secret: '',
  mp_sandbox: true,
  mp_timeout: 30,
  mp_notification_url: '',
  receipt_public_url_base: ''
})

// Track if credentials have been modified (they come masked as ***)
const credentialsModified = ref({
  mp_access_token: false,
  mp_public_key: false,
  mp_webhook_secret: false
})

const isEditing = computed(() => store.editingPharmacy !== null)
const dialogTitle = computed(() =>
  isEditing.value ? 'Editar Configuracion de Farmacia' : 'Nueva Configuracion de Farmacia'
)

const canSave = computed(() => {
  return formData.value.pharmacy_name.trim().length >= 2
})

// Watch for editing pharmacy changes
watch(
  () => store.editingPharmacy,
  (pharmacy) => {
    if (pharmacy) {
      formData.value = {
        pharmacy_name: pharmacy.pharmacy_name,
        pharmacy_address: pharmacy.pharmacy_address || '',
        pharmacy_phone: pharmacy.pharmacy_phone || '',
        pharmacy_logo_path: pharmacy.pharmacy_logo_path || '',
        whatsapp_phone_number: pharmacy.whatsapp_phone_number || '',
        mp_enabled: pharmacy.mp_enabled,
        mp_access_token: pharmacy.mp_access_token || '',
        mp_public_key: pharmacy.mp_public_key || '',
        mp_webhook_secret: pharmacy.mp_webhook_secret || '',
        mp_sandbox: pharmacy.mp_sandbox,
        mp_timeout: pharmacy.mp_timeout,
        mp_notification_url: pharmacy.mp_notification_url || '',
        receipt_public_url_base: pharmacy.receipt_public_url_base || ''
      }
      // Reset credential modification tracking
      credentialsModified.value = {
        mp_access_token: false,
        mp_public_key: false,
        mp_webhook_secret: false
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  formData.value = {
    pharmacy_name: '',
    pharmacy_address: '',
    pharmacy_phone: '',
    pharmacy_logo_path: '',
    whatsapp_phone_number: '',
    mp_enabled: false,
    mp_access_token: '',
    mp_public_key: '',
    mp_webhook_secret: '',
    mp_sandbox: true,
    mp_timeout: 30,
    mp_notification_url: '',
    receipt_public_url_base: ''
  }
  credentialsModified.value = {
    mp_access_token: false,
    mp_public_key: false,
    mp_webhook_secret: false
  }
}

function onCredentialChange(field: 'mp_access_token' | 'mp_public_key' | 'mp_webhook_secret') {
  credentialsModified.value[field] = true
}

async function handleSubmit() {
  if (!canSave.value) return

  if (isEditing.value && store.editingPharmacy) {
    // Build update request - only include modified credentials
    const updateData: PharmacyConfigUpdateRequest = {
      pharmacy_name: formData.value.pharmacy_name,
      pharmacy_address: formData.value.pharmacy_address || undefined,
      pharmacy_phone: formData.value.pharmacy_phone || undefined,
      pharmacy_logo_path: formData.value.pharmacy_logo_path || undefined,
      whatsapp_phone_number: formData.value.whatsapp_phone_number || undefined,
      mp_enabled: formData.value.mp_enabled,
      mp_sandbox: formData.value.mp_sandbox,
      mp_timeout: formData.value.mp_timeout,
      mp_notification_url: formData.value.mp_notification_url || undefined,
      receipt_public_url_base: formData.value.receipt_public_url_base || undefined
    }

    // Only include credentials if they were modified
    if (credentialsModified.value.mp_access_token) {
      updateData.mp_access_token = formData.value.mp_access_token || undefined
    }
    if (credentialsModified.value.mp_public_key) {
      updateData.mp_public_key = formData.value.mp_public_key || undefined
    }
    if (credentialsModified.value.mp_webhook_secret) {
      updateData.mp_webhook_secret = formData.value.mp_webhook_secret || undefined
    }

    await updatePharmacy(store.editingPharmacy.id, updateData)
  } else {
    // Create request
    const currentOrgId = authStore.currentOrganization?.id
    if (!currentOrgId) {
      console.error('No organization selected')
      return
    }

    const createData: PharmacyConfigCreateRequest = {
      organization_id: currentOrgId,
      pharmacy_name: formData.value.pharmacy_name,
      pharmacy_address: formData.value.pharmacy_address || undefined,
      pharmacy_phone: formData.value.pharmacy_phone || undefined,
      pharmacy_logo_path: formData.value.pharmacy_logo_path || undefined,
      whatsapp_phone_number: formData.value.whatsapp_phone_number || undefined,
      mp_enabled: formData.value.mp_enabled,
      mp_access_token: formData.value.mp_access_token || undefined,
      mp_public_key: formData.value.mp_public_key || undefined,
      mp_webhook_secret: formData.value.mp_webhook_secret || undefined,
      mp_sandbox: formData.value.mp_sandbox,
      mp_timeout: formData.value.mp_timeout,
      mp_notification_url: formData.value.mp_notification_url || undefined,
      receipt_public_url_base: formData.value.receipt_public_url_base || undefined
    }

    await createPharmacy(createData)
  }
}

function handleClose() {
  resetForm()
  closePharmacyDialog()
}
</script>

<template>
  <Dialog
    :visible="store.showPharmacyDialog"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '600px' }"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Basic Info Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-building" />
          Informacion Basica
        </h3>

        <div class="space-y-3">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Farmacia *
            </label>
            <InputText
              v-model="formData.pharmacy_name"
              placeholder="Ej: Farmacia San Juan"
              class="w-full"
            />
          </div>

          <!-- Address -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Direccion
            </label>
            <Textarea
              v-model="formData.pharmacy_address"
              rows="2"
              placeholder="Direccion completa"
              class="w-full"
            />
          </div>

          <!-- Phone and Logo -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Telefono
              </label>
              <InputText
                v-model="formData.pharmacy_phone"
                placeholder="Ej: +54 9 11 1234-5678"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Logo (URL)
              </label>
              <InputText
                v-model="formData.pharmacy_logo_path"
                placeholder="https://..."
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- WhatsApp Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-whatsapp text-green-500" />
          WhatsApp Business
        </h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Numero de WhatsApp
          </label>
          <InputText
            v-model="formData.whatsapp_phone_number"
            placeholder="Ej: 5491155667788 (sin + ni espacios)"
            class="w-full"
          />
          <p class="text-xs text-gray-400 mt-1">
            Numero utilizado para recibir mensajes vía webhook
          </p>
        </div>
      </div>

      <Divider />

      <!-- Mercado Pago Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="pi pi-credit-card text-blue-500" />
          Mercado Pago
        </h3>

        <!-- Enable toggle -->
        <div class="flex items-center gap-2 mb-4">
          <Checkbox v-model="formData.mp_enabled" :binary="true" inputId="mp_enabled" />
          <label for="mp_enabled" class="text-sm font-medium">
            Habilitar integracion con Mercado Pago
          </label>
        </div>

        <div v-if="formData.mp_enabled" class="space-y-4">
          <!-- Sandbox Mode Warning -->
          <div class="flex items-center gap-2 mb-3">
            <Checkbox v-model="formData.mp_sandbox" :binary="true" inputId="mp_sandbox" />
            <label for="mp_sandbox" class="text-sm">
              Modo Sandbox (pruebas)
            </label>
          </div>

          <Message v-if="formData.mp_sandbox" severity="warn" :closable="false">
            Modo Sandbox activo - Los pagos no son reales
          </Message>

          <!-- Credentials -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <Password
                v-model="formData.mp_access_token"
                :feedback="false"
                toggleMask
                placeholder="APP_USR-xxx..."
                class="w-full"
                inputClass="w-full"
                @input="onCredentialChange('mp_access_token')"
              />
              <p v-if="isEditing && !credentialsModified.mp_access_token" class="text-xs text-gray-400 mt-1">
                Dejar vacio para mantener el valor actual
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Public Key
              </label>
              <Password
                v-model="formData.mp_public_key"
                :feedback="false"
                toggleMask
                placeholder="APP_USR-xxx..."
                class="w-full"
                inputClass="w-full"
                @input="onCredentialChange('mp_public_key')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret
              </label>
              <Password
                v-model="formData.mp_webhook_secret"
                :feedback="false"
                toggleMask
                placeholder="Secret para validar webhooks"
                class="w-full"
                inputClass="w-full"
                @input="onCredentialChange('mp_webhook_secret')"
              />
            </div>
          </div>

          <Divider />

          <!-- URLs and Settings -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Timeout (segundos)
              </label>
              <InputNumber
                v-model="formData.mp_timeout"
                :min="5"
                :max="120"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              URL de Notificaciones
            </label>
            <InputText
              v-model="formData.mp_notification_url"
              placeholder="https://tu-dominio.com/webhook/mp"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              URL Base de Recibos
            </label>
            <InputText
              v-model="formData.receipt_public_url_base"
              placeholder="https://tu-dominio.com/recibos"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        @click="handleClose"
        :disabled="isLoading"
      />
      <Button
        :label="isEditing ? 'Guardar' : 'Crear'"
        icon="pi pi-check"
        @click="handleSubmit"
        :disabled="!canSave"
        :loading="isLoading"
      />
    </template>
  </Dialog>
</template>
