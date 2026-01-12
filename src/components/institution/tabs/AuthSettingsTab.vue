<script setup lang="ts">
/**
 * AuthSettingsTab - Dynamic authentication configuration.
 *
 * Shows different fields based on selected auth type.
 * NOTE: Actual credentials (passwords, keys) are managed via SecretsUpdateDialog.
 */

import { computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Chips from 'primevue/chips'
import Message from 'primevue/message'
import type { AuthSettings, AuthType } from '@/types/tenantInstitutionConfig.types'
import { AUTH_TYPES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<AuthSettings>({ required: true })

// ============================================================
// Computed
// ============================================================

const authType = computed({
  get: () => model.value.type,
  set: (newType: AuthType) => {
    // Reset to base structure when type changes
    switch (newType) {
      case 'none':
        model.value = { type: 'none' }
        break
      case 'api_key':
        model.value = {
          type: 'api_key',
          header_name: 'X-API-Key',
          prefix: ''
        }
        break
      case 'basic':
        model.value = {
          type: 'basic',
          username: ''
        }
        break
      case 'oauth2':
        model.value = {
          type: 'oauth2',
          token_url: '',
          client_id: '',
          scopes: [],
          grant_type: 'client_credentials'
        }
        break
      case 'soap_wss':
        model.value = {
          type: 'soap_wss',
          username: '',
          password_type: 'PasswordText',
          must_understand: true
        }
        break
    }
  }
})

// Type guards for template
const isApiKey = computed(() => model.value.type === 'api_key')
const isBasic = computed(() => model.value.type === 'basic')
const isOAuth2 = computed(() => model.value.type === 'oauth2')
const isSoapWss = computed(() => model.value.type === 'soap_wss')

// OAuth2 grant types
const grantTypes = [
  { label: 'Client Credentials', value: 'client_credentials' },
  { label: 'Password', value: 'password' },
  { label: 'Authorization Code', value: 'authorization_code' }
]

// SOAP password types
const passwordTypes = [
  { label: 'Password Text', value: 'PasswordText' },
  { label: 'Password Digest', value: 'PasswordDigest' }
]
</script>

<template>
  <div class="auth-settings-tab space-y-4">
    <!-- Auth Type Selector -->
    <div class="field">
      <label for="auth_type" class="block text-sm font-medium text-gray-700 mb-1">
        Tipo de Autenticacion
      </label>
      <Select
        id="auth_type"
        v-model="authType"
        :options="AUTH_TYPES"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        placeholder="Seleccionar tipo"
      />
    </div>

    <!-- No Auth -->
    <Message v-if="model.type === 'none'" severity="info" :closable="false">
      No se requiere autenticacion para este servicio.
    </Message>

    <!-- API Key Fields -->
    <template v-if="isApiKey && model.type === 'api_key'">
      <div class="field">
        <label for="header_name" class="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Header
        </label>
        <InputText
          id="header_name"
          v-model="model.header_name"
          class="w-full"
          placeholder="ej: X-API-Key, Authorization"
        />
      </div>

      <div class="field">
        <label for="prefix" class="block text-sm font-medium text-gray-700 mb-1">
          Prefijo (opcional)
        </label>
        <InputText
          id="prefix"
          v-model="model.prefix"
          class="w-full"
          placeholder="ej: Bearer , Api-Key "
        />
        <small class="text-gray-500">
          Prefijo a agregar antes del API key (incluir espacio si es necesario)
        </small>
      </div>

      <Message severity="warn" :closable="false">
        <i class="pi pi-key mr-2" />
        El API Key se configura desde el boton "Credenciales" de la tabla.
      </Message>
    </template>

    <!-- Basic Auth Fields -->
    <template v-if="isBasic && model.type === 'basic'">
      <div class="field">
        <label for="basic_username" class="block text-sm font-medium text-gray-700 mb-1">
          Usuario
        </label>
        <InputText
          id="basic_username"
          v-model="model.username"
          class="w-full"
          placeholder="Username para autenticacion"
        />
      </div>

      <Message severity="warn" :closable="false">
        <i class="pi pi-key mr-2" />
        La contrasena se configura desde el boton "Credenciales" de la tabla.
      </Message>
    </template>

    <!-- OAuth2 Fields -->
    <template v-if="isOAuth2 && model.type === 'oauth2'">
      <div class="field">
        <label for="token_url" class="block text-sm font-medium text-gray-700 mb-1">
          Token URL
        </label>
        <InputText
          id="token_url"
          v-model="model.token_url"
          class="w-full"
          placeholder="https://auth.example.com/oauth/token"
        />
      </div>

      <div class="field">
        <label for="client_id" class="block text-sm font-medium text-gray-700 mb-1">
          Client ID
        </label>
        <InputText
          id="client_id"
          v-model="model.client_id"
          class="w-full"
          placeholder="ID del cliente OAuth2"
        />
      </div>

      <div class="field">
        <label for="grant_type" class="block text-sm font-medium text-gray-700 mb-1">
          Grant Type
        </label>
        <Select
          id="grant_type"
          v-model="model.grant_type"
          :options="grantTypes"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div class="field">
        <label for="scopes" class="block text-sm font-medium text-gray-700 mb-1">
          Scopes
        </label>
        <Chips
          id="scopes"
          v-model="model.scopes"
          class="w-full"
          placeholder="Agregar scope y presionar Enter"
        />
        <small class="text-gray-500">
          Escribe cada scope y presiona Enter
        </small>
      </div>

      <Message severity="warn" :closable="false">
        <i class="pi pi-key mr-2" />
        El Client Secret se configura desde el boton "Credenciales" de la tabla.
      </Message>
    </template>

    <!-- SOAP WS-Security Fields -->
    <template v-if="isSoapWss && model.type === 'soap_wss'">
      <div class="field">
        <label for="wss_username" class="block text-sm font-medium text-gray-700 mb-1">
          Usuario WS-Security
        </label>
        <InputText
          id="wss_username"
          v-model="model.username"
          class="w-full"
          placeholder="Usuario para WS-Security header"
        />
      </div>

      <div class="field">
        <label for="password_type" class="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Password
        </label>
        <Select
          id="password_type"
          v-model="model.password_type"
          :options="passwordTypes"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div class="field">
        <div class="flex items-center gap-3">
          <Checkbox
            id="must_understand"
            v-model="model.must_understand"
            :binary="true"
          />
          <label for="must_understand" class="text-sm font-medium text-gray-700 cursor-pointer">
            mustUnderstand="1"
          </label>
        </div>
        <small class="text-gray-500 block mt-1">
          Atributo mustUnderstand del header WS-Security
        </small>
      </div>

      <Message severity="warn" :closable="false">
        <i class="pi pi-key mr-2" />
        La contrasena WS-Security se configura desde el boton "Credenciales" de la tabla.
      </Message>
    </template>
  </div>
</template>
