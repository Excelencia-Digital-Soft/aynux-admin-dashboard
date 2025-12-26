<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { getTypeOptions } from '@/utils/constants'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { tenantApi } from '@/api/tenant.api'
import type { DocumentContext, UploadDestination } from '@/types/document.types'

import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'

interface Props {
  context?: DocumentContext
  destination?: UploadDestination
  agentKey?: string
  orgId?: string
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global',
  destination: 'global',
  agentKey: '',
  orgId: ''
})

const emit = defineEmits<{
  (e: 'uploaded', doc: unknown): void
  (e: 'cancel'): void
}>()

const { uploadPdf, isLoading } = useKnowledge()

const file = ref<File | null>(null)
const title = ref('')
const documentType = ref('')
const category = ref('')
const tags = ref('')
const error = ref<string | null>(null)
const uploadProgress = ref(0)

const typeOptions = computed(() => getTypeOptions(props.context))

const canUpload = computed(() => file.value && documentType.value && !isLoading.value)

function onFileSelect(event: { files: File[] }) {
  if (event.files.length > 0) {
    file.value = event.files[0]
    error.value = null

    // Auto-fill title from filename
    if (!title.value) {
      title.value = file.value.name.replace(/\.pdf$/i, '')
    }
  }
}

function onFileClear() {
  file.value = null
  uploadProgress.value = 0
}

async function handleUpload() {
  if (!file.value || !documentType.value) return

  // Validate agent destination
  if (props.destination === 'agent' && !props.agentKey) {
    error.value = 'Debe seleccionar un agente'
    return
  }

  // Validate tenant destination
  if (props.destination === 'tenant' && !props.orgId) {
    error.value = 'Debe seleccionar una organización'
    return
  }

  error.value = null
  uploadProgress.value = 10

  try {
    let doc: unknown

    if (props.destination === 'agent' && props.agentKey) {
      // Upload to agent knowledge
      doc = await agentKnowledgeApi.uploadDocument(props.agentKey, file.value, {
        title: title.value || undefined,
        documentType: documentType.value,
        category: category.value || undefined,
        tags: tags.value || undefined
      })
    } else if (props.destination === 'tenant' && props.orgId) {
      // Upload to tenant documents
      doc = await tenantApi.uploadDocument(props.orgId, file.value, {
        documentType: documentType.value,
        category: category.value || undefined,
        tags: tags.value || undefined
      })
    } else {
      // Upload to global knowledge (default)
      doc = await uploadPdf(file.value, {
        title: title.value || undefined,
        documentType: documentType.value,
        category: category.value || undefined,
        tags: tags.value || undefined
      })
    }

    uploadProgress.value = 100

    if (doc) {
      emit('uploaded', doc)
      resetForm()
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = 'Error al subir el archivo'
    uploadProgress.value = 0
  }
}

function resetForm() {
  file.value = null
  title.value = ''
  documentType.value = ''
  category.value = ''
  tags.value = ''
  uploadProgress.value = 0
  error.value = null
}

function handleCancel() {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <div class="pdf-uploader">
    <Message v-if="error" severity="error" :closable="true" @close="error = null">
      {{ error }}
    </Message>

    <!-- File upload -->
    <div class="mb-4">
      <FileUpload
        mode="basic"
        accept="application/pdf"
        :maxFileSize="10000000"
        chooseLabel="Seleccionar PDF"
        :auto="false"
        @select="onFileSelect"
        @clear="onFileClear"
        :disabled="isLoading"
      />
      <p v-if="file" class="text-sm text-gray-500 mt-2">
        <i class="pi pi-file-pdf text-red-500 mr-1" />
        {{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(2) }} MB)
      </p>
    </div>

    <!-- Metadata form -->
    <div v-if="file" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Titulo (opcional)
        </label>
        <InputText
          v-model="title"
          placeholder="Se usara el nombre del archivo si no se especifica"
          class="w-full"
          :disabled="isLoading"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tipo de documento *
        </label>
        <Select
          v-model="documentType"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar tipo"
          class="w-full"
          :disabled="isLoading"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Categoria (opcional)
          </label>
          <InputText
            v-model="category"
            placeholder="Ej: ventas, soporte"
            class="w-full"
            :disabled="isLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tags (opcional)
          </label>
          <InputText
            v-model="tags"
            placeholder="Separados por coma"
            class="w-full"
            :disabled="isLoading"
          />
        </div>
      </div>

      <!-- Progress -->
      <div v-if="isLoading && uploadProgress > 0">
        <ProgressBar :value="uploadProgress" :showValue="true" />
        <p class="text-sm text-gray-500 text-center mt-1">Subiendo y procesando PDF...</p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-4">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleCancel"
          :disabled="isLoading"
        />
        <Button
          label="Subir PDF"
          icon="pi pi-upload"
          @click="handleUpload"
          :disabled="!canUpload"
          :loading="isLoading"
        />
      </div>
    </div>
  </div>
</template>
