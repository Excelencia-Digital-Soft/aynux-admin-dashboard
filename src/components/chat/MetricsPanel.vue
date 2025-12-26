<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chat.store'

import Card from 'primevue/card'
import Tag from 'primevue/tag'

const store = useChatStore()

const metrics = computed(() => store.sessionMetrics)
const steps = computed(() => store.executionSteps)
const messages = computed(() => store.currentMessages)

const totalDuration = computed(() => store.totalDuration)
const completedSteps = computed(() => store.completedSteps.length)
const hasErrors = computed(() => store.hasErrors)

const sessionStats = computed(() => {
  return {
    messages: messages.value.length,
    steps: steps.value.length,
    completed: completedSteps.value,
    errors: steps.value.filter(s => s.status === 'error').length,
    toolCalls: steps.value.filter(s => s.node_type === 'tool_call').length,
    llmCalls: steps.value.filter(s => s.node_type === 'llm_call').length,
    duration: totalDuration.value
  }
})

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(Math.round(value))
}
</script>

<template>
  <div class="metrics-panel">
    <!-- Session stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon text-blue-500">
          <i class="pi pi-comments" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ sessionStats.messages }}</div>
          <div class="stat-label">Mensajes</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon text-purple-500">
          <i class="pi pi-sitemap" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ sessionStats.steps }}</div>
          <div class="stat-label">Pasos</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon text-amber-500">
          <i class="pi pi-wrench" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ sessionStats.toolCalls }}</div>
          <div class="stat-label">Tool Calls</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon text-green-500">
          <i class="pi pi-clock" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatDuration(sessionStats.duration) }}</div>
          <div class="stat-label">Duracion</div>
        </div>
      </div>
    </div>

    <!-- Execution summary -->
    <Card v-if="steps.length > 0" class="mt-4">
      <template #title>
        <div class="flex items-center gap-2 text-sm">
          <i class="pi pi-chart-bar text-blue-500" />
          <span>Resumen de Ejecucion</span>
        </div>
      </template>
      <template #content>
        <div class="execution-summary">
          <div class="summary-row">
            <span class="summary-label">Pasos completados:</span>
            <span class="summary-value">
              {{ sessionStats.completed }} / {{ sessionStats.steps }}
              <span class="text-gray-400">
                ({{ Math.round((sessionStats.completed / sessionStats.steps) * 100) }}%)
              </span>
            </span>
          </div>

          <div class="summary-row">
            <span class="summary-label">Errores:</span>
            <Tag
              :severity="sessionStats.errors > 0 ? 'danger' : 'success'"
              :value="sessionStats.errors > 0 ? `${sessionStats.errors} errores` : 'Sin errores'"
            />
          </div>

          <div class="summary-row">
            <span class="summary-label">LLM Calls:</span>
            <span class="summary-value">{{ sessionStats.llmCalls }}</span>
          </div>

          <div class="summary-row">
            <span class="summary-label">Tool Calls:</span>
            <span class="summary-value">{{ sessionStats.toolCalls }}</span>
          </div>
        </div>

        <!-- Step type breakdown -->
        <div class="step-breakdown mt-4">
          <h4 class="text-xs font-medium text-gray-500 mb-2">Desglose por tipo</h4>
          <div class="breakdown-bars">
            <div
              v-if="sessionStats.llmCalls > 0"
              class="breakdown-bar bg-blue-500"
              :style="{ width: `${(sessionStats.llmCalls / sessionStats.steps) * 100}%` }"
              :title="`LLM: ${sessionStats.llmCalls}`"
            />
            <div
              v-if="sessionStats.toolCalls > 0"
              class="breakdown-bar bg-amber-500"
              :style="{ width: `${(sessionStats.toolCalls / sessionStats.steps) * 100}%` }"
              :title="`Tools: ${sessionStats.toolCalls}`"
            />
            <div
              v-if="sessionStats.steps - sessionStats.llmCalls - sessionStats.toolCalls > 0"
              class="breakdown-bar bg-gray-400"
              :style="{ width: `${((sessionStats.steps - sessionStats.llmCalls - sessionStats.toolCalls) / sessionStats.steps) * 100}%` }"
              :title="`Otros: ${sessionStats.steps - sessionStats.llmCalls - sessionStats.toolCalls}`"
            />
          </div>
          <div class="breakdown-legend">
            <span class="legend-item">
              <span class="legend-dot bg-blue-500" /> LLM
            </span>
            <span class="legend-item">
              <span class="legend-dot bg-amber-500" /> Tools
            </span>
            <span class="legend-item">
              <span class="legend-dot bg-gray-400" /> Otros
            </span>
          </div>
        </div>
      </template>
    </Card>

    <!-- API metrics (if available) -->
    <Card v-if="metrics" class="mt-4">
      <template #title>
        <div class="flex items-center gap-2 text-sm">
          <i class="pi pi-server text-purple-500" />
          <span>Metricas API</span>
        </div>
      </template>
      <template #content>
        <div class="api-metrics">
          <div class="metric-item">
            <span class="metric-label">Total consultas:</span>
            <span class="metric-value">{{ formatNumber(metrics.total_messages) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Total tokens:</span>
            <span class="metric-value">{{ formatNumber(metrics.total_tokens) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Tiempo respuesta promedio:</span>
            <span class="metric-value">{{ formatDuration(metrics.avg_response_time_ms) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Tasa de errores:</span>
            <Tag
              :severity="metrics.error_rate > 0.05 ? 'danger' : 'success'"
              :value="`${(metrics.error_rate * 100).toFixed(1)}%`"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.metrics-panel {
  padding: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.stat-icon {
  font-size: 1.25rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.execution-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.summary-label {
  color: #6b7280;
}

.summary-value {
  font-weight: 500;
}

.step-breakdown {
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.breakdown-bars {
  display: flex;
  height: 0.5rem;
  border-radius: 0.25rem;
  overflow: hidden;
  background: #f1f5f9;
}

.breakdown-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.breakdown-legend {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.legend-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.api-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.metric-label {
  color: #6b7280;
}

.metric-value {
  font-weight: 500;
}

:deep(.p-card-content) {
  padding: 0.75rem;
}

:deep(.p-card-title) {
  padding: 0.75rem;
  margin: 0;
  font-size: 0.875rem;
}
</style>
