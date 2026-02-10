<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import { useAuthStore } from '@/stores/auth.store'
import PharmacyList from '@/components/pharmacy/PharmacyList.vue'
import PharmacyForm from '@/components/pharmacy/PharmacyForm.vue'
import type { PharmacyConfig } from '@/types/pharmacyConfig.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

const router = useRouter()
const store = usePharmacyStore()
const authStore = useAuthStore()
const { deletePharmacy, fetchPharmacies, openPharmacyDialog, closeDeleteDialog } = usePharmacyConfig()

const currentOrgId = computed(() => authStore.currentOrganization?.id)

onMounted(() => {
  if (currentOrgId.value) {
    fetchPharmacies(currentOrgId.value)
  }
})

watch(currentOrgId, (newOrgId) => {
  if (newOrgId) {
    fetchPharmacies(newOrgId)
  }
})

function handleSelect(pharmacy: PharmacyConfig) {
  router.push(`/pharmacy/${pharmacy.id}`)
}

function handleEdit(pharmacy: PharmacyConfig) {
  openPharmacyDialog(pharmacy)
}

function handleDelete(pharmacy: PharmacyConfig) {
  store.openDeleteDialog(pharmacy)
}

async function confirmDelete() {
  if (store.deletingPharmacy) {
    await deletePharmacy(store.deletingPharmacy.id)
    if (currentOrgId.value) {
      fetchPharmacies(currentOrgId.value)
    }
  }
}

function cancelDelete() {
  closeDeleteDialog()
}
</script>

<template>
  <div class="pharmacy-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Farmacias</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Administra las configuraciones de farmacias e historial de mensajes
        </p>
      </div>
      <Button
        label="Nueva Farmacia"
        icon="pi pi-plus"
        :disabled="!currentOrgId"
        @click="openPharmacyDialog(null)"
      />
    </div>

    <!-- No org selected warning -->
    <Message v-if="!currentOrgId" severity="warn" :closable="false" class="mb-6">
      Selecciona una organizacion para ver las farmacias.
    </Message>

    <!-- Content -->
    <Card v-if="currentOrgId">
      <template #content>
        <PharmacyList
          :organization-id="currentOrgId"
          @select="handleSelect"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </template>
    </Card>

    <!-- Form Dialog -->
    <PharmacyForm />

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="store.showDeleteDialog"
      header="Eliminar Farmacia"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
        <div>
          <p class="font-medium">Esta seguro de eliminar esta farmacia?</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ store.deletingPharmacy?.pharmacy_name }}
          </p>
        </div>
      </div>

      <Message severity="warn" :closable="false" class="mt-4">
        Esta accion eliminara la configuracion de la farmacia. El historial de mensajes se mantendra.
      </Message>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="cancelDelete" />
        <Button label="Eliminar" severity="danger" icon="pi pi-trash" @click="confirmDelete" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.pharmacy-page :deep(.p-card-content) {
  padding: 1rem;
}
</style>
