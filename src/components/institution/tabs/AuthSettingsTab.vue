<script setup lang="ts">
/**
 * AuthSettingsTab - Dynamic authentication configuration.
 *
 * Shows different fields based on selected auth type.
 * NOTE: Actual credentials (passwords, keys) are managed via SecretsUpdateDialog.
 */

import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

// Scopes management
function handleScopeKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && model.value.type === 'oauth2') {
    event.preventDefault()
    const input = event.target as HTMLInputElement
    const value = input.value.trim()
    if (value && !model.value.scopes?.includes(value)) {
      model.value = {
        ...model.value,
        scopes: [...(model.value.scopes || []), value]
      }
    }
    input.value = ''
  }
}

function removeScope(scope: string) {
  if (model.value.type === 'oauth2') {
    model.value = {
      ...model.value,
      scopes: (model.value.scopes || []).filter((s) => s !== scope)
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Auth Type Selector -->
    <div>
      <label for="auth_type" class="block text-sm font-medium text-foreground mb-1">
        Tipo de Autenticacion
      </label>
      <Select v-model="authType">
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in AUTH_TYPES" :key="t.value" :value="t.value">
            {{ t.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- No Auth -->
    <Alert v-if="model.type === 'none'">
      <AlertDescription>
        No se requiere autenticacion para este servicio.
      </AlertDescription>
    </Alert>

    <!-- API Key Fields -->
    <template v-if="isApiKey && model.type === 'api_key'">
      <div>
        <label for="header_name" class="block text-sm font-medium text-foreground mb-1">
          Nombre del Header
        </label>
        <Input
          id="header_name"
          v-model="model.header_name"
          placeholder="ej: X-API-Key, Authorization"
        />
      </div>

      <div>
        <label for="prefix" class="block text-sm font-medium text-foreground mb-1">
          Prefijo (opcional)
        </label>
        <Input
          id="prefix"
          v-model="model.prefix"
          placeholder="ej: Bearer , Api-Key "
        />
        <p class="text-xs text-muted-foreground mt-1">
          Prefijo a agregar antes del API key (incluir espacio si es necesario)
        </p>
      </div>

      <Alert variant="warning">
        <AlertDescription>
          <i class="pi pi-key mr-2" />
          El API Key se configura desde el boton "Credenciales" de la tabla.
        </AlertDescription>
      </Alert>
    </template>

    <!-- Basic Auth Fields -->
    <template v-if="isBasic && model.type === 'basic'">
      <div>
        <label for="basic_username" class="block text-sm font-medium text-foreground mb-1">
          Usuario
        </label>
        <Input
          id="basic_username"
          v-model="model.username"
          placeholder="Username para autenticacion"
        />
      </div>

      <Alert variant="warning">
        <AlertDescription>
          <i class="pi pi-key mr-2" />
          La contrasena se configura desde el boton "Credenciales" de la tabla.
        </AlertDescription>
      </Alert>
    </template>

    <!-- OAuth2 Fields -->
    <template v-if="isOAuth2 && model.type === 'oauth2'">
      <div>
        <label for="token_url" class="block text-sm font-medium text-foreground mb-1">
          Token URL
        </label>
        <Input
          id="token_url"
          v-model="model.token_url"
          placeholder="https://auth.example.com/oauth/token"
        />
      </div>

      <div>
        <label for="client_id" class="block text-sm font-medium text-foreground mb-1">
          Client ID
        </label>
        <Input
          id="client_id"
          v-model="model.client_id"
          placeholder="ID del cliente OAuth2"
        />
      </div>

      <div>
        <label for="grant_type" class="block text-sm font-medium text-foreground mb-1">
          Grant Type
        </label>
        <Select v-model="model.grant_type">
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="gt in grantTypes" :key="gt.value" :value="gt.value">
              {{ gt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label for="scopes" class="block text-sm font-medium text-foreground mb-1">
          Scopes
        </label>
        <div v-if="model.scopes && model.scopes.length > 0" class="flex flex-wrap gap-1 mb-2">
          <span
            v-for="scope in model.scopes"
            :key="scope"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
          >
            {{ scope }}
            <button type="button" class="hover:text-destructive" @click="removeScope(scope)">
              <i class="pi pi-times text-[10px]" />
            </button>
          </span>
        </div>
        <Input
          id="scopes"
          placeholder="Agregar scope y presionar Enter"
          @keydown="handleScopeKeydown"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Escribe cada scope y presiona Enter
        </p>
      </div>

      <Alert variant="warning">
        <AlertDescription>
          <i class="pi pi-key mr-2" />
          El Client Secret se configura desde el boton "Credenciales" de la tabla.
        </AlertDescription>
      </Alert>
    </template>

    <!-- SOAP WS-Security Fields -->
    <template v-if="isSoapWss && model.type === 'soap_wss'">
      <div>
        <label for="wss_username" class="block text-sm font-medium text-foreground mb-1">
          Usuario WS-Security
        </label>
        <Input
          id="wss_username"
          v-model="model.username"
          placeholder="Usuario para WS-Security header"
        />
      </div>

      <div>
        <label for="password_type" class="block text-sm font-medium text-foreground mb-1">
          Tipo de Password
        </label>
        <Select v-model="model.password_type">
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="pt in passwordTypes" :key="pt.value" :value="pt.value">
              {{ pt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div class="flex items-center gap-3">
          <Checkbox
            id="must_understand"
            :checked="model.must_understand"
            @update:checked="model.must_understand = !!$event"
          />
          <label for="must_understand" class="text-sm font-medium text-foreground cursor-pointer">
            mustUnderstand="1"
          </label>
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          Atributo mustUnderstand del header WS-Security
        </p>
      </div>

      <Alert variant="warning">
        <AlertDescription>
          <i class="pi pi-key mr-2" />
          La contrasena WS-Security se configura desde el boton "Credenciales" de la tabla.
        </AlertDescription>
      </Alert>
    </template>
  </div>
</template>
