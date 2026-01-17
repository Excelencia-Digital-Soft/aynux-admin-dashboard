<script setup lang="ts">
/**
 * WorkflowNodeSearch - Node search overlay component
 *
 * Provides a searchable list of workflow nodes with quick navigation.
 */
import { ref, watch, nextTick } from 'vue'
import { useWorkflowNodeSearch } from '@/composables/useWorkflowNodeSearch'
import AutoComplete from 'primevue/autocomplete'
import Tag from 'primevue/tag'

const {
  query,
  isSearchOpen,
  results,
  allNodes,
  focusOnNode,
  closeSearch,
  getColorForType
} = useWorkflowNodeSearch()

// Input ref
const inputRef = ref<InstanceType<typeof AutoComplete> | null>(null)
const suggestions = ref<typeof results.value>([])

// Watch for search open to focus input
watch(isSearchOpen, async (open) => {
  if (open) {
    await nextTick()
    // Focus the autocomplete input
    const el = inputRef.value as unknown as { $el?: HTMLElement }
    const input = el?.$el?.querySelector('input')
    if (input) {
      (input as HTMLInputElement).focus()
    }
  }
})

// Search function for autocomplete
function search(event: { query: string }) {
  const q = event.query.toLowerCase().trim()
  if (!q) {
    suggestions.value = allNodes.value.slice(0, 10)
    return
  }

  suggestions.value = allNodes.value.filter((node) => {
    const labelMatch = node.label.toLowerCase().includes(q)
    const keyMatch = node.instanceKey.toLowerCase().includes(q)
    const typeMatch = node.nodeType.toLowerCase().includes(q)
    return labelMatch || keyMatch || typeMatch
  }).slice(0, 10)
}

// Handle selection
function handleSelect(event: { value: typeof results.value[0] }) {
  if (event.value?.id) {
    focusOnNode(event.value.id)
  }
}

// Get severity for node type tag
function getTypeSeverity(nodeType: string): 'info' | 'success' | 'warn' | 'secondary' {
  const severities: Record<string, 'info' | 'success' | 'warn' | 'secondary'> = {
    conversation: 'info',
    routing: 'warn',
    integration: 'success',
    utility: 'secondary'
  }
  return severities[nodeType] || 'secondary'
}
</script>

<template>
  <Transition name="search-fade">
    <div v-if="isSearchOpen" class="workflow-node-search">
      <div class="search-container">
        <div class="search-header">
          <i class="pi pi-search text-gray-400" />
          <AutoComplete
            ref="inputRef"
            v-model="query"
            :suggestions="suggestions"
            optionLabel="label"
            placeholder="Buscar nodos..."
            class="search-input"
            @complete="search"
            @item-select="handleSelect"
          >
            <template #option="{ option }">
              <div class="search-result-item">
                <i :class="option.icon" :style="{ color: getColorForType(option.nodeType) }" />
                <div class="result-info">
                  <span class="result-label">{{ option.label }}</span>
                  <span class="result-key">{{ option.instanceKey }}</span>
                </div>
                <Tag
                  :value="option.nodeType"
                  :severity="getTypeSeverity(option.nodeType)"
                  class="text-xs"
                />
                <Tag
                  v-if="option.isEntryPoint"
                  value="Entry"
                  severity="success"
                  class="text-xs ml-1"
                />
              </div>
            </template>
            <template #empty>
              <div class="search-empty">
                <i class="pi pi-info-circle" />
                <span>No se encontraron nodos</span>
              </div>
            </template>
          </AutoComplete>
          <button class="close-button" @click="closeSearch">
            <i class="pi pi-times" />
          </button>
        </div>
        <div class="search-hint">
          <span><kbd>Esc</kbd> para cerrar</span>
          <span><kbd>Enter</kbd> para ir al nodo</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.workflow-node-search {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 100;
  width: 350px;
}

.search-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  flex: 1;
}

.search-input :deep(.p-autocomplete-input) {
  border: none;
  box-shadow: none;
  padding: 0;
  font-size: 14px;
}

.search-input :deep(.p-autocomplete-input:focus) {
  box-shadow: none;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.search-hint {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  font-size: 11px;
  color: #6b7280;
}

.search-hint kbd {
  display: inline-block;
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.search-result-item i {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-label {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-key {
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #6b7280;
  font-size: 13px;
}

/* Transition */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: all 0.2s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
