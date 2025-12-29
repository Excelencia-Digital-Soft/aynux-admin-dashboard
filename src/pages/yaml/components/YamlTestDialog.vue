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
          Información del Prompt
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Key:</strong>
              <Tag :value="promptKey" severity="secondary" class="ml-2" />
            </div>
            <div>
              <strong>Modelo:</strong>
              <Tag :value="currentPrompt?.metadata.model" class="ml-2" />
            </div>
            <div>
              <strong>Tokens máximos:</strong>
              <span class="ml-2">{{ currentPrompt?.metadata.max_tokens }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Test Variables -->
      <Card class="mb-4">
        <template #title>
          <i class="pi pi-sliders-h"></i>
          Variables de Prueba
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
                
                <div v-if="variable.name.includes('template') || variable.name.includes('text')">
                  <Textarea 
                    :id="variable.name"
                    v-model="testData.variables[variable.name]" 
                    :placeholder="getPlaceholder(variable)"
                    rows="4"
                    class="w-full"
                  />
                </div>
                
                <div v-else>
                  <InputText 
                    :id="variable.name"
                    v-model="testData.variables[variable.name]" 
                    :placeholder="getPlaceholder(variable)"
                    class="w-full"
                  />
                </div>
                
                <small v-if="variable.example" class="text-muted">
                  Ejemplo: {{ variable.example }}
                </small>
                
                <Button 
                  @click="setExampleValue(variable)" 
                  icon="pi pi-lightbulb" 
                  size="small"
                  severity="secondary"
                  label="Usar ejemplo"
                  class="mt-1"
                />
              </div>
            </div>
          </div>
          
          <div v-else class="text-muted text-center py-4">
            No se detectaron variables en este template
          </div>
        </template>
      </Card>

      <!-- Test Configuration -->
      <Card class="mb-4">
        <template #title>
          <i class="pi pi-cog"></i>
          Configuración de Test
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label for="model">Modelo para test</label>
              <Select
                id="model"
                v-model="testConfig.model"
                :options="modelOptions"
                optionLabel="label"
                optionValue="value"
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
                  <strong>Tiempo de ejecución:</strong>
                  <span class="ml-2">{{ testResult.execution_time }}ms</span>
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
import { useToast } from 'primevue/usetoast'
import { useYamlStore } from '@/stores/yaml.store'
import { useAIModels } from '@/composables/useAIModels'
import type { PromptVersion, TestResult } from '@/types/yaml.types'

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

// AI Models from database (replaces hardcoded list)
const { simpleOptions: modelOptions, defaultModel } = useAIModels()

// Store getters
const { currentPrompt, versions, testResult } = yamlStore

// Component state
const visible = ref(props.visible)
const testing = ref(false)
const availableVariables = ref<Array<{ name: string; required: boolean; type?: string; example?: string }>>([])

const testData = ref({
  variables: {} as Record<string, any>,
  context: {
    user_id: 'test-user',
    tenant_id: 'test-tenant',
    session_id: 'test-session'
  }
})

const testConfig = ref({
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 1000,
  timeout: 30
})

// modelOptions is now provided by useAIModels() composable above

// Computed
const canTest = computed(() => {
  // Check if all required variables have values
  const requiredVariables = availableVariables.value.filter(v => v.required)
  return requiredVariables.every(v => testData.value.variables[v.name])
})

// Methods
async function extractVariables() {
  if (!currentPrompt) return
  
  const variables: typeof availableVariables.value = []
  
  // Extract variables from template content
  const template = currentPrompt.template
  const regex = /\{(\w+)\}/g
  const matches = template.match(regex)
  
  if (matches) {
    const uniqueVars = Array.from(new Set(matches))
    uniqueVars.forEach((varMatch: string) => {
      const varName = varMatch.slice(1, -1) // Remove { and }
      const required = !varName.includes('?')
      const cleanName = varName.replace('?', '')
      
      variables.push({
        name: cleanName,
        required,
        type: inferVariableType(cleanName),
        example: getExampleValue(cleanName)
      })
    })
  }
  
  availableVariables.value = variables
  
  // Initialize test variables
  variables.forEach(variable => {
    if (!testData.value.variables[variable.name]) {
      testData.value.variables[variable.name] = variable.example || ''
    }
  })
}

function inferVariableType(variableName: string): string {
  const name = variableName.toLowerCase()
  
  if (name.includes('email') || name.includes('mail')) return 'email'
  if (name.includes('phone') || name.includes('telefono')) return 'phone'
  if (name.includes('date') || name.includes('fecha')) return 'date'
  if (name.includes('time') || name.includes('hora')) return 'time'
  if (name.includes('number') || name.includes('cantidad') || name.includes('amount')) return 'number'
  if (name.includes('template') || name.includes('text') || name.includes('description')) return 'text'
  
  return 'string'
}

function getExampleValue(variableName: string): string {
  const name = variableName.toLowerCase()
  
  const examples: Record<string, string> = {
    'name': 'Juan Pérez',
    'email': 'juan.perez@ejemplo.com',
    'phone': '+54 11 1234-5678',
    'company': 'Empresa S.A.',
    'product': 'Producto Premium',
    'objective': 'Ayudar al cliente a resolver su problema técnico',
    'context': 'El cliente está llamando sobre un problema con su cuenta',
    'tone': 'profesional y amigable',
    'language': 'español',
    'topic': 'Soporte técnico',
    'question': 'No puedo acceder a mi cuenta, ¿qué debo hacer?',
    'answer': 'Para acceder a su cuenta, siga estos pasos...',
    'date': new Date().toLocaleDateString('es-ES'),
    'time': new Date().toLocaleTimeString('es-ES'),
    'location': 'Buenos Aires, Argentina',
    'address': 'Calle Falsa 123, CABA',
    'order_id': 'ORD-2024-001234',
    'customer_id': 'CUST-001234',
    'amount': '1,234.56',
    'currency': 'ARS',
    'status': 'activo',
    'template': 'Este es un ejemplo de template con {variable} para testing.',
    'description': 'Descripción detallada del producto o servicio.'
  }
  
  return examples[name] || `Valor de ejemplo para ${variableName}`
}

function getPlaceholder(variable: { name: string; required: boolean }): string {
  const prefix = variable.required ? 'Requerido: ' : 'Opcional: '
  return prefix + getExampleValue(variable.name)
}

function setExampleValue(variable: { name: string; example?: string }) {
  testData.value.variables[variable.name] = variable.example || getExampleValue(variable.name)
}

function loadPresetValues() {
  availableVariables.value.forEach(variable => {
    testData.value.variables[variable.name] = getExampleValue(variable.name)
  })
  
  toast.add({
    severity: 'success',
    summary: 'Valores cargados',
    detail: 'Se han cargado valores de ejemplo para todas las variables',
    life: 3000
  })
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
  if (!currentPrompt) return
  
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
  if (props.promptKey && !currentPrompt) {
    await yamlStore.fetchPromptByKey(props.promptKey)
  }
  
  if (currentPrompt) {
    // Set default test config from prompt metadata
    testConfig.value.model = currentPrompt.metadata.model
    testConfig.value.temperature = currentPrompt.metadata.temperature
    testConfig.value.max_tokens = currentPrompt.metadata.max_tokens
    
    await extractVariables()
  }
})
</script>

<style scoped>
.yaml-test-dialog {
  max-height: 80vh;
  overflow-y: auto;
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

.errors {
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