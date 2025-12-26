<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import type { OrganizationCreateRequest, OrganizationUpdateRequest } from '@/types/organization.types'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'

const store = useOrganizationStore()
const { createOrganization, updateOrganization, isLoading, closeOrgDialog } = useOrganization()

// Form state
const formData = ref({
  name: '',
  slug: '',
  description: '',
  status: 'active' as 'active' | 'inactive' | 'suspended',
  max_users: undefined as number | undefined,
  max_documents: undefined as number | undefined,
  custom_branding: false,
  api_access: false
})

const statusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Suspendido', value: 'suspended' }
]

const isEditing = computed(() => store.editingOrg !== null)
const dialogTitle = computed(() => isEditing.value ? 'Editar Organizacion' : 'Nueva Organizacion')

const canSave = computed(() => {
  return formData.value.name.trim() && formData.value.slug.trim()
})

// Watch for editing org changes
watch(() => store.editingOrg, (org) => {
  if (org) {
    formData.value = {
      name: org.name,
      slug: org.slug,
      description: org.description || '',
      status: org.status,
      max_users: org.settings?.max_users,
      max_documents: org.settings?.max_documents,
      custom_branding: org.settings?.custom_branding || false,
      api_access: org.settings?.api_access || false
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    name: '',
    slug: '',
    description: '',
    status: 'active',
    max_users: undefined,
    max_documents: undefined,
    custom_branding: false,
    api_access: false
  }
}

function generateSlug() {
  formData.value.slug = formData.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function handleSubmit() {
  if (!canSave.value) return

  const settings = {
    max_users: formData.value.max_users,
    max_documents: formData.value.max_documents,
    custom_branding: formData.value.custom_branding,
    api_access: formData.value.api_access
  }

  if (isEditing.value && store.editingOrg) {
    const updateData: OrganizationUpdateRequest = {
      name: formData.value.name,
      description: formData.value.description || undefined,
      status: formData.value.status,
      settings
    }
    await updateOrganization(store.editingOrg.id, updateData)
  } else {
    const createData: OrganizationCreateRequest = {
      name: formData.value.name,
      slug: formData.value.slug,
      description: formData.value.description || undefined,
      settings
    }
    await createOrganization(createData)
  }
}

function handleClose() {
  resetForm()
  closeOrgDialog()
}
</script>

<template>
  <Dialog
    :visible="store.showOrgDialog"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '500px' }"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <InputText
          v-model="formData.name"
          placeholder="Nombre de la organizacion"
          class="w-full"
          @blur="!isEditing && generateSlug()"
        />
      </div>

      <!-- Slug (only for creation) -->
      <div v-if="!isEditing">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Slug *
        </label>
        <InputText
          v-model="formData.slug"
          placeholder="slug-organizacion"
          class="w-full"
        />
        <p class="text-xs text-gray-400 mt-1">
          Identificador unico (solo letras, numeros y guiones)
        </p>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Descripcion
        </label>
        <Textarea
          v-model="formData.description"
          rows="3"
          placeholder="Descripcion opcional"
          class="w-full"
        />
      </div>

      <!-- Status -->
      <div v-if="isEditing">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <Select
          v-model="formData.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <!-- Limits -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Limite de usuarios
          </label>
          <InputNumber
            v-model="formData.max_users"
            :min="1"
            placeholder="Sin limite"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Limite de documentos
          </label>
          <InputNumber
            v-model="formData.max_documents"
            :min="1"
            placeholder="Sin limite"
            class="w-full"
          />
        </div>
      </div>

      <!-- Features -->
      <div class="space-y-2 pt-2">
        <div class="flex items-center gap-2">
          <Checkbox v-model="formData.custom_branding" :binary="true" inputId="branding" />
          <label for="branding" class="text-sm">Branding personalizado</label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="formData.api_access" :binary="true" inputId="api" />
          <label for="api" class="text-sm">Acceso API</label>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        @click="handleClose"
        :disabled="isLoading"
      />
      <Button
        :label="isEditing ? 'Guardar' : 'Crear'"
        icon="pi pi-check"
        @click="handleSubmit"
        :disabled="!canSave"
        :loading="isLoading"
      />
    </template>
  </Dialog>
</template>
