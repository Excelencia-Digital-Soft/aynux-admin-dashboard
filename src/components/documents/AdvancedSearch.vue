<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSearch, type SearchSource } from '@/composables/useSearch'
import { getTypeOptions, getTypeLabel } from '@/utils/constants'
import type { DocumentContext } from '@/types/document.types'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'

interface Props {
  context?: DocumentContext
  maxResults?: number
  source?: string
  agentKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  context: 'global',
  maxResults: 10,
  source: 'all',
  agentKey: ''
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const {
  query,
  results,
  isSearching,
  hasResults,
  hasQuery,
  documentType,
  search,
  clearSearch,
  setSource
} = useSearch({
  maxResults: props.maxResults,
  autoSearch: false,
  source: props.source as SearchSource,
  agentKey: props.agentKey
})

// Watch for source/agentKey prop changes and update the search context
watch(
  () => [props.source, props.agentKey],
  ([newSource, newAgentKey]) => {
    setSource(newSource as SearchSource, newAgentKey)
  }
)

const typeOptions = computed(() => [
  { value: undefined, label: 'Todos los tipos' },
  ...getTypeOptions(props.context)
])

// Context-aware placeholder
const searchPlaceholder = computed(() => {
  if (props.source === 'agent' && props.agentKey) {
    return `Buscar en documentos del agente ${props.agentKey}...`
  }
  return 'Buscar en la base de conocimiento...'
})

// Hide type filter for agent searches (simplified UI)
const showTypeFilter = computed(() => props.source !== 'agent')

function handleSearch() {
  if (hasQuery.value) {
    search()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

function handleSelect(id: string) {
  emit('select', id)
}

function formatSimilarity(similarity: number): string {
  return `${Math.round(similarity * 100)}%`
}

function getSimilaritySeverity(similarity: number): 'success' | 'info' | 'warn' | 'danger' {
  if (similarity >= 0.8) return 'success'
  if (similarity >= 0.6) return 'info'
  if (similarity >= 0.4) return 'warn'
  return 'danger'
}
</script>

<template>
  <div class="advanced-search">
    <!-- Search form -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <div class="p-inputgroup">
          <InputText
            v-model="query"
            :placeholder="searchPlaceholder"
            class="w-full"
            @keydown="handleKeydown"
          />
          <Button
            icon="pi pi-search"
            :loading="isSearching"
            @click="handleSearch"
          />
        </div>
      </div>
      <Select
        v-if="showTypeFilter"
        v-model="documentType"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo"
        class="w-48"
      />
      <Button
        v-if="hasResults || query"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="clearSearch"
        v-tooltip="'Limpiar busqueda'"
      />
    </div>

    <!-- Loading state -->
    <div v-if="isSearching" class="py-4">
      <ProgressBar mode="indeterminate" style="height: 4px" />
      <p class="text-center text-gray-500 mt-2">Buscando documentos...</p>
    </div>

    <!-- Results -->
    <div v-else-if="hasResults" class="space-y-3">
      <p class="text-sm text-gray-500 mb-2">
        {{ results.length }} resultado{{ results.length !== 1 ? 's' : '' }} encontrado{{ results.length !== 1 ? 's' : '' }}
      </p>

      <Card
        v-for="result in results"
        :key="result.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="handleSelect(result.id)"
      >
        <template #content>
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-gray-900 truncate">{{ result.title }}</h4>
                <Tag
                  :value="formatSimilarity(result.similarity)"
                  :severity="getSimilaritySeverity(result.similarity)"
                  class="text-xs"
                />
              </div>
              <p class="text-sm text-gray-500 line-clamp-2">
                {{ result.snippet || result.content }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs text-gray-400">
                  {{ getTypeLabel(result.document_type) }}
                </span>
                <span v-if="result.category" class="text-xs text-gray-400">
                  &bull; {{ result.category }}
                </span>
              </div>
            </div>
            <Button
              icon="pi pi-arrow-right"
              severity="secondary"
              text
              rounded
              size="small"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- No results -->
    <div v-else-if="query && !isSearching" class="text-center py-8 text-gray-500">
      <i class="pi pi-search text-4xl mb-2" />
      <p v-if="!hasQuery">Ingresa al menos 2 caracteres para buscar</p>
      <p v-else>No se encontraron resultados para "{{ query }}"</p>
    </div>

    <!-- Initial state -->
    <div v-else class="text-center py-8 text-gray-400">
      <i class="pi pi-search text-4xl mb-2" />
      <p>Busca documentos por contenido semantico</p>
      <p class="text-sm mt-1">La busqueda utiliza embeddings para encontrar documentos similares</p>
    </div>
  </div>
</template>

<style scoped>
.advanced-search :deep(.p-card-content) {
  padding: 0.75rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
