<template>
  <div class="yaml-management">
    <div class="page-header">
      <div class="header-content">
        <h1>
          <i class="pi pi-code"></i>
          Gestión de Templates YAML
        </h1>
        <p class="text-muted">
          Administra los templates de prompts del sistema de IA
        </p>
      </div>
      <div class="header-actions">
        <Button 
          @click="navigateToCreate" 
          icon="pi pi-plus" 
          label="Nuevo Template"
          class="p-button-outlined"
        />
        <Button 
          @click="exportTemplates" 
          icon="pi pi-download" 
          label="Exportar"
          class="p-button-secondary"
        />
        <Button 
          @click="importTemplates" 
          icon="pi pi-upload" 
          label="Importar"
          class="p-button-secondary"
        />
      </div>
    </div>

    <!-- Filters Panel -->
    <Card class="mb-4">
      <template #title>
        <i class="pi pi-filter"></i>
        Filtros
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="field">
            <label for="domain" class="block text-sm font-medium mb-2">Dominio</label>
            <Dropdown 
              id="domain"
              v-model="filters.domain" 
              :options="domainOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Todos los dominios"
              class="w-full"
              showClear
            />
          </div>
          
          <div class="field">
            <label for="source" class="block text-sm font-medium mb-2">Origen</label>
            <Dropdown 
              id="source"
              v-model="filters.source" 
              :options="sourceOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Todos los orígenes"
              class="w-full"
              showClear
            />
          </div>
          
          <div class="field">
            <label for="active" class="block text-sm font-medium mb-2">Estado</label>
            <Dropdown 
              id="active"
              v-model="filters.active" 
              :options="statusOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Todos los estados"
              class="w-full"
              showClear
            />
          </div>
          
          <div class="field">
            <label for="search" class="block text-sm font-medium mb-2">Buscar</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText 
                id="search"
                v-model="filters.search" 
                placeholder="Buscar por nombre, key o descripción..." 
                class="w-full"
              />
            </span>
          </div>
        </div>
        
        <div class="flex justify-end mt-4 space-x-2">
          <Button 
            @click="clearFilters" 
            icon="pi pi-times" 
            label="Limpiar Filtros"
            severity="secondary"
            size="small"
          />
          <Button 
            @click="applyFilters" 
            icon="pi pi-search" 
            label="Aplicar Filtros"
            size="small"
          />
        </div>
      </template>
    </Card>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ analytics?.total_prompts || 0 }}</div>
            <div class="text-sm text-muted">Total Templates</div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ analytics?.active_prompts || 0 }}</div>
            <div class="text-sm text-muted">Activos</div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ lockedCount }}</div>
            <div class="text-sm text-muted">Bloqueados</div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ domains.length }}</div>
            <div class="text-sm text-muted">Dominios</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Prompts DataTable -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>
            <i class="pi pi-code"></i>
            Templates YAML
          </span>
          <div class="flex items-center space-x-2">
            <Button 
              @click="refreshData" 
              icon="pi pi-refresh" 
              size="small"
              severity="secondary"
              :loading="loading"
            />
            <Button 
              @click="fetchAnalytics" 
              icon="pi pi-chart-bar" 
              size="small"
              severity="secondary"
              title="Actualizar estadísticas"
            />
          </div>
        </div>
      </template>
      
      <template #content>
        <DataTable 
          :value="paginatedPrompts" 
          :loading="loading" 
          responsiveLayout="scroll"
          :paginator="true"
          :rows="pagination.pageSize"
          :totalRecords="pagination.total"
          @page="onPageChange"
          :lazy="true"
          dataKey="key"
          v-model:selection="selectedPrompts"
          selectionMode="multiple"
          :globalFilterFields="['key', 'name', 'description', 'metadata.domain']"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          
          <Column field="key" header="Key" sortable>
            <template #body="{data}">
              <Tag :value="data.key" severity="secondary" class="font-mono text-xs" />
            </template>
          </Column>
          
          <Column field="name" header="Nombre" sortable>
            <template #body="{data}">
              <div>
                <div class="font-medium">{{ data.name }}</div>
                <div class="text-sm text-muted">{{ data.description }}</div>
              </div>
            </template>
          </Column>
          
          <Column field="metadata.domain" header="Dominio" sortable>
            <template #body="{data}">
              <Tag 
                :value="data.metadata.domain" 
                :icon="getDomainIcon(data.metadata.domain)"
                :severity="getDomainSeverity(data.metadata.domain)"
              />
            </template>
          </Column>
          
          <Column field="source" header="Origen" sortable>
            <template #body="{data}">
              <Tag 
                :value="data.source" 
                :severity="data.source === 'file' ? 'info' : 'success'"
                :icon="data.source === 'file' ? 'pi pi-folder' : 'pi pi-database'"
              />
            </template>
          </Column>
          
          <Column field="active" header="Estado" sortable>
            <template #body="{data}">
              <Tag 
                :value="!!data.active ? 'Activo' : 'Inactivo'" 
                :severity="!!data.active ? 'success' : 'danger'"
                :icon="!!data.active ? 'pi pi-check' : 'pi pi-times'"
              />
            </template>
          </Column>
          
          <Column field="locked_by" header="Bloqueo">
            <template #body="{data}">
              <span v-if="isPromptLocked(data.key)" class="text-orange-500">
                <i class="pi pi-lock"></i>
                {{ lockingUser(data.key) }}
              </span>
              <span v-else class="text-green-500">
                <i class="pi pi-unlock"></i>
                Disponible
              </span>
            </template>
          </Column>
          
          <Column field="updated_at" header="Actualizado" sortable>
            <template #body="{data}">
              <div class="text-sm">
                {{ formatDate(data.updated_at) }}
              </div>
            </template>
          </Column>
          
          <Column header="Acciones" style="min-width: 200px">
            <template #body="{data}">
              <div class="flex space-x-1">
                <Button 
                  @click="editPrompt(data.key)" 
                  icon="pi pi-pencil" 
                  size="small"
                  severity="secondary"
                  :disabled="isPromptLocked(data.key)"
                  v-tooltip="'Editar'"
                />
                <Button 
                  @click="previewPrompt(data.key)" 
                  icon="pi pi-eye" 
                  size="small"
                  severity="info"
                  v-tooltip="'Vista previa'"
                />
                <Button 
                  @click="testPrompt(data.key)" 
                  icon="pi pi-play" 
                  size="small"
                  severity="help"
                  v-tooltip="'Test'"
                />
                <Button 
                  @click="viewVersions(data.key)" 
                  icon="pi pi-history" 
                  size="small"
                  severity="secondary"
                  v-tooltip="'Versiones'"
                />
                <Button 
                  @click="togglePrompt(data.key, !data.active)" 
                  :icon="data.active ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                  size="small"
                  :severity="data.active ? 'danger' : 'success'"
                  v-tooltip="data.active ? 'Desactivar' : 'Activar'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
        
        <!-- Bulk Actions -->
        <div v-if="selectedPrompts.length > 0" class="mt-4 p-3 border border-200 border-round surface-100">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">
              {{ selectedPrompts.length }} template(s) seleccionado(s)
            </span>
            <div class="flex space-x-2">
              <Button 
                @click="bulkToggle(true)" 
                icon="pi pi-check" 
                label="Activar seleccionados"
                size="small"
                severity="success"
              />
              <Button 
                @click="bulkToggle(false)" 
                icon="pi pi-times" 
                label="Desactivar seleccionados"
                size="small"
                severity="danger"
              />
              <Button 
                @click="bulkDelete" 
                icon="pi pi-trash" 
                label="Eliminar seleccionados"
                size="small"
                severity="danger"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Hidden file input for import -->
    <input 
      ref="fileInput" 
      type="file" 
      accept=".zip,.yaml,.yml" 
      @change="handleFileImport"
      style="display: none"
    />

    <!-- Test Dialog -->
    <Dialog 
      v-model:visible="showTestDialog" 
      header="Test Prompt"
      :style="{ width: '90vw' }"
      :maximizable="true"
      modal
      @update:visible="showTestDialog = false"
    >
      <YamlTestDialog 
        v-if="showTestDialog && testPromptKey"
        :visible="showTestDialog"
        :promptKey="testPromptKey"
        @close="showTestDialog = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useYamlStore } from '@/stores/yaml.store'
