<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Record<string, unknown> | null | undefined
  title?: string
}>()

const hasData = computed(() => props.data && Object.keys(props.data).length > 0)

function getValueColor(value: unknown): string {
  if (value === null || value === undefined) return '#9ca3af'
  if (typeof value === 'string') return '#10b981'
  if (typeof value === 'number') return '#3b82f6'
  if (typeof value === 'boolean') return '#a855f6'
  return '#e5e7eb'
}

function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function isExpandable(value: unknown): boolean {
  return typeof value === 'object' && value !== null
}
</script>

<template>
  <div class="data-inspector">
    <div v-if="!hasData" class="no-data">
      <i class="pi pi-inbox text-2xl opacity-30" />
      <span class="text-sm text-muted-foreground">Sin datos disponibles</span>
      <p class="text-xs text-muted-foreground max-w-xs text-center">
        Ejecuta el workflow para ver los datos que pasan por este nodo.
      </p>
    </div>

    <div v-else class="data-tree">
      <div
        v-for="(value, key) in data"
        :key="String(key)"
        class="data-entry"
      >
        <template v-if="isExpandable(value)">
          <details>
            <summary class="data-key expandable">
              <i class="pi pi-chevron-right expand-icon" />
              <span>{{ key }}</span>
              <span class="data-type">{{ Array.isArray(value) ? `Array[${(value as unknown[]).length}]` : 'Object' }}</span>
            </summary>
            <pre class="data-json">{{ JSON.stringify(value, null, 2) }}</pre>
          </details>
        </template>
        <template v-else>
          <div class="data-leaf">
            <span class="data-key">{{ key }}</span>
            <span class="data-value" :style="{ color: getValueColor(value) }">
              {{ formatValue(value) }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-inspector {
  min-height: 120px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
}

.data-tree {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
}

.data-entry {
  border-bottom: 1px solid hsl(var(--border) / 0.5);
}

.data-entry:last-child {
  border-bottom: none;
}

.data-leaf {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
}

.data-key {
  font-weight: 600;
  color: hsl(var(--foreground));
  font-size: 0.78rem;
}

.data-key.expandable {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
}

.data-key.expandable:hover {
  background: hsl(var(--muted) / 0.3);
}

.expand-icon {
  font-size: 0.6rem;
  transition: transform 0.15s;
}

details[open] > summary .expand-icon {
  transform: rotate(90deg);
}

.data-type {
  font-size: 0.65rem;
  color: hsl(var(--muted-foreground));
  font-weight: 400;
}

.data-value {
  font-size: 0.78rem;
  word-break: break-all;
}

.data-json {
  padding: 8px 8px 8px 24px;
  font-size: 0.72rem;
  overflow-x: auto;
  background: hsl(var(--muted) / 0.15);
  margin: 0;
  max-height: 200px;
}
</style>
