import { ref, computed, onMounted } from 'vue'
import { aiModelsApi, type AIModelSelectOption } from '@/api/aiModels.api'

/**
 * Composable for fetching available AI models for UI selection.
 * Used by YamlEditor and YamlTestDialog to replace hardcoded model lists.
 */
export function useAIModels(modelType: 'llm' | 'embedding' = 'llm') {
  const models = ref<AIModelSelectOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Model options formatted for PrimeVue Select component.
   * Includes provider info in label for clarity.
   */
  const modelOptions = computed(() =>
    models.value.map(m => ({
      value: m.value,
      label: m.label,
      provider: m.provider,
      family: m.family,
      parameter_size: m.parameter_size,
      supports_functions: m.supports_functions,
      supports_vision: m.supports_vision,
      max_tokens: m.max_tokens,
      is_default: m.is_default
    }))
  )

  /**
   * Simple value/label format for basic Select components.
   * Includes 'default' option for prompts that use system default model.
   */
  const simpleOptions = computed(() => {
    const options = models.value.map(m => ({
      value: m.value,
      label: m.label
    }))
    // Add 'default' option if not already present
    if (!options.some(o => o.value === 'default')) {
      options.unshift({ value: 'default', label: 'Default (Sistema)' })
    }
    return options
  })

  /**
   * Models grouped by provider for organized display.
   */
  const modelsByProvider = computed(() => {
    const grouped: Record<string, AIModelSelectOption[]> = {}
    for (const model of models.value) {
      const provider = model.provider || 'unknown'
      if (!grouped[provider]) {
        grouped[provider] = []
      }
      grouped[provider].push(model)
    }
    return grouped
  })

  /**
   * Get default model value (first one with is_default=true, or first model).
   */
  const defaultModel = computed(() => {
    const defaultM = models.value.find(m => m.is_default)
    return defaultM?.value || models.value[0]?.value || ''
  })

  /**
   * Fetch models from API.
   */
  async function fetchModels() {
    loading.value = true
    error.value = null
    try {
      models.value = await aiModelsApi.getSelectOptions(modelType)
    } catch (e) {
      error.value = 'Error al cargar modelos'
      console.error('Failed to fetch AI models:', e)
      // Fallback to empty array - UI should handle gracefully
      models.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh models from API.
   */
  async function refresh() {
    await fetchModels()
  }

  // Auto-fetch on mount
  onMounted(fetchModels)

  return {
    // Data
    models,
    modelOptions,
    simpleOptions,
    modelsByProvider,
    defaultModel,
    // State
    loading,
    error,
    // Actions
    fetchModels,
    refresh
  }
}

export default useAIModels
