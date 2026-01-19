<script setup lang="ts">
/**
 * ConditionEdge - Custom edge component with condition labels
 *
 * Displays transition conditions with appropriate icons and colors
 * based on condition type (intent, entity, state, expression).
 */
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@vue-flow/core'
import type { TransitionCondition } from '@/types/workflow.types'

const props = defineProps<EdgeProps>()

// Calculate edge path
const path = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition
  })
})

// Get condition from edge data
const condition = computed((): TransitionCondition | null => {
  return props.data?.condition || null
})

// Calculate label position (midpoint of edge)
const labelPosition = computed(() => {
  return {
    x: (props.sourceX + props.targetX) / 2,
    y: (props.sourceY + props.targetY) / 2
  }
})

// Get icon class based on condition type
const conditionIcon = computed(() => {
  if (!condition.value) return 'pi pi-arrow-right'

  const icons: Record<string, string> = {
    intent: 'pi pi-bolt',
    entity: 'pi pi-tag',
    state: 'pi pi-cog',
    expression: 'pi pi-code',
    always: 'pi pi-check'
  }

  return icons[condition.value.type] || 'pi pi-arrow-right'
})

// Get color based on condition type
const conditionColor = computed(() => {
  if (!condition.value) return '#64748b'

  const colors: Record<string, string> = {
    intent: '#8b5cf6',    // violet
    entity: '#10b981',    // green
    state: '#3b82f6',     // blue
    expression: '#f59e0b', // orange
    always: '#64748b'     // gray
  }

  return colors[condition.value.type] || '#64748b'
})

// Get label text
const labelText = computed(() => {
  if (!condition.value) return props.label || ''

  if (condition.value.type === 'always') {
    return 'siempre'
  }

  if (condition.value.value) {
    const field = condition.value.field ? `${condition.value.field} ` : ''
    const operator = condition.value.operator || ''
    return `${field}${operator} ${condition.value.value}`.trim()
  }

  // For expression type
  const expr = (condition.value as Record<string, unknown>).expression
  if (expr && typeof expr === 'string') {
    return expr.length > 20 ? `${expr.substring(0, 20)}...` : expr
  }

  return condition.value.type
})

// Determine if we should show the label
const showLabel = computed(() => {
  return condition.value !== null || props.label
})

// Edge style
const edgeStyle = computed(() => {
  if (condition.value) {
    return {
      stroke: conditionColor.value,
      strokeWidth: 2,
      strokeDasharray: condition.value.type === 'always' ? 'none' : '5,5'
    }
  }
  return {
    stroke: '#94a3b8',
    strokeWidth: 2
  }
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path[0]"
    :marker-end="markerEnd"
    :style="edgeStyle"
  />

  <EdgeLabelRenderer v-if="showLabel">
    <div
      class="condition-edge-label"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
        pointerEvents: 'all'
      }"
    >
      <div
        class="label-content"
        :style="{ borderColor: conditionColor, backgroundColor: `${conditionColor}10` }"
      >
        <i :class="conditionIcon" :style="{ color: conditionColor }" />
        <span class="label-text">{{ labelText }}</span>
      </div>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.condition-edge-label {
  font-size: 11px;
  z-index: 10;
}

.label-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: white;
  border: 1px solid;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  max-width: 150px;
}

.label-content i {
  font-size: 10px;
  flex-shrink: 0;
}

.label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
  font-weight: 500;
}
</style>
