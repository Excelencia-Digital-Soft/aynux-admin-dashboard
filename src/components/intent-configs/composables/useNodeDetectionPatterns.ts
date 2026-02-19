/**
 * useNodeDetectionPatterns - Fetches DomainIntents for a selected node
 * and provides pattern CRUD operations.
 *
 * Connects RoutingConfig.target_intent → DomainIntent.intent_key
 * to show and edit detection patterns (lemmas, keywords, phrases, confirmations).
 */
import { ref, computed, watch, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { domainIntentsApi } from '@/api/domainIntents.api'
import type { DomainIntent, MatchType, PhrasePattern } from '@/types/domainIntents.types'
import type { RoutingConfigSummary } from '../types'

export interface PatternSummary {
  lemmas: number
  keywords: number
  phrases: number
  confirmations: number
}

export function useNodeDetectionPatterns(
  domainKey: Ref<string>,
  routingConfigs: Ref<RoutingConfigSummary[]>
) {
  const authStore = useAuthStore()

  const allIntents = ref<DomainIntent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Unique target_intent values from the routing configs
  const targetIntentKeys = computed(() => {
    const keys = new Set<string>()
    for (const rc of routingConfigs.value) {
      if (rc.target_intent) {
        keys.add(rc.target_intent)
      }
    }
    return Array.from(keys)
  })

  // Intents that match the target_intent keys
  const matchedIntents = computed(() => {
    const keys = targetIntentKeys.value
    if (keys.length === 0) return []
    return allIntents.value.filter((intent) => keys.includes(intent.intent_key))
  })

  // Aggregate summary counts
  const summary = computed<PatternSummary>(() => {
    let lemmas = 0
    let keywords = 0
    let phrases = 0
    let confirmations = 0
    for (const intent of matchedIntents.value) {
      lemmas += intent.lemmas.length
      keywords += intent.keywords.length
      phrases += intent.phrases.length
      confirmations += intent.confirmation_patterns.length
    }
    return { lemmas, keywords, phrases, confirmations }
  })

  // Fetch all intents for the domain
  async function fetchIntents() {
    const orgId = authStore.currentOrgId
    if (!orgId || !domainKey.value) return

    isLoading.value = true
    error.value = null
    try {
      allIntents.value = await domainIntentsApi.listIntents(domainKey.value, orgId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar intents'
      allIntents.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Auto-fetch when target intents change
  watch(
    targetIntentKeys,
    (newKeys) => {
      if (newKeys.length > 0) {
        fetchIntents()
      } else {
        allIntents.value = []
      }
    },
    { immediate: true }
  )

  // =========================================================================
  // Pattern CRUD - delegates to domainIntentsApi then refetches
  // =========================================================================

  async function addLemma(intentId: string, lemma: string) {
    await domainIntentsApi.addLemmas(domainKey.value, intentId, [lemma])
    await fetchIntents()
  }

  async function removeLemma(intentId: string, lemma: string) {
    await domainIntentsApi.removeLemmas(domainKey.value, intentId, [lemma])
    await fetchIntents()
  }

  async function addKeyword(intentId: string, keyword: string) {
    await domainIntentsApi.addKeywords(domainKey.value, intentId, [keyword])
    await fetchIntents()
  }

  async function removeKeyword(intentId: string, keyword: string) {
    await domainIntentsApi.removeKeywords(domainKey.value, intentId, [keyword])
    await fetchIntents()
  }

  async function addPhrase(intentId: string, phrase: PhrasePattern) {
    await domainIntentsApi.addPhrases(domainKey.value, intentId, [phrase])
    await fetchIntents()
  }

  async function removePhrase(intentId: string, phraseValue: string) {
    await domainIntentsApi.removePhrases(domainKey.value, intentId, [phraseValue])
    await fetchIntents()
  }

  async function addConfirmation(intentId: string, pattern: PhrasePattern) {
    await domainIntentsApi.addConfirmations(domainKey.value, intentId, [pattern])
    await fetchIntents()
  }

  async function removeConfirmation(intentId: string, patternValue: string) {
    await domainIntentsApi.removeConfirmations(domainKey.value, intentId, [patternValue])
    await fetchIntents()
  }

  return {
    matchedIntents,
    isLoading,
    error,
    summary,
    fetchIntents,
    addLemma,
    removeLemma,
    addKeyword,
    removeKeyword,
    addPhrase,
    removePhrase,
    addConfirmation,
    removeConfirmation
  }
}
