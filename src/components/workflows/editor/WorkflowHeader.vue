<script setup lang="ts">
import { Button } from '@/components/ui/button'
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
  <div class="flex items-center justify-between mb-6 glass-panel p-4 rounded-xl">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Editor de Workflows</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Diseña flujos de conversación visuales para tus instituciones
      </p>
    </div>
    <div class="flex gap-2 items-center">
      <Button
        v-if="currentWorkflow"
        class="bg-green-600 hover:bg-green-700 text-white"
        :disabled="!isDirty || isSaving"
        @click="emit('save')"
      >
        <i v-if="isSaving" class="pi pi-spin pi-spinner mr-2" />
        <i v-else class="pi pi-save mr-2" />
        Guardar
      </Button>
      <Button
        v-if="currentWorkflow?.is_draft"
        variant="secondary"
        :disabled="isSaving"
        @click="emit('publish')"
      >
        <i v-if="isSaving" class="pi pi-spin pi-spinner mr-2" />
        <i v-else class="pi pi-check-circle mr-2" />
        Publicar
      </Button>
      <Button
        v-if="currentWorkflow"
        variant="outline"
        class="border-destructive text-destructive hover:bg-destructive/10"
        @click="emit('delete')"
      >
        <i class="pi pi-trash mr-2" />
        Eliminar
      </Button>
      <Button
        variant="secondary"
        @click="emit('copyFromInstitution')"
      >
        <i class="pi pi-copy mr-2" />
        Copiar de Otra Institucion
      </Button>
      <Button @click="emit('newWorkflow')">
        <i class="pi pi-plus mr-2" />
        Nuevo Workflow
      </Button>
    </div>
  </div>
</template>
