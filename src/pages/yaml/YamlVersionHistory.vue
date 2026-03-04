<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8 flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          @click="goBack"
          title="Volver a la lista"
        >
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
          Historial de Versiones
          <Badge variant="secondary">{{ promptKey }}</Badge>
        </h2>
      </div>
      <Button
        variant="secondary"
        @click="refreshVersions"
        :loading="loading"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Actualizar
      </Button>
    </div>

    <!-- Current Version Info -->
    <Card class="mb-4">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <Info class="h-4 w-4" />
          Versión Actual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="currentPrompt" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong class="text-sm">Versión:</strong>
            <Badge class="ml-2">{{ currentPrompt.version }}</Badge>
          </div>
          <div>
            <strong class="text-sm">Última actualización:</strong>
            <span class="ml-2 text-sm">{{ formatDate(currentPrompt.updated_at) }}</span>
          </div>
          <div>
            <strong class="text-sm">Estado:</strong>
            <Badge
              :variant="currentPrompt.active ? 'success' : 'destructive'"
              class="ml-2"
            >
              {{ currentPrompt.active ? 'Activo' : 'Inactivo' }}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Version History -->
    <Card>
      <CardHeader>
        <div class="flex justify-between items-center">
          <CardTitle class="flex items-center gap-2 text-base">
            <History class="h-4 w-4" />
            Historial de Cambios
          </CardTitle>
          <div class="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              @click="createVersion"
              title="Crear nueva versión"
            >
              <Plus class="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="exportHistory"
              title="Exportar historial"
            >
              <Download class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-8">
          <Spinner size="lg" />
        </div>

        <!-- Empty state -->
        <div v-else-if="versions.length === 0" class="text-center py-8">
          <History class="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h4 class="text-muted-foreground font-medium">Sin historial de versiones</h4>
          <p class="text-sm text-muted-foreground mt-2">
            Este template aún no tiene versiones anteriores registradas.
            Las versiones se crean automáticamente al guardar cambios.
          </p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/50">
                <th class="p-3 text-left font-medium text-muted-foreground">Versión</th>
                <th class="p-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th class="p-3 text-left font-medium text-muted-foreground">Autor</th>
                <th class="p-3 text-left font-medium text-muted-foreground">Notas</th>
                <th class="p-3 text-left font-medium text-muted-foreground min-w-[200px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="data in versions"
                :key="data.id"
                class="border-b hover:bg-muted/50 transition-colors"
              >
                <td class="p-3">
                  <Badge :variant="getCurrentVersionVariant(data.version)">
                    {{ data.version }}
                  </Badge>
                </td>
                <td class="p-3">
                  <div>
                    <div>{{ formatDate(data.created_at) }}</div>
                    <div class="text-sm text-muted-foreground">{{ formatRelativeTime(data.created_at) }}</div>
                  </div>
                </td>
                <td class="p-3">
                  <div class="flex items-center gap-2">
                    <User class="h-3.5 w-3.5" />
                    {{ data.created_by }}
                  </div>
                </td>
                <td class="p-3">
                  <div v-if="data.notes">{{ data.notes }}</div>
                  <div v-else class="text-muted-foreground italic">Sin notas</div>
                </td>
                <td class="p-3">
                  <div class="flex space-x-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      class="h-7 w-7"
                      @click="viewVersion(data)"
                      title="Ver detalles"
                    >
                      <Eye class="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      class="h-7 w-7"
                      @click="compareVersion(data)"
                      title="Comparar con actual"
                    >
                      <GitCompare class="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      class="h-7 w-7"
                      @click="rollbackToVersion(data)"
                      :disabled="isCurrentVersion(data.version)"
                      title="Rollback a esta versión"
                    >
                      <Undo2 class="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Version Details Dialog -->
    <Dialog v-model:open="showVersionDetails">
      <DialogContent class="max-w-[80vw] sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Versión</DialogTitle>
          <DialogDescription class="sr-only">Detalles completos de la versión seleccionada</DialogDescription>
        </DialogHeader>
        <div v-if="selectedVersion" class="space-y-4 max-h-[70vh] overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong class="text-sm">Versión:</strong>
                  <Badge class="ml-2">{{ selectedVersion.version }}</Badge>
                </div>
                <div>
                  <strong class="text-sm">Fecha:</strong>
                  <span class="ml-2 text-sm">{{ formatDate(selectedVersion.created_at) }}</span>
                </div>
                <div>
                  <strong class="text-sm">Autor:</strong>
                  <span class="ml-2 text-sm">{{ selectedVersion.created_by }}</span>
                </div>
                <div>
                  <strong class="text-sm">ID:</strong>
                  <span class="ml-2 font-mono text-xs">{{ selectedVersion.id }}</span>
                </div>
              </div>
              <div v-if="selectedVersion.notes" class="mt-4">
                <strong class="text-sm">Notas:</strong>
                <p class="mt-2 text-sm">{{ selectedVersion.notes }}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">Contenido del Template</CardTitle>
            </CardHeader>
            <CardContent>
              <pre class="bg-muted/50 border rounded p-4 font-mono text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">{{ formatYamlContent(selectedVersion.template) }}</pre>
              <Button
                variant="secondary"
                size="sm"
                @click="copyToClipboard(selectedVersion.template)"
                class="mt-2"
              >
                <Copy class="mr-2 h-3.5 w-3.5" />
                Copiar contenido
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Version Compare Dialog -->
    <Dialog v-model:open="showVersionCompare">
      <DialogContent class="max-w-[90vw] sm:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>Comparar Versiones</DialogTitle>
          <DialogDescription class="sr-only">Comparación entre versión seleccionada y actual</DialogDescription>
        </DialogHeader>
        <div v-if="selectedVersion && currentPrompt" class="max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            <div>
              <h4 class="font-medium text-foreground mb-1">Versión Anterior ({{ selectedVersion.version }})</h4>
              <p class="text-sm text-muted-foreground">{{ formatDate(selectedVersion.created_at) }} - {{ selectedVersion.created_by }}</p>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-1">Versión Actual ({{ currentPrompt.version }})</h4>
              <p class="text-sm text-muted-foreground">{{ formatDate(currentPrompt.updated_at) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 class="text-sm font-medium mb-2">Contenido Anterior</h5>
              <pre class="bg-muted/50 border rounded p-4 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">{{ formatYamlContent(selectedVersion.template) }}</pre>
            </div>
            <div>
              <h5 class="text-sm font-medium mb-2">Contenido Actual</h5>
              <pre class="bg-muted/50 border rounded p-4 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">{{ formatYamlContent(currentPrompt.template) }}</pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Create Version Dialog -->
    <Dialog v-model:open="showCreateVersion">
      <DialogContent class="sm:max-w-[50vw]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Versión</DialogTitle>
          <DialogDescription class="sr-only">Crear una nueva versión del template</DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <label for="description" class="block text-sm font-medium text-foreground mb-2">
            Descripción del Cambio
          </label>
          <textarea
            id="description"
            v-model="newVersionDescription"
            placeholder="Describe los cambios realizados en esta versión..."
            rows="4"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" @click="showCreateVersion = false">
            Cancelar
          </Button>
          <Button @click="handleCreateVersion" :loading="creatingVersion">
            <Check class="mr-2 h-3.5 w-3.5" />
            Crear Versión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import { useAuthStore } from '@/stores/auth.store'
import type { PromptVersion } from '@/types/yaml.types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

import { useConfirm } from '@/composables/useConfirm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Info,
  History,
  Plus,
  Download,
  Eye,
  GitCompare,
  Undo2,
  User,
  RefreshCw,
  Copy,
  Check
} from 'lucide-vue-next'

dayjs.extend(relativeTime)
dayjs.locale('es')

const router = useRouter()
const route = useRoute()
const toast = useToast()
const yamlStore = useYamlStore()
const authStore = useAuthStore()
const { confirmRollback } = useConfirm()

// Component state
const selectedVersion = ref<PromptVersion | null>(null)
const showVersionDetails = ref(false)
const showVersionCompare = ref(false)
const showCreateVersion = ref(false)
const newVersionDescription = ref('')
const creatingVersion = ref(false)

// Store state
const { currentPrompt, versions, loading } = storeToRefs(yamlStore)

// Computed
const promptKey = computed(() => route.params.key as string)

function getCurrentVersionVariant(version: string) {
  const currentVersion = currentPrompt.value?.version
  if (!currentVersion) return 'secondary' as const
  if (version === currentVersion) return 'success' as const
  if (version > currentVersion) return 'warning' as const
  return 'secondary' as const
}

const isCurrentVersion = (version: string) => {
  return version === currentPrompt.value?.version
}

// Methods
function formatDate(dateString: string): string {
  return dayjs(dateString).format('DD/MM/YYYY HH:mm')
}

function formatRelativeTime(dateString: string): string {
  return dayjs(dateString).fromNow()
}

function formatYamlContent(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return content
  }
}

