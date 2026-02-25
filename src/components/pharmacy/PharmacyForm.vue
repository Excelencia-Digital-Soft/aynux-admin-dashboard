<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import { useAuthStore } from '@/stores/auth.store'
import type {
  PharmacyConfigCreateRequest,
  PharmacyConfigUpdateRequest
} from '@/types/pharmacyConfig.types'
import { DEFAULT_PHARMACY_HOURS } from '@/types/pharmacyConfig.types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const store = usePharmacyStore()
const authStore = useAuthStore()
const { createPharmacy, updatePharmacy, isLoading, closePharmacyDialog } = usePharmacyConfig()

// Hours editor as array for easier editing
interface HourEntry {
  day: string
  hours: string
}

function hoursObjectToArray(obj: Record<string, string>): HourEntry[] {
  return Object.entries(obj).map(([day, hours]) => ({ day, hours }))
}

function hoursArrayToObject(arr: HourEntry[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const entry of arr) {
    if (entry.day.trim()) {
      result[entry.day.trim()] = entry.hours
    }
  }
  return result
}

// Hours array for UI editing
const hoursEntries = ref<HourEntry[]>(hoursObjectToArray(DEFAULT_PHARMACY_HOURS))

// Form state
const formData = ref({
  // Basic info
  pharmacy_name: '',
  pharmacy_address: '',
  pharmacy_phone: '',
  pharmacy_logo_path: '',

  // Contact and hours info
  pharmacy_email: '',
  pharmacy_website: '',
  pharmacy_hours: { ...DEFAULT_PHARMACY_HOURS } as Record<string, string>,
  pharmacy_is_24h: false,

  // WhatsApp
  whatsapp_phone_number: '',

  // Mercado Pago
  mp_enabled: false,
  mp_access_token: '',
  mp_public_key: '',
  mp_webhook_secret: '',
  mp_sandbox: true,
  mp_timeout: 30,
  mp_max_installments: 12,
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
      const hours = pharmacy.pharmacy_hours || { ...DEFAULT_PHARMACY_HOURS }
      formData.value = {
        pharmacy_name: pharmacy.pharmacy_name,
        pharmacy_address: pharmacy.pharmacy_address || '',
        pharmacy_phone: pharmacy.pharmacy_phone || '',
        pharmacy_logo_path: pharmacy.pharmacy_logo_path || '',
        pharmacy_email: pharmacy.pharmacy_email || '',
        pharmacy_website: pharmacy.pharmacy_website || '',
        pharmacy_hours: hours,
        pharmacy_is_24h: pharmacy.pharmacy_is_24h || false,
        whatsapp_phone_number: pharmacy.whatsapp_phone_number || '',
        mp_enabled: pharmacy.mp_enabled,
        mp_access_token: pharmacy.mp_access_token || '',
        mp_public_key: pharmacy.mp_public_key || '',
        mp_webhook_secret: pharmacy.mp_webhook_secret || '',
        mp_sandbox: pharmacy.mp_sandbox,
        mp_timeout: pharmacy.mp_timeout,
        mp_max_installments: pharmacy.mp_max_installments,
        mp_notification_url: pharmacy.mp_notification_url || '',
        receipt_public_url_base: pharmacy.receipt_public_url_base || ''
      }
      hoursEntries.value = hoursObjectToArray(hours)
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
    pharmacy_email: '',
    pharmacy_website: '',
    pharmacy_hours: { ...DEFAULT_PHARMACY_HOURS },
    pharmacy_is_24h: false,
    whatsapp_phone_number: '',
    mp_enabled: false,
    mp_access_token: '',
    mp_public_key: '',
    mp_webhook_secret: '',
    mp_sandbox: true,
    mp_timeout: 30,
    mp_max_installments: 12,
    mp_notification_url: '',
    receipt_public_url_base: ''
  }
  hoursEntries.value = hoursObjectToArray(DEFAULT_PHARMACY_HOURS)
  credentialsModified.value = {
    mp_access_token: false,
    mp_public_key: false,
    mp_webhook_secret: false
  }
}

function onCredentialChange(field: 'mp_access_token' | 'mp_public_key' | 'mp_webhook_secret') {
  credentialsModified.value[field] = true
}

