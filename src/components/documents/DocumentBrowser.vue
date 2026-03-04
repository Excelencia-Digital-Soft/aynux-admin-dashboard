<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useKnowledge } from '@/composables/useKnowledge'
import { useToast } from '@/composables/useToast'
import { knowledgeApi } from '@/api/knowledge.api'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { tenantApi } from '@/api/tenant.api'
import { getTypeLabel, getTypeOptions, PAGE_SIZE_OPTIONS } from '@/utils/constants'
import type { Document, DocumentContext, AgentKnowledge, EmbeddingStatus } from '@/types/document.types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

interface Props {
  context?: DocumentContext
  source?: string
  agentKey?: string
  orgId?: string
  editable?: boolean
  showFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global',
  source: 'all',
  agentKey: '',
  orgId: '',
  editable: true,
  showFilters: true
})

const store = useKnowledgeStore()
const toast = useToast()

const regeneratingIds = ref<Set<string>>(new Set())

const {
  documents,
  totalDocuments,
  currentPage,
  pageSize,
  isLoading,
  filters,
  fetchDocuments,
  updateDocument,
  deleteDocument,
  hardDeleteDocument,
  changePage,
  changePageSize,
  applyFilters,
  startEditing,
  cancelEditing,
  requestDelete,
  cancelDelete,
  requestHardDelete,
  cancelHardDelete
} = useKnowledge()

// Local state for non-global sources
const localDocuments = ref<Array<Document | AgentKnowledge>>([])
const localLoading = ref(false)
const localError = ref<string | null>(null)

// Store document for hard delete
const hardDeleteDoc = ref<Document | AgentKnowledge | null>(null)

// Sorting
const sortField = ref<string>('updated_at')
const sortOrder = ref<1 | -1>(-1)

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 1 ? -1 : 1
  } else {
    sortField.value = field
    sortOrder.value = 1
  }
}

// Computed: use local documents for agent/tenant/all, store documents for global only
const displayDocuments = computed(() => {
  if (props.source === 'agent' || props.source === 'tenant' || props.source === 'all') {
    return localDocuments.value
  }
  return documents.value
})

const sortedDocuments = computed(() => {
  const docs = [...displayDocuments.value]
  return docs.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aVal = a[sortField.value]
    const bVal = b[sortField.value]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return -1 * sortOrder.value
    if (aVal > bVal) return 1 * sortOrder.value
    return 0
  })
})

const displayLoading = computed(() => {
  if (props.source === 'agent' || props.source === 'tenant' || props.source === 'all') {
    return localLoading.value
  }
  return isLoading.value
})

// Filter options
const typeOptions = computed(() => [
  { value: '__all__', label: 'Todos los tipos' },
  ...getTypeOptions(props.context)
])

// Filter state
const filterType = computed({
  get: () => filters.value.documentType || '__all__',
  set: (val: string) => applyFilters({ documentType: val === '__all__' ? undefined : val })
})

const filterCategory = computed({
  get: () => filters.value.category || '',
  set: (val: string) => applyFilters({ category: val || undefined })
})

const filterActiveStr = computed({
  get: () => {
    if (filters.value.activeOnly === true) return 'true'
    if (filters.value.activeOnly === false) return 'false'
    return 'all'
  },
  set: (val: string) => {
    if (val === 'true') applyFilters({ activeOnly: true })
    else if (val === 'false') applyFilters({ activeOnly: false })
    else applyFilters({ activeOnly: undefined })
  }
})

// Pagination
const totalPages = computed(() => Math.ceil(totalDocuments.value / pageSize.value))

// Edit dialog
const showEditDialog = computed(() => store.editingDocId !== null)
const editingDoc = computed(() => store.editData)

// Actions
async function handleEdit(doc: Document | AgentKnowledge) {
  if ('agent_key' in doc && doc.agent_key) {
    try {
      const fullDoc = await agentKnowledgeApi.getById(doc.agent_key, doc.id)
      startEditing(doc.id, { ...fullDoc, content: fullDoc.content ?? '' } as Document)
    } catch (err) {
      console.error('Error fetching full document:', err)
      startEditing(doc.id, { ...doc, content: doc.content_preview ?? doc.content ?? '' } as Document)
    }
  } else {
    startEditing(doc.id, { ...doc, content: doc.content ?? '' } as Document)
  }
}

async function handleSaveEdit() {
  if (store.editingDocId && store.editData) {
    await updateDocument(store.editingDocId, {
      title: store.editData.title,
      content: store.editData.content,
      category: store.editData.category,
      tags: store.editData.tags
    })
  }
}

