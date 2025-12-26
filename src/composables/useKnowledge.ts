import { computed } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { knowledgeApi } from '@/api/knowledge.api'
import { useToast } from '@/composables/useToast'
import type { Document, DocumentCreateRequest, DocumentUpdateRequest } from '@/types/document.types'

export function useKnowledge() {
  const store = useKnowledgeStore()
  const toast = useToast()

  // Computed from store
  const documents = computed(() => store.documents)
  const totalDocuments = computed(() => store.totalDocuments)
  const currentPage = computed(() => store.currentPage)
  const pageSize = computed(() => store.pageSize)
  const isLoading = computed(() => store.isLoading)
  const filters = computed(() => store.filters)

  /**
   * Fetch documents with current filters
   */
  async function fetchDocuments() {
    store.setLoading(true)
    store.setError(null)

    try {
      const response = await knowledgeApi.list({
        documentType: store.filters.documentType,
        category: store.filters.category,
        activeOnly: store.filters.activeOnly,
        page: store.currentPage,
        pageSize: store.pageSize
      })
      store.setDocuments(response.documents, response.total)
    } catch (error) {
      store.setError('Error al cargar documentos')
      toast.error('Error al cargar documentos')
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Create new document
   */
  async function createDocument(data: DocumentCreateRequest): Promise<Document | null> {
    store.setLoading(true)
    try {
      const doc = await knowledgeApi.create(data)
      toast.success('Documento creado correctamente')
      await fetchDocuments()
      return doc
    } catch (error) {
      toast.error('Error al crear documento')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Update document
   */
  async function updateDocument(
    id: string,
    data: DocumentUpdateRequest,
    regenerateEmbedding = true
  ): Promise<boolean> {
    store.setLoading(true)
    try {
      const updated = await knowledgeApi.update(id, data, regenerateEmbedding)
      store.updateDocumentInList(updated)
      store.finishEditing()
      toast.success('Documento actualizado')
      return true
    } catch (error) {
      toast.error('Error al actualizar documento')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Delete document (soft)
   */
  async function deleteDocument(id: string): Promise<boolean> {
    try {
      await knowledgeApi.delete(id, false)
      store.removeDocumentFromList(id)
      store.cancelDelete(id)
      toast.success('Documento desactivado')
      return true
    } catch (error) {
      toast.error('Error al desactivar documento')
      return false
    }
  }

  /**
   * Delete document (hard)
   */
  async function hardDeleteDocument(id: string): Promise<boolean> {
    try {
      await knowledgeApi.delete(id, true)
      store.removeDocumentFromList(id)
      store.cancelHardDelete()
      toast.success('Documento eliminado permanentemente')
      return true
    } catch (error) {
      toast.error('Error al eliminar documento')
      return false
    }
  }

  /**
   * Upload PDF
   */
  async function uploadPdf(
    file: File,
    metadata: {
      title?: string
      documentType: string
      category?: string
      tags?: string
    }
  ): Promise<Document | null> {
    store.setLoading(true)
    try {
      const doc = await knowledgeApi.uploadPdf(file, metadata)
      toast.success('PDF subido correctamente')
      await fetchDocuments()
      return doc
    } catch (error) {
      toast.error('Error al subir PDF')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Regenerate embedding for a document
   */
  async function regenerateEmbedding(id: string): Promise<boolean> {
    try {
      await knowledgeApi.regenerateEmbedding(id)
      toast.success('Embedding regenerado')
      return true
    } catch (error) {
      toast.error('Error al regenerar embedding')
      return false
    }
  }

  /**
   * Batch update documents
   */
  async function batchUpdate(
    docIds: string[],
    updateData: Partial<DocumentUpdateRequest>
  ): Promise<boolean> {
    store.setLoading(true)
    try {
      const result = await knowledgeApi.batchUpdate(docIds, updateData)
      if (result.failed > 0) {
        toast.warn(`${result.processed} actualizados, ${result.failed} fallaron`)
      }
      await fetchDocuments()
      return result.success
    } catch (error) {
      toast.error('Error en actualizacion batch')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Batch delete documents
   */
  async function batchDelete(docIds: string[], hardDelete = false): Promise<boolean> {
    store.setLoading(true)
    try {
      const result = await knowledgeApi.batchDelete(docIds, hardDelete)
      if (result.failed > 0) {
        toast.warn(`${result.processed} eliminados, ${result.failed} fallaron`)
      }
      await fetchDocuments()
      return result.success
    } catch (error) {
      toast.error('Error en eliminacion batch')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Batch regenerate embeddings
   */
  async function batchRegenerateEmbeddings(docIds: string[]): Promise<boolean> {
    store.setLoading(true)
    try {
      const result = await knowledgeApi.batchRegenerateEmbeddings(docIds)
      if (result.failed > 0) {
        toast.warn(`${result.processed} regenerados, ${result.failed} fallaron`)
      }
      await fetchDocuments()
      return result.success
    } catch (error) {
      toast.error('Error regenerando embeddings')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Sync all embeddings
   */
  async function syncAllEmbeddings(): Promise<{ synced: number; failed: number } | null> {
    store.setLoading(true)
    try {
      const result = await knowledgeApi.syncAllEmbeddings()
      if (result.failed > 0) {
        toast.warn(`${result.synced} sincronizados, ${result.failed} fallaron`)
      } else {
        toast.success(`${result.synced} embeddings sincronizados`)
      }
      await fetchDocuments()
      return result
    } catch (error) {
      toast.error('Error sincronizando embeddings')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Get knowledge stats
   */
  async function getStats() {
    try {
      return await knowledgeApi.getStats()
    } catch (error) {
      toast.error('Error obteniendo estadisticas')
      return null
    }
  }

  /**
   * Change page
   */
  function changePage(page: number) {
    store.setPage(page)
    fetchDocuments()
  }

  /**
   * Change page size
   */
  function changePageSize(size: number) {
    store.setPageSize(size)
    fetchDocuments()
  }

  /**
   * Apply filters
   */
  function applyFilters(newFilters: {
    documentType?: string
    category?: string
    activeOnly?: boolean
  }) {
    store.setFilters(newFilters)
    fetchDocuments()
  }

  /**
   * Reset filters
   */
  function resetFilters() {
    store.resetFilters()
    fetchDocuments()
  }

  return {
    // State
    documents,
    totalDocuments,
    currentPage,
    pageSize,
    isLoading,
    filters,

    // Store actions (delegated)
    startEditing: store.startEditing,
    cancelEditing: store.cancelEditing,
    requestDelete: store.requestDelete,
    cancelDelete: store.cancelDelete,
    requestHardDelete: store.requestHardDelete,
    cancelHardDelete: store.cancelHardDelete,
    toggleSelection: store.toggleSelection,
    selectAll: store.selectAll,
    clearSelection: store.clearSelection,

    // Actions
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    hardDeleteDocument,
    uploadPdf,
    regenerateEmbedding,
    batchUpdate,
    batchDelete,
    batchRegenerateEmbeddings,
    syncAllEmbeddings,
    getStats,
    changePage,
    changePageSize,
    applyFilters,
    resetFilters
  }
}
