<script setup lang="ts">
/**
 * DomainPanel - Detail panel for domain nodes
 *
 * Shows domain statistics and health information.
 */
import { computed } from 'vue'
import ProgressBar from 'primevue/progressbar'
import type { DomainNodeData } from '../types'

interface Props {
  data: DomainNodeData
}

const props = defineProps<Props>()

const healthColor = computed(() => {
  const score = props.data.healthScore
  if (score >= 80) return 'var(--green-500)'
  if (score >= 50) return 'var(--yellow-500)'
  return 'var(--red-500)'
})

const healthLabel = computed(() => {
  const score = props.data.healthScore
  if (score >= 80) return 'Excelente'
  if (score >= 50) return 'Regular'
  return 'Necesita atención'
})
</script>

<template>
  <div class="domain-panel">
    <!-- Header -->
    <div class="panel-header" :style="{ backgroundColor: data.bgColor }">
      <div class="header-icon" :style="{ backgroundColor: data.color }">
        <i :class="['pi', data.icon]" />
      </div>
      <div class="header-info">
        <h3>{{ data.displayName }}</h3>
        <p>{{ data.domainKey }}</p>
      </div>
    </div>

    <!-- Description -->
    <div v-if="data.description" class="section">
      <p class="description">{{ data.description }}</p>
    </div>

    <!-- Stats -->
    <div class="section">
      <h4>Estadísticas</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ data.intentCount }}</span>
          <span class="stat-label">Intents totales</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ data.enabledCount }}</span>
          <span class="stat-label">Intents activos</span>
        </div>
      </div>
    </div>

    <!-- Health -->
    <div class="section">
      <h4>Salud del dominio</h4>
      <div class="health-info">
        <ProgressBar
          :value="data.healthScore"
          :showValue="false"
          :style="{ height: '8px' }"
        />
        <div class="health-detail">
          <span class="health-score" :style="{ color: healthColor }">
            {{ data.healthScore }}%
          </span>
          <span class="health-label">{{ healthLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section">
      <h4>Acciones rápidas</h4>
      <p class="hint">
        Haz clic en un intent para ver sus detalles y configurar el mapeo a agentes.
      </p>
    </div>
  </div>
</template>

<style scoped>
.domain-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-icon i {
  font-size: 1.25rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.header-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.section {
  padding: 0 0.5rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  font-weight: 600;
}

.description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.health-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.health-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-score {
  font-size: 1.25rem;
  font-weight: 700;
}

.health-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
