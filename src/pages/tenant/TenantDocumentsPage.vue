<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import { tenantApi } from '@/api/tenant.api'
import { useToast } from '@/composables/useToast'
import { getTypeOptions, getTypeLabel } from '@/utils/constants'
import type { TenantDocument, TenantDocumentCreateRequest } from '@/types/organization.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Paginator from 'primevue/paginator'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

const authStore = useAuthStore()
const orgStore = useOrganizationStore()
const toast = useToast()
const {
  tenantDocuments,
  totalTenantDocuments,
  tenantDocStats,
  isLoading,
  fetchTenantDocuments,
  createTenantDocument,
  updateTenantDocument,
  deleteTenantDocument,
  fetchTenantDocumentStats,
  setDocFilters
} = useOrganization()

const activeTab = ref('0')
const showDocDialog = ref(false)
const editingDoc = ref<TenantDocument | null>(null)
const confirmDelete = ref<Record<string, boolean>>({})

// Form state
const docForm = ref({
  title: '',
  content: '',
  document_type: '',
  category: '',
  tags: '',
  priority: 0
})

const currentOrgId = computed(() => authStore.currentOrgId)
const typeOptions = computed(() => getTypeOptions('tenant'))

const isEditing = computed(() => editingDoc.value !== null)

function getStatusSeverity(active: boolean): 'success' | 'danger' {
  return active ? 'success' : 'danger'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES')
}

function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

function openDocDialog(doc: TenantDocument | null = null) {
  editingDoc.value = doc
  if (doc) {
    docForm.value = {
      title: doc.title,
      content: doc.content,
      document_type: doc.document_type,
      category: doc.category || '',
      tags: doc.tags?.join(', ') || '',
      priority: doc.priority
    }
  } else {
    docForm.value = {
      title: '',
      content: '',
      document_type: '',
      category: '',
      tags: '',
      priority: 0
    }
  }
  showDocDialog.value = true
}

function closeDocDialog() {
  showDocDialog.value = false
  editingDoc.value = null
}

async function handleSaveDoc() {
  if (!currentOrgId.value) return

  const tags = docForm.value.tags
    ? docForm.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    : undefined

  if (isEditing.value && editingDoc.value) {
    await updateTenantDocument(editingDoc.value.id, {
      title: docForm.value.title,
      content: docForm.value.content,
      document_type: docForm.value.document_type,
      category: docForm.value.category || undefined,
      tags,
      priority: docForm.value.priority
    }, currentOrgId.value)
  } else {
    const createData: TenantDocumentCreateRequest = {
      title: docForm.value.title,
      content: docForm.value.content,
      document_type: docForm.value.document_type,
      category: docForm.value.category || undefined,
      tags,
      priority: docForm.value.priority
    }
    await createTenantDocument(createData, currentOrgId.value)
  }

  closeDocDialog()
  fetchTenantDocuments(currentOrgId.value)
}

async function handleDelete(docId: string) {
  if (!currentOrgId.value) return

  if (confirmDelete.value[docId]) {
    await deleteTenantDocument(docId, false, currentOrgId.value)
    delete confirmDelete.value[docId]
  } else {
    confirmDelete.value[docId] = true
    setTimeout(() => {
      delete confirmDelete.value[docId]
    }, 3000)
  }
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setDocFilters({ search: value || undefined })
  if (currentOrgId.value) {
    fetchTenantDocuments(currentOrgId.value)
  }
}

function handleTypeFilter(type: string | undefined) {
  setDocFilters({ documentType: type })
  if (currentOrgId.value) {
    fetchTenantDocuments(currentOrgId.value)
  }
}

function onPageChange(event: { page: number }) {
  orgStore.setDocPage(event.page + 1)
  if (currentOrgId.value) {
    fetchTenantDocuments(currentOrgId.value)
  }
}

watch(currentOrgId, (orgId) => {
  if (orgId) {
    fetchTenantDocuments(orgId)
    fetchTenantDocumentStats(orgId)
  }
}, { immediate: true })

onMounted(() => {
  if (currentOrgId.value) {
    fetchTenantDocuments(currentOrgId.value)
    fetchTenantDocumentStats(currentOrgId.value)
  }
})
</script>

