/**
 * Domain Intents API Client
 * Multi-domain, multi-tenant intent pattern management
 */

import api from './index'
import type {
  DomainIntent,
  DomainKey,
  IntentCreate,
  IntentUpdate,
  IntentFilterOptions,
  PhrasePattern,
  CacheStatsResponse,
  SeedResponse,
  BulkImportResponse
} from '@/types/domainIntents.types'

const BASE_PATH = '/admin/intents'

/**
 * Build URL for domain-specific endpoints
 */
function domainPath(domainKey: DomainKey, ...segments: string[]): string {
  const path = [BASE_PATH, 'domains', domainKey, ...segments].join('/')
  return path
}

/**
 * Domain Intents API
 */
export const domainIntentsApi = {
  // =========================================================================
  // Intent CRUD Operations
  // =========================================================================

  /**
   * List all intents for a domain
   */
  async listIntents(
    domainKey: DomainKey,
    organizationId: string,
    options: IntentFilterOptions = {}
  ): Promise<DomainIntent[]> {
    const params = new URLSearchParams()
    params.append('organization_id', organizationId)
    if (options.is_enabled !== undefined) {
      params.append('enabled_only', String(options.is_enabled))
    }
    if (options.search) {
      params.append('search', options.search)
    }
    if (options.skip !== undefined) {
      params.append('skip', String(options.skip))
    }
    if (options.limit !== undefined) {
      params.append('limit', String(options.limit))
    }

    const queryString = params.toString()
    const url = `${domainPath(domainKey, 'intents')}?${queryString}`

    const response = await api.get<{ intents: DomainIntent[] }>(url)
    return response.data.intents
  },

  /**
   * Get a single intent by ID
   */
  async getIntent(domainKey: DomainKey, intentId: string): Promise<DomainIntent> {
    const response = await api.get<DomainIntent>(
      domainPath(domainKey, 'intents', intentId)
    )
    return response.data
  },

  /**
   * Create a new intent
   */
  async createIntent(domainKey: DomainKey, organizationId: string, data: IntentCreate): Promise<DomainIntent> {
    const response = await api.post<DomainIntent>(
      `${domainPath(domainKey, 'intents')}?organization_id=${organizationId}`,
      data
    )
    return response.data
  },

  /**
   * Update an existing intent
   */
  async updateIntent(
    domainKey: DomainKey,
    intentId: string,
    data: IntentUpdate
  ): Promise<DomainIntent> {
    const response = await api.put<DomainIntent>(
      domainPath(domainKey, 'intents', intentId),
      data
    )
    return response.data
  },

  /**
   * Delete an intent
   */
  async deleteIntent(domainKey: DomainKey, intentId: string): Promise<void> {
    await api.delete(domainPath(domainKey, 'intents', intentId))
  },

  // =========================================================================
  // Pattern Operations (using type-specific backend endpoints)
  // =========================================================================

  // =========================================================================
  // Convenience Methods for Specific Pattern Types
  // =========================================================================

  /**
   * Add lemmas to an intent
   */
  async addLemmas(
    domainKey: DomainKey,
    intentId: string,
    lemmas: string[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.post<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'lemmas'),
      { lemmas: lemmas.map((l) => l.toLowerCase().trim()) }
    )
    return response.data
  },

  /**
   * Remove lemmas from an intent
   */
  async removeLemmas(
    domainKey: DomainKey,
    intentId: string,
    lemmas: string[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.delete<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'lemmas'),
      { data: { lemmas } }
    )
    return response.data
  },

  /**
   * Add keywords to an intent
   */
  async addKeywords(
    domainKey: DomainKey,
    intentId: string,
    keywords: string[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.post<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'keywords'),
      { keywords: keywords.map((k) => k.toLowerCase().trim()) }
    )
    return response.data
  },

  /**
   * Remove keywords from an intent
   */
  async removeKeywords(
    domainKey: DomainKey,
    intentId: string,
    keywords: string[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.delete<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'keywords'),
      { data: { keywords } }
    )
    return response.data
  },

  /**
   * Add phrases to an intent
   */
  async addPhrases(
    domainKey: DomainKey,
    intentId: string,
    phrases: PhrasePattern[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.post<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'phrases'),
      {
        phrases: phrases.map((p) => ({
          phrase: p.value.toLowerCase().trim(),
          match_type: p.match_type
        }))
      }
    )
    return response.data
  },

  /**
   * Remove phrases from an intent
   */
  async removePhrases(
    domainKey: DomainKey,
    intentId: string,
    phrases: string[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.delete<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'phrases'),
      { data: { phrases } }
    )
    return response.data
  },

  /**
   * Add confirmation patterns to an intent
   */
  async addConfirmations(
    domainKey: DomainKey,
    intentId: string,
    confirmations: PhrasePattern[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.post<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'confirmation'),
      {
        patterns: confirmations.map((p) => ({
          pattern: p.value.toLowerCase().trim(),
          pattern_type: p.match_type
        }))
      }
    )
    return response.data
  },

  /**
   * Remove confirmation patterns from an intent
   */
  async removeConfirmations(
    domainKey: DomainKey,
    intentId: string,
    patterns: string[]
  ): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.delete<{ success: boolean; count: number; message: string }>(
      domainPath(domainKey, 'intents', intentId, 'confirmation'),
      { data: { patterns } }
    )
    return response.data
  },

  /**
   * Seed default intents for a domain (admin operation)
   */
  async seedDefaults(
    domainKey: DomainKey,
    organizationId: string,
    overwrite: boolean = false
  ): Promise<SeedResponse> {
    const response = await api.post<SeedResponse>(
      `${domainPath(domainKey, 'intents', 'seed')}?organization_id=${organizationId}`,
      { overwrite }
    )
    return response.data
  },

  /**
   * Invalidate cache for a domain
   */
  async invalidateCache(domainKey: DomainKey, organizationId: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `${BASE_PATH}/cache/invalidate?organization_id=${organizationId}`,
      { domain_key: domainKey }
    )
    return response.data
  },

  // =========================================================================
  // Cache and Bulk Operations
  // =========================================================================

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStatsResponse> {
    const response = await api.get<CacheStatsResponse>(`${BASE_PATH}/cache/stats`)
    return response.data
  },

  /**
   * Bulk create intents (for import functionality)
   */
  async bulkCreateIntents(
    domainKey: DomainKey,
    organizationId: string,
    intents: IntentCreate[]
  ): Promise<BulkImportResponse> {
    const results = {
      success: true,
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const intent of intents) {
      try {
        await this.createIntent(domainKey, organizationId, intent)
        results.created++
      } catch (error) {
        results.skipped++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`${intent.intent_key}: ${errorMsg}`)
      }
    }

    results.success = results.errors.length === 0
    return results
  },

  /**
   * Export all intents for a domain (returns intents for download)
   */
  async exportIntents(
    domainKey: DomainKey,
    organizationId: string
  ): Promise<DomainIntent[]> {
    // Just use listIntents to get all intents for export
    return this.listIntents(domainKey, organizationId, {})
  }
}

export default domainIntentsApi
