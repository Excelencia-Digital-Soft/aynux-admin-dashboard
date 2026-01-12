<script setup lang="ts">
/**
 * InstitutionConfigForm - Form wrapper with tabs for creating/editing institutions.
 *
 * Uses separate tab components for each settings section.
 */

import { ref, computed, watch } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'

import GeneralSettingsTab from './tabs/GeneralSettingsTab.vue'
import ConnectionSettingsTab from './tabs/ConnectionSettingsTab.vue'
import AuthSettingsTab from './tabs/AuthSettingsTab.vue'
import SchedulerSettingsTab from './tabs/SchedulerSettingsTab.vue'
import BrandingSettingsTab from './tabs/BrandingSettingsTab.vue'
import WhatsAppSettingsTab from './tabs/WhatsAppSettingsTab.vue'

import type {
  TenantInstitutionConfig,
  InstitutionConfigFormState
} from '@/types/tenantInstitutionConfig.types'
import {
  getDefaultFormState,
  configToFormState,
  formStateToCreateRequest,
  formStateToUpdateRequest
} from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  config?: TenantInstitutionConfig | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: null,
  loading: false
})

const emit = defineEmits<{
  save: [data: ReturnType<typeof formStateToCreateRequest> | ReturnType<typeof formStateToUpdateRequest>]
  cancel: []
}>()

// ============================================================
// State
// ============================================================

const formState = ref<InstitutionConfigFormState>(getDefaultFormState())
const activeTab = ref('0')

// ============================================================
// Computed
// ============================================================

const isEditing = computed(() => props.config !== null)

const formTitle = computed(() =>
  isEditing.value ? 'Editar Institucion' : 'Nueva Institucion'
)

const canSave = computed(() => {
  return (
    formState.value.institution_key.trim().length >= 2 &&
    formState.value.institution_name.trim().length >= 2
  )
})

// ============================================================
// Watchers
// ============================================================

watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      formState.value = configToFormState(newConfig)
    } else {
      formState.value = getDefaultFormState()
    }
    activeTab.value = '0'
  },
  { immediate: true }
)

// ============================================================
// Methods
// ============================================================

function handleSave() {
  if (!canSave.value) return

  if (isEditing.value) {
    emit('save', formStateToUpdateRequest(formState.value))
  } else {
    emit('save', formStateToCreateRequest(formState.value))
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="institution-config-form">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ formTitle }}
      </h3>
      <span
        v-if="isEditing"
        class="text-sm text-gray-500"
      >
        Clave: <code class="bg-gray-100 px-2 py-0.5 rounded">{{ formState.institution_key }}</code>
      </span>
    </div>

    <!-- Tabs -->
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="0">
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle" />
            <span>General</span>
          </div>
        </Tab>
        <Tab value="1">
          <div class="flex items-center gap-2">
            <i class="pi pi-globe" />
            <span>Conexion</span>
          </div>
        </Tab>
        <Tab value="2">
          <div class="flex items-center gap-2">
            <i class="pi pi-lock" />
            <span>Autenticacion</span>
          </div>
        </Tab>
        <Tab value="3">
          <div class="flex items-center gap-2">
            <i class="pi pi-clock" />
            <span>Programador</span>
          </div>
        </Tab>
        <Tab value="4">
          <div class="flex items-center gap-2">
            <i class="pi pi-image" />
            <span>Marca</span>
          </div>
        </Tab>
        <Tab value="5">
          <div class="flex items-center gap-2">
            <i class="pi pi-whatsapp" />
            <span>WhatsApp</span>
          </div>
        </Tab>
      </TabList>

      <TabPanels>
        <!-- General Tab -->
        <TabPanel value="0">
          <GeneralSettingsTab
            v-model:institutionKey="formState.institution_key"
            v-model:institutionName="formState.institution_name"
            v-model:institutionType="formState.institution_type"
            v-model:enabled="formState.enabled"
            v-model:description="formState.description"
            :isEditing="isEditing"
          />
        </TabPanel>

        <!-- Connection Tab -->
        <TabPanel value="1">
          <ConnectionSettingsTab v-model="formState.connection" />
        </TabPanel>

        <!-- Auth Tab -->
        <TabPanel value="2">
          <AuthSettingsTab v-model="formState.auth" />
        </TabPanel>

        <!-- Scheduler Tab -->
        <TabPanel value="3">
          <SchedulerSettingsTab v-model="formState.scheduler" />
        </TabPanel>

        <!-- Branding Tab -->
        <TabPanel value="4">
          <BrandingSettingsTab v-model="formState.branding" />
        </TabPanel>

        <!-- WhatsApp Tab -->
        <TabPanel value="5">
          <WhatsAppSettingsTab v-model="formState.whatsapp" />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Footer Actions -->
    <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
      <Button
        label="Cancelar"
        severity="secondary"
        text
        @click="handleCancel"
        :disabled="loading"
      />
      <Button
        :label="isEditing ? 'Guardar Cambios' : 'Crear Institucion'"
        icon="pi pi-check"
        @click="handleSave"
        :loading="loading"
        :disabled="!canSave"
      />
    </div>
  </div>
</template>

<style scoped>
.institution-config-form :deep(.p-tabpanels) {
  padding: 1rem 0;
}

.institution-config-form :deep(.p-tablist) {
  border-bottom: 1px solid #e5e7eb;
}

.institution-config-form :deep(.p-tab) {
  padding: 0.75rem 1rem;
}
</style>
