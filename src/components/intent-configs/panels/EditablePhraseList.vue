<script setup lang="ts">
/**
 * EditablePhraseList - Editable list of phrase patterns with match_type
 *
 * Used for phrases and confirmation patterns that have a match_type (exact, contains, prefix).
 */
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import type { MatchType, PhraseResponse, ConfirmationPatternResponse } from '@/types/domainIntents.types'
import { MATCH_TYPE_OPTIONS } from '@/types/domainIntents.types'

// Normalized phrase item (works for both PhraseResponse and ConfirmationPatternResponse)
interface NormalizedPhrase {
  text: string
  matchType: string
}

interface Props {
  // Accept both phrase and confirmation formats
  phrases: PhraseResponse[] | ConfirmationPatternResponse[]
  label: string
  severity?: 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' | undefined
  placeholder?: string
  loading?: boolean
  // Type hint for confirmation vs phrase
  isConfirmation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'info',
  placeholder: 'Nueva frase...',
  loading: false,
  isConfirmation: false
})

const emit = defineEmits<{
  (e: 'add', phrase: string, matchType: MatchType): void
  (e: 'remove', phrase: string): void
}>()

const newPhrase = ref('')
const matchType = ref<MatchType>('contains')
const addingItem = ref(false)
const removingItem = ref<string | null>(null)

// Normalize phrases to common format
function normalizedPhrases(): NormalizedPhrase[] {
  return props.phrases.map(p => {
    if ('phrase' in p) {
      // PhraseResponse
      return { text: p.phrase, matchType: p.match_type }
    } else {
      // ConfirmationPatternResponse
      return { text: p.pattern, matchType: p.pattern_type }
    }
  })
}

// Get the raw text value for removal
function getOriginalText(item: NormalizedPhrase): string {
  // Find the original item to get correct key
  const original = props.phrases.find(p => {
    if ('phrase' in p) return p.phrase === item.text
    return p.pattern === item.text
  })
  if (!original) return item.text
  return 'phrase' in original ? original.phrase : original.pattern
}

function addItem() {
  const trimmed = newPhrase.value.trim().toLowerCase()
  if (!trimmed) return

  // Check for duplicates
  const existing = normalizedPhrases().find(p => p.text === trimmed)
  if (existing) {
    newPhrase.value = ''
    return
  }

  addingItem.value = true
  emit('add', trimmed, matchType.value)
  newPhrase.value = ''
  addingItem.value = false
}

function removeItem(item: NormalizedPhrase) {
  removingItem.value = item.text
  emit('remove', getOriginalText(item))
  removingItem.value = null
}

// Match type badge color
function getMatchTypeBadge(type: string): string {
  switch (type) {
    case 'exact': return '#22c55e'
    case 'contains': return '#3b82f6'
    case 'prefix': return '#f97316'
    default: return '#6b7280'
  }
}

function getMatchTypeShort(type: string): string {
  switch (type) {
    case 'exact': return 'E'
    case 'contains': return 'C'
    case 'prefix': return 'P'
    default: return '?'
  }
}

// Get severity class for tag styling
function getSeverityClass(): string {
  switch (props.severity) {
    case 'success': return 'tag-success'
    case 'info': return 'tag-info'
    case 'warn': return 'tag-warn'
    case 'danger': return 'tag-danger'
    case 'secondary': return 'tag-secondary'
    default: return 'tag-secondary'
  }
}
</script>

<template>
  <div class="editable-phrase-list">
    <div class="pattern-header">
      <span class="label">{{ label }}</span>
      <span class="count">({{ phrases.length }})</span>
    </div>

    <!-- Input para agregar -->
    <div class="add-phrase">
      <InputText
        v-model="newPhrase"
        :placeholder="placeholder"
        class="phrase-input"
        @keyup.enter="addItem"
      />
      <Select
        v-model="matchType"
        :options="MATCH_TYPE_OPTIONS"
        optionLabel="label"
        optionValue="value"
        class="match-type-select"
      />
      <Button
        icon="pi pi-plus"
        size="small"
        :loading="addingItem || loading"
        :disabled="!newPhrase.trim()"
        @click="addItem"
      />
    </div>

    <!-- Lista de tags editables (custom implementation) -->
    <div class="phrase-tags">
      <div
        v-for="item in normalizedPhrases()"
        :key="item.text"
        class="phrase-tag"
        :class="getSeverityClass()"
      >
        <span
          class="match-type-badge"
          :style="{ backgroundColor: getMatchTypeBadge(item.matchType) }"
          :title="item.matchType"
        >
          {{ getMatchTypeShort(item.matchType) }}
        </span>
        <span class="phrase-text" :title="item.text">{{ item.text }}</span>
        <i
          class="pi pi-times remove-icon"
          :class="{ 'loading': removingItem === item.text }"
          @click.stop="removeItem(item)"
        />
      </div>
      <span v-if="phrases.length === 0" class="empty-message">
        Sin patrones configurados
      </span>
    </div>
  </div>
</template>

<style scoped>
.editable-phrase-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.pattern-header .label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.pattern-header .count {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.add-phrase {
  display: flex;
  gap: 0.375rem;
}

.phrase-input {
  flex: 1;
  min-width: 0;
}

.phrase-input :deep(.p-inputtext) {
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
}

.match-type-select {
  width: 110px;
  flex-shrink: 0;
}

.match-type-select :deep(.p-select-label) {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.phrase-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  min-height: 1.5rem;
}

/* Custom tag styling */
.phrase-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: default;
}

.tag-secondary {
  background: var(--surface-200);
  color: var(--text-color);
}

.tag-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.tag-success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.tag-warn {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

.tag-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.match-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.phrase-text {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-icon {
  font-size: 0.6rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s, color 0.15s;
  margin-left: 0.125rem;
}

.remove-icon:hover {
  opacity: 1;
  color: #ef4444;
}

.remove-icon.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-message {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Dark mode adjustments */
:root.dark .tag-secondary,
.dark-mode .tag-secondary,
[data-theme="dark"] .tag-secondary {
  background: var(--surface-300);
  color: var(--text-color);
}

:root.dark .tag-info,
.dark-mode .tag-info,
[data-theme="dark"] .tag-info {
  background: rgba(59, 130, 246, 0.25);
  color: #60a5fa;
}

:root.dark .tag-success,
.dark-mode .tag-success,
[data-theme="dark"] .tag-success {
  background: rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

:root.dark .tag-warn,
.dark-mode .tag-warn,
[data-theme="dark"] .tag-warn {
  background: rgba(234, 179, 8, 0.25);
  color: #facc15;
}

:root.dark .tag-danger,
.dark-mode .tag-danger,
[data-theme="dark"] .tag-danger {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
}
</style>
