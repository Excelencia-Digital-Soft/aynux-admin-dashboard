<script setup lang="ts">
/**
 * WhatsAppSettingsTab - WhatsApp Business API integration settings.
 */

import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import type { WhatsAppSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<WhatsAppSettings>({ required: true })
</script>

<template>
  <div class="whatsapp-settings-tab space-y-4">
    <Message severity="info" :closable="false">
      <i class="pi pi-info-circle mr-2" />
      Estos datos se obtienen de la configuracion de WhatsApp Business API en Meta Business Suite.
    </Message>

    <!-- Phone Number ID -->
    <div class="field">
      <label for="phone_number_id" class="block text-sm font-medium text-gray-700 mb-1">
        Phone Number ID
      </label>
      <InputText
        id="phone_number_id"
        v-model="model.phone_number_id"
        class="w-full"
        placeholder="ej: 123456789012345"
      />
      <small class="text-gray-500">
        ID del numero de telefono de WhatsApp Business. Se usa para routing de bypass.
      </small>
    </div>

    <!-- Business Account ID -->
    <div class="field">
      <label for="business_account_id" class="block text-sm font-medium text-gray-700 mb-1">
        Business Account ID
      </label>
      <InputText
        id="business_account_id"
        v-model="model.business_account_id"
        class="w-full"
        placeholder="ej: 987654321098765"
      />
      <small class="text-gray-500">
        ID de la cuenta de WhatsApp Business (WABA)
      </small>
    </div>

    <!-- Verify Token -->
    <div class="field">
      <label for="verify_token" class="block text-sm font-medium text-gray-700 mb-1">
        Verify Token
      </label>
      <InputText
        id="verify_token"
        v-model="model.verify_token"
        class="w-full"
        placeholder="Token de verificacion del webhook"
      />
      <small class="text-gray-500">
        Token usado para verificar el webhook de WhatsApp
      </small>
    </div>

    <Message v-if="model.phone_number_id" severity="success" :closable="false">
      <i class="pi pi-check-circle mr-2" />
      WhatsApp configurado. Los mensajes a este numero seran enrutados a esta institucion.
    </Message>
  </div>
</template>
