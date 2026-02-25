<script setup lang="ts">
/**
 * BrandingSettingsTab - Institution branding and contact information.
 */

import { Input } from '@/components/ui/input'
import type { BrandingSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Model
// ============================================================

const model = defineModel<BrandingSettings>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Display Name -->
    <div>
      <label for="display_name" class="block text-sm font-medium text-foreground mb-1">
        Nombre para Mostrar
      </label>
      <Input
        id="display_name"
        v-model="model.display_name"
        placeholder="Nombre alternativo para mensajes (opcional)"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Si no se especifica, se usa el nombre de la institucion
      </p>
    </div>

    <!-- Address -->
    <div>
      <label for="address" class="block text-sm font-medium text-foreground mb-1">
        Direccion
      </label>
      <Input
        id="address"
        v-model="model.address"
        placeholder="Av. Ejemplo 123, Ciudad"
      />
    </div>

    <!-- Phone & Email -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="phone" class="block text-sm font-medium text-foreground mb-1">
          Telefono
        </label>
        <Input
          id="phone"
          v-model="model.phone"
          placeholder="+54 9 264 123-4567"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-foreground mb-1">
          Email
        </label>
        <Input
          id="email"
          v-model="model.email"
          type="email"
          placeholder="contacto@institucion.com"
        />
      </div>
    </div>

    <!-- Website -->
    <div>
      <label for="website" class="block text-sm font-medium text-foreground mb-1">
        Sitio Web
      </label>
      <Input
        id="website"
        v-model="model.website"
        placeholder="https://www.institucion.com"
      />
    </div>

    <!-- Logo Path -->
    <div>
      <label for="logo_path" class="block text-sm font-medium text-foreground mb-1">
        Ruta del Logo
      </label>
      <Input
        id="logo_path"
        v-model="model.logo_path"
        placeholder="/static/logos/institucion.png"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Ruta relativa al logo de la institucion
      </p>
    </div>
  </div>
</template>
