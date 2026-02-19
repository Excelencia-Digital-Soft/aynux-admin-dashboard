<script setup lang="ts">
/**
 * ActionNode - Graph node for action nodes
 * (auth_plex, debt_manager, payment_processor, account_switcher, info_node)
 */
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { TopologyNodeData } from '../types'

interface Props {
  data: TopologyNodeData
}

const props = defineProps<Props>()

const badgeLabel = computed(() => {
  const id = props.data.nodeId
  const map: Record<string, string> = {
    auth_plex: 'AUTH',
    debt_manager: 'DEBT',
    payment_processor: 'PAYMENT',
    account_switcher: 'SWITCH',
    info_node: 'INFO'
  }
  return map[id] || id.toUpperCase()
})

const totalConfigs = computed(() =>
  props.data.routingConfigCount + props.data.awaitingTypeConfigCount
)
</script>

<template>
  <div
    class="action-node"
    :class="{ 'node-selected': data.isSelected }"
    :style="{ borderColor: data.color }"
  >
    <Handle type="target" :position="Position.Top" class="handle" :style="{ background: data.color }" />

    <div class="node-badge" :style="{ background: data.color }">{{ badgeLabel }}</div>

    <div class="node-header">
      <i :class="['pi', data.icon]" :style="{ color: data.color }" />
      <span class="node-label">{{ data.displayName }}</span>
    </div>

    <div class="node-stats">
      <div class="stat" v-if="data.awaitingTypeConfigCount > 0">
        <span class="stat-value">{{ data.awaitingTypeConfigCount }}</span>
        <span class="stat-label">awaiting</span>
      </div>
      <div class="stat" v-if="data.routingConfigCount > 0">
        <span class="stat-value">{{ data.routingConfigCount }}</span>
        <span class="stat-label">routing</span>
      </div>
      <div class="stat" v-if="totalConfigs === 0">
        <span class="stat-value">0</span>
        <span class="stat-label">configs</span>
      </div>
    </div>

    <div class="node-awaiting" v-if="data.acceptsAwaitingTypes.length > 0">
      <span
        v-for="at in data.acceptsAwaitingTypes"
        :key="at"
        class="awaiting-tag"
      >
        {{ at }}
      </span>
    </div>

    <Handle type="source" :position="Position.Bottom" class="handle" :style="{ background: data.color }" />
  </div>
</template>

<style scoped>
.action-node {
  min-width: 190px;
  max-width: 230px;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid;
  background: var(--surface-card);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.action-node:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.action-node.node-selected {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

.node-badge {
  display: inline-block;
  padding: 1px 8px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
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
  font-size: 1rem;
}

.node-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-color);
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
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.6rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.node-awaiting {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.awaiting-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 0.6rem;
  color: var(--text-color-secondary);
  background: var(--surface-ground);
  border-radius: 3px;
  border: 1px solid var(--surface-border);
}

.handle {
  width: 10px;
  height: 10px;
  border: 2px solid var(--surface-card);
}

/* Dark mode */
:root.dark .action-node,
.dark-mode .action-node,
[data-theme="dark"] .action-node {
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root.dark .action-node:hover,
.dark-mode .action-node:hover,
[data-theme="dark"] .action-node:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}
</style>
