<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { getTypeOptions } from '@/utils/constants'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { tenantApi } from '@/api/tenant.api'
import type { DocumentContext, UploadDestination } from '@/types/document.types'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

const { createDocument, isLoading } = useKnowledge()

const title = ref('')
const content = ref('')
const documentType = ref('')
const category = ref('')
const tags = ref('')
const error = ref<string | null>(null)

const typeOptions = computed(() => getTypeOptions(props.context))

const canUpload = computed(() =>
  title.value.trim() &&
  content.value.trim() &&
  documentType.value &&
  !isLoading.value
)

async function handleUpload() {
  if (!canUpload.value) return

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

  try {
    let doc: unknown
    const tagsList = tags.value
      ? tags.value.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined

    if (props.destination === 'agent' && props.agentKey) {
      // Create in agent knowledge
      doc = await agentKnowledgeApi.create(props.agentKey, {
        title: title.value.trim(),
        content: content.value.trim(),
        document_type: documentType.value,
        category: category.value.trim() || undefined,
        tags: tagsList
      })
    } else if (props.destination === 'tenant' && props.orgId) {
      // Create in tenant documents
      doc = await tenantApi.createDocument(props.orgId, {
        title: title.value.trim(),
        content: content.value.trim(),
        document_type: documentType.value,
        category: category.value.trim() || undefined,
        tags: tagsList
      })
    } else {
      // Create in global knowledge (default)
      doc = await createDocument({
        title: title.value.trim(),
        content: content.value.trim(),
        document_type: documentType.value,
        category: category.value.trim() || undefined,
        tags: tagsList
      })
    }

    if (doc) {
      emit('uploaded', doc)
      resetForm()
    }
  } catch (err) {
    console.error('Create document error:', err)
    error.value = 'Error al crear el documento'
  }
}

function resetForm() {
  title.value = ''
  content.value = ''
  documentType.value = ''
  category.value = ''
  tags.value = ''
  error.value = null
}

function handleCancel() {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <div class="text-uploader">
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertDescription class="flex items-center justify-between">
        {{ error }}
        <button class="text-sm underline ml-2" @click="error = null">Cerrar</button>
      </AlertDescription>
    </Alert>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Titulo *
        </label>
        <Input
          v-model="title"
          placeholder="Titulo del documento"
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

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contenido *
        </label>
        <Textarea
          v-model="content"
          placeholder="Escribe o pega el contenido del documento aqui..."
          :disabled="isLoading"
          class="min-h-[250px]"
        />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ content.length }} caracteres
        </p>
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
          <i v-else class="pi pi-plus mr-2" />
          Crear Documento
        </Button>
      </div>
    </div>
  </div>
</template>
