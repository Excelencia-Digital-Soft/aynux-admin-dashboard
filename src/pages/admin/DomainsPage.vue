<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { domainApi } from '@/api/domain.api'
import { useDomains } from '@/composables/useDomains'
import type { Domain, DomainCreateRequest, DomainUpdateRequest } from '@/types/domain.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'

const toast = useToast()
const confirm = useConfirm()
const { reset: resetDomainsCache } = useDomains()

// State
const domains = ref<Domain[]>([])
const loading = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const editingDomain = ref<Domain | null>(null)
const newDomain = ref<DomainCreateRequest>({
  domain_key: '',
  display_name: '',
  description: '',
  icon: 'pi-globe',
  color: 'info',
  enabled: true,
  sort_order: 0
})

// Color options for select
const colorOptions = [
  { value: 'info', label: 'Info (Azul)' },
  { value: 'success', label: 'Success (Verde)' },
  { value: 'warn', label: 'Warn (Amarillo)' },
  { value: 'help', label: 'Help (Morado)' },
  { value: 'secondary', label: 'Secondary (Gris)' }
]

// Stats
const stats = computed(() => ({
  total: domains.value.length,
  enabled: domains.value.filter((d) => d.enabled).length,
  disabled: domains.value.filter((d) => !d.enabled).length
}))

// Fetch domains
async function fetchDomains() {
  loading.value = true
  try {
    const response = await domainApi.list(false)
    domains.value = response.domains
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los dominios',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Toggle domain enabled
async function toggleDomain(domain: Domain) {
  try {
    const updated = await domainApi.toggle(domain.id)
    const index = domains.value.findIndex((d) => d.id === domain.id)
    if (index !== -1) {
      domains.value[index] = updated
    }
    resetDomainsCache()
    toast.add({
      severity: 'info',
      summary: updated.enabled ? 'Dominio habilitado' : 'Dominio deshabilitado',
      detail: domain.display_name,
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cambiar el estado',
      life: 3000
    })
  }
}

// Edit domain
function openEditDialog(domain: Domain) {
  editingDomain.value = { ...domain }
  editDialogVisible.value = true
}

async function saveDomain() {
  if (!editingDomain.value) return

  try {
    const updateData: DomainUpdateRequest = {
      display_name: editingDomain.value.display_name,
      description: editingDomain.value.description || undefined,
      icon: editingDomain.value.icon || undefined,
      color: editingDomain.value.color || undefined,
      enabled: editingDomain.value.enabled,
      sort_order: editingDomain.value.sort_order
    }
    const updated = await domainApi.update(editingDomain.value.id, updateData)
    const index = domains.value.findIndex((d) => d.id === updated.id)
    if (index !== -1) {
      domains.value[index] = updated
    }
    resetDomainsCache()
    editDialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Dominio actualizado',
      detail: updated.display_name,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo actualizar el dominio',
      life: 3000
    })
  }
}

// Create domain
function openCreateDialog() {
  newDomain.value = {
    domain_key: '',
    display_name: '',
    description: '',
    icon: 'pi-globe',
    color: 'info',
    enabled: true,
    sort_order: domains.value.length + 1
  }
  createDialogVisible.value = true
}

async function createDomain() {
  if (!newDomain.value.domain_key || !newDomain.value.display_name) {
    toast.add({
      severity: 'warn',
      summary: 'Campos requeridos',
      detail: 'Domain key y nombre son obligatorios',
      life: 3000
    })
    return
  }

  try {
    const created = await domainApi.create(newDomain.value)
    domains.value.push(created)
    resetDomainsCache()
    createDialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Dominio creado',
      detail: created.display_name,
      life: 3000
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error && 'response' in error
        ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          'No se pudo crear el dominio')
        : 'No se pudo crear el dominio'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000
    })
  }
}

// Delete domain
function confirmDelete(domain: Domain) {
  confirm.require({
    message: `¿Estas seguro de eliminar el dominio "${domain.display_name}"?`,
    header: 'Confirmar eliminacion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Si, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => deleteDomain(domain)
  })
}

async function deleteDomain(domain: Domain) {
  try {
    await domainApi.delete(domain.id)
    domains.value = domains.value.filter((d) => d.id !== domain.id)
    resetDomainsCache()
    toast.add({
      severity: 'success',
      summary: 'Dominio eliminado',
      detail: domain.display_name,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el dominio',
      life: 3000
    })
  }
}

