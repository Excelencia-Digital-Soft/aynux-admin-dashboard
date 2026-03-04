/**
 * Simulator API Client
 * Manages conversation simulation sessions for admin testing.
 */

import api from './index'

const BASE_PATH = '/admin/simulator'

// ── Types ──────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  organization_id: string
  institution_config_id?: string | null
  institution_config?: Record<string, unknown> | null
}

export interface CreateSessionResponse {
  session_id: string
  organization_id: string
  institution_name: string
}

export interface SendMessageRequest {
  session_id: string
  text: string
  choice_id?: string | null
}

export interface SimulatorTrace {
  current_node: string | null
  next_node: string | null
  is_complete: boolean
  response_type: string | null
  turn: number
}

export interface SimulatorButton {
  id: string
  titulo: string
}

export interface SimulatorListItem {
  id: string
  titulo: string
  descripcion?: string | null
}

export interface SendMessageResponse {
  response_text: string
  response_type: string
  response_buttons: SimulatorButton[] | null
  response_list_items: SimulatorListItem[] | null
  trace: SimulatorTrace
  state_snapshot: Record<string, unknown>
  turn: number
}

export interface SessionInfo {
  session_id: string
  organization_id: string
  institution_name: string
  turn_count: number
  created_at: number
  ttl_remaining: number
}

// ── API Client ─────────────────────────────────────────────────────

export const simulatorApi = {
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await api.post<CreateSessionResponse>(`${BASE_PATH}/session`, request)
    return response.data
  },

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>(`${BASE_PATH}/message`, request)
    return response.data
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/session/${sessionId}`)
  },

  async getSessionInfo(sessionId: string): Promise<SessionInfo> {
    const response = await api.get<SessionInfo>(`${BASE_PATH}/session/${sessionId}`)
    return response.data
  },

  async listSessions(): Promise<SessionInfo[]> {
    const response = await api.get<SessionInfo[]>(`${BASE_PATH}/sessions`)
    return response.data
  },
}

export default simulatorApi
