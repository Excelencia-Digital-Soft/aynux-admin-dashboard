<template>
  <div class="yaml-preview">
    <!-- Template Structure -->
    <Card class="mb-4">
      <template #title>
        <i class="pi pi-code"></i>
        Estructura del Template
      </template>
      
      <template #content>
        <div v-if="template.prompts && template.prompts.length > 0">
          <div v-for="(prompt, index) in template.prompts" :key="index" class="prompt-item mb-4">
            <div class="prompt-header">
              <h4>{{ prompt.name || prompt.key }}</h4>
              <Tag :value="prompt.version" severity="secondary" class="ml-2" />
            </div>
            
            <div v-if="prompt.description" class="text-muted mb-2">
              {{ prompt.description }}
            </div>
            
            <div class="prompt-content">
              <div class="content-header">
                <span class="font-medium">Template:</span>
                <Button 
                  @click="showRenderedPreview = !showRenderedPreview" 
                  :icon="showRenderedPreview ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  size="small"
                  severity="secondary"
                  :label="showRenderedPreview ? 'Ocultar preview' : 'Mostrar preview'"
                />
              </div>
              
              <pre v-if="!showRenderedPreview" class="template-text">{{ prompt.template }}</pre>
              
              <!-- Rendered Preview -->
              <div v-else class="rendered-preview">
                <div class="preview-header">
                  <span class="font-medium">Preview con variables de prueba:</span>
                  <Button 
                    @click="editTestVariables" 
                    icon="pi pi-pencil" 
                    size="small"
                    severity="secondary"
                    label="Editar variables"
                  />
                </div>
                <pre class="rendered-text">{{ renderTemplate(prompt.template) }}</pre>
              </div>
            </div>
            
            <!-- Metadata -->
            <div v-if="prompt.metadata" class="metadata mt-3">
              <h5>Metadatos</h5>
              <div class="metadata-grid">
                <div>
                  <span class="font-medium">Modelo:</span>
                  <Tag :value="prompt.metadata.model" class="ml-2" />
                </div>
                <div>
                  <span class="font-medium">Temperature:</span>
                  <span class="ml-2">{{ prompt.metadata.temperature }}</span>
                </div>
                <div>
                  <span class="font-medium">Max Tokens:</span>
                  <span class="ml-2">{{ prompt.metadata.max_tokens }}</span>
                </div>
              </div>
              
              <!-- Variables -->
              <div v-if="prompt.metadata.variables" class="variables mt-2">
                <div v-if="prompt.metadata.variables.required && prompt.metadata.variables.required.length > 0">
                  <span class="font-medium">Variables requeridas:</span>
                  <div class="variables-list mt-1">
                    <Tag 
                      v-for="variable in prompt.metadata.variables.required" 
                      :key="variable"
                      :value="variable"
                      severity="danger"
                      class="mr-2 mb-1"
                    />
                  </div>
                </div>
                
                <div v-if="prompt.metadata.variables.optional && prompt.metadata.variables.optional.length > 0" class="mt-2">
                  <span class="font-medium">Variables opcionales:</span>
                  <div class="variables-list mt-1">
                    <Tag 
                      v-for="variable in prompt.metadata.variables.optional" 
                      :key="variable"
                      :value="variable"
                      severity="info"
                      class="mr-2 mb-1"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Tags -->
              <div v-if="prompt.metadata.tags && prompt.metadata.tags.length > 0" class="tags mt-2">
                <span class="font-medium">Tags:</span>
                <div class="tags-list mt-1">
                  <Tag 
                    v-for="tag in prompt.metadata.tags" 
                    :key="tag"
                    :value="tag"
                    severity="secondary"
                    class="mr-2 mb-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-muted">
          No se encontraron prompts en este template
        </div>
      </template>
    </Card>

    <!-- Test Variables Dialog -->
    <Dialog 
      v-model:visible="showTestVariablesDialog" 
      header="Variables de Prueba"
      :style="{ width: '60vw' }"
      modal
    >
      <div class="test-variables-form">
        <div 
          v-for="variable in allVariables" 
          :key="variable.name"
          class="variable-field mb-3"
        >
          <label :for="variable.name" class="block text-sm font-medium mb-2">
            {{ variable.name }}
            <span v-if="variable.required" class="text-red-500">*</span>
          </label>
          <InputText 
            :id="variable.name"
            v-model="testVariables[variable.name]" 
            :placeholder="`Ejemplo: ${getVariableExample(variable.name)}`"
            class="w-full"
          />
          <small v-if="variable.example" class="text-muted">
            Ejemplo: {{ variable.example }}
          </small>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showTestVariablesDialog = false" 
          label="Cancelar"
          severity="secondary"
        />
        <Button 
          @click="applyTestVariables" 
          label="Aplicar"
          icon="pi pi-check"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

