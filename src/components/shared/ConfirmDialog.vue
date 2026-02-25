<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { useConfirmDialog } from '@/composables/useConfirmDialog'

const { visible, options, handleConfirm, handleCancel } = useConfirmDialog()
</script>

<template>
  <AlertDialog :open="visible" @update:open="(v: boolean) => { if (!v) handleCancel() }">
    <AlertDialogContent class="glass-dialog">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ options.title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ options.message }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancel">{{ options.cancelLabel }}</AlertDialogCancel>
        <AlertDialogAction
          :class="options.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
          @click="handleConfirm"
        >
          {{ options.confirmLabel }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
