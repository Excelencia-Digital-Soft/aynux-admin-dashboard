<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useKnowledge } from '@/composables/useKnowledge'
import { useToast } from '@/composables/useToast'
import { getTypeOptions } from '@/utils/constants'
import type { DocumentContext, Document } from '@/types/document.types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface Props {
  context?: DocumentContext
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global'
})

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const store = useKnowledgeStore()
const toast = useToast()
const {
  documents,
  isLoading,
  fetchDocuments,
  batchUpdate,
  batchDelete,
  batchRegenerateEmbeddings
} = useKnowledge()

const selectedIds = ref<Set<string>>(new Set())
const showBatchDialog = ref(false)
const batchOperation = ref<'update' | 'delete' | 'activate' | 'deactivate' | 'regenerate'>('update')
const isProcessing = ref(false)
const progress = ref(0)

// Batch update fields
const updateCategory = ref('')
const updateType = ref('')
const updateTags = ref('')
const applyCategory = ref(false)
const applyType = ref(false)
const applyTags = ref(false)

const typeOptions = computed(() => [
  { value: '', label: 'Sin cambios' },
  ...getTypeOptions(props.context)
])

const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => documents.value.length > 0 && selectedIds.value.size === documents.value.length)

const operationOptions = [
  { value: 'update', label: 'Actualizar campos', icon: 'pi pi-pencil' },
  { value: 'activate', label: 'Activar documentos', icon: 'pi pi-check' },
  { value: 'deactivate', label: 'Desactivar documentos', icon: 'pi pi-times' },
  { value: 'regenerate', label: 'Regenerar embeddings', icon: 'pi pi-refresh' },
  { value: 'delete', label: 'Eliminar documentos', icon: 'pi pi-trash' }
]

function toggleSelection(docId: string) {
  if (selectedIds.value.has(docId)) {
    selectedIds.value.delete(docId)
  } else {
    selectedIds.value.add(docId)
  }
  // Force reactivity
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(documents.value.map(d => d.id))
  }
}

function openBatchDialog() {
  if (selectedIds.value.size === 0) {
    toast.warn('Selecciona al menos un documento')
    return
  }
  showBatchDialog.value = true
}

function closeBatchDialog() {
  showBatchDialog.value = false
  resetBatchFields()
}

function resetBatchFields() {
  updateCategory.value = ''
  updateType.value = ''
  updateTags.value = ''
  applyCategory.value = false
  applyType.value = false
  applyTags.value = false
  batchOperation.value = 'update'
}

async function executeBatchOperation() {
  const docIds = Array.from(selectedIds.value)

  isProcessing.value = true
  progress.value = 0

  try {
    switch (batchOperation.value) {
      case 'update': {
        const updateData: Record<string, unknown> = {}
        if (applyCategory.value) updateData.category = updateCategory.value || null
        if (applyType.value && updateType.value) updateData.document_type = updateType.value
        if (applyTags.value) {
          updateData.tags = updateTags.value
            ? updateTags.value.split(',').map(t => t.trim()).filter(Boolean)
            : []
        }

        if (Object.keys(updateData).length === 0) {
          toast.warn('Selecciona al menos un campo para actualizar')
          isProcessing.value = false
          return
        }

        await batchUpdate(docIds, updateData)
        toast.success(`${docIds.length} documentos actualizados`)
        break
      }

      case 'activate':
        await batchUpdate(docIds, { active: true })
        toast.success(`${docIds.length} documentos activados`)
        break

      case 'deactivate':
        await batchUpdate(docIds, { active: false })
        toast.success(`${docIds.length} documentos desactivados`)
        break

      case 'regenerate':
        await batchRegenerateEmbeddings(docIds)
        toast.success(`Embeddings regenerados para ${docIds.length} documentos`)
        break

      case 'delete':
        await batchDelete(docIds)
        toast.success(`${docIds.length} documentos eliminados`)
        break
    }

    progress.value = 100
    selectedIds.value = new Set()
    closeBatchDialog()
    fetchDocuments()
    emit('complete')
  } catch (error) {
    toast.error('Error en operacion batch')
  } finally {
    isProcessing.value = false
  }
}

function selectAll() {
  selectedIds.value = new Set(documents.value.map(d => d.id))
}

function clearSelection() {
  selectedIds.value = new Set()
}
</script>

