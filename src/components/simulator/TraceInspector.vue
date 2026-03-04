<template>
  <div class="trace-inspector">
    <!-- Trace summary -->
    <div v-if="trace" class="trace-section">
      <h4 class="trace-heading">
        <i class="pi pi-directions" />
        Trace
      </h4>
      <div class="trace-grid">
        <div class="trace-item">
          <span class="trace-label">Nodo actual</span>
          <span class="trace-value trace-value--node">{{ trace.current_node ?? '—' }}</span>
        </div>
        <div class="trace-item">
          <span class="trace-label">Siguiente</span>
          <span class="trace-value">{{ trace.next_node ?? 'END' }}</span>
        </div>
        <div class="trace-item">
          <span class="trace-label">Tipo respuesta</span>
          <span class="trace-value">{{ trace.response_type ?? 'text' }}</span>
        </div>
        <div class="trace-item">
          <span class="trace-label">Turno</span>
          <span class="trace-value">#{{ trace.turn }}</span>
        </div>
        <div v-if="trace.is_complete" class="trace-item trace-item--complete">
          <span class="trace-label">Estado</span>
          <span class="trace-value trace-value--complete">Conversacion finalizada</span>
        </div>
      </div>
    </div>

    <!-- State snapshot -->
    <div v-if="stateSnapshot && Object.keys(stateSnapshot).length > 0" class="trace-section">
      <button class="trace-toggle" @click="showState = !showState">
        <i :class="showState ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
        <h4 class="trace-heading">Estado del grafo</h4>
        <span class="trace-count">{{ Object.keys(stateSnapshot).length }} campos</span>
      </button>

      <div v-if="showState" class="state-grid">
        <div
          v-for="[key, value] in sortedState"
          :key="key"
          class="state-item"
        >
          <span class="state-key">{{ key }}</span>
          <span class="state-value" :title="String(value)">{{ formatValue(value) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!trace" class="trace-empty">
      <i class="pi pi-info-circle" />
      <span>Envia un mensaje para ver la traza de ejecucion</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SimulatorTrace } from '@/api/simulator.api'

const props = defineProps<{
  trace: SimulatorTrace | null
  stateSnapshot: Record<string, unknown>
}>()

const showState = ref(false)

const sortedState = computed(() => {
  return Object.entries(props.stateSnapshot).sort(([a], [b]) => a.localeCompare(b))
})

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>

<style scoped>
.trace-inspector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.8125rem;
}

.trace-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.625rem;
  background: #fafafa;
}

:root.dark-mode .trace-section {
  border-color: #374151;
  background: #111827;
}

.trace-heading {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.trace-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.trace-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.trace-label {
  font-size: 0.6875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.trace-value {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  color: #111;
}

:root.dark-mode .trace-value {
  color: #e9edef;
}

.trace-value--node {
  color: #3b82f6;
  font-weight: 600;
}

.trace-value--complete {
  color: #16a34a;
  font-weight: 500;
}

.trace-item--complete {
  grid-column: 1 / -1;
}

.trace-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 100%;
}

.trace-toggle:hover .trace-heading {
  color: #3b82f6;
}

.trace-count {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #9ca3af;
}

.state-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.state-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:root.dark-mode .state-item {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.state-key {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: #6b7280;
  flex-shrink: 0;
}

.state-value {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: #111;
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root.dark-mode .state-value {
  color: #e9edef;
}

.trace-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #9ca3af;
  font-size: 0.8125rem;
}
</style>
