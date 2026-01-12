<script setup lang="ts">
import { useAIModelsAdmin } from '@/composables/useAIModelsAdmin'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const {
  models,
  loading,
  seeding,
  editDialogVisible,
  editingModel,
  filters,
  stats,
  providerOptions,
  typeOptions,
  providerSeverity,
  fetchModels,
  seedExternal,
  toggleModel,
  openEditDialog,
  saveModel
} = useAIModelsAdmin()
</script>

<template>
  <div class="ai-models-page p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gestion de Modelos AI</h1>
        <p class="text-gray-500 mt-1">
          Administra los modelos de IA disponibles para los usuarios
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Seed Externos"
          icon="pi pi-cloud-download"
          severity="secondary"
          :loading="seeding"
          @click="seedExternal"
        />
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-800">{{ stats.total }}</div>
            <div class="text-gray-500">Total modelos</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats.enabled }}</div>
            <div class="text-gray-500">Habilitados</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-400">{{ stats.disabled }}</div>
            <div class="text-gray-500">Deshabilitados</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <Select
              v-model="filters.provider"
              :options="providerOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
              @change="fetchModels"
            />
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="filters.model_type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
              @change="fetchModels"
            />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <ToggleSwitch v-model="filters.enabled_only" @change="fetchModels" />
            <span class="text-sm text-gray-600">Solo habilitados</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Models Table -->
    <Card>
      <template #content>
        <div v-if="loading" class="flex justify-center py-8">
          <ProgressSpinner />
        </div>

        <DataTable
          v-else
          :value="models"
          :paginator="true"
          :rows="15"
          :rowsPerPageOptions="[10, 15, 25, 50]"
          sortField="sort_order"
          :sortOrder="1"
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-500">
              <i class="pi pi-box text-4xl mb-4" />
              <p>No hay modelos registrados</p>
              <p class="text-sm mt-2">Usa "Seed Externos" para agregar modelos de proveedores externos</p>
            </div>
          </template>

          <Column field="display_name" header="Modelo" sortable>
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.display_name }}</div>
                <div class="text-xs text-gray-400">{{ data.model_id }}</div>
              </div>
            </template>
          </Column>

          <Column field="provider" header="Proveedor" sortable>
            <template #body="{ data }">
              <Tag :value="data.provider" :severity="providerSeverity(data.provider)" />
            </template>
          </Column>

          <Column field="family" header="Familia" sortable>
            <template #body="{ data }">
              {{ data.family || '-' }}
            </template>
          </Column>

          <Column field="parameter_size" header="Tamano" sortable>
            <template #body="{ data }">
              {{ data.parameter_size || '-' }}
            </template>
          </Column>

          <Column field="model_type" header="Tipo">
            <template #body="{ data }">
              <Tag
                :value="data.model_type"
                :severity="data.model_type === 'llm' ? 'info' : 'secondary'"
              />
            </template>
          </Column>

          <Column header="Capacidades">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Tag v-if="data.supports_functions" value="Func" severity="success" class="text-xs" />
                <Tag v-if="data.supports_vision" value="Vision" severity="warn" class="text-xs" />
              </div>
            </template>
          </Column>

          <Column field="sort_order" header="Orden" sortable style="width: 80px" />

          <Column field="is_enabled" header="Habilitado" style="width: 100px">
            <template #body="{ data }">
              <ToggleSwitch
                :modelValue="data.is_enabled"
                @update:modelValue="toggleModel(data)"
              />
            </template>
          </Column>

          <Column header="Acciones" style="width: 80px">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                @click="openEditDialog(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      header="Editar Modelo"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div v-if="editingModel" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar</label>
          <InputText v-model="editingModel.display_name" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea v-model="editingModel.description" rows="3" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <InputNumber v-model="editingModel.sort_order" class="w-full" :min="0" :max="1000" />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <ToggleSwitch v-model="editingModel.is_default" />
            <span class="text-sm">Es modelo por defecto</span>
          </div>
        </div>

        <Message severity="info" :closable="false">
          <p class="text-sm">
            <strong>ID:</strong> {{ editingModel.model_id }}<br />
            <strong>Proveedor:</strong> {{ editingModel.provider }}<br />
            <strong>Origen:</strong> {{ editingModel.sync_source }}
          </p>
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="editDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" severity="success" @click="saveModel" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.ai-models-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
