<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { analyticsApi } from '@/api/analytics.api'
import type { EmbeddingStats, Document } from '@/types/document.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

const {
  documents,
  isLoading,
  fetchDocuments,
  syncAllEmbeddings,
  batchRegenerateEmbeddings,
  regenerateEmbedding
} = useKnowledge()

const embeddingStats = ref<EmbeddingStats | null>(null)
const missingEmbeddings = ref<Array<{ id: string; title: string; document_type: string }>>([])
const loadingStats = ref(false)
const isSyncing = ref(false)
const showSyncDialog = ref(false)
const syncResult = ref<{ synced: number; failed: number } | null>(null)
const selectedDocs = ref<Array<{ id: string; title: string }>>([])

const coveragePercentage = computed(() => {
  if (!embeddingStats.value) return 0
  const total = embeddingStats.value.total_documents
  if (total === 0) return 100
  return Math.round((embeddingStats.value.with_embedding / total) * 100)
})

const coverageSeverity = computed(() => {
  const pct = coveragePercentage.value
  if (pct >= 95) return 'success'
  if (pct >= 80) return 'warn'
  return 'danger'
})

async function loadEmbeddingStats() {
  loadingStats.value = true
  try {
    const [stats, missing] = await Promise.all([
      analyticsApi.getEmbeddingStats(),
      analyticsApi.getDocumentsWithoutEmbedding({ pageSize: 100 })
    ])
    embeddingStats.value = stats
    missingEmbeddings.value = missing.documents
  } catch (error) {
    console.error('Error loading embedding stats:', error)
  } finally {
    loadingStats.value = false
  }
}

async function handleSyncAll() {
  isSyncing.value = true
  syncResult.value = null

  try {
    const result = await syncAllEmbeddings()
    if (result) {
      syncResult.value = result
      await loadEmbeddingStats()
    }
  } finally {
    isSyncing.value = false
  }
}

async function handleRegenerateSelected() {
  if (selectedDocs.value.length === 0) return

  isSyncing.value = true
  try {
    const ids = selectedDocs.value.map(d => d.id)
    await batchRegenerateEmbeddings(ids)
    selectedDocs.value = []
    await loadEmbeddingStats()
  } finally {
    isSyncing.value = false
  }
}

async function handleRegenerateSingle(id: string) {
  await regenerateEmbedding(id)
  await loadEmbeddingStats()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Nunca'
  return new Date(dateStr).toLocaleString('es-ES')
}

function openSyncDialog() {
  syncResult.value = null
  showSyncDialog.value = true
}

onMounted(() => {
  loadEmbeddingStats()
  fetchDocuments()
})
</script>

