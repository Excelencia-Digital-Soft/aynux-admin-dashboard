<template>
  <Dialog
    v-model:visible="visible"
    header="Test Prompt"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    :maximizable="true"
    modal
    @update:visible="handleClose"
  >
    <div class="yaml-test-dialog">
      <!-- Prompt Info -->
      <Card class="mb-4">
        <template #title>
          <i class="pi pi-info-circle"></i>
          Informacion del Prompt
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <strong>Key:</strong>
              <Tag :value="promptKey" severity="secondary" class="ml-2" />
            </div>
            <div>
              <strong>Dominio:</strong>
              <Tag :value="promptDomain" severity="info" class="ml-2" />
            </div>
            <div>
              <strong>Modelo:</strong>
              <Tag :value="currentPrompt?.metadata?.model || 'default'" class="ml-2" />
            </div>
            <div>
              <strong>Tokens maximos:</strong>
              <span class="ml-2">{{ currentPrompt?.metadata?.max_tokens || 2048 }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Test Variables -->
      <Card class="mb-4">
        <template #title>
          <div class="flex items-center justify-between w-full">
            <span>
              <i class="pi pi-sliders-h"></i>
              Variables de Prueba
              <Tag
                v-if="availableVariables.length > 0"
                :value="`${availableVariables.length} variables`"
                severity="secondary"
                class="ml-2"
              />
            </span>
            <Button
              v-if="availableVariables.length > 0"
              @click="autoFillAllVariables"
              icon="pi pi-bolt"
              label="Auto-completar"
              severity="success"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div v-if="availableVariables.length > 0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="variable in availableVariables"
                :key="variable.name"
                class="variable-field"
              >
                <label :for="variable.name" class="block text-sm font-medium mb-2">
                  {{ variable.name }}
                  <span v-if="variable.required" class="text-red-500">*</span>
                  <Tag
                    v-if="variable.type"
                    :value="variable.type"
                    severity="info"
                    size="small"
                    class="ml-2"
                  />
                </label>

                <div v-if="isLargeTextField(variable)">
                  <Textarea
                    :id="variable.name"
                    v-model="testData.variables[variable.name]"
                    :placeholder="variable.example"
                    rows="4"
                    class="w-full"
                  />
                </div>

                <div v-else>
                  <InputText
                    :id="variable.name"
                    v-model="testData.variables[variable.name]"
                    :placeholder="variable.example"
                    class="w-full"
                  />
                </div>

                <div class="flex items-center gap-2 mt-1">
                  <small v-if="variable.example" class="text-muted flex-1">
                    Ej: {{ truncateExample(variable.example) }}
                  </small>
                  <Button
                    @click="setExampleValue(variable)"
                    icon="pi pi-lightbulb"
                    size="small"
                    severity="secondary"
                    text
                    v-tooltip="'Usar ejemplo'"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-muted text-center py-4">
            <i class="pi pi-info-circle mr-2"></i>
            No se detectaron variables en este template
          </div>
        </template>
      </Card>

      <!-- Test Configuration -->
      <Card class="mb-4">
        <template #title>
          <i class="pi pi-cog"></i>
          Configuracion de Test
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="field">
              <label for="model">Modelo para test</label>
              <Select
                id="model"
                v-model="testConfig.model"
                :options="modelOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar modelo"
                class="w-full"
              />
            </div>

            <div class="field">
              <label for="temperature">Temperature</label>
              <InputNumber
                id="temperature"
                v-model="testConfig.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                class="w-full"
              />
            </div>

            <div class="field">
              <label for="max_tokens">Max Tokens</label>
              <InputNumber
                id="max_tokens"
                v-model="testConfig.max_tokens"
                :min="1"
                :max="4000"
                class="w-full"
              />
            </div>

            <div class="field">
              <label for="timeout">Timeout (segundos)</label>
              <InputNumber
                id="timeout"
                v-model="testConfig.timeout"
                :min="5"
                :max="120"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Test Actions -->
      <div class="test-actions mb-4">
        <Button
          @click="loadPresetValues"
          icon="pi pi-refresh"
          label="Cargar preset"
          severity="secondary"
        />
        <Button
          @click="clearAllValues"
          icon="pi pi-times"
          label="Limpiar valores"
          severity="secondary"
        />
        <Button
          @click="executeTest"
          icon="pi pi-play"
          label="Ejecutar Test"
          :loading="testing"
          :disabled="!canTest"
        />
      </div>

      <!-- Test Results -->
      <div v-if="testResult" class="test-results">
        <!-- Result Summary -->
        <Card class="mb-4">
          <template #title>
            <i class="pi pi-chart-bar"></i>
            Resultados del Test
          </template>
          <template #content>
            <div class="result-summary">
              <div class="summary-grid">
                <div>
                  <strong>Estado:</strong>
                  <Tag
                    :value="testResult.success ? 'Exitoso' : 'Fallido'"
                    :severity="testResult.success ? 'success' : 'danger'"
                    class="ml-2"
                  />
                </div>
                <div>
                  <strong>Tiempo de ejecucion:</strong>
                  <span class="ml-2">{{ Math.round(testResult.execution_time) }}ms</span>
                </div>
                <div v-if="testResult.token_usage">
                  <strong>Tokens usados:</strong>
                  <span class="ml-2">{{ testResult.token_usage.total_tokens }}</span>
                  <small class="text-muted">
                    ({{ testResult.token_usage.prompt_tokens }} prompt +
                    {{ testResult.token_usage.completion_tokens }} completion)
                  </small>
                </div>
              </div>

              <div v-if="testResult.errors && testResult.errors.length > 0" class="errors mt-3">
                <Message severity="error" :closable="false">
                  <div v-for="error in testResult.errors" :key="error" class="mb-1">
                    {{ error }}
                  </div>
                </Message>
              </div>
            </div>
          </template>
        </Card>

        <!-- Rendered Template -->
        <Card v-if="testResult.rendered_prompt" class="mb-4">
          <template #title>
            <i class="pi pi-eye"></i>
            Template Renderizado
          </template>
          <template #content>
            <div class="rendered-template">
              <pre>{{ testResult.rendered_prompt }}</pre>
              <Button
                @click="copyToClipboard(testResult.rendered_prompt)"
                icon="pi pi-copy"
                size="small"
                severity="secondary"
                label="Copiar"
                class="mt-2"
              />
            </div>
          </template>
        </Card>

        <!-- Model Response -->
        <Card v-if="testResult.model_response" class="mb-4">
          <template #title>
            <i class="pi pi-reply"></i>
            Respuesta del Modelo
          </template>
          <template #content>
            <div class="model-response">
              <pre>{{ testResult.model_response }}</pre>
              <Button
                @click="copyToClipboard(testResult.model_response)"
                icon="pi pi-copy"
                size="small"
                severity="secondary"
                label="Copiar"
                class="mt-2"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <template #footer>
      <Button
        @click="handleClose"
        label="Cerrar"
        severity="secondary"
        icon="pi pi-times"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { useYamlStore } from '@/stores/yaml.store'
import { useAIModels } from '@/composables/useAIModels'

// PrimeVue components
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

interface VariableDefinition {
  name: string
  required: boolean
  type: string
  example: string
}

interface Props {
  visible: boolean
  promptKey: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const toast = useToast()
const yamlStore = useYamlStore()

// AI Models from database
const { simpleOptions: modelOptions } = useAIModels()

// Store getters - use storeToRefs for reactivity
const { currentPrompt, testResult } = storeToRefs(yamlStore)

// Component state
const visible = ref(props.visible)
const testing = ref(false)
const availableVariables = ref<VariableDefinition[]>([])

const testData = ref({
  variables: {} as Record<string, string>,
  context: {
    user_id: 'test-user',
    tenant_id: 'test-tenant',
    session_id: 'test-session'
  }
})

const testConfig = ref({
  model: 'default',
  temperature: 0.7,
  max_tokens: 1000,
  timeout: 30
})

// Computed
const promptDomain = computed(() => {
  return currentPrompt.value?.metadata?.domain || props.promptKey.split('.')[0] || 'core'
})

const canTest = computed(() => {
  const requiredVariables = availableVariables.value.filter(v => v.required)
  return requiredVariables.every(v => testData.value.variables[v.name]?.trim())
})

// ============================================
// INTELLIGENT VARIABLE TYPE INFERENCE
// ============================================
function inferVariableType(varName: string, domain: string): string {
  const name = varName.toLowerCase()

  // Pattern-based type detection
  const patterns: Record<string, string[]> = {
    email: ['email', 'mail', 'correo'],
    phone: ['phone', 'telefono', 'celular', 'mobile', 'whatsapp'],
    date: ['date', 'fecha', 'due_date', 'created_at', 'updated_at', 'expiry'],
    time: ['time', 'hora', 'timestamp'],
    number: ['amount', 'quantity', 'count', 'total', 'balance', 'limit', 'price', 'cantidad', 'monto', 'saldo', 'debt', 'credit'],
    currency: ['currency', 'moneda'],
    boolean: ['is_', 'has_', 'can_', 'should_', 'awaiting_', 'identified', 'enabled', 'active'],
    json: ['_json', '_context', '_info', '_data', 'history', 'results', 'options', 'config', 'schema', 'intent'],
    text: ['message', 'description', 'query', 'template', 'content', 'summary', 'text', 'response', 'prompt']
  }

  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => name.includes(kw))) {
      return type
    }
  }

  // Domain-specific inference
  if (domain === 'credit' && (name.includes('debt') || name.includes('payment'))) return 'number'
  if (domain === 'pharmacy' && name.includes('medication')) return 'text'
  if (domain === 'ecommerce' && name.includes('product')) return 'json'

  return 'string'
}

