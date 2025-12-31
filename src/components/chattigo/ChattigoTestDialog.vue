<script setup lang="ts">
import { computed } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import { formatDID } from '@/types/chattigoCredentials.types'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const store = useChattigoCredentialsStore()
const { testConnection, isLoading, closeTestDialog } = useChattigoCredentials()

const testResult = computed(() => store.testResult)
const selectedCredential = computed(() => store.selectedCredential)

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleTest() {
  if (selectedCredential.value) {
    await testConnection(selectedCredential.value.did)
  }
}
</script>

<template>
  <Dialog
    :visible="store.showTestDialog"
    header="Probar Conexión Chattigo"
    :modal="true"
    :style="{ width: '450px' }"
    @update:visible="closeTestDialog"
  >
    <div class="space-y-4">
      <!-- Credential Info -->
      <div v-if="selectedCredential" class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <i class="pi pi-whatsapp text-green-600 text-lg" />
          </div>
          <div>
            <div class="font-medium">{{ selectedCredential.name }}</div>
            <div class="text-sm text-gray-500">{{ formatDID(selectedCredential.did) }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Bot:</span>
            <span class="ml-1 font-medium">{{ selectedCredential.bot_name }}</span>
          </div>
          <div>
            <span class="text-gray-500">Refresh:</span>
            <span class="ml-1 font-medium">{{ selectedCredential.token_refresh_hours }}h</span>
          </div>
        </div>
      </div>

      <!-- Test Button -->
      <div class="flex justify-center">
        <Button
          label="Probar Conexión"
          icon="pi pi-play"
          severity="success"
          :loading="isLoading"
          @click="handleTest"
        />
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center py-4">
        <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
        <p class="text-sm text-gray-500 mt-2">Probando autenticación con Chattigo...</p>
      </div>

      <!-- Test Result -->
      <div v-if="testResult && !isLoading">
        <Message
          :severity="testResult.success ? 'success' : 'error'"
          :closable="false"
          class="w-full"
        >
          <template #default>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
                <span class="font-medium">
                  {{ testResult.success ? 'Conexión exitosa' : 'Error de conexión' }}
                </span>
              </div>

              <p class="text-sm">{{ testResult.message }}</p>

              <div v-if="testResult.success && testResult.token_valid_until" class="text-sm">
                <span class="text-gray-600">Token válido hasta:</span>
                <span class="ml-1 font-medium">
                  {{ formatDateTime(testResult.token_valid_until) }}
                </span>
              </div>

              <p v-if="testResult.error_detail" class="text-sm text-red-600">
                {{ testResult.error_detail }}
              </p>
            </div>
          </template>
        </Message>
      </div>
    </div>

    <template #footer>
      <Button label="Cerrar" severity="secondary" @click="closeTestDialog" />
    </template>
  </Dialog>
</template>
