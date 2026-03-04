<script setup lang="ts">
/**
 * RouterNode - Graph node for the Router Supervisor
 * Brain icon, prominent styling, shows matcher count
 */
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { TopologyNodeData } from '../types'

interface Props {
  data: TopologyNodeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'addConfig', nodeId: string): void
}>()

const uniqueIntentCount = computed(() => props.data.routingIntents?.length || 0)

function handleAddConfig(event: Event) {
  event.stopPropagation()
  emit('addConfig', props.data.nodeId)
}
</script>

<template>
  <div
    class="router-node glass-node"
    :class="{ 'node-selected': data.isSelected }"
  >
    <Handle type="target" :position="Position.Top" class="handle" />

    <div class="node-badge">DISTRIBUIDOR</div>

    <div class="node-header">
      <i :class="['pi', data.icon]" />
      <span class="node-label">{{ data.displayName }}</span>
    </div>

    <div class="node-stats">
      <div class="stat">
        <span class="stat-value">{{ data.routingConfigCount }}</span>
        <span class="stat-label">reglas</span>
      </div>
      <div class="stat" v-if="uniqueIntentCount > 0">
        <span class="stat-value">{{ uniqueIntentCount }}</span>
        <span class="stat-label">intenciones</span>
      </div>
      <div class="stat" v-if="data.awaitingTypeConfigCount > 0">
        <span class="stat-value">{{ data.awaitingTypeConfigCount }}</span>
        <span class="stat-label">esperando</span>
      </div>
    </div>

    <div class="node-description">{{ data.description }}</div>

    <button class="add-config-btn" @click="handleAddConfig" title="Agregar regla">
      <i class="pi pi-plus" />
    </button>

    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
.router-node {
  min-width: 200px;
  max-width: 240px;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 2px solid #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transition: all 0.2s;
}

.router-node:hover {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
}

.router-node.node-selected {
  outline: 3px solid #a78bfa;
  outline-offset: 2px;
}

.node-badge {
  display: inline-block;
  padding: 1px 8px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
  background: #8b5cf6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.node-header i {
  font-size: 1.1rem;
  color: #8b5cf6;
}

.node-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: hsl(var(--foreground));
}

.node-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.375rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.stat-label {
  font-size: 0.6rem;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
}

.node-description {
  font-size: 0.65rem;
  color: hsl(var(--muted-foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.add-config-btn {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #8b5cf6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 5;
}

.add-config-btn i {
  font-size: 0.6rem;
}

.router-node:hover .add-config-btn {
  opacity: 0.8;
}

.add-config-btn:hover {
  opacity: 1 !important;
  transform: scale(1.1);
}

.handle {
  width: 10px;
  height: 10px;
  background: #8b5cf6;
  border: 2px solid hsl(var(--card));
}
</style>
