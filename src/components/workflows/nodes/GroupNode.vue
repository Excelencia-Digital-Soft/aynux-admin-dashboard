<script setup lang="ts">
/**
 * GroupNode - Container node for grouping workflow nodes (n8n-style)
 *
 * A special node type that acts as a container for other nodes.
 * Features:
 * - Collapsible content
 * - Color picker with 7 predefined colors
 * - Glow effect on selection
 * - Inline name editing
 */
import { ref, computed } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import Button from 'primevue/button'
import GroupColorPicker from '@/components/workflows/editor/GroupColorPicker.vue'

interface GroupData {
  label: string
  display_name?: string
  color?: string
  is_collapsed?: boolean
  node_ids?: string[]
  onToggleCollapse?: () => void
  onDelete?: () => void
  onRename?: (name: string) => void
  onColorChange?: (color: string) => void
}

const props = defineProps<NodeProps<GroupData>>()

// Local state
const isEditing = ref(false)
const editName = ref(props.data?.display_name || props.data?.label || 'Grupo')

// Computed
const displayName = computed(() => props.data?.display_name || props.data?.label || 'Grupo')
const isCollapsed = computed(() => props.data?.is_collapsed || false)
const nodeCount = computed(() => props.data?.node_ids?.length || 0)
const color = computed(() => props.data?.color || '#8b5cf6')

// Color styles with CSS custom properties for glow effect
const colorStyles = computed(() => ({
  bg: `${color.value}15`,
  border: `${color.value}40`,
  header: `${color.value}25`,
  glow: `${color.value}30`
}))

// Start editing
function startEditing() {
  editName.value = displayName.value
  isEditing.value = true
}

// Save name
function saveName() {
  isEditing.value = false
  if (props.data?.onRename && editName.value !== displayName.value) {
    props.data.onRename(editName.value)
  }
}

// Handle key events
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isEditing.value = false
    editName.value = displayName.value
  } else if (e.key === 'Enter') {
    saveName()
  }
}

// Toggle collapse
function toggleCollapse() {
  if (props.data?.onToggleCollapse) {
    props.data.onToggleCollapse()
  }
}

// Delete group
function handleDelete() {
  if (props.data?.onDelete) {
    props.data.onDelete()
  }
}

// Change color
function handleColorChange(newColor: string) {
  if (props.data?.onColorChange) {
    props.data.onColorChange(newColor)
  }
}
</script>

<template>
  <div
    class="group-node"
    :class="{ 'is-collapsed': isCollapsed }"
    :style="{
      backgroundColor: colorStyles.bg,
      borderColor: colorStyles.border,
      '--group-glow': colorStyles.glow,
      '--group-color': color
    }"
  >
    <!-- Header -->
    <div
      class="group-header"
      :style="{ backgroundColor: colorStyles.header }"
    >
      <!-- Name (editable) -->
      <div class="group-name" @dblclick="startEditing">
        <i class="pi pi-folder" :style="{ color }" />
        <input
          v-if="isEditing"
          v-model="editName"
          class="name-input"
          @blur="saveName"
          @keydown="handleKeyDown"
        />
        <span v-else>{{ displayName }}</span>
      </div>

      <!-- Actions -->
      <div class="group-actions">
        <span class="node-count">{{ nodeCount }} nodos</span>
        <GroupColorPicker
          :model-value="color"
          @update:model-value="handleColorChange"
        />
        <Button
          :icon="isCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
          text
          rounded
          size="small"
          @click="toggleCollapse"
        />
        <Button
          icon="pi pi-trash"
          text
          rounded
          size="small"
          severity="danger"
          @click="handleDelete"
        />
      </div>
    </div>

    <!-- Content area (where child nodes go) -->
    <div v-if="!isCollapsed" class="group-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.group-node {
  min-width: 300px;
  min-height: 200px;
  border: 2px dashed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.group-node.is-collapsed {
  min-height: auto;
}

/* Glow effect on selection */
:deep(.vue-flow__node.selected) .group-node {
  border-style: solid;
  box-shadow: 0 0 0 3px var(--group-glow, rgba(139, 92, 246, 0.3)),
    0 4px 12px rgba(0, 0, 0, 0.2);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.group-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
}

.group-name i {
  font-size: 16px;
}

.name-input {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  background: rgba(0, 0, 0, 0.2);
  color: white;
}

.name-input:focus {
  border-color: var(--group-color, #8b5cf6);
  box-shadow: 0 0 0 2px var(--group-glow, rgba(139, 92, 246, 0.3));
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 8px;
}

.group-content {
  padding: 16px;
  min-height: 150px;
}

/* Style buttons for dark theme */
:deep(.p-button) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.p-button:hover) {
  color: rgba(255, 255, 255, 0.9);
}

/* No handles for group nodes */
:deep(.vue-flow__handle) {
  display: none !important;
}
</style>
