<script setup lang="ts">
/**
 * InstitutionInfoDialog - Shows detailed institution information
 *
 * Displays institution configuration details including:
 * - Institution name and key
 * - External system ID (HCWeb IdInstitucion)
 * - Connection type and endpoint
 * - Contact information (phone, email)
 */
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'

defineProps<{
  visible: boolean
  institution: TenantInstitutionConfig | null
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

function getConnectionSeverity(type: string): 'info' | 'success' | 'warn' | 'secondary' {
  switch (type) {
    case 'soap':
      return 'info'
    case 'rest':
      return 'success'
    case 'graphql':
      return 'warn'
    default:
      return 'secondary'
  }
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '')
  } catch {
    return url
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Información de Institución"
    :style="{ width: '450px' }"
    modal
    class="institution-info-dialog"
  >
    <div v-if="institution" class="space-y-4">
      <!-- Name and Key -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {{ institution.institution_name }}
        </h3>
        <code class="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
          {{ institution.institution_key }}
        </code>
      </div>

      <!-- External ID (HCWeb) -->
      <div
        v-if="institution.settings.institution_id"
        class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
          ID Sistema Externo (HCWeb)
        </div>
        <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {{ institution.settings.institution_id }}
        </div>
      </div>

      <!-- No External ID Warning -->
      <div
        v-else
        class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
          <span class="text-sm text-yellow-700 dark:text-yellow-300">
            Sin ID de sistema externo configurado
          </span>
        </div>
      </div>

      <!-- Connection -->
      <div class="border-t pt-4 dark:border-gray-700">
        <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Conexión</div>
        <div class="flex items-center gap-2 mb-2">
          <Tag
            :value="institution.settings.connection.type.toUpperCase()"
            :severity="getConnectionSeverity(institution.settings.connection.type)"
          />
          <span v-if="institution.enabled" class="text-green-600 dark:text-green-400 text-sm">
            <i class="pi pi-check-circle mr-1"></i>Activa
          </span>
          <span v-else class="text-gray-500 text-sm">
            <i class="pi pi-times-circle mr-1"></i>Inactiva
          </span>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 truncate" :title="institution.settings.connection.base_url">
          <i class="pi pi-link mr-1"></i>
          {{ formatUrl(institution.settings.connection.base_url) }}
        </div>
      </div>

      <!-- Authentication Type -->
      <div v-if="institution.settings.auth && institution.settings.auth.type !== 'none'">
        <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Autenticación</div>
        <Tag :value="institution.settings.auth.type.toUpperCase()" severity="secondary" />
      </div>

      <!-- Branding/Contact Info -->
      <div
        v-if="institution.settings.branding?.phone || institution.settings.branding?.email"
        class="border-t pt-4 dark:border-gray-700"
      >
        <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Contacto</div>
        <div v-if="institution.settings.branding.phone" class="text-sm text-gray-700 dark:text-gray-300 mb-1">
          <i class="pi pi-phone mr-2"></i>{{ institution.settings.branding.phone }}
        </div>
        <div v-if="institution.settings.branding.email" class="text-sm text-gray-700 dark:text-gray-300">
          <i class="pi pi-envelope mr-2"></i>{{ institution.settings.branding.email }}
        </div>
      </div>

      <!-- WhatsApp Phone Number ID -->
      <div v-if="institution.settings.whatsapp?.phone_number_id" class="border-t pt-4 dark:border-gray-700">
        <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">WhatsApp</div>
        <div class="text-sm text-gray-700 dark:text-gray-300">
          <i class="pi pi-whatsapp mr-2 text-green-600"></i>
          {{ institution.settings.whatsapp.phone_number_id }}
        </div>
      </div>
    </div>

    <!-- No Institution Selected -->
    <div v-else class="text-center py-8 text-gray-500">
      <i class="pi pi-info-circle text-4xl mb-2"></i>
      <p>No hay institución seleccionada</p>
    </div>
  </Dialog>
</template>

<style scoped>
.institution-info-dialog :deep(.p-dialog-content) {
  padding: 1.25rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
