<script setup lang="ts">
/**
 * WorkflowDeleteDialogs - Delete confirmation dialogs
 *
 * Single responsibility: Render delete confirmation dialogs
 * for nodes, transitions, and workflows.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

defineProps<{
  // Node deletion
  showDeleteNodeDialog: boolean
  nodeToDeleteLabel?: string

  // Transition deletion
  showDeleteTransitionDialog: boolean

  // Workflow deletion
  showDeleteWorkflowDialog: boolean
  workflowToDeleteName?: string
}>()

const emit = defineEmits<{
  (e: 'update:showDeleteNodeDialog', value: boolean): void
  (e: 'confirmDeleteNode'): void
  (e: 'cancelDeleteNode'): void

  (e: 'update:showDeleteTransitionDialog', value: boolean): void
  (e: 'confirmDeleteTransition'): void
  (e: 'cancelDeleteTransition'): void

  (e: 'update:showDeleteWorkflowDialog', value: boolean): void
  (e: 'confirmDeleteWorkflow'): void
  (e: 'cancelDeleteWorkflow'): void
}>()
</script>

<template>
  <!-- Delete Node Dialog -->
  <AlertDialog
    :open="showDeleteNodeDialog"
    @update:open="(val: boolean) => !val && emit('cancelDeleteNode')"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
        <AlertDialogDescription>
          ¿Estás seguro de eliminar el nodo "{{ nodeToDeleteLabel }}"?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('cancelDeleteNode')">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground"
          @click="emit('confirmDeleteNode')"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Delete Transition Dialog -->
  <AlertDialog
    :open="showDeleteTransitionDialog"
    @update:open="(val: boolean) => !val && emit('cancelDeleteTransition')"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
        <AlertDialogDescription>
          ¿Estás seguro de eliminar esta transición?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('cancelDeleteTransition')">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground"
          @click="emit('confirmDeleteTransition')"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Delete Workflow Dialog -->
  <AlertDialog
    :open="showDeleteWorkflowDialog"
    @update:open="(val: boolean) => !val && emit('cancelDeleteWorkflow')"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Eliminar Workflow</AlertDialogTitle>
        <AlertDialogDescription>
          ¿Estás seguro de eliminar el workflow "{{ workflowToDeleteName }}"?
          Se eliminarán todos los nodos y transiciones asociados.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('cancelDeleteWorkflow')">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground"
          @click="emit('confirmDeleteWorkflow')"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
