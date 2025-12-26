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

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'

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

// Track documents being regenerated
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

// Computed: use local documents for agent/tenant/all, store documents for global only
const displayDocuments = computed(() => {
  if (props.source === 'agent' || props.source === 'tenant' || props.source === 'all') {
    return localDocuments.value
  }
  return documents.value
})

const displayLoading = computed(() => {
  if (props.source === 'agent' || props.source === 'tenant' || props.source === 'all') {
    return localLoading.value
  }
  return isLoading.value
})

// Filter options
const typeOptions = computed(() => [
  { value: '', label: 'Todos los tipos' },
  ...getTypeOptions(props.context)
])

const statusOptions = [
  { value: undefined, label: 'Todos' },
  { value: true, label: 'Activos' },
  { value: false, label: 'Inactivos' }
]

// Edit dialog
const showEditDialog = computed(() => store.editingDocId !== null)
const editingDoc = computed(() => store.editData)

// Filter state
const filterType = computed({
  get: () => filters.value.documentType || '',
  set: (val: string) => applyFilters({ documentType: val || undefined })
})

const filterCategory = computed({
  get: () => filters.value.category || '',
  set: (val: string) => applyFilters({ category: val || undefined })
})

const filterActive = computed({
  get: () => filters.value.activeOnly,
  set: (val: boolean | undefined) => applyFilters({ activeOnly: val })
})

// Pagination
const first = computed(() => (currentPage.value - 1) * pageSize.value)

function onPageChange(event: { page: number; rows: number }) {
  if (event.rows !== pageSize.value) {
    changePageSize(event.rows)
  } else {
    changePage(event.page + 1)
  }
}

