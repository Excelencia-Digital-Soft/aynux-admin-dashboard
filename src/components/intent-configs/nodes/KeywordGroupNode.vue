<script setup lang="ts">
/**
 * KeywordGroupNode - Graph node representing keywords for an agent
 *
 * Displays keyword count and enabled status.
 */
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { KeywordGroupNodeData } from '../types'

interface Props {
  data: KeywordGroupNodeData
}

const props = defineProps<Props>()

const displayKeywords = computed(() => {
  return props.data.keywords.slice(0, 3).map(k => k.keyword)
})

const hasMore = computed(() => props.data.keywords.length > 3)
</script>

<template>
  <div class="keyword-group-node">
    <!-- Target Handle (left side - receives from agent) -->
    <Handle type="target" :position="Position.Left" class="handle-target" />

    <div class="node-header">
      <i class="pi pi-key" />
      <span class="node-label">{{ data.keywordCount }} keywords</span>
    </div>

    <div class="keyword-list">
      <span
        v-for="keyword in displayKeywords"
        :key="keyword"
        class="keyword-tag"
      >
        {{ keyword }}
      </span>
      <span v-if="hasMore" class="more-tag">
        +{{ data.keywords.length - 3 }} más
      </span>
    </div>

    <div class="node-stats">
      <span class="enabled-count">
        {{ data.enabledCount }}/{{ data.keywordCount }} activos
      </span>
    </div>
  </div>
</template>

<style scoped>
.keyword-group-node {
  min-width: 130px;
  max-width: 160px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px dashed var(--surface-border);
  background: var(--surface-ground);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.keyword-group-node:hover {
  border-color: var(--surface-400);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.375rem;
}

.node-header i {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.node-label {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-color);
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.375rem;
}

.keyword-tag {
  padding: 1px 5px;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: 3px;
  font-size: 0.55rem;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-tag {
  padding: 1px 5px;
  background: var(--surface-100);
  color: var(--text-color-secondary);
  border-radius: 3px;
  font-size: 0.55rem;
  font-style: italic;
}

.node-stats {
  padding-top: 0.25rem;
  border-top: 1px solid var(--surface-border);
}

.enabled-count {
  font-size: 0.6rem;
  color: var(--text-color-secondary);
}

/* Handle styles */
.handle-target {
  width: 8px;
  height: 8px;
  background: var(--surface-400);
  border: 2px solid var(--surface-card);
}

/* Dark mode overrides */
:root.dark .keyword-group-node,
.dark-mode .keyword-group-node,
[data-theme="dark"] .keyword-group-node {
  background: var(--surface-card);
  border-color: var(--surface-400);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

:root.dark .keyword-group-node:hover,
.dark-mode .keyword-group-node:hover,
[data-theme="dark"] .keyword-group-node:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

:root.dark .keyword-tag,
.dark-mode .keyword-tag,
[data-theme="dark"] .keyword-tag {
  background: rgba(59, 130, 246, 0.25);
  color: var(--primary-400);
}

:root.dark .more-tag,
.dark-mode .more-tag,
[data-theme="dark"] .more-tag {
  background: var(--surface-200);
  color: var(--text-color-secondary);
}

:root.dark .node-stats,
.dark-mode .node-stats,
[data-theme="dark"] .node-stats {
  border-top-color: var(--surface-400);
}
</style>
