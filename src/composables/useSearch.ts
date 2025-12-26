import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { SearchResult } from '@/types/document.types'
import { knowledgeApi } from '@/api/knowledge.api'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { useToast } from '@/composables/useToast'

export type SearchSource = 'all' | 'global' | 'tenant' | 'agent'

export interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  maxResults?: number
  autoSearch?: boolean
  source?: SearchSource
  agentKey?: string
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 10,
    autoSearch = false,
    source: initialSource = 'all',
    agentKey: initialAgentKey = ''
  } = options

  const toast = useToast()

  const query = ref('')
  const results = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const error = ref<string | null>(null)
  const lastSearchedQuery = ref('')

  // Source and agent context
  const source = ref<SearchSource>(initialSource)
  const agentKey = ref(initialAgentKey)

  // Filters
  const documentType = ref<string | undefined>(undefined)
  const category = ref<string | undefined>(undefined)

  const hasResults = computed(() => results.value.length > 0)
  const hasQuery = computed(() => query.value.length >= minQueryLength)
  const canSearch = computed(() => hasQuery.value && !isSearching.value)

  async function performSearch() {
    if (!hasQuery.value) {
      results.value = []
      return
    }

    isSearching.value = true
    error.value = null

    try {
      let searchResults: SearchResult[]

      // Use agent-specific search when source is 'agent' and agentKey is set
      if (source.value === 'agent' && agentKey.value) {
        const response = await agentKnowledgeApi.search(agentKey.value, {
          query: query.value,
          maxResults: maxResults,
          minSimilarity: 0.3 // Lower threshold to be more permissive
        })
        // Normalize agent search results to match SearchResult type
        searchResults = response.results.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          document_type: r.document_type,
          category: r.category,
          similarity: r.similarity_score, // Map similarity_score to similarity
          snippet: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : '')
        }))
      } else {
        // Use global knowledge search
        searchResults = await knowledgeApi.search({
          query: query.value,
          max_results: maxResults,
          document_type: documentType.value,
          category: category.value
        })
      }

      results.value = searchResults
      lastSearchedQuery.value = query.value
    } catch (err) {
      error.value = 'Error al buscar documentos'
      toast.error('Error al realizar la busqueda')
      results.value = []
    } finally {
      isSearching.value = false
    }
  }

  const debouncedSearch = useDebounceFn(performSearch, debounceMs)

  function search() {
    if (canSearch.value) {
      performSearch()
    }
  }

  function clearSearch() {
    query.value = ''
    results.value = []
    lastSearchedQuery.value = ''
    error.value = null
  }

  function setFilters(filters: { documentType?: string; category?: string }) {
    if (filters.documentType !== undefined) {
      documentType.value = filters.documentType || undefined
    }
    if (filters.category !== undefined) {
      category.value = filters.category || undefined
    }
  }

  function resetFilters() {
    documentType.value = undefined
    category.value = undefined
  }

  function setSource(newSource: SearchSource, newAgentKey?: string) {
    source.value = newSource
    if (newAgentKey !== undefined) {
      agentKey.value = newAgentKey
    }
    // Clear results when source changes
    results.value = []
    lastSearchedQuery.value = ''
  }

  // Auto-search on query change if enabled
  if (autoSearch) {
    watch(query, (newQuery) => {
      if (newQuery.length >= minQueryLength) {
        debouncedSearch()
      } else {
        results.value = []
      }
    })
  }

  return {
    // State
    query,
    results,
    isSearching,
    error,
    lastSearchedQuery,
    documentType,
    category,
    source,
    agentKey,

    // Computed
    hasResults,
    hasQuery,
    canSearch,

    // Actions
    search,
    performSearch,
    debouncedSearch,
    clearSearch,
    setFilters,
    resetFilters,
    setSource
  }
}
