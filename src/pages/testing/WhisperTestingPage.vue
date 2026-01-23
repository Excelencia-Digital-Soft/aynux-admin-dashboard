<script setup lang="ts">
import { ref } from 'vue'
import { useWhisperTesting } from '@/composables/useWhisperTesting'

// Shadcn components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

const {
  isLoading,
  isTranscribing,
  isLoadingModel,
  isReleasingMemory,
  healthStatus,
  supportedFormats,
  selectedFile,
  audioUrl,
  transcriptionResult,
  transcriptionError,
  selectedLanguage,
  includeSegments,
  languageOptions,
  isModelLoaded,
  gpuAvailable,
  canTranscribe,
  vramUsage,
  fetchHealth,
  handleFileSelect,
  clearFile,
  transcribeAudio,
  loadModel,
  releaseMemory,
  copyTranscription,
  clearResult,
  formatDuration,
  formatProcessingTime
} = useWhisperTesting()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

function openFileDialog() {
  fileInputRef.value?.click()
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    handleFileSelect(input.files[0])
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    handleFileSelect(event.dataTransfer.files[0])
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function handleClearFile() {
  clearFile()
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<template>
  <TooltipProvider>
    <div class="whisper-testing-page">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground flex items-center gap-3">
            <i class="pi pi-microphone text-purple-500" />
            Whisper Transcription Testing
          </h1>
          <p class="text-muted-foreground mt-1">
            Prueba el servicio de transcripcion de audio con Whisper
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- GPU Status Badge -->
          <Badge :variant="gpuAvailable ? 'success' : 'destructive'">
            <i :class="gpuAvailable ? 'pi pi-check' : 'pi pi-times'" class="mr-1" />
            {{ gpuAvailable ? 'GPU Disponible' : 'GPU No Disponible' }}
          </Badge>
          <Button variant="outline" @click="fetchHealth" :loading="isLoading">
            <i class="pi pi-refresh mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Panel (2/3) -->
        <div class="lg:col-span-2 flex flex-col gap-4">
          <!-- File Upload Card -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <i class="pi pi-upload" />
                Subir Audio
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Hidden file input -->
              <input
                ref="fileInputRef"
                type="file"
                accept="audio/*,.ogg,.mp3,.wav,.m4a,.flac"
                class="hidden"
                @change="onFileInputChange"
              />

              <!-- Drop Zone -->
              <div
                @click="openFileDialog"
                @drop="onDrop"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                :class="[
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragOver
                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-muted-foreground/25 hover:border-purple-400'
                ]"
              >
                <i class="pi pi-cloud-upload text-4xl text-muted-foreground mb-3" />
                <p class="text-muted-foreground mb-2">
                  Arrastra un archivo de audio aqui o haz clic para seleccionar
                </p>
                <p class="text-sm text-muted-foreground/70">
                  Formatos soportados: {{ supportedFormats.join(', ') }}
                </p>
              </div>

              <!-- Selected File Info -->
              <div
                v-if="selectedFile"
                class="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-file-audio text-2xl text-purple-500" />
                  <div>
                    <p class="font-medium text-foreground">{{ selectedFile.name }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" @click="handleClearFile">
                  <i class="pi pi-times" />
                </Button>
              </div>

              <!-- Audio Preview -->
              <div v-if="audioUrl" class="space-y-2">
                <Label>Vista previa del audio</Label>
                <audio :src="audioUrl" controls class="w-full rounded-lg" />
              </div>

              <!-- Transcribe Button -->
              <div class="flex gap-3">
                <Button
                  @click="transcribeAudio"
                  :loading="isTranscribing"
                  :disabled="!canTranscribe"
                  class="flex-1"
                >
                  <i class="pi pi-play mr-2" />
                  Transcribir
                </Button>
                <Button v-if="transcriptionResult" variant="outline" @click="clearResult">
                  <i class="pi pi-trash mr-2" />
                  Limpiar
                </Button>
              </div>

              <!-- Progress -->
              <div v-if="isTranscribing" class="space-y-2">
                <p class="text-sm text-muted-foreground">Transcribiendo audio...</p>
                <div class="h-2 bg-secondary rounded-full overflow-hidden">
                  <div class="h-full bg-primary animate-pulse w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Transcription Result Card -->
          <Card v-if="transcriptionResult || transcriptionError">
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle class="flex items-center gap-2">
                  <i class="pi pi-file-edit" />
                  Resultado de Transcripcion
                </CardTitle>
                <Tooltip v-if="transcriptionResult">
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" @click="copyTranscription">
                      <i class="pi pi-copy" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar texto</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <!-- Error -->
              <div
                v-if="transcriptionError"
                class="p-4 bg-destructive/10 rounded-lg text-destructive"
              >
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-exclamation-triangle" />
                  <span class="font-medium">Error en transcripcion</span>
                </div>
                <p class="text-sm">{{ transcriptionError }}</p>
              </div>

              <!-- Result -->
              <div v-else-if="transcriptionResult" class="space-y-4">
                <!-- Transcribed Text -->
                <div class="p-4 bg-muted rounded-lg border min-h-[100px]">
                  <p class="text-foreground whitespace-pre-wrap leading-relaxed">
                    {{ transcriptionResult.text }}
                  </p>
                </div>

                <!-- Metadata -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p class="text-xs text-muted-foreground mb-1">Idioma</p>
                    <Badge variant="info">
                      {{ transcriptionResult.language.toUpperCase() }}
                    </Badge>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ (transcriptionResult.language_probability * 100).toFixed(0) }}%
                    </p>
                  </div>
                  <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p class="text-xs text-muted-foreground mb-1">Duracion</p>
                    <p class="text-lg font-semibold text-green-600 dark:text-green-400">
                      {{ formatDuration(transcriptionResult.duration) }}
                    </p>
                  </div>
                  <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p class="text-xs text-muted-foreground mb-1">Procesamiento</p>
                    <p class="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {{ formatProcessingTime(transcriptionResult.processing_time) }}
                    </p>
                  </div>
                  <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p class="text-xs text-muted-foreground mb-1">Velocidad</p>
                    <p class="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {{
                        transcriptionResult.processing_time > 0
                          ? (transcriptionResult.duration / transcriptionResult.processing_time).toFixed(1)
                          : 'N/A'
                      }}x
                    </p>
                  </div>
                </div>

                <!-- Segments -->
                <div v-if="transcriptionResult.segments && transcriptionResult.segments.length > 0">
                  <Label class="mb-2 block">
                    Segmentos ({{ transcriptionResult.segments.length }})
                  </Label>
                  <div class="max-h-48 overflow-y-auto space-y-1">
                    <div
                      v-for="segment in transcriptionResult.segments"
                      :key="segment.id"
                      class="flex gap-3 p-2 bg-muted rounded text-sm"
                    >
                      <span class="text-muted-foreground font-mono whitespace-nowrap">
                        {{ formatDuration(segment.start) }} - {{ formatDuration(segment.end) }}
                      </span>
                      <span class="text-foreground">{{ segment.text }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Debug Panel (1/3) -->
        <div class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <i class="pi pi-cog" />
                Panel de Control
              </CardTitle>
            </CardHeader>
            <CardContent class="p-0">
              <Tabs default-value="gpu">
                <TabsList class="w-full grid grid-cols-3">
                  <TabsTrigger value="gpu">
                    <i class="pi pi-microchip mr-1" />
                    GPU
                  </TabsTrigger>
                  <TabsTrigger value="config">
                    <i class="pi pi-sliders-h mr-1" />
                    Config
                  </TabsTrigger>
                  <TabsTrigger value="raw">
                    <i class="pi pi-code mr-1" />
                    Raw
                  </TabsTrigger>
                </TabsList>

                <!-- GPU Status Tab -->
                <TabsContent value="gpu" class="p-4 space-y-4">
                  <div v-if="healthStatus">
                    <!-- Device Info -->
                    <div class="space-y-3">
                      <div>
                        <Label class="text-xs text-muted-foreground">Dispositivo</Label>
                        <p class="font-medium text-foreground">
                          {{ healthStatus.device_name || healthStatus.device || 'N/A' }}
                        </p>
                      </div>

                      <!-- VRAM Usage -->
                      <div v-if="vramUsage && vramUsage.total > 0">
                        <Label class="text-xs text-muted-foreground mb-1 block">VRAM</Label>
                        <Progress
                          :model-value="vramUsage.percentage"
                          class="h-2"
                          :indicator-class="
                            vramUsage.percentage > 90
                              ? 'bg-destructive'
                              : vramUsage.percentage > 70
                                ? 'bg-yellow-500'
                                : 'bg-primary'
                          "
                        />
                        <p class="text-xs text-muted-foreground mt-1">
                          {{ vramUsage.used.toFixed(1) }}GB / {{ vramUsage.total.toFixed(1) }}GB
                          ({{ vramUsage.percentage.toFixed(0) }}%)
                        </p>
                      </div>

                      <!-- Model Status -->
                      <div>
                        <Label class="text-xs text-muted-foreground">Modelo</Label>
                        <div class="flex items-center gap-2 mt-1">
                          <Badge :variant="isModelLoaded ? 'success' : 'secondary'">
                            {{ healthStatus.model_name || 'No cargado' }}
                          </Badge>
                          <Badge v-if="healthStatus.compute_type" variant="info">
                            {{ healthStatus.compute_type }}
                          </Badge>
                        </div>
                      </div>

                      <!-- Status -->
                      <div>
                        <Label class="text-xs text-muted-foreground">Estado</Label>
                        <Badge
                          :variant="healthStatus.status === 'healthy' ? 'success' : 'warning'"
                          class="mt-1"
                        >
                          {{ healthStatus.status }}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div v-else class="text-center text-muted-foreground py-4">
                    <i v-if="isLoading" class="pi pi-spin pi-spinner text-2xl mb-2" />
                    <i v-else class="pi pi-exclamation-circle text-2xl mb-2" />
                    <p class="text-sm">{{ isLoading ? 'Cargando...' : 'Sin datos de GPU' }}</p>
                  </div>
                </TabsContent>

                <!-- Config Tab -->
                <TabsContent value="config" class="p-4 space-y-4">
                  <!-- Language Selection -->
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">Idioma</Label>
                    <Select v-model="selectedLanguage">
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="Seleccionar idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="lang in languageOptions"
                          :key="lang.value"
                          :value="lang.value"
                        >
                          {{ lang.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Include Segments -->
                  <div class="flex items-center gap-2">
                    <Checkbox
                      id="segments"
                      :checked="includeSegments"
                      @update:checked="includeSegments = $event"
                    />
                    <Label for="segments" class="text-sm text-foreground cursor-pointer">
                      Incluir segmentos con timestamps
                    </Label>
                  </div>

                  <!-- Supported Formats -->
                  <div>
                    <Label class="text-xs text-muted-foreground mb-2 block">
                      Formatos soportados
                    </Label>
                    <div class="flex flex-wrap gap-1">
                      <Badge v-for="format in supportedFormats" :key="format" variant="secondary">
                        {{ format }}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <!-- Raw Response Tab -->
                <TabsContent value="raw" class="p-4">
                  <div
                    v-if="transcriptionResult"
                    class="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 overflow-auto max-h-64"
                  >
                    <pre class="text-xs text-green-400 font-mono">{{
                      JSON.stringify(transcriptionResult, null, 2)
                    }}</pre>
                  </div>
                  <div v-else class="text-center text-muted-foreground py-4">
                    <i class="pi pi-code text-2xl mb-2" />
                    <p class="text-sm">Sin respuesta todavia</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <!-- Quick Actions Card -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-sm flex items-center gap-2">
                <i class="pi pi-bolt" />
                Acciones Rapidas
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <Button
                variant="default"
                class="w-full"
                size="sm"
                :loading="isLoadingModel"
                :disabled="isModelLoaded"
                @click="loadModel"
              >
                <i class="pi pi-download mr-2" />
                Cargar Modelo
              </Button>
              <Button
                variant="outline"
                class="w-full"
                size="sm"
                :loading="isReleasingMemory"
                :disabled="!isModelLoaded"
                @click="releaseMemory"
              >
                <i class="pi pi-trash mr-2" />
                Liberar VRAM
              </Button>
              <Button
                variant="secondary"
                class="w-full"
                size="sm"
                :loading="isLoading"
                @click="fetchHealth"
              >
                <i class="pi pi-refresh mr-2" />
                Refrescar Estado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>

<style scoped>
.whisper-testing-page {
  max-width: 100%;
}
</style>
