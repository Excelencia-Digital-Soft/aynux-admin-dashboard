<template>
  <div class="yaml-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <Button 
          @click="goBack" 
          icon="pi pi-arrow-left" 
          severity="secondary"
          text
          v-tooltip="'Volver a la lista'"
        />
        <h2 v-if="currentPrompt">
          {{ isNew ? 'Nuevo Template' : 'Editar Template' }}
          <Tag :value="currentPrompt.key" severity="secondary" class="ml-2" />
        </h2>
        <h2 v-else>Crear Nuevo Template</h2>
      </div>
      
      <div class="header-right">
        <!-- Lock indicator -->
        <div v-if="currentPrompt && isPromptLocked(currentPrompt.key)" class="lock-indicator mr-3">
          <Tag severity="warning" icon="pi pi-lock">
            Bloqueado por {{ lockingUser(currentPrompt.key) }}
          </Tag>
        </div>
        
        <!-- Action buttons -->
        <Button 
          @click="showTestDialog = true" 
          icon="pi pi-play" 
          label="Test"
          severity="info"
          :disabled="!currentPrompt"
        />
        <Button 
          @click="validateCurrentTemplate" 
          icon="pi pi-check" 
          label="Validar"
          severity="info"
          :loading="validating"
        />
        <Button 
          @click="saveTemplate" 
          icon="pi pi-save" 
          label="Guardar"
          :loading="saving"
          :disabled="!canSave"
        />
      </div>
    </div>

    <div class="editor-content">
      <!-- Main editor area -->
      <div class="editor-main">
        <!-- YAML Editor Panel -->
        <Card class="editor-panel">
          <template #title>
            <div class="flex justify-between items-center">
              <span>
                <i class="pi pi-code"></i>
                Editor YAML
              </span>
              <div class="flex space-x-2">
                <Button 
                  @click="formatYaml" 
                  icon="pi pi-align-left" 
                  size="small"
                  severity="secondary"
                  v-tooltip="'Formatear YAML'"
                />
                <Button 
                  @click="insertTemplate" 
                  icon="pi pi-file-import" 
                  size="small"
                  severity="secondary"
                  v-tooltip="'Insertar plantilla'"
                />
              </div>
            </div>
          </template>
          
          <template #content>
            <!-- Monaco Editor Container -->
            <div 
              ref="editorContainer" 
              class="monaco-editor-container"
              :style="{ height: editorHeight + 'px' }"
            ></div>
            
            <!-- Validation Errors -->
            <div v-if="validation && !validation.valid" class="validation-errors mt-3">
              <Message 
                v-for="error in validation.errors" 
                :key="`${error.line}-${error.path}`"
                severity="error" 
                :closable="false"
                class="mb-2"
              >
                <span class="font-mono text-xs">
                  Línea {{ error.line }}: {{ error.message }}
                </span>
              </Message>
            </div>
            
            <!-- Validation Warnings -->
            <div v-if="validation && validation.warnings.length > 0" class="validation-warnings mt-3">
              <Message 
                v-for="warning in validation.warnings" 
                :key="`${warning.line}-${warning.path}`"
                severity="warn" 
                :closable="false"
                class="mb-2"
              >
                <span class="font-mono text-xs">
                  Línea {{ warning.line }}: {{ warning.message }}
                </span>
              </Message>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="editor-sidebar">
        <!-- Metadata Form -->
        <Card class="mb-4">
          <template #title>
            <i class="pi pi-cog"></i>
            Metadatos
          </template>
          
          <template #content>
            <div class="form-grid">
              <div class="field">
                <label for="key">Key *</label>
                <InputText 
                  id="key"
                  v-model="formData.key" 
                  placeholder="domain.subdomain.action"
                  :disabled="!isNew"
                  class="w-full"
                />
                <small v-if="!isNew" class="text-muted">
                  El key no se puede modificar en templates existentes
                </small>
              </div>
              
              <div class="field">
                <label for="name">Nombre *</label>
                <InputText 
                  id="name"
                  v-model="formData.name" 
                  placeholder="Nombre descriptivo"
                  class="w-full"
                />
              </div>
              
              <div class="field">
                <label for="description">Descripción</label>
                <Textarea 
                  id="description"
                  v-model="formData.description" 
                  placeholder="Describe para qué sirve este template"
                  rows="3"
                  class="w-full"
                />
              </div>
              
              <div class="field">
                <label for="domain">Dominio *</label>
                <Dropdown 
                  id="domain"
                  v-model="formData.metadata.domain" 
                  :options="domainOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar dominio"
                  class="w-full"
                />
              </div>
              
              <div class="field">
                <label for="model">Modelo *</label>
                <Dropdown 
                  id="model"
                  v-model="formData.metadata.model" 
                  :options="modelOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar modelo"
                  class="w-full"
                />
              </div>
              
              <div class="grid grid-cols-2 gap-2">
                <div class="field">
                  <label for="temperature">Temperature</label>
                  <InputNumber 
                    id="temperature"
                    v-model="formData.metadata.temperature" 
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
                    v-model="formData.metadata.max_tokens" 
                    :min="1" 
                    :max="4096"
                    class="w-full"
                  />
                </div>
              </div>
              
              <div class="field">
                <label for="tags">Tags</label>
                <Chips 
                  id="tags"
                  v-model="formData.metadata.tags" 
                  placeholder="Agregar tags"
                  class="w-full"
                />
              </div>
              
              <div class="field">
                <div class="flex items-center">
                  <Checkbox 
                    id="active"
                    v-model="formData.active" 
                    binary
                  />
                  <label for="active" class="ml-2">Template activo</label>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Detected Variables -->
        <Card v-if="detectedVariables.length > 0" class="mb-4">
          <template #title>
            <i class="pi pi-list"></i>
            Variables Detectadas
          </template>
          
          <template #content>
            <div class="variables-list">
              <div 
                v-for="variable in detectedVariables" 
                :key="variable.name"
                class="variable-item"
              >
                <Tag 
                  :value="variable.name" 
                  :severity="variable.required ? 'danger' : 'info'"
                  class="mr-2"
                />
                <span class="text-sm text-muted">{{ variable.type }}</span>
              </div>
            </div>
          </template>
        </Card>

        <!-- Quick Templates -->
        <Card>
          <template #title>
            <i class="pi pi-file"></i>
            Plantillas Rápidas
          </template>
          
          <template #content>
            <div class="quick-templates">
              <Button 
                v-for="template in quickTemplates"
                :key="template.name"
                @click="insertQuickTemplate(template)"
                :label="template.name"
                size="small"
                severity="secondary"
                class="mb-2 w-full"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Test Dialog -->
    <Dialog 
      v-model:visible="showTestDialog" 
      header="Test Prompt"
      :style="{ width: '90vw' }"
      :maximizable="true"
      modal
      @update:visible="showTestDialog = false"
    >
      <YamlTestDialog 
        v-if="showTestDialog && currentPrompt"
        :visible="showTestDialog"
        :promptKey="currentPrompt.key"
        @close="showTestDialog = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import * as monaco from 'monaco-editor'
