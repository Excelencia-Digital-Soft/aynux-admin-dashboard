<script setup lang="ts">
/**
 * InstitutionConfigPage - Main admin page for institution configurations.
 *
 * Features:
 * - List all institution configs for current organization
 * - Create, edit, delete configurations
 * - Toggle enabled/disabled status
 * - Manage encrypted credentials
 *
 * Migrated to shadcn-vue components for consistent design.
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// shadcn-vue components
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pagination } from '@/components/ui/pagination'

import InstitutionConfigList from '@/components/institution/InstitutionConfigList.vue'
import InstitutionConfigForm from '@/components/institution/InstitutionConfigForm.vue'
import SecretsUpdateDialog from '@/components/institution/SecretsUpdateDialog.vue'

import { useTenantInstitutionConfig } from '@/composables/useTenantInstitutionConfig'
import { useAuthStore } from '@/stores/auth.store'
import type {
  TenantInstitutionConfig,
  InstitutionConfigCreateRequest,
  InstitutionConfigUpdateRequest,
  InstitutionConfigSecretsRequest
} from '@/types/tenantInstitutionConfig.types'
import { INSTITUTION_TYPES } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Composables & Stores
// ============================================================

const router = useRouter()
const authStore = useAuthStore()
const {
  configs,
  total,
  enabledCount,
  disabledCount,
  isLoading,
  page,
  pageSize,
  showFormDialog,
  showSecretsDialog,
  editingConfig,
  secretsConfigId,
  isEditing,
  fetchConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  toggleConfig,
  updateSecrets,
  setPage,
  setFilters,
  openCreateDialog,
  openEditDialog,
  closeFormDialog,
  openSecretsDialog,
  closeSecretsDialog
} = useTenantInstitutionConfig()

// ============================================================
// State
// ============================================================

const searchQuery = ref('')
const selectedType = ref<string | undefined>(undefined)
const deleteDialogOpen = ref(false)
const configToDelete = ref<TenantInstitutionConfig | null>(null)

// ============================================================
// Computed
// ============================================================

const currentOrgId = computed(() => authStore.currentOrganization?.id)

const secretsConfig = computed(() => {
  if (!secretsConfigId.value) return null
  return configs.value.find((c) => c.id === secretsConfigId.value) || null
})

// Use '_all' as sentinel value since radix-vue doesn't allow empty string values for SelectItem
const ALL_TYPES_VALUE = '_all'

const typeFilterOptions = computed(() => [
  { label: 'Todos los tipos', value: ALL_TYPES_VALUE },
  ...INSTITUTION_TYPES.map(t => ({ label: t.label, value: t.value }))
])

// ============================================================
// Lifecycle
// ============================================================

onMounted(() => {
  if (currentOrgId.value) {
    fetchConfigs(currentOrgId.value)
  }
})

watch(currentOrgId, (newOrgId) => {
  if (newOrgId) {
    fetchConfigs(newOrgId)
  }
})

// ============================================================
// Methods
// ============================================================

function handleSearch() {
  setFilters({ search: searchQuery.value || undefined })
  if (currentOrgId.value) {
    fetchConfigs(currentOrgId.value)
  }
}

function handleTypeFilter(value: string) {
  // Convert sentinel value back to undefined for API
  const filterValue = value === ALL_TYPES_VALUE ? undefined : value
  selectedType.value = filterValue
  setFilters({ institution_type: filterValue })
  if (currentOrgId.value) {
    fetchConfigs(currentOrgId.value)
  }
}

function handlePageChange(newPage: number) {
  setPage(newPage)
  if (currentOrgId.value) {
    fetchConfigs(currentOrgId.value)
  }
}

function handleViewHistory(config: TenantInstitutionConfig) {
  if (currentOrgId.value) {
    router.push(`/institution-configs/${currentOrgId.value}/${config.id}`)
  }
}

function handleEdit(config: TenantInstitutionConfig) {
  openEditDialog(config)
}

function handleDeleteRequest(config: TenantInstitutionConfig) {
  configToDelete.value = config
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (configToDelete.value && currentOrgId.value) {
    await deleteConfig(currentOrgId.value, configToDelete.value.id)
    deleteDialogOpen.value = false
    configToDelete.value = null
  }
}

function cancelDelete() {
  deleteDialogOpen.value = false
  configToDelete.value = null
}

async function handleToggle(config: TenantInstitutionConfig) {
  if (currentOrgId.value) {
    await toggleConfig(currentOrgId.value, config.id)
  }
}

function handleSecrets(configId: string) {
  openSecretsDialog(configId)
}

async function handleFormSave(
  data: InstitutionConfigCreateRequest | InstitutionConfigUpdateRequest
) {
  if (!currentOrgId.value) return

  if (isEditing.value && editingConfig.value) {
    await updateConfig(
      currentOrgId.value,
      editingConfig.value.id,
      data as InstitutionConfigUpdateRequest
    )
  } else {
    await createConfig(currentOrgId.value, data as InstitutionConfigCreateRequest)
  }
}

async function handleSecretsSave(secrets: InstitutionConfigSecretsRequest) {
  if (!currentOrgId.value || !secretsConfigId.value) return
  await updateSecrets(currentOrgId.value, secretsConfigId.value, secrets)
}
</script>

<template>
  <div class="institution-config-page">
    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(val: boolean) => !val && cancelDelete()">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar la configuracion "{{ configToDelete?.institution_name }}"?
            Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDelete">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Configuracion de Instituciones</h1>
        <p class="text-muted-foreground mt-1">
          Gestiona las configuraciones de integracion para cada institucion
        </p>
      </div>
      <Button @click="openCreateDialog" :disabled="!currentOrgId">
        <i class="pi pi-plus mr-2" />
        Nueva Institucion
      </Button>
    </div>

    <!-- No org selected warning -->
    <Alert v-if="!currentOrgId" variant="warning" class="mb-6">
      <i class="pi pi-exclamation-triangle" />
      <AlertDescription>
        Selecciona una organizacion para ver las configuraciones de instituciones.
      </AlertDescription>
    </Alert>

    <!-- Stats Cards -->
    <div v-if="currentOrgId" class="grid grid-cols-3 gap-4 mb-6">
      <Card class="text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-foreground">{{ total }}</div>
          <div class="text-sm text-muted-foreground">Total</div>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-green-600">{{ enabledCount }}</div>
          <div class="text-sm text-muted-foreground">Habilitadas</div>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardContent class="pt-6">
          <div class="text-3xl font-bold text-muted-foreground">{{ disabledCount }}</div>
          <div class="text-sm text-muted-foreground">Deshabilitadas</div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card v-if="currentOrgId" class="mb-6">
      <CardContent class="pt-6">
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-foreground mb-1">Buscar</label>
            <div class="flex gap-2">
              <Input
                v-model="searchQuery"
                placeholder="Buscar por nombre o clave..."
                class="flex-1"
                @keyup.enter="handleSearch"
              />
              <Button variant="secondary" @click="handleSearch">
                <i class="pi pi-search" />
              </Button>
            </div>
          </div>
          <div style="width: 200px">
            <label class="block text-sm font-medium text-foreground mb-1">Tipo</label>
            <Select :model-value="selectedType || ALL_TYPES_VALUE" @update:model-value="handleTypeFilter">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in typeFilterOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card v-if="currentOrgId">
      <CardContent class="pt-6">
        <InstitutionConfigList
          :configs="configs"
          :loading="isLoading"
          @edit="handleEdit"
          @delete="handleDeleteRequest"
          @toggle="handleToggle"
          @secrets="handleSecrets"
          @viewHistory="handleViewHistory"
        />

        <!-- Pagination -->
        <Pagination
          v-if="total > pageSize"
          :totalRecords="total"
          :rows="pageSize"
          :currentPage="page"
          @pageChange="handlePageChange"
          class="mt-4 justify-center"
        />
      </CardContent>
    </Card>

    <!-- Form Dialog -->
    <Dialog :open="showFormDialog" @update:open="(val) => !val && closeFormDialog()">
      <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Editar Institucion' : 'Nueva Institucion' }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ isEditing ? 'Formulario para editar la configuracion de una institucion existente' : 'Formulario para crear una nueva configuracion de institucion' }}
          </DialogDescription>
        </DialogHeader>
        <InstitutionConfigForm
          :config="editingConfig"
          :loading="isLoading"
          @save="handleFormSave"
          @cancel="closeFormDialog"
        />
      </DialogContent>
    </Dialog>

    <!-- Secrets Dialog -->
    <SecretsUpdateDialog
      :visible="showSecretsDialog"
      :config="secretsConfig"
      :loading="isLoading"
      @update:visible="(val) => !val && closeSecretsDialog()"
      @save="handleSecretsSave"
      @configure-auth="() => {
        closeSecretsDialog()
        if (secretsConfig) openEditDialog(secretsConfig)
      }"
    />
  </div>
</template>

<style scoped>
.institution-config-page {
  max-width: 1400px;
}
</style>
