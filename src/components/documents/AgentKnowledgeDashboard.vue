<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { agentKnowledgeApi, type AgentKnowledgeStats } from '@/api/agentKnowledge.api'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'

interface AgentWithStats {
  agentKey: string
  label: string
  stats: AgentKnowledgeStats | null
  loading: boolean
  error: string | null
}

const emit = defineEmits<{
  (e: 'select-agent', agentKey: string): void
}>()

const agents = ref<AgentWithStats[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

function formatAgentLabel(agentKey: string): string {
  return agentKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function loadAgentsWithStats() {
  isLoading.value = true
  error.value = null

  try {
    const response = await agentKnowledgeApi.getAvailableAgents()

    // Initialize agents without stats
    agents.value = response.agents.map((agentKey) => ({
      agentKey,
      label: formatAgentLabel(agentKey),
      stats: null,
      loading: true,
      error: null
    }))

    // Load stats for each agent in parallel
    await Promise.allSettled(
      agents.value.map(async (agent, index) => {
        try {
          const stats = await agentKnowledgeApi.getStats(agent.agentKey)
          agents.value[index].stats = stats
        } catch (err) {
          console.error(`Error loading stats for ${agent.agentKey}:`, err)
          agents.value[index].error = 'Error al cargar estadisticas'
        } finally {
          agents.value[index].loading = false
        }
      })
    )
  } catch (err) {
    console.error('Error loading agents:', err)
    error.value = 'Error al cargar la lista de agentes'
  } finally {
    isLoading.value = false
  }
}

function getCoveragePercentage(stats: AgentKnowledgeStats): number {
  if (stats.total_documents === 0) return 0
  return Math.round((stats.documents_with_embedding / stats.total_documents) * 100)
}

function getCoverageSeverity(percentage: number): 'success' | 'warn' | 'danger' {
  if (percentage >= 80) return 'success'
  if (percentage >= 50) return 'warn'
  return 'danger'
}

function handleSelectAgent(agentKey: string) {
  emit('select-agent', agentKey)
}

onMounted(() => {
  loadAgentsWithStats()
})
</script>

<template>
  <div class="agent-knowledge-dashboard">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="i in 6" :key="i">
        <template #content>
          <Skeleton height="120px" />
        </template>
      </Card>
    </div>

    <!-- Error message -->
    <Message v-else-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <!-- Empty state -->
    <Message v-else-if="agents.length === 0" severity="info" :closable="false">
      No hay agentes configurados
    </Message>

    <!-- Agent cards grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="agent in agents" :key="agent.agentKey" class="agent-card">
        <template #header>
          <div class="flex items-center justify-between p-4 pb-0">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-primary-500 text-xl" />
              <h3 class="text-lg font-semibold text-gray-800">{{ agent.label }}</h3>
            </div>
            <span class="text-xs text-gray-400 font-mono">{{ agent.agentKey }}</span>
          </div>
        </template>
        <template #content>
          <div v-if="agent.loading" class="space-y-2">
            <Skeleton height="20px" />
            <Skeleton height="20px" />
          </div>

          <Message v-else-if="agent.error" severity="warn" :closable="false" class="text-sm">
            {{ agent.error }}
          </Message>

          <div v-else-if="agent.stats" class="space-y-3">
            <!-- Stats grid -->
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 bg-gray-50 rounded">
                <div class="text-2xl font-bold text-gray-800">{{ agent.stats.total_documents }}</div>
                <div class="text-xs text-gray-500">Total</div>
              </div>
              <div class="p-2 bg-green-50 rounded">
                <div class="text-2xl font-bold text-green-600">{{ agent.stats.active_documents }}</div>
                <div class="text-xs text-gray-500">Activos</div>
              </div>
              <div class="p-2 bg-blue-50 rounded">
                <div class="text-2xl font-bold text-blue-600">{{ agent.stats.documents_with_embedding }}</div>
                <div class="text-xs text-gray-500">Con Embedding</div>
              </div>
            </div>

            <!-- Coverage bar -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-gray-500">
                <span>Cobertura de embeddings</span>
                <span>{{ getCoveragePercentage(agent.stats) }}%</span>
              </div>
              <ProgressBar
                :value="getCoveragePercentage(agent.stats)"
                :showValue="false"
                style="height: 6px"
                :pt="{
                  value: { class: getCoverageSeverity(getCoveragePercentage(agent.stats)) === 'success' ? 'bg-green-500' : getCoverageSeverity(getCoveragePercentage(agent.stats)) === 'warn' ? 'bg-amber-500' : 'bg-red-500' }
                }"
              />
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button
              label="Ver Documentos"
              icon="pi pi-folder-open"
              size="small"
              @click="handleSelectAgent(agent.agentKey)"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.agent-card :deep(.p-card-content) {
  padding-top: 0.5rem;
}

.agent-card :deep(.p-card-footer) {
  padding-top: 0;
}
</style>