import { useYamlStore } from '@/stores/yaml.store'
import { useAuthStore } from '@/stores/auth.store'
import yaml from 'yaml'
import YamlTestDialog from './components/YamlTestDialog.vue'
import type { YamlPrompt, CreateYamlRequest } from '@/types/yaml.types'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const yamlStore = useYamlStore()
const authStore = useAuthStore()

// Editor state
const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// Component state
const showTestDialog = ref(false)
const validating = ref(false)
const saving = ref(false)
const editorHeight = ref(600)

// Store getters
const { currentPrompt, validation, isPromptLocked, lockingUser } = yamlStore

// Computed
const isNew = computed(() => route.name === 'yaml-create')
const promptKey = computed(() => route.params.key as string)

const parsedTemplate = computed(() => {
  if (!yamlStore.editorContent) return null
  try {
    return yaml.parse(yamlStore.editorContent)
  } catch {
    return null
  }
})

const detectedVariables = computed(() => {
  if (!validation.value || !validation.value.detected_variables) return []
  return validation.value.detected_variables
})

const canSave = computed(() => {
  return yamlStore.editorContent && 
         (isNew.value ? true : formData.value.key) && 
         formData.value.name && 
         formData.value.metadata.domain &&
         formData.value.metadata.model &&
         yamlStore.editorDirty &&
         (!currentPrompt || !isPromptLocked(currentPrompt.key))
})

