<script lang="ts">
/**
 * WorkflowNodeContextMenu - n8n-style right-click context menu for nodes
 *
 * Features:
 * - Opens on right-click with absolute positioning
 * - Standard n8n menu options with keyboard shortcuts
 * - Click outside to close
 */
export interface ContextMenuPosition {
  x: number
  y: number
}
</script>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Separator } from '@/components/ui/separator'

const props = defineProps<{
  visible: boolean
  position: ContextMenuPosition | null
  nodeId: string | null
  nodeName: string
  isActive: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'open'): void
  (e: 'execute'): void
  (e: 'rename'): void
  (e: 'toggleActive'): void
  (e: 'pin'): void
  (e: 'copy'): void
  (e: 'duplicate'): void
  (e: 'tidyUp'): void
  (e: 'selectAll'): void
  (e: 'clearSelection'): void
  (e: 'delete'): void
}>()

const menuRef = ref<HTMLElement | null>(null)

// Adjusted position to keep menu within viewport
const adjustedPosition = computed(() => {
  if (!props.position) return { left: '0px', top: '0px' }

  const menuWidth = 220
  const menuHeight = 380
  const padding = 16

  let x = props.position.x
  let y = props.position.y

  // Adjust for viewport boundaries
  if (x + menuWidth > window.innerWidth - padding) {
    x = window.innerWidth - menuWidth - padding
  }
  if (y + menuHeight > window.innerHeight - padding) {
    y = window.innerHeight - menuHeight - padding
  }
  if (x < padding) x = padding
  if (y < padding) y = padding

  return {
    left: `${x}px`,
    top: `${y}px`
  }
})

// Close on click outside
function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('update:visible', false)
  }
}

// Close on escape
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('update:visible', false)
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    // Add listeners when menu opens
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }, 0)
  } else {
    // Remove listeners when menu closes
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

// Menu item handlers
function handleOpen() {
  emit('open')
  emit('update:visible', false)
}

function handleExecute() {
  emit('execute')
  emit('update:visible', false)
}

function handleRename() {
  emit('rename')
  emit('update:visible', false)
}

function handleToggleActive() {
  emit('toggleActive')
  emit('update:visible', false)
}

function handlePin() {
  emit('pin')
  emit('update:visible', false)
}

function handleCopy() {
  emit('copy')
  emit('update:visible', false)
}

function handleDuplicate() {
  emit('duplicate')
  emit('update:visible', false)
}

function handleTidyUp() {
  emit('tidyUp')
  emit('update:visible', false)
}

function handleSelectAll() {
  emit('selectAll')
  emit('update:visible', false)
}

function handleClearSelection() {
  emit('clearSelection')
  emit('update:visible', false)
}

function handleDelete() {
  emit('delete')
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible && position"
        ref="menuRef"
        class="context-menu"
        :style="adjustedPosition"
        @contextmenu.prevent
      >
        <!-- Node name header -->
        <div class="menu-header">
          <span class="menu-header-text">{{ nodeName }}</span>
        </div>

        <Separator class="my-1" />

        <!-- Main actions -->
        <button class="menu-item" @click="handleOpen">
          <i class="pi pi-external-link" />
          <span>Abrir...</span>
          <span class="shortcut">Enter</span>
        </button>

        <button class="menu-item" @click="handleExecute">
          <i class="pi pi-play" />
          <span>Ejecutar paso</span>
        </button>

        <Separator class="my-1" />

        <button class="menu-item" @click="handleRename">
          <i class="pi pi-pencil" />
          <span>Renombrar</span>
          <span class="shortcut">Space</span>
        </button>

        <button class="menu-item" @click="handleToggleActive">
          <i :class="isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          <span>{{ isActive ? 'Desactivar' : 'Activar' }}</span>
          <span class="shortcut">D</span>
        </button>

        <button class="menu-item" @click="handlePin">
          <i class="pi pi-thumbtack" />
          <span>Fijar datos</span>
          <span class="shortcut">P</span>
        </button>

        <Separator class="my-1" />

        <button class="menu-item" @click="handleCopy">
          <i class="pi pi-copy" />
          <span>Copiar</span>
          <span class="shortcut">Cmd+C</span>
        </button>

        <button class="menu-item" @click="handleDuplicate">
          <i class="pi pi-clone" />
          <span>Duplicar</span>
          <span class="shortcut">Cmd+D</span>
        </button>

        <Separator class="my-1" />

        <button class="menu-item" @click="handleTidyUp">
          <i class="pi pi-objects-column" />
          <span>Organizar workflow</span>
          <span class="shortcut">Shift+Alt+T</span>
        </button>

        <Separator class="my-1" />

        <button class="menu-item" @click="handleSelectAll">
          <i class="pi pi-check-square" />
          <span>Seleccionar todos</span>
          <span class="shortcut">Cmd+A</span>
        </button>

        <button class="menu-item" @click="handleClearSelection">
          <i class="pi pi-times" />
          <span>Limpiar seleccion</span>
        </button>

        <Separator class="my-1" />

        <button class="menu-item menu-item--danger" @click="handleDelete">
          <i class="pi pi-trash" />
          <span>Eliminar</span>
          <span class="shortcut">Del</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  /* Solid dark background with glassmorphism effect */
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 4px;
  box-shadow:
    0 10px 38px -10px rgba(0, 0, 0, 0.5),
    0 10px 20px -15px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 0, 0, 0.3);
}

.menu-header {
  padding: 8px 12px;
}

.menu-header-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground, hsl(215 20.2% 65.1%));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--popover-foreground, hsl(210 40% 98%));
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
}

.menu-item:hover {
  background: var(--accent, hsl(217.2 32.6% 17.5%));
}

.menu-item i {
  width: 16px;
  font-size: 0.875rem;
  opacity: 0.7;
}

.menu-item span:first-of-type {
  flex: 1;
}

.shortcut {
  font-size: 0.75rem;
  color: var(--muted-foreground, hsl(215 20.2% 65.1%));
  opacity: 0.7;
}

.menu-item--danger {
  color: hsl(0 84.2% 60.2%);
}

.menu-item--danger:hover {
  background: hsl(0 84.2% 60.2% / 0.15);
}

/* Animation */
.context-menu-enter-active,
.context-menu-leave-active {
  transition: all 0.15s ease;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
