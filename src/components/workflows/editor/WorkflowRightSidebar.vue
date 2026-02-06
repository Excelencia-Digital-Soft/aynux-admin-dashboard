<script setup lang="ts">
// @ts-nocheck - Pre-existing type issues with emit type overloads
/**
 * WorkflowRightSidebar - n8n-style right action sidebar
 *
 * Features:
 * - 50px width
 * - Action buttons: Add node, Search, Duplicate, Layout, AI
 */
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const emit = defineEmits<{
  (e: 'addNode'): void
  (e: 'search'): void
  (e: 'duplicate'): void
  (e: 'autoLayout'): void
  (e: 'aiAssist'): void
  (e: 'toggleMinimap'): void
}>()

const actions = [
  { id: 'add', icon: 'pi-plus', label: 'Agregar nodo', event: 'addNode' as const, primary: true },
  { id: 'search', icon: 'pi-search', label: 'Buscar nodo (Ctrl+F)', event: 'search' as const },
  { id: 'duplicate', icon: 'pi-clone', label: 'Duplicar selección', event: 'duplicate' as const },
  { id: 'layout', icon: 'pi-th-large', label: 'Auto ordenar', event: 'autoLayout' as const },
  { id: 'minimap', icon: 'pi-map', label: 'Minimapa', event: 'toggleMinimap' as const }
]
</script>

<template>
  <div class="n8n-right-sidebar">
    <TooltipProvider>
      <div class="sidebar-actions">
        <Tooltip v-for="action in actions" :key="action.id">
          <TooltipTrigger as-child>
            <button
              class="action-item"
              :class="{ primary: action.primary }"
              @click="emit(action.event)"
            >
              <i :class="['pi', action.icon]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {{ action.label }}
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- AI Assist at bottom -->
      <div class="sidebar-bottom">
        <Tooltip>
          <TooltipTrigger as-child>
            <button class="action-item ai-button" @click="emit('aiAssist')">
              <i class="pi pi-sparkles" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Asistente AI
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>

<style scoped>
.n8n-right-sidebar {
  width: 50px;
  height: 100%;
  background: #061222;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 0;
}

.sidebar-actions,
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.action-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.action-item i {
  font-size: 18px;
}

.action-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.action-item.primary {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.action-item.primary:hover {
  background: rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
}

.ai-button {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
  color: #67e8f9;
}

.ai-button:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3));
  color: #a5f3fc;
}

.ai-button i {
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
