<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSearch, type SearchSource } from '@/composables/useSearch'
import { getTypeOptions, getTypeLabel } from '@/utils/constants'
import type { DocumentContext } from '@/types/document.types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

watch(
  () => [props.source, props.agentKey],
  ([newSource, newAgentKey]) => {
    setSource(newSource as SearchSource, newAgentKey)
  }
)

const typeOptions = computed(() => [
  { value: '', label: 'Todos los tipos' },
  ...getTypeOptions(props.context)
])

const searchPlaceholder = computed(() => {
  if (props.source === 'agent' && props.agentKey) {
    return `Buscar en documentos del agente ${props.agentKey}...`
  }
  return 'Buscar en la base de conocimiento...'
})

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

function getSimilarityVariant(similarity: number): 'success' | 'info' | 'warning' | 'destructive' {
  if (similarity >= 0.8) return 'success'
  if (similarity >= 0.6) return 'info'
  if (similarity >= 0.4) return 'warning'
  return 'destructive'
}
</script>

<template>
  <div class="advanced-search">
    <!-- Search form -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1 flex">
        <Input
          v-model="query"
          :placeholder="searchPlaceholder"
          class="rounded-r-none"
          @keydown="handleKeydown"
        />
        <Button
          class="rounded-l-none"
          :loading="isSearching"
          @click="handleSearch"
        >
          <i class="pi pi-search" />
        </Button>
      </div>
      <Select
        v-if="showTypeFilter"
        :model-value="documentType || ''"
        @update:model-value="(val: string) => documentType = val || undefined"
      >
        <SelectTrigger class="w-48">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in typeOptions" :key="String(opt.value)" :value="String(opt.value)">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        v-if="hasResults || query"
        variant="outline"
        @click="clearSearch"
        title="Limpiar busqueda"
      >
        <i class="pi pi-times" />
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isSearching" class="py-4">
      <div class="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full animate-indeterminate" />
      </div>
      <p class="text-center text-muted-foreground mt-2">Buscando documentos...</p>
    </div>

    <!-- Results -->
    <div v-else-if="hasResults" class="space-y-3">
      <p class="text-sm text-muted-foreground mb-2">
        {{ results.length }} resultado{{ results.length !== 1 ? 's' : '' }} encontrado{{ results.length !== 1 ? 's' : '' }}
      </p>

      <Card
        v-for="result in results"
        :key="result.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="handleSelect(result.id)"
      >
        <CardContent class="p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium truncate">{{ result.title }}</h4>
                <Badge :variant="getSimilarityVariant(result.similarity)" class="text-xs">
                  {{ formatSimilarity(result.similarity) }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground line-clamp-2">
                {{ result.snippet || result.content }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs text-muted-foreground">
                  {{ getTypeLabel(result.document_type) }}
                </span>
                <span v-if="result.category" class="text-xs text-muted-foreground">
                  &bull; {{ result.category }}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" class="shrink-0">
              <i class="pi pi-arrow-right text-sm" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- No results -->
    <div v-else-if="query && !isSearching" class="text-center py-8 text-muted-foreground">
      <i class="pi pi-search text-4xl mb-2 block" />
      <p v-if="!hasQuery">Ingresa al menos 2 caracteres para buscar</p>
      <p v-else>No se encontraron resultados para "{{ query }}"</p>
    </div>

    <!-- Initial state -->
    <div v-else class="text-center py-8 text-muted-foreground">
      <i class="pi pi-search text-4xl mb-2 block" />
      <p>Busca documentos por contenido semantico</p>
      <p class="text-sm mt-1">La busqueda utiliza embeddings para encontrar documentos similares</p>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); width: 50%; }
  50% { transform: translateX(50%); width: 30%; }
  100% { transform: translateX(200%); width: 50%; }
}

.animate-indeterminate {
  animation: indeterminate 1.5s ease-in-out infinite;
}
</style>
