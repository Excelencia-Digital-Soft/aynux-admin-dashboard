<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledge } from '@/composables/useKnowledge'
import { useToast } from '@/composables/useToast'
import { getTypeOptions } from '@/utils/constants'
import type { DocumentContext, BatchUploadItem } from '@/types/document.types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface Props {
  context?: DocumentContext
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global',
  maxFiles: 20
})

const emit = defineEmits<{
  (e: 'complete', results: { success: number; failed: number }): void
  (e: 'cancel'): void
}>()

const toast = useToast()
const { createDocument, isLoading } = useKnowledge()

const uploadQueue = ref<BatchUploadItem[]>([])
const isProcessing = ref(false)
const currentIndex = ref(0)
const overallProgress = ref(0)
const defaultType = ref('')
const defaultCategory = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const typeOptions = computed(() => getTypeOptions(props.context))

const pendingCount = computed(() =>
  uploadQueue.value.filter(item => item.status === 'pending').length
)
const successCount = computed(() =>
  uploadQueue.value.filter(item => item.status === 'success').length
)
const errorCount = computed(() =>
  uploadQueue.value.filter(item => item.status === 'error').length
)

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  const files = Array.from(input.files)

  if (uploadQueue.value.length + files.length > props.maxFiles) {
    toast.warn(`Maximo ${props.maxFiles} archivos permitidos`)
    return
  }

  for (const file of files) {
    const isPdf = file.type === 'application/pdf'
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')

    if (!isPdf && !isText) {
      toast.warn(`Archivo ${file.name} no soportado. Solo PDF y TXT.`)
      continue
    }

    uploadQueue.value.push({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      document_type: defaultType.value || '',
      category: defaultCategory.value || undefined,
      status: 'pending'
    })
  }

  // Reset file input
  input.value = ''
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function onFileDrop(e: DragEvent) {
  if (!e.dataTransfer?.files) return
  const files = Array.from(e.dataTransfer.files)

  if (uploadQueue.value.length + files.length > props.maxFiles) {
    toast.warn(`Maximo ${props.maxFiles} archivos permitidos`)
    return
  }

  for (const file of files) {
    const isPdf = file.type === 'application/pdf'
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')

    if (!isPdf && !isText) {
      toast.warn(`Archivo ${file.name} no soportado. Solo PDF y TXT.`)
      continue
    }

    uploadQueue.value.push({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      document_type: defaultType.value || '',
      category: defaultCategory.value || undefined,
      status: 'pending'
    })
  }
}

function removeFromQueue(index: number) {
  uploadQueue.value.splice(index, 1)
}

function clearQueue() {
  uploadQueue.value = []
  currentIndex.value = 0
  overallProgress.value = 0
}

async function processQueue() {
  if (uploadQueue.value.length === 0) {
    toast.warn('No hay archivos en la cola')
    return
  }

  const invalidItems = uploadQueue.value.filter(item => !item.document_type)
  if (invalidItems.length > 0) {
    toast.warn('Todos los documentos deben tener un tipo asignado')
    return
  }

  isProcessing.value = true
  currentIndex.value = 0

  for (let i = 0; i < uploadQueue.value.length; i++) {
    const item = uploadQueue.value[i]
    if (item.status !== 'pending') continue

    currentIndex.value = i
    item.status = 'uploading'
    item.progress = 0

    try {
      if (item.file) {
        const content = await readFileContent(item.file)

        await createDocument({
          title: item.title,
          content,
          document_type: item.document_type,
          category: item.category,
          tags: item.tags
        })
      }

      item.status = 'success'
      item.progress = 100
    } catch (error) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : 'Error desconocido'
    }

    overallProgress.value = Math.round(((i + 1) / uploadQueue.value.length) * 100)
  }

  isProcessing.value = false

  emit('complete', {
    success: successCount.value,
    failed: errorCount.value
  })

  if (errorCount.value === 0) {
    toast.success(`${successCount.value} documentos subidos correctamente`)
  } else {
    toast.warn(`${successCount.value} exitos, ${errorCount.value} errores`)
  }
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsText(file)
  })
}

function getStatusVariant(status: string): 'info' | 'success' | 'warning' | 'destructive' | 'secondary' {
  const map: Record<string, 'info' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
    pending: 'secondary',
    uploading: 'info',
    success: 'success',
    error: 'destructive'
  }
  return map[status] || 'secondary'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    uploading: 'Subiendo...',
    success: 'Completado',
    error: 'Error'
  }
  return map[status] || status
}
</script>

