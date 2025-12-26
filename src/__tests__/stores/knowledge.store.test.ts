import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'

describe('Knowledge Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have default values', () => {
      const store = useKnowledgeStore()

      expect(store.documents).toEqual([])
      expect(store.totalDocuments).toBe(0)
      expect(store.currentPage).toBe(1)
      expect(store.pageSize).toBe(DEFAULT_PAGE_SIZE)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should have default filters', () => {
      const store = useKnowledgeStore()

      expect(store.filters).toEqual({
        documentType: undefined,
        category: undefined,
        activeOnly: true,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE
      })
    })
  })

  describe('setDocuments', () => {
    it('should set documents and total count', () => {
      const store = useKnowledgeStore()

      const docs = [
        {
          id: '1',
          title: 'Test Doc',
          content: 'Content',
          document_type: 'faq',
          active: true,
          has_embedding: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      store.setDocuments(docs, 10)

      expect(store.documents).toHaveLength(1)
      expect(store.documents[0].title).toBe('Test Doc')
      expect(store.totalDocuments).toBe(10)
    })
  })

  describe('setFilters', () => {
    it('should update filters and reset page when type/category changes', () => {
      const store = useKnowledgeStore()

      store.currentPage = 5
      store.setFilters({ documentType: 'faq' })

      expect(store.filters.documentType).toBe('faq')
      expect(store.currentPage).toBe(1)
    })

    it('should preserve other filters when updating', () => {
      const store = useKnowledgeStore()

      store.setFilters({ documentType: 'faq' })
      store.setFilters({ category: 'general' })

      expect(store.filters.documentType).toBe('faq')
      expect(store.filters.category).toBe('general')
    })
  })

  describe('setPage', () => {
    it('should update current page and filters.page', () => {
      const store = useKnowledgeStore()

      store.setPage(3)

      expect(store.currentPage).toBe(3)
      expect(store.filters.page).toBe(3)
    })
  })

  describe('setLoading', () => {
    it('should update loading state', () => {
      const store = useKnowledgeStore()

      expect(store.isLoading).toBe(false)

      store.setLoading(true)
      expect(store.isLoading).toBe(true)

      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('startEditing', () => {
    it('should set editing document with data', () => {
      const store = useKnowledgeStore()

      const doc = {
        id: '1',
        title: 'Test',
        content: 'Content',
        document_type: 'faq',
        active: true,
        has_embedding: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      store.startEditing('1', doc)

      expect(store.editingDocId).toBe('1')
      expect(store.editData.title).toBe('Test')
      expect(store.editData.content).toBe('Content')
    })
  })

  describe('finishEditing / cancelEditing', () => {
    it('should clear editing state', () => {
      const store = useKnowledgeStore()

      store.editingDocId = '1'
      store.editData = { title: 'Test' }

      store.finishEditing()

      expect(store.editingDocId).toBeNull()
      expect(store.editData).toEqual({})
    })

    it('cancelEditing should also clear editing state', () => {
      const store = useKnowledgeStore()

      store.editingDocId = '1'
      store.editData = { title: 'Test' }

      store.cancelEditing()

      expect(store.editingDocId).toBeNull()
      expect(store.editData).toEqual({})
    })
  })

  describe('updateDocumentInList', () => {
    it('should update document in list', () => {
      const store = useKnowledgeStore()

      store.documents = [
        {
          id: '1',
          title: 'Old Title',
          content: 'Content',
          document_type: 'faq',
          active: true,
          has_embedding: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      store.updateDocumentInList({
        id: '1',
        title: 'New Title',
        content: 'Content',
        document_type: 'faq',
        active: true,
        has_embedding: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      })

      expect(store.documents[0].title).toBe('New Title')
    })
  })

  describe('removeDocumentFromList', () => {
    it('should remove document from list', () => {
      const store = useKnowledgeStore()

      store.documents = [
        {
          id: '1',
          title: 'Doc 1',
          content: 'Content',
          document_type: 'faq',
          active: true,
          has_embedding: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          title: 'Doc 2',
          content: 'Content',
          document_type: 'faq',
          active: true,
          has_embedding: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      store.removeDocumentFromList('1')

      expect(store.documents).toHaveLength(1)
      expect(store.documents[0].id).toBe('2')
    })
  })

  describe('requestDelete / cancelDelete', () => {
    it('should manage delete confirmation state', () => {
      const store = useKnowledgeStore()

      expect(store.confirmDelete['doc1']).toBeUndefined()

      store.requestDelete('doc1')
      expect(store.confirmDelete['doc1']).toBe(true)

      store.cancelDelete('doc1')
      expect(store.confirmDelete['doc1']).toBeUndefined()
    })
  })

  describe('resetFilters', () => {
    it('should reset all filters to defaults', () => {
      const store = useKnowledgeStore()

      store.setFilters({
        documentType: 'faq',
        category: 'general',
        activeOnly: false
      })
      store.setPage(5)

      store.resetFilters()

      expect(store.filters).toEqual({
        documentType: undefined,
        category: undefined,
        activeOnly: true,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE
      })
      expect(store.currentPage).toBe(1)
    })
  })

  describe('computed properties', () => {
    it('totalPages should calculate correctly', () => {
      const store = useKnowledgeStore()

      store.totalDocuments = 100
      store.pageSize = 25

      expect(store.totalPages).toBe(4)
    })

    it('hasNextPage should return correct value', () => {
      const store = useKnowledgeStore()

      store.totalDocuments = 100
      store.pageSize = 25

      store.currentPage = 1
      expect(store.hasNextPage).toBe(true)

      store.currentPage = 4
      expect(store.hasNextPage).toBe(false)
    })

    it('hasPrevPage should return correct value', () => {
      const store = useKnowledgeStore()

      store.currentPage = 1
      expect(store.hasPrevPage).toBe(false)

      store.currentPage = 2
      expect(store.hasPrevPage).toBe(true)
    })
  })

  describe('selection actions', () => {
    it('should toggle selection', () => {
      const store = useKnowledgeStore()

      store.toggleSelection('doc1')
      expect(store.selectedDocIds.has('doc1')).toBe(true)
      expect(store.selectedCount).toBe(1)

      store.toggleSelection('doc1')
      expect(store.selectedDocIds.has('doc1')).toBe(false)
      expect(store.selectedCount).toBe(0)
    })

    it('should clear selection', () => {
      const store = useKnowledgeStore()

      store.toggleSelection('doc1')
      store.toggleSelection('doc2')
      expect(store.selectedCount).toBe(2)

      store.clearSelection()
      expect(store.selectedCount).toBe(0)
    })
  })
})