// ============================================
// SMART EXAMPLE GENERATOR
// ============================================
function generateSmartExample(varName: string, domain: string): string {
  const name = varName.toLowerCase()
  const type = inferVariableType(varName, domain)

  // Exact name matches (highest priority)
  const exactExamples: Record<string, string> = {
    // Identity
    'customer_name': 'Maria Garcia',
    'user_name': 'Carlos Lopez',
    'name': 'Juan Perez',
    'pharmacy_name': 'Farmacia Central',
    'company': 'Empresa S.A.',
    'agent_name': 'Asistente Virtual',

    // Contact
    'email': 'cliente@ejemplo.com',
    'phone': '+54 11 1234-5678',
    'whatsapp': '+5491112345678',

    // Financial
    'balance': '15,420.50',
    'total_debt': '3,250.00',
    'credit_limit': '50,000.00',
    'available': '34,579.50',
    'amount': '1,500.00',
    'price': '299.99',

    // Dates
    'due_date': formatDate(7),
    'date': formatDate(0),
    'expiry_date': formatDate(30),

    // Counters
    'item_count': '3',
    'max_results': '10',
    'quantity': '5',

    // Messages
    'user_message': 'Hola, necesito ayuda con mi pedido',
    'user_query': 'Cual es el precio del producto X?',
    'message': 'Su solicitud ha sido procesada correctamente.',
    'greeting': 'Bienvenido! En que puedo ayudarte?',
    'response': 'Gracias por tu consulta. Aqui esta la informacion que solicitaste.',

    // Context and JSON
    'conversation_history': '[{"role":"user","content":"Hola"},{"role":"assistant","content":"En que puedo ayudarte?"}]',
    'intent_context': '{"intent":"consulta_producto","confidence":0.95}',
    'schema_context': '{"tables":["products","categories"],"columns":["id","name","price"]}',
    'options_reminder': '1. Opcion A\\n2. Opcion B\\n3. Opcion C',
    'capabilities': '["consulta_precio", "estado_pedido", "soporte_tecnico"]',

    // Status and flags
    'customer_identified': 'true',
    'awaiting_confirmation': 'false',
    'debt_status': 'al_dia',
    'status': 'activo',

    // Pharmacy specific
    'medication': 'Paracetamol 500mg',
    'dosage': '1 comprimido cada 8 horas',
    'prescription': 'Receta medica #12345',

    // E-commerce specific
    'product_name': 'Laptop HP 15.6"',
    'category': 'Tecnologia',
    'sku': 'PROD-001234',
    'order_id': 'ORD-2024-001234',
    'tracking_number': 'TRK-789456123',

    // IDs
    'customer_id': 'CUST-001234',
    'session_id': 'SES-' + Date.now(),
    'tenant_id': 'TEN-001',

    // Summaries
    'items_summary': '- Producto A (x2): $500\\n- Producto B (x1): $250\\n- Total: $1,250',
    'order_summary': 'Pedido #12345 - 3 productos - Total: $1,500'
  }

  // Check exact match
  if (exactExamples[name]) {
    return exactExamples[name]
  }

  // Check partial match (name contains key or vice versa)
  for (const [key, value] of Object.entries(exactExamples)) {
    if (name.includes(key) || key.includes(name)) {
      return value
    }
  }

  // Generate based on inferred type
  const typeGenerators: Record<string, () => string> = {
    email: () => `${varName.replace(/_/g, '.')}@ejemplo.com`,
    phone: () => `+54 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: () => formatDate(0),
    time: () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    number: () => String(Math.floor(100 + Math.random() * 9900)),
    currency: () => 'ARS',
    boolean: () => 'true',
    json: () => '{}',
    text: () => `Contenido de ejemplo para ${varName.replace(/_/g, ' ')}`
  }

  if (typeGenerators[type]) {
    return typeGenerators[type]()
  }

  // Domain-specific fallback examples
  const domainExamples: Record<string, Record<string, string>> = {
    pharmacy: {
      'medication': 'Ibuprofeno 400mg',
      'prescription': 'RX-2024-001',
      'patient': 'Paciente de ejemplo'
    },
    credit: {
      'account': 'CTA-001234',
      'payment': '2,500.00',
      'interest': '12.5%'
    },
    ecommerce: {
      'product': 'Producto de ejemplo',
      'category': 'Categoria general',
      'price': '999.99'
    },
    excelencia: {
      'module': 'Inventario',
      'software': 'Excelencia ERP',
      'feature': 'Gestion de Stock'
    },
    agents: {
      'objective': 'Ayudar al cliente con su consulta',
      'personality': 'Amable y profesional',
      'language': 'espanol'
    }
  }

  if (domainExamples[domain]) {
    for (const [key, value] of Object.entries(domainExamples[domain])) {
      if (name.includes(key)) {
        return value
      }
    }
  }

  // Final fallback
  return `Ejemplo de ${varName.replace(/_/g, ' ')}`
}

function formatDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toLocaleDateString('es-ES')
}

// ============================================
// VARIABLE EXTRACTION (Metadata-first approach)
// ============================================
async function extractVariables() {
  if (!currentPrompt.value) return

  const variables: VariableDefinition[] = []
  const domain = promptDomain.value

  // 1. First, use variables from metadata (authoritative source)
  const metaVars = currentPrompt.value.metadata?.variables || { required: [], optional: [] }

  // Add required variables from metadata
  if (Array.isArray(metaVars.required)) {
    metaVars.required.forEach((varName: string) => {
      variables.push({
        name: varName,
        required: true,
        type: inferVariableType(varName, domain),
        example: generateSmartExample(varName, domain)
      })
    })
  }

  // Add optional variables from metadata
  if (Array.isArray(metaVars.optional)) {
    metaVars.optional.forEach((varName: string) => {
      variables.push({
        name: varName,
        required: false,
        type: inferVariableType(varName, domain),
        example: generateSmartExample(varName, domain)
      })
    })
  }

  // 2. If no variables in metadata, extract from template (fallback)
  if (variables.length === 0 && currentPrompt.value.template) {
    const template = currentPrompt.value.template
    const regex = /\{([^{}]+)\}/g
    const matches = [...template.matchAll(regex)]
    const seenVars = new Set<string>()

    matches.forEach(match => {
      const varName = match[1].trim()

      // Skip invalid or duplicate variables
      if (seenVars.has(varName)) return
      if (varName.startsWith('"') || varName.includes(':') || varName.includes('.')) return

      seenVars.add(varName)

      const isOptional = varName.includes('?')
      const cleanName = varName.replace('?', '')

      variables.push({
        name: cleanName,
        required: !isOptional,
        type: inferVariableType(cleanName, domain),
        example: generateSmartExample(cleanName, domain)
      })
    })
  }

  availableVariables.value = variables

  // Initialize test data with smart examples
  variables.forEach(v => {
    if (!testData.value.variables[v.name]) {
      testData.value.variables[v.name] = v.example
    }
  })
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================
function isLargeTextField(variable: VariableDefinition): boolean {
  const name = variable.name.toLowerCase()
  const largeFieldPatterns = ['template', 'text', 'description', 'message', 'content', 'history', 'context', 'summary', 'json', 'prompt', 'response', 'query']
  return largeFieldPatterns.some(p => name.includes(p)) || variable.type === 'json' || variable.type === 'text'
}

function truncateExample(example: string, maxLength = 50): string {
  if (example.length <= maxLength) return example
  return example.substring(0, maxLength) + '...'
}

function setExampleValue(variable: VariableDefinition) {
  testData.value.variables[variable.name] = variable.example
}

function autoFillAllVariables() {
  const domain = promptDomain.value
  availableVariables.value.forEach(variable => {
    testData.value.variables[variable.name] = generateSmartExample(variable.name, domain)
  })

  toast.add({
    severity: 'success',
    summary: 'Completado',
    detail: `Se han generado ${availableVariables.value.length} valores de ejemplo`,
    life: 3000
  })
}

function loadPresetValues() {
  autoFillAllVariables()
}

function clearAllValues() {
  availableVariables.value.forEach(variable => {
    testData.value.variables[variable.name] = ''
  })

  toast.add({
    severity: 'info',
    summary: 'Valores limpiados',
    detail: 'Se han limpiado todos los valores de las variables',
    life: 3000
  })
}

async function executeTest() {
  if (!currentPrompt.value) return

  testing.value = true

  try {
    await yamlStore.testPrompt(props.promptKey, {
      variables: testData.value.variables,
      context: testData.value.context
    })

    toast.add({
      severity: 'success',
      summary: 'Test ejecutado',
      detail: 'El test se ha ejecutado exitosamente',
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error en test',
      detail: error.message || 'Error al ejecutar el test',
      life: 5000
    })
  } finally {
    testing.value = false
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'Texto copiado al portapapeles',
      life: 2000
    })
  }).catch(() => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo copiar al portapapeles',
      life: 3000
    })
  })
}

function handleClose() {
  emit('close')
}

// Watchers
watch(() => props.visible, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  if (!newVal) {
    emit('close')
  }
})

// Lifecycle
onMounted(async () => {
  if (props.promptKey && !currentPrompt.value) {
    await yamlStore.fetchPromptByKey(props.promptKey)
  }

  if (currentPrompt.value) {
    // Set default test config from prompt metadata with fallbacks
    testConfig.value.model = currentPrompt.value.metadata?.model || 'default'
    testConfig.value.temperature = currentPrompt.value.metadata?.temperature ?? 0.7
    testConfig.value.max_tokens = currentPrompt.value.metadata?.max_tokens ?? 1000

    await extractVariables()
  }
})
</script>

<style scoped>
.yaml-test-dialog {
  max-height: 80vh;
  overflow-y: auto;
}

.variable-field {
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
  border: 1px solid var(--surface-200);
}

.variable-field label {
  color: var(--text-color);
  font-weight: 500;
}

.test-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.result-summary {
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.errors,
.warnings {
  margin-top: 1rem;
}

.rendered-template,
.model-response {
  position: relative;
}

.rendered-template pre,
.model-response pre {
  background: var(--surface-100);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}

.text-muted {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .test-actions {
    flex-direction: column;
  }

  .test-actions button {
    width: 100%;
  }
}
</style>