function goBack() {
  router.push('/yaml-management')
}

async function refreshVersions() {
  if (!promptKey.value) return
  await yamlStore.fetchVersions(promptKey.value)
}

function viewVersion(version: PromptVersion) {
  selectedVersion.value = version
  showVersionDetails.value = true
}

function compareVersion(version: PromptVersion) {
  selectedVersion.value = version
  showVersionCompare.value = true
}

async function rollbackToVersion(version: PromptVersion) {
  if (!promptKey.value || !currentPrompt) return

  const confirmMessage = `¿Está seguro de que desea hacer rollback a la versión ${version.version}?\n\nEsto revertirá todos los cambios realizados desde esa versión.`

  const confirmed = await confirmRollback(confirmMessage)
  if (!confirmed) return

  try {
    await yamlStore.rollbackPrompt(promptKey.value, version.id)

    toast.add({
      severity: 'success',
      summary: 'Rollback exitoso',
      detail: `Se ha hecho rollback a la versión ${version.version}`,
      life: 5000
    })

    await Promise.all([
      yamlStore.fetchPromptByKey(promptKey.value),
      yamlStore.fetchVersions(promptKey.value)
    ])
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error en rollback',
      detail: error.message || 'Error al hacer rollback',
      life: 5000
    })
  }
}

