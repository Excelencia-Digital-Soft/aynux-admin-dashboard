<template>
  <Card>
    <template #title>
      <div class="flex justify-between items-center">
        <span>
          <i :class="isTask ? 'pi pi-list' : 'pi pi-code'"></i>
          {{ isTask ? 'Tasks de Chatbot' : 'Templates YAML' }}
        </span>
        <div class="flex items-center space-x-2">
          <Button
            @click="$emit('refresh')"
            icon="pi pi-refresh"
            size="small"
            severity="secondary"
            :loading="loading"
          />
          <Button
            @click="$emit('fetch-analytics')"
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
        :value="currentItems"
        :loading="loading"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="pagination.pageSize"
        :totalRecords="pagination.total"
        :first="(pagination.page - 1) * pagination.pageSize"
        @page="onPageChange"
        dataKey="key"
        v-model:selection="selectedItems"
        selectionMode="multiple"
        :globalFilterFields="['key', 'name', 'description']"
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

        <!-- Domain column (Prompts only) -->
        <Column v-if="!isTask" field="metadata.domain" header="Dominio" sortable>
          <template #body="{data}">
            <Tag
              :value="data.metadata?.domain"
              :icon="getDomainIcon(data.metadata?.domain)"
              :severity="getDomainSeverity(data.metadata?.domain)"
            />
          </template>
        </Column>

        <!-- Critical column (Tasks only) -->
        <Column v-if="isTask" field="metadata.is_critical" header="Crítico">
          <template #body="{data}">
            <Tag
              v-if="data.metadata?.is_critical"
              value="Crítico"
              severity="danger"
              icon="pi pi-exclamation-triangle"
            />
            <span v-else class="text-muted">-</span>
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

        <!-- Lock column (Prompts only) -->
        <Column v-if="!isTask" field="locked_by" header="Bloqueo">
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
                @click.exact="$emit('edit', data.key)"
                @click.ctrl="$emit('edit-new-tab', data.key)"
                @click.meta="$emit('edit-new-tab', data.key)"
                icon="pi pi-pencil"
                size="small"
                severity="secondary"
                :disabled="!isTask && !!isPromptLocked(data.key)"
                v-tooltip="'Editar (Ctrl+click: nueva pestaña)'"
              />
              <Button
                @click="$emit('preview', data.key)"
                icon="pi pi-eye"
                size="small"
                severity="info"
                v-tooltip="'Vista previa'"
              />
              <Button
                @click="$emit('test', data.key)"
                icon="pi pi-play"
                size="small"
                severity="help"
                v-tooltip="'Test'"
              />
              <Button
                v-if="!isTask"
                @click="$emit('versions', data.key)"
                icon="pi pi-history"
                size="small"
                severity="secondary"
                v-tooltip="'Historial'"
              />
              <Button
                v-if="!isTask"
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
      <div v-if="selectedItems.length > 0" class="mt-4 p-3 border border-200 border-round surface-100">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium">
            {{ selectedItems.length }} {{ isTask ? 'task(s)' : 'template(s)' }} seleccionado(s)
          </span>
          <div class="flex space-x-2">
            <Button
              v-if="!isTask"
              @click="bulkToggle(true)"
              icon="pi pi-check"
              label="Activar seleccionados"
              size="small"
              severity="success"
            />
            <Button
              v-if="!isTask"
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import type { YamlPrompt, YamlTask, YamlFormatter } from '@/types/yaml.types'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'fetch-analytics'): void
  (e: 'edit', key: string): void
  (e: 'edit-new-tab', key: string): void
  (e: 'preview', key: string): void
  (e: 'test', key: string): void
  (e: 'versions', key: string): void
}>()

const yamlStore = useYamlStore()
const { confirmDelete } = useConfirm()
const toast = useToast()

const { 
  loading, 
  currentItems, 
  pagination, 
  templateType, 
  isPromptLocked, 
  lockingUser 
} = storeToRefs(yamlStore)

const selectedItems = ref<(YamlPrompt | YamlTask | YamlFormatter)[]>([])

const isTask = computed(() => templateType.value === 'task')

// Handlers
function onPageChange(event: any) {
  yamlStore.setPagination({
    page: event.page + 1,
    pageSize: event.rows
  })
  emit('refresh')
}

async function togglePrompt(key: string, active: boolean) {
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

async function bulkToggle(active: boolean) {
  const keys = selectedItems.value.map((p) => p.key)

  try {
    // Call bulk API (implementation needed - reusing logic pattern)
    // For now we loop as in original code
    await Promise.all(keys.map(key => yamlStore.togglePromptActive(key, active)))
    
    toast.add({
      severity: 'success',
      summary: 'Operación masiva',
      detail: `${keys.length} templates ${active ? 'activados' : 'desactivados'}`,
      life: 3000
    })

    selectedItems.value = []
    emit('refresh')
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
  const keys = selectedItems.value.map((p) => p.key)
  const itemType = isTask.value ? 'tasks' : 'templates'

  const confirmed = await confirmDelete(
    `¿Está seguro de eliminar ${keys.length} ${itemType}?`
  )
  if (!confirmed) return

  try {
    // Call bulk API (implementation needed)
    // Reusing logic: loop delete
    if (isTask.value) {
      await Promise.all(keys.map(key => yamlStore.deleteTask(key)))
    } else if (templateType.value === 'formatter') {
      await Promise.all(keys.map(key => yamlStore.deleteFormatter(key)))
    } else {
      await Promise.all(keys.map(key => yamlStore.deletePrompt(key)))
    }

    toast.add({
      severity: 'success',
      summary: 'Eliminación masiva',
      detail: `${keys.length} ${itemType} eliminados`,
      life: 3000
    })

    selectedItems.value = []
    emit('refresh')
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error en eliminación masiva',
      life: 5000
    })
  }
}

// Helpers
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const formatted = dayjs(dateString).format('DD/MM/YYYY HH:mm')
  return formatted === 'Invalid Date' ? '-' : formatted
}

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
</script>

<style scoped>
.text-muted {
  color: var(--text-color-secondary);
}
</style>
