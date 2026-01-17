<script setup lang="ts">
/**
 * AgentNode - Graph node representing an agent
 *
 * Displays agent information including flow status, mapping count, and keywords.
 */
import { Handle, Position } from '@vue-flow/core'
import type { AgentNodeData } from '../types'

interface Props {
  data: AgentNodeData
}

defineProps<Props>()
</script>

<template>
  <div
    class="agent-node"
    :class="{ disabled: !data.isEnabled }"
    :style="{ borderLeftColor: data.color }"
  >
    <!-- Target Handle (left side - receives from intents) -->
    <Handle type="target" :position="Position.Left" class="handle-target" />

    <!-- Source Handle (right side - connects to keywords) -->
    <Handle type="source" :position="Position.Right" class="handle-source" />

    <div class="node-header">
      <i class="pi pi-android" :style="{ color: data.color }" />
      <span class="node-label">{{ data.displayName }}</span>
    </div>

    <div class="node-badges">
      <span v-if="data.isFlowAgent" class="badge flow-badge" title="Flow Agent">
        <i class="pi pi-sync" /> FLOW
      </span>
      <span v-if="!data.isEnabled" class="badge disabled-badge">
        OFF
      </span>
    </div>

    <div class="node-stats">
      <div class="stat" title="Intents mapeados">
        <i class="pi pi-link" />
        <span>{{ data.mappingCount }}</span>
      </div>
      <div v-if="data.keywordCount > 0" class="stat" title="Keywords">
        <i class="pi pi-key" />
        <span>{{ data.keywordCount }}</span>
      </div>
    </div>

    <div v-if="data.flowConfig" class="flow-info">
      <span v-if="data.flowConfig.max_turns">Max: {{ data.flowConfig.max_turns }} turnos</span>
    </div>
  </div>
</template>

<style scoped>
.agent-node {
  min-width: 150px;
  max-width: 180px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);
  border-left: 4px solid;
  background: var(--surface-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.agent-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.agent-node.disabled {
  opacity: 0.5;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.node-header i {
  font-size: 0.9rem;
}

.node-label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.node-badges {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 0.375rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
}

.flow-badge {
  background: var(--yellow-100);
  color: var(--yellow-700);
}

.flow-badge i {
  font-size: 0.5rem;
}

.disabled-badge {
  background: var(--red-100);
  color: var(--red-700);
}

.node-stats {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.stat i {
  font-size: 0.6rem;
}

.flow-info {
  font-size: 0.6rem;
  color: var(--text-color-secondary);
  border-top: 1px solid var(--surface-border);
  padding-top: 0.25rem;
  margin-top: 0.25rem;
}

/* Handle styles */
.handle-target,
.handle-source {
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border: 2px solid var(--surface-card);
}

.handle-source {
  background: var(--surface-400);
}

/* Dark mode overrides */
:root.dark .agent-node,
.dark-mode .agent-node,
[data-theme="dark"] .agent-node {
  background: var(--surface-card);
  border-color: var(--surface-400);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

:root.dark .agent-node:hover,
.dark-mode .agent-node:hover,
[data-theme="dark"] .agent-node:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

:root.dark .flow-badge,
.dark-mode .flow-badge,
[data-theme="dark"] .flow-badge {
  background: rgba(234, 179, 8, 0.25);
  color: var(--yellow-400);
}

:root.dark .disabled-badge,
.dark-mode .disabled-badge,
[data-theme="dark"] .disabled-badge {
  background: rgba(239, 68, 68, 0.25);
  color: var(--red-400);
}

:root.dark .stat,
.dark-mode .stat,
[data-theme="dark"] .stat {
  color: var(--text-color-secondary);
}
</style>
