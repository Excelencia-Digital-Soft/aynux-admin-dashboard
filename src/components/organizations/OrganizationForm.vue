<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import type { OrganizationCreateRequest, OrganizationUpdateRequest } from '@/types/organization.types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

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

function handleOpenChange(open: boolean) {
  if (!open) handleClose()
}
</script>

<template>
  <Dialog :open="store.showOrgDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[500px] glass-dialog">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ isEditing ? 'Editar datos de la organizacion' : 'Crear una nueva organizacion' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Nombre *
          </label>
          <Input
            v-model="formData.name"
            placeholder="Nombre de la organizacion"
            @blur="!isEditing && generateSlug()"
          />
        </div>

        <!-- Slug (only for creation) -->
        <div v-if="!isEditing">
          <label class="block text-sm font-medium text-foreground mb-1">
            Slug *
          </label>
          <Input
            v-model="formData.slug"
            placeholder="slug-organizacion"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Identificador unico (solo letras, numeros y guiones)
          </p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Descripcion
          </label>
          <Textarea
            v-model="formData.description"
            :rows="3"
            placeholder="Descripcion opcional"
          />
        </div>

        <!-- Status -->
        <div v-if="isEditing">
          <label class="block text-sm font-medium text-foreground mb-1">
            Estado
          </label>
          <Select v-model="formData.status">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Limits -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Limite de usuarios
            </label>
            <Input
              v-model.number="formData.max_users"
              type="number"
              :min="1"
              placeholder="Sin limite"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Limite de documentos
            </label>
            <Input
              v-model.number="formData.max_documents"
              type="number"
              :min="1"
              placeholder="Sin limite"
            />
          </div>
        </div>

        <!-- Features -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-2">
            <Checkbox
              id="branding"
              :checked="formData.custom_branding"
              @update:checked="formData.custom_branding = !!$event"
            />
            <label for="branding" class="text-sm text-foreground">Branding personalizado</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              id="api"
              :checked="formData.api_access"
              @update:checked="formData.api_access = !!$event"
            />
            <label for="api" class="text-sm text-foreground">Acceso API</label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="isLoading">
          Cancelar
        </Button>
        <Button @click="handleSubmit" :disabled="!canSave || isLoading">
          <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ isEditing ? 'Guardar' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
