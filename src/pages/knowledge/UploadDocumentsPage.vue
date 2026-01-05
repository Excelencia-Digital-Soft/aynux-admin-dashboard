<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PdfUploader from '@/components/documents/PdfUploader.vue'
import TextUploader from '@/components/documents/TextUploader.vue'
import MarkdownEditor from '@/components/documents/MarkdownEditor.vue'
import DestinationSelector from '@/components/documents/DestinationSelector.vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { useAuthStore } from '@/stores/auth.store'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { tenantApi } from '@/api/tenant.api'
import { getTypeOptions } from '@/utils/constants'
import { useToast } from '@/composables/useToast'
import type { UploadDestination, DocumentContext } from '@/types/document.types'

import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { createDocument, isLoading } = useKnowledge()

const activeTab = ref('0')

// Destination selection
const destination = ref<UploadDestination>('global')
const agentKey = ref('')

// Computed props for uploaders
const currentOrgId = computed(() => authStore.currentOrganization?.id || '')
const uploaderContext = computed<DocumentContext>(() =>
  destination.value === 'tenant' ? 'tenant' : 'global'
)

// Markdown document form
const markdownTitle = ref('')
const markdownContent = ref('')
const markdownType = ref('')
const markdownCategory = ref('')
const markdownTags = ref('')

const typeOptions = getTypeOptions('global')

function handleUploadComplete(doc: unknown) {
  toast.success('Documento subido correctamente')
  redirectToKnowledgeBase()
}

function redirectToKnowledgeBase() {
  const query: Record<string, string> = {}
  if (destination.value === 'agent' && agentKey.value) {
    query.source = 'agent'
    query.agent = agentKey.value
  } else if (destination.value === 'tenant') {
    query.source = 'tenant'
  } else {
    query.source = 'global'
  }
  router.push({ path: '/knowledge-base', query })
}

function handleCancel() {
  router.push('/knowledge-base')
}

async function handleMarkdownSubmit() {
  if (!markdownTitle.value.trim() || !markdownContent.value.trim() || !markdownType.value) {
    toast.warn('Por favor completa los campos requeridos')
    return
  }

  // Validate agent destination
  if (destination.value === 'agent' && !agentKey.value) {
    toast.warn('Debe seleccionar un agente')
    return
  }

  // Validate tenant destination
  if (destination.value === 'tenant' && !currentOrgId.value) {
    toast.warn('Debe seleccionar una organización')
    return
  }

  const tagsList = markdownTags.value
    ? markdownTags.value.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined

  let doc: unknown

  try {
    if (destination.value === 'agent' && agentKey.value) {
      // Create in agent knowledge
      doc = await agentKnowledgeApi.create(agentKey.value, {
        title: markdownTitle.value.trim(),
        content: markdownContent.value.trim(),
        document_type: markdownType.value,
        category: markdownCategory.value.trim() || undefined,
        tags: tagsList
      })
    } else if (destination.value === 'tenant' && currentOrgId.value) {
      // Create in tenant documents
      doc = await tenantApi.createDocument(currentOrgId.value, {
        title: markdownTitle.value.trim(),
        content: markdownContent.value.trim(),
        document_type: markdownType.value,
        category: markdownCategory.value.trim() || undefined,
        tags: tagsList
      })
    } else {
      // Create in global knowledge (default)
      doc = await createDocument({
        title: markdownTitle.value.trim(),
        content: markdownContent.value.trim(),
        document_type: markdownType.value,
        category: markdownCategory.value.trim() || undefined,
        tags: tagsList
      })
    }

    if (doc) {
      resetMarkdownForm()
      toast.success('Documento creado correctamente')
      redirectToKnowledgeBase()
    }
  } catch (err) {
    console.error('Create document error:', err)
    toast.error('Error al crear el documento')
  }
}

function resetMarkdownForm() {
  markdownTitle.value = ''
  markdownContent.value = ''
  markdownType.value = ''
  markdownCategory.value = ''
  markdownTags.value = ''
}

function goBack() {
  router.push('/knowledge-base')
}
</script>

<template>
  <div class="upload-documents-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            rounded
            @click="goBack"
          />
          <h1 class="text-2xl font-bold text-gray-800">Subir Documentos</h1>
        </div>
        <p class="text-gray-500 mt-1 ml-10">
          Sube PDFs, crea documentos de texto o usa el editor Markdown
        </p>
      </div>
    </div>

    <!-- Destination Selector -->
    <Card class="mb-4">
      <template #content>
        <DestinationSelector
          v-model="destination"
          v-model:agentKey="agentKey"
        />
      </template>
    </Card>

    <!-- Upload options -->
    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <div class="flex items-center gap-2">
                <i class="pi pi-file-pdf text-red-500" />
                <span>PDF</span>
              </div>
            </Tab>
            <Tab value="1">
              <div class="flex items-center gap-2">
                <i class="pi pi-file-edit text-blue-500" />
                <span>Texto</span>
              </div>
            </Tab>
            <Tab value="2">
              <div class="flex items-center gap-2">
                <i class="pi pi-code text-purple-500" />
                <span>Markdown</span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <!-- PDF Upload -->
            <TabPanel value="0">
              <div class="max-w-2xl">
                <p class="text-gray-500 mb-4">
                  Sube un archivo PDF. El contenido sera extraido automaticamente y se generara un embedding.
                </p>
                <PdfUploader
                  :context="uploaderContext"
                  :destination="destination"
                  :agent-key="agentKey"
                  :org-id="currentOrgId"
                  @uploaded="handleUploadComplete"
                  @cancel="handleCancel"
                />
              </div>
            </TabPanel>

            <!-- Text Upload -->
            <TabPanel value="1">
              <div class="max-w-2xl">
                <p class="text-gray-500 mb-4">
                  Crea un documento de texto simple. Ideal para FAQs, guias rapidas o contenido estructurado.
                </p>
                <TextUploader
                  :context="uploaderContext"
                  :destination="destination"
                  :agent-key="agentKey"
                  :org-id="currentOrgId"
                  @uploaded="handleUploadComplete"
                  @cancel="handleCancel"
                />
              </div>
            </TabPanel>

            <!-- Markdown Editor -->
            <TabPanel value="2">
              <div class="max-w-4xl">
                <p class="text-gray-500 mb-4">
                  Usa el editor Markdown para crear documentos con formato enriquecido.
                </p>

                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Titulo *
                      </label>
                      <InputText
                        v-model="markdownTitle"
                        placeholder="Titulo del documento"
                        class="w-full"
                        :disabled="isLoading"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Tipo *
                      </label>
                      <Select
                        v-model="markdownType"
                        :options="typeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar tipo"
                        class="w-full"
                        :disabled="isLoading"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Categoria (opcional)
                      </label>
                      <InputText
                        v-model="markdownCategory"
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
                        v-model="markdownTags"
                        placeholder="Separados por coma"
                        class="w-full"
                        :disabled="isLoading"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Contenido *
                    </label>
                    <MarkdownEditor
                      v-model="markdownContent"
                      :disabled="isLoading"
                    />
                  </div>

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
                      @click="handleMarkdownSubmit"
                      :loading="isLoading"
                      :disabled="!markdownTitle || !markdownContent || !markdownType"
                    />
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.upload-documents-page :deep(.p-card-content) {
  padding: 0;
}

.upload-documents-page :deep(.p-tabpanels) {
  padding: 1.5rem;
}
</style>
