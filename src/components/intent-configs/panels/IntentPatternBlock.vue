<script setup lang="ts">
/**
 * IntentPatternBlock - Per-intent component rendering all 4 pattern categories
 * with inline add/remove for lemmas, keywords, phrases, and confirmations.
 */
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { DomainIntent, MatchType } from '@/types/domainIntents.types'

interface Props {
  intent: DomainIntent
  domainKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'addLemma', intentId: string, value: string): void
  (e: 'removeLemma', intentId: string, value: string): void
  (e: 'addKeyword', intentId: string, value: string): void
  (e: 'removeKeyword', intentId: string, value: string): void
  (e: 'addPhrase', intentId: string, value: string, matchType: MatchType): void
  (e: 'removePhrase', intentId: string, value: string): void
  (e: 'addConfirmation', intentId: string, value: string, matchType: MatchType): void
  (e: 'removeConfirmation', intentId: string, value: string): void
}>()

// Collapse state
const isExpanded = ref(false)

// Local inputs
const newLemma = ref('')
const newKeyword = ref('')
const newPhrase = ref('')
const newPhraseMatchType = ref<MatchType>('contains')
const newConfirmation = ref('')
const newConfirmationMatchType = ref<MatchType>('exact')

const matchTypeOptions = [
  { value: 'exact', label: 'Exacto' },
  { value: 'contains', label: 'Contiene' },
  { value: 'prefix', label: 'Prefijo' }
]

function matchTypeShort(mt: string): string {
  const map: Record<string, string> = { exact: 'E', contains: 'C', prefix: 'P' }
  return map[mt] || mt[0]?.toUpperCase() || '?'
}

// Counts
function patternCount(): number {
  return (
    props.intent.lemmas.length +
    props.intent.keywords.length +
    props.intent.phrases.length +
    props.intent.confirmation_patterns.length
  )
}

// Add handlers
function handleAddLemma() {
  const v = newLemma.value.trim()
  if (!v) return
  emit('addLemma', props.intent.id, v)
  newLemma.value = ''
}

function handleAddKeyword() {
  const v = newKeyword.value.trim()
  if (!v) return
  emit('addKeyword', props.intent.id, v)
  newKeyword.value = ''
}

function handleAddPhrase() {
  const v = newPhrase.value.trim()
  if (!v) return
  emit('addPhrase', props.intent.id, v, newPhraseMatchType.value)
  newPhrase.value = ''
}

function handleAddConfirmation() {
  const v = newConfirmation.value.trim()
  if (!v) return
  emit('addConfirmation', props.intent.id, v, newConfirmationMatchType.value)
  newConfirmation.value = ''
}
</script>

