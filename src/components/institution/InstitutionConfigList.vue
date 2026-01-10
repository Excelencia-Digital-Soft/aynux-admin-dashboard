<script setup lang="ts">
/**
 * InstitutionConfigList - DataTable for listing institution configurations.
 *
 * Features:
 * - Sortable columns
 * - Inline toggle enabled/disabled
 * - Action buttons (edit, secrets, delete)
 * - Status tags
 */

import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  configs: TenantInstitutionConfig[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  edit: [config: TenantInstitutionConfig]
  delete: [config: TenantInstitutionConfig]
  toggle: [config: TenantInstitutionConfig]
  secrets: [configId: string]
}>()

// ============================================================
// Computed
// ============================================================

const tableConfigs = computed(() => props.configs)

// ============================================================
// Methods
// ============================================================

function getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  switch (type) {
    case 'medical':
      return 'success'
    case 'pharmacy':
      return 'info'
    case 'laboratory':
      return 'warn'
    default:
      return 'secondary'
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'medical':
      return 'Medico'
    case 'pharmacy':
      return 'Farmacia'
    case 'laboratory':
      return 'Laboratorio'
    case 'generic':
      return 'Generico'
    default:
      return type
  }
}

function getConnectionTypeLabel(type: string): string {
  switch (type) {
    case 'soap':
      return 'SOAP'
    case 'rest':
      return 'REST'
    case 'graphql':
      return 'GraphQL'
    default:
      return type
  }
}

function handleEdit(config: TenantInstitutionConfig) {
  emit('edit', config)
}

function handleDelete(config: TenantInstitutionConfig) {
  emit('delete', config)
}

function handleToggle(config: TenantInstitutionConfig) {
  emit('toggle', config)
}

function handleSecrets(config: TenantInstitutionConfig) {
  emit('secrets', config.id)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<template>
  <DataTable
    :value="tableConfigs"
    :loading="loading"
    stripedRows
    responsiveLayout="scroll"
    dataKey="id"
    class="institution-config-table"
  >
    <!-- Estado -->
    <Column field="enabled" header="Estado" :sortable="true" style="width: 100px">
      <template #body="{ data }">
        <ToggleSwitch
          :modelValue="data.enabled"
          @update:modelValue="handleToggle(data)"
        />
      </template>
    </Column>

    <!-- Clave -->
    <Column field="institution_key" header="Clave" :sortable="true" style="width: 180px">
      <template #body="{ data }">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">
          {{ data.institution_key }}
        </code>
      </template>
    </Column>

    <!-- Nombre -->
    <Column field="institution_name" header="Nombre" :sortable="true">
      <template #body="{ data }">
        <div class="font-medium">{{ data.institution_name }}</div>
        <div v-if="data.description" class="text-sm text-gray-500 truncate max-w-xs">
          {{ data.description }}
        </div>
      </template>
    </Column>

    <!-- Tipo -->
    <Column field="institution_type" header="Tipo" :sortable="true" style="width: 120px">
      <template #body="{ data }">
        <Tag
          :value="getTypeLabel(data.institution_type)"
          :severity="getTypeSeverity(data.institution_type)"
        />
      </template>
    </Column>

    <!-- Conexion -->
    <Column header="Conexion" style="width: 120px">
      <template #body="{ data }">
        <div class="text-sm">
          <span class="font-medium">
            {{ getConnectionTypeLabel(data.settings?.connection?.type || 'rest') }}
          </span>
        </div>
        <div
          v-if="data.settings?.connection?.base_url"
          class="text-xs text-gray-500 truncate max-w-[150px]"
          :title="data.settings.connection.base_url"
        >
          {{ data.settings.connection.base_url }}
        </div>
      </template>
    </Column>

    <!-- Auth -->
    <Column header="Auth" style="width: 100px">
      <template #body="{ data }">
        <div class="flex items-center gap-1">
          <Tag
            :value="data.settings?.auth?.type || 'none'"
            :severity="data.settings?.auth?.type === 'none' ? 'secondary' : 'info'"
            class="text-xs"
          />
          <i
            v-if="data.has_secrets"
            class="pi pi-lock text-green-600"
            title="Credenciales configuradas"
          />
        </div>
      </template>
    </Column>

    <!-- WhatsApp -->
    <Column header="WhatsApp" style="width: 100px">
      <template #body="{ data }">
        <i
          v-if="data.settings?.whatsapp?.phone_number_id"
          class="pi pi-check-circle text-green-600"
          title="WhatsApp configurado"
        />
        <i v-else class="pi pi-minus-circle text-gray-400" title="Sin WhatsApp" />
      </template>
    </Column>

    <!-- Actualizado -->
    <Column field="updated_at" header="Actualizado" :sortable="true" style="width: 120px">
      <template #body="{ data }">
        <span class="text-sm text-gray-600">
          {{ formatDate(data.updated_at) }}
        </span>
      </template>
    </Column>

    <!-- Acciones -->
    <Column header="Acciones" style="width: 150px">
      <template #body="{ data }">
        <div class="flex gap-1">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleEdit(data)"
            v-tooltip.top="'Editar'"
          />
          <Button
            icon="pi pi-key"
            text
            rounded
            severity="info"
            size="small"
            @click="handleSecrets(data)"
            v-tooltip.top="'Credenciales'"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="handleDelete(data)"
            v-tooltip.top="'Eliminar'"
          />
        </div>
      </template>
    </Column>

    <!-- Empty state -->
    <template #empty>
      <div class="text-center py-8 text-gray-500">
        <i class="pi pi-inbox text-4xl mb-2" />
        <p>No hay configuraciones de instituciones</p>
      </div>
    </template>

    <!-- Loading state -->
    <template #loading>
      <div class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <p class="mt-2 text-gray-500">Cargando...</p>
      </div>
    </template>
  </DataTable>
</template>

<style scoped>
.institution-config-table :deep(.p-datatable-header) {
  background: transparent;
  border: none;
}

.institution-config-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}
</style>
