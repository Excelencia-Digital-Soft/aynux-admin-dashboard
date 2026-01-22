<template>
  <Card class="mb-4">
    <template #title>
      <i class="pi pi-filter"></i>
      Filtros
    </template>
    <template #content>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="field">
          <label for="domain" class="block text-sm font-medium mb-2">Dominio</label>
          <Select
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
          <Select
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
          <Select
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
          <IconField class="w-full">
            <InputIcon class="pi pi-search" />
            <InputText
              id="search"
              v-model="filters.search"
              placeholder="Buscar por nombre, key o descripción..."
              class="w-full"
            />
          </IconField>
        </div>
      </div>
      
      <div class="flex justify-between items-center mt-4">
        <span class="text-sm text-muted">
          Mostrando {{ currentItemsCount }} de {{ totalCount }} {{ typeLabel }}
        </span>
        <Button
          @click="clearFilters"
          icon="pi pi-times"
          label="Limpiar Filtros"
          severity="secondary"
          size="small"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const yamlStore = useYamlStore()
const { filters, pagination, templateType, currentItems } = storeToRefs(yamlStore)

// Helper for domains options (needs to be computed based on current type's domains)
// We need to access the correct domains list from the store based on type
const currentDomains = computed(() => {
  if (templateType.value === 'formatter') return yamlStore.formatterDomains
  if (templateType.value === 'task') return yamlStore.taskDomains
  return yamlStore.domains
})

const domainOptions = computed(() => [
  ...(currentDomains.value || []).map((domain: string) => ({
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

const currentItemsCount = computed(() => currentItems.value.length)
const totalCount = computed(() => pagination.value.total)
const typeLabel = computed(() => templateType.value === 'task' ? 'tasks' : 'templates')

function clearFilters() {
  yamlStore.setFilters({
    domain: null,
    source: null,
    active: null,
    search: '',
    tags: []
  })
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
</script>

<style scoped>
.field label {
  color: var(--text-color);
  font-weight: 500;
}

.text-muted {
  color: var(--text-color-secondary);
}
</style>
