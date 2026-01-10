import { ref, computed, onMounted } from 'vue'
import { aiModelsApi, type AIModel, type AIModelFilters } from '@/api/aiModels.api'
import { useToast } from '@/composables/useToast'

/**
 * Composable for managing AI models in admin panel.
 * Extracts logic from AIModelsPage for better testability.
 *
 * Note: This is different from useAIModels which is for select options in forms.
 */

export interface UseAIModelsAdminOptions {
  autoFetch?: boolean
}

// Provider options for filter dropdowns
export const providerOptions = [
  { value: undefined, label: 'Todos los proveedores' },
  { value: 'vllm', label: 'vLLM (Local)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'groq', label: 'Groq' }
]

// Type options for filter dropdowns
export const typeOptions = [
  { value: undefined, label: 'Todos los tipos' },
  { value: 'llm', label: 'LLM' },
  { value: 'embedding', label: 'Embedding' }
]

export function useAIModelsAdmin(options: UseAIModelsAdminOptions = {}) {
  const { autoFetch = true } = options

  const toast = useToast()

  // State
  const models = ref<AIModel[]>([])
  const loading = ref(false)
  const seeding = ref(false)
  const editDialogVisible = ref(false)
  const editingModel = ref<AIModel | null>(null)
  const error = ref<string | null>(null)

  // Filters
  const filters = ref<AIModelFilters>({
    provider: undefined,
    model_type: undefined,
    enabled_only: false
  })

  // Computed stats
  const stats = computed(() => ({
    total: models.value.length,
    enabled: models.value.filter((m) => m.is_enabled).length,
    disabled: models.value.filter((m) => !m.is_enabled).length
  }))

  /**
   * Get Tag severity for provider.
   */
  function providerSeverity(
    provider: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const colors: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      vllm: 'success',
      openai: 'info',
      anthropic: 'warn',
      deepseek: 'secondary',
      groq: 'danger'
    }
    return colors[provider] || 'secondary'
  }

  /**
   * Fetch models from API with current filters.
   */
  async function fetchModels(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await aiModelsApi.list(filters.value)
      models.value = response.models
    } catch (err) {
      error.value = 'No se pudieron cargar los modelos'
      toast.error('No se pudieron cargar los modelos')
      console.error('Error fetching models:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Seed external provider models.
   */
  async function seedExternal(): Promise<void> {
    seeding.value = true
    try {
      const result = await aiModelsApi.seedExternal()
      toast.success(`${result.added} nuevos, ${result.skipped} ya existían`, 'Modelos externos agregados')
      await fetchModels()
    } catch (err) {
      toast.error('No se pudieron agregar los modelos externos')
      console.error('Error seeding external models:', err)
    } finally {
      seeding.value = false
    }
  }

  /**
   * Toggle model enabled status.
   */
  async function toggleModel(model: AIModel): Promise<void> {
    try {
      const updated = await aiModelsApi.toggle(model.id)
      const index = models.value.findIndex((m) => m.id === model.id)
      if (index !== -1) {
        models.value[index] = updated
      }
      toast.info(
        model.display_name,
        updated.is_enabled ? 'Modelo habilitado' : 'Modelo deshabilitado'
      )
    } catch (err) {
      toast.error('No se pudo actualizar el modelo')
      console.error('Error toggling model:', err)
    }
  }

  /**
   * Open edit dialog for a model.
   */
  function openEditDialog(model: AIModel): void {
    editingModel.value = { ...model }
    editDialogVisible.value = true
  }

  /**
   * Close edit dialog.
   */
  function closeEditDialog(): void {
    editDialogVisible.value = false
    editingModel.value = null
  }

  /**
   * Save edited model.
   */
  async function saveModel(): Promise<boolean> {
    if (!editingModel.value) return false

    try {
      const updated = await aiModelsApi.update(editingModel.value.id, {
        display_name: editingModel.value.display_name,
        description: editingModel.value.description ?? undefined,
        sort_order: editingModel.value.sort_order,
        is_default: editingModel.value.is_default
      })

      const index = models.value.findIndex((m) => m.id === editingModel.value?.id)
      if (index !== -1) {
        models.value[index] = updated
      }

      toast.success(updated.display_name, 'Modelo actualizado')
      closeEditDialog()
      return true
    } catch (err) {
      toast.error('No se pudo guardar el modelo')
      console.error('Error saving model:', err)
      return false
    }
  }

  /**
   * Apply filters and fetch models.
   */
  function applyFilters(): void {
    fetchModels()
  }

  /**
   * Reset filters to defaults.
   */
  function resetFilters(): void {
    filters.value = {
      provider: undefined,
      model_type: undefined,
      enabled_only: false
    }
    fetchModels()
  }

  /**
   * Refresh models list.
   */
  async function refresh(): Promise<void> {
    await fetchModels()
  }

  // Auto-fetch on mount if enabled
  if (autoFetch) {
    onMounted(fetchModels)
  }

  return {
    // State
    models,
    loading,
    seeding,
    editDialogVisible,
    editingModel,
    error,
    filters,
    // Computed
    stats,
    // Constants
    providerOptions,
    typeOptions,
    // Utilities
    providerSeverity,
    // Actions
    fetchModels,
    seedExternal,
    toggleModel,
    openEditDialog,
    closeEditDialog,
    saveModel,
    applyFilters,
    resetFilters,
    refresh
  }
}

export default useAIModelsAdmin
