<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import OrganizationList from '@/components/organizations/OrganizationList.vue'
import OrganizationForm from '@/components/organizations/OrganizationForm.vue'
import type { Organization } from '@/types/organization.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

const router = useRouter()
const store = useOrganizationStore()
const { deleteOrganization, openOrgDialog } = useOrganization()

const showDeleteDialog = ref(false)
const orgToDelete = ref<Organization | null>(null)

function handleSelect(org: Organization) {
  router.push(`/organizations/${org.id}`)
}

function handleEdit(org: Organization) {
  openOrgDialog(org)
}

function handleDelete(org: Organization) {
  orgToDelete.value = org
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (orgToDelete.value) {
    await deleteOrganization(orgToDelete.value.id)
    showDeleteDialog.value = false
    orgToDelete.value = null
  }
}

function cancelDelete() {
  showDeleteDialog.value = false
  orgToDelete.value = null
}
</script>

<template>
  <div class="organizations-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Organizaciones</h1>
        <p class="text-gray-500 mt-1">
          Administra las organizaciones del sistema
        </p>
      </div>
      <Button
        label="Nueva Organizacion"
        icon="pi pi-plus"
        @click="openOrgDialog(null)"
      />
    </div>

    <!-- Content -->
    <Card>
      <template #content>
        <OrganizationList
          @select="handleSelect"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </template>
    </Card>

    <!-- Form Dialog -->
    <OrganizationForm />

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar Organizacion"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
        <div>
          <p class="font-medium">Esta seguro de eliminar esta organizacion?</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ orgToDelete?.name }}
          </p>
        </div>
      </div>

      <Message severity="warn" :closable="false" class="mt-4">
        Esta accion eliminara todos los usuarios y documentos asociados.
      </Message>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="cancelDelete" />
        <Button label="Eliminar" severity="danger" icon="pi pi-trash" @click="confirmDelete" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.organizations-page :deep(.p-card-content) {
  padding: 1rem;
}
</style>
