import { computed, type Ref } from 'vue'
import type { RoutingConfigSummary } from '@/types/graphTopology.types'

export function useGroupedRoutingConfigs(configs: Ref<RoutingConfigSummary[]>) {
  const groupedConfigs = computed(() => {
    const groups: Record<string, RoutingConfigSummary[]> = {}
    for (const config of configs.value) {
      const type = config.config_type
      if (!groups[type]) groups[type] = []
      groups[type].push(config)
    }
    // Sort each group by priority descending
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.priority - a.priority)
    }
    // Filter out empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([, v]) => v.length > 0)
    )
  })

  const defaultOpenGroups = computed(() => Object.keys(groupedConfigs.value))

  return { groupedConfigs, defaultOpenGroups }
}