<template>
  <div class="embeddings-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gestion de Embeddings</h1>
        <p class="text-gray-500 mt-1">
          Monitorea y sincroniza los embeddings de la base de conocimiento
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          severity="secondary"
          @click="loadEmbeddingStats"
          :loading="loadingStats"
        />
        <Button
          label="Sincronizar Todo"
          icon="pi pi-sync"
          @click="openSyncDialog"
          :disabled="isSyncing"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loadingStats && !embeddingStats" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Stats content -->
    <template v-if="embeddingStats">
      <!-- Summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-database text-2xl text-blue-500 mb-2" />
              <div class="text-3xl font-bold text-gray-800">
                {{ embeddingStats.total_documents }}
              </div>
              <div class="text-sm text-gray-500">Total documentos</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-check-circle text-2xl text-green-500 mb-2" />
              <div class="text-3xl font-bold text-green-600">
                {{ embeddingStats.with_embedding }}
              </div>
              <div class="text-sm text-gray-500">Con embedding</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-times-circle text-2xl text-red-500 mb-2" />
              <div class="text-3xl font-bold text-red-600">
                {{ embeddingStats.without_embedding }}
              </div>
              <div class="text-sm text-gray-500">Sin embedding</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <i class="pi pi-percentage text-2xl text-purple-500 mb-2" />
              <div class="text-3xl font-bold" :class="{
                'text-green-600': coveragePercentage >= 95,
                'text-amber-600': coveragePercentage >= 80 && coveragePercentage < 95,
                'text-red-600': coveragePercentage < 80
              }">
                {{ coveragePercentage }}%
              </div>
              <div class="text-sm text-gray-500">Cobertura</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Coverage progress -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-blue-500" />
            <span>Cobertura de Embeddings</span>
          </div>
        </template>
        <template #content>
          <div class="mb-4">
            <ProgressBar :value="coveragePercentage" :showValue="true" />
          </div>
          <div class="flex justify-between text-sm text-gray-500">
            <span>Ultima sincronizacion: {{ formatDate(embeddingStats.last_sync_at) }}</span>
            <span>Modelos: {{ Object.keys(embeddingStats.embedding_models).join(', ') || 'N/A' }}</span>
          </div>
        </template>
      </Card>

      <!-- Models breakdown -->
      <Card v-if="Object.keys(embeddingStats.embedding_models).length > 0" class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-box text-purple-500" />
            <span>Modelos de Embedding</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(count, model) in embeddingStats.embedding_models"
              :key="model"
              class="p-4 bg-gray-50 rounded-lg text-center"
            >
              <div class="text-xl font-bold text-gray-800">{{ count }}</div>
              <div class="text-sm text-gray-500">{{ model }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Missing embeddings -->
      <Card v-if="missingEmbeddings.length > 0">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-amber-500" />
              <span>Documentos sin Embedding ({{ missingEmbeddings.length }})</span>
            </div>
            <Button
              v-if="selectedDocs.length > 0"
              :label="`Regenerar (${selectedDocs.length})`"
              icon="pi pi-refresh"
              size="small"
              @click="handleRegenerateSelected"
              :loading="isSyncing"
            />
          </div>
        </template>
        <template #content>
          <DataTable
            v-model:selection="selectedDocs"
            :value="missingEmbeddings"
            dataKey="id"
            stripedRows
            class="p-datatable-sm"
            :paginator="missingEmbeddings.length > 10"
            :rows="10"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem" />

            <Column field="title" header="Titulo" style="min-width: 300px">
              <template #body="{ data }">
                <div class="font-medium">{{ data.title }}</div>
                <div class="text-xs text-gray-400">{{ data.id }}</div>
              </template>
            </Column>

            <Column field="document_type" header="Tipo" style="width: 150px">
              <template #body="{ data }">
                <Tag :value="data.document_type" severity="secondary" />
              </template>
            </Column>

            <Column header="Acciones" style="width: 120px">
              <template #body="{ data }">
                <Button
                  icon="pi pi-refresh"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="handleRegenerateSingle(data.id)"
                  v-tooltip="'Regenerar embedding'"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- All good message -->
      <Message v-if="missingEmbeddings.length === 0 && coveragePercentage === 100" severity="success" :closable="false">
        Todos los documentos tienen embeddings generados
      </Message>
    </template>

    <!-- Sync dialog -->
    <Dialog
      v-model:visible="showSyncDialog"
      header="Sincronizar Embeddings"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <Message v-if="!syncResult && !isSyncing" severity="info" :closable="false">
          Esta operacion generara embeddings para todos los documentos que no los tengan.
          <br />
          <strong>Documentos sin embedding: {{ embeddingStats?.without_embedding || 0 }}</strong>
        </Message>

        <div v-if="isSyncing" class="text-center py-8">
          <ProgressSpinner />
          <p class="mt-4 text-gray-600">Sincronizando embeddings...</p>
          <p class="text-sm text-gray-400">Esto puede tomar varios minutos</p>
        </div>

        <Message v-if="syncResult" :severity="syncResult.failed > 0 ? 'warn' : 'success'" :closable="false">
          <div>
            <strong>Sincronizacion completada</strong>
            <div class="mt-2">
              <span class="text-green-600">{{ syncResult.synced }} sincronizados</span>
              <span v-if="syncResult.failed > 0" class="ml-4 text-red-600">
                {{ syncResult.failed }} fallaron
              </span>
            </div>
          </div>
        </Message>
      </div>

      <template #footer>
        <Button
          label="Cerrar"
          severity="secondary"
          @click="showSyncDialog = false"
          :disabled="isSyncing"
        />
        <Button
          v-if="!syncResult"
          label="Iniciar Sincronizacion"
          icon="pi pi-sync"
          @click="handleSyncAll"
          :loading="isSyncing"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.embeddings-page :deep(.p-card-content) {
  padding: 0.75rem;
}
</style>
