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

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { createDocument, isLoading } = useKnowledge()

const activeTab = ref('pdf')

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
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="goBack">
            <i class="pi pi-arrow-left" />
          </Button>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Subir Documentos</h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400 mt-1 ml-10">
          Sube PDFs, crea documentos de texto o usa el editor Markdown
        </p>
      </div>
    </div>

    <!-- Destination Selector -->
    <Card class="glass-panel mb-4">
      <CardContent class="pt-6">
        <DestinationSelector
          v-model="destination"
          v-model:agentKey="agentKey"
        />
      </CardContent>
    </Card>

    <!-- Upload options -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="w-full justify-start rounded-none border-b border-gray-200/50 dark:border-white/10 bg-transparent h-auto p-0">
            <TabsTrigger
              value="pdf"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <i class="pi pi-file-pdf text-red-500 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger
              value="text"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <i class="pi pi-file-edit text-blue-500 mr-2" />
              Texto
            </TabsTrigger>
            <TabsTrigger
              value="markdown"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <i class="pi pi-code text-purple-500 mr-2" />
              Markdown
            </TabsTrigger>
          </TabsList>

          <!-- PDF Upload -->
          <TabsContent value="pdf" class="p-6 mt-0">
            <div class="max-w-2xl">
              <p class="text-gray-500 dark:text-gray-400 mb-4">
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
          </TabsContent>

          <!-- Text Upload -->
          <TabsContent value="text" class="p-6 mt-0">
            <div class="max-w-2xl">
              <p class="text-gray-500 dark:text-gray-400 mb-4">
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
          </TabsContent>

          <!-- Markdown Editor -->
          <TabsContent value="markdown" class="p-6 mt-0">
            <div class="max-w-4xl">
              <p class="text-gray-500 dark:text-gray-400 mb-4">
                Usa el editor Markdown para crear documentos con formato enriquecido.
              </p>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titulo <span class="text-red-500">*</span>
                    </label>
                    <Input
                      v-model="markdownTitle"
                      placeholder="Titulo del documento"
                      :disabled="isLoading"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo <span class="text-red-500">*</span>
                    </label>
                    <Select v-model="markdownType" :disabled="isLoading">
                      <SelectTrigger>
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
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria (opcional)
                    </label>
                    <Input
                      v-model="markdownCategory"
                      placeholder="Ej: ventas, soporte"
                      :disabled="isLoading"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (opcional)
                    </label>
                    <Input
                      v-model="markdownTags"
                      placeholder="Separados por coma"
                      :disabled="isLoading"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contenido <span class="text-red-500">*</span>
                  </label>
                  <MarkdownEditor
                    v-model="markdownContent"
                    :disabled="isLoading"
                  />
                </div>

                <div class="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    @click="handleCancel"
                    :disabled="isLoading"
                  >
                    Cancelar
                  </Button>
                  <Button
                    @click="handleMarkdownSubmit"
                    :disabled="!markdownTitle || !markdownContent || !markdownType || isLoading"
                  >
                    <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
                    <i v-else class="pi pi-plus mr-2" />
                    Crear Documento
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>
