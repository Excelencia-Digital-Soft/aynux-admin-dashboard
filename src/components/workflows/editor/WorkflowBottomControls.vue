<script setup lang="ts">
/**
 * WorkflowBottomControls - n8n-style zoom and navigation controls
 *
 * Features:
 * - Position: Bottom left corner
 * - Controls: Fit view, Zoom in, Zoom out, Undo, Redo
 * - Glassmorphism style
 */
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

defineProps<{
  canUndo: boolean
  canRedo: boolean
  zoomLevel?: number
}>()

const emit = defineEmits<{
  (e: 'fitView'): void
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
  (e: 'undo'): void
  (e: 'redo'): void
}>()
</script>

<template>
  <div class="n8n-bottom-controls">
    <TooltipProvider>
      <div class="controls-group">
        <!-- Undo/Redo -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="control-button"
              :disabled="!canUndo"
              @click="emit('undo')"
            >
              <i class="pi pi-undo" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="control-button"
              :disabled="!canRedo"
              @click="emit('redo')"
            >
              <i class="pi pi-refresh" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <div class="controls-divider" />

        <!-- Zoom controls -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button class="control-button" @click="emit('zoomOut')">
              <i class="pi pi-minus" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Alejar</TooltipContent>
        </Tooltip>

        <div v-if="zoomLevel" class="zoom-indicator">
          {{ Math.round(zoomLevel * 100) }}%
        </div>

        <Tooltip>
          <TooltipTrigger as-child>
            <button class="control-button" @click="emit('zoomIn')">
              <i class="pi pi-plus" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Acercar</TooltipContent>
        </Tooltip>

        <div class="controls-divider" />

        <!-- Fit view -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button class="control-button" @click="emit('fitView')">
              <i class="pi pi-expand" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Ajustar vista</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>

<style scoped>
.n8n-bottom-controls {
  position: absolute;
  bottom: 56px;
  left: 16px;
  z-index: 10;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: rgba(12, 29, 61, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.control-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s;
}

.control-button i {
  font-size: 14px;
}

.control-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.control-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.controls-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

.zoom-indicator {
  min-width: 44px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}
</style>
