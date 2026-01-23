<script setup lang="ts">
import { ref } from 'vue'
import { useWorkflowLayout } from '@/composables/useWorkflowLayout'

// shadcn-vue components
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

defineProps<{
  canUndo: boolean
  canRedo: boolean
  hasClipboard: boolean
  hasSelection: boolean
  isExporting: boolean
  isImporting: boolean
  isSimulating: boolean
  showSimulationPanel: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showSimulationPanel', value: boolean): void
  (e: 'export'): void
  (e: 'triggerImport'): void
  (e: 'addAnnotation'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'copy'): void
  (e: 'paste'): void
  (e: 'cut'): void
  (e: 'duplicate'): void
  (e: 'delete'): void
  (e: 'search'): void
}>()

// Layout logic
const { layoutTopToBottom, layoutLeftToRight, isLayouting } = useWorkflowLayout()
const showLayoutMenu = ref(false)
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div class="workflow-toolbar">
      <div class="toolbar-content">
        <!-- History buttons (Undo/Redo) -->
        <div class="toolbar-group">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!canUndo"
                @click="emit('undo')"
              >
                <i class="pi pi-undo text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!canRedo"
                @click="emit('redo')"
              >
                <i class="pi pi-replay text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <span class="toolbar-divider" />

        <!-- Clipboard buttons (Copy/Paste/Cut/Duplicate) -->
        <div class="toolbar-group">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!hasSelection"
                @click="emit('copy')"
              >
                <i class="pi pi-copy text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar (Ctrl+C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!hasClipboard"
                @click="emit('paste')"
              >
                <i class="pi pi-clipboard text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pegar (Ctrl+V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!hasSelection"
                @click="emit('cut')"
              >
                <i class="pi pi-file-export text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cortar (Ctrl+X)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!hasSelection"
                @click="emit('duplicate')"
              >
                <i class="pi pi-clone text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicar (Ctrl+D)</TooltipContent>
          </Tooltip>
        </div>

        <span class="toolbar-divider" />

        <!-- Delete & Search -->
        <div class="toolbar-group">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="!hasSelection"
                @click="emit('delete')"
              >
                <i class="pi pi-trash text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar (Del)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="emit('search')"
              >
                <i class="pi pi-search text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar (Ctrl+F)</TooltipContent>
          </Tooltip>
        </div>

        <span class="toolbar-divider" />

        <!-- Export/Import buttons -->
        <div class="toolbar-group">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="isExporting"
                @click="emit('export')"
              >
                <i v-if="!isExporting" class="pi pi-download text-sm" />
                <i v-else class="pi pi-spin pi-spinner text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar workflow</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :disabled="isImporting"
                @click="emit('triggerImport')"
              >
                <i v-if="!isImporting" class="pi pi-upload text-sm" />
                <i v-else class="pi pi-spin pi-spinner text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar workflow</TooltipContent>
          </Tooltip>
        </div>

        <span class="toolbar-divider" />

        <!-- View tools -->
        <div class="toolbar-group">
          <DropdownMenu v-model:open="showLayoutMenu">
            <Tooltip>
              <TooltipTrigger as-child>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    :disabled="isLayouting"
                  >
                    <i v-if="!isLayouting" class="pi pi-th-large text-sm" />
                    <i v-else class="pi pi-spin pi-spinner text-sm" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent v-if="!showLayoutMenu">Auto-Layout</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem @click="layoutTopToBottom">
                <i class="pi pi-arrow-down mr-2" />
                Vertical (arriba a abajo)
              </DropdownMenuItem>
              <DropdownMenuItem @click="layoutLeftToRight">
                <i class="pi pi-arrow-right mr-2" />
                Horizontal (izquierda a derecha)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="emit('addAnnotation')"
              >
                <i class="pi pi-bookmark text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Agregar nota</TooltipContent>
          </Tooltip>
        </div>

        <span class="toolbar-divider" />

        <!-- Simulation toggle button -->
        <div class="toolbar-group">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :variant="isSimulating ? 'default' : 'ghost'"
                size="icon"
                class="h-8 w-8"
                :class="isSimulating ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''"
                @click="emit('update:showSimulationPanel', !showSimulationPanel)"
              >
                <i :class="isSimulating ? 'pi pi-stop' : 'pi pi-play'" class="text-sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ isSimulating ? 'Simulacion activa' : 'Simular workflow' }}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>

<style scoped>
.workflow-toolbar {
  background-color: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}

.toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background-color: hsl(var(--border));
  margin: 0 0.5rem;
}
</style>