<template>
  <div class="tenant-documents-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Documentos del Tenant</h1>
        <p class="text-gray-500 mt-1">
          Base de conocimiento especifica de tu organizacion
        </p>
      </div>
      <Button
        label="Nuevo Documento"
        icon="pi pi-plus"
        @click="openDocDialog(null)"
        :disabled="!currentOrgId"
      />
    </div>

    <!-- Stats cards -->
    <div v-if="tenantDocStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">
              {{ tenantDocStats.total_documents }}
            </div>
            <div class="text-sm text-gray-500">Total documentos</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">
              {{ tenantDocStats.active_documents }}
            </div>
            <div class="text-sm text-gray-500">Activos</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">
              {{ tenantDocStats.documents_with_embedding }}
            </div>
            <div class="text-sm text-gray-500">Con embedding</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-amber-600">
              {{ tenantDocStats.total_categories }}
            </div>
            <div class="text-sm text-gray-500">Categorias</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- No org selected -->
    <Card v-if="!currentOrgId">
      <template #content>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-building text-4xl mb-2" />
          <p>Selecciona una organizacion para ver sus documentos</p>
        </div>
      </template>
    </Card>

    <!-- Documents list -->
    <Card v-else>
      <template #content>
        <!-- Filters -->
        <div class="flex gap-4 mb-4 p-4">
          <InputText
            placeholder="Buscar documentos..."
            class="flex-1"
            @input="handleSearch"
          />
          <Select
            :options="[{ value: undefined, label: 'Todos los tipos' }, ...typeOptions]"
            optionLabel="label"
            optionValue="value"
            placeholder="Tipo"
            class="w-48"
            @update:model-value="handleTypeFilter"
          />
        </div>

        <!-- Loading -->
        <div v-if="isLoading && tenantDocuments.length === 0" class="flex justify-center py-12">
          <ProgressSpinner />
        </div>

        <!-- Table -->
        <DataTable
          v-else
          :value="tenantDocuments"
          :loading="isLoading"
          stripedRows
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-500">
              <i class="pi pi-file text-4xl mb-2" />
              <p>No hay documentos</p>
            </div>
          </template>

          <Column field="title" header="Titulo" style="min-width: 250px">
            <template #body="{ data }">
              <div class="font-medium">{{ data.title }}</div>
              <div class="text-sm text-gray-500">{{ truncateContent(data.content) }}</div>
            </template>
          </Column>

          <Column field="document_type" header="Tipo" style="width: 120px">
            <template #body="{ data }">
              <span>{{ getTypeLabel(data.document_type) }}</span>
            </template>
          </Column>

          <Column field="priority" header="Prioridad" style="width: 100px">
            <template #body="{ data }">
              <Tag
                :value="data.priority"
                :severity="data.priority > 5 ? 'danger' : data.priority > 0 ? 'warn' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="active" header="Estado" style="width: 100px">
            <template #body="{ data }">
              <Tag
                :severity="getStatusSeverity(data.active)"
                :value="data.active ? 'Activo' : 'Inactivo'"
              />
            </template>
          </Column>

          <Column field="has_embedding" header="Embedding" style="width: 100px">
            <template #body="{ data }">
              <i :class="data.has_embedding ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </template>
          </Column>

          <Column field="updated_at" header="Actualizado" style="width: 120px">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.updated_at) }}</span>
            </template>
          </Column>

          <Column header="Acciones" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="openDocDialog(data)"
                />
                <Button
                  v-if="!confirmDelete[data.id]"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="handleDelete(data.id)"
                />
                <template v-else>
                  <Button
                    icon="pi pi-check"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    @click="handleDelete(data.id)"
                  />
                  <Button
                    icon="pi pi-times"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    @click="delete confirmDelete[data.id]"
                  />
                </template>
              </div>
            </template>
          </Column>
        </DataTable>

        <!-- Pagination -->
        <Paginator
          v-if="totalTenantDocuments > orgStore.docPageSize"
          :first="(orgStore.docPage - 1) * orgStore.docPageSize"
          :rows="orgStore.docPageSize"
          :totalRecords="totalTenantDocuments"
          @page="onPageChange"
          class="mt-4"
        />
      </template>
    </Card>

    <!-- Document Dialog -->
    <Dialog
      v-model:visible="showDocDialog"
      :header="isEditing ? 'Editar Documento' : 'Nuevo Documento'"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
          <InputText v-model="docForm.title" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <Select
              v-model="docForm.document_type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <InputText v-model="docForm.category" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
          <Textarea v-model="docForm.content" rows="8" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <InputText v-model="docForm.tags" placeholder="tag1, tag2" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <Select
              v-model="docForm.priority"
              :options="[
                { label: 'Normal (0)', value: 0 },
                { label: 'Media (5)', value: 5 },
                { label: 'Alta (10)', value: 10 }
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="closeDocDialog" />
        <Button
          :label="isEditing ? 'Guardar' : 'Crear'"
          severity="success"
          @click="handleSaveDoc"
          :loading="isLoading"
          :disabled="!docForm.title || !docForm.content || !docForm.document_type"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.tenant-documents-page :deep(.p-card-content) {
  padding: 0;
}
</style>
