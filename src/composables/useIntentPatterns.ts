/**
 * Composable for managing intent patterns
 * Handles lemmas, phrases, confirmations, and keywords
 */

import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { domainIntentsApi } from '@/api/domainIntents.api'
import type {
  DomainIntent,
  DomainKey,
  MatchType,
  PhraseResponse,
  ConfirmationPatternResponse
} from '@/types/domainIntents.types'
import { MATCH_TYPE_OPTIONS } from '@/types/domainIntents.types'

export function useIntentPatterns(
  selectedDomain: { value: DomainKey | null },
  loadIntents: () => Promise<void>
) {
  const toast = useToast()

  // Pattern input state
  const newLemma = ref('')
  const newKeyword = ref('')
  const newPhrase = ref({ value: '', match_type: 'contains' as MatchType })
  const newConfirmation = ref({ value: '', match_type: 'exact' as MatchType })

  // Constants
  const matchTypeOptions = MATCH_TYPE_OPTIONS

  // Pattern getters
  function getLemmas(intent: DomainIntent): string[] {
    return intent.lemmas || []
  }

  function getPhrases(intent: DomainIntent): PhraseResponse[] {
    return intent.phrases || []
  }

  function getConfirmations(intent: DomainIntent): ConfirmationPatternResponse[] {
    return intent.confirmation_patterns || []
  }

  function getKeywords(intent: DomainIntent): string[] {
    return intent.keywords || []
  }

  // Pattern counts
  function getLemmaCount(intent: DomainIntent): number {
    return getLemmas(intent).length
  }

  function getPhraseCount(intent: DomainIntent): number {
    return getPhrases(intent).length
  }

  function getConfirmationCount(intent: DomainIntent): number {
    return getConfirmations(intent).length
  }

  function getKeywordCount(intent: DomainIntent): number {
    return getKeywords(intent).length
  }

  // UI helpers
  function getMatchTypeLabel(matchType: string | null): string {
    const option = matchTypeOptions.find((o) => o.value === matchType)
    return option?.label || matchType || 'N/A'
  }

  function getMatchTypeSeverity(matchType: string | null): string {
    switch (matchType) {
      case 'exact':
        return 'success'
      case 'contains':
        return 'info'
      case 'prefix':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  // Add patterns
  async function addLemma(intent: DomainIntent) {
    if (!selectedDomain.value || !newLemma.value.trim()) return

    try {
      await domainIntentsApi.addLemmas(selectedDomain.value, intent.id, [newLemma.value.trim()])
      newLemma.value = ''
      await loadIntents()
      toast.add({
        severity: 'success',
        summary: 'Lemma agregado',
        life: 2000
      })
    } catch (error) {
      console.error('Error adding lemma:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo agregar el lemma',
        life: 3000
      })
    }
  }

  async function addKeyword(intent: DomainIntent) {
    if (!selectedDomain.value || !newKeyword.value.trim()) return

    try {
      await domainIntentsApi.addKeywords(selectedDomain.value, intent.id, [newKeyword.value.trim()])
      newKeyword.value = ''
      await loadIntents()
      toast.add({
        severity: 'success',
        summary: 'Keyword agregado',
        life: 2000
      })
    } catch (error) {
      console.error('Error adding keyword:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo agregar el keyword',
        life: 3000
      })
    }
  }

  async function addPhrase(intent: DomainIntent) {
    if (!selectedDomain.value || !newPhrase.value.value.trim()) return

    try {
      await domainIntentsApi.addPhrases(selectedDomain.value, intent.id, [
        { value: newPhrase.value.value.trim(), match_type: newPhrase.value.match_type }
      ])
      newPhrase.value = { value: '', match_type: 'contains' }
      await loadIntents()
      toast.add({
        severity: 'success',
        summary: 'Frase agregada',
        life: 2000
      })
    } catch (error) {
      console.error('Error adding phrase:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo agregar la frase',
        life: 3000
      })
    }
  }

  async function addConfirmation(intent: DomainIntent) {
    if (!selectedDomain.value || !newConfirmation.value.value.trim()) return

    try {
      await domainIntentsApi.addConfirmations(selectedDomain.value, intent.id, [
        { value: newConfirmation.value.value.trim(), match_type: newConfirmation.value.match_type }
      ])
      newConfirmation.value = { value: '', match_type: 'exact' }
      await loadIntents()
      toast.add({
        severity: 'success',
        summary: 'Confirmación agregada',
        life: 2000
      })
    } catch (error) {
      console.error('Error adding confirmation:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo agregar la confirmación',
        life: 3000
      })
    }
  }

  // Remove patterns
  async function removeLemma(intent: DomainIntent, lemma: string) {
    if (!selectedDomain.value) return

    try {
      await domainIntentsApi.removeLemmas(selectedDomain.value, intent.id, [lemma])
      await loadIntents()
      toast.add({
        severity: 'info',
        summary: 'Lemma eliminado',
        life: 2000
      })
    } catch (error) {
      console.error('Error removing lemma:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el lemma',
        life: 3000
      })
    }
  }

  async function removePhrase(intent: DomainIntent, phrase: string) {
    if (!selectedDomain.value) return

    try {
      await domainIntentsApi.removePhrases(selectedDomain.value, intent.id, [phrase])
      await loadIntents()
      toast.add({
        severity: 'info',
        summary: 'Frase eliminada',
        life: 2000
      })
    } catch (error) {
      console.error('Error removing phrase:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la frase',
        life: 3000
      })
    }
  }

  async function removeKeyword(intent: DomainIntent, keyword: string) {
    if (!selectedDomain.value) return

    try {
      await domainIntentsApi.removeKeywords(selectedDomain.value, intent.id, [keyword])
      await loadIntents()
      toast.add({
        severity: 'info',
        summary: 'Keyword eliminado',
        life: 2000
      })
    } catch (error) {
      console.error('Error removing keyword:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el keyword',
        life: 3000
      })
    }
  }

  return {
    // State
    newLemma,
    newKeyword,
    newPhrase,
    newConfirmation,
    matchTypeOptions,

    // Pattern getters
    getLemmas,
    getPhrases,
    getConfirmations,
    getKeywords,

    // Pattern counts
    getLemmaCount,
    getPhraseCount,
    getConfirmationCount,
    getKeywordCount,

    // UI helpers
    getMatchTypeLabel,
    getMatchTypeSeverity,

    // Add patterns
    addLemma,
    addKeyword,
    addPhrase,
    addConfirmation,

    // Remove patterns
    removeLemma,
    removePhrase,
    removeKeyword
  }
}
