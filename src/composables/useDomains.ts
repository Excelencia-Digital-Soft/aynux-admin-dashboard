/**
 * Domains Composable
 * Composable for accessing centralized domain data
 *
 * Uses module-level state (singleton) so domains are fetched once
 * and shared across all components.
 */

import { ref, computed } from 'vue'
import { domainApi } from '@/api/domain.api'
import type { Domain, DomainOption } from '@/types/domain.types'

// ============================================================
// Module-level state (shared across all components)
// ============================================================

const domains = ref<Domain[]>([])
const isLoading = ref(false)
const isLoaded = ref(false)
const error = ref<string | null>(null)

// ============================================================
// Composable
// ============================================================

export function useDomains() {
  /**
   * Fetch domains from API (only if not already loaded)
   * @param enabledOnly - If true, only fetch enabled domains
   * @param force - If true, fetch even if already loaded
   */
  async function fetchDomains(enabledOnly = true, force = false) {
    // Skip if already loaded and not forcing
    if (isLoaded.value && !force) return

    isLoading.value = true
    error.value = null

    try {
      const response = await domainApi.list(enabledOnly)
      domains.value = response.domains
      isLoaded.value = true
    } catch (err) {
      console.error('Error fetching domains:', err)
      error.value = 'Error al cargar dominios'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get domains formatted as options for Select components
   * @param includeNull - If true, add "Sin dominio" option at the start
   */
  function getDomainOptions(includeNull = false): DomainOption[] {
    const options: DomainOption[] = domains.value.map((d) => ({
      value: d.domain_key,
      label: d.display_name,
      color: d.color || undefined,
      icon: d.icon || undefined
    }))

    if (includeNull) {
      options.unshift({
        value: null,
        label: 'Sin dominio especifico',
        color: 'secondary',
        icon: 'pi-globe'
      })
    }

    return options
  }

  /**
   * Get display label for a domain key
   * @param domainKey - The domain key to look up
   * @returns Display name or the key itself if not found
   */
  function getDomainLabel(domainKey: string | null | undefined): string {
    if (!domainKey) return '-'
    const domain = domains.value.find((d) => d.domain_key === domainKey)
    return domain?.display_name || domainKey
  }

  /**
   * Get domain color for a domain key
   * @param domainKey - The domain key to look up
   * @returns Color name or 'info' as default
   */
  function getDomainColor(domainKey: string | null | undefined): string {
    if (!domainKey) return 'secondary'
    const domain = domains.value.find((d) => d.domain_key === domainKey)
    return domain?.color || 'info'
  }

  /**
   * Get domain icon for a domain key
   * @param domainKey - The domain key to look up
   * @returns Icon class or undefined
   */
  function getDomainIcon(domainKey: string | null | undefined): string | undefined {
    if (!domainKey) return 'pi-globe'
    const domain = domains.value.find((d) => d.domain_key === domainKey)
    return domain?.icon || undefined
  }

  /**
   * Check if domains have been loaded
   */
  const hasLoaded = computed(() => isLoaded.value)

  /**
   * Get domain count
   */
  const domainCount = computed(() => domains.value.length)

  /**
   * Reset state (useful for testing)
   */
  function reset() {
    domains.value = []
    isLoaded.value = false
    error.value = null
  }

  return {
    // State
    domains,
    isLoading,
    hasLoaded,
    domainCount,
    error,

    // Actions
    fetchDomains,
    reset,

    // Helpers
    getDomainOptions,
    getDomainLabel,
    getDomainColor,
    getDomainIcon
  }
}
