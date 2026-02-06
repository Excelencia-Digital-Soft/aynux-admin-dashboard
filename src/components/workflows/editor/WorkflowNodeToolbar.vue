<script lang="ts">
/**
 * WorkflowNodeToolbar - Mini floating toolbar above selected node (n8n-style)
 *
 * Features:
 * - Small, unobtrusive toolbar
 * - Quick actions: Execute, Activate/Deactivate, Delete, More
 * - Uses screen coordinates for positioning
 */
export interface ToolbarPosition {
  x: number
  y: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const props = defineProps<{
  position: ToolbarPosition | null
  isActive: boolean
  nodeId: string | null
}>()

const emit = defineEmits<{
  (e: 'execute'): void
  (e: 'toggleActive'): void
  (e: 'delete'): void
  (e: 'more', event: MouseEvent): void
}>()

// Calculate toolbar position (screen coordinates)
const toolbarStyle = computed(() => {
  if (!props.position) return { display: 'none' }

  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toolbar">
      <div
        v-if="position && nodeId"
        class="node-toolbar"
        :style="toolbarStyle"
      >
        <TooltipProvider :delay-duration="500">
          <!-- Execute -->
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="toolbar-btn" @click="emit('execute')">
                <i class="pi pi-play" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4">
              Ejecutar
            </TooltipContent>
          </Tooltip>

          <!-- Activate/Deactivate -->
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="toolbar-btn"
                :class="{ 'is-inactive': !isActive }"
                @click="emit('toggleActive')"
              >
                <i :class="isActive ? 'pi pi-power-off' : 'pi pi-ban'" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4">
              {{ isActive ? 'Desactivar' : 'Activar' }}
            </TooltipContent>
          </Tooltip>

          <!-- Delete -->
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="toolbar-btn toolbar-btn--danger" @click="emit('delete')">
                <i class="pi pi-trash" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4">
              Eliminar
            </TooltipContent>
          </Tooltip>

          <!-- More options -->
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="toolbar-btn" @click="(e) => emit('more', e)">
                <i class="pi pi-ellipsis-h" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4">
              Mas
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.node-toolbar {
  position: fixed;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  background: rgba(12, 29, 61, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -100%);
  margin-top: -8px;
  pointer-events: auto;
}

.toolbar-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.toolbar-btn i {
  font-size: 0.65rem;
}

.toolbar-btn.is-inactive {
  color: rgba(255, 255, 255, 0.4);
}

.toolbar-btn--danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Animation */
.toolbar-enter-active,
.toolbar-leave-active {
  transition: all 0.15s ease;
}

.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}
</style>
