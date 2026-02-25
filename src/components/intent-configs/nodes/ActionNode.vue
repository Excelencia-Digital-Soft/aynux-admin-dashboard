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
  // Show sub-graph name if available
  if (props.data.subgraph) {
    return props.data.subgraph.toUpperCase()
  }
  const id = props.data.nodeId
  const map: Record<string, string> = {
    auth_plex: 'AUTH',
    debt_manager: 'DEBT',
    payment_processor: 'PAYMENT',
    account_switcher: 'SWITCH',
    info_node: 'INFO',
    turnos: 'TURNOS',
    registro: 'REGISTRO',
    reschedule: 'RESCHEDULE',
    session: 'SESSION'
  }
  return map[id] || id.toUpperCase()
})

const totalConfigs = computed(() =>
  props.data.routingConfigCount + props.data.awaitingTypeConfigCount
)

const MAX_VISIBLE_INTENTS = 4

const visibleIntents = computed(() =>
  (props.data.routingIntents || []).slice(0, MAX_VISIBLE_INTENTS)
)

const overflowCount = computed(() => {
  const total = props.data.routingIntents?.length || 0
  return total > MAX_VISIBLE_INTENTS ? total - MAX_VISIBLE_INTENTS : 0
})

const emit = defineEmits<{
  (e: 'addConfig', nodeId: string): void
}>()

function truncateIntent(name: string): string {
  return name.length > 16 ? name.slice(0, 15) + '..' : name
}

function handleAddConfig(event: Event) {
  event.stopPropagation()
  emit('addConfig', props.data.nodeId)
}
</script>

<template>
  <div
    class="action-node glass-node"
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

    <div class="intent-badges" v-if="visibleIntents.length > 0">
      <span
        v-for="intent in visibleIntents"
        :key="intent"
        class="intent-badge"
        :style="{ borderColor: data.color + '60', background: data.color + '18' }"
        :title="intent"
      >
        {{ truncateIntent(intent) }}
      </span>
      <span
        v-if="overflowCount > 0"
        class="intent-badge intent-overflow"
        :style="{ borderColor: data.color + '40', background: data.color + '10' }"
      >
        +{{ overflowCount }}
      </span>
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

    <button class="add-config-btn" :style="{ background: data.color }" @click="handleAddConfig" title="Agregar routing config">
      <i class="pi pi-plus" />
    </button>

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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.action-node:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.action-node.node-selected {
  outline: 3px solid hsl(var(--primary));
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
  font-size: 1rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.stat-label {
  font-size: 0.6rem;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
}

.intent-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-bottom: 0.375rem;
}

.intent-badge {
  display: inline-block;
  padding: 1px 5px;
  font-size: 0.55rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  border: 1px solid;
  border-radius: 3px;
  white-space: nowrap;
  line-height: 1.3;
}

.intent-overflow {
  font-weight: 700;
  font-size: 0.55rem;
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
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  border-radius: 3px;
  border: 1px solid hsl(var(--border));
}

.add-config-btn {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
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

.action-node:hover .add-config-btn {
  opacity: 0.8;
}

.add-config-btn:hover {
  opacity: 1 !important;
  transform: scale(1.1);
}

.handle {
  width: 10px;
  height: 10px;
  border: 2px solid hsl(var(--card));
}
</style>
