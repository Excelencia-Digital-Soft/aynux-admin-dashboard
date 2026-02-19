<script setup lang="ts">
/**
 * FormatterNode - Graph node for the Response Formatter
 */
import { Handle, Position } from '@vue-flow/core'
import type { TopologyNodeData } from '../types'

interface Props {
  data: TopologyNodeData
}

const props = defineProps<Props>()
</script>

<template>
  <div
    class="formatter-node"
    :class="{ 'node-selected': data.isSelected }"
  >
    <Handle type="target" :position="Position.Top" class="handle" />

    <div class="node-badge">RESPONSE</div>

    <div class="node-header">
      <i :class="['pi', data.icon]" />
      <span class="node-label">{{ data.displayName }}</span>
    </div>

    <div class="node-description">{{ data.description }}</div>

    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
.formatter-node {
  min-width: 190px;
  max-width: 230px;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid #a855f7;
  background: var(--surface-card);
  box-shadow: 0 2px 6px rgba(168, 85, 247, 0.1);
  transition: all 0.2s;
}

.formatter-node:hover {
  box-shadow: 0 6px 16px rgba(168, 85, 247, 0.2);
  transform: translateY(-2px);
}

.formatter-node.node-selected {
  outline: 3px solid #c084fc;
  outline-offset: 2px;
}

.node-badge {
  display: inline-block;
  padding: 1px 8px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
  background: #a855f7;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.node-header i {
  font-size: 1rem;
  color: #a855f7;
}

.node-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-color);
}

.node-description {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.handle {
  width: 10px;
  height: 10px;
  background: #a855f7;
  border: 2px solid var(--surface-card);
}

/* Dark mode */
:root.dark .formatter-node,
.dark-mode .formatter-node,
[data-theme="dark"] .formatter-node {
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
