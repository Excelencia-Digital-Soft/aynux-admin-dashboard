<script setup lang="ts">
/**
 * ChattigoBspTab - Chattigo BSP integration settings.
 *
 * Credentials (username/password) are managed via the Secrets dialog.
 */

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ChattigoSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<ChattigoSettings>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Enabled Toggle -->
    <div class="flex items-center gap-3">
      <Switch
        id="chattigo_enabled"
        :checked="model.enabled"
        @update:checked="model.enabled = $event"
      />
      <label for="chattigo_enabled" class="text-sm font-medium text-foreground">
        Chattigo BSP habilitado
      </label>
    </div>

    <!-- DID -->
    <div>
      <label for="chattigo_did" class="block text-sm font-medium text-foreground mb-1">
        DID (Numero de telefono)
      </label>
      <Input
        id="chattigo_did"
        v-model="model.did"
        placeholder="ej: 5492644710400"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Numero de telefono de WhatsApp Business registrado en Chattigo (sin +).
      </p>
    </div>

    <!-- Template Name -->
    <div>
      <label for="chattigo_template" class="block text-sm font-medium text-foreground mb-1">
        Nombre de Template HSM
      </label>
      <Input
        id="chattigo_template"
        v-model="model.template_name"
        placeholder="ej: recordatorio_turno"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Nombre del template aprobado en Meta para mensajes salientes (HSM).
      </p>
    </div>

    <!-- Bot Name -->
    <div>
      <label for="chattigo_bot_name" class="block text-sm font-medium text-foreground mb-1">
        Nombre del Bot
      </label>
      <Input
        id="chattigo_bot_name"
        v-model="model.bot_name"
        placeholder="Aynux"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Nombre que identifica al bot en la plataforma Chattigo.
      </p>
    </div>

    <!-- URLs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="chattigo_login_url" class="block text-sm font-medium text-foreground mb-1">
          Login URL
        </label>
        <Input
          id="chattigo_login_url"
          v-model="model.login_url"
          placeholder="https://massive.chattigo.com/api-bot/login"
        />
      </div>
      <div>
        <label for="chattigo_base_url" class="block text-sm font-medium text-foreground mb-1">
          Base URL
        </label>
        <Input
          id="chattigo_base_url"
          v-model="model.base_url"
          placeholder="https://massive.chattigo.com"
        />
      </div>
    </div>

    <!-- Token Refresh Hours -->
    <div>
      <label for="chattigo_token_refresh" class="block text-sm font-medium text-foreground mb-1">
        Token Refresh (horas)
      </label>
      <Input
        id="chattigo_token_refresh"
        v-model.number="model.token_refresh_hours"
        type="number"
        min="1"
        max="7"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Cada cuantas horas se renueva el token de autenticacion (1-7).
      </p>
    </div>

    <!-- Info about credentials -->
    <Alert>
      <AlertDescription>
        <i class="pi pi-shield mr-2" />
        Las credenciales de Chattigo (usuario y contrasena) se configuran desde el boton
        "Credenciales" en la lista de instituciones. Se almacenan encriptadas y no se muestran.
      </AlertDescription>
    </Alert>

    <!-- Success message when configured -->
    <Alert v-if="model.did && model.template_name" variant="success">
      <AlertDescription>
        <i class="pi pi-check-circle mr-2" />
        Chattigo BSP configurado con DID {{ model.did }} y template "{{ model.template_name }}".
      </AlertDescription>
    </Alert>
  </div>
</template>
