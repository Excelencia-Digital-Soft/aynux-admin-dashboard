<script setup lang="ts">
/**
 * InstitutionConfigPage - Main admin page for institution configurations.
 *
 * Features:
 * - List all institution configs for current organization
 * - Create, edit, delete configurations
 * - Toggle enabled/disabled status
 * - Manage encrypted credentials
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Paginator from 'primevue/paginator'
import Message from 'primevue/message'

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

const authStore = useAuthStore()
const confirm = useConfirm()
const {
  configs,
  total,
  enabledCount,
  disabledCount,
  isLoading,
  page,
  pageSize,
  filters,
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

// ============================================================
// Computed
// ============================================================

const currentOrgId = computed(() => authStore.currentOrganization?.id)

const secretsConfig = computed(() => {
  if (!secretsConfigId.value) return null
  return configs.value.find((c) => c.id === secretsConfigId.value) || null
})

const typeFilterOptions = computed(() => [
  { label: 'Todos los tipos', value: undefined },
  ...INSTITUTION_TYPES
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

function handleTypeFilter() {
  setFilters({ institution_type: selectedType.value })
  if (currentOrgId.value) {
    fetchConfigs(currentOrgId.value)
  }
}

function handlePageChange(event: { page: number; rows: number }) {
  setPage(event.page + 1)
  if (currentOrgId.value) {
    fetchConfigs(currentOrgId.value)
  }
}

function handleEdit(config: TenantInstitutionConfig) {
  openEditDialog(config)
}

function handleDelete(config: TenantInstitutionConfig) {
  confirm.require({
    message: `¿Eliminar la configuracion "${config.institution_name}"? Esta accion no se puede deshacer.`,
    header: 'Confirmar eliminacion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (currentOrgId.value) {
        await deleteConfig(currentOrgId.value, config.id)
      }
    }
  })
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
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Configuracion de Instituciones</h1>
        <p class="text-gray-500 mt-1">
          Gestiona las configuraciones de integracion para cada institucion
        </p>
      </div>
      <Button
        label="Nueva Institucion"
        icon="pi pi-plus"
        @click="openCreateDialog"
        :disabled="!currentOrgId"
      />
    </div>

    <!-- No org selected warning -->
    <Message v-if="!currentOrgId" severity="warn" :closable="false" class="mb-6">
      Selecciona una organizacion para ver las configuraciones de instituciones.
    </Message>

    <!-- Stats Cards -->
    <div v-if="currentOrgId" class="grid grid-cols-3 gap-4 mb-6">
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-bold text-gray-800">{{ total }}</div>
          <div class="text-sm text-gray-500">Total</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-bold text-green-600">{{ enabledCount }}</div>
          <div class="text-sm text-gray-500">Habilitadas</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-bold text-gray-400">{{ disabledCount }}</div>
          <div class="text-sm text-gray-500">Deshabilitadas</div>
        </template>
      </Card>
    </div>

    <!-- Filters -->
    <Card v-if="currentOrgId" class="mb-6">
      <template #content>
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div class="flex gap-2">
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por nombre o clave..."
                class="flex-1"
                @keyup.enter="handleSearch"
              />
              <Button
                icon="pi pi-search"
                @click="handleSearch"
                severity="secondary"
              />
            </div>
          </div>
          <div style="width: 200px">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="selectedType"
              :options="typeFilterOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @change="handleTypeFilter"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Table -->
    <Card v-if="currentOrgId">
      <template #content>
        <InstitutionConfigList
          :configs="configs"
          :loading="isLoading"
          @edit="handleEdit"
          @delete="handleDelete"
          @toggle="handleToggle"
          @secrets="handleSecrets"
        />

        <!-- Paginator -->
        <Paginator
          v-if="total > pageSize"
          :rows="pageSize"
          :totalRecords="total"
          :first="(page - 1) * pageSize"
          @page="handlePageChange"
          class="mt-4"
        />
      </template>
    </Card>

    <!-- Form Dialog -->
    <Dialog
      v-model:visible="showFormDialog"
      :header="isEditing ? 'Editar Institucion' : 'Nueva Institucion'"
      :modal="true"
      :closable="!isLoading"
      :style="{ width: '800px' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <InstitutionConfigForm
        :config="editingConfig"
        :loading="isLoading"
        @save="handleFormSave"
        @cancel="closeFormDialog"
      />
    </Dialog>

    <!-- Secrets Dialog -->
    <SecretsUpdateDialog
      v-model:visible="showSecretsDialog"
      :config="secretsConfig"
      :loading="isLoading"
      @save="handleSecretsSave"
    />
  </div>
</template>

<style scoped>
.institution-config-page {
  max-width: 1400px;
}
</style>