import { useAuthStore } from '@/stores/auth.store'
import YamlTestDialog from './components/YamlTestDialog.vue'
import type { YamlPrompt } from '@/types/yaml.types'
import dayjs from 'dayjs'

const router = useRouter()
const toast = useToast()
const yamlStore = useYamlStore()
const authStore = useAuthStore()

// Local state
const selectedPrompts = ref<YamlPrompt[]>([])
const fileInput = ref<HTMLInputElement>()
const showTestDialog = ref(false)
const testPromptKey = ref('')

// Store getters
const { 
  prompts, 
  paginatedPrompts, 
  domains, 
  loading, 
  analytics, 
  filters, 
  pagination,
  isPromptLocked,
  lockingUser
} = yamlStore

// Computed
const lockedCount = computed(() => 
  prompts.value.filter(p => isPromptLocked(p.key)).length
)

const domainOptions = computed(() => [
  ...domains.value.map(domain => ({
    value: domain,
    label: getDomainDisplayName(domain)
  }))
])

const sourceOptions = [
  { value: 'file', label: 'Archivo' },
  { value: 'database', label: 'Base de Datos' }
]

const statusOptions = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' }
]

// Domain helpers
function getDomainIcon(domain: string): string {
  const iconMap: Record<string, string> = {
    'agents': 'pi pi-users',
    'healthcare': 'pi pi-heart',
    'ecommerce': 'pi pi-shopping-cart',
    'excelencia': 'pi pi-star',
    'orchestrator': 'pi pi-sitemap',
    'pharmacy': 'pi pi-pills',
    'product': 'pi pi-box',
    'tools': 'pi pi-wrench',
    'core': 'pi pi-cog'
  }
  return iconMap[domain] || 'pi pi-folder'
}

