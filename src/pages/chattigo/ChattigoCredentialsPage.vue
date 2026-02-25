<script setup lang="ts">
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import ChattigoCredentialsList from '@/components/chattigo/ChattigoCredentialsList.vue'
import ChattigoCredentialsForm from '@/components/chattigo/ChattigoCredentialsForm.vue'
import ChattigoTestDialog from '@/components/chattigo/ChattigoTestDialog.vue'
import type { ChattigoCredential } from '@/types/chattigoCredentials.types'

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

const store = useChattigoCredentialsStore()
const { deleteCredential, openCredentialDialog, closeDeleteDialog, isLoading, totalCredentials } =
  useChattigoCredentials()

function handleEdit(credential: ChattigoCredential) {
  openCredentialDialog(credential)
}

function handleDelete(credential: ChattigoCredential) {
  store.openDeleteDialog(credential)
}

function handleTest(credential: ChattigoCredential) {
  store.openTestDialog(credential)
}

async function confirmDelete() {
  if (store.deletingCredential) {
    await deleteCredential(store.deletingCredential.did)
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <i class="pi pi-whatsapp text-green-500" />
          Credenciales Chattigo
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Administra las credenciales de integracion con Chattigo WhatsApp Business
        </p>
      </div>
      <Button @click="openCredentialDialog(null)">
        <i class="pi pi-plus mr-2" />
        Nueva Credencial
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card class="glass-panel">
        <CardContent class="pt-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <i class="pi pi-list text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ totalCredentials }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total Credenciales</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel">
        <CardContent class="pt-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ store.enabledCount }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Activas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel">
        <CardContent class="pt-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
              <i class="pi pi-ban text-gray-600 dark:text-gray-400 text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ store.disabledCount }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Inactivas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <Card class="glass-card">
      <CardContent class="pt-6">
        <ChattigoCredentialsList
          @edit="handleEdit"
          @delete="handleDelete"
          @test="handleTest"
        />
      </CardContent>
    </Card>

    <!-- Form Dialog -->
    <ChattigoCredentialsForm />

    <!-- Test Dialog -->
    <ChattigoTestDialog />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog
      :open="store.showDeleteDialog"
      @update:open="(val: boolean) => { if (!val) closeDeleteDialog() }"
    >
      <AlertDialogContent class="glass-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Credencial</AlertDialogTitle>
          <AlertDialogDescription>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-exclamation-triangle text-red-500 dark:text-red-400 text-xl" />
              </div>
              <div>
                <p class="font-medium text-foreground">Esta seguro de eliminar esta credencial?</p>
                <p class="text-sm text-muted-foreground mt-1">
                  <strong>{{ store.deletingCredential?.name }}</strong>
                  <br />
                  DID: {{ store.deletingCredential?.did }}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert variant="warning" class="mt-2">
          <AlertDescription>
            Esta accion no se puede deshacer. Los mensajes ya no podran enviarse usando esta
            credencial.
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLoading">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isLoading"
            @click="confirmDelete"
          >
            <i v-if="isLoading" class="pi pi-spinner pi-spin mr-2" />
            <i v-else class="pi pi-trash mr-2" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
