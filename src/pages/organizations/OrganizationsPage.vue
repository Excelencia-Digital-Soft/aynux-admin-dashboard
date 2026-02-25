<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import OrganizationList from '@/components/organizations/OrganizationList.vue'
import OrganizationForm from '@/components/organizations/OrganizationForm.vue'
import type { Organization } from '@/types/organization.types'

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
</script>

<template>
  <div class="organizations-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Organizaciones</h1>
        <p class="text-muted-foreground mt-1">
          Administra las organizaciones del sistema
        </p>
      </div>
      <Button @click="openOrgDialog(null)">
        <i class="pi pi-plus mr-2" />
        Nueva Organizacion
      </Button>
    </div>

    <!-- Content -->
    <Card class="glass-card">
      <CardContent class="p-4">
        <OrganizationList
          @select="handleSelect"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </CardContent>
    </Card>

    <!-- Form Dialog -->
    <OrganizationForm />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent class="glass-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Organizacion</AlertDialogTitle>
          <AlertDialogDescription>
            <div class="flex items-center gap-4 mb-4">
              <i class="pi pi-exclamation-triangle text-4xl text-destructive" />
              <div>
                <p class="font-medium text-foreground">Esta seguro de eliminar esta organizacion?</p>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ orgToDelete?.name }}
                </p>
              </div>
            </div>

            <Alert variant="warning">
              <AlertDescription>
                Esta accion eliminara todos los usuarios y documentos asociados.
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
