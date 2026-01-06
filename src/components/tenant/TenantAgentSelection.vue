<script setup lang="ts">
import { ref, watch } from 'vue'
import { tenantAgentsApi } from '@/api/tenantAgents.api'
import type { TenantAgentConfig } from '@/types/tenantAgents.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{ orgId: string }>()

const agents = ref<TenantAgentConfig[]>([])
const loading = ref(false)
const toggling = ref<string | null>(null)
const stats = ref({ total: 0, enabled_count: 0, disabled_count: 0 })

async function fetchAgents() {
  if (!props.orgId) return
  loading.value = true
  try {
    const response = await tenantAgentsApi.list(props.orgId)
    agents.value = response.agents
    stats.value = {
      total: response.total,
      enabled_count: response.enabled_count,
      disabled_count: response.disabled_count
    }
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  } finally {
    loading.value = false
  }
}

async function toggleAgent(agent: TenantAgentConfig) {
  toggling.value = agent.id
  try {
    await tenantAgentsApi.toggle(props.orgId, agent.id)
    await fetchAgents()
  } catch (error) {
    console.error('Failed to toggle agent:', error)
  } finally {
    toggling.value = null
  }
}

async function initBuiltinAgents() {
  loading.value = true
  try {
    await tenantAgentsApi.initBuiltin(props.orgId)
    await fetchAgents()
  } catch (error) {
    console.error('Failed to init builtin agents:', error)
  } finally {
    loading.value = false
  }
}

function getDomainSeverity(domain: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
  if (!domain) return 'secondary'
  const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    pharmacy: 'success',
    excelencia: 'info',
    ecommerce: 'warn',
    credit: 'danger'
  }
  return map[domain] || 'secondary'
}

function getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
  const map: Record<string, 'info' | 'warn' | 'secondary'> = {
    builtin: 'info',
    specialized: 'warn',
    custom: 'secondary'
  }
  return map[type] || 'secondary'
}

// Refetch when orgId changes
watch(() => props.orgId, fetchAgents, { immediate: true })
</script>

<template>
  <div class="tenant-agent-selection">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-gray-500">
        {{ stats.enabled_count }}/{{ stats.total }} agentes activos
      </span>
      <Button
        v-if="agents.length === 0 && !loading"
        label="Inicializar Agentes"
        icon="pi pi-plus"
        size="small"
        @click="initBuiltinAgents"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading && agents.length === 0" class="flex justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else-if="agents.length > 0"
      :value="agents"
      :loading="loading"
      sortField="priority"
      :sortOrder="-1"
      size="small"
      stripedRows
    >
      <Column field="display_name" header="Nombre" sortable style="min-width: 200px">
        <template #body="{ data }">
          <div>
            <span class="font-medium">{{ data.display_name }}</span>
            <p v-if="data.description" class="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {{ data.description }}
            </p>
          </div>
        </template>
      </Column>
      <Column field="domain_key" header="Dominio" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag
            :value="data.domain_key || 'Global'"
            :severity="getDomainSeverity(data.domain_key)"
          />
        </template>
      </Column>
      <Column field="agent_type" header="Tipo" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.agent_type" :severity="getTypeSeverity(data.agent_type)" />
        </template>
      </Column>
      <Column field="priority" header="Prioridad" sortable style="width: 100px">
        <template #body="{ data }">
          <span class="text-gray-600">{{ data.priority }}</span>
        </template>
      </Column>
      <Column header="Habilitado" style="width: 100px">
        <template #body="{ data }">
          <ToggleSwitch
            :modelValue="data.enabled"
            @update:modelValue="toggleAgent(data)"
            :disabled="toggling === data.id"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Empty state -->
    <div v-else-if="!loading" class="text-center py-8 text-gray-500">
      <i class="pi pi-inbox text-3xl mb-2 block" />
      <p>No hay agentes configurados para esta organizacion</p>
      <p class="text-sm mt-1">Haz clic en "Inicializar Agentes" para comenzar</p>
    </div>
  </div>
</template>

<style scoped>
.tenant-agent-selection :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
