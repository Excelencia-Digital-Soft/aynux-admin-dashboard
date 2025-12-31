<script setup lang="ts">
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import ChattigoCredentialsList from '@/components/chattigo/ChattigoCredentialsList.vue'
import ChattigoCredentialsForm from '@/components/chattigo/ChattigoCredentialsForm.vue'
import ChattigoTestDialog from '@/components/chattigo/ChattigoTestDialog.vue'
import type { ChattigoCredential } from '@/types/chattigoCredentials.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

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
  <div class="chattigo-credentials-page p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i class="pi pi-whatsapp text-green-500" />
          Credenciales Chattigo
        </h1>
        <p class="text-gray-500 mt-1">
          Administra las credenciales de integración con Chattigo WhatsApp Business
        </p>
      </div>
      <Button
        label="Nueva Credencial"
        icon="pi pi-plus"
        @click="openCredentialDialog(null)"
      />
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <i class="pi pi-list text-blue-600 text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">{{ totalCredentials }}</div>
              <div class="text-sm text-gray-500">Total Credenciales</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <i class="pi pi-check-circle text-green-600 text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">{{ store.enabledCount }}</div>
              <div class="text-sm text-gray-500">Activas</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <i class="pi pi-ban text-gray-600 text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">{{ store.disabledCount }}</div>
              <div class="text-sm text-gray-500">Inactivas</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Content -->
    <Card class="shadow-sm">
      <template #content>
        <ChattigoCredentialsList
          @edit="handleEdit"
          @delete="handleDelete"
          @test="handleTest"
        />
      </template>
    </Card>

    <!-- Form Dialog -->
    <ChattigoCredentialsForm />

    <!-- Test Dialog -->
    <ChattigoTestDialog />

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="store.showDeleteDialog"
      header="Eliminar Credencial"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <i class="pi pi-exclamation-triangle text-red-500 text-xl" />
        </div>
        <div>
          <p class="font-medium text-gray-800">¿Está seguro de eliminar esta credencial?</p>
          <p class="text-sm text-gray-500 mt-1">
            <strong>{{ store.deletingCredential?.name }}</strong>
            <br />
            DID: {{ store.deletingCredential?.did }}
          </p>
        </div>
      </div>

      <Message severity="warn" :closable="false" class="mt-4">
        Esta acción no se puede deshacer. Los mensajes ya no podrán enviarse usando esta
        credencial.
      </Message>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          :disabled="isLoading"
          @click="closeDeleteDialog"
        />
        <Button
          label="Eliminar"
          severity="danger"
          icon="pi pi-trash"
          :loading="isLoading"
          @click="confirmDelete"
        />
      </template>
    </Dialog>
  </div>
</template>
