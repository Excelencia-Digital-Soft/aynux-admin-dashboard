<script setup lang="ts">
/**
 * StartEndNode - Minimal pill-shaped START/END pseudo-nodes
 */
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { TopologyNodeData } from '../types'

interface Props {
  data: TopologyNodeData
}

const props = defineProps<Props>()

const isStart = computed(() => props.data.nodeId === '__start__')
</script>

<template>
  <div
    class="terminal-node"
    :style="{ borderColor: data.color, color: data.color }"
  >
    <Handle
      v-if="!isStart"
      type="target"
      :position="Position.Top"
      class="handle"
      :style="{ background: data.color }"
    />

    <i :class="['pi', data.icon]" />
    <span class="node-label">{{ data.displayName }}</span>

    <Handle
      v-if="isStart"
      type="source"
      :position="Position.Bottom"
      class="handle"
      :style="{ background: data.color }"
    />
  </div>
</template>

<style scoped>
.terminal-node {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  border-radius: 999px;
  border: 2px solid;
  background: var(--surface-card);
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}

.terminal-node i {
  font-size: 0.75rem;
}

.node-label {
  color: inherit;
}

.handle {
  width: 8px;
  height: 8px;
  border: 2px solid var(--surface-card);
}

/* Dark mode */
:root.dark .terminal-node,
.dark-mode .terminal-node,
[data-theme="dark"] .terminal-node {
  background: var(--surface-card);
}
</style>
