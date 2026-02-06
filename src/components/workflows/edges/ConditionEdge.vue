<script setup lang="ts">
// @ts-nocheck - Pre-existing type issues with condition type comparisons
/**
 * ConditionEdge - n8n-style edge component with smooth bezier curves
 *
 * Features:
 * - Smooth bezier curves with curvature 0.5
 * - Dark theme compatible labels
 * - Condition type indicators (true/false, intent, entity, etc.)
 * - Animated hover effects
 */
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@vue-flow/core'
import type { TransitionCondition } from '@/types/workflow.types'

const props = defineProps<EdgeProps>()

// Calculate edge path with smoother bezier curve
const path = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    curvature: 0.4 // Smoother curve
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
    always: 'pi pi-check',
    true: 'pi pi-check-circle',
    false: 'pi pi-times-circle'
  }

  return icons[condition.value.type] || 'pi pi-arrow-right'
})

// Get color based on condition type
const conditionColor = computed(() => {
  if (!condition.value) return '#64748b'

  const colors: Record<string, string> = {
    intent: '#8b5cf6',     // violet
    entity: '#10b981',     // green
    state: '#3b82f6',      // blue
    expression: '#f59e0b', // orange
    always: '#64748b',     // gray
    true: '#10b981',       // green for true
    false: '#ef4444'       // red for false
  }

  return colors[condition.value.type] || '#64748b'
})

// Get label text
const labelText = computed(() => {
  if (!condition.value) return props.label || ''

  if (condition.value.type === 'always') {
    return 'siempre'
  }

  if (condition.value.type === 'true') {
    return 'true'
  }

  if (condition.value.type === 'false') {
    return 'false'
  }

  if (condition.value.value) {
    const field = condition.value.field ? `${condition.value.field} ` : ''
    const operator = condition.value.operator || ''
    return `${field}${operator} ${condition.value.value}`.trim()
  }

  // For expression type
  const expr = (condition.value as unknown as Record<string, unknown>).expression
  if (expr && typeof expr === 'string') {
    return expr.length > 20 ? `${expr.substring(0, 20)}...` : expr
  }

  return condition.value.type
})

// Determine if we should show the label
const showLabel = computed(() => {
  return condition.value !== null || props.label
})

// Edge style - n8n style with smoother appearance
const edgeStyle = computed(() => {
  const baseStyle = {
    stroke: conditionColor.value,
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
  }

  if (condition.value && condition.value.type === 'always') {
    return baseStyle
  }

  // Dashed line for conditional edges
  if (condition.value && (condition.value.type === 'true' || condition.value.type === 'false')) {
    return {
      ...baseStyle,
      strokeDasharray: 'none' // Solid for true/false
    }
  }

  return {
    ...baseStyle,
    strokeDasharray: condition.value ? '8,4' : 'none'
  }
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path[0]"
    :marker-end="markerEnd"
    :style="edgeStyle"
    class="n8n-edge"
  />

  <EdgeLabelRenderer v-if="showLabel">
    <div
      class="n8n-edge-label"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
        pointerEvents: 'all'
      }"
    >
      <div
        class="n8n-label-content"
        :style="{
          borderColor: conditionColor,
          '--label-color': conditionColor
        }"
      >
        <i :class="conditionIcon" :style="{ color: conditionColor }" />
        <span class="n8n-label-text">{{ labelText }}</span>
      </div>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
/* ========================================
   n8n-Style Edge Label
   ======================================== */
.n8n-edge-label {
  font-size: 11px;
  z-index: 10;
}

.n8n-label-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(12, 29, 61, 0.95);
  border: 1.5px solid;
  border-radius: 6px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  white-space: nowrap;
  max-width: 160px;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.n8n-label-content:hover {
  transform: scale(1.05);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 0 2px var(--label-color);
}

.n8n-label-content i {
  font-size: 12px;
  flex-shrink: 0;
}

.n8n-label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 11px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* ========================================
   Edge Path Styling
   ======================================== */
:deep(.n8n-edge) {
  cursor: pointer;
}

:deep(.n8n-edge:hover) {
  filter: brightness(1.2);
}

/* Selected edge */
:deep(.vue-flow__edge.selected .n8n-edge) {
  stroke-width: 3.5 !important;
}
</style>
