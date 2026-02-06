<script setup lang="ts">
import Button from 'primevue/button'
import type { WorkflowDefinition } from '@/types/workflow.types'

defineProps<{
  currentWorkflow: WorkflowDefinition | null
  isDirty: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'newWorkflow'): void
  (e: 'save'): void
  (e: 'publish'): void
  (e: 'copyFromInstitution'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Editor de Workflows</h1>
      <p class="text-gray-500 mt-1">Diseña flujos de conversación visuales para tus instituciones</p>
    </div>
    <div class="flex gap-2 items-center">
      <Button
        v-if="currentWorkflow"
        label="Guardar"
        icon="pi pi-save"
        severity="success"
        :loading="isSaving"
        :disabled="!isDirty"
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
        v-if="currentWorkflow"
        label="Eliminar"
        icon="pi pi-trash"
        severity="danger"
        outlined
        @click="emit('delete')"
      />
      <Button
        label="Copiar de Otra Institucion"
        icon="pi pi-copy"
        severity="secondary"
        @click="emit('copyFromInstitution')"
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