<template>
  <div class="intent-block" :class="{ expanded: isExpanded }">
    <!-- Collapsed header -->
    <div class="block-header" @click="isExpanded = !isExpanded">
      <div class="header-left">
        <i :class="['pi', isExpanded ? 'pi-chevron-down' : 'pi-chevron-right']" />
        <code class="intent-key">{{ intent.intent_key }}</code>
      </div>
      <span class="pattern-count">{{ patternCount() }} patrones</span>
    </div>

    <!-- Expanded content -->
    <div v-if="isExpanded" class="block-content">
      <!-- Lemmas -->
      <div class="pattern-section">
        <div class="pattern-label">
          <i class="pi pi-book" />
          <span>Lemmas</span>
          <span class="count">({{ intent.lemmas.length }})</span>
        </div>
        <div class="tags-area">
          <Tag
            v-for="lemma in intent.lemmas"
            :key="lemma"
            :value="lemma"
            severity="secondary"
            class="pattern-tag"
          >
            <template #default>
              <span class="tag-text">{{ lemma }}</span>
              <i
                class="pi pi-times tag-remove"
                @click.stop="emit('removeLemma', intent.id, lemma)"
              />
            </template>
          </Tag>
        </div>
        <div class="add-row">
          <InputText
            v-model="newLemma"
            placeholder="Nuevo lemma..."
            class="add-input"
            size="small"
            @keydown.enter="handleAddLemma"
          />
          <Button
            icon="pi pi-plus"
            severity="secondary"
            text
            size="small"
            @click="handleAddLemma"
            :disabled="!newLemma.trim()"
          />
        </div>
      </div>

      <!-- Keywords -->
      <div class="pattern-section">
        <div class="pattern-label">
          <i class="pi pi-key" />
          <span>Keywords</span>
          <span class="count">({{ intent.keywords.length }})</span>
        </div>
        <div class="tags-area">
          <Tag
            v-for="kw in intent.keywords"
            :key="kw"
            :value="kw"
            severity="secondary"
            class="pattern-tag"
          >
            <template #default>
              <span class="tag-text">{{ kw }}</span>
              <i
                class="pi pi-times tag-remove"
                @click.stop="emit('removeKeyword', intent.id, kw)"
              />
            </template>
          </Tag>
        </div>
        <div class="add-row">
          <InputText
            v-model="newKeyword"
            placeholder="Nuevo keyword..."
            class="add-input"
            size="small"
            @keydown.enter="handleAddKeyword"
          />
          <Button
            icon="pi pi-plus"
            severity="secondary"
            text
            size="small"
            @click="handleAddKeyword"
            :disabled="!newKeyword.trim()"
          />
        </div>
      </div>

      <!-- Phrases -->
      <div class="pattern-section">
        <div class="pattern-label">
          <i class="pi pi-comments" />
          <span>Frases</span>
          <span class="count">({{ intent.phrases.length }})</span>
        </div>
        <div class="tags-area">
          <Tag
            v-for="p in intent.phrases"
            :key="p.phrase"
            severity="success"
            class="pattern-tag phrase-tag"
          >
            <template #default>
              <span class="match-badge">{{ matchTypeShort(p.match_type) }}</span>
              <span class="tag-text">{{ p.phrase }}</span>
              <i
                class="pi pi-times tag-remove"
                @click.stop="emit('removePhrase', intent.id, p.phrase)"
              />
            </template>
          </Tag>
        </div>
        <div class="add-row stacked">
          <div class="add-input-row">
            <InputText
              v-model="newPhrase"
              placeholder="Nueva frase..."
              class="add-input"
              size="small"
              @keydown.enter="handleAddPhrase"
            />
            <Button
              icon="pi pi-plus"
              severity="secondary"
              text
              size="small"
              @click="handleAddPhrase"
              :disabled="!newPhrase.trim()"
            />
          </div>
          <Select
            v-model="newPhraseMatchType"
            :options="matchTypeOptions"
            optionLabel="label"
            optionValue="value"
            class="match-select"
            size="small"
          />
        </div>
      </div>

      <!-- Confirmations -->
      <div class="pattern-section">
        <div class="pattern-label">
          <i class="pi pi-check-circle" />
          <span>Confirmaciones</span>
          <span class="count">({{ intent.confirmation_patterns.length }})</span>
        </div>
        <div class="tags-area">
          <Tag
            v-for="cp in intent.confirmation_patterns"
            :key="cp.pattern"
            severity="warn"
            class="pattern-tag confirmation-tag"
          >
            <template #default>
              <span class="match-badge">{{ matchTypeShort(cp.pattern_type) }}</span>
              <span class="tag-text">{{ cp.pattern }}</span>
              <i
                class="pi pi-times tag-remove"
                @click.stop="emit('removeConfirmation', intent.id, cp.pattern)"
              />
            </template>
          </Tag>
        </div>
        <div class="add-row stacked">
          <div class="add-input-row">
            <InputText
              v-model="newConfirmation"
              placeholder="Nuevo patron..."
              class="add-input"
              size="small"
              @keydown.enter="handleAddConfirmation"
            />
            <Button
              icon="pi pi-plus"
              severity="secondary"
              text
              size="small"
              @click="handleAddConfirmation"
              :disabled="!newConfirmation.trim()"
            />
          </div>
          <Select
            v-model="newConfirmationMatchType"
            :options="matchTypeOptions"
            optionLabel="label"
            optionValue="value"
            class="match-select"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intent-block {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.block-header:hover {
  background: var(--surface-hover);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.header-left i {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  transition: transform 0.15s;
}

.intent-key {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
  padding: 1px 4px;
  background: var(--surface-card);
  border-radius: 3px;
}

.pattern-count {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.block-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
}

.pattern-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.pattern-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
}

.pattern-label i {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.pattern-label .count {
  font-weight: 400;
  color: var(--text-color-secondary);
}

.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-height: 1.5rem;
}

.pattern-tag {
  font-size: 0.7rem !important;
  padding: 2px 6px !important;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.tag-text {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-remove {
  font-size: 0.55rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.tag-remove:hover {
  opacity: 1;
}

.match-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 2px;
  font-size: 0.55rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.add-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.add-row.stacked {
  flex-direction: column;
  align-items: stretch;
}

.add-input-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.add-input {
  flex: 1;
  font-size: 0.75rem !important;
}

.match-select {
  font-size: 0.75rem !important;
}

/* Dark mode adjustments */
:root.dark .intent-key,
.dark-mode .intent-key,
[data-theme="dark"] .intent-key {
  background: rgba(255, 255, 255, 0.08);
}

:root.dark .match-badge,
.dark-mode .match-badge,
[data-theme="dark"] .match-badge {
  background: rgba(0, 0, 0, 0.2);
}
</style>
