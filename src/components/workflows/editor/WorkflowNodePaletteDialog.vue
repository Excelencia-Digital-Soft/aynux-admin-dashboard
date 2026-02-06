<script setup lang="ts">
/**
 * WorkflowNodePaletteDialog - n8n-style node palette as slide-out sheet
 *
 * Features:
 * - Slide-out from right side
 * - Search/filter nodes
 * - Categories with icons
 * - Click to add node
 */
import { ref, computed, watch } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import type { NodeDefinition } from '@/types/workflow.types'

const props = defineProps<{
  visible: boolean
  nodeDefinitionsByCategory: Record<string, NodeDefinition[]>
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'addNode', definition: NodeDefinition): void
}>()

const searchQuery = ref('')

// Category icons and colors
const categoryConfig: Record<string, { icon: string; color: string; label: string }> = {
  conversation: { icon: 'pi-comments', color: '#3b82f6', label: 'Conversación' },
  routing: { icon: 'pi-sitemap', color: '#8b5cf6', label: 'Enrutamiento' },
  integration: { icon: 'pi-cloud', color: '#10b981', label: 'Integraciones' },
  utility: { icon: 'pi-cog', color: '#64748b', label: 'Utilidades' }
}

// Filter nodes by search
const filteredCategories = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  if (!query) return props.nodeDefinitionsByCategory

  const filtered: Record<string, NodeDefinition[]> = {}

  for (const [category, definitions] of Object.entries(props.nodeDefinitionsByCategory)) {
    const matchedDefs = definitions.filter(
      def =>
        def.display_name.toLowerCase().includes(query) ||
        def.description?.toLowerCase().includes(query) ||
        def.node_key.toLowerCase().includes(query)
    )

    if (matchedDefs.length > 0) {
      filtered[category] = matchedDefs
    }
  }

  return filtered
})

const totalNodes = computed(() => {
  return Object.values(filteredCategories.value).reduce((sum, defs) => sum + defs.length, 0)
})

// Reset search when dialog opens
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    searchQuery.value = ''
  }
})

function handleAddNode(definition: NodeDefinition) {
  emit('addNode', definition)
  emit('update:visible', false)
}

function getCategoryIcon(category: string): string {
  return categoryConfig[category]?.icon || 'pi-circle'
}

function getCategoryColor(category: string): string {
  return categoryConfig[category]?.color || '#64748b'
}

function getCategoryLabel(category: string): string {
  return categoryConfig[category]?.label || category
}
</script>

<template>
  <Sheet :open="visible" @update:open="emit('update:visible', $event)">
    <SheetContent side="right" class="n8n-palette-sheet">
      <SheetHeader class="palette-header">
        <SheetTitle class="palette-title">
          <i class="pi pi-plus-circle" />
          Agregar nodo
        </SheetTitle>

        <!-- Search -->
        <div class="palette-search">
          <i class="pi pi-search search-icon" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar nodos..."
            class="search-input"
          />
        </div>

        <div class="palette-stats">
          {{ totalNodes }} nodo{{ totalNodes !== 1 ? 's' : '' }} disponible{{ totalNodes !== 1 ? 's' : '' }}
        </div>
      </SheetHeader>

      <div class="palette-content">
        <!-- Empty state -->
        <div v-if="totalNodes === 0" class="palette-empty">
          <i class="pi pi-search" />
          <span>No se encontraron nodos</span>
        </div>

        <!-- Categories -->
        <div
          v-for="(definitions, category) in filteredCategories"
          :key="category"
          class="palette-category"
        >
          <div class="category-header">
            <div class="category-icon" :style="{ backgroundColor: getCategoryColor(category) }">
              <i :class="['pi', getCategoryIcon(category)]" />
            </div>
            <span class="category-label">{{ getCategoryLabel(category) }}</span>
            <span class="category-count">{{ definitions.length }}</span>
          </div>

          <div class="category-nodes">
            <button
              v-for="def in definitions"
              :key="def.id"
              class="node-item"
              @click="handleAddNode(def)"
            >
              <div class="node-icon" :style="{ backgroundColor: getCategoryColor(category) }">
                <i :class="['pi', def.icon || getCategoryIcon(category)]" />
              </div>
              <div class="node-info">
                <span class="node-name">{{ def.display_name }}</span>
                <span v-if="def.description" class="node-desc">{{ def.description }}</span>
              </div>
              <i class="pi pi-plus node-add" />
            </button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
.n8n-palette-sheet {
  background: #0c1d3d !important;
  border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
  width: 380px !important;
}

.palette-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.palette-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
}

.palette-title i {
  font-size: 20px;
  color: #8b5cf6;
}

.palette-search {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  z-index: 1;
}

.search-input {
  padding-left: 40px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.palette-stats {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.palette-content {
  height: calc(100vh - 180px);
  padding: 16px;
  overflow-y: auto;
}

/* Custom scrollbar */
.palette-content::-webkit-scrollbar {
  width: 6px;
}

.palette-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.palette-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.palette-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.palette-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: rgba(255, 255, 255, 0.4);
}

.palette-empty i {
  font-size: 32px;
}

.palette-category {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.category-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.category-icon i {
  font-size: 14px;
  color: white;
}

.category-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.category-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.category-nodes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.node-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
}

.node-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.node-icon i {
  font-size: 16px;
  color: white;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-desc {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.node-add {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  opacity: 0;
  transition: all 0.2s;
}

.node-item:hover .node-add {
  opacity: 1;
  color: #8b5cf6;
}
</style>