const canPreview = computed(() => {
  return parsedTemplate.value && validation.value?.valid
})

// Form data
const formData = ref<CreateYamlRequest>({
  name: '',
  description: '',
  version: '1.0.0',
  template: '',
  metadata: {
    temperature: 0.7,
    max_tokens: 1000,
    model: 'gpt-3.5-turbo',
    tags: [],
    variables: {
      required: [],
      optional: []
    },
    domain: 'core'
  },
  active: true,
  source: 'database'
})

const testVariables = ref<Record<string, any>>({})

// Options
const domainOptions = [
  { value: 'core', label: 'Core' },
  { value: 'agents', label: 'Agentes' },
  { value: 'healthcare', label: 'Salud' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'excelencia', label: 'Excelencia' },
  { value: 'orchestrator', label: 'Orquestador' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'product', label: 'Producto' },
  { value: 'tools', label: 'Herramientas' }
]

const modelOptions = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' }
]

const quickTemplates = [
  {
    name: 'Prompt Básico',
    content: `prompts:
  - key: domain.action
    name: Template Name
    description: What this template does
    version: "1.0.0"
    template: |
      Your prompt template here with {variables}
    metadata:
      temperature: 0.7
      max_tokens: 1000
      model: gpt-3.5-turbo
      tags:
        - tag1
        - tag2
      variables:
        required:
          - variable1
        optional:
          - variable2`
  },
  {
    name: 'Agent Prompt',
    content: `prompts:
  - key: agents.agent_name
    name: Agent Name
    description: Description for this agent
    version: "1.0.0"
    template: |
      Eres un agente especializado en...
      
      Tu objetivo es: {objective}
      
      Contexto: {context}
      
      Responde de manera profesional y útil.
    metadata:
      temperature: 0.7
      max_tokens: 1000
      model: gpt-3.5-turbo
      tags:
        - agent
        - domain
      variables:
        required:
          - objective
          - context
        optional:
          - tone`
  }
]

// Monaco Editor initialization
async function initializeEditor() {
  if (!editorContainer.value) return

  // Configure YAML language
  monaco.languages.register({ id: 'yaml' })
  
  editor = monaco.editor.create(editorContainer.value, {
    value: yamlStore.editorContent || getDefaultTemplate(),
    language: 'yaml',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: true,
    fontSize: 14,
    tabSize: 2,
    scrollBeyondLastLine: false
  })

  // Listen for content changes
  editor.onDidChangeModelContent(() => {
    const content = editor?.getValue() || ''
    yamlStore.setEditorContent(content)
    formData.value.template = content
    
    // Auto-validate after a delay
    debounceValidation()
  })

  // Set initial editor content from store
  if (yamlStore.editorContent) {
    editor.setValue(yamlStore.editorContent)
  }
}

function getDefaultTemplate(): string {
  return `prompts:
  - key: domain.subdomain.action
    name: Template Name
    description: Describe what this template does
    version: "1.0.0"
    template: |
      Your prompt template here with {variables}
    metadata:
      temperature: 0.7
      max_tokens: 1000
      model: gpt-3.5-turbo
      tags:
        - example
        - template
      variables:
        required:
          - variable1
        optional:
          - variable2`
}

// Debounced validation
let validationTimeout: ReturnType<typeof setTimeout>
function debounceValidation() {
  clearTimeout(validationTimeout)
  validationTimeout = setTimeout(() => {
    if (yamlStore.editorContent) {
      validateCurrentTemplate()
    }
  }, 1000)
}

// Actions
function goBack() {
  if (yamlStore.editorDirty) {
    if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
      return
    }
  }
  router.push('/yaml-management')
}

