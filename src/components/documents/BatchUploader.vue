<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { useToast } from '@/composables/useToast'
import { getTypeOptions } from '@/utils/constants'
import type { DocumentContext, BatchUploadItem } from '@/types/document.types'

import FileUpload from 'primevue/fileupload'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

interface Props {
  context?: DocumentContext
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global',
  maxFiles: 20
})

const emit = defineEmits<{
  (e: 'complete', results: { success: number; failed: number }): void
  (e: 'cancel'): void
}>()

const toast = useToast()
const { createDocument, isLoading } = useKnowledge()

const uploadQueue = ref<BatchUploadItem[]>([])
const isProcessing = ref(false)
const currentIndex = ref(0)
const overallProgress = ref(0)
const defaultType = ref('')
const defaultCategory = ref('')

const typeOptions = computed(() => getTypeOptions(props.context))

const pendingCount = computed(() =>
  uploadQueue.value.filter(item => item.status === 'pending').length
)
const successCount = computed(() =>
  uploadQueue.value.filter(item => item.status === 'success').length
)
const errorCount = computed(() =>
  uploadQueue.value.filter(item => item.status === 'error').length
)

function onFilesSelect(event: { files: File[] }) {
  const files = event.files

  if (uploadQueue.value.length + files.length > props.maxFiles) {
    toast.warn(`Maximo ${props.maxFiles} archivos permitidos`)
    return
  }

  for (const file of files) {
    const isPdf = file.type === 'application/pdf'
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')

    if (!isPdf && !isText) {
      toast.warn(`Archivo ${file.name} no soportado. Solo PDF y TXT.`)
      continue
    }

    uploadQueue.value.push({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      document_type: defaultType.value || '',
      category: defaultCategory.value || undefined,
      status: 'pending'
    })
  }
}

function removeFromQueue(index: number) {
  uploadQueue.value.splice(index, 1)
}

function clearQueue() {
  uploadQueue.value = []
  currentIndex.value = 0
  overallProgress.value = 0
}

async function processQueue() {
  if (uploadQueue.value.length === 0) {
    toast.warn('No hay archivos en la cola')
    return
  }

  // Validate all items have document type
  const invalidItems = uploadQueue.value.filter(item => !item.document_type)
  if (invalidItems.length > 0) {
    toast.warn('Todos los documentos deben tener un tipo asignado')
    return
  }

  isProcessing.value = true
  currentIndex.value = 0

  for (let i = 0; i < uploadQueue.value.length; i++) {
    const item = uploadQueue.value[i]
    if (item.status !== 'pending') continue

    currentIndex.value = i
    item.status = 'uploading'
    item.progress = 0

    try {
      if (item.file) {
        // Read file content
        const content = await readFileContent(item.file)

        await createDocument({
          title: item.title,
          content,
          document_type: item.document_type,
          category: item.category,
          tags: item.tags
        })
      }

      item.status = 'success'
      item.progress = 100
    } catch (error) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : 'Error desconocido'
    }

    overallProgress.value = Math.round(((i + 1) / uploadQueue.value.length) * 100)
  }

  isProcessing.value = false

  emit('complete', {
    success: successCount.value,
    failed: errorCount.value
  })

  if (errorCount.value === 0) {
    toast.success(`${successCount.value} documentos subidos correctamente`)
  } else {
    toast.warn(`${successCount.value} exitos, ${errorCount.value} errores`)
  }
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsText(file)
  })
}

function getStatusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
  const map: Record<string, 'info' | 'success' | 'warn' | 'danger' | 'secondary'> = {
    pending: 'secondary',
    uploading: 'info',
    success: 'success',
    error: 'danger'
  }
  return map[status] || 'secondary'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    uploading: 'Subiendo...',
    success: 'Completado',
    error: 'Error'
  }
  return map[status] || status
}
</script>

<template>
  <div class="batch-uploader">
    <!-- Default settings -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tipo por defecto
        </label>
        <Select
          v-model="defaultType"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar tipo"
          class="w-full"
          :disabled="isProcessing"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Categoria por defecto
        </label>
        <InputText
          v-model="defaultCategory"
          placeholder="Ej: ventas, soporte"
          class="w-full"
          :disabled="isProcessing"
        />
      </div>
    </div>

    <!-- File upload zone -->
    <FileUpload
      mode="basic"
      :multiple="true"
      accept=".pdf,.txt,.md"
      :maxFileSize="10000000"
      :disabled="isProcessing"
      @select="onFilesSelect"
      chooseLabel="Seleccionar Archivos"
      class="mb-4"
    />

    <Message v-if="uploadQueue.length === 0" severity="info" :closable="false">
      Arrastra archivos PDF o TXT aqui, o usa el boton para seleccionarlos
    </Message>

    <!-- Queue table -->
    <DataTable
      v-if="uploadQueue.length > 0"
      :value="uploadQueue"
      stripedRows
      class="p-datatable-sm mb-4"
    >
      <Column field="title" header="Titulo" style="min-width: 200px">
        <template #body="{ data, index }">
          <InputText
            v-model="data.title"
            class="w-full"
            :disabled="isProcessing || data.status !== 'pending'"
          />
        </template>
      </Column>

      <Column field="document_type" header="Tipo" style="width: 150px">
        <template #body="{ data }">
          <Select
            v-model="data.document_type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tipo"
            class="w-full"
            :disabled="isProcessing || data.status !== 'pending'"
          />
        </template>
      </Column>

      <Column field="category" header="Categoria" style="width: 120px">
        <template #body="{ data }">
          <InputText
            v-model="data.category"
            placeholder="Categoria"
            class="w-full"
            :disabled="isProcessing || data.status !== 'pending'"
          />
        </template>
      </Column>

      <Column field="status" header="Estado" style="width: 120px">
        <template #body="{ data }">
          <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)" />
        </template>
      </Column>

      <Column header="" style="width: 60px">
        <template #body="{ index, data }">
          <Button
            v-if="data.status === 'pending'"
            icon="pi pi-times"
            severity="danger"
            text
            rounded
            size="small"
            @click="removeFromQueue(index)"
            :disabled="isProcessing"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Progress -->
    <div v-if="isProcessing" class="mb-4">
      <p class="text-sm text-gray-600 mb-2">
        Procesando {{ currentIndex + 1 }} de {{ uploadQueue.length }}...
      </p>
      <ProgressBar :value="overallProgress" />
    </div>

    <!-- Summary -->
    <div v-if="uploadQueue.length > 0" class="flex items-center gap-4 mb-4 text-sm">
      <span class="text-gray-600">
        Total: <strong>{{ uploadQueue.length }}</strong>
      </span>
      <span v-if="pendingCount > 0" class="text-blue-600">
        Pendientes: <strong>{{ pendingCount }}</strong>
      </span>
      <span v-if="successCount > 0" class="text-green-600">
        Completados: <strong>{{ successCount }}</strong>
      </span>
      <span v-if="errorCount > 0" class="text-red-600">
        Errores: <strong>{{ errorCount }}</strong>
      </span>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <Button
        label="Limpiar"
        severity="secondary"
        @click="clearQueue"
        :disabled="isProcessing || uploadQueue.length === 0"
      />
      <Button
        label="Cancelar"
        severity="secondary"
        @click="emit('cancel')"
        :disabled="isProcessing"
      />
      <Button
        label="Procesar Cola"
        icon="pi pi-upload"
        @click="processQueue"
        :disabled="isProcessing || pendingCount === 0"
        :loading="isProcessing"
      />
    </div>
  </div>
</template>
