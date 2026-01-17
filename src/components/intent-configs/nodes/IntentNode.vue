<script setup lang="ts">
/**
 * IntentNode - Graph node representing an intent
 *
 * Displays intent information including status, pattern count, and mapping.
 */
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { IntentNodeData } from '../types'
import { getStatusConfig } from '../types'

interface Props {
  data: IntentNodeData
}

const props = defineProps<Props>()

const statusConfig = computed(() => getStatusConfig(props.data.status))
</script>

<template>
  <div
    class="intent-node"
    :class="{ disabled: !data.isEnabled }"
    :style="{ borderLeftColor: data.domainColor }"
  >
    <!-- Target Handle (left side - receives from domain) -->
    <Handle type="target" :position="Position.Left" class="handle-target" />

    <!-- Source Handle (right side - connects to agent) -->
    <Handle type="source" :position="Position.Right" class="handle-source" />

    <div class="node-header">
      <span class="node-label" :title="data.intentKey">{{ data.intentName }}</span>
      <span
        class="status-badge"
        :style="{
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.color
        }"
      >
        <i :class="['pi', statusConfig.icon]" />
      </span>
    </div>

    <div class="node-key">{{ data.intentKey }}</div>

    <div class="pattern-stats">
      <span v-if="data.lemmaCount" class="pattern-tag" title="Lemmas">
        <i class="pi pi-book" /> {{ data.lemmaCount }}
      </span>
      <span v-if="data.phraseCount" class="pattern-tag" title="Frases">
        <i class="pi pi-comments" /> {{ data.phraseCount }}
      </span>
      <span v-if="data.keywordCount" class="pattern-tag" title="Keywords">
        <i class="pi pi-key" /> {{ data.keywordCount }}
      </span>
    </div>

    <div v-if="data.agentKey" class="agent-link">
      <i class="pi pi-arrow-right" />
      <span>{{ data.agentKey.replace(/_agent$/, '') }}</span>
    </div>

    <div v-if="!data.agentKey" class="no-mapping">
      <i class="pi pi-exclamation-triangle" />
      <span>Sin mapear</span>
    </div>
  </div>
</template>

<style scoped>
.intent-node {
  min-width: 160px;
  max-width: 200px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);
  border-left: 4px solid;
  background: var(--surface-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.intent-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.intent-node.disabled {
  opacity: 0.5;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
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

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge i {
  font-size: 0.65rem;
}

.node-key {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.pattern-stats {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.pattern-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: var(--surface-ground);
  border-radius: 4px;
  font-size: 0.6rem;
  color: var(--text-color-secondary);
}

.pattern-tag i {
  font-size: 0.55rem;
}

.agent-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: var(--primary-color);
  background: var(--primary-50);
  padding: 2px 6px;
  border-radius: 4px;
}

.agent-link i {
  font-size: 0.5rem;
}

.no-mapping {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: var(--yellow-600);
  background: var(--yellow-100);
  padding: 2px 6px;
  border-radius: 4px;
}

.no-mapping i {
  font-size: 0.55rem;
}

/* Handle styles */
.handle-target,
.handle-source {
  width: 8px;
  height: 8px;
  background: var(--surface-400);
  border: 2px solid var(--surface-card);
}

.handle-source {
  background: var(--primary-color);
}

/* Dark mode overrides */
:root.dark .intent-node,
.dark-mode .intent-node,
[data-theme="dark"] .intent-node {
  background: var(--surface-card);
  border-color: var(--surface-400);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

:root.dark .intent-node:hover,
.dark-mode .intent-node:hover,
[data-theme="dark"] .intent-node:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

:root.dark .pattern-tag,
.dark-mode .pattern-tag,
[data-theme="dark"] .pattern-tag {
  background: var(--surface-200);
  color: var(--text-color-secondary);
}

:root.dark .agent-link,
.dark-mode .agent-link,
[data-theme="dark"] .agent-link {
  background: rgba(59, 130, 246, 0.25);
  color: var(--primary-400);
}

:root.dark .no-mapping,
.dark-mode .no-mapping,
[data-theme="dark"] .no-mapping {
  background: rgba(234, 179, 8, 0.25);
  color: var(--yellow-400);
}
</style>