function formatYaml() {
  if (!editor || !yamlStore.editorContent) return
  
  try {
    const parsed = yaml.parse(yamlStore.editorContent)
    const formatted = yaml.stringify(parsed, { indent: 2 })
    editor.setValue(formatted)
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se puede formatear el YAML: ' + error.message,
      life: 5000
    })
  }
}

function insertTemplate() {
  // Show template selection dialog
  const template = quickTemplates[0] // For now, use first template
  insertQuickTemplate(template)
}

function insertQuickTemplate(template: any) {
  if (!editor) return
  
  const currentContent = editor.getValue()
  const newContent = currentContent ? 
    currentContent + '\n\n' + template.content : 
    template.content
  
  editor.setValue(newContent)
}

async function validateCurrentTemplate() {
  if (!yamlStore.editorContent) return
  
  validating.value = true
  
  try {
    await yamlStore.validateTemplate(yamlStore.editorContent)
    
    // Update form metadata if validation succeeded
    if (yamlStore.validation?.detected_variables) {
      formData.value.metadata.variables = {
        required: yamlStore.validation.value.detected_variables
          .filter((v: any) => v.required)
          .map((v: any) => v.name),
        optional: yamlStore.validation.value.detected_variables
          .filter((v: any) => !v.required)
          .map((v: any) => v.name)
      }
    }
  } catch (error: any) {
    console.error('Validation error:', error)
  } finally {
    validating.value = false
  }
}

async function saveTemplate() {
  if (!canSave.value) return
  
  saving.value = true
  
  try {
    if (isNew.value) {
      const newPromptData = {
        ...formData.value,
        key: formData.value.name.toLowerCase().replace(/\s+/g, '_')
      }
      await yamlStore.createPrompt(newPromptData)
      toast.add({
        severity: 'success',
        summary: 'Template creado',
        detail: 'El template ha sido creado exitosamente',
        life: 3000
      })
    } else {
      await yamlStore.updatePrompt(currentPrompt!.key, formData.value)
      toast.add({
        severity: 'success',
        summary: 'Template actualizado',
        detail: 'El template ha sido actualizado exitosamente',
        life: 3000
      })
    }
    
    // Unlock if we had it locked
    if (currentPrompt && isPromptLocked(currentPrompt.key)) {
      await yamlStore.unlockPrompt(currentPrompt.key)
    }
    
    goBack()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al guardar',
      detail: error.message || 'Error al guardar el template',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Check permissions
  if (!authStore.isAdminOrOwner) {
    router.push('/unauthorized')
    return
  }
  
  // Load existing prompt if editing
  if (!isNew.value && promptKey.value) {
    await yamlStore.fetchPromptByKey(promptKey.value)
    
    if (currentPrompt) {
      // Lock prompt for editing
      await yamlStore.lockPrompt(promptKey.value)
      
      // Update form data
      formData.value = {
        ...currentPrompt,
        source: currentPrompt.source
      }
    }
  }
  
  // Initialize editor
  await nextTick()
  initializeEditor()
})

onBeforeUnmount(() => {
  // Unlock if we had it locked
  if (currentPrompt && isPromptLocked(currentPrompt.key)) {
    yamlStore.unlockPrompt(currentPrompt.key)
  }
  
  // Cleanup editor
  if (editor) {
    editor.dispose()
  }
  
  clearTimeout(validationTimeout)
})

onBeforeUnmount(() => {
  // Unlock if we had it locked
  if (currentPrompt.value && isPromptLocked(currentPrompt.value.key)) {
    yamlStore.unlockPrompt(currentPrompt.value.key)
  }
  
  // Cleanup editor
  if (editor) {
    editor.dispose()
  }
  
  clearTimeout(validationTimeout)
})
</script>

<style scoped>
.yaml-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-ground);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  padding: 1rem;
  overflow: auto;
}

.editor-panel {
  height: 100%;
}

.editor-sidebar {
  width: 400px;
  padding: 1rem 1rem 1rem 0;
  overflow-y: auto;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variable-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-templates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.text-muted {
  color: var(--text-color-secondary);
}

@media (max-width: 1200px) {
  .editor-content {
    flex-direction: column;
  }
  
  .editor-sidebar {
    width: 100%;
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>