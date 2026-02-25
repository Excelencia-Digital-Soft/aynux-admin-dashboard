<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import { useAuthStore } from '@/stores/auth.store'
import PharmacyList from '@/components/pharmacy/PharmacyList.vue'
import PharmacyForm from '@/components/pharmacy/PharmacyForm.vue'
import type { PharmacyConfig } from '@/types/pharmacyConfig.types'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
</script>

<template>
  <div class="pharmacy-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Farmacias</h1>
        <p class="text-muted-foreground mt-1">
          Administra las configuraciones de farmacias e historial de mensajes
        </p>
      </div>
      <Button :disabled="!currentOrgId" @click="openPharmacyDialog(null)">
        <i class="pi pi-plus mr-2" />
        Nueva Farmacia
      </Button>
    </div>

    <!-- No org selected warning -->
    <Alert v-if="!currentOrgId" variant="warning" class="mb-6">
      <AlertDescription>
        Selecciona una organizacion para ver las farmacias.
      </AlertDescription>
    </Alert>

    <!-- Content -->
    <Card v-if="currentOrgId" class="glass-card">
      <CardContent class="p-4">
        <PharmacyList
          :organization-id="currentOrgId"
          @select="handleSelect"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </CardContent>
    </Card>

    <!-- Form Dialog -->
    <PharmacyForm />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="store.showDeleteDialog">
      <AlertDialogContent class="glass-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Farmacia</AlertDialogTitle>
          <AlertDialogDescription>
            <div class="flex items-center gap-4 mb-4">
              <i class="pi pi-exclamation-triangle text-4xl text-destructive" />
              <div>
                <p class="font-medium text-foreground">Esta seguro de eliminar esta farmacia?</p>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ store.deletingPharmacy?.pharmacy_name }}
                </p>
              </div>
            </div>

            <Alert variant="warning">
              <AlertDescription>
                Esta accion eliminara la configuracion de la farmacia. El historial de mensajes se mantendra.
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="closeDeleteDialog">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDelete"
          >
            <i class="pi pi-trash mr-2" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
