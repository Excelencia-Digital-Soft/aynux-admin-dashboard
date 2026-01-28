import whisperClient from './whisper.client'

// Health status from GPU/Model
export interface WhisperHealthStatus {
  status: string
  gpu_available: boolean
  device: string
  device_name?: string
  vram_used_gb?: number
  vram_total_gb?: number
  model_loaded: boolean
  model_name?: string
  compute_type?: string
  supported_formats: string[]
  message?: string
}

// Transcription result
export interface TranscriptionResult {
  text: string
  language: string
  language_probability: number
  duration: number
  processing_time: number
  segments?: TranscriptionSegment[]
}

export interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
}

// Transcription request options
export interface TranscriptionOptions {
  language?: string
  include_segments?: boolean
}

// Model load/release responses
export interface ModelResponse {
  status: string
  message: string
  model_name?: string
  compute_type?: string
  vram_used_gb?: number
}

export const whisperApi = {
  /**
   * Get Whisper service health status (GPU, model, formats)
   */
  async getHealth(): Promise<WhisperHealthStatus | null> {
    try {
      const response = await whisperClient.get('/transcription/health')
      return response.data
    } catch (error) {
      console.error('Failed to fetch Whisper health:', error)
      return null
    }
  },

  /**
   * Transcribe an audio file.
   * Uses multipart/form-data for file upload.
   * Extended timeout (5 min) - transcription can take time for large files.
   */
  async transcribe(
    file: File,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      if (options.language) {
        formData.append('language', options.language)
      }
      if (options.include_segments !== undefined) {
        formData.append('include_segments', String(options.include_segments))
      }

      const response = await whisperClient.post('/transcription/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
        // Timeout already set in whisperClient (5 minutes)
      })

      // API returns { success, result, error } - extract the result
      const data = response.data
      if (data.success && data.result) {
        return data.result
      }
      if (data.error) {
        throw new Error(data.error)
      }
      return null
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
      throw error
    }
  },

  /**
   * Pre-load the Whisper model into VRAM.
   */
  async loadModel(): Promise<ModelResponse | null> {
    try {
      const response = await whisperClient.post('/transcription/load-model', {}, {
        timeout: 120000 // 2 minutes for model loading
      })
      return response.data
    } catch (error) {
      console.error('Failed to load Whisper model:', error)
      throw error
    }
  },

  /**
   * Release model from VRAM.
   */
  async releaseMemory(): Promise<ModelResponse | null> {
    try {
      const response = await whisperClient.post('/transcription/release-memory')
      return response.data
    } catch (error) {
      console.error('Failed to release Whisper memory:', error)
      throw error
    }
  },

  /**
   * Get supported audio formats.
   */
  async getSupportedFormats(): Promise<string[]> {
    try {
      const response = await whisperClient.get('/transcription/supported-formats')
      return response.data.formats || []
    } catch (error) {
      console.error('Failed to fetch supported formats:', error)
      return ['ogg', 'mp3', 'wav', 'm4a', 'flac']
    }
  }
}
