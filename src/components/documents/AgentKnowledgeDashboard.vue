<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { agentKnowledgeApi, type AgentKnowledgeStats } from '@/api/agentKnowledge.api'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

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

    agents.value = response.agents.map((agentKey) => ({
      agentKey,
      label: formatAgentLabel(agentKey),
      stats: null,
      loading: true,
      error: null
    }))

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

function getCoverageColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-amber-500'
  return 'bg-red-500'
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
        <CardContent class="pt-6">
          <div class="space-y-3 animate-pulse">
            <div class="h-5 bg-muted rounded w-3/4" />
            <div class="h-20 bg-muted rounded" />
            <div class="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error message -->
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Empty state -->
    <Alert v-else-if="agents.length === 0" variant="info">
      <AlertDescription>No hay agentes configurados</AlertDescription>
    </Alert>

    <!-- Agent cards grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="agent in agents" :key="agent.agentKey">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-primary text-xl" />
              <h3 class="text-lg font-semibold">{{ agent.label }}</h3>
            </div>
            <span class="text-xs text-muted-foreground font-mono">{{ agent.agentKey }}</span>
          </div>
        </CardHeader>
        <CardContent class="pb-2">
          <div v-if="agent.loading" class="space-y-2 animate-pulse">
            <div class="h-5 bg-muted rounded" />
            <div class="h-5 bg-muted rounded" />
          </div>

          <Alert v-else-if="agent.error" variant="warning" class="text-sm">
            <AlertDescription>{{ agent.error }}</AlertDescription>
          </Alert>

          <div v-else-if="agent.stats" class="space-y-3">
            <!-- Stats grid -->
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 bg-muted/50 rounded">
                <div class="text-2xl font-bold">{{ agent.stats.total_documents }}</div>
                <div class="text-xs text-muted-foreground">Total</div>
              </div>
              <div class="p-2 bg-green-500/10 rounded">
                <div class="text-2xl font-bold text-green-600">{{ agent.stats.active_documents }}</div>
                <div class="text-xs text-muted-foreground">Activos</div>
              </div>
              <div class="p-2 bg-blue-500/10 rounded">
                <div class="text-2xl font-bold text-blue-600">{{ agent.stats.documents_with_embedding }}</div>
                <div class="text-xs text-muted-foreground">Con Embedding</div>
              </div>
            </div>

            <!-- Coverage bar -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>Cobertura de embeddings</span>
                <span>{{ getCoveragePercentage(agent.stats) }}%</span>
              </div>
              <Progress
                :model-value="getCoveragePercentage(agent.stats)"
                class="h-1.5"
                :indicator-class="getCoverageColor(getCoveragePercentage(agent.stats))"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter class="justify-end pt-2">
          <Button size="sm" @click="handleSelectAgent(agent.agentKey)">
            <i class="pi pi-folder-open mr-2 text-xs" />
            Ver Documentos
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
