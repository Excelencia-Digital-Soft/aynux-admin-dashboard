<script setup lang="ts">
/**
 * ConditionNode - Conditional If node with true/false outputs (n8n-style)
 *
 * Features:
 * - Split direction icon
 * - Two output handles labeled "true" and "false"
 * - Green color scheme for decision nodes
 */
import { computed } from 'vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'

interface ConditionData {
  label: string
  condition?: {
    field: string
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'matches'
    value: string
  }
  isActive?: boolean
}

const props = defineProps<NodeProps<ConditionData>>()

const label = computed(() => props.data?.label || 'If')
const isActive = computed(() => props.data?.isActive !== false)
</script>

<template>
  <div class="condition-node" :class="{ 'is-inactive': !isActive }">
    <!-- Input handle (left) -->
    <Handle
      type="target"
      :position="Position.Left"
      class="condition-handle condition-handle-input"
    />

    <!-- Node body -->
    <div class="condition-node-body">
      <i class="pi pi-directions" />
    </div>

    <!-- Output handles with labels -->
    <div class="condition-outputs">
      <div class="output-row output-row--true">
        <Handle
          id="true"
          type="source"
          :position="Position.Right"
          class="condition-handle condition-handle-true"
        />
        <span class="output-label output-label--true">true</span>
      </div>
      <div class="output-row output-row--false">
        <Handle
          id="false"
          type="source"
          :position="Position.Right"
          class="condition-handle condition-handle-false"
        />
        <span class="output-label output-label--false">false</span>
      </div>
    </div>

    <!-- Node label -->
    <div class="condition-node-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.condition-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.condition-node.is-inactive {
  opacity: 0.5;
}

.condition-node-body {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.condition-node-body i {
  font-size: 2rem;
  color: white;
}

.condition-node-body:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.2);
}

/* Output handles container */
.condition-outputs {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.output-row {
  display: flex;
  align-items: center;
  position: relative;
}

/* Labels for true/false */
.output-label {
  position: absolute;
  right: 20px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
}

.output-label--true {
  color: #10b981;
}

.output-label--false {
  color: #ef4444;
}

/* Node label */
.condition-node-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Handle styling */
.condition-handle {
  width: 14px !important;
  height: 14px !important;
  border-radius: 50% !important;
  border: 3px solid #0c1d3d !important;
  transition: all 0.15s ease;
}

.condition-handle-input {
  background: #3d5a80 !important;
  left: -7px !important;
}

.condition-handle-true {
  background: #10b981 !important;
}

.condition-handle-false {
  background: #ef4444 !important;
}

.condition-handle:hover {
  transform: scale(1.3);
}

/* Selected state */
:deep(.vue-flow__node.selected) .condition-node-body {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 3px #8b5cf6;
}
</style>
