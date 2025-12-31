<template>
  <div class="yaml-versions">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <Button 
          @click="goBack" 
          icon="pi pi-arrow-left" 
          severity="secondary"
          text
          v-tooltip="'Volver a la lista'"
        />
        <h2>
          Historial de Versiones
          <Tag :value="promptKey" severity="secondary" class="ml-2" />
        </h2>
      </div>
      
      <div class="header-right">
        <Button 
          @click="refreshVersions" 
          icon="pi pi-refresh" 
          severity="secondary"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Current Version Info -->
    <Card class="mb-4">
      <template #title>
        <i class="pi pi-info-circle"></i>
        Versión Actual
      </template>
      <template #content>
        <div v-if="currentPrompt" class="current-version">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Versión:</strong>
              <Tag :value="currentPrompt.version" class="ml-2" />
            </div>
            <div>
              <strong>Última actualización:</strong>
              <span class="ml-2">{{ formatDate(currentPrompt.updated_at) }}</span>
            </div>
            <div>
              <strong>Estado:</strong>
              <Tag 
                :value="currentPrompt.active ? 'Activo' : 'Inactivo'" 
                :severity="currentPrompt.active ? 'success' : 'danger'"
                class="ml-2"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Version History -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>
            <i class="pi pi-history"></i>
            Historial de Cambios
          </span>
          <div class="flex space-x-2">
            <Button 
              @click="createVersion" 
              icon="pi pi-plus" 
              size="small"
              severity="secondary"
              v-tooltip="'Crear nueva versión'"
            />
            <Button 
              @click="exportHistory" 
              icon="pi pi-download" 
              size="small"
              severity="secondary"
              v-tooltip="'Exportar historial'"
            />
          </div>
        </div>
      </template>
      
      <template #content>
        <DataTable 
          :value="versions" 
          :loading="loading" 
          responsiveLayout="scroll"
          dataKey="id"
          selectionMode="single"
          v-model:selection="selectedVersion"
        >
          <Column selectionMode="single" headerStyle="width: 3rem"></Column>
          
          <Column field="version" header="Versión" sortable>
            <template #body="{data}">
              <Tag 
                :value="data.version" 
                :severity="getCurrentVersionSeverity(data.version)"
              />
            </template>
          </Column>
          
          <Column field="created_at" header="Fecha" sortable>
            <template #body="{data}">
              <div>
                <div>{{ formatDate(data.created_at) }}</div>
                <div class="text-sm text-muted">{{ formatRelativeTime(data.created_at) }}</div>
              </div>
            </template>
          </Column>
          
          <Column field="created_by" header="Autor" sortable>
            <template #body="{data}">
              <div class="flex items-center">
                <i class="pi pi-user mr-2"></i>
                {{ data.created_by }}
              </div>
            </template>
          </Column>
          
          <Column field="change_description" header="Descripción del Cambio">
            <template #body="{data}">
              <div v-if="data.change_description">
                {{ data.change_description }}
              </div>
              <div v-else class="text-muted text-italic">
                Sin descripción
              </div>
            </template>
          </Column>
          
          <Column header="Acciones" style="min-width: 200px">
            <template #body="{data}">
              <div class="flex space-x-1">
                <Button 
                  @click="viewVersion(data)" 
                  icon="pi pi-eye" 
                  size="small"
                  severity="info"
                  v-tooltip="'Ver detalles'"
                />
                <Button 
                  @click="compareVersion(data)" 
                  icon="pi pi-code-compare" 
                  size="small"
                  severity="secondary"
                  v-tooltip="'Comparar con actual'"
                />
                <Button 
                  @click="rollbackToVersion(data)" 
                  icon="pi pi-undo" 
                  size="small"
                  severity="warning"
                  v-tooltip="'Rollback a esta versión'"
                  :disabled="isCurrentVersion(data.version)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Version Details Dialog -->
    <Dialog 
      v-model:visible="showVersionDetails" 
      header="Detalles de la Versión"
      :style="{ width: '80vw' }"
      :maximizable="true"
      modal
    >
      <div v-if="selectedVersion" class="version-details">
        <Card class="mb-4">
          <template #title>Información</template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Versión:</strong>
                <Tag :value="selectedVersion.version" class="ml-2" />
              </div>
              <div>
                <strong>Fecha:</strong>
                <span class="ml-2">{{ formatDate(selectedVersion.created_at) }}</span>
              </div>
              <div>
                <strong>Autor:</strong>
                <span class="ml-2">{{ selectedVersion.created_by }}</span>
              </div>
              <div>
                <strong>ID:</strong>
                <span class="ml-2 font-mono text-xs">{{ selectedVersion.id }}</span>
              </div>
            </div>
            
            <div v-if="selectedVersion.change_description" class="mt-4">
              <strong>Descripción:</strong>
              <p class="mt-2">{{ selectedVersion.change_description }}</p>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>Contenido del Template</template>
          <template #content>
            <div class="template-content">
              <pre class="template-text">{{ formatYamlContent(selectedVersion.content) }}</pre>
              <Button 
                @click="copyToClipboard(selectedVersion.content)" 
                icon="pi pi-copy" 
                size="small"
                severity="secondary"
                label="Copiar contenido"
                class="mt-2"
              />
            </div>
          </template>
        </Card>
      </div>
    </Dialog>

    <!-- Version Compare Dialog -->
    <Dialog 
      v-model:visible="showVersionCompare" 
      header="Comparar Versiones"
      :style="{ width: '90vw' }"
      :maximizable="true"
      modal
    >
      <div v-if="selectedVersion && currentPrompt" class="version-compare">
        <div class="compare-header">
          <div class="compare-info">
            <h4>Versión Anterior ({{ selectedVersion.version }})</h4>
            <p>{{ formatDate(selectedVersion.created_at) }} - {{ selectedVersion.created_by }}</p>
          </div>
          <div class="compare-info">
            <h4>Versión Actual ({{ currentPrompt.version }})</h4>
            <p>{{ formatDate(currentPrompt.updated_at) }}</p>
          </div>
        </div>
        
        <div class="compare-content">
          <div class="compare-side">
            <h5>Contenido Anterior</h5>
            <pre class="compare-text">{{ formatYamlContent(selectedVersion.content) }}</pre>
          </div>
          
          <div class="compare-side">
            <h5>Contenido Actual</h5>
            <pre class="compare-text">{{ formatYamlContent(currentPrompt.template) }}</pre>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Create Version Dialog -->
    <Dialog 
      v-model:visible="showCreateVersion" 
      header="Crear Nueva Versión"
      :style="{ width: '50vw' }"
      modal
    >
      <div class="create-version-form">
        <div class="field">
          <label for="description">Descripción del Cambio</label>
          <Textarea 
            id="description"
            v-model="newVersionDescription" 
            placeholder="Describe los cambios realizados en esta versión..."
            rows="4"
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showCreateVersion = false" 
          label="Cancelar"
          severity="secondary"
        />
        <Button 
          @click="handleCreateVersion" 
          label="Crear Versión"
          icon="pi pi-check"
          :loading="creatingVersion"
        />
      </template>
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

dayjs.extend(relativeTime)
dayjs.locale('es')

import { useConfirm } from '@/composables/useConfirm'

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

// Store state (use storeToRefs for reactivity)
const { currentPrompt, versions, loading } = storeToRefs(yamlStore)

// Computed
const promptKey = computed(() => route.params.key as string)

const getCurrentVersionSeverity = (version: string) => {
  const currentVersion = currentPrompt.value?.version
  if (!currentVersion) return 'secondary'
  if (version === currentVersion) return 'success'
  if (version > currentVersion) return 'warning'
  return 'secondary'
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
    
    // Refresh data
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
  // Check permissions
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

<style scoped>
.yaml-versions {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.text-muted {
  color: var(--text-color-secondary);
}

.template-content,
.compare-side {
  position: relative;
}

.template-text,
.compare-text {
  background: var(--surface-100);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  max-height: 500px;
  overflow-y: auto;
  margin: 0;
}

.compare-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.compare-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.compare-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.compare-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.compare-side h5 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.create-version-form .field {
  margin-bottom: 1rem;
}

.create-version-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

@media (max-width: 1200px) {
  .compare-header,
  .compare-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>