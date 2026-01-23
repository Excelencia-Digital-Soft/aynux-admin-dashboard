import { ref, computed, onMounted } from 'vue'
import { whisperApi } from '@/api/whisper.api'
import type {
  WhisperHealthStatus,
  TranscriptionResult,
  TranscriptionOptions
} from '@/api/whisper.api'
import { useToast } from '@/composables/useToast'

/**
 * Composable for Whisper transcription testing page.
 * Manages health status, file selection, transcription, and model control.
 */

export interface UseWhisperTestingOptions {
  autoFetchHealth?: boolean
  defaultLanguage?: string
}

export function useWhisperTesting(options: UseWhisperTestingOptions = {}) {
  const { autoFetchHealth = true, defaultLanguage = 'auto' } = options

  const toast = useToast()

  // Core state
  const isLoading = ref(false)
  const isTranscribing = ref(false)
  const isLoadingModel = ref(false)
  const isReleasingMemory = ref(false)

  // Health status
  const healthStatus = ref<WhisperHealthStatus | null>(null)
  const supportedFormats = ref<string[]>(['ogg', 'mp3', 'wav', 'm4a', 'flac'])

  // File state
  const selectedFile = ref<File | null>(null)
  const audioUrl = ref<string | null>(null)

  // Transcription result
  const transcriptionResult = ref<TranscriptionResult | null>(null)
  const transcriptionError = ref<string | null>(null)

  // Options
  const selectedLanguage = ref<string>(defaultLanguage)
  const includeSegments = ref(false)

  // Computed
  const isModelLoaded = computed(() => healthStatus.value?.model_loaded ?? false)
  const gpuAvailable = computed(() => healthStatus.value?.gpu_available ?? false)
  const canTranscribe = computed(
    () => !!selectedFile.value && !isTranscribing.value && gpuAvailable.value
  )
  const vramUsage = computed(() => {
    if (!healthStatus.value) return null
    const used = healthStatus.value.vram_used_gb ?? 0
    const total = healthStatus.value.vram_total_gb ?? 0
    return { used, total, percentage: total > 0 ? (used / total) * 100 : 0 }
  })

  /**
   * Fetch health status from the transcription service.
   */
  async function fetchHealth(): Promise<void> {
    isLoading.value = true
    try {
      healthStatus.value = await whisperApi.getHealth()
      if (healthStatus.value?.supported_formats) {
        supportedFormats.value = healthStatus.value.supported_formats
      }
    } catch (err) {
      toast.error('Error al obtener estado del servicio')
      console.error('Error fetching health:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Handle file selection.
   */
  function handleFileSelect(file: File): void {
    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext && !supportedFormats.value.includes(ext)) {
      toast.error(`Formato no soportado: ${ext}. Use: ${supportedFormats.value.join(', ')}`)
      return
    }

    // Revoke previous URL
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }

    selectedFile.value = file
    audioUrl.value = URL.createObjectURL(file)
    transcriptionResult.value = null
    transcriptionError.value = null
  }

  /**
   * Clear selected file and results.
   */
  function clearFile(): void {
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }
    selectedFile.value = null
    audioUrl.value = null
    transcriptionResult.value = null
    transcriptionError.value = null
  }

  /**
   * Transcribe the selected audio file.
   */
  async function transcribeAudio(): Promise<void> {
    if (!selectedFile.value) {
      toast.warn('Seleccione un archivo de audio primero')
      return
    }

    isTranscribing.value = true
    transcriptionError.value = null

    try {
      const options: TranscriptionOptions = {
        include_segments: includeSegments.value
      }

      if (selectedLanguage.value !== 'auto') {
        options.language = selectedLanguage.value
      }

      transcriptionResult.value = await whisperApi.transcribe(selectedFile.value, options)

      if (transcriptionResult.value) {
        toast.success('Transcripcion completada')
        // Refresh health to update VRAM usage
        await fetchHealth()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      transcriptionError.value = errorMessage
      toast.error(`Error en transcripcion: ${errorMessage}`)
      console.error('Error transcribing:', err)
    } finally {
      isTranscribing.value = false
    }
  }

  /**
   * Pre-load the Whisper model.
   */
  async function loadModel(): Promise<void> {
    isLoadingModel.value = true
    try {
      const result = await whisperApi.loadModel()
      if (result) {
        toast.success(`Modelo ${result.model_name || 'Whisper'} cargado`)
        await fetchHealth()
      }
    } catch (err) {
      toast.error('Error al cargar modelo')
      console.error('Error loading model:', err)
    } finally {
      isLoadingModel.value = false
    }
  }

  /**
   * Release model from VRAM.
   */
  async function releaseMemory(): Promise<void> {
    isReleasingMemory.value = true
    try {
      const result = await whisperApi.releaseMemory()
      if (result) {
        toast.success('Memoria VRAM liberada')
        await fetchHealth()
      }
    } catch (err) {
      toast.error('Error al liberar memoria')
      console.error('Error releasing memory:', err)
    } finally {
      isReleasingMemory.value = false
    }
  }

  /**
   * Copy transcription text to clipboard.
   */
  async function copyTranscription(): Promise<void> {
    if (!transcriptionResult.value?.text) {
      toast.warn('No hay texto para copiar')
      return
    }

    try {
      await navigator.clipboard.writeText(transcriptionResult.value.text)
      toast.success('Texto copiado al portapapeles')
    } catch (err) {
      toast.error('Error al copiar texto')
      console.error('Error copying:', err)
    }
  }

  /**
   * Clear transcription result.
   */
  function clearResult(): void {
    transcriptionResult.value = null
    transcriptionError.value = null
  }

  /**
   * Format duration in seconds to mm:ss.
   */
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Format processing time.
   */
  function formatProcessingTime(seconds: number): string {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`
    }
    return `${seconds.toFixed(2)}s`
  }

  // Language options for dropdown
  const languageOptions = [
    { label: 'Auto-detectar', value: 'auto' },
    { label: 'Espanol', value: 'es' },
    { label: 'Ingles', value: 'en' },
    { label: 'Portugues', value: 'pt' },
    { label: 'Frances', value: 'fr' },
    { label: 'Italiano', value: 'it' },
    { label: 'Aleman', value: 'de' }
  ]

  // Fetch health on mount
  onMounted(() => {
    if (autoFetchHealth) {
      fetchHealth()
    }
  })

  return {
    // State
    isLoading,
    isTranscribing,
    isLoadingModel,
    isReleasingMemory,
    healthStatus,
    supportedFormats,
    selectedFile,
    audioUrl,
    transcriptionResult,
    transcriptionError,
    selectedLanguage,
    includeSegments,
    languageOptions,

    // Computed
    isModelLoaded,
    gpuAvailable,
    canTranscribe,
    vramUsage,

    // Actions
    fetchHealth,
    handleFileSelect,
    clearFile,
    transcribeAudio,
    loadModel,
    releaseMemory,
    copyTranscription,
    clearResult,

    // Utilities
    formatDuration,
    formatProcessingTime
  }
}

export default useWhisperTesting
