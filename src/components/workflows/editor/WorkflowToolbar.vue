<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { useWorkflowLayout } from '@/composables/useWorkflowLayout'

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
const layoutMenu = ref<InstanceType<typeof Menu> | null>(null)
const layoutMenuItems = ref([
  {
    label: 'Vertical (arriba a abajo)',
    icon: 'pi pi-arrow-down',
    command: () => layoutTopToBottom()
  },
  {
    label: 'Horizontal (izquierda a derecha)',
    icon: 'pi pi-arrow-right',
    command: () => layoutLeftToRight()
  }
])
</script>

<template>
  <div class="workflow-toolbar">
    <div class="toolbar-content">
      <!-- History buttons (Undo/Redo) -->
      <div class="toolbar-group">
        <Button
          icon="pi pi-undo"
          severity="secondary"
          text
          size="small"
          :disabled="!canUndo"
          title="Deshacer (Ctrl+Z)"
          @click="emit('undo')"
        />
        <Button
          icon="pi pi-replay"
          severity="secondary"
          text
          size="small"
          :disabled="!canRedo"
          title="Rehacer (Ctrl+Y)"
          @click="emit('redo')"
        />
      </div>

      <span class="toolbar-divider"></span>

      <!-- Clipboard buttons (Copy/Paste/Cut/Duplicate) -->
      <div class="toolbar-group">
        <Button
          icon="pi pi-copy"
          severity="secondary"
          text
          size="small"
          :disabled="!hasSelection"
          title="Copiar (Ctrl+C)"
          @click="emit('copy')"
        />
        <Button
          icon="pi pi-clipboard"
          severity="secondary"
          text
          size="small"
          :disabled="!hasClipboard"
          title="Pegar (Ctrl+V)"
          @click="emit('paste')"
        />
        <Button
          icon="pi pi-file-export"
          severity="secondary"
          text
          size="small"
          :disabled="!hasSelection"
          title="Cortar (Ctrl+X)"
          @click="emit('cut')"
        />
        <Button
          icon="pi pi-clone"
          severity="secondary"
          text
          size="small"
          :disabled="!hasSelection"
          title="Duplicar (Ctrl+D)"
          @click="emit('duplicate')"
        />
      </div>

      <span class="toolbar-divider"></span>

      <!-- Delete & Search -->
      <div class="toolbar-group">
        <Button
          icon="pi pi-trash"
          severity="secondary"
          text
          size="small"
          :disabled="!hasSelection"
          title="Eliminar (Del)"
          @click="emit('delete')"
        />
        <Button
          icon="pi pi-search"
          severity="secondary"
          text
          size="small"
          title="Buscar (Ctrl+F)"
          @click="emit('search')"
        />
      </div>

      <span class="toolbar-divider"></span>

      <!-- Export/Import buttons -->
      <div class="toolbar-group">
        <Button
          icon="pi pi-download"
          severity="secondary"
          text
          size="small"
          :loading="isExporting"
          title="Exportar workflow"
          @click="emit('export')"
        />
        <Button
          icon="pi pi-upload"
          severity="secondary"
          text
          size="small"
          :loading="isImporting"
          title="Importar workflow"
          @click="emit('triggerImport')"
        />
      </div>

      <span class="toolbar-divider"></span>

      <!-- View tools -->
      <div class="toolbar-group">
        <Button
          icon="pi pi-th-large"
          severity="secondary"
          text
          size="small"
          :loading="isLayouting"
          title="Auto-Layout"
          @click="(e) => layoutMenu?.toggle(e)"
        />
        <Menu ref="layoutMenu" :model="layoutMenuItems" :popup="true" />

        <Button
          icon="pi pi-bookmark"
          severity="secondary"
          text
          size="small"
          title="Agregar nota"
          @click="emit('addAnnotation')"
        />
      </div>

      <span class="toolbar-divider"></span>

      <!-- Simulation toggle button -->
      <div class="toolbar-group">
        <Button
          :icon="isSimulating ? 'pi pi-stop' : 'pi pi-play'"
          :severity="isSimulating ? 'warn' : 'secondary'"
          text
          size="small"
          :title="isSimulating ? 'Simulación activa' : 'Simular workflow'"
          @click="emit('update:showSimulationPanel', !showSimulationPanel)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-toolbar {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
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
  background-color: #e2e8f0;
  margin: 0 0.5rem;
}

/* Make buttons smaller and more compact */
:deep(.p-button.p-button-sm) {
  padding: 0.375rem 0.5rem;
}

:deep(.p-button.p-button-text.p-button-sm) {
  padding: 0.375rem;
}
</style>

<!-- Global dark mode styles (unscoped) -->
<style>
/* Workflow Toolbar - Dark Mode */
.dark-mode .workflow-toolbar {
  background-color: var(--aynux-navy-800) !important;
  border-bottom-color: var(--aynux-navy-700) !important;
}

.dark-mode .workflow-toolbar .toolbar-divider {
  background-color: var(--aynux-navy-600) !important;
}
</style>
