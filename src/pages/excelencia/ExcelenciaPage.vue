<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { catalogApi } from '@/api/agent.api'
import { useToast } from '@/composables/useToast'
import type {
  SoftwareModule,
  SoftwareModuleCreateRequest,
  SoftwareModuleUpdateRequest,
  ModuleCategory,
  ModuleStatus,
  PricingTier
} from '@/types/agent.types'
import {
  categoryOptions,
  statusOptions,
  pricingOptions,
  getStatusSeverity,
  getTierSeverity
} from '@/types/agent.types'

import ModuleEditDialog from '@/components/excelencia/ModuleEditDialog.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Chip from 'primevue/chip'
import Message from 'primevue/message'

const toast = useToast()

const isLoading = ref(false)
const modules = ref<SoftwareModule[]>([])
const activeTab = ref('0')

// Filters
const filterCategory = ref<ModuleCategory | undefined>(undefined)
const filterStatus = ref<ModuleStatus | undefined>(undefined)
const searchQuery = ref('')

// Dialog state
const showModuleDialog = ref(false)
const editingModule = ref<SoftwareModule | null>(null)
const confirmDelete = ref<Record<string, boolean>>({})

// Form state
const moduleForm = ref({
  code: '',
  name: '',
  description: '',
  category: 'general' as ModuleCategory,
  status: 'active' as ModuleStatus,
  features: '',
  pricing_tier: 'standard' as PricingTier
})

const isEditing = computed(() => editingModule.value !== null)

const allCategoryOptions = computed(() => [
  { value: undefined, label: 'Todas las categorias' },
  ...categoryOptions
])

const allStatusOptions = computed(() => [
  { value: undefined, label: 'Todos los estados' },
  ...statusOptions
])

const filteredModules = computed(() => {
  let result = modules.value

  if (filterCategory.value) {
    result = result.filter((m) => m.category === filterCategory.value)
  }
  if (filterStatus.value) {
    result = result.filter((m) => m.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    )
  }

  return result
})

async function fetchModules() {
  isLoading.value = true
  try {
    modules.value = await catalogApi.getModules()
  } finally {
    isLoading.value = false
  }
}

function openModuleDialog(module: SoftwareModule | null = null) {
  editingModule.value = module
  if (module) {
    moduleForm.value = {
      code: module.code,
      name: module.name,
      description: module.description || '',
      category: module.category,
      status: module.status,
      features: module.features?.join('\n') || '',
      pricing_tier: module.pricing_tier
    }
  } else {
    moduleForm.value = {
      code: '',
      name: '',
      description: '',
      category: 'general',
      status: 'active',
      features: '',
      pricing_tier: 'standard'
    }
  }
  showModuleDialog.value = true
}

function closeModuleDialog() {
  showModuleDialog.value = false
  editingModule.value = null
}

function onModuleDialogSaved() {
  closeModuleDialog()
  fetchModules()
}

