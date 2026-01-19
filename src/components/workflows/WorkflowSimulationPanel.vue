<script setup lang="ts">
/**
 * WorkflowSimulationPanel - Controls for workflow simulation
 *
 * Provides play/pause/step controls and displays simulation progress.
 */
import { computed } from 'vue'
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import Badge from 'primevue/badge'
import type { SimulationState, SimulationStep } from '@/composables/useWorkflowSimulation'

interface Props {
  state: SimulationState
  stepDelay: number
  canStepForward: boolean
  canStepBackward: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  stop: []
  stepForward: []
  stepBackward: []
  'update:stepDelay': [value: number]
  openContext: []
}>()

// Computed
const isIdle = computed(() => props.state.status === 'idle')
const isRunning = computed(() => props.state.status === 'running')
const isPaused = computed(() => props.state.status === 'paused')
const isCompleted = computed(() => props.state.status === 'completed')
const isError = computed(() => props.state.status === 'error')

const statusLabel = computed(() => {
  switch (props.state.status) {
    case 'idle': return 'Inactivo'
    case 'running': return 'Ejecutando'
    case 'paused': return 'Pausado'
    case 'completed': return 'Completado'
    case 'error': return 'Error'
    default: return ''
  }
})

const statusSeverity = computed(() => {
  switch (props.state.status) {
    case 'idle': return 'secondary'
    case 'running': return 'info'
    case 'paused': return 'warn'
    case 'completed': return 'success'
    case 'error': return 'danger'
    default: return 'secondary'
  }
})

const currentStep = computed((): SimulationStep | null => {
  if (props.state.executionPath.length === 0) return null
  return props.state.executionPath[props.state.executionPath.length - 1]
})

const stepCount = computed(() => props.state.executionPath.length)

// Format speed label
const speedLabel = computed(() => {
  const delay = props.stepDelay
  if (delay <= 500) return 'Rapido'
  if (delay <= 1000) return 'Normal'
  if (delay <= 2000) return 'Lento'
  return 'Muy lento'
})

// Handle speed change
function handleSpeedChange(value: number | number[]) {
  const numValue = Array.isArray(value) ? value[0] : value
  emit('update:stepDelay', numValue)
}

// Play/Pause toggle
function togglePlayPause() {
  if (isIdle.value) {
    emit('start')
  } else if (isRunning.value) {
    emit('pause')
  } else if (isPaused.value) {
    emit('resume')
  }
}
</script>

<template>
  <div class="simulation-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title">
        <i class="pi pi-play-circle" />
        <span>Simulacion</span>
      </div>
      <Badge :value="statusLabel" :severity="statusSeverity" />
    </div>

    <!-- Current Node Info -->
    <div v-if="currentStep" class="current-node">
      <div class="node-label">
        <i class="pi pi-circle-fill" style="color: #10b981" />
        <span>{{ currentStep.nodeLabel }}</span>
      </div>
      <div v-if="currentStep.transitionLabel" class="transition-label">
        <i class="pi pi-arrow-right" />
        <span>{{ currentStep.transitionLabel }}</span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="isError && state.error" class="error-display">
      <i class="pi pi-exclamation-triangle" />
      <span>{{ state.error }}</span>
    </div>

    <!-- Progress -->
    <div class="progress-info">
      <span class="step-count">Paso {{ stepCount }}</span>
      <span class="visited-count">{{ state.visitedNodes.length }} nodos visitados</span>
    </div>

    <!-- Controls -->
    <div class="controls">
      <!-- Step backward -->
      <Button
        icon="pi pi-step-backward"
        text
        rounded
        :disabled="!canStepBackward"
        @click="$emit('stepBackward')"
        v-tooltip.top="'Paso atras'"
      />

      <!-- Play/Pause -->
      <Button
        :icon="isRunning ? 'pi pi-pause' : 'pi pi-play'"
        rounded
        :severity="isRunning ? 'warn' : 'success'"
        :disabled="isCompleted || isError"
        @click="togglePlayPause"
        v-tooltip.top="isRunning ? 'Pausar' : 'Iniciar'"
      />

      <!-- Step forward -->
      <Button
        icon="pi pi-step-forward"
        text
        rounded
        :disabled="!canStepForward"
        @click="$emit('stepForward')"
        v-tooltip.top="'Paso adelante'"
      />

      <!-- Stop -->
      <Button
        icon="pi pi-stop"
        text
        rounded
        severity="danger"
        :disabled="isIdle"
        @click="$emit('stop')"
        v-tooltip.top="'Detener'"
      />
    </div>

    <!-- Speed Control -->
    <div class="speed-control">
      <label>Velocidad: {{ speedLabel }}</label>
      <Slider
        :modelValue="stepDelay"
        @update:modelValue="handleSpeedChange"
        :min="200"
        :max="3000"
        :step="100"
      />
    </div>

    <!-- Context Button -->
    <Button
      label="Editar contexto"
      icon="pi pi-cog"
      text
      size="small"
      class="context-btn"
      @click="$emit('openContext')"
    />

    <!-- Execution Path (collapsed by default) -->
    <details v-if="state.executionPath.length > 0" class="execution-path">
      <summary>Ver recorrido ({{ state.executionPath.length }} pasos)</summary>
      <div class="path-list">
        <div
          v-for="(step, index) in state.executionPath"
          :key="step.timestamp"
          class="path-step"
          :class="{ 'is-current': index === state.executionPath.length - 1 }"
        >
          <span class="step-index">{{ index + 1 }}</span>
          <span class="step-label">{{ step.nodeLabel }}</span>
          <span v-if="step.transitionLabel" class="step-transition">
            via {{ step.transitionLabel }}
          </span>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.simulation-panel {
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.header-title i {
  color: #8b5cf6;
  font-size: 18px;
}

.current-node {
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 13px;
}

.node-label i {
  font-size: 8px;
}

.transition-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.transition-label i {
  font-size: 10px;
}

.error-display {
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.speed-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.speed-control label {
  font-size: 12px;
  color: #6b7280;
}

.context-btn {
  width: 100%;
  justify-content: center;
}

.execution-path {
  font-size: 12px;
}

.execution-path summary {
  cursor: pointer;
  color: #6b7280;
  padding: 4px 0;
}

.execution-path summary:hover {
  color: #374151;
}

.path-list {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.path-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f9fafb;
  border-radius: 4px;
}

.path-step.is-current {
  background: #ecfdf5;
  border: 1px solid #10b981;
}

.step-index {
  width: 20px;
  height: 20px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.path-step.is-current .step-index {
  background: #10b981;
  color: white;
}

.step-label {
  flex: 1;
  font-weight: 500;
}

.step-transition {
  color: #9ca3af;
  font-style: italic;
}
</style>
