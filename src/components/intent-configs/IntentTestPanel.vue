<template>
  <div class="intent-test-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-info">
        <h3>Probar Deteccion de Intent</h3>
        <p class="text-muted">
          Escribe un mensaje para ver como seria detectado y ruteado
        </p>
      </div>
    </div>

    <!-- Test Input -->
    <div class="test-input-section">
      <div class="input-row">
        <div class="message-input">
          <label for="test_message">Mensaje de prueba</label>
          <Textarea
            id="test_message"
            v-model="testMessage"
            rows="3"
            placeholder="Ej: Hola, necesito ayuda con mi factura del mes pasado"
            class="w-full"
            @keydown.ctrl.enter="handleTest"
          />
          <small>Ctrl+Enter para probar</small>
        </div>
        <div class="domain-select">
          <label for="test_domain">Dominio (opcional)</label>
          <Select
            id="test_domain"
            v-model="testDomain"
            :options="domainOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos los dominios"
            showClear
            class="w-full"
          />
        </div>
      </div>
      <Button
        label="Detectar Intent"
        icon="pi pi-search"
        @click="handleTest"
        :loading="loading"
        :disabled="!testMessage.trim() || !organizationId"
      />
    </div>

    <!-- Result Section -->
    <transition name="fade">
      <div v-if="lastTestResult" class="result-section">
        <div class="result-header">
          <h4>Resultado</h4>
          <Tag
            :value="getConfidenceLabel(lastTestResult.confidence)"
            :severity="getConfidenceSeverity(lastTestResult.confidence)"
          />
        </div>

        <div class="result-grid">
          <!-- Main Result -->
          <div class="result-card main-result">
            <div class="result-icon success">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Intent Detectado</span>
              <span class="result-value">{{ lastTestResult.detected_intent }}</span>
            </div>
          </div>

          <!-- Target Agent -->
          <div class="result-card">
            <div class="result-icon agent">
              <i class="pi pi-android"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Agente Destino</span>
              <span class="result-value">
                {{ formatAgentName(lastTestResult.target_agent) }}
                <Tag
                  v-if="lastTestResult.is_flow_agent"
                  value="FLOW"
                  severity="warning"
                  class="flow-tag"
                />
              </span>
            </div>
          </div>

          <!-- Confidence -->
          <div class="result-card">
            <div class="result-icon confidence">
              <i class="pi pi-percentage"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Confianza</span>
              <div class="confidence-display">
                <ProgressBar
                  :value="lastTestResult.confidence * 100"
                  :showValue="false"
                  :class="getConfidenceClass(lastTestResult.confidence)"
                  style="height: 8px; width: 100px"
                />
                <span class="confidence-value">{{ (lastTestResult.confidence * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Method -->
          <div class="result-card">
            <div class="result-icon method">
              <i class="pi pi-cog"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Metodo de Deteccion</span>
              <span class="result-value">{{ formatMethod(lastTestResult.method) }}</span>
            </div>
          </div>
        </div>

        <!-- Reasoning -->
        <div class="reasoning-section">
          <h5><i class="pi pi-lightbulb"></i> Razonamiento</h5>
          <p class="reasoning-text">{{ lastTestResult.reasoning }}</p>
        </div>

        <!-- Matched Keywords -->
        <div v-if="lastTestResult.matched_keywords.length" class="keywords-section">
          <h5><i class="pi pi-tag"></i> Keywords Encontrados</h5>
          <div class="matched-keywords">
            <Tag
              v-for="kw in lastTestResult.matched_keywords"
              :key="kw"
              :value="kw"
              severity="info"
            />
          </div>
        </div>
      </div>
    </transition>

    <!-- Empty State -->
    <div v-if="!lastTestResult && !loading" class="empty-state">
      <i class="pi pi-comments empty-icon"></i>
      <p>Escribe un mensaje para probar la deteccion de intent</p>
    </div>

    <!-- History -->
    <div v-if="testHistory.length" class="history-section">
      <div class="history-header">
        <h5><i class="pi pi-history"></i> Historial de Pruebas</h5>
        <Button
          icon="pi pi-trash"
          severity="secondary"
          text
          size="small"
          @click="clearHistory"
          v-tooltip="'Limpiar historial'"
        />
      </div>
      <div class="history-list">
        <div
          v-for="(item, index) in testHistory"
          :key="index"
          class="history-item"
          @click="loadFromHistory(item)"
        >
          <div class="history-message">{{ truncate(item.message, 50) }}</div>
          <div class="history-result">
            <Tag :value="item.result.detected_intent" size="small" />
            <span class="history-confidence">{{ (item.result.confidence * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'

import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type { IntentTestResult } from '@/types/intentConfigs.types'

// Composables
const authStore = useAuthStore()
const { lastTestResult, loading, testIntent } = useIntentConfig()

// State
const testMessage = ref('')
const testDomain = ref<string | null>(null)
const testHistory = ref<{ message: string; domain: string | null; result: IntentTestResult }[]>([])

// Computed
const organizationId = computed(() => authStore.currentOrgId)

// Options
const domainOptions = [
  { label: 'Excelencia', value: 'excelencia' },
  { label: 'Pharmacy', value: 'pharmacy' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Healthcare', value: 'healthcare' },
]

// Helpers
function formatAgentName(agentKey: string): string {
  return agentKey
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMethod(method: string): string {
  const methods: Record<string, string> = {
    llm: 'LLM Analysis',
    keyword_match: 'Keyword Match',
    llm_keyword: 'LLM + Keywords',
    fallback: 'Fallback Default',
  }
  return methods[method] || method
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Muy Alta'
  if (confidence >= 0.75) return 'Alta'
  if (confidence >= 0.5) return 'Media'
  if (confidence >= 0.25) return 'Baja'
  return 'Muy Baja'
}

function getConfidenceSeverity(confidence: number): string {
  if (confidence >= 0.75) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'danger'
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.75) return 'confidence-high'
  if (confidence >= 0.5) return 'confidence-medium'
  return 'confidence-low'
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Handlers
async function handleTest() {
  if (!testMessage.value.trim() || !organizationId.value) return

  try {
    const result = await testIntent({
      message: testMessage.value,
      domain_key: testDomain.value,
    })

    if (result) {
      // Add to history
      testHistory.value.unshift({
        message: testMessage.value,
        domain: testDomain.value,
        result,
      })
      // Keep only last 10
      if (testHistory.value.length > 10) {
        testHistory.value.pop()
      }
    }
  } catch (error) {
    // Error handled in composable
  }
}

function loadFromHistory(item: { message: string; domain: string | null; result: IntentTestResult }) {
  testMessage.value = item.message
  testDomain.value = item.domain
}

function clearHistory() {
  testHistory.value = []
}

// Load history from localStorage
onMounted(() => {
  const saved = localStorage.getItem('intent_test_history')
  if (saved) {
    try {
      testHistory.value = JSON.parse(saved)
    } catch {
      // Ignore parse errors
    }
  }
})

// Save history to localStorage on change (simple implementation)
// In production, you'd use a watcher with debounce
</script>

<style scoped>
.intent-test-panel {
  width: 100%;
}

.panel-header {
  margin-bottom: 1.5rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.header-info .text-muted {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

/* Test Input Section */
.test-input-section {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 1rem;
  margin-bottom: 1rem;
}

.message-input,
.domain-select {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.message-input label,
.domain-select label {
  font-weight: 500;
  font-size: 0.875rem;
}

.message-input small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* Result Section */
.result-section {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  font-size: 1rem;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.result-card.main-result {
  grid-column: span 2;
}

@media (max-width: 640px) {
  .result-card.main-result {
    grid-column: span 1;
  }
}

.result-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-icon.success {
  background: var(--green-100);
  color: var(--green-600);
}

.result-icon.agent {
  background: var(--primary-100);
  color: var(--primary-600);
}

.result-icon.confidence {
  background: var(--blue-100);
  color: var(--blue-600);
}

.result-icon.method {
  background: var(--purple-100);
  color: var(--purple-600);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.result-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-value {
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.flow-tag {
  font-size: 0.625rem;
}

.confidence-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confidence-value {
  font-weight: 600;
}

:deep(.confidence-high .p-progressbar-value) {
  background: var(--green-500);
}

:deep(.confidence-medium .p-progressbar-value) {
  background: var(--yellow-500);
}

:deep(.confidence-low .p-progressbar-value) {
  background: var(--red-500);
}

/* Reasoning Section */
.reasoning-section,
.keywords-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.reasoning-section h5,
.keywords-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
}

.reasoning-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-color);
}

.matched-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
}

/* History Section */
.history-section {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-header h5 {
  margin: 0;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--surface-card);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: var(--surface-hover);
}

.history-message {
  font-size: 0.875rem;
  color: var(--text-color);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.history-confidence {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.w-full {
  width: 100%;
}
</style>
