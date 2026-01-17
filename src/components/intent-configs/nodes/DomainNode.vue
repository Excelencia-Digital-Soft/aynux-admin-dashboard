<script setup lang="ts">
/**
 * DomainNode - Graph node representing a domain
 *
 * Displays domain information including intent count and health score.
 */
import { computed, onMounted, ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { DomainNodeData } from '../types'

interface Props {
  data: DomainNodeData
}

const props = defineProps<Props>()

const isDarkMode = ref(false)

onMounted(() => {
  // Check if dark mode is active
  isDarkMode.value = document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark-mode') ||
    document.documentElement.getAttribute('data-theme') === 'dark'

  // Watch for changes
  const observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark-mode') ||
      document.documentElement.getAttribute('data-theme') === 'dark'
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
})

const healthColor = computed(() => {
  const score = props.data.healthScore
  if (score >= 80) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
})

// In dark mode, use a darker version of the color
const nodeBackground = computed(() => {
  if (isDarkMode.value) {
    return undefined // Let CSS handle it
  }
  return props.data.bgColor
})
</script>

<template>
  <div
    class="domain-node"
    :style="{
      borderColor: data.color,
      backgroundColor: nodeBackground
    }"
  >
    <!-- Source Handle (right side - connects to intents) -->
    <Handle type="source" :position="Position.Right" class="handle-source" />

    <div class="node-header">
      <i :class="['pi', data.icon]" :style="{ color: data.color }" />
      <span class="node-label">{{ data.displayName }}</span>
    </div>

    <div class="node-stats">
      <div class="stat">
        <span class="stat-value">{{ data.intentCount }}</span>
        <span class="stat-label">intents</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ data.enabledCount }}</span>
        <span class="stat-label">activos</span>
      </div>
    </div>

    <div class="health-bar">
      <div
        class="health-fill"
        :style="{
          width: `${data.healthScore}%`,
          backgroundColor: healthColor
        }"
      />
    </div>

    <div class="node-description" v-if="data.description">
      {{ data.description }}
    </div>
  </div>
</template>

<style scoped>
.domain-node {
  min-width: 180px;
  max-width: 220px;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid;
  background: var(--surface-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.domain-node:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.node-header i {
  font-size: 1.1rem;
}

.node-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.node-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.health-bar {
  width: 100%;
  height: 4px;
  background: var(--surface-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.health-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.node-description {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Handle styles */
.handle-source {
  width: 10px;
  height: 10px;
  background: v-bind('data.color');
  border: 2px solid var(--surface-card);
}

/* Dark mode overrides */
:root.dark .domain-node,
.dark-mode .domain-node,
[data-theme="dark"] .domain-node {
  background: var(--surface-card) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root.dark .domain-node:hover,
.dark-mode .domain-node:hover,
[data-theme="dark"] .domain-node:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

:root.dark .health-bar,
.dark-mode .health-bar,
[data-theme="dark"] .health-bar {
  background: var(--surface-200);
}

:root.dark .node-label,
.dark-mode .node-label,
[data-theme="dark"] .node-label {
  color: var(--text-color);
}

:root.dark .stat-value,
.dark-mode .stat-value,
[data-theme="dark"] .stat-value {
  color: var(--text-color);
}

:root.dark .stat-label,
.dark-mode .stat-label,
[data-theme="dark"] .stat-label {
  color: var(--text-color-secondary);
}

:root.dark .node-description,
.dark-mode .node-description,
[data-theme="dark"] .node-description {
  color: var(--text-color-secondary);
}
</style>