async function handleSaveModule() {
  isLoading.value = true
  try {
    const features = moduleForm.value.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    if (isEditing.value && editingModule.value) {
      const updateData: SoftwareModuleUpdateRequest = {
        name: moduleForm.value.name,
        description: moduleForm.value.description,
        category: moduleForm.value.category,
        status: moduleForm.value.status,
        features,
        pricing_tier: moduleForm.value.pricing_tier
      }
      await catalogApi.updateModule(editingModule.value.id, updateData)
      toast.success('Modulo actualizado')
    } else {
      const createData: SoftwareModuleCreateRequest = {
        code: moduleForm.value.code,
        name: moduleForm.value.name,
        description: moduleForm.value.description,
        category: moduleForm.value.category,
        status: moduleForm.value.status,
        features,
        pricing_tier: moduleForm.value.pricing_tier
      }
      await catalogApi.createModule(createData)
      toast.success('Modulo creado')
    }

    closeModuleDialog()
    await fetchModules()
  } catch (error) {
    toast.error('Error al guardar modulo')
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteModule(moduleId: string, hardDelete: boolean) {
  if (!hardDelete && !confirmDelete.value[moduleId]) {
    confirmDelete.value[moduleId] = true
    setTimeout(() => {
      delete confirmDelete.value[moduleId]
    }, 3000)
    return
  }

  isLoading.value = true
  try {
    await catalogApi.deleteModule(moduleId, hardDelete)
    toast.success(hardDelete ? 'Modulo eliminado' : 'Modulo deprecado')
    delete confirmDelete.value[moduleId]
    await fetchModules()
  } catch (error) {
    toast.error('Error al eliminar modulo')
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES')
}

onMounted(() => {
  fetchModules()
})
</script>

<template>
  <div class="excelencia-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Excelencia Management</h1>
        <p class="text-gray-500 mt-1">Catalogo de productos de software</p>
      </div>
      <Button label="Nuevo Modulo" icon="pi pi-plus" severity="primary" @click="openModuleDialog(null)" />
    </div>

    <!-- Main Content -->
    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <div class="flex items-center gap-2">
                <i class="pi pi-list" />
                <span>Lista de Modulos</span>
              </div>
            </Tab>
            <Tab value="1">
              <div class="flex items-center gap-2">
                <i class="pi pi-plus" />
                <span>Crear Modulo</span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <!-- Module List Tab -->
            <TabPanel value="0">
              <!-- Filters -->
              <div class="flex gap-4 mb-4">
                <InputText
                  v-model="searchQuery"
                  placeholder="Buscar modulos..."
                  class="flex-1"
                />
                <Select
                  v-model="filterCategory"
                  :options="allCategoryOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Categoria"
                  class="w-48"
                />
                <Select
                  v-model="filterStatus"
                  :options="allStatusOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Estado"
                  class="w-40"
                />
                <Button
                  icon="pi pi-refresh"
                  severity="secondary"
                  @click="fetchModules"
                  :loading="isLoading"
                />
              </div>

              <!-- Loading -->
              <div v-if="isLoading && modules.length === 0" class="flex justify-center py-12">
                <ProgressSpinner />
              </div>

              <!-- Table -->
              <DataTable
                v-else
                :value="filteredModules"
                :loading="isLoading"
                stripedRows
                class="p-datatable-sm"
              >
                <template #empty>
                  <div class="text-center py-8 text-gray-500">
                    <i class="pi pi-box text-4xl mb-2" />
                    <p>No hay modulos</p>
                  </div>
                </template>

                <Column field="code" header="Codigo" style="width: 120px">
                  <template #body="{ data }">
                    <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ data.code }}</code>
                  </template>
                </Column>

                <Column field="name" header="Nombre" style="min-width: 200px">
                  <template #body="{ data }">
                    <div class="font-medium">{{ data.name }}</div>
                    <div class="text-xs text-gray-500 truncate max-w-xs">
                      {{ data.description }}
                    </div>
                  </template>
                </Column>

                <Column field="category" header="Categoria" style="width: 140px">
                  <template #body="{ data }">
                    <span class="capitalize">{{ data.category }}</span>
                  </template>
                </Column>

                <Column field="status" header="Estado" style="width: 120px">
                  <template #body="{ data }">
                    <Tag :severity="getStatusSeverity(data.status)" :value="data.status" />
                  </template>
                </Column>

                <Column field="pricing_tier" header="Plan" style="width: 120px">
                  <template #body="{ data }">
                    <Tag
                      :severity="getTierSeverity(data.pricing_tier)"
                      :value="data.pricing_tier"
                    />
                  </template>
                </Column>

                <Column field="features" header="Features" style="width: 200px">
                  <template #body="{ data }">
                    <div class="flex flex-wrap gap-1">
                      <Chip
                        v-for="(feat, idx) in (data.features || []).slice(0, 3)"
                        :key="idx"
                        :label="feat"
                        class="text-xs"
                      />
                      <span v-if="data.features?.length > 3" class="text-xs text-gray-400">
                        +{{ data.features.length - 3 }}
                      </span>
                    </div>
                  </template>
                </Column>

                <Column header="Acciones" style="width: 150px">
                  <template #body="{ data }">
                    <div class="flex gap-1">
                      <Button
                        icon="pi pi-pencil"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        @click="openModuleDialog(data)"
                      />
                      <Button
                        v-if="!confirmDelete[data.id]"
                        icon="pi pi-ban"
                        severity="warn"
                        text
                        rounded
                        size="small"
                        v-tooltip="'Deprecar'"
                        @click="handleDeleteModule(data.id, false)"
                      />
                      <Button
                        v-if="!confirmDelete[data.id]"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        size="small"
                        v-tooltip="'Eliminar'"
                        @click="handleDeleteModule(data.id, true)"
                      />
                      <template v-else>
                        <Button
                          icon="pi pi-check"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          @click="handleDeleteModule(data.id, false)"
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
            </TabPanel>

            <!-- Create Module Tab -->
            <TabPanel value="1">
              <div class="max-w-2xl">
                <Message severity="info" :closable="false" class="mb-4">
                  Crear un nuevo producto de software en company_knowledge con
                  document_type: software_catalog
                </Message>

                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Codigo *</label>
                      <InputText
                        v-model="moduleForm.code"
                        placeholder="Ej: MEDBOT-001"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <InputText v-model="moduleForm.name" placeholder="Nombre del producto" class="w-full" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                      <Select
                        v-model="moduleForm.category"
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <Select
                        v-model="moduleForm.status"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                    <Textarea
                      v-model="moduleForm.description"
                      rows="3"
                      placeholder="Descripcion del producto"
                      class="w-full"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Features (uno por linea)
                      </label>
                      <Textarea
                        v-model="moduleForm.features"
                        rows="5"
                        placeholder="chatbot&#10;whatsapp&#10;salud"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Plan de Precios</label>
                      <Select
                        v-model="moduleForm.pricing_tier"
                        :options="pricingOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                      />
                    </div>
                  </div>

                  <div class="pt-4">
                    <Button
                      label="Crear Modulo"
                      icon="pi pi-plus"
                      @click="handleSaveModule"
                      :loading="isLoading"
                      :disabled="!moduleForm.code || !moduleForm.name"
                    />
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- Edit Module Dialog -->
    <ModuleEditDialog
      v-model:visible="showModuleDialog"
      :module="editingModule"
      @saved="onModuleDialogSaved"
      @cancelled="closeModuleDialog"
    />
  </div>
</template>

<style scoped>
.excelencia-page :deep(.p-card-content) {
  padding: 0;
}

.excelencia-page :deep(.p-tabpanels) {
  padding: 1.5rem;
}
</style>
