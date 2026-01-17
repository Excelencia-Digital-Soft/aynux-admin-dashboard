<script setup lang="ts">
/**
 * GroupNode - Container node for grouping workflow nodes
 *
 * A special node type that acts as a container for other nodes.
 * Can be collapsed/expanded and styled with colors.
 */
import { ref, computed } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import Button from 'primevue/button'

interface GroupData {
  label: string
  display_name?: string
  color?: string
  is_collapsed?: boolean
  node_ids?: string[]
  onToggleCollapse?: () => void
  onDelete?: () => void
  onRename?: (name: string) => void
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

// Color styles
const colorStyles = computed(() => ({
  bg: `${color.value}15`,
  border: `${color.value}40`,
  header: `${color.value}25`
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
</script>

<template>
  <div
    class="group-node"
    :class="{ 'is-collapsed': isCollapsed }"
    :style="{
      backgroundColor: colorStyles.bg,
      borderColor: colorStyles.border
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
  border-radius: 8px;
  overflow: hidden;
}

.group-node.is-collapsed {
  min-height: auto;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.group-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.group-name i {
  font-size: 16px;
}

.name-input {
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
}

.name-input:focus {
  border-color: #8b5cf6;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-count {
  font-size: 12px;
  color: #6b7280;
  margin-right: 8px;
}

.group-content {
  padding: 16px;
  min-height: 150px;
}

/* No handles for group nodes */
:deep(.vue-flow__handle) {
  display: none !important;
}
</style>
