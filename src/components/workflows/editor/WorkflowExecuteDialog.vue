<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  visible: boolean
  isExecuting: boolean
  institutionConfigId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'execute', payload: { test_input: string; domain_key: string }): void
}>()

const testInput = ref('')
const domainKey = ref('pharmacy')

const canExecute = computed(() => testInput.value.trim().length > 0 && !props.isExecuting)

function handleExecute() {
  if (!canExecute.value) return
  emit('execute', {
    test_input: testInput.value.trim(),
    domain_key: domainKey.value
  })
}

function handleClose(open: boolean) {
  if (!props.isExecuting) {
    emit('update:visible', open)
  }
}
</script>

<template>
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Ejecutar Workflow</DialogTitle>
        <DialogDescription>
          Ingresa un mensaje de prueba para ejecutar el workflow con datos reales.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="domain-key">Dominio</Label>
          <Input
            id="domain-key"
            v-model="domainKey"
            placeholder="pharmacy"
          />
        </div>

        <div class="space-y-2">
          <Label for="test-input">Mensaje de prueba</Label>
          <Textarea
            id="test-input"
            v-model="testInput"
            :rows="3"
            placeholder="Escribe el mensaje que enviaria el usuario..."
            class="resize-none"
            @keydown.ctrl.enter="handleExecute"
          />
          <p class="text-xs text-muted-foreground">
            Ctrl+Enter para ejecutar
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          :disabled="isExecuting"
          @click="emit('update:visible', false)"
        >
          Cancelar
        </Button>
        <Button
          :disabled="!canExecute"
          @click="handleExecute"
        >
          <i :class="['pi mr-2', isExecuting ? 'pi-spin pi-spinner' : 'pi-play']" />
          {{ isExecuting ? 'Ejecutando...' : 'Ejecutar' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
