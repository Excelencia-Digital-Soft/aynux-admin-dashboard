import api from './index'

export interface Institution {
  id: string
  name: string
  code: string // WhatsApp phone number ID (DID)
  institution_key: string
  institution_type: string
  active: boolean
}

export interface MedicalTestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface MedicalTestRequest {
  whatsapp_phone_number_id: string // Business phone (DID) - REQUIRED for bypass routing
  phone_number: string // Customer phone - REQUIRED
  message?: string
  session_id?: string
}

export interface MedicalTestResponse {
  session_id: string
  response: string
  response_type: string
  execution_steps?: unknown[]
  metadata?: Record<string, unknown>
}

export interface MedicalWebhookConfig {
  enabled: boolean
  phoneNumber: string
  userName: string
  did: string | null
}

export const medicalApi = {
  /**
   * Get available medical institutions for testing.
   * Returns institutions from tenant_institution_configs with type='medical'.
   */
  async getInstitutions(): Promise<Institution[]> {
    try {
      const response = await api.get('/admin/medical/institutions')
      return response.data
    } catch (error) {
      console.error('Failed to fetch medical institutions:', error)
      return []
    }
  },

  /**
   * Send test message to medical appointments agent.
   * Extended timeout (2 min) - LLM processing can take 30s-2min.
   */
  async sendTestMessage(request: MedicalTestRequest): Promise<MedicalTestResponse | null> {
    try {
      const response = await api.post('/admin/medical/test', request, {
        timeout: 120000 // 2 minutes
      })
      return response.data
    } catch (error) {
      console.error('Failed to send test message:', error)
      throw error
    }
  }
}
