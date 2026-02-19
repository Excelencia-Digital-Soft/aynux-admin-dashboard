<script setup lang="ts">
/**
 * DetectionPatternsSection - Wrapper section showing detection patterns
 * for DomainIntents linked to a node's routing configs.
 *
 * Shows a summary bar + per-intent IntentPatternBlock components.
 */
import { toRef } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import IntentPatternBlock from './IntentPatternBlock.vue'
import { useNodeDetectionPatterns } from '../composables/useNodeDetectionPatterns'
import type { RoutingConfigSummary } from '../types'
import type { MatchType } from '@/types/domainIntents.types'

interface Props {
  domainKey: string
  routingConfigs: RoutingConfigSummary[]
}

const props = defineProps<Props>()

const {
  matchedIntents,
  isLoading,
  summary,
  addLemma,
  removeLemma,
  addKeyword,
  removeKeyword,
  addPhrase,
  removePhrase,
  addConfirmation,
  removeConfirmation
} = useNodeDetectionPatterns(toRef(props, 'domainKey'), toRef(props, 'routingConfigs'))

// Handlers that bridge IntentPatternBlock emits → composable
function handleAddPhrase(intentId: string, value: string, matchType: MatchType) {
  addPhrase(intentId, { value, match_type: matchType })
}

function handleAddConfirmation(intentId: string, value: string, matchType: MatchType) {
  addConfirmation(intentId, { value, match_type: matchType })
}
</script>

<template>
  <div class="detection-section">
    <div class="section-header">
      <i class="pi pi-search" />
      <h4>PATRONES DE DETECCION</h4>
    </div>

    <!-- Summary bar -->
    <div v-if="matchedIntents.length > 0" class="summary-bar">
      <div class="summary-item">
        <span class="summary-value">{{ summary.lemmas }}</span>
        <span class="summary-label">lemmas</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">{{ summary.keywords }}</span>
        <span class="summary-label">keywords</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">{{ summary.phrases }}</span>
        <span class="summary-label">frases</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">{{ summary.confirmations }}</span>
        <span class="summary-label">confirm.</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <ProgressSpinner style="width: 24px; height: 24px" />
      <span>Cargando patrones...</span>
    </div>

    <!-- Intent blocks -->
    <div v-else-if="matchedIntents.length > 0" class="intents-list">
      <IntentPatternBlock
        v-for="intent in matchedIntents"
        :key="intent.id"
        :intent="intent"
        :domain-key="domainKey"
        @add-lemma="addLemma"
        @remove-lemma="removeLemma"
        @add-keyword="addKeyword"
        @remove-keyword="removeKeyword"
        @add-phrase="handleAddPhrase"
        @remove-phrase="removePhrase"
        @add-confirmation="handleAddConfirmation"
        @remove-confirmation="removeConfirmation"
      />
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="empty-state">
      <i class="pi pi-info-circle" />
      <span>No hay intents vinculados a este nodo</span>
    </div>
  </div>
</template>

<style scoped>
.detection-section {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.section-header i {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.section-header h4 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: 0.5px;
}

.summary-bar {
  display: flex;
  gap: 1rem;
  padding: 0.375rem 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.summary-label {
  font-size: 0.6rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.intents-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 0.8rem;
  opacity: 0.5;
}
</style>