function getValidHours(): Record<string, string> | undefined {
  if (formData.value.pharmacy_is_24h) return undefined
  const validEntries = hoursEntries.value.filter(
    (entry) => entry.day.trim() && entry.hours.trim()
  )
  if (validEntries.length === 0) return undefined
  return hoursArrayToObject(validEntries)
}

function addHourEntry() {
  hoursEntries.value.push({ day: '', hours: '' })
}

function removeHourEntry(index: number) {
  hoursEntries.value.splice(index, 1)
}

async function handleSubmit() {
  if (!canSave.value) return

  if (isEditing.value && store.editingPharmacy) {
    const updateData: PharmacyConfigUpdateRequest = {
      pharmacy_name: formData.value.pharmacy_name,
      pharmacy_address: formData.value.pharmacy_address || undefined,
      pharmacy_phone: formData.value.pharmacy_phone || undefined,
      pharmacy_logo_path: formData.value.pharmacy_logo_path || undefined,
      pharmacy_email: formData.value.pharmacy_email || undefined,
      pharmacy_website: formData.value.pharmacy_website || undefined,
      pharmacy_hours: getValidHours(),
      pharmacy_is_24h: formData.value.pharmacy_is_24h,
      whatsapp_phone_number: formData.value.whatsapp_phone_number || undefined,
      mp_enabled: formData.value.mp_enabled,
      mp_sandbox: formData.value.mp_sandbox,
      mp_timeout: formData.value.mp_timeout,
      mp_max_installments: formData.value.mp_max_installments,
      mp_notification_url: formData.value.mp_notification_url || undefined,
      receipt_public_url_base: formData.value.receipt_public_url_base || undefined
    }

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
      pharmacy_email: formData.value.pharmacy_email || undefined,
      pharmacy_website: formData.value.pharmacy_website || undefined,
      pharmacy_hours: getValidHours(),
      pharmacy_is_24h: formData.value.pharmacy_is_24h,
      whatsapp_phone_number: formData.value.whatsapp_phone_number || undefined,
      mp_enabled: formData.value.mp_enabled,
      mp_access_token: formData.value.mp_access_token || undefined,
      mp_public_key: formData.value.mp_public_key || undefined,
      mp_webhook_secret: formData.value.mp_webhook_secret || undefined,
      mp_sandbox: formData.value.mp_sandbox,
      mp_timeout: formData.value.mp_timeout,
      mp_max_installments: formData.value.mp_max_installments,
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

function handleOpenChange(open: boolean) {
  if (!open) handleClose()
}
</script>

<template>
  <Dialog :open="store.showPharmacyDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[600px] glass-dialog max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ isEditing ? 'Editar configuracion de farmacia' : 'Crear nueva configuracion de farmacia' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Basic Info Section -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <i class="pi pi-building" />
            Informacion Basica
          </h3>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Nombre de la Farmacia *
              </label>
              <Input
                v-model="formData.pharmacy_name"
                placeholder="Ej: Farmacia San Juan"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Direccion
              </label>
              <Textarea
                v-model="formData.pharmacy_address"
                :rows="2"
                placeholder="Direccion completa"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Telefono
                </label>
                <Input
                  v-model="formData.pharmacy_phone"
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Logo (URL)
                </label>
                <Input
                  v-model="formData.pharmacy_logo_path"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        <hr class="border-border" />

        <!-- Contact & Hours Section -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <i class="pi pi-clock" />
            Contacto y Horarios
          </h3>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <Input
                  v-model="formData.pharmacy_email"
                  placeholder="contacto@farmacia.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Sitio Web
                </label>
                <Input
                  v-model="formData.pharmacy_website"
                  placeholder="https://farmacia.com"
                />
              </div>
            </div>

            <!-- 24h Toggle -->
            <div class="flex items-center gap-3 py-2">
              <Switch
                :checked="formData.pharmacy_is_24h"
                @update:checked="formData.pharmacy_is_24h = $event"
              />
              <label class="text-sm font-medium text-foreground">
                Farmacia 24 horas
              </label>
            </div>

            <!-- Hours Editor (hidden if 24h) -->
            <div v-if="!formData.pharmacy_is_24h" class="space-y-2">
              <label class="block text-sm font-medium text-foreground mb-2">
                Horarios de Atencion
              </label>

              <div
                v-for="(entry, index) in hoursEntries"
                :key="index"
                class="flex items-center gap-2"
              >
                <Input
                  v-model="entry.day"
                  placeholder="lun-vie, sab, dom..."
                  class="w-28"
                />
                <span class="text-muted-foreground">:</span>
                <Input
                  v-model="entry.hours"
                  placeholder="08:00-20:00 o cerrado"
                  class="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  @click="removeHourEntry(index)"
                >
                  <i class="pi pi-times text-sm" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                @click="addHourEntry"
              >
                <i class="pi pi-plus mr-1" />
                Agregar horario
              </Button>

              <p class="text-xs text-muted-foreground mt-1">
                Formato: "08:00-20:00" o "cerrado". Dias: lun-vie, sab, dom, etc.
              </p>
            </div>

            <Alert v-if="formData.pharmacy_is_24h" variant="info">
              <AlertDescription>
                La farmacia esta configurada como 24 horas
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <hr class="border-border" />

        <!-- WhatsApp Section -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <i class="pi pi-whatsapp text-green-500" />
            WhatsApp Business
          </h3>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Numero de WhatsApp
            </label>
            <Input
              v-model="formData.whatsapp_phone_number"
              placeholder="Ej: 5491155667788 (sin + ni espacios)"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Numero utilizado para recibir mensajes vía webhook
            </p>
          </div>
        </div>

        <hr class="border-border" />

        <!-- Mercado Pago Section -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <i class="pi pi-credit-card text-blue-500" />
            Mercado Pago
          </h3>

          <!-- Enable toggle -->
          <div class="flex items-center gap-2 mb-4">
            <Checkbox
              id="mp_enabled"
              :checked="formData.mp_enabled"
              @update:checked="formData.mp_enabled = !!$event"
            />
            <label for="mp_enabled" class="text-sm font-medium text-foreground">
              Habilitar integracion con Mercado Pago
            </label>
          </div>

          <div v-if="formData.mp_enabled" class="space-y-4">
            <!-- Sandbox Mode -->
            <div class="flex items-center gap-2 mb-3">
              <Checkbox
                id="mp_sandbox"
                :checked="formData.mp_sandbox"
                @update:checked="formData.mp_sandbox = !!$event"
              />
              <label for="mp_sandbox" class="text-sm text-foreground">
                Modo Sandbox (pruebas)
              </label>
            </div>

            <Alert v-if="formData.mp_sandbox" variant="warning">
              <AlertDescription>
                Modo Sandbox activo - Los pagos no son reales
              </AlertDescription>
            </Alert>

            <!-- Credentials -->
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Access Token
                </label>
                <Input
                  v-model="formData.mp_access_token"
                  type="password"
                  placeholder="APP_USR-xxx..."
                  @input="onCredentialChange('mp_access_token')"
                />
                <p v-if="isEditing && !credentialsModified.mp_access_token" class="text-xs text-muted-foreground mt-1">
                  Dejar vacio para mantener el valor actual
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Public Key
                </label>
                <Input
                  v-model="formData.mp_public_key"
                  type="password"
                  placeholder="APP_USR-xxx..."
                  @input="onCredentialChange('mp_public_key')"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Webhook Secret
                </label>
                <Input
                  v-model="formData.mp_webhook_secret"
                  type="password"
                  placeholder="Secret para validar webhooks"
                  @input="onCredentialChange('mp_webhook_secret')"
                />
              </div>
            </div>

            <hr class="border-border" />

            <!-- URLs and Settings -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Timeout (segundos)
                </label>
                <Input
                  v-model.number="formData.mp_timeout"
                  type="number"
                  :min="5"
                  :max="120"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">
                  Cuotas Maximas
                </label>
                <Input
                  v-model.number="formData.mp_max_installments"
                  type="number"
                  :min="1"
                  :max="12"
                />
                <p class="text-xs text-muted-foreground mt-1">
                  1 = Pago unico (sin cuotas)
                </p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                URL de Notificaciones
              </label>
              <Input
                v-model="formData.mp_notification_url"
                placeholder="https://tu-dominio.com/webhook/mp"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                URL Base de Recibos
              </label>
              <Input
                v-model="formData.receipt_public_url_base"
                placeholder="https://tu-dominio.com/recibos"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="isLoading">
          Cancelar
        </Button>
        <Button @click="handleSubmit" :disabled="!canSave || isLoading">
          <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ isEditing ? 'Guardar' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