async function handleDelete(doc: Document | AgentKnowledge, docId: string) {
  if (store.confirmDelete[docId]) {
    if ('agent_key' in doc && doc.agent_key) {
      try {
        await agentKnowledgeApi.delete(doc.agent_key, docId, false)
        toast.success('Documento desactivado')
        await loadDocuments()
      } catch (err) {
        console.error('Error deleting agent document:', err)
        toast.error('Error al desactivar documento')
      }
    } else {
      await deleteDocument(docId)
    }
    store.cancelDelete(docId)
  } else {
    requestDelete(docId)
  }
}

function handleRequestHardDelete(doc: Document | AgentKnowledge) {
  hardDeleteDoc.value = doc
  requestHardDelete(doc.id)
}

function handleCancelHardDelete() {
  hardDeleteDoc.value = null
  cancelHardDelete()
}

async function handleHardDelete() {
  if (store.confirmHardDelete && hardDeleteDoc.value) {
    const doc = hardDeleteDoc.value
    if ('agent_key' in doc && doc.agent_key) {
      try {
        await agentKnowledgeApi.delete(doc.agent_key, store.confirmHardDelete, true)
        toast.success('Documento eliminado permanentemente')
        await loadDocuments()
      } catch (err) {
        console.error('Error hard deleting agent document:', err)
        toast.error('Error al eliminar documento')
      }
      hardDeleteDoc.value = null
      store.cancelHardDelete()
    } else {
      await hardDeleteDocument(store.confirmHardDelete)
      hardDeleteDoc.value = null
    }
  }
}

async function handleRegenerateEmbedding(doc: Document | AgentKnowledge) {
  if (!('agent_key' in doc) || !doc.agent_key) {
    toast.warn('Solo disponible para documentos de agentes')
    return
  }

  regeneratingIds.value.add(doc.id)

  try {
    await agentKnowledgeApi.regenerateEmbedding(doc.agent_key, doc.id)
    toast.success('Embedding regenerado correctamente')
    await loadDocuments()
  } catch (err) {
    console.error('Error regenerating embedding:', err)
    toast.error('Error al regenerar embedding')
  } finally {
    regeneratingIds.value.delete(doc.id)
  }
}

function isRegenerating(docId: string): boolean {
  return regeneratingIds.value.has(docId)
}

function canRegenerateEmbedding(doc: Document | AgentKnowledge): boolean {
  return 'agent_key' in doc && !!doc.agent_key
}

function getEmbeddingStatus(doc: Document | AgentKnowledge): EmbeddingStatus {
  if ('embedding_status' in doc && doc.embedding_status) {
    return doc.embedding_status
  }
  return doc.has_embedding ? 'fresh' : 'missing'
}

function getEmbeddingStatusIcon(status: EmbeddingStatus): string {
  switch (status) {
    case 'fresh':
      return 'pi pi-check-circle text-green-500'
    case 'stale':
      return 'pi pi-exclamation-triangle text-amber-500'
    case 'missing':
      return 'pi pi-times-circle text-red-500'
    default:
      return 'pi pi-question-circle text-muted-foreground'
  }
}

