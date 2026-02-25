<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] glass-card border-white/20 dark:border-white/10">
      <DialogHeader>
        <DialogTitle>Importar Configuraciones</DialogTitle>
        <DialogDescription>
          Importa configuraciones de respuesta desde un archivo JSON exportado.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-4">
        <!-- File Input -->
        <div class="flex flex-col gap-1.5">
          <Label for="import-file">Archivo JSON</Label>
          <label
            for="import-file"
            class="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 dark:border-white/10 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-colors"
          >
            <i class="pi pi-upload text-muted-foreground" />
            <span class="text-sm text-muted-foreground">
              {{ importFile ? importFile.name : 'Seleccionar archivo' }}
            </span>
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            class="hidden"
            @change="onNativeFileSelect"
          />
          <p class="text-xs text-muted-foreground">Formato: archivo JSON exportado desde esta pagina</p>
        </div>

        <!-- Preview -->
        <div v-if="importPreview.length > 0">
          <h4 class="text-sm font-medium text-foreground mb-2">
            Vista previa ({{ importPreview.length }} configuraciones)
          </h4>
          <Card class="glass-card overflow-hidden">
            <CardContent class="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intent Key</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Critico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(item, idx) in importPreviewPaginated" :key="idx">
                    <TableCell class="text-sm font-mono">{{ item.intent_key }}</TableCell>
                    <TableCell class="text-sm">{{ item.display_name || '-' }}</TableCell>
                    <TableCell>
                      <Badge :variant="item.is_critical ? 'destructive' : 'secondary'">
                        {{ item.is_critical ? 'Si' : 'No' }}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p v-if="importPreview.length > 5" class="text-xs text-muted-foreground mt-1">
            Mostrando primeros 5 de {{ importPreview.length }}
          </p>
        </div>

        <!-- Import Results -->
        <div v-if="lastImportResult">
          <Alert :variant="lastImportResult.success ? 'default' : 'destructive'">
            <AlertDescription>
              <div>
                <strong>{{ lastImportResult.created }}</strong> configuraciones importadas,
                <strong>{{ lastImportResult.skipped }}</strong> omitidas
              </div>
              <div v-if="lastImportResult.errors?.length" class="mt-2">
                <span class="text-xs font-medium">Errores:</span>
                <ul class="list-disc pl-4 mt-1 text-xs">
                  <li v-for="(error, idx) in lastImportResult.errors" :key="idx">{{ error }}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="ghost" @click="$emit('cancel')">Cancelar</Button>
        <Button
          @click="$emit('import')"
          :disabled="importing || importPreview.length === 0"
        >
          <i v-if="importing" class="pi pi-spin pi-spinner mr-2" />
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
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ResponseConfigCreate, BulkImportResponse } from '@/types/responseConfigs.types'

const props = defineProps<{
  open: boolean
  importing: boolean
  importFile: File | null
  importPreview: Omit<ResponseConfigCreate, 'organization_id' | 'domain_key'>[]
  lastImportResult: BulkImportResponse | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'fileSelect', file: File): void
  (e: 'import'): void
  (e: 'cancel'): void
}>()

const importPreviewPaginated = computed(() => props.importPreview.slice(0, 5))

function onNativeFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  if (file) {
    emit('fileSelect', file)
  }
  target.value = ''
}
</script>
