<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { agentCatalogApi } from '@/api/agentCatalog.api'
import { useDomains } from '@/composables/useDomains'
import type {
  AgentCatalogItem,
  AgentCatalogFilters,
  AgentCatalogCreate,
  AgentCatalogUpdate
} from '@/types/agentCatalog.types'
import {
  AGENT_TYPE_OPTIONS,
  getGraphInfo,
  getAgentTypeSeverity
} from '@/types/agentCatalog.types'

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
import ConfirmDialog from 'primevue/confirmdialog'
import SubgraphFlowDialog from '@/components/agentCatalog/SubgraphFlowDialog.vue'

const toast = useToast()
const confirm = useConfirm()
const { fetchDomains, getDomainOptions, getDomainLabel, getDomainColor, getDomainIcon } = useDomains()

// Domain options from API
const domainOptions = computed(() => getDomainOptions(true))

// State
const agents = ref<AgentCatalogItem[]>([])
const loading = ref(false)
const seeding = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const editingAgent = ref<AgentCatalogItem | null>(null)
const newAgent = ref<AgentCatalogCreate>({
  agent_key: '',
  name: '',
  description: '',
  agent_type: 'custom',
  domain_key: undefined,
  enabled: true,
  priority: 50,
  keywords: []
})

// Subgraph dialog state
const subgraphDialogVisible = ref(false)
const selectedGraphName = ref<string | null>(null)

// Filters
const filters = ref<AgentCatalogFilters>({
  domain_key: undefined,
  agent_type: undefined,
  enabled_only: false
})

// Filter options
const domainFilterOptions = computed(() => [
  { value: undefined, label: 'Todos los dominios' },
  ...domainOptions.value.map((d) => ({ value: d.value ?? 'global', label: d.label }))
])

const typeFilterOptions = [
  { value: undefined, label: 'Todos los tipos' },
  ...AGENT_TYPE_OPTIONS
]

// Stats
const stats = computed(() => {
  const byDomain: Record<string, number> = {}
  agents.value.forEach((a) => {
    const key = a.domain_key || 'global'
    byDomain[key] = (byDomain[key] || 0) + 1
  })
  return {
    total: agents.value.length,
    enabled: agents.value.filter((a) => a.enabled).length,
    disabled: agents.value.filter((a) => !a.enabled).length,
    byDomain
  }
})

// Fetch agents
async function fetchAgents() {
  loading.value = true
  try {
    // Handle 'global' filter value
    const apiFilters = { ...filters.value }
    if (apiFilters.domain_key === 'global') {
      apiFilters.domain_key = ''
    }
    const response = await agentCatalogApi.list(apiFilters)
    agents.value = response.agents
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los agentes',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Seed builtin agents
async function seedBuiltin() {
  seeding.value = true
  try {
    const result = await agentCatalogApi.seedBuiltin()
    toast.add({
      severity: 'success',
      summary: 'Seed completado',
      detail: `${result.created} creados, ${result.updated} actualizados, ${result.skipped} omitidos`,
      life: 5000
    })
    await fetchAgents()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron crear los agentes builtin',
      life: 3000
    })
  } finally {
    seeding.value = false
  }
}

// Toggle agent enabled
async function toggleAgent(agent: AgentCatalogItem) {
  try {
    const updated = await agentCatalogApi.toggle(agent.id)
    const index = agents.value.findIndex((a) => a.id === agent.id)
    if (index !== -1) {
      agents.value[index] = updated
    }
    toast.add({
      severity: 'info',
      summary: updated.enabled ? 'Agente habilitado' : 'Agente deshabilitado',
      detail: agent.name,
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo actualizar el agente',
      life: 3000
    })
  }
}

// Open edit dialog
function openEditDialog(agent: AgentCatalogItem) {
  editingAgent.value = { ...agent }
  editDialogVisible.value = true
}

// Save edited agent
async function saveAgent() {
  if (!editingAgent.value) return

  try {
    const updateData: AgentCatalogUpdate = {
      name: editingAgent.value.name,
      description: editingAgent.value.description ?? undefined,
      domain_key: editingAgent.value.domain_key ?? undefined,
      priority: editingAgent.value.priority,
      enabled: editingAgent.value.enabled
    }

    const updated = await agentCatalogApi.update(editingAgent.value.id, updateData)

    const index = agents.value.findIndex((a) => a.id === editingAgent.value?.id)
    if (index !== -1) {
      agents.value[index] = updated
    }

    toast.add({
      severity: 'success',
      summary: 'Agente actualizado',
      detail: updated.name,
      life: 2000
    })

    editDialogVisible.value = false
    editingAgent.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar el agente',
      life: 3000
    })
  }
}