interface Props {
  template: any
  variables?: Record<string, any>
  onClose?: () => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const toast = useToast()

// Component state
const showRenderedPreview = ref(false)
const showTestVariablesDialog = ref(false)
const testVariables = ref<Record<string, any>>(props.variables || {})

// Computed
const allVariables = computed(() => {
  const variables: Array<{ name: string; required: boolean; example?: string }> = []
  
  if (props.template.prompts) {
    props.template.prompts.forEach((prompt: any) => {
      if (prompt.metadata?.variables) {
        // Required variables
        if (prompt.metadata.variables.required) {
          prompt.metadata.variables.required.forEach((varName: string) => {
            if (!variables.find(v => v.name === varName)) {
              variables.push({
                name: varName,
                required: true,
                example: getVariableExample(varName)
              })
            }
          })
        }
        
        // Optional variables
        if (prompt.metadata.variables.optional) {
          prompt.metadata.variables.optional.forEach((varName: string) => {
            if (!variables.find(v => v.name === varName)) {
              variables.push({
                name: varName,
                required: false,
                example: getVariableExample(varName)
              })
            }
          })
        }
      }
    })
  }
  
  return variables
})

// Methods
function renderTemplate(template: string): string {
  let rendered = template
  
  // Replace variables with test values
  Object.entries(testVariables.value).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    rendered = rendered.replace(regex, String(value))
  })
  
  // Handle missing variables
  allVariables.value.forEach(variable => {
    if (!testVariables.value[variable.name]) {
      const regex = new RegExp(`\\{${variable.name}\\}`, 'g')
      const placeholder = variable.required ? `[${variable.name}]` : `[${variable.name}?]`
      rendered = rendered.replace(regex, placeholder)
    }
  })
  
  return rendered
}

function getVariableExample(variableName: string): string {
  const examples: Record<string, string> = {
    'name': 'Juan Pérez',
    'email': 'juan.perez@ejemplo.com',
    'company': 'Empresa S.A.',
    'product': 'Producto X',
    'objective': 'Ayudar al cliente a resolver su problema',
    'context': 'El cliente está llamando sobre un problema técnico',
    'tone': 'profesional y amigable',
    'language': 'español',
    'topic': 'Soporte técnico',
    'question': '¿Cómo puedo ayudarle hoy?',
    'answer': 'Aquí está la respuesta que busca',
    'date': new Date().toLocaleDateString('es-ES'),
    'time': new Date().toLocaleTimeString('es-ES'),
    'location': 'Buenos Aires, Argentina',
    'phone': '+54 11 1234-5678',
    'address': 'Calle Falsa 123',
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-67890',
    'amount': '$1,234.56',
    'currency': 'ARS',
    'status': 'activo'
  }
  
  return examples[variableName.toLowerCase()] || 'valor de ejemplo'
}

function editTestVariables() {
  // Initialize test variables with examples if empty
  allVariables.value.forEach(variable => {
    if (!testVariables.value[variable.name]) {
      testVariables.value[variable.name] = getVariableExample(variable.name)
    }
  })
  
  showTestVariablesDialog.value = true
}

function applyTestVariables() {
  showTestVariablesDialog.value = false
  
  toast.add({
    severity: 'success',
    summary: 'Variables actualizadas',
    detail: 'Las variables de prueba han sido aplicadas',
    life: 3000
  })
}
</script>

<style scoped>
.yaml-preview {
  max-height: 80vh;
  overflow-y: auto;
}

.prompt-item {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: var(--surface-card);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.prompt-header h4 {
  margin: 0;
  color: var(--text-color);
}

.template-text {
  background: var(--surface-100);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.rendered-preview {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: 4px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rendered-text {
  background: var(--surface-100);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  color: var(--text-color);
}

.metadata {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: 4px;
}

.metadata h5 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.variables-list,
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.text-muted {
  color: var(--text-color-secondary);
}

.variable-field label {
  color: var(--text-color);
}

.test-variables-form {
  max-height: 60vh;
  overflow-y: auto;
}
</style>