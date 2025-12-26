<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useKnowledge } from '@/composables/useKnowledge'
import { useToast } from '@/composables/useToast'
import { getTypeOptions } from '@/utils/constants'
import type { DocumentContext, Document } from '@/types/document.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

interface Props {
  context?: DocumentContext
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global'
})

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const store = useKnowledgeStore()
const toast = useToast()
const {
  documents,
  isLoading,
  fetchDocuments,
  batchUpdate,
  batchDelete,
  batchRegenerateEmbeddings
} = useKnowledge()

const selectedDocs = ref<Document[]>([])
const showBatchDialog = ref(false)
const batchOperation = ref<'update' | 'delete' | 'activate' | 'deactivate' | 'regenerate'>('update')
const isProcessing = ref(false)
const progress = ref(0)

// Batch update fields
const updateCategory = ref('')
const updateType = ref('')
const updateTags = ref('')
const applyCategory = ref(false)
const applyType = ref(false)
const applyTags = ref(false)

const typeOptions = computed(() => [
  { value: '', label: 'Sin cambios' },
  ...getTypeOptions(props.context)
])

const selectedCount = computed(() => selectedDocs.value.length)

const operationOptions = [
  { value: 'update', label: 'Actualizar campos', icon: 'pi pi-pencil' },
  { value: 'activate', label: 'Activar documentos', icon: 'pi pi-check' },
  { value: 'deactivate', label: 'Desactivar documentos', icon: 'pi pi-times' },
  { value: 'regenerate', label: 'Regenerar embeddings', icon: 'pi pi-refresh' },
  { value: 'delete', label: 'Eliminar documentos', icon: 'pi pi-trash' }
]

function openBatchDialog() {
  if (selectedDocs.value.length === 0) {
    toast.warn('Selecciona al menos un documento')
    return
  }
  showBatchDialog.value = true
}

function closeBatchDialog() {
  showBatchDialog.value = false
  resetBatchFields()
}

function resetBatchFields() {
  updateCategory.value = ''
  updateType.value = ''
  updateTags.value = ''
  applyCategory.value = false
  applyType.value = false
  applyTags.value = false
  batchOperation.value = 'update'
}

async function executeBatchOperation() {
  const docIds = selectedDocs.value.map(doc => doc.id)

  isProcessing.value = true
  progress.value = 0

  try {
    switch (batchOperation.value) {
      case 'update': {
        const updateData: Record<string, unknown> = {}
        if (applyCategory.value) updateData.category = updateCategory.value || null
        if (applyType.value && updateType.value) updateData.document_type = updateType.value
        if (applyTags.value) {
          updateData.tags = updateTags.value
            ? updateTags.value.split(',').map(t => t.trim()).filter(Boolean)
            : []
        }

        if (Object.keys(updateData).length === 0) {
          toast.warn('Selecciona al menos un campo para actualizar')
          isProcessing.value = false
          return
        }

        await batchUpdate(docIds, updateData)
        toast.success(`${docIds.length} documentos actualizados`)
        break
      }

      case 'activate':
        await batchUpdate(docIds, { active: true })
        toast.success(`${docIds.length} documentos activados`)
        break

      case 'deactivate':
        await batchUpdate(docIds, { active: false })
        toast.success(`${docIds.length} documentos desactivados`)
        break

      case 'regenerate':
        await batchRegenerateEmbeddings(docIds)
        toast.success(`Embeddings regenerados para ${docIds.length} documentos`)
        break

      case 'delete':
        await batchDelete(docIds)
        toast.success(`${docIds.length} documentos eliminados`)
        break
    }

    progress.value = 100
    selectedDocs.value = []
    closeBatchDialog()
    fetchDocuments()
    emit('complete')
  } catch (error) {
    toast.error('Error en operacion batch')
  } finally {
    isProcessing.value = false
  }
}

function selectAll() {
  selectedDocs.value = [...documents.value]
}

function clearSelection() {
  selectedDocs.value = []
}

function getStatusSeverity(active: boolean): 'success' | 'danger' {
  return active ? 'success' : 'danger'
}
</script>

<template>
  <div class="batch-editor">
    <!-- Selection toolbar -->
    <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          <strong>{{ selectedCount }}</strong> documentos seleccionados
        </span>
        <Button
          label="Seleccionar todo"
          size="small"
          text
          @click="selectAll"
          :disabled="isLoading"
        />
        <Button
          label="Limpiar seleccion"
          size="small"
          text
          severity="secondary"
          @click="clearSelection"
          :disabled="selectedCount === 0"
        />
      </div>
      <Button
        label="Operacion Batch"
        icon="pi pi-cog"
        @click="openBatchDialog"
        :disabled="selectedCount === 0"
      />
    </div>

    <Message v-if="documents.length === 0" severity="info" :closable="false">
      No hay documentos para editar. Sube algunos documentos primero.
    </Message>

    <!-- Documents table with selection -->
    <DataTable
      v-if="documents.length > 0"
      v-model:selection="selectedDocs"
      :value="documents"
      :loading="isLoading"
      dataKey="id"
      stripedRows
      class="p-datatable-sm"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />

      <Column field="title" header="Titulo" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div class="font-medium">{{ data.title }}</div>
          <div class="text-xs text-gray-500">ID: {{ data.id.slice(0, 8) }}...</div>
        </template>
      </Column>

      <Column field="document_type" header="Tipo" :sortable="true" style="width: 120px" />

      <Column field="category" header="Categoria" style="width: 120px">
        <template #body="{ data }">
          <span v-if="data.category">{{ data.category }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>

      <Column field="active" header="Estado" style="width: 100px">
        <template #body="{ data }">
          <Tag :severity="getStatusSeverity(data.active)" :value="data.active ? 'Activo' : 'Inactivo'" />
        </template>
      </Column>

      <Column field="has_embedding" header="Embedding" style="width: 100px">
        <template #body="{ data }">
          <i :class="data.has_embedding ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
        </template>
      </Column>
    </DataTable>

    <!-- Batch operation dialog -->
    <Dialog
      v-model:visible="showBatchDialog"
      header="Operacion Batch"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeBatchDialog"
    >
      <div class="space-y-4">
        <Message severity="info" :closable="false">
          Esta operacion afectara a <strong>{{ selectedCount }}</strong> documentos
        </Message>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de operacion
          </label>
          <div class="space-y-2">
            <div
              v-for="option in operationOptions"
              :key="option.value"
              class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              :class="{ 'bg-blue-50': batchOperation === option.value }"
              @click="batchOperation = option.value as typeof batchOperation"
            >
              <i :class="option.icon" />
              <span>{{ option.label }}</span>
            </div>
          </div>
        </div>

        <!-- Update fields (shown only for update operation) -->
        <div v-if="batchOperation === 'update'" class="space-y-3 pt-4 border-t">
          <div class="flex items-center gap-3">
            <Checkbox v-model="applyCategory" :binary="true" inputId="applyCategory" />
            <label for="applyCategory" class="text-sm">Actualizar categoria:</label>
            <InputText
              v-model="updateCategory"
              placeholder="Nueva categoria"
              class="flex-1"
              :disabled="!applyCategory"
            />
          </div>

          <div class="flex items-center gap-3">
            <Checkbox v-model="applyType" :binary="true" inputId="applyType" />
            <label for="applyType" class="text-sm">Actualizar tipo:</label>
            <Select
              v-model="updateType"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Nuevo tipo"
              class="flex-1"
              :disabled="!applyType"
            />
          </div>

          <div class="flex items-center gap-3">
            <Checkbox v-model="applyTags" :binary="true" inputId="applyTags" />
            <label for="applyTags" class="text-sm">Actualizar tags:</label>
            <InputText
              v-model="updateTags"
              placeholder="tag1, tag2, tag3"
              class="flex-1"
              :disabled="!applyTags"
            />
          </div>
        </div>

        <!-- Warning for delete -->
        <Message v-if="batchOperation === 'delete'" severity="warn" :closable="false">
          Esta accion desactivara los documentos. Para eliminar permanentemente, usa la opcion individual.
        </Message>

        <!-- Progress -->
        <div v-if="isProcessing">
          <ProgressBar :value="progress" />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="closeBatchDialog"
          :disabled="isProcessing"
        />
        <Button
          :label="batchOperation === 'delete' ? 'Eliminar' : 'Ejecutar'"
          :severity="batchOperation === 'delete' ? 'danger' : 'primary'"
          :icon="isProcessing ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
          @click="executeBatchOperation"
          :disabled="isProcessing"
        />
      </template>
    </Dialog>
  </div>
</template>
