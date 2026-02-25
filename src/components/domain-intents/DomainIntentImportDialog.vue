<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] glass-card">
      <DialogHeader>
        <DialogTitle>Importar Intents</DialogTitle>
        <DialogDescription>
          Importar intents desde un archivo JSON exportado.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label>Archivo JSON</Label>
          <label
            class="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <i class="pi pi-upload text-muted-foreground" />
            <span class="text-sm text-muted-foreground">
              {{ importFile ? importFile.name : 'Seleccionar archivo' }}
            </span>
            <input
              type="file"
              accept=".json"
              class="hidden"
              @change="onFileSelect"
            />
          </label>
          <p class="text-xs text-muted-foreground">Formato: archivo JSON exportado desde esta pagina</p>
        </div>

        <!-- Import Preview -->
        <div v-if="importPreview.length > 0">
          <h4 class="text-sm text-muted-foreground mb-2">
            Vista previa ({{ importPreview.length }} intents)
          </h4>
          <div class="rounded-md border border-border overflow-hidden max-h-[200px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead class="w-[80px]">Prioridad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in importPreviewPaginated" :key="item.intent_key">
                  <TableCell class="text-sm font-mono">{{ item.intent_key }}</TableCell>
                  <TableCell class="text-sm">{{ item.name }}</TableCell>
                  <TableCell class="text-sm">{{ item.priority }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div v-if="lastImportResult">
          <Alert :variant="lastImportResult.success ? 'default' : 'destructive'">
            <AlertDescription>
              <strong>{{ lastImportResult.created }}</strong> intents importados,
              <strong>{{ lastImportResult.skipped }}</strong> omitidos
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="$emit('cancel')">Cancelar</Button>
        <Button
          :disabled="importing || importPreview.length === 0"
          @click="$emit('import')"
        >
          <i v-if="importing" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-upload mr-2" />
          Importar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { IntentCreate, BulkImportResponse } from '@/types/domainIntents.types'

const props = defineProps<{
  open: boolean
  importing: boolean
  importFile: File | null
  importPreview: IntentCreate[]
  lastImportResult: BulkImportResponse | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'fileSelect', file: File): void
  (e: 'import'): void
  (e: 'cancel'): void
}>()

const importPreviewPaginated = computed(() => props.importPreview.slice(0, 10))

function onFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  if (file) {
    emit('fileSelect', file)
  }
  target.value = ''
}
</script>
