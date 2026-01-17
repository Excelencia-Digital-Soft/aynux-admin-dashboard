<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { useWorkflowLayout } from '@/composables/useWorkflowLayout'
import type { WorkflowDefinition } from '@/types/workflow.types'

const props = defineProps<{
  currentWorkflow: WorkflowDefinition | null
  isExporting: boolean
  isImporting: boolean
  isSimulating: boolean
  isSaving: boolean
  isDirty: boolean
  showSimulationPanel: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showWorkflowDialog', value: boolean): void
  (e: 'update:showSimulationPanel', value: boolean): void
  (e: 'export'): void
  (e: 'triggerImport'): void
  (e: 'addAnnotation'): void
  (e: 'save'): void
  (e: 'publish'): void
  (e: 'newWorkflow'): void
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
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Editor de Workflows</h1>
      <p class="text-gray-500 mt-1">Diseña flujos de conversación visuales para tus instituciones</p>
    </div>
    <div class="flex gap-2">
      <!-- Export/Import buttons -->
      <Button
        v-if="currentWorkflow"
        icon="pi pi-download"
        severity="secondary"
        text
        :loading="isExporting"
        title="Exportar workflow"
        @click="emit('export')"
      />
      <Button
        v-if="currentWorkflow"
        icon="pi pi-upload"
        severity="secondary"
        text
        :loading="isImporting"
        title="Importar workflow"
        @click="emit('triggerImport')"
      />
      
      <!-- Auto-Layout button -->
      <Button
        v-if="currentWorkflow"
        icon="pi pi-th-large"
        severity="secondary"
        text
        :loading="isLayouting"
        title="Auto-Layout"
        @click="(e) => layoutMenu?.toggle(e)"
      />
      <Menu ref="layoutMenu" :model="layoutMenuItems" :popup="true" />
      
      <!-- Add annotation button -->
      <Button
        v-if="currentWorkflow"
        icon="pi pi-bookmark"
        severity="secondary"
        text
        title="Agregar nota"
        @click="emit('addAnnotation')"
      />
      
      <!-- Simulation toggle button -->
      <Button
        v-if="currentWorkflow"
        :icon="isSimulating ? 'pi pi-stop' : 'pi pi-play'"
        :severity="isSimulating ? 'warn' : 'secondary'"
        text
        :title="isSimulating ? 'Simulación activa' : 'Simular workflow'"
        @click="emit('update:showSimulationPanel', !showSimulationPanel)"
      />
      
      <!-- Save/Publish/New -->
      <Button
        v-if="currentWorkflow && isDirty"
        label="Guardar"
        icon="pi pi-save"
        severity="success"
        :loading="isSaving"
        @click="emit('save')"
      />
      <Button
        v-if="currentWorkflow?.is_draft"
        label="Publicar"
        icon="pi pi-check-circle"
        severity="info"
        :loading="isSaving"
        @click="emit('publish')"
      />
      <Button
        label="Nuevo Workflow"
        icon="pi pi-plus"
        severity="primary"
        @click="emit('newWorkflow')"
      />
    </div>
  </div>
</template>