<template>
  <div class="batch-uploader">
    <!-- Default settings -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <Label class="mb-1">Tipo por defecto</Label>
        <Select
          :model-value="defaultType"
          :disabled="isProcessing"
          @update:model-value="(val: string) => defaultType = val"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in typeOptions" :key="String(opt.value)" :value="String(opt.value)">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label class="mb-1">Categoria por defecto</Label>
        <Input
          v-model="defaultCategory"
          placeholder="Ej: ventas, soporte"
          :disabled="isProcessing"
        />
      </div>
    </div>

    <!-- File upload zone -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".pdf,.txt,.md"
      class="hidden"
      @change="onFileInputChange"
    />
    <div
      class="mb-4 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
      :class="{ 'opacity-50 pointer-events-none': isProcessing }"
      @click="triggerFileSelect"
      @dragover.prevent
      @drop.prevent="onFileDrop"
    >
      <i class="pi pi-cloud-upload text-3xl text-muted-foreground mb-2 block" />
      <p class="text-sm text-muted-foreground">
        Arrastra archivos PDF o TXT aqui, o haz clic para seleccionar
      </p>
      <p class="text-xs text-muted-foreground mt-1">Maximo {{ maxFiles }} archivos, 10MB cada uno</p>
    </div>

    <Alert v-if="uploadQueue.length === 0" variant="info">
      <AlertDescription>Arrastra archivos PDF o TXT aqui, o usa el boton para seleccionarlos</AlertDescription>
    </Alert>

    <!-- Queue table -->
    <div v-if="uploadQueue.length > 0" class="rounded-md border overflow-auto mb-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="min-w-[200px]">Titulo</TableHead>
            <TableHead class="w-[150px]">Tipo</TableHead>
            <TableHead class="w-[120px]">Categoria</TableHead>
            <TableHead class="w-[120px]">Estado</TableHead>
            <TableHead class="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(data, index) in uploadQueue"
            :key="index"
            :class="index % 2 === 0 ? '' : 'bg-muted/50'"
          >
            <TableCell>
              <Input
                v-model="data.title"
                class="h-8"
                :disabled="isProcessing || data.status !== 'pending'"
              />
            </TableCell>
            <TableCell>
              <Select
                :model-value="data.document_type"
                :disabled="isProcessing || data.status !== 'pending'"
                @update:model-value="(val: string) => data.document_type = val"
              >
                <SelectTrigger class="h-8">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in typeOptions" :key="String(opt.value)" :value="String(opt.value)">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                v-model="data.category"
                placeholder="Categoria"
                class="h-8"
                :disabled="isProcessing || data.status !== 'pending'"
              />
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(data.status)">
                {{ getStatusLabel(data.status) }}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                v-if="data.status === 'pending'"
                variant="ghost"
                size="icon"
                class="h-7 w-7 text-red-500 hover:text-red-600"
                :disabled="isProcessing"
                @click="removeFromQueue(index)"
              >
                <i class="pi pi-times text-xs" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Progress -->
    <div v-if="isProcessing" class="mb-4">
      <p class="text-sm text-muted-foreground mb-2">
        Procesando {{ currentIndex + 1 }} de {{ uploadQueue.length }}...
      </p>
      <Progress :model-value="overallProgress" class="h-2" />
    </div>

    <!-- Summary -->
    <div v-if="uploadQueue.length > 0" class="flex items-center gap-4 mb-4 text-sm">
      <span class="text-muted-foreground">
        Total: <strong>{{ uploadQueue.length }}</strong>
      </span>
      <span v-if="pendingCount > 0" class="text-blue-600">
        Pendientes: <strong>{{ pendingCount }}</strong>
      </span>
      <span v-if="successCount > 0" class="text-green-600">
        Completados: <strong>{{ successCount }}</strong>
      </span>
      <span v-if="errorCount > 0" class="text-red-600">
        Errores: <strong>{{ errorCount }}</strong>
      </span>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <Button
        variant="secondary"
        @click="clearQueue"
        :disabled="isProcessing || uploadQueue.length === 0"
      >
        Limpiar
      </Button>
      <Button
        variant="secondary"
        @click="emit('cancel')"
        :disabled="isProcessing"
      >
        Cancelar
      </Button>
      <Button
        :disabled="isProcessing || pendingCount === 0"
        :loading="isProcessing"
        @click="processQueue"
      >
        <i class="pi pi-upload mr-2" />
        Procesar Cola
      </Button>
    </div>
  </div>
</template>