function getEmbeddingTooltip(doc: Document | AgentKnowledge): string {
  const status = getEmbeddingStatus(doc)
  const embeddingDate = 'embedding_updated_at' in doc && doc.embedding_updated_at
    ? formatDate(doc.embedding_updated_at)
    : null

  switch (status) {
    case 'fresh':
      return embeddingDate
        ? `Embedding actualizado: ${embeddingDate}`
        : 'Embedding generado'
    case 'stale':
      return embeddingDate
        ? `Contenido modificado. Ultimo embedding: ${embeddingDate}`
        : 'Contenido modificado desde la generacion del embedding'
    case 'missing':
      return 'Sin embedding. El documento no puede ser encontrado por busqueda semantica.'
    default:
      return 'Estado desconocido'
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function truncateContent(content: string | undefined, maxLength = 100): string {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return 'pi pi-sort-alt opacity-30'
  return sortOrder.value === 1 ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down'
}

// Fetch documents based on source
async function loadDocuments() {
  localError.value = null

  if (props.source === 'agent') {
    if (!props.agentKey) {
      localDocuments.value = []
      return
    }
    localLoading.value = true
    try {
      const docs = await agentKnowledgeApi.list(props.agentKey, { activeOnly: false })
      localDocuments.value = docs
    } catch (err) {
      console.error('Error loading agent documents:', err)
      localError.value = 'Error al cargar documentos del agente'
      localDocuments.value = []
    } finally {
      localLoading.value = false
    }
  } else if (props.source === 'tenant') {
    if (!props.orgId) {
      localDocuments.value = []
      return
    }
    localLoading.value = true
    try {
      const response = await tenantApi.getDocuments(props.orgId, { activeOnly: false })
      localDocuments.value = response.documents
    } catch (err) {
      console.error('Error loading tenant documents:', err)
      localError.value = 'Error al cargar documentos del tenant'
      localDocuments.value = []
    } finally {
      localLoading.value = false
    }
  } else if (props.source === 'all') {
    localLoading.value = true
    try {
      const results = await Promise.allSettled([
        knowledgeApi.list({
          activeOnly: filters.value.activeOnly,
          documentType: filters.value.documentType,
          category: filters.value.category
        }),
        props.orgId
          ? tenantApi.getDocuments(props.orgId, { activeOnly: false })
          : Promise.resolve({ documents: [] })
      ])

      const allDocs: Array<Document | AgentKnowledge> = []

      if (results[0].status === 'fulfilled') {
        allDocs.push(...results[0].value.documents)
      }
      if (results[1].status === 'fulfilled') {
        allDocs.push(...results[1].value.documents)
      }

      localDocuments.value = allDocs
    } catch (err) {
      console.error('Error loading all documents:', err)
      localError.value = 'Error al cargar documentos'
      localDocuments.value = []
    } finally {
      localLoading.value = false
    }
  } else {
    fetchDocuments()
  }
}

watch(
  () => [props.source, props.agentKey, props.orgId],
  () => {
    loadDocuments()
  },
  { immediate: false }
)

onMounted(() => {
  loadDocuments()
})
</script>

<template>
  <div class="document-browser">
    <!-- Filters -->
    <div v-if="showFilters" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div>
        <Label class="mb-1">Tipo</Label>
        <Select :model-value="filterType" @update:model-value="(val: string) => filterType = val">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in typeOptions" :key="String(opt.value)" :value="String(opt.value)">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label class="mb-1">Categoria</Label>
        <Input
          v-model="filterCategory"
          placeholder="Filtrar por categoria"
        />
      </div>
      <div>
        <Label class="mb-1">Estado</Label>
        <Select v-model="filterActiveStr">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label class="mb-1">Por pagina</Label>
        <Select
          :model-value="String(pageSize)"
          @update:model-value="(val: string) => changePageSize(Number(val))"
        >
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="String(size)">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Error message -->
    <Alert v-if="localError" variant="destructive" class="mb-4">
      <AlertDescription class="flex items-center justify-between">
        {{ localError }}
        <Button variant="ghost" size="sm" @click="localError = null">
          <i class="pi pi-times text-xs" />
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Agent selection required message -->
    <Alert v-if="source === 'agent' && !agentKey" variant="info" class="mb-4">
      <AlertDescription>Selecciona un agente para ver sus documentos</AlertDescription>
    </Alert>

    <!-- Loading skeleton -->
    <div v-if="displayLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-14 bg-muted rounded animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="sortedDocuments.length === 0" class="text-center py-8 text-muted-foreground">
      <i class="pi pi-inbox text-4xl mb-2 block" />
      <p>No se encontraron documentos</p>
    </div>

    <!-- Data table -->
    <div v-else class="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              class="min-w-[200px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="toggleSort('title')"
            >
              <div class="flex items-center gap-1">
                Titulo
                <i :class="getSortIcon('title')" class="text-xs" />
              </div>
            </TableHead>
            <TableHead
              class="w-[150px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="toggleSort('document_type')"
            >
              <div class="flex items-center gap-1">
                Tipo
                <i :class="getSortIcon('document_type')" class="text-xs" />
              </div>
            </TableHead>
            <TableHead
              class="w-[120px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="toggleSort('category')"
            >
              <div class="flex items-center gap-1">
                Categoria
                <i :class="getSortIcon('category')" class="text-xs" />
              </div>
            </TableHead>
            <TableHead class="w-[100px]">Estado</TableHead>
            <TableHead class="w-[120px]">Embedding</TableHead>
            <TableHead
              class="w-[120px] cursor-pointer select-none hover:text-foreground transition-colors"
              @click="toggleSort('updated_at')"
            >
              <div class="flex items-center gap-1">
                Actualizado
                <i :class="getSortIcon('updated_at')" class="text-xs" />
              </div>
            </TableHead>
            <TableHead v-if="editable" class="w-[180px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(data, idx) in sortedDocuments"
            :key="data.id"
            :class="idx % 2 === 0 ? '' : 'bg-muted/50'"
          >
            <TableCell>
              <div class="font-medium">{{ data.title }}</div>
              <div class="text-sm text-muted-foreground">{{ truncateContent(data.content_preview ?? data.content) }}</div>
            </TableCell>
            <TableCell>{{ getTypeLabel(data.document_type) }}</TableCell>
            <TableCell>
              <span v-if="data.category" class="text-sm">{{ data.category }}</span>
              <span v-else class="text-muted-foreground">-</span>
            </TableCell>
            <TableCell>
              <Badge :variant="data.active ? 'success' : 'destructive'">
                {{ data.active ? 'Activo' : 'Inactivo' }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <i :class="getEmbeddingStatusIcon(getEmbeddingStatus(data))" />
                    </TooltipTrigger>
                    <TooltipContent>{{ getEmbeddingTooltip(data) }}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider v-if="canRegenerateEmbedding(data) && getEmbeddingStatus(data) !== 'fresh'">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-7 w-7 text-amber-500 hover:text-amber-600"
                        :disabled="isRegenerating(data.id)"
                        @click="handleRegenerateEmbedding(data)"
                      >
                        <i :class="isRegenerating(data.id) ? 'pi pi-spin pi-spinner' : 'pi pi-sync'" class="text-xs" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Regenerar embedding</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
            <TableCell class="text-sm">{{ formatDate(data.updated_at) }}</TableCell>
            <TableCell v-if="editable">
              <div class="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        @click="handleEdit(data)"
                      >
                        <i class="pi pi-pencil text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <template v-if="!store.confirmDelete[data.id]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-amber-500 hover:text-amber-600"
                          @click="handleDelete(data, data.id)"
                        >
                          <i class="pi pi-eye-slash text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Desactivar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </template>
                <template v-else>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-red-500 hover:text-red-600"
                          @click="handleDelete(data, data.id)"
                        >
                          <i class="pi pi-check text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Confirmar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8"
                          @click="cancelDelete(data.id)"
                        >
                          <i class="pi pi-times text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancelar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </template>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="outline"
                        size="icon"
                        class="h-8 w-8 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                        @click="handleRequestHardDelete(data)"
                      >
                        <i class="pi pi-trash text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar permanente</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalDocuments > 0"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4"
    >
      <div class="text-sm text-muted-foreground">
        {{ totalDocuments }} documento{{ totalDocuments !== 1 ? 's' : '' }} en total
      </div>
      <div class="flex items-center gap-2">
        <Select
          :model-value="String(pageSize)"
          @update:model-value="(val: string) => changePageSize(Number(val))"
        >
          <SelectTrigger class="w-[80px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="String(size)">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div class="flex items-center gap-1">
          <Button variant="outline" size="icon" class="h-8 w-8" :disabled="currentPage <= 1" @click="changePage(1)">
            <i class="pi pi-angle-double-left text-xs" />
          </Button>
          <Button variant="outline" size="icon" class="h-8 w-8" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
            <i class="pi pi-angle-left text-xs" />
          </Button>
          <span class="text-sm text-muted-foreground px-2">
            {{ currentPage }} / {{ totalPages || 1 }}
          </span>
          <Button variant="outline" size="icon" class="h-8 w-8" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
            <i class="pi pi-angle-right text-xs" />
          </Button>
          <Button variant="outline" size="icon" class="h-8 w-8" :disabled="currentPage >= totalPages" @click="changePage(totalPages)">
            <i class="pi pi-angle-double-right text-xs" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog :open="showEditDialog" @update:open="(val: boolean) => { if (!val) cancelEditing() }">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
          <DialogDescription class="sr-only">Editar documento de la base de conocimiento</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label class="mb-1">Titulo</Label>
            <Input v-model="store.editData.title" />
          </div>
          <div>
            <Label class="mb-1">Contenido</Label>
            <Textarea v-model="store.editData.content" :rows="10" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="mb-1">Categoria</Label>
              <Input v-model="store.editData.category" />
            </div>
            <div>
              <Label class="mb-1">Tags (separados por coma)</Label>
              <Input
                :model-value="store.editData.tags?.join(', ')"
                @update:model-value="(val: string | number) => { if (val) store.editData.tags = String(val).split(',').map((t: string) => t.trim()).filter(Boolean) }"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="cancelEditing">Cancelar</Button>
          <Button :loading="isLoading" @click="handleSaveEdit">
            <i class="pi pi-check mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Hard Delete Confirmation Dialog -->
    <Dialog :open="store.confirmHardDelete !== null" @update:open="(val: boolean) => { if (!val) handleCancelHardDelete() }">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Eliminar Permanentemente</DialogTitle>
          <DialogDescription class="sr-only">Confirmar eliminacion permanente del documento</DialogDescription>
        </DialogHeader>
        <div class="flex items-center gap-4">
          <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
          <div>
            <p class="font-medium">Esta accion no se puede deshacer.</p>
            <p class="text-sm text-muted-foreground mt-1">
              El documento sera eliminado permanentemente de la base de datos.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="handleCancelHardDelete">Cancelar</Button>
          <Button variant="destructive" @click="handleHardDelete">
            <i class="pi pi-trash mr-2" />
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
