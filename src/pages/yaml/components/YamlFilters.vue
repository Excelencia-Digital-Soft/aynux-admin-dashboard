<template>
  <Card class="mb-4">
    <CardContent class="p-4">
      <div class="flex items-center gap-2 mb-4">
        <Filter class="h-4 w-4" />
        <span class="font-semibold text-sm">Filtros</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Dominio</label>
          <Select
            :model-value="filters.domain ?? '__all__'"
            @update:model-value="(v: string) => { filters.domain = v === '__all__' ? null : v }"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Todos los dominios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los dominios</SelectItem>
              <SelectItem
                v-for="opt in domainOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Origen</label>
          <Select
            :model-value="filters.source ?? '__all__'"
            @update:model-value="(v: string) => { filters.source = v === '__all__' ? null : v as 'file' | 'database' }"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Todos los origenes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los origenes</SelectItem>
              <SelectItem value="file">Archivo</SelectItem>
              <SelectItem value="database">Base de Datos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Estado</label>
          <Select
            :model-value="filters.active === null ? '__all__' : String(filters.active)"
            @update:model-value="(v: string) => { filters.active = v === '__all__' ? null : v === 'true' }"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Buscar</label>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="filters.search"
              placeholder="Buscar por nombre, key..."
              class="pl-9 w-full"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-4">
        <span class="text-sm text-muted-foreground">
          Mostrando {{ currentItemsCount }} de {{ totalCount }} {{ typeLabel }}
        </span>
        <Button
          variant="secondary"
          size="sm"
          @click="clearFilters"
        >
          <X class="mr-2 h-3.5 w-3.5" />
          Limpiar Filtros
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import { Filter, Search, X } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const yamlStore = useYamlStore()
const { filters, pagination, templateType, currentItems } = storeToRefs(yamlStore)

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