// Initialize
onMounted(fetchDomains)
</script>

<template>
  <div class="domains-page p-6">
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dominios</h1>
        <p class="text-gray-500 mt-1">Administra los dominios de negocio del sistema</p>
      </div>
      <Button label="Nuevo Dominio" icon="pi pi-plus" severity="primary" @click="openCreateDialog" />
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-bold text-gray-800">{{ stats.total }}</div>
          <div class="text-sm text-gray-500">Total Dominios</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-bold text-green-600">{{ stats.enabled }}</div>
          <div class="text-sm text-gray-500">Habilitados</div>
        </template>
      </Card>
      <Card class="text-center">
        <template #content>
          <div class="text-3xl font-bold text-gray-400">{{ stats.disabled }}</div>
          <div class="text-sm text-gray-500">Deshabilitados</div>
        </template>
      </Card>
    </div>

    <!-- Table -->
    <Card>
      <template #content>
        <DataTable
          :value="domains"
          :loading="loading"
          stripedRows
          class="p-datatable-sm"
          sortField="sort_order"
          :sortOrder="1"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-500">
              <i class="pi pi-globe text-4xl mb-2" />
              <p>No hay dominios registrados</p>
            </div>
          </template>

          <!-- Sort Order -->
          <Column field="sort_order" header="Orden" style="width: 80px" sortable>
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.sort_order }}</span>
            </template>
          </Column>

          <!-- Icon & Name -->
          <Column header="Dominio" style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <i :class="`pi ${data.icon || 'pi-globe'} text-xl text-gray-600`" />
                <div>
                  <div class="font-medium">{{ data.display_name }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ data.domain_key }}</div>
                </div>
              </div>
            </template>
          </Column>

          <!-- Description -->
          <Column field="description" header="Descripcion" style="min-width: 200px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">{{ data.description || '-' }}</span>
            </template>
          </Column>

          <!-- Color -->
          <Column header="Color" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.color || 'info'" :severity="data.color || 'info'" />
            </template>
          </Column>

          <!-- Status -->
          <Column header="Estado" style="width: 100px">
            <template #body="{ data }">
              <ToggleSwitch :model-value="data.enabled" @update:model-value="toggleDomain(data)" />
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Acciones" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  v-tooltip.top="'Editar'"
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="openEditDialog(data)"
                />
                <Button
                  v-tooltip.top="'Eliminar'"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      header="Editar Dominio"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div v-if="editingDomain" class="flex flex-col gap-4">
        <Message severity="info" :closable="false">
          <p class="text-sm">
            <strong>Domain Key:</strong> {{ editingDomain.domain_key }}
            <br />
            <span class="text-xs text-gray-500">El key no se puede modificar</span>
          </p>
        </Message>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <InputText v-model="editingDomain.display_name" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea v-model="editingDomain.description" rows="2" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icono (PrimeIcons)</label>
            <InputText v-model="editingDomain.icon" class="w-full" placeholder="pi-globe" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select v-model="editingDomain.color" class="w-full p-2 border rounded">
              <option v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
          <InputNumber v-model="editingDomain.sort_order" class="w-full" :min="0" showButtons />
        </div>

        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="editingDomain.enabled" />
          <span class="text-sm">Habilitado</span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="editDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" severity="success" @click="saveDomain" />
      </template>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog
      v-model:visible="createDialogVisible"
      header="Nuevo Dominio"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Domain Key <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="newDomain.domain_key"
            class="w-full"
            placeholder="mi_dominio"
          />
          <small class="text-gray-400">Identificador unico, sin espacios (ej: pharmacy)</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="newDomain.display_name"
            class="w-full"
            placeholder="Mi Dominio"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea
            v-model="newDomain.description"
            rows="2"
            class="w-full"
            placeholder="Descripcion opcional..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icono (PrimeIcons)</label>
            <InputText v-model="newDomain.icon" class="w-full" placeholder="pi-globe" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select v-model="newDomain.color" class="w-full p-2 border rounded">
              <option v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
          <InputNumber v-model="newDomain.sort_order" class="w-full" :min="0" showButtons />
        </div>

        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="newDomain.enabled" />
          <span class="text-sm">Habilitado</span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="createDialogVisible = false" />
        <Button label="Crear" icon="pi pi-plus" severity="success" @click="createDomain" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.domains-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
