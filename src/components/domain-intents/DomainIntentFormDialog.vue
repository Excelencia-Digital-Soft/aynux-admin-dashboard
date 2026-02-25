<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px] glass-card">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          Formulario para crear o editar un intent del dominio
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label for="intent_key">Intent Key *</Label>
          <Input
            id="intent_key"
            :model-value="formData.intent_key"
            :disabled="isEditing"
            placeholder="ej: check_stock, request_price"
            @update:model-value="formData.intent_key = String($event)"
          />
          <p class="text-xs text-muted-foreground">Identificador unico del intent (snake_case)</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="name">Nombre *</Label>
          <Input
            id="name"
            :model-value="formData.name"
            placeholder="ej: Consulta de Stock"
            @update:model-value="formData.name = String($event)"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="description">Descripcion</Label>
          <Textarea
            id="description"
            :model-value="formData.description ?? ''"
            :rows="3"
            placeholder="Descripcion del intent y cuando se activa"
            @update:model-value="formData.description = $event || null"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <Label for="weight">Peso</Label>
            <Input
              id="weight"
              :model-value="formData.weight"
              type="number"
              :min="0"
              :max="9.99"
              step="0.01"
              @update:model-value="formData.weight = Number($event)"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="priority">Prioridad</Label>
            <Input
              id="priority"
              :model-value="formData.priority"
              type="number"
              :min="0"
              :max="100"
              @update:model-value="formData.priority = Number($event)"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center gap-2">
            <Checkbox
              id="is_enabled"
              :checked="formData.is_enabled"
              @update:checked="formData.is_enabled = $event"
            />
            <Label for="is_enabled" class="cursor-pointer">Activo</Label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              id="exact_match"
              :checked="formData.exact_match"
              @update:checked="formData.exact_match = $event"
            />
            <Label for="exact_match" class="cursor-pointer">Match Exacto</Label>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="$emit('cancel')">Cancelar</Button>
        <Button :disabled="saving" @click="$emit('save')">
          <i v-if="saving" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ submitLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

defineProps<{
  open: boolean
  saving: boolean
  formData: {
    intent_key: string
    name: string
    description?: string | null
    weight?: number
    priority?: number
    is_enabled: boolean
    exact_match: boolean
  }
  isEditing: boolean
  dialogTitle: string
  submitLabel: string
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()
</script>
