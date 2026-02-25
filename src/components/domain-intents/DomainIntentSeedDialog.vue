<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[450px] glass-card">
      <DialogHeader>
        <DialogTitle>Sembrar Intents por Defecto</DialogTitle>
        <DialogDescription>
          Crear intents predefinidos para el dominio seleccionado.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-foreground">
          Esto creara los intents predefinidos para el dominio
          <strong>{{ domainName }}</strong>.
        </p>

        <div class="flex items-center gap-2">
          <Checkbox
            id="seedOverwrite"
            :checked="seedOverwrite"
            @update:checked="$emit('update:seedOverwrite', $event as boolean)"
          />
          <Label for="seedOverwrite" class="cursor-pointer">Sobrescribir intents existentes</Label>
        </div>

        <Alert v-if="seedOverwrite" variant="destructive">
          <i class="pi pi-exclamation-triangle" />
          <AlertDescription>
            Los intents existentes con las mismas claves seran reemplazados.
          </AlertDescription>
        </Alert>

        <div v-if="lastSeedResult">
          <Alert :variant="lastSeedResult.success ? 'default' : 'destructive'">
            <AlertDescription>
              <strong>{{ lastSeedResult.added }}</strong> intents creados,
              <strong>{{ lastSeedResult.skipped }}</strong> omitidos
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="$emit('cancel')">Cancelar</Button>
        <Button :disabled="seedingIntents" @click="$emit('seed')">
          <i v-if="seedingIntents" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-database mr-2" />
          Sembrar
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SeedResponse } from '@/types/domainIntents.types'

defineProps<{
  open: boolean
  domainName: string
  seedOverwrite: boolean
  seedingIntents: boolean
  lastSeedResult: SeedResponse | null
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:seedOverwrite', value: boolean): void
  (e: 'seed'): void
  (e: 'cancel'): void
}>()
</script>