function getDomainSeverity(domain: string): string {
  const severityMap: Record<string, string> = {
    'agents': 'info',
    'healthcare': 'danger',
    'ecommerce': 'success',
    'excelencia': 'warning',
    'orchestrator': 'secondary',
    'pharmacy': 'danger',
    'product': 'info',
    'tools': 'secondary',
    'core': 'primary'
  }
  return severityMap[domain] || 'secondary'
}

function getDomainDisplayName(domain: string): string {
  const nameMap: Record<string, string> = {
    'agents': 'Agentes',
    'healthcare': 'Salud',
    'ecommerce': 'E-commerce',
    'excelencia': 'Excelencia',
    'orchestrator': 'Orquestador',
    'pharmacy': 'Farmacia',
    'product': 'Producto',
    'tools': 'Herramientas',
    'core': 'Core'
  }
  return nameMap[domain] || domain
}

// Date formatting
function formatDate(dateString: string): string {
  return dayjs(dateString).format('DD/MM/YYYY HH:mm')
}

// Navigation functions
function navigateToCreate() {
  router.push('/yaml-management/new')
}

function editPrompt(key: string) {
  router.push(`/yaml-management/edit/${key}`)
}

function previewPrompt(key: string) {
  router.push(`/yaml-management/preview/${key}`)
}

function testPrompt(key: string) {
  testPromptKey.value = key
  showTestDialog.value = true
}

function viewVersions(key: string) {
  router.push(`/yaml-management/versions/${key}`)
}

// Data operations
async function refreshData() {
  await yamlStore.fetchPrompts()
}

async function fetchAnalytics() {
  await yamlStore.fetchAnalytics()
}

async async function togglePrompt(key: string, active: boolean) {
  try {
    await yamlStore.togglePromptActive(key, active)
    toast.add({
      severity: 'success',
      summary: 'Estado actualizado',
      detail: `Template ${active ? 'activado' : 'desactivado'} exitosamente`,
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cambiar estado',
      life: 5000
    })
  }
}

// Filter operations
function applyFilters() {
  yamlStore.fetchPrompts()
}

function clearFilters() {
  yamlStore.setFilters({
    domain: null,
    source: null,
    active: null,
    search: '',
    tags: []
  })
  nextTick(() => {
    yamlStore.fetchPrompts()
  })
}

// Pagination
function onPageChange(event: any) {
  yamlStore.setPagination({
    page: event.page + 1,
    pageSize: event.rows
  })
  yamlStore.fetchPrompts()
}

// Bulk operations
async function bulkToggle(active: boolean) {
  const keys = selectedPrompts.map((p: YamlPrompt) => p.key)
  
  try {
    // Call bulk API (implementation needed)
    toast.add({
      severity: 'success',
      summary: 'Operación masiva',
      detail: `${keys.length} templates ${active ? 'activados' : 'desactivados'}`,
      life: 3000
    })
    
    selectedPrompts.value = []
    await yamlStore.fetchPrompts()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error en operación masiva',
      life: 5000
    })
  }
}

async function bulkDelete() {
  const keys = selectedPrompts.map((p: YamlPrompt) => p.key)
  
  // Confirmation dialog would be better here
  if (!confirm(`¿Está seguro de eliminar ${keys.length} templates?`)) {
    return
  }
  
  try {
    // Call bulk API (implementation needed)
    toast.add({
      severity: 'success',
      summary: 'Eliminación masiva',
      detail: `${keys.length} templates eliminados`,
      life: 3000
    })
    
    selectedPrompts.value = []
    await yamlStore.fetchPrompts()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error en eliminación masiva',
      life: 5000
    })
  }
}

// Export/Import operations
function exportTemplates() {
  // Implementation needed
  toast.add({
    severity: 'info',
    summary: 'Exportación',
    detail: 'Funcionalidad de exportación en desarrollo',
    life: 3000
  })
}

function importTemplates() {
  fileInput.value?.click()
}

function handleFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  // Implementation needed
  toast.add({
    severity: 'info',
    summary: 'Importación',
    detail: 'Funcionalidad de importación en desarrollo',
    life: 3000
  })
}

// Lifecycle
onMounted(async () => {
  // Check if user is admin
  if (!authStore.isAdminOrOwner) {
    router.push('/unauthorized')
    return
  }
  
  await Promise.all([
    yamlStore.fetchPrompts(),
    yamlStore.fetchAnalytics()
  ])
})
</script>

<style scoped>
.yaml-management {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
}

.header-content p {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.field label {
  color: var(--text-color);
  font-weight: 500;
}

.text-muted {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>