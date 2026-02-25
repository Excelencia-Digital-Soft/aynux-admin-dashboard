<script setup lang="ts">
import { computed } from 'vue'
import { useChattigoCredentialsStore } from '@/stores/chattigoCredentials.store'
import { useChattigoCredentials } from '@/composables/useChattigoCredentials'
import { formatDID } from '@/types/chattigoCredentials.types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    :open="store.showTestDialog"
    @update:open="(val: boolean) => { if (!val) closeTestDialog() }"
  >
    <DialogContent class="glass-dialog sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle>Probar Conexion Chattigo</DialogTitle>
        <DialogDescription class="sr-only">
          Probar la conexion de credenciales Chattigo
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Credential Info -->
        <div v-if="selectedCredential" class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <i class="pi pi-whatsapp text-green-600 dark:text-green-400 text-lg" />
            </div>
            <div>
              <div class="font-medium text-foreground">{{ selectedCredential.name }}</div>
              <div class="text-sm text-muted-foreground">{{ formatDID(selectedCredential.did) }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">Bot:</span>
              <span class="ml-1 font-medium text-foreground">{{ selectedCredential.bot_name }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Refresh:</span>
              <span class="ml-1 font-medium text-foreground">{{ selectedCredential.token_refresh_hours }}h</span>
            </div>
          </div>
        </div>

        <!-- Test Button -->
        <div class="flex justify-center">
          <Button
            :disabled="isLoading"
            class="bg-green-600 hover:bg-green-700 text-white"
            @click="handleTest"
          >
            <i v-if="isLoading" class="pi pi-spinner pi-spin mr-2" />
            <i v-else class="pi pi-play mr-2" />
            Probar Conexion
          </Button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex flex-col items-center py-4">
          <i class="pi pi-spinner pi-spin text-4xl text-primary" />
          <p class="text-sm text-muted-foreground mt-2">Probando autenticacion con Chattigo...</p>
        </div>

        <!-- Test Result -->
        <div v-if="testResult && !isLoading">
          <Alert :variant="testResult.success ? 'success' : 'destructive'" class="w-full">
            <AlertDescription>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
                  <span class="font-medium">
                    {{ testResult.success ? 'Conexion exitosa' : 'Error de conexion' }}
                  </span>
                </div>

                <p class="text-sm">{{ testResult.message }}</p>

                <div v-if="testResult.success && testResult.token_valid_until" class="text-sm">
                  <span class="text-muted-foreground">Token valido hasta:</span>
                  <span class="ml-1 font-medium">
                    {{ formatDateTime(testResult.token_valid_until) }}
                  </span>
                </div>

                <p v-if="testResult.error_detail" class="text-sm text-red-600 dark:text-red-400">
                  {{ testResult.error_detail }}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeTestDialog">Cerrar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
