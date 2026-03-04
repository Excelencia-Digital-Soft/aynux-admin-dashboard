/**
 * Intent Analysis API Client
 * Debug endpoint for NLU intent detection scoring breakdown.
 */

import api from './index'

const BASE_PATH = '/admin/intent-analysis'

export interface IntentAnalysisRequest {
  text: string
  organization_id: string
}

export interface IntentAnalysisResponse {
  intent: string
  confidence: number
  method: string
  matched_lemmas: string[]
  matched_patterns: string[]
  all_scores: Record<string, number>
  analysis: Record<string, unknown>
}

export const intentAnalysisApi = {
  /**
   * Analyze text against intent patterns and return full scoring breakdown.
   */
  async analyze(
    domainKey: string,
    request: IntentAnalysisRequest
  ): Promise<IntentAnalysisResponse> {
    const response = await api.post<IntentAnalysisResponse>(
      `${BASE_PATH}/domains/${domainKey}/analyze`,
      request
    )
    return response.data
  },
}

export default intentAnalysisApi
