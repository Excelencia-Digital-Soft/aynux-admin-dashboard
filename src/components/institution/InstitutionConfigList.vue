<script setup lang="ts">
/**
 * InstitutionConfigList - Table for listing institution configurations.
 *
 * Features:
 * - Sortable columns
 * - Inline toggle enabled/disabled
 * - Action buttons (edit, secrets, delete)
 * - Status badges
 *
 * Migrated to shadcn-vue components.
 */

import { computed } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
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

function getTypeBadgeVariant(type: string): 'success' | 'info' | 'warning' | 'secondary' | 'default' {
  switch (type) {
    case 'medical':
      return 'success'
    case 'pharmacy':
      return 'info'
    case 'laboratory':
      return 'warning'
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
  <TooltipProvider>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <i class="pi pi-spin pi-spinner text-2xl text-primary" />
      <p class="mt-2 text-muted-foreground">Cargando...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="tableConfigs.length === 0" class="text-center py-8 text-muted-foreground">
      <i class="pi pi-inbox text-4xl mb-2" />
      <p>No hay configuraciones de instituciones</p>
    </div>

    <!-- Table -->
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[100px]">Estado</TableHead>
          <TableHead class="w-[180px]">Clave</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead class="w-[120px]">Tipo</TableHead>
          <TableHead class="w-[120px]">Conexion</TableHead>
          <TableHead class="w-[100px]">Auth</TableHead>
          <TableHead class="w-[100px]">WhatsApp</TableHead>
          <TableHead class="w-[120px]">Actualizado</TableHead>
          <TableHead class="w-[150px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="config in tableConfigs" :key="config.id">
          <!-- Estado -->
          <TableCell>
            <Switch
              :checked="config.enabled"
              @update:checked="handleToggle(config)"
            />
          </TableCell>

          <!-- Clave -->
          <TableCell>
            <code class="text-sm bg-muted px-2 py-1 rounded">
              {{ config.institution_key }}
            </code>
          </TableCell>

          <!-- Nombre -->
          <TableCell>
            <div class="font-medium">{{ config.institution_name }}</div>
            <div v-if="config.description" class="text-sm text-muted-foreground truncate max-w-xs">
              {{ config.description }}
            </div>
          </TableCell>

          <!-- Tipo -->
          <TableCell>
            <Badge :variant="getTypeBadgeVariant(config.institution_type)">
              {{ getTypeLabel(config.institution_type) }}
            </Badge>
          </TableCell>

          <!-- Conexion -->
          <TableCell>
            <div class="text-sm">
              <span class="font-medium">
                {{ getConnectionTypeLabel(config.settings?.connection?.type || 'rest') }}
              </span>
            </div>
            <div
              v-if="config.settings?.connection?.base_url"
              class="text-xs text-muted-foreground truncate max-w-[150px]"
              :title="config.settings.connection.base_url"
            >
              {{ config.settings.connection.base_url }}
            </div>
          </TableCell>

          <!-- Auth -->
          <TableCell>
            <div class="flex items-center gap-1">
              <Badge :variant="config.settings?.auth?.type === 'none' ? 'secondary' : 'info'" class="text-xs">
                {{ config.settings?.auth?.type || 'none' }}
              </Badge>
              <i
                v-if="config.has_secrets"
                class="pi pi-lock text-green-600"
                title="Credenciales configuradas"
              />
            </div>
          </TableCell>

          <!-- WhatsApp -->
          <TableCell>
            <i
              v-if="config.settings?.whatsapp?.phone_number_id"
              class="pi pi-check-circle text-green-600"
              title="WhatsApp configurado"
            />
            <i v-else class="pi pi-minus-circle text-muted-foreground" title="Sin WhatsApp" />
          </TableCell>

          <!-- Actualizado -->
          <TableCell>
            <span class="text-sm text-muted-foreground">
              {{ formatDate(config.updated_at) }}
            </span>
          </TableCell>

          <!-- Acciones -->
          <TableCell>
            <div class="flex gap-1">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="handleEdit(config)"
                    class="h-8 w-8"
                  >
                    <i class="pi pi-pencil" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="handleSecrets(config)"
                    class="h-8 w-8 text-blue-600 hover:text-blue-700"
                  >
                    <i class="pi pi-key" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Credenciales</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="handleDelete(config)"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <i class="pi pi-trash" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar</TooltipContent>
              </Tooltip>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TooltipProvider>
</template>
