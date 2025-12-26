<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { getTypeOptions } from '@/utils/constants'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { tenantApi } from '@/api/tenant.api'
import type { DocumentContext, UploadDestination } from '@/types/document.types'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'

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
    <Message v-if="error" severity="error" :closable="true" @close="error = null">
      {{ error }}
    </Message>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Titulo *
        </label>
        <InputText
          v-model="title"
          placeholder="Titulo del documento"
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

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Contenido *
        </label>
        <Textarea
          v-model="content"
          rows="10"
          placeholder="Escribe o pega el contenido del documento aqui..."
          class="w-full"
          :disabled="isLoading"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{ content.length }} caracteres
        </p>
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

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-4">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleCancel"
          :disabled="isLoading"
        />
        <Button
          label="Crear Documento"
          icon="pi pi-plus"
          @click="handleUpload"
          :disabled="!canUpload"
          :loading="isLoading"
        />
      </div>
    </div>
  </div>
</template>
