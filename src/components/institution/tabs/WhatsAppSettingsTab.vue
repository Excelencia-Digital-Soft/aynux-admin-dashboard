<script setup lang="ts">
/**
 * WhatsAppSettingsTab - WhatsApp Business API integration settings.
 */

import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { WhatsAppSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<WhatsAppSettings>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <Alert>
      <AlertDescription>
        <i class="pi pi-info-circle mr-2" />
        Estos datos se obtienen de la configuracion de WhatsApp Business API en Meta Business Suite.
      </AlertDescription>
    </Alert>

    <!-- Phone Number ID -->
    <div>
      <label for="phone_number_id" class="block text-sm font-medium text-foreground mb-1">
        Phone Number ID
      </label>
      <Input
        id="phone_number_id"
        v-model="model.phone_number_id"
        placeholder="ej: 123456789012345"
      />
      <p class="text-xs text-muted-foreground mt-1">
        ID del numero de telefono de WhatsApp Business. Se usa para routing de bypass.
      </p>
    </div>

    <!-- Business Account ID -->
    <div>
      <label for="business_account_id" class="block text-sm font-medium text-foreground mb-1">
        Business Account ID
      </label>
      <Input
        id="business_account_id"
        v-model="model.business_account_id"
        placeholder="ej: 987654321098765"
      />
      <p class="text-xs text-muted-foreground mt-1">
        ID de la cuenta de WhatsApp Business (WABA)
      </p>
    </div>

    <!-- Verify Token -->
    <div>
      <label for="verify_token" class="block text-sm font-medium text-foreground mb-1">
        Verify Token
      </label>
      <Input
        id="verify_token"
        v-model="model.verify_token"
        placeholder="Token de verificacion del webhook"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Token usado para verificar el webhook de WhatsApp
      </p>
    </div>

    <Alert v-if="model.phone_number_id" variant="success">
      <AlertDescription>
        <i class="pi pi-check-circle mr-2" />
        WhatsApp configurado. Los mensajes a este numero seran enrutados a esta institucion.
      </AlertDescription>
    </Alert>
  </div>
</template>
