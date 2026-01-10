import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAIModelsAdmin, providerOptions, typeOptions } from '@/composables/useAIModelsAdmin'

// Mock the AI models API
vi.mock('@/api/aiModels.api', () => ({
  aiModelsApi: {
    list: vi.fn(),
    toggle: vi.fn(),
    update: vi.fn(),
    seedExternal: vi.fn()
  }
}))

// Mock the toast composable
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    clear: vi.fn()
  })
}))

import { aiModelsApi } from '@/api/aiModels.api'

describe('useAIModelsAdmin', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const {
        models,
        loading,
        seeding,
        editDialogVisible,
        editingModel,
        filters,
        stats
      } = useAIModelsAdmin({ autoFetch: false })

      expect(models.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(seeding.value).toBe(false)
      expect(editDialogVisible.value).toBe(false)
      expect(editingModel.value).toBeNull()
      expect(filters.value).toEqual({
        provider: undefined,
        model_type: undefined,
        enabled_only: false
      })
      expect(stats.value).toEqual({ total: 0, enabled: 0, disabled: 0 })
    })

    it('should export provider and type options', () => {
      expect(providerOptions).toBeDefined()
      expect(providerOptions.length).toBeGreaterThan(0)
      expect(typeOptions).toBeDefined()
      expect(typeOptions.length).toBeGreaterThan(0)
    })
  })

  describe('fetchModels', () => {
    it('should fetch models successfully', async () => {
      const mockModels = [
        { id: '1', model_id: 'gpt-4', display_name: 'GPT-4', is_enabled: true },
        { id: '2', model_id: 'claude-3', display_name: 'Claude 3', is_enabled: false }
      ]
      vi.mocked(aiModelsApi.list).mockResolvedValue({
        models: mockModels,
        total: 2,
        enabled_count: 1,
        disabled_count: 1
      })

      const { fetchModels, models, loading, stats } = useAIModelsAdmin({ autoFetch: false })

      expect(loading.value).toBe(false)

      const fetchPromise = fetchModels()
      expect(loading.value).toBe(true)

      await fetchPromise

      expect(loading.value).toBe(false)
      expect(models.value).toEqual(mockModels)
      expect(stats.value.total).toBe(2)
      expect(stats.value.enabled).toBe(1)
      expect(stats.value.disabled).toBe(1)
    })

    it('should apply filters when fetching', async () => {
      vi.mocked(aiModelsApi.list).mockResolvedValue({ models: [], total: 0, enabled_count: 0, disabled_count: 0 })

      const { fetchModels, filters } = useAIModelsAdmin({ autoFetch: false })

      filters.value.provider = 'openai'
      filters.value.model_type = 'llm'
      filters.value.enabled_only = true

      await fetchModels()

      expect(aiModelsApi.list).toHaveBeenCalledWith({
        provider: 'openai',
        model_type: 'llm',
        enabled_only: true
      })
    })

    it('should handle fetch errors', async () => {
      vi.mocked(aiModelsApi.list).mockRejectedValue(new Error('API Error'))

      const { fetchModels, models, loading, error } = useAIModelsAdmin({ autoFetch: false })

      await fetchModels()

      expect(loading.value).toBe(false)
      expect(models.value).toEqual([])
      expect(error.value).toBe('No se pudieron cargar los modelos')
    })
  })

  describe('seedExternal', () => {
    it('should seed external models and refresh list', async () => {
      vi.mocked(aiModelsApi.seedExternal).mockResolvedValue({ added: 5, skipped: 2 })
      vi.mocked(aiModelsApi.list).mockResolvedValue({ models: [], total: 0, enabled_count: 0, disabled_count: 0 })

      const { seedExternal, seeding } = useAIModelsAdmin({ autoFetch: false })

      expect(seeding.value).toBe(false)

      const seedPromise = seedExternal()
      expect(seeding.value).toBe(true)

      await seedPromise

      expect(seeding.value).toBe(false)
      expect(aiModelsApi.seedExternal).toHaveBeenCalled()
      expect(aiModelsApi.list).toHaveBeenCalled() // Should refresh after seed
    })

    it('should handle seed errors', async () => {
      vi.mocked(aiModelsApi.seedExternal).mockRejectedValue(new Error('Seed failed'))

      const { seedExternal, seeding } = useAIModelsAdmin({ autoFetch: false })

      await seedExternal()

      expect(seeding.value).toBe(false)
    })
  })

  describe('toggleModel', () => {
    it('should toggle model enabled state', async () => {
      const originalModel = { id: '1', model_id: 'gpt-4', display_name: 'GPT-4', is_enabled: true }
      const toggledModel = { ...originalModel, is_enabled: false }
      vi.mocked(aiModelsApi.toggle).mockResolvedValue(toggledModel)

      const { toggleModel, models } = useAIModelsAdmin({ autoFetch: false })
      models.value = [originalModel]

      await toggleModel(originalModel)

      expect(aiModelsApi.toggle).toHaveBeenCalledWith('1')
      expect(models.value[0].is_enabled).toBe(false)
    })

    it('should handle toggle errors', async () => {
      vi.mocked(aiModelsApi.toggle).mockRejectedValue(new Error('Toggle failed'))

      const { toggleModel, models } = useAIModelsAdmin({ autoFetch: false })
      const model = { id: '1', model_id: 'gpt-4', display_name: 'GPT-4', is_enabled: true }
      models.value = [model]

      await toggleModel(model)

      // Model state should remain unchanged on error
      expect(models.value[0].is_enabled).toBe(true)
    })
  })

  describe('edit dialog', () => {
    it('should open edit dialog with model copy', () => {
      const { openEditDialog, editingModel, editDialogVisible } = useAIModelsAdmin({ autoFetch: false })

      const model = { id: '1', model_id: 'gpt-4', display_name: 'GPT-4', is_enabled: true }

      openEditDialog(model)

      expect(editDialogVisible.value).toBe(true)
      expect(editingModel.value).toEqual(model)
      expect(editingModel.value).not.toBe(model) // Should be a copy
    })

    it('should close edit dialog and clear model', () => {
      const { openEditDialog, closeEditDialog, editingModel, editDialogVisible } = useAIModelsAdmin({ autoFetch: false })

      const model = { id: '1', model_id: 'gpt-4', display_name: 'GPT-4', is_enabled: true }
      openEditDialog(model)

      closeEditDialog()

      expect(editDialogVisible.value).toBe(false)
      expect(editingModel.value).toBeNull()
    })
  })

  describe('saveModel', () => {
    it('should save model and update list', async () => {
      const originalModel = {
        id: '1',
        model_id: 'gpt-4',
        display_name: 'GPT-4',
        description: null,
        sort_order: 1,
        is_default: false,
        is_enabled: true
      }
      const updatedModel = { ...originalModel, display_name: 'GPT-4 Updated' }
      vi.mocked(aiModelsApi.update).mockResolvedValue(updatedModel)

      const { openEditDialog, saveModel, models, editDialogVisible, editingModel } = useAIModelsAdmin({ autoFetch: false })
      models.value = [originalModel]

      openEditDialog(originalModel)
      editingModel.value.display_name = 'GPT-4 Updated'

      const result = await saveModel()

      expect(result).toBe(true)
      expect(aiModelsApi.update).toHaveBeenCalledWith('1', {
        display_name: 'GPT-4 Updated',
        description: undefined,
        sort_order: 1,
        is_default: false
      })
      expect(models.value[0].display_name).toBe('GPT-4 Updated')
      expect(editDialogVisible.value).toBe(false)
    })

    it('should return false if no model is being edited', async () => {
      const { saveModel } = useAIModelsAdmin({ autoFetch: false })

      const result = await saveModel()

      expect(result).toBe(false)
    })

    it('should handle save errors', async () => {
      vi.mocked(aiModelsApi.update).mockRejectedValue(new Error('Save failed'))

      const { openEditDialog, saveModel, editDialogVisible } = useAIModelsAdmin({ autoFetch: false })

      const model = { id: '1', model_id: 'gpt-4', display_name: 'GPT-4', is_enabled: true }
      openEditDialog(model)

      const result = await saveModel()

      expect(result).toBe(false)
      expect(editDialogVisible.value).toBe(true) // Dialog should stay open on error
    })
  })

  describe('computed stats', () => {
    it('should compute model statistics correctly', () => {
      const { models, stats } = useAIModelsAdmin({ autoFetch: false })

      models.value = [
        { id: '1', is_enabled: true },
        { id: '2', is_enabled: true },
        { id: '3', is_enabled: false },
        { id: '4', is_enabled: false },
        { id: '5', is_enabled: true }
      ]

      expect(stats.value.total).toBe(5)
      expect(stats.value.enabled).toBe(3)
      expect(stats.value.disabled).toBe(2)
    })
  })

  describe('providerSeverity', () => {
    it('should return correct severity for known providers', () => {
      const { providerSeverity } = useAIModelsAdmin({ autoFetch: false })

      expect(providerSeverity('vllm')).toBe('success')
      expect(providerSeverity('openai')).toBe('info')
      expect(providerSeverity('anthropic')).toBe('warn')
      expect(providerSeverity('deepseek')).toBe('secondary')
      expect(providerSeverity('groq')).toBe('danger')
    })

    it('should return secondary for unknown providers', () => {
      const { providerSeverity } = useAIModelsAdmin({ autoFetch: false })

      expect(providerSeverity('unknown')).toBe('secondary')
      expect(providerSeverity('custom')).toBe('secondary')
    })
  })

  describe('filter actions', () => {
    it('applyFilters should fetch models', async () => {
      vi.mocked(aiModelsApi.list).mockResolvedValue({ models: [], total: 0, enabled_count: 0, disabled_count: 0 })

      const { applyFilters } = useAIModelsAdmin({ autoFetch: false })

      await applyFilters()

      expect(aiModelsApi.list).toHaveBeenCalled()
    })

    it('resetFilters should reset and fetch models', async () => {
      vi.mocked(aiModelsApi.list).mockResolvedValue({ models: [], total: 0, enabled_count: 0, disabled_count: 0 })

      const { resetFilters, filters } = useAIModelsAdmin({ autoFetch: false })

      filters.value.provider = 'openai'
      filters.value.model_type = 'llm'
      filters.value.enabled_only = true

      await resetFilters()

      expect(filters.value).toEqual({
        provider: undefined,
        model_type: undefined,
        enabled_only: false
      })
      expect(aiModelsApi.list).toHaveBeenCalled()
    })
  })
})
