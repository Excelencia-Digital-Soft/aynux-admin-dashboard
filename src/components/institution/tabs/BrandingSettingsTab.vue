<script setup lang="ts">
/**
 * BrandingSettingsTab - Institution branding and contact information.
 */

import InputText from 'primevue/inputtext'
import type { BrandingSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<BrandingSettings>({ required: true })
</script>

<template>
  <div class="branding-settings-tab space-y-4">
    <!-- Display Name -->
    <div class="field">
      <label for="display_name" class="block text-sm font-medium text-gray-700 mb-1">
        Nombre para Mostrar
      </label>
      <InputText
        id="display_name"
        v-model="model.display_name"
        class="w-full"
        placeholder="Nombre alternativo para mensajes (opcional)"
      />
      <small class="text-gray-500">
        Si no se especifica, se usa el nombre de la institucion
      </small>
    </div>

    <!-- Address -->
    <div class="field">
      <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
        Direccion
      </label>
      <InputText
        id="address"
        v-model="model.address"
        class="w-full"
        placeholder="Av. Ejemplo 123, Ciudad"
      />
    </div>

    <!-- Phone & Email -->
    <div class="grid grid-cols-2 gap-4">
      <div class="field">
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
          Telefono
        </label>
        <InputText
          id="phone"
          v-model="model.phone"
          class="w-full"
          placeholder="+54 9 264 123-4567"
        />
      </div>

      <div class="field">
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <InputText
          id="email"
          v-model="model.email"
          type="email"
          class="w-full"
          placeholder="contacto@institucion.com"
        />
      </div>
    </div>

    <!-- Website -->
    <div class="field">
      <label for="website" class="block text-sm font-medium text-gray-700 mb-1">
        Sitio Web
      </label>
      <InputText
        id="website"
        v-model="model.website"
        class="w-full"
        placeholder="https://www.institucion.com"
      />
    </div>

    <!-- Logo Path -->
    <div class="field">
      <label for="logo_path" class="block text-sm font-medium text-gray-700 mb-1">
        Ruta del Logo
      </label>
      <InputText
        id="logo_path"
        v-model="model.logo_path"
        class="w-full"
        placeholder="/static/logos/institucion.png"
      />
      <small class="text-gray-500">
        Ruta relativa al logo de la institucion
      </small>
    </div>
  </div>
</template>
