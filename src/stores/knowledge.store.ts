import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Document,
  DocumentUpdateRequest,
  SearchResult,
  DocumentFilter
} from '@/types/document.types'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'

export const useKnowledgeStore = defineStore('knowledge', () => {
  // State
  const documents = ref<Document[]>([])
  const totalDocuments = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Editing state
  const editingDocId = ref<string | null>(null)
  const editData = ref<Partial<Document>>({})

  // Search state
  const searchQuery = ref('')
  const searchResults = ref<SearchResult[]>([])
  const isSearching = ref(false)

  // Delete confirmation state
  const confirmDelete = ref<Record<string, boolean>>({})
  const confirmHardDelete = ref<string | null>(null)

  // Selection state (for batch operations)
  const selectedDocIds = ref<Set<string>>(new Set())

  // Filters
  const filters = ref<DocumentFilter>({
    documentType: undefined,
    category: undefined,
    activeOnly: true,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  })

  // Computed
  const totalPages = computed(() => Math.ceil(totalDocuments.value / pageSize.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)
  const selectedCount = computed(() => selectedDocIds.value.size)
  const isEditing = computed(() => editingDocId.value !== null)

  // Actions
  function setDocuments(docs: Document[], total: number) {
    documents.value = docs
    totalDocuments.value = total
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function setPage(page: number) {
    currentPage.value = page
    filters.value.page = page
  }

  function setPageSize(size: number) {
    pageSize.value = size
    filters.value.pageSize = size
    currentPage.value = 1
    filters.value.page = 1
  }

  function setFilters(newFilters: Partial<DocumentFilter>) {
    filters.value = { ...filters.value, ...newFilters }
    if (newFilters.documentType !== undefined || newFilters.category !== undefined) {
      currentPage.value = 1
      filters.value.page = 1
    }
  }

  function resetFilters() {
    filters.value = {
      documentType: undefined,
      category: undefined,
      activeOnly: true,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE
    }
    currentPage.value = 1
  }

  // Editing actions
  function startEditing(docId: string, data: Document) {
    editingDocId.value = docId
    editData.value = { ...data }
  }

  function updateEditData(updates: Partial<Document>) {
    editData.value = { ...editData.value, ...updates }
  }

  function cancelEditing() {
    editingDocId.value = null
    editData.value = {}
  }

  function finishEditing() {
    editingDocId.value = null
    editData.value = {}
  }

  // Search actions
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setSearchResults(results: SearchResult[]) {
    searchResults.value = results
  }

  function setSearching(searching: boolean) {
    isSearching.value = searching
  }

  function clearSearch() {
    searchQuery.value = ''
    searchResults.value = []
  }

  // Delete confirmation actions
  function requestDelete(docId: string) {
    confirmDelete.value = { ...confirmDelete.value, [docId]: true }
  }

  function cancelDelete(docId: string) {
    const { [docId]: _, ...rest } = confirmDelete.value
    confirmDelete.value = rest
  }

  function requestHardDelete(docId: string) {
    confirmHardDelete.value = docId
  }

  function cancelHardDelete() {
    confirmHardDelete.value = null
  }

  // Selection actions
  function toggleSelection(docId: string) {
    if (selectedDocIds.value.has(docId)) {
      selectedDocIds.value.delete(docId)
    } else {
      selectedDocIds.value.add(docId)
    }
    selectedDocIds.value = new Set(selectedDocIds.value)
  }

  function selectAll() {
    documents.value.forEach((doc) => selectedDocIds.value.add(doc.id))
    selectedDocIds.value = new Set(selectedDocIds.value)
  }

  function clearSelection() {
    selectedDocIds.value = new Set()
  }

  function isSelected(docId: string): boolean {
    return selectedDocIds.value.has(docId)
  }

  // Update document in list
  function updateDocumentInList(updatedDoc: Document) {
    const index = documents.value.findIndex((d) => d.id === updatedDoc.id)
    if (index !== -1) {
      documents.value[index] = updatedDoc
    }
  }

  // Remove document from list
  function removeDocumentFromList(docId: string) {
    documents.value = documents.value.filter((d) => d.id !== docId)
    totalDocuments.value = Math.max(0, totalDocuments.value - 1)
    selectedDocIds.value.delete(docId)
  }

  return {
    // State
    documents,
    totalDocuments,
    currentPage,
    pageSize,
    isLoading,
    error,
    editingDocId,
    editData,
    searchQuery,
    searchResults,
    isSearching,
    confirmDelete,
    confirmHardDelete,
    selectedDocIds,
    filters,

    // Computed
    totalPages,
    hasNextPage,
    hasPrevPage,
    selectedCount,
    isEditing,

    // Actions
    setDocuments,
    setLoading,
    setError,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    startEditing,
    updateEditData,
    cancelEditing,
    finishEditing,
    setSearchQuery,
    setSearchResults,
    setSearching,
    clearSearch,
    requestDelete,
    cancelDelete,
    requestHardDelete,
    cancelHardDelete,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    updateDocumentInList,
    removeDocumentFromList
  }
})

export type KnowledgeStore = ReturnType<typeof useKnowledgeStore>