// Open create dialog
function openCreateDialog() {
  newAgent.value = {
    agent_key: '',
    name: '',
    description: '',
    agent_type: 'custom',
    domain_key: undefined,
    enabled: true,
    priority: 50,
    keywords: []
  }
  createDialogVisible.value = true
}

// Create new agent
async function createAgent() {
  if (!newAgent.value.agent_key || !newAgent.value.name) {
    toast.add({
      severity: 'warn',
      summary: 'Campos requeridos',
      detail: 'Agent Key y Nombre son obligatorios',
      life: 3000
    })
    return
  }

  try {
    const created = await agentCatalogApi.create(newAgent.value)
    agents.value.unshift(created)

    toast.add({
      severity: 'success',
      summary: 'Agente creado',
      detail: created.name,
      life: 2000
    })

    createDialogVisible.value = false
  } catch (error: unknown) {
    const errorDetail =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'No se pudo crear el agente'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorDetail || 'No se pudo crear el agente',
      life: 3000
    })
  }
}

// Delete agent
function confirmDelete(agent: AgentCatalogItem) {
  confirm.require({
    message: `Estas seguro de eliminar el agente "${agent.name}"?`,
    header: 'Confirmar eliminacion',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => deleteAgent(agent)
  })
}

async function deleteAgent(agent: AgentCatalogItem) {
  try {
    await agentCatalogApi.delete(agent.id)
    agents.value = agents.value.filter((a) => a.id !== agent.id)
    toast.add({
      severity: 'success',
      summary: 'Agente eliminado',
      detail: agent.name,
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el agente',
      life: 3000
    })
  }
}

// Get domain display info
function getDomainDisplay(domainKey: string | null) {
  return {
    label: getDomainLabel(domainKey),
    color: getDomainColor(domainKey),
    icon: getDomainIcon(domainKey)
  }
}

// Get graph display info
function getGraphDisplay(agentKey: string) {
  const info = getGraphInfo(agentKey)
  return info.hasSubgraph ? `Main + ${info.graph}` : 'Main'
}

// Open subgraph visualization dialog
function openSubgraphDialog(agentKey: string) {
  const info = getGraphInfo(agentKey)
  if (info.hasSubgraph) {
    selectedGraphName.value = info.graph
    subgraphDialogVisible.value = true
  }
}

// Initialize
onMounted(() => {
  fetchDomains()
  fetchAgents()
})
</script>