<template>
  <div class="batch-editor">
    <!-- Selection toolbar -->
    <div class="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">
          <strong>{{ selectedCount }}</strong> documentos seleccionados
        </span>
        <Button variant="ghost" size="sm" @click="selectAll" :disabled="isLoading">
          Seleccionar todo
        </Button>
        <Button variant="ghost" size="sm" @click="clearSelection" :disabled="selectedCount === 0">
          Limpiar seleccion
        </Button>
      </div>
      <Button @click="openBatchDialog" :disabled="selectedCount === 0">
        <i class="pi pi-cog mr-2" />
        Operacion Batch
      </Button>
    </div>

    <Alert v-if="documents.length === 0" variant="info">
      <AlertDescription>No hay documentos para editar. Sube algunos documentos primero.</AlertDescription>
    </Alert>

    <!-- Documents table with selection -->
    <div v-if="documents.length > 0" class="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[3rem]">
              <Checkbox
                :checked="allSelected"
                @update:checked="toggleSelectAll"
              />
            </TableHead>
            <TableHead class="min-w-[200px]">Titulo</TableHead>
            <TableHead class="w-[120px]">Tipo</TableHead>
            <TableHead class="w-[120px]">Categoria</TableHead>
            <TableHead class="w-[100px]">Estado</TableHead>
            <TableHead class="w-[100px]">Embedding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(data, idx) in documents"
            :key="data.id"
            :class="idx % 2 === 0 ? '' : 'bg-muted/50'"
          >
            <TableCell>
              <Checkbox
                :checked="selectedIds.has(data.id)"
                @update:checked="() => toggleSelection(data.id)"
              />
            </TableCell>
            <TableCell>
              <div class="font-medium">{{ data.title }}</div>
              <div class="text-xs text-muted-foreground">ID: {{ data.id.slice(0, 8) }}...</div>
            </TableCell>
            <TableCell>{{ data.document_type }}</TableCell>
            <TableCell>
              <span v-if="data.category">{{ data.category }}</span>
              <span v-else class="text-muted-foreground">-</span>
            </TableCell>
            <TableCell>
              <Badge :variant="data.active ? 'success' : 'destructive'">
                {{ data.active ? 'Activo' : 'Inactivo' }}
              </Badge>
            </TableCell>
            <TableCell>
              <i :class="data.has_embedding ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Batch operation dialog -->
    <Dialog v-model:open="showBatchDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Operacion Batch</DialogTitle>
          <DialogDescription class="sr-only">Ejecutar operacion batch sobre documentos seleccionados</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Alert variant="info">
            <AlertDescription>
              Esta operacion afectara a <strong>{{ selectedCount }}</strong> documentos
            </AlertDescription>
          </Alert>

          <div>
            <Label class="mb-2">Tipo de operacion</Label>
            <div class="space-y-1">
              <div
                v-for="option in operationOptions"
                :key="option.value"
                class="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                :class="{ 'bg-primary/10': batchOperation === option.value }"
                @click="batchOperation = option.value as typeof batchOperation"
              >
                <i :class="option.icon" class="text-sm" />
                <span class="text-sm">{{ option.label }}</span>
              </div>
            </div>
          </div>

          <!-- Update fields -->
          <div v-if="batchOperation === 'update'" class="space-y-3 pt-4 border-t">
            <div class="flex items-center gap-3">
              <Checkbox id="applyCategory" :checked="applyCategory" @update:checked="(val: boolean) => applyCategory = val" />
              <Label for="applyCategory" class="text-sm shrink-0">Actualizar categoria:</Label>
              <Input
                v-model="updateCategory"
                placeholder="Nueva categoria"
                class="flex-1"
                :disabled="!applyCategory"
              />
            </div>

            <div class="flex items-center gap-3">
              <Checkbox id="applyType" :checked="applyType" @update:checked="(val: boolean) => applyType = val" />
              <Label for="applyType" class="text-sm shrink-0">Actualizar tipo:</Label>
              <Select
                :model-value="updateType"
                :disabled="!applyType"
                @update:model-value="(val: string) => updateType = val"
              >
                <SelectTrigger class="flex-1">
                  <SelectValue placeholder="Nuevo tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in typeOptions" :key="String(opt.value)" :value="String(opt.value)">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="flex items-center gap-3">
              <Checkbox id="applyTags" :checked="applyTags" @update:checked="(val: boolean) => applyTags = val" />
              <Label for="applyTags" class="text-sm shrink-0">Actualizar tags:</Label>
              <Input
                v-model="updateTags"
                placeholder="tag1, tag2, tag3"
                class="flex-1"
                :disabled="!applyTags"
              />
            </div>
          </div>

          <!-- Warning for delete -->
          <Alert v-if="batchOperation === 'delete'" variant="warning">
            <AlertDescription>
              Esta accion desactivara los documentos. Para eliminar permanentemente, usa la opcion individual.
            </AlertDescription>
          </Alert>

          <!-- Progress -->
          <Progress v-if="isProcessing" :model-value="progress" class="h-2" />
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="closeBatchDialog" :disabled="isProcessing">
            Cancelar
          </Button>
          <Button
            :variant="batchOperation === 'delete' ? 'destructive' : 'default'"
            :loading="isProcessing"
            @click="executeBatchOperation"
          >
            {{ batchOperation === 'delete' ? 'Eliminar' : 'Ejecutar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