function createVersion() {
  newVersionDescription.value = ''
  showCreateVersion.value = true
}

async function handleCreateVersion() {
  if (!promptKey.value) return

  creatingVersion.value = true

  try {
    await yamlStore.createVersion(promptKey.value, newVersionDescription.value)

    toast.add({
      severity: 'success',
      summary: 'Versión creada',
      detail: 'Se ha creado una nueva versión correctamente',
      life: 3000
    })

    showCreateVersion.value = false
    await yamlStore.fetchVersions(promptKey.value)
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al crear versión',
      detail: error.message || 'Error al crear la versión',
      life: 5000
    })
  } finally {
    creatingVersion.value = false
  }
}

function exportHistory() {
  if (!versions.value.length) return

  const historyData = {
    prompt_key: promptKey.value,
    current_version: currentPrompt.value?.version,
    versions: versions.value,
    exported_at: new Date().toISOString(),
    exported_by: authStore.username
  }

  const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${promptKey.value}_version_history.json`
  link.click()
  URL.revokeObjectURL(url)

  toast.add({
    severity: 'success',
    summary: 'Historial exportado',
    detail: 'El historial de versiones ha sido exportado exitosamente',
    life: 3000
  })
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'Contenido copiado al portapapeles',
      life: 2000
    })
  }).catch(() => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo copiar al portapapeles',
      life: 3000
    })
  })
}

// Lifecycle
onMounted(async () => {
  if (!authStore.isAdminOrOwner) {
    router.push('/unauthorized')
    return
  }

  if (promptKey.value) {
    await Promise.all([
      yamlStore.fetchPromptByKey(promptKey.value),
      yamlStore.fetchVersions(promptKey.value)
    ])
  } else {
    router.push('/yaml-management')
  }
})
</script>
