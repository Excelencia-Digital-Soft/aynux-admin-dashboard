/**
 * useNodeResponseConfigs - Fetches ResponseConfigs linked to a node's response_keys
 *
 * Given an array of response_keys (intent_key strings that belong to this node),
 * fetches the corresponding ResponseConfigs via the existing API.
 * Also fetches inheritance info (system vs override) when org is not SYSTEM_ORG.
 */
import { ref, computed, watch, type Ref } from 'vue'
import { responseConfigsApi } from '@/api/responseConfigs.api'
import { useAuthStore } from '@/stores/auth.store'
import type { ResponseConfig, ConfigDiffItem } from '@/types/responseConfigs.types'

const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000'

export function useNodeResponseConfigs(
  domainKey: Ref<string>,
  responseKeys: Ref<string[]>
) {
  const authStore = useAuthStore()

  const responseConfigs = ref<ResponseConfig[]>([])
  const inheritanceMap = ref<Map<string, ConfigDiffItem>>(new Map())
  const isLoading = ref(false)

  const isSystemOrg = computed(() => authStore.currentOrgId === SYSTEM_ORG_ID)

  const intentsWithoutConfig = computed(() => {
    if (isSystemOrg.value) {
      // For SYSTEM_ORG, check directly against loaded configs
      const configuredKeys = new Set(responseConfigs.value.map((c) => c.intent_key))
      return responseKeys.value.filter((k) => !configuredKeys.has(k))
    }
    // For tenant orgs, any key that has a system config but no override still "exists"
    // Only keys with no config anywhere are truly "without config"
    const allKnownKeys = new Set([
      ...responseConfigs.value.map((c) => c.intent_key),
      ...Array.from(inheritanceMap.value.keys()),
    ])
    return responseKeys.value.filter((k) => !allKnownKeys.has(k))
  })

  /**
   * Get the effective config for display — the override if it exists, else the system config.
   * For SYSTEM_ORG, returns configs directly.
   */
  const effectiveConfigs = computed(() => {
    if (isSystemOrg.value) {
      return responseConfigs.value
    }
    // For tenant orgs, merge: use override if exists, else use system
    const intentSet = new Set(responseKeys.value)
    const result: ResponseConfig[] = []
    for (const [intentKey, diff] of inheritanceMap.value) {
      if (!intentSet.has(intentKey)) continue
      const config = diff.override_config ?? diff.system_config
      if (config) result.push(config)
    }
    return result
  })

  /**
   * Get inheritance source for a given intent_key
   */
  function getInheritanceSource(intentKey: string): 'system' | 'override' | null {
    const diff = inheritanceMap.value.get(intentKey)
    return diff?.source ?? null
  }

  /**
   * Get the system config for a given intent_key (for diff/override flows)
   */
  function getSystemConfig(intentKey: string): ResponseConfig | null {
    const diff = inheritanceMap.value.get(intentKey)
    return diff?.system_config ?? null
  }

  /**
   * Get diff fields for a given intent_key
   */
  function getDiffFields(intentKey: string): string[] {
    const diff = inheritanceMap.value.get(intentKey)
    return diff?.diff_fields ?? []
  }

  async function fetchResponseConfigs() {
    const orgId = authStore.currentOrgId
    if (!orgId || !domainKey.value || responseKeys.value.length === 0) {
      responseConfigs.value = []
      inheritanceMap.value = new Map()
      return
    }

    isLoading.value = true
    try {
      if (orgId === SYSTEM_ORG_ID) {
        // SYSTEM_ORG: no inheritance, just fetch configs directly
        const allConfigs = await responseConfigsApi.listConfigs(orgId, domainKey.value)
        const intentSet = new Set(responseKeys.value)
        responseConfigs.value = allConfigs.filter((c) => intentSet.has(c.intent_key))
        inheritanceMap.value = new Map()
      } else {
        // Tenant org: fetch config-diff for full inheritance picture
        const diffResult = await responseConfigsApi.getConfigDiff(orgId, domainKey.value)
        const intentSet = new Set(responseKeys.value)
        const newMap = new Map<string, ConfigDiffItem>()
        const configs: ResponseConfig[] = []

        for (const item of diffResult.configs) {
          if (!intentSet.has(item.intent_key)) continue
          newMap.set(item.intent_key, item)
          // Also keep the org's own configs in responseConfigs for compatibility
          if (item.override_config) {
            configs.push(item.override_config)
          }
        }

        responseConfigs.value = configs
        inheritanceMap.value = newMap
      }
    } catch (error) {
      console.error('Failed to fetch response configs for node:', error)
      responseConfigs.value = []
      inheritanceMap.value = new Map()
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [responseKeys, domainKey],
    () => {
      fetchResponseConfigs()
    },
    { immediate: true }
  )

  return {
    responseConfigs,
    effectiveConfigs,
    inheritanceMap,
    isLoading,
    isSystemOrg,
    intentsWithoutConfig,
    responseKeys,
    refetch: fetchResponseConfigs,
    getInheritanceSource,
    getSystemConfig,
    getDiffFields,
  }
}
