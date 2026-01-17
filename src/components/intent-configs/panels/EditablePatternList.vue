<script setup lang="ts">
/**
 * EditablePatternList - Editable list of simple patterns (lemmas, keywords)
 *
 * Allows adding/removing string patterns with loading states.
 */
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

interface Props {
  items: string[]
  label: string
  severity?: 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' | undefined
  placeholder?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'secondary',
  placeholder: 'Agregar...',
  loading: false
})

const emit = defineEmits<{
  (e: 'add', item: string): void
  (e: 'remove', item: string): void
}>()

const newItem = ref('')
const addingItem = ref(false)
const removingItem = ref<string | null>(null)

async function addItem() {
  const trimmed = newItem.value.trim().toLowerCase()
  if (!trimmed) return
  if (props.items.includes(trimmed)) {
    newItem.value = ''
    return
  }

  addingItem.value = true
  emit('add', trimmed)
  newItem.value = ''
  // Loading state is managed by parent via loading prop
  addingItem.value = false
}

async function removeItem(item: string) {
  removingItem.value = item
  emit('remove', item)
  removingItem.value = null
}
</script>

<template>
  <div class="editable-pattern-list">
    <div class="pattern-header">
      <span class="label">{{ label }}</span>
      <span class="count">({{ items.length }})</span>
    </div>

    <!-- Input para agregar -->
    <div class="add-pattern">
      <InputText
        v-model="newItem"
        :placeholder="placeholder"
        class="add-input"
        @keyup.enter="addItem"
      />
      <Button
        icon="pi pi-plus"
        size="small"
        :loading="addingItem || loading"
        :disabled="!newItem.trim()"
        @click="addItem"
      />
    </div>

    <!-- Lista de tags editables -->
    <div class="pattern-tags">
      <Tag
        v-for="item in items"
        :key="item"
        :value="item"
        :severity="severity"
        class="editable-tag"
      >
        <template #default>
          <span class="tag-content">{{ item }}</span>
          <i
            class="pi pi-times remove-icon"
            :class="{ 'loading': removingItem === item }"
            @click.stop="removeItem(item)"
          />
        </template>
      </Tag>
      <span v-if="items.length === 0" class="empty-message">
        Sin patrones configurados
      </span>
    </div>
  </div>
</template>

<style scoped>
.editable-pattern-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.pattern-header .label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.pattern-header .count {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.add-pattern {
  display: flex;
  gap: 0.375rem;
}

.add-input {
  flex: 1;
  font-size: 0.8rem;
}

.add-input :deep(.p-inputtext) {
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
}

.pattern-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-height: 1.5rem;
}

.editable-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: default;
  font-size: 0.75rem;
}

.editable-tag :deep(.p-tag-label) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tag-content {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-icon {
  font-size: 0.65rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s, color 0.15s;
  margin-left: 0.125rem;
}

.remove-icon:hover {
  opacity: 1;
  color: var(--red-500);
}

.remove-icon.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-message {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Dark mode */
:root.dark .editable-tag,
.dark-mode .editable-tag,
[data-theme="dark"] .editable-tag {
  background: var(--surface-200);
  color: var(--text-color);
}
</style>
