<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[450px] glass-card border-white/20 dark:border-white/10">
      <DialogHeader>
        <DialogTitle>Sembrar Configuraciones por Defecto</DialogTitle>
        <DialogDescription>
          Crea configuraciones de respuesta predefinidas para el dominio seleccionado.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-4">
        <p class="text-sm text-foreground">
          Esto creara las configuraciones de respuesta predefinidas para el dominio
          <strong>{{ domainName }}</strong>.
        </p>

        <div class="flex items-center gap-2">
          <Checkbox
            id="seedOverwrite"
            :checked="seedOverwrite"
            @update:checked="$emit('update:seedOverwrite', $event as boolean)"
          />
          <Label for="seedOverwrite" class="cursor-pointer font-normal">
            Sobrescribir configuraciones existentes
          </Label>
        </div>

        <Alert v-if="seedOverwrite" variant="destructive">
          <i class="pi pi-exclamation-triangle" />
          <AlertDescription>
            Las configuraciones existentes con los mismos intents seran eliminadas primero.
          </AlertDescription>
        </Alert>

        <!-- Seed Results -->
        <div v-if="lastSeedResult">
          <Alert :variant="lastSeedResult.success ? 'default' : 'destructive'">
            <AlertDescription>
              <div>
                <strong>{{ lastSeedResult.added }}</strong> configuraciones creadas,
                <strong>{{ lastSeedResult.skipped }}</strong> omitidas
              </div>
              <div v-if="lastSeedResult.errors?.length" class="mt-2">
                <span class="text-xs font-medium">Errores:</span>
                <ul class="list-disc pl-4 mt-1 text-xs">
                  <li v-for="(error, idx) in lastSeedResult.errors" :key="idx">{{ error }}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="ghost" @click="$emit('cancel')">Cancelar</Button>
        <Button @click="$emit('seed')" :disabled="seedingConfigs">
          <i v-if="seedingConfigs" class="pi pi-spin pi-spinner mr-2" />
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
import type { SeedResponse } from '@/types/responseConfigs.types'

defineProps<{
  open: boolean
  domainName: string
  seedOverwrite: boolean
  seedingConfigs: boolean
  lastSeedResult: SeedResponse | null
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:seedOverwrite', value: boolean): void
  (e: 'seed'): void
  (e: 'cancel'): void
}>()
</script>
