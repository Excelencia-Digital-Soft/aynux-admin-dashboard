<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { getTypeOptions } from '@/utils/constants'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { tenantApi } from '@/api/tenant.api'
import type { DocumentContext, UploadDestination } from '@/types/document.types'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

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
const isDragOver = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)

const typeOptions = computed(() => getTypeOptions(props.context))

const canUpload = computed(() => file.value && documentType.value && !isLoading.value)

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    setFile(input.files[0])
  }
}

function setFile(f: File) {
  if (!f.name.toLowerCase().endsWith('.pdf')) {
    error.value = 'Solo se permiten archivos PDF'
    return
  }
  if (f.size > 10_000_000) {
    error.value = 'El archivo no debe superar los 10 MB'
    return
  }
  file.value = f
  error.value = null

  // Auto-fill title from filename
  if (!title.value) {
    title.value = f.name.replace(/\.pdf$/i, '')
  }
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    setFile(event.dataTransfer.files[0])
  }
}

function onDragOver(event: DragEvent) {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function removeFile() {
  file.value = null
  uploadProgress.value = 0
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
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
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleCancel() {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <div class="pdf-uploader">
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertDescription class="flex items-center justify-between">
        {{ error }}
        <button class="text-sm underline ml-2" @click="error = null">Cerrar</button>
      </AlertDescription>
    </Alert>

    <!-- Drop zone -->
    <div class="mb-4">
      <div
        v-if="!file"
        :class="[
          'glass-panel border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragOver
            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-500/10'
            : 'border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30'
        ]"
        @click="fileInputRef?.click()"
        @drop.prevent="onDrop"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,application/pdf"
          class="hidden"
          @change="onFileSelect"
        />
        <i class="pi pi-cloud-upload text-4xl text-gray-400 dark:text-gray-500 mb-3" />
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium text-violet-600 dark:text-violet-400">Haz clic para seleccionar</span>
          o arrastra un archivo PDF aqui
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          PDF hasta 10 MB
        </p>
      </div>

      <!-- Selected file display -->
      <div v-else class="glass-panel p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="pi pi-file-pdf text-2xl text-red-500" />
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ file.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ (file.size / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" @click="removeFile" :disabled="isLoading">
          <i class="pi pi-times" />
        </Button>
      </div>
    </div>

    <!-- Metadata form -->
    <div v-if="file" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Titulo (opcional)
        </label>
        <Input
          v-model="title"
          placeholder="Se usara el nombre del archivo si no se especifica"
          :disabled="isLoading"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de documento *
        </label>
        <Select v-model="documentType" :disabled="isLoading">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in typeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoria (opcional)
          </label>
          <Input
            v-model="category"
            placeholder="Ej: ventas, soporte"
            :disabled="isLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags (opcional)
          </label>
          <Input
            v-model="tags"
            placeholder="Separados por coma"
            :disabled="isLoading"
          />
        </div>
      </div>

      <!-- Progress -->
      <div v-if="isLoading && uploadProgress > 0">
        <Progress :model-value="uploadProgress" class="h-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          Subiendo y procesando PDF...
        </p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="isLoading"
        >
          Cancelar
        </Button>
        <Button
          @click="handleUpload"
          :disabled="!canUpload"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-upload mr-2" />
          Subir PDF
        </Button>
      </div>
    </div>
  </div>
</template>