// Actions
async function handleEdit(doc: Document | AgentKnowledge) {
  // For agent knowledge, fetch full document to get content (list only returns content_preview)
  if ('agent_key' in doc && doc.agent_key) {
    try {
      const fullDoc = await agentKnowledgeApi.getById(doc.agent_key, doc.id)
      // Ensure content is always a string for the editor
      startEditing(doc.id, { ...fullDoc, content: fullDoc.content ?? '' } as Document)
    } catch (err) {
      console.error('Error fetching full document:', err)
      // Fallback to using content_preview if fetch fails
      startEditing(doc.id, { ...doc, content: doc.content_preview ?? doc.content ?? '' } as Document)
    }
  } else {
    // For regular documents, ensure content is always defined
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

async function handleDelete(docId: string) {
  if (store.confirmDelete[docId]) {
    await deleteDocument(docId)
  } else {
    requestDelete(docId)
  }
}

async function handleHardDelete() {
  if (store.confirmHardDelete) {
    await hardDeleteDocument(store.confirmHardDelete)
  }
}

async function handleRegenerateEmbedding(doc: Document | AgentKnowledge) {
  // Only works for agent knowledge documents
  if (!('agent_key' in doc) || !doc.agent_key) {
    toast.warn('Solo disponible para documentos de agentes')
    return
  }

  regeneratingIds.value.add(doc.id)

  try {
    await agentKnowledgeApi.regenerateEmbedding(doc.agent_key, doc.id)
    toast.success('Embedding regenerado correctamente')
    // Reload documents to update has_embedding status
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
  // AgentKnowledge has embedding_status from backend
  if ('embedding_status' in doc && doc.embedding_status) {
    return doc.embedding_status
  }
  // Fallback for Document type (global knowledge)
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
      return 'pi pi-question-circle text-gray-400'
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

function getStatusSeverity(active: boolean): 'success' | 'danger' {
  return active ? 'success' : 'danger'
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
    // Aggregate from Global + Tenant sources
    localLoading.value = true
    try {
      const results = await Promise.allSettled([
        // 1. Global knowledge
        knowledgeApi.list({
          activeOnly: filters.value.activeOnly,
          documentType: filters.value.documentType,
          category: filters.value.category
        }),
        // 2. Tenant documents (if orgId available)
        props.orgId
          ? tenantApi.getDocuments(props.orgId, { activeOnly: false })
          : Promise.resolve({ documents: [] })
      ])

      const allDocs: Array<Document | AgentKnowledge> = []

      // Add global docs
      if (results[0].status === 'fulfilled') {
        allDocs.push(...results[0].value.documents)
      }
      // Add tenant docs
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
    // Global only - use store
    fetchDocuments()
  }
}

// Watch for source/agentKey/orgId changes
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
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <Select
          v-model="filterType"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrar por tipo"
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <InputText
          v-model="filterCategory"
          placeholder="Filtrar por categoria"
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <Select
          v-model="filterActive"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrar por estado"
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Por pagina</label>
        <Select
          :model-value="pageSize"
          :options="PAGE_SIZE_OPTIONS"
          @update:model-value="changePageSize"
          class="w-full"
        />
      </div>
    </div>

    <!-- Error message -->
    <Message v-if="localError" severity="error" :closable="true" @close="localError = null" class="mb-4">
      {{ localError }}
    </Message>

    <!-- Agent selection required message -->
    <Message
      v-if="source === 'agent' && !agentKey"
      severity="info"
      :closable="false"
      class="mb-4"
    >
      Selecciona un agente para ver sus documentos
    </Message>

    <!-- Loading skeleton -->
    <div v-if="displayLoading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <!-- Data table -->
    <DataTable
      v-else
      :value="displayDocuments"
      :loading="displayLoading"
      stripedRows
      class="p-datatable-sm"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-inbox text-4xl mb-2" />
          <p>No se encontraron documentos</p>
        </div>
      </template>

      <Column field="title" header="Titulo" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div class="font-medium">{{ data.title }}</div>
          <div class="text-sm text-gray-500">{{ truncateContent(data.content_preview ?? data.content) }}</div>
        </template>
      </Column>

      <Column field="document_type" header="Tipo" :sortable="true" style="width: 150px">
        <template #body="{ data }">
          <span>{{ getTypeLabel(data.document_type) }}</span>
        </template>
      </Column>

      <Column field="category" header="Categoria" :sortable="true" style="width: 120px">
        <template #body="{ data }">
          <span v-if="data.category" class="text-sm">{{ data.category }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>

      <Column field="active" header="Estado" style="width: 100px">
        <template #body="{ data }">
          <Tag :severity="getStatusSeverity(data.active)" :value="data.active ? 'Activo' : 'Inactivo'" />
        </template>
      </Column>

      <Column field="embedding_status" header="Embedding" style="width: 120px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i
              :class="getEmbeddingStatusIcon(getEmbeddingStatus(data))"
              v-tooltip.top="getEmbeddingTooltip(data)"
            />
            <Button
              v-if="canRegenerateEmbedding(data) && getEmbeddingStatus(data) !== 'fresh'"
              :icon="isRegenerating(data.id) ? 'pi pi-spin pi-spinner' : 'pi pi-sync'"
              severity="warning"
              text
              rounded
              size="small"
              :disabled="isRegenerating(data.id)"
              @click="handleRegenerateEmbedding(data)"
              v-tooltip.top="'Regenerar embedding'"
            />
          </div>
        </template>
      </Column>

      <Column field="updated_at" header="Actualizado" :sortable="true" style="width: 120px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.updated_at) }}</span>
        </template>
      </Column>

      <Column v-if="editable" header="Acciones" style="width: 180px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              @click="handleEdit(data)"
              v-tooltip="'Editar'"
            />
            <Button
              v-if="!store.confirmDelete[data.id]"
              icon="pi pi-eye-slash"
              severity="warning"
              text
              rounded
              size="small"
              @click="handleDelete(data.id)"
              v-tooltip="'Desactivar'"
            />
            <template v-else>
              <Button
                icon="pi pi-check"
                severity="danger"
                text
                rounded
                size="small"
                @click="handleDelete(data.id)"
                v-tooltip="'Confirmar'"
              />
              <Button
                icon="pi pi-times"
                severity="secondary"
                text
                rounded
                size="small"
                @click="cancelDelete(data.id)"
                v-tooltip="'Cancelar'"
              />
            </template>
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              rounded
              size="small"
              @click="requestHardDelete(data.id)"
              v-tooltip="'Eliminar permanente'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Pagination -->
    <Paginator
      v-if="totalDocuments > 0"
      :first="first"
      :rows="pageSize"
      :totalRecords="totalDocuments"
      :rowsPerPageOptions="PAGE_SIZE_OPTIONS"
      @page="onPageChange"
      class="mt-4"
    />

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Editar Documento"
      :modal="true"
      :style="{ width: '600px' }"
      @hide="cancelEditing"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
          <InputText
            v-model="store.editData.title"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <Textarea
            v-model="store.editData.content"
            rows="10"
            class="w-full"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <InputText
              v-model="store.editData.category"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
            <InputText
              :model-value="store.editData.tags?.join(', ')"
              @update:model-value="(val) => { if (val) store.editData.tags = val.split(',').map((t: string) => t.trim()).filter(Boolean) }"
              class="w-full"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="cancelEditing" />
        <Button label="Guardar" icon="pi pi-check" @click="handleSaveEdit" :loading="isLoading" />
      </template>
    </Dialog>

    <!-- Hard Delete Confirmation Dialog -->
    <Dialog
      :visible="store.confirmHardDelete !== null"
      header="Eliminar Permanentemente"
      :modal="true"
      :style="{ width: '400px' }"
      @update:visible="(val) => !val && cancelHardDelete()"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
        <div>
          <p class="font-medium">Esta accion no se puede deshacer.</p>
          <p class="text-sm text-gray-500 mt-1">
            El documento sera eliminado permanentemente de la base de datos.
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="cancelHardDelete" />
        <Button label="Eliminar" severity="danger" icon="pi pi-trash" @click="handleHardDelete" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.document-browser :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}
</style>
