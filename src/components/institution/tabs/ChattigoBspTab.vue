<script setup lang="ts">
/**
 * ChattigoBspTab - Chattigo BSP integration settings.
 *
 * Credentials (username/password) are managed via the Secrets dialog.
 */

import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import type { ChattigoSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<ChattigoSettings>({ required: true })
</script>

<template>
  <div class="chattigo-bsp-tab space-y-4">
    <!-- Enabled Toggle -->
    <div class="flex items-center gap-3">
      <ToggleSwitch v-model="model.enabled" inputId="chattigo_enabled" />
      <label for="chattigo_enabled" class="text-sm font-medium text-gray-700">
        Chattigo BSP habilitado
      </label>
    </div>

    <!-- DID -->
    <div class="field">
      <label for="chattigo_did" class="block text-sm font-medium text-gray-700 mb-1">
        DID (Numero de telefono)
      </label>
      <InputText
        id="chattigo_did"
        v-model="model.did"
        class="w-full"
        placeholder="ej: 5492644710400"
      />
      <small class="text-gray-500">
        Numero de telefono de WhatsApp Business registrado en Chattigo (sin +).
      </small>
    </div>

    <!-- Template Name -->
    <div class="field">
      <label for="chattigo_template" class="block text-sm font-medium text-gray-700 mb-1">
        Nombre de Template HSM
      </label>
      <InputText
        id="chattigo_template"
        v-model="model.template_name"
        class="w-full"
        placeholder="ej: recordatorio_turno"
      />
      <small class="text-gray-500">
        Nombre del template aprobado en Meta para mensajes salientes (HSM).
      </small>
    </div>

    <!-- Bot Name -->
    <div class="field">
      <label for="chattigo_bot_name" class="block text-sm font-medium text-gray-700 mb-1">
        Nombre del Bot
      </label>
      <InputText
        id="chattigo_bot_name"
        v-model="model.bot_name"
        class="w-full"
        placeholder="Aynux"
      />
      <small class="text-gray-500">
        Nombre que identifica al bot en la plataforma Chattigo.
      </small>
    </div>

    <!-- URLs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="field">
        <label for="chattigo_login_url" class="block text-sm font-medium text-gray-700 mb-1">
          Login URL
        </label>
        <InputText
          id="chattigo_login_url"
          v-model="model.login_url"
          class="w-full"
          placeholder="https://massive.chattigo.com/api-bot/login"
        />
      </div>
      <div class="field">
        <label for="chattigo_base_url" class="block text-sm font-medium text-gray-700 mb-1">
          Base URL
        </label>
        <InputText
          id="chattigo_base_url"
          v-model="model.base_url"
          class="w-full"
          placeholder="https://massive.chattigo.com"
        />
      </div>
    </div>

    <!-- Token Refresh Hours -->
    <div class="field">
      <label for="chattigo_token_refresh" class="block text-sm font-medium text-gray-700 mb-1">
        Token Refresh (horas)
      </label>
      <InputNumber
        id="chattigo_token_refresh"
        v-model="model.token_refresh_hours"
        :min="1"
        :max="7"
        showButtons
        class="w-full"
      />
      <small class="text-gray-500">
        Cada cuantas horas se renueva el token de autenticacion (1-7).
      </small>
    </div>

    <!-- Info about credentials -->
    <Message severity="info" :closable="false">
      <i class="pi pi-shield mr-2" />
      Las credenciales de Chattigo (usuario y contrasena) se configuran desde el boton
      "Credenciales" en la lista de instituciones. Se almacenan encriptadas y no se muestran.
    </Message>

    <!-- Success message when configured -->
    <Message v-if="model.did && model.template_name" severity="success" :closable="false">
      <i class="pi pi-check-circle mr-2" />
      Chattigo BSP configurado con DID {{ model.did }} y template "{{ model.template_name }}".
    </Message>
  </div>
</template>
