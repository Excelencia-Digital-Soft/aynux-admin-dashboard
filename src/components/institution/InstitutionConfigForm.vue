<script setup lang="ts">
/**
 * InstitutionConfigForm - Form wrapper with tabs for creating/editing institutions.
 *
 * Uses separate tab components for each settings section.
 * Migrated to shadcn-vue components.
 */

import { ref, computed, watch } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

import GeneralSettingsTab from './tabs/GeneralSettingsTab.vue'
import ConnectionSettingsTab from './tabs/ConnectionSettingsTab.vue'
import AuthSettingsTab from './tabs/AuthSettingsTab.vue'
import SchedulerSettingsTab from './tabs/SchedulerSettingsTab.vue'
import BrandingSettingsTab from './tabs/BrandingSettingsTab.vue'
import WhatsAppSettingsTab from './tabs/WhatsAppSettingsTab.vue'
import ChattigoBspTab from './tabs/ChattigoBspTab.vue'
import HumanHandoffTab from './tabs/HumanHandoffTab.vue'

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
const activeTab = ref('general')

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
    activeTab.value = 'general'
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
      <h3 class="text-lg font-semibold text-foreground">
        {{ formTitle }}
      </h3>
      <span
        v-if="isEditing"
        class="text-sm text-muted-foreground"
      >
        Clave: <code class="bg-muted px-2 py-0.5 rounded">{{ formState.institution_key }}</code>
      </span>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="flex w-full overflow-x-auto">
        <TabsTrigger value="general" class="flex items-center gap-2">
          <i class="pi pi-info-circle" />
          <span class="hidden sm:inline">General</span>
        </TabsTrigger>
        <TabsTrigger value="connection" class="flex items-center gap-2">
          <i class="pi pi-globe" />
          <span class="hidden sm:inline">Conexion</span>
        </TabsTrigger>
        <TabsTrigger value="auth" class="flex items-center gap-2">
          <i class="pi pi-lock" />
          <span class="hidden sm:inline">Auth</span>
        </TabsTrigger>
        <TabsTrigger value="scheduler" class="flex items-center gap-2">
          <i class="pi pi-clock" />
          <span class="hidden sm:inline">Scheduler</span>
        </TabsTrigger>
        <TabsTrigger value="branding" class="flex items-center gap-2">
          <i class="pi pi-image" />
          <span class="hidden sm:inline">Marca</span>
        </TabsTrigger>
        <TabsTrigger value="whatsapp" class="flex items-center gap-2">
          <i class="pi pi-whatsapp" />
          <span class="hidden sm:inline">WhatsApp</span>
        </TabsTrigger>
        <TabsTrigger value="chattigo" class="flex items-center gap-2">
          <i class="pi pi-comments" />
          <span class="hidden sm:inline">Chattigo</span>
        </TabsTrigger>
        <TabsTrigger value="handoff" class="flex items-center gap-2">
          <i class="pi pi-users" />
          <span class="hidden sm:inline">Handoff</span>
        </TabsTrigger>
      </TabsList>

      <div class="mt-4">
        <!-- General Tab -->
        <TabsContent value="general">
          <GeneralSettingsTab
            v-model:institutionKey="formState.institution_key"
            v-model:institutionName="formState.institution_name"
            v-model:institutionType="formState.institution_type"
            v-model:domainKey="formState.domain_key"
            v-model:enabled="formState.enabled"
            v-model:description="formState.description"
            v-model:institutionId="formState.institution_id"
            v-model:campaignId="formState.campaign_id"
            v-model:hcwebInstitutionId="formState.hcweb_institution_id"
            :isEditing="isEditing"
          />
        </TabsContent>

        <!-- Connection Tab -->
        <TabsContent value="connection">
          <ConnectionSettingsTab v-model="formState.connection" />
        </TabsContent>

        <!-- Auth Tab -->
        <TabsContent value="auth">
          <AuthSettingsTab v-model="formState.auth" />
        </TabsContent>

        <!-- Scheduler Tab -->
        <TabsContent value="scheduler">
          <SchedulerSettingsTab v-model="formState.scheduler" />
        </TabsContent>

        <!-- Branding Tab -->
        <TabsContent value="branding">
          <BrandingSettingsTab v-model="formState.branding" />
        </TabsContent>

        <!-- WhatsApp Tab -->
        <TabsContent value="whatsapp">
          <WhatsAppSettingsTab v-model="formState.whatsapp" />
        </TabsContent>

        <!-- Chattigo Tab -->
        <TabsContent value="chattigo">
          <ChattigoBspTab v-model="formState.chattigo" />
        </TabsContent>

        <!-- Human Handoff Tab -->
        <TabsContent value="handoff">
          <HumanHandoffTab
            v-model="formState.workflow"
            :orgId="config?.organization_id"
            :configId="config?.id"
            :isEditing="isEditing"
          />
        </TabsContent>
      </div>
    </Tabs>

    <!-- Footer Actions -->
    <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
      <Button
        variant="ghost"
        @click="handleCancel"
        :disabled="loading"
      >
        Cancelar
      </Button>
      <Button
        @click="handleSave"
        :loading="loading"
        :disabled="!canSave"
      >
        <i class="pi pi-check mr-2" />
        {{ isEditing ? 'Guardar Cambios' : 'Crear Institucion' }}
      </Button>
    </div>
  </div>
</template>
