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
          @click="openTestDialog" 
          icon="pi pi-play" 
          label="Test"
          severity="info"
          :disabled="!currentPrompt"
        />
        <Button 
          @click="validateTemplate" 
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
          v-tooltip="!canSave ? saveDisabledReason : 'Guardar template'"
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
            <div v-if="validation && !validation.valid && validation.errors?.length > 0" class="validation-errors mt-3">
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
            <div v-if="(validation?.warnings?.length ?? 0) > 0" class="validation-warnings mt-3">
              <Message
                v-for="warning in validation?.warnings ?? []"
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
                <Select
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
                <Select
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
                <AutoComplete
                  id="tags"
                  v-model="formData.metadata.tags"
                  placeholder="Agregar tags"
                  class="w-full"
                  multiple
                  :typeahead="false"
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

        <!-- Detected Variables Card - Always Visible -->
        <Card class="mb-4 variables-card">
          <template #title>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-2">
                <i class="pi pi-code"></i>
                Variables
                <Tag
                  v-if="detectedVariables.length > 0"
                  :value="detectedVariables.length.toString()"
                  severity="info"
                  rounded
                  class="variable-count-badge"
                />
              </span>
              <Button
                @click="scanForVariables"
                icon="pi pi-sync"
                size="small"
                severity="secondary"
                text
                rounded
                v-tooltip="'Escanear variables'"
                :loading="validating"
              />
            </div>
          </template>

          <template #content>
            <!-- Empty State -->
            <div v-if="detectedVariables.length === 0" class="variables-empty-state">
              <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
              <p class="text-sm text-muted mb-2">No se detectaron variables</p>
              <p class="text-xs text-gray-400">
                Usa <code class="variable-syntax">{nombre}</code> en el template para crear variables
              </p>
            </div>

            <!-- Variables List -->
            <div v-else class="variables-list-enhanced">
              <!-- Required Variables Section -->
              <div v-if="requiredVariables.length > 0" class="variable-section">
                <div class="variable-section-header">
                  <i class="pi pi-exclamation-circle text-red-500"></i>
                  <span class="text-sm font-medium">Requeridas</span>
                  <span class="text-xs text-gray-400">({{ requiredVariables.length }})</span>
                </div>
                <div class="variable-items">
                  <div
                    v-for="variable in requiredVariables"
                    :key="variable.name"
                    class="variable-item-enhanced required"
                  >
                    <div class="variable-info">
                      <code class="variable-name">{{ variable.name }}</code>
                    </div>
                    <Button
                      @click="toggleVariableRequired(variable.name, false)"
                      icon="pi pi-arrow-right"
                      size="small"
                      severity="secondary"
                      text
                      rounded
                      v-tooltip="'Marcar como opcional'"
                    />
                  </div>
                </div>
              </div>

              <!-- Optional Variables Section -->
              <div v-if="optionalVariables.length > 0" class="variable-section">
                <div class="variable-section-header">
                  <i class="pi pi-info-circle text-blue-500"></i>
                  <span class="text-sm font-medium">Opcionales</span>
                  <span class="text-xs text-gray-400">({{ optionalVariables.length }})</span>
                </div>
                <div class="variable-items">
                  <div
                    v-for="variable in optionalVariables"
                    :key="variable.name"
                    class="variable-item-enhanced optional"
                  >
                    <div class="variable-info">
                      <code class="variable-name">{{ variable.name }}</code>
                    </div>
                    <Button
                      @click="toggleVariableRequired(variable.name, true)"
                      icon="pi pi-arrow-left"
                      size="small"
                      severity="secondary"
                      text
                      rounded
                      v-tooltip="'Marcar como requerida'"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Variables Summary -->
            <div v-if="detectedVariables.length > 0" class="variables-summary mt-3 pt-3 border-t border-gray-200">
              <div class="flex justify-between text-xs text-gray-500">
                <span>Total: {{ detectedVariables.length }}</span>
                <span>
                  <span class="text-red-500">{{ requiredVariables.length }} req</span>
                  <span class="mx-1">·</span>
                  <span class="text-blue-500">{{ optionalVariables.length }} opt</span>
                </span>
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
    <YamlTestDialog
      v-if="currentPrompt"
      :visible="showTestDialog"
      :promptKey="currentPrompt.key"
      @close="showTestDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useYamlEditor } from '@/composables/useYamlEditor'
import YamlTestDialog from './components/YamlTestDialog.vue'

// PrimeVue Components
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'

// Editor container ref
const editorContainer = ref<HTMLElement>()
const toast = useToast()

// Use composable
const {
  // State
  showTestDialog,
  validating,
  saving,
  editorHeight,
  formData,
  // Store refs
  currentPrompt,
  validation,
  isPromptLocked,
  lockingUser,
  // Computed
  isNew,
  parsedTemplate,
  detectedVariables,
  requiredVariables,
  optionalVariables,
  canSave,
  saveDisabledReason,
  canPreview,
  // Options
  domainOptions,
  modelOptions,
  modelsLoading,
  quickTemplates,
  // Monaco
  monacoEditor,
  // Actions
  goBack,
  formatYaml,
  insertTemplate,
  insertQuickTemplate,
  validateTemplate,
  scanForVariables,
  toggleVariableRequired,
  saveTemplate,
  initialize,
  cleanup,
  openTestDialog,
  closeTestDialog
} = useYamlEditor(editorContainer, toast)

// Local state for test dialog
const testVariables = ref<Record<string, any>>({})

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initialize()
})

onBeforeUnmount(() => {
  cleanup()
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

/* Variables Card Styles */
.variables-card {
  border: 1px solid var(--surface-border);
  transition: box-shadow 0.2s ease;
}

.variables-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.variable-count-badge {
  font-size: 0.7rem;
  min-width: 1.5rem;
  height: 1.5rem;
}

.variables-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  text-align: center;
}

.variable-syntax {
  background: var(--surface-100);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--primary-color);
  font-family: monospace;
}

.variables-list-enhanced {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variable-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variable-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px dashed var(--surface-200);
}

.variable-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.variable-item-enhanced {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.variable-item-enhanced.required {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
  border-left: 3px solid #ef4444;
}

.variable-item-enhanced.optional {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%);
  border-left: 3px solid #3b82f6;
}

.variable-item-enhanced:hover {
  transform: translateX(2px);
}

.variable-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.variable-name {
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-color);
  background: var(--surface-100);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.variables-summary {
  border-color: var(--surface-200) !important;
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