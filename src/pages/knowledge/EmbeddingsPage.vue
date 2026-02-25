<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { analyticsApi } from '@/api/analytics.api'
import type { EmbeddingStats } from '@/types/document.types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

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
const selectedIds = ref<Set<string>>(new Set())

// Pagination
const currentPage = ref(1)
const pageSize = 10

const coveragePercentage = computed(() => {
  if (!embeddingStats.value) return 0
  const total = embeddingStats.value.total_documents
  if (total === 0) return 100
  return Math.round((embeddingStats.value.with_embedding / total) * 100)
})

const coverageColor = computed(() => {
  const pct = coveragePercentage.value
  if (pct >= 95) return 'text-green-600 dark:text-green-400'
  if (pct >= 80) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const progressIndicatorClass = computed(() => {
  const pct = coveragePercentage.value
  if (pct >= 95) return 'bg-green-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-red-500'
})

// Pagination computed
const totalPages = computed(() => Math.ceil(missingEmbeddings.value.length / pageSize))
const paginatedMissing = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return missingEmbeddings.value.slice(start, start + pageSize)
})

const allPageSelected = computed(() => {
  if (paginatedMissing.value.length === 0) return false
  return paginatedMissing.value.every(d => selectedIds.value.has(d.id))
})

function toggleSelectAll(checked: boolean) {
  if (checked) {
    paginatedMissing.value.forEach(d => selectedIds.value.add(d.id))
  } else {
    paginatedMissing.value.forEach(d => selectedIds.value.delete(d.id))
  }
}

function toggleSelect(id: string, checked: boolean) {
  if (checked) {
    selectedIds.value.add(id)
  } else {
    selectedIds.value.delete(id)
  }
}

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
  if (selectedIds.value.size === 0) return

  isSyncing.value = true
  try {
    const ids = Array.from(selectedIds.value)
    await batchRegenerateEmbeddings(ids)
    selectedIds.value = new Set()
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
  <TooltipProvider>
    <div class="max-w-[1400px] mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestion de Embeddings</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Monitorea y sincroniza los embeddings de la base de conocimiento
          </p>
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            @click="loadEmbeddingStats"
            :disabled="loadingStats"
          >
            <i :class="['pi pi-refresh mr-2', { 'pi-spin': loadingStats }]" />
            Actualizar
          </Button>
          <Button @click="openSyncDialog" :disabled="isSyncing">
            <i class="pi pi-sync mr-2" />
            Sincronizar Todo
          </Button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loadingStats && !embeddingStats" class="text-center py-12 text-gray-500 dark:text-gray-400">
        <i class="pi pi-spin pi-spinner text-2xl mb-2" />
        <p>Cargando estadisticas...</p>
      </div>

      <!-- Stats content -->
      <template v-if="embeddingStats">
        <!-- Summary cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card class="glass-panel text-center">
            <CardContent class="pt-6">
              <i class="pi pi-database text-2xl text-blue-500 dark:text-blue-400 mb-2" />
              <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {{ embeddingStats.total_documents }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total documentos</div>
            </CardContent>
          </Card>

          <Card class="glass-panel text-center">
            <CardContent class="pt-6">
              <i class="pi pi-check-circle text-2xl text-green-500 dark:text-green-400 mb-2" />
              <div class="text-3xl font-bold text-green-600 dark:text-green-400">
                {{ embeddingStats.with_embedding }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Con embedding</div>
            </CardContent>
          </Card>

          <Card class="glass-panel text-center">
            <CardContent class="pt-6">
              <i class="pi pi-times-circle text-2xl text-red-500 dark:text-red-400 mb-2" />
              <div class="text-3xl font-bold text-red-600 dark:text-red-400">
                {{ embeddingStats.without_embedding }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Sin embedding</div>
            </CardContent>
          </Card>

          <Card class="glass-panel text-center">
            <CardContent class="pt-6">
              <i class="pi pi-percentage text-2xl text-purple-500 dark:text-purple-400 mb-2" />
              <div class="text-3xl font-bold" :class="coverageColor">
                {{ coveragePercentage }}%
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Cobertura</div>
            </CardContent>
          </Card>
        </div>

        <!-- Coverage progress -->
        <Card class="glass-card mb-6">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <i class="pi pi-chart-bar text-blue-500 dark:text-blue-400" />
              Cobertura de Embeddings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Progreso</span>
                <span class="text-sm font-medium" :class="coverageColor">{{ coveragePercentage }}%</span>
              </div>
              <Progress :model-value="coveragePercentage" :indicator-class="progressIndicatorClass" />
            </div>
            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Ultima sincronizacion: {{ formatDate(embeddingStats.last_sync_at) }}</span>
              <span>Modelos: {{ Object.keys(embeddingStats.embedding_models).join(', ') || 'N/A' }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- Models breakdown -->
        <Card v-if="Object.keys(embeddingStats.embedding_models).length > 0" class="glass-card mb-6">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <i class="pi pi-box text-purple-500 dark:text-purple-400" />
              Modelos de Embedding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(count, model) in embeddingStats.embedding_models"
                :key="model"
                class="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-gray-100 dark:border-white/10"
              >
                <div class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ count }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ model }}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Missing embeddings -->
        <Card v-if="missingEmbeddings.length > 0" class="glass-card overflow-hidden">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle class="flex items-center gap-2 text-base">
              <i class="pi pi-exclamation-triangle text-amber-500" />
              Documentos sin Embedding ({{ missingEmbeddings.length }})
            </CardTitle>
            <Button
              v-if="selectedIds.size > 0"
              size="sm"
              @click="handleRegenerateSelected"
              :disabled="isSyncing"
            >
              <i :class="['pi pi-refresh mr-2', { 'pi-spin': isSyncing }]" />
              Regenerar ({{ selectedIds.size }})
            </Button>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[50px]">
                    <Checkbox
                      :checked="allPageSelected"
                      @update:checked="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead class="min-w-[300px]">Titulo</TableHead>
                  <TableHead class="w-[150px]">Tipo</TableHead>
                  <TableHead class="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="doc in paginatedMissing" :key="doc.id">
                  <TableCell>
                    <Checkbox
                      :checked="selectedIds.has(doc.id)"
                      @update:checked="(checked: boolean) => toggleSelect(doc.id, checked)"
                    />
                  </TableCell>
                  <TableCell>
                    <div class="font-medium text-gray-800 dark:text-gray-100">{{ doc.title }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 font-mono">{{ doc.id }}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{{ doc.document_type }}</Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          @click="handleRegenerateSingle(doc.id)"
                        >
                          <i class="pi pi-refresh text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Regenerar embedding</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200/50 dark:border-white/10">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Pagina {{ currentPage }} de {{ totalPages }}
              </span>
              <div class="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="currentPage <= 1"
                  @click="currentPage--"
                >
                  <i class="pi pi-chevron-left text-xs" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="currentPage >= totalPages"
                  @click="currentPage++"
                >
                  <i class="pi pi-chevron-right text-xs" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- All good message -->
        <Alert v-if="missingEmbeddings.length === 0 && coveragePercentage === 100" class="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <i class="pi pi-check-circle text-green-600 dark:text-green-400" />
          <AlertDescription class="text-green-700 dark:text-green-300">
            Todos los documentos tienen embeddings generados
          </AlertDescription>
        </Alert>
      </template>

      <!-- Sync dialog -->
      <Dialog v-model:open="showSyncDialog">
        <DialogContent class="sm:max-w-[500px] glass-dialog">
          <DialogHeader>
            <DialogTitle>Sincronizar Embeddings</DialogTitle>
            <DialogDescription class="sr-only">
              Generar embeddings faltantes para documentos
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <Alert v-if="!syncResult && !isSyncing" class="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <i class="pi pi-info-circle text-blue-600 dark:text-blue-400" />
              <AlertDescription class="text-blue-700 dark:text-blue-300">
                Esta operacion generara embeddings para todos los documentos que no los tengan.
                <br />
                <strong>Documentos sin embedding: {{ embeddingStats?.without_embedding || 0 }}</strong>
              </AlertDescription>
            </Alert>

            <div v-if="isSyncing" class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-3xl text-primary-600 dark:text-primary-400" />
              <p class="mt-4 text-gray-600 dark:text-gray-300">Sincronizando embeddings...</p>
              <p class="text-sm text-gray-400 dark:text-gray-500">Esto puede tomar varios minutos</p>
            </div>

            <Alert
              v-if="syncResult"
              :class="syncResult.failed > 0
                ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'"
            >
              <i :class="syncResult.failed > 0
                ? 'pi pi-exclamation-triangle text-amber-600 dark:text-amber-400'
                : 'pi pi-check-circle text-green-600 dark:text-green-400'"
              />
              <AlertDescription>
                <strong class="text-gray-800 dark:text-gray-100">Sincronizacion completada</strong>
                <div class="mt-2">
                  <span class="text-green-600 dark:text-green-400">{{ syncResult.synced }} sincronizados</span>
                  <span v-if="syncResult.failed > 0" class="ml-4 text-red-600 dark:text-red-400">
                    {{ syncResult.failed }} fallaron
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              @click="showSyncDialog = false"
              :disabled="isSyncing"
            >
              Cerrar
            </Button>
            <Button
              v-if="!syncResult"
              @click="handleSyncAll"
              :disabled="isSyncing"
            >
              <i :class="['pi mr-2', isSyncing ? 'pi-spin pi-spinner' : 'pi-sync']" />
              Iniciar Sincronizacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </TooltipProvider>
</template>
