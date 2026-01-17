<script setup lang="ts">
/**
 * AnnotationNode - Sticky note/comment node for workflow canvas
 *
 * A non-connectable node that displays editable text annotations.
 */
import { ref, computed, nextTick, watch } from 'vue'
import type { NodeProps } from '@vue-flow/core'

interface AnnotationData {
  content: string
  color?: string
  type?: 'text' | 'sticky'
  onUpdate?: (content: string) => void
  onDelete?: () => void
}

const props = defineProps<NodeProps<AnnotationData>>()

// Local state
const isEditing = ref(false)
const editContent = ref(props.data?.content || '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Computed
const content = computed(() => props.data?.content || 'Click para editar...')
const color = computed(() => props.data?.color || 'yellow')
const isSticky = computed(() => props.data?.type === 'sticky')

// Color styles
const colorStyles = computed(() => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    yellow: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    blue: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
    green: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
    pink: { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
    purple: { bg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6' },
    gray: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' }
  }
  return colors[color.value] || colors.yellow
})

// Start editing
function startEditing() {
  editContent.value = content.value
  isEditing.value = true
  nextTick(() => {
    textareaRef.value?.focus()
    textareaRef.value?.select()
  })
}

// Save changes
function saveChanges() {
  isEditing.value = false
  if (props.data?.onUpdate && editContent.value !== content.value) {
    props.data.onUpdate(editContent.value)
  }
}

// Cancel editing
function cancelEditing() {
  isEditing.value = false
  editContent.value = content.value
}

// Handle key events
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    cancelEditing()
  } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    saveChanges()
  }
}

// Handle delete
function handleDelete() {
  if (props.data?.onDelete) {
    props.data.onDelete()
  }
}

// Watch for external content changes
watch(() => props.data?.content, (newContent) => {
  if (!isEditing.value && newContent) {
    editContent.value = newContent
  }
})
</script>

<template>
  <div
    class="annotation-node"
    :class="{ 'is-editing': isEditing, 'is-sticky': isSticky }"
    :style="{
      backgroundColor: colorStyles.bg,
      borderColor: colorStyles.border,
      color: colorStyles.text
    }"
    @dblclick="startEditing"
  >
    <!-- Delete button -->
    <button
      v-if="!isEditing"
      class="delete-button"
      title="Eliminar nota"
      @click.stop="handleDelete"
    >
      <i class="pi pi-times" />
    </button>

    <!-- Content display -->
    <div v-if="!isEditing" class="annotation-content">
      {{ content }}
    </div>

    <!-- Edit mode -->
    <div v-else class="annotation-edit">
      <textarea
        ref="textareaRef"
        v-model="editContent"
        class="annotation-textarea"
        :style="{ color: colorStyles.text }"
        placeholder="Escribe una nota..."
        @blur="saveChanges"
        @keydown="handleKeyDown"
      />
      <div class="edit-hint">
        <span><kbd>Esc</kbd> cancelar</span>
        <span><kbd>Ctrl+Enter</kbd> guardar</span>
      </div>
    </div>

    <!-- Corner fold (sticky note effect) -->
    <div
      v-if="isSticky"
      class="corner-fold"
      :style="{ borderTopColor: colorStyles.border }"
    />
  </div>
</template>

<style scoped>
.annotation-node {
  min-width: 150px;
  max-width: 250px;
  min-height: 60px;
  padding: 12px;
  border: 2px solid;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.annotation-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.annotation-node.is-sticky {
  border-radius: 0;
  border-top-right-radius: 0;
}

.annotation-node.is-editing {
  cursor: default;
}

.delete-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 10px;
}

.annotation-node:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background: #dc2626;
}

.annotation-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.annotation-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.annotation-textarea {
  width: 100%;
  min-height: 60px;
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  resize: none;
  outline: none;
}

.edit-hint {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.7;
}

.edit-hint kbd {
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  font-family: monospace;
}

.corner-fold {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 20px 20px 0 0;
  border-color: transparent;
  border-right-color: white;
}

/* No handles for annotation nodes */
:deep(.vue-flow__handle) {
  display: none !important;
}
</style>
