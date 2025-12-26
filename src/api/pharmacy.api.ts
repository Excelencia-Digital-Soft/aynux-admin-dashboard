import api from './index'

export interface Pharmacy {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  active: boolean
}

export interface PharmacyTestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface PharmacyTestSession {
  session_id: string
  pharmacy_id: string
  messages: PharmacyTestMessage[]
  created_at: string
  execution_steps?: unknown[]
  graph_state?: unknown
}

export interface PharmacyTestRequest {
  pharmacy_id: string
  message: string
  session_id?: string
  phone_number?: string
}

export interface PharmacyTestResponse {
  session_id: string
  response: string
  execution_steps?: unknown[]
  graph_state?: unknown
  metadata?: Record<string, unknown>
}

export const pharmacyApi = {
  // Get available pharmacies for testing
  async getPharmacies(): Promise<Pharmacy[]> {
    try {
      const response = await api.get('/admin/pharmacy/list')
      return response.data
    } catch (error) {
      console.error('Failed to fetch pharmacies:', error)
      return []
    }
  },

  // Send test message to pharmacy agent
  // Extended timeout (2 min) - LLM processing can take 30s-2min
  async sendTestMessage(request: PharmacyTestRequest): Promise<PharmacyTestResponse | null> {
    try {
      const response = await api.post('/admin/pharmacy/test', request, {
        timeout: 120000 // 2 minutes
      })
      return response.data
    } catch (error) {
      console.error('Failed to send test message:', error)
      throw error
    }
  },

  // Get test session history
  async getSession(sessionId: string): Promise<PharmacyTestSession | null> {
    try {
      const response = await api.get(`/admin/pharmacy/session/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch session:', error)
      return null
    }
  },

  // Clear test session
  async clearSession(sessionId: string): Promise<boolean> {
    try {
      await api.delete(`/admin/pharmacy/session/${sessionId}`)
      return true
    } catch (error) {
      console.error('Failed to clear session:', error)
      return false
    }
  },

  // Get pharmacy graph visualization data
  async getGraphData(sessionId: string): Promise<unknown | null> {
    try {
      const response = await api.get(`/admin/pharmacy/graph/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch graph data:', error)
      return null
    }
  }
}