<template>
  <div class="agent-catalog-page p-6">
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Catalogo de Agentes</h1>
        <p class="text-gray-500 mt-1">Administra los agentes del grafo de LangGraph</p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Seed Builtin"
          icon="pi pi-database"
          severity="secondary"
          :loading="seeding"
          @click="seedBuiltin"
        />
        <Button label="Nuevo Agente" icon="pi pi-plus" severity="primary" @click="openCreateDialog" />
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-800">{{ stats.total }}</div>
            <div class="text-gray-500">Total agentes</div>
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
      <Card>
        <template #content>
          <div class="text-center">
            <div class="flex justify-center gap-1 flex-wrap">
              <Tag
                v-for="(count, domain) in stats.byDomain"
                :key="domain"
                :value="`${domain}: ${count}`"
                :severity="getDomainDisplay(domain === 'global' ? null : (domain as string)).color"
                class="text-xs"
              />
            </div>
            <div class="text-gray-500 mt-1 text-sm">Por dominio</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Dominio</label>
            <Select
              v-model="filters.domain_key"
              :options="domainFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
              @change="fetchAgents"
            />
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="filters.agent_type"
              :options="typeFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
              @change="fetchAgents"
            />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <ToggleSwitch v-model="filters.enabled_only" @change="fetchAgents" />
            <span class="text-sm text-gray-600">Solo habilitados</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Agents Table -->
    <Card>
      <template #content>
        <div v-if="loading" class="flex justify-center py-8">
          <ProgressSpinner />
        </div>

        <DataTable
          v-else
          :value="agents"
          :paginator="true"
          :rows="15"
          :rowsPerPageOptions="[10, 15, 25, 50]"
          sortField="priority"
          :sortOrder="-1"
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-500">
              <i class="pi pi-android text-4xl mb-4" />
              <p>No hay agentes registrados</p>
              <p class="text-sm mt-2">Usa "Seed Builtin" para importar agentes predefinidos</p>
            </div>
          </template>

          <Column field="agent_key" header="Agent Key" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i :class="getDomainDisplay(data.domain_key).icon" class="text-gray-400" />
                <div>
                  <div class="font-mono text-sm">{{ data.agent_key }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="name" header="Nombre" sortable>
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.name }}</div>
                <div class="text-xs text-gray-400 truncate max-w-xs" :title="data.description">
                  {{ data.description || '-' }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="domain_key" header="Dominio" sortable>
            <template #body="{ data }">
              <Tag
                :value="getDomainDisplay(data.domain_key).label"
                :severity="getDomainDisplay(data.domain_key).color"
              />
            </template>
          </Column>

          <Column header="Grafo">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Tag value="Main" severity="secondary" class="text-xs" />
                <Tag
                  v-if="getGraphInfo(data.agent_key).hasSubgraph"
                  :value="getGraphInfo(data.agent_key).graph"
                  severity="info"
                  class="text-xs"
                />
              </div>
            </template>
          </Column>

          <Column field="agent_type" header="Tipo" sortable>
            <template #body="{ data }">
              <Tag :value="data.agent_type" :severity="getAgentTypeSeverity(data.agent_type)" />
            </template>
          </Column>

          <Column field="priority" header="Prioridad" sortable style="width: 100px">
            <template #body="{ data }">
              <span class="font-mono">{{ data.priority }}</span>
            </template>
          </Column>

          <Column field="enabled" header="Habilitado" style="width: 100px">
            <template #body="{ data }">
              <ToggleSwitch :modelValue="data.enabled" @update:modelValue="toggleAgent(data)" />
            </template>
          </Column>

          <Column header="Acciones" style="width: 130px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  v-if="getGraphInfo(data.agent_key).hasSubgraph"
                  icon="pi pi-sitemap"
                  severity="info"
                  text
                  rounded
                  v-tooltip.top="'Ver Flow'"
                  @click="openSubgraphDialog(data.agent_key)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="openEditDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
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
      header="Editar Agente"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div v-if="editingAgent" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <InputText v-model="editingAgent.name" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea v-model="editingAgent.description" rows="3" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dominio</label>
            <Select
              v-model="editingAgent.domain_key"
              :options="domainOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <InputNumber
              v-model="editingAgent.priority"
              class="w-full"
              :min="0"
              :max="100"
              showButtons
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="editingAgent.enabled" />
          <span class="text-sm">Habilitado</span>
        </div>

        <Message severity="info" :closable="false">
          <p class="text-sm">
            <strong>Agent Key:</strong> {{ editingAgent.agent_key }}<br />
            <strong>Tipo:</strong> {{ editingAgent.agent_type }}<br />
            <strong>Grafo:</strong> {{ getGraphDisplay(editingAgent.agent_key) }}<br />
            <strong>Origen:</strong> {{ editingAgent.sync_source }}
          </p>
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="editDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" severity="success" @click="saveAgent" />
      </template>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog
      v-model:visible="createDialogVisible"
      header="Nuevo Agente"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Agent Key <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="newAgent.agent_key"
            class="w-full"
            placeholder="my_custom_agent"
          />
          <small class="text-gray-400">Identificador unico, sin espacios (ej: my_agent)</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText v-model="newAgent.name" class="w-full" placeholder="Mi Agente Custom" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <Textarea
            v-model="newAgent.description"
            rows="2"
            class="w-full"
            placeholder="Describe que hace este agente..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="newAgent.agent_type"
              :options="AGENT_TYPE_OPTIONS"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dominio</label>
            <Select
              v-model="newAgent.domain_key"
              :options="domainOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <InputNumber
              v-model="newAgent.priority"
              class="w-full"
              :min="0"
              :max="100"
              showButtons
            />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <ToggleSwitch v-model="newAgent.enabled" />
            <span class="text-sm">Habilitado</span>
          </div>
        </div>

        <Message severity="warn" :closable="false">
          <p class="text-sm">
            Los agentes custom requieren implementacion en el backend para funcionar. Este
            formulario solo crea el registro en la base de datos.
          </p>
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="createDialogVisible = false" />
        <Button label="Crear" icon="pi pi-plus" severity="success" @click="createAgent" />
      </template>
    </Dialog>

    <!-- Subgraph Flow Dialog -->
    <SubgraphFlowDialog
      v-model:visible="subgraphDialogVisible"
      :graphName="selectedGraphName"
    />
  </div>
</template>

<style scoped>
.agent-catalog-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
