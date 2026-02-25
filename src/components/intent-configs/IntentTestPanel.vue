<template>
  <div class="intent-test-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-info">
        <h3>Probar Deteccion de Intent</h3>
        <p class="text-sm text-muted-foreground">
          Escribe un mensaje para ver como seria detectado y ruteado
        </p>
      </div>
    </div>

    <!-- Test Input -->
    <div class="test-input-section glass-panel p-6">
      <div class="input-row">
        <div class="message-input">
          <label for="test_message" class="text-sm font-medium">Mensaje de prueba</label>
          <Textarea
            id="test_message"
            v-model="testMessage"
            placeholder="Ej: Hola, necesito ayuda con mi factura del mes pasado"
            class="w-full min-h-[80px]"
            @keydown.ctrl.enter="handleTest"
          />
          <small class="text-xs text-muted-foreground">Ctrl+Enter para probar</small>
        </div>
        <div class="domain-select-col">
          <label for="test_domain" class="text-sm font-medium">Dominio (opcional)</label>
          <Select v-model="testDomain">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Todos los dominios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los dominios</SelectItem>
              <SelectItem
                v-for="opt in domainOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        @click="handleTest"
        :disabled="!testMessage.trim() || !organizationId || loading"
      >
        <Spinner v-if="loading" size="sm" class="mr-2" />
        <i v-else class="pi pi-search mr-2" />
        Detectar Intent
      </Button>
    </div>

    <!-- Result Section -->
    <transition name="fade">
      <div v-if="lastTestResult" class="result-section glass-card p-6">
        <div class="result-header">
          <h4 class="text-base font-semibold">Resultado</h4>
          <Badge :variant="getConfidenceVariant(lastTestResult.confidence)">
            {{ getConfidenceLabel(lastTestResult.confidence) }}
          </Badge>
        </div>

        <div class="result-grid">
          <!-- Main Result -->
          <div class="result-card main-result">
            <div class="result-icon bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Intent Detectado</span>
              <span class="result-value">{{ lastTestResult.detected_intent }}</span>
            </div>
          </div>

          <!-- Target Agent -->
          <div class="result-card">
            <div class="result-icon bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <i class="pi pi-android"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Agente Destino</span>
              <span class="result-value">
                {{ formatAgentName(lastTestResult.target_agent) }}
                <Badge
                  v-if="lastTestResult.is_flow_agent"
                  variant="warning"
                  class="text-[0.625rem]"
                >
                  FLOW
                </Badge>
              </span>
            </div>
          </div>

          <!-- Confidence -->
          <div class="result-card">
            <div class="result-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <i class="pi pi-percentage"></i>
            </div>
            <div class="result-content">
              <span class="result-label">Confianza</span>
              <div class="confidence-display">
                <Progress
                  :model-value="lastTestResult.confidence * 100"
                  class="w-[100px] h-2"
                  :class="getConfidenceProgressClass(lastTestResult.confidence)"
                />
                <span class="confidence-value">{{ (lastTestResult.confidence * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Method -->
          <div class="result-card">
            <div class="result-icon bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
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
            <Badge
              v-for="kw in lastTestResult.matched_keywords"
              :key="kw"
              variant="info"
            >
              {{ kw }}
            </Badge>
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
    <div v-if="testHistory.length" class="history-section glass-panel p-4">
      <div class="history-header">
        <h5><i class="pi pi-history"></i> Historial de Pruebas</h5>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" class="h-7 w-7" @click="clearHistory">
                <i class="pi pi-trash text-xs" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpiar historial</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
            <Badge variant="secondary">{{ item.result.detected_intent }}</Badge>
            <span class="history-confidence">{{ (item.result.confidence * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

import { useIntentConfig } from '@/composables/useIntentConfig'
import { useAuthStore } from '@/stores/auth.store'
import type { IntentTestResult } from '@/types/intentConfigs.types'

// Composables
const authStore = useAuthStore()
const { lastTestResult, loading, testIntent } = useIntentConfig()

// State
const testMessage = ref('')
const testDomain = ref<string>('__all__')
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

function getConfidenceVariant(confidence: number): 'success' | 'warning' | 'destructive' {
  if (confidence >= 0.75) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'destructive'
}

function getConfidenceProgressClass(confidence: number): string {
  if (confidence >= 0.75) return '[&>div]:bg-green-500'
  if (confidence >= 0.5) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
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
      domain_key: testDomain.value === '__all__' ? null : testDomain.value,
    })

    if (result) {
      // Add to history
      testHistory.value.unshift({
        message: testMessage.value,
        domain: testDomain.value === '__all__' ? null : testDomain.value,
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
  testDomain.value = item.domain ?? '__all__'
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

/* Test Input Section */
.input-row {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 1rem;
  margin-bottom: 1rem;
}

.message-input,
.domain-select-col {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* Result Section */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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
  background: hsl(var(--muted));
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

.result-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.result-label {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
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

.confidence-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confidence-value {
  font-weight: 600;
}

/* Reasoning Section */
.reasoning-section,
.keywords-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--border));
}

.reasoning-section h5,
.keywords-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: hsl(var(--muted-foreground));
}

.reasoning-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: hsl(var(--foreground));
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
  color: hsl(var(--muted-foreground));
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
  color: hsl(var(--muted-foreground));
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
  background: hsl(var(--card));
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: hsl(var(--accent));
}

.history-message {
  font-size: 0.875rem;
  color: hsl(var(--foreground));
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
  color: hsl(var(--muted-foreground));
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
