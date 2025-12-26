<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import type { ExecutionStep, ToolCall } from '@/types/chat.types'

import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Timeline from 'primevue/timeline'

interface Props {
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: '400px'
})

const store = useChatStore()

const steps = computed(() => store.executionSteps)
const selectedNode = computed(() => store.selectedNode)
const agentState = computed(() => store.currentAgentState)

function getStepIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    start: 'pi pi-play',
    tool_call: 'pi pi-wrench',
    llm_call: 'pi pi-comments',
    decision: 'pi pi-question',
    end: 'pi pi-check',
    error: 'pi pi-times'
  }
  return icons[nodeType] || 'pi pi-circle'
}

function getStepColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#94a3b8',
    running: '#3b82f6',
    completed: '#10b981',
    error: '#ef4444'
  }
  return colors[status] || '#94a3b8'
}

function getStatusSeverity(status: string): 'secondary' | 'info' | 'success' | 'danger' {
  const severities: Record<string, 'secondary' | 'info' | 'success' | 'danger'> = {
    pending: 'secondary',
    running: 'info',
    completed: 'success',
    error: 'danger'
  }
  return severities[status] || 'secondary'
}

function formatDuration(ms?: number): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
</script>

<template>
  <div class="reasoning-display" :style="{ maxHeight }">
    <!-- Empty state -->
    <div v-if="steps.length === 0" class="empty-state">
      <i class="pi pi-list text-3xl text-gray-300" />
      <p class="text-gray-400 mt-2 text-sm">No hay pasos de ejecucion</p>
    </div>

    <!-- Steps timeline -->
    <div v-else class="steps-container">
      <Timeline :value="steps" align="left" class="custom-timeline">
        <template #marker="{ item }">
          <span
            class="step-marker"
            :style="{ backgroundColor: getStepColor(item.status) }"
          >
            <i :class="getStepIcon(item.node_type)" />
          </span>
        </template>

        <template #content="{ item }">
          <Panel
            :toggleable="true"
            :collapsed="store.selectedNodeId !== item.id"
            class="step-panel"
            :class="{ 'step-selected': store.selectedNodeId === item.id }"
            @click="store.selectNode(item.id)"
          >
            <template #header>
              <div class="step-header">
                <span class="step-name">{{ item.name }}</span>
                <div class="step-badges">
                  <Tag
                    :severity="getStatusSeverity(item.status)"
                    :value="item.status"
                    class="text-xs"
                  />
                  <span v-if="item.duration_ms" class="step-duration">
                    {{ formatDuration(item.duration_ms) }}
                  </span>
                </div>
              </div>
            </template>

            <div class="step-content">
              <!-- Description -->
              <p v-if="item.description" class="step-description">
                {{ item.description }}
              </p>

              <!-- Input -->
              <div v-if="item.input && Object.keys(item.input).length > 0" class="step-section">
                <h4 class="section-title">
                  <i class="pi pi-arrow-right" /> Input
                </h4>
                <pre class="code-block">{{ formatJson(item.input) }}</pre>
              </div>

              <!-- Output -->
              <div v-if="item.output && Object.keys(item.output).length > 0" class="step-section">
                <h4 class="section-title">
                  <i class="pi pi-arrow-left" /> Output
                </h4>
                <pre class="code-block">{{ formatJson(item.output) }}</pre>
              </div>

              <!-- Error -->
              <div v-if="item.error_message" class="step-section error-section">
                <h4 class="section-title text-red-600">
                  <i class="pi pi-exclamation-triangle" /> Error
                </h4>
                <pre class="code-block error-block">{{ item.error_message }}</pre>
              </div>

              <!-- Timestamp -->
              <div class="step-timestamp">
                {{ new Date(item.timestamp).toLocaleString('es-ES') }}
              </div>
            </div>
          </Panel>
        </template>
      </Timeline>
    </div>

    <!-- Agent state (if available) -->
    <Panel
      v-if="agentState"
      header="Estado del Agente"
      :toggleable="true"
      :collapsed="true"
      class="mt-4"
    >
      <!-- Tool calls -->
      <div v-if="agentState.tool_calls?.length > 0" class="mb-4">
        <h4 class="font-medium text-sm mb-2">Tool Calls</h4>
        <div class="space-y-2">
          <div
            v-for="tool in agentState.tool_calls"
            :key="tool.id"
            class="tool-call-item"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ tool.name }}</span>
              <Tag
                :severity="getStatusSeverity(tool.status)"
                :value="tool.status"
                class="text-xs"
              />
            </div>
            <pre v-if="tool.arguments" class="code-block text-xs mt-1">{{ formatJson(tool.arguments) }}</pre>
          </div>
        </div>
      </div>

      <!-- Context variables -->
      <div v-if="agentState.variables && Object.keys(agentState.variables).length > 0">
        <h4 class="font-medium text-sm mb-2">Variables</h4>
        <pre class="code-block">{{ formatJson(agentState.variables) }}</pre>
      </div>
    </Panel>
  </div>
</template>

<style scoped>
.reasoning-display {
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.steps-container {
  padding-bottom: 1rem;
}

.custom-timeline :deep(.p-timeline-event-opposite) {
  display: none;
}

.custom-timeline :deep(.p-timeline-event-content) {
  padding-left: 1rem;
}

.step-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
}

.step-panel {
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.step-panel:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-selected {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.step-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.step-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-duration {
  font-size: 0.75rem;
  color: #6b7280;
}

.step-content {
  padding-top: 0.5rem;
}

.step-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.step-section {
  margin-bottom: 0.75rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.code-block {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
}

.error-block {
  background: #fef2f2;
  color: #dc2626;
}

.step-timestamp {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.tool-call-item {
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
}

:deep(.p-panel-header) {
  padding: 0.75rem 1rem;
}

:deep(.p-panel-content) {
  padding: 0.75rem 1rem;
}
</style>
