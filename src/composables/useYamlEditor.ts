import { ref, computed, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import yaml from 'yaml'
import { useYamlStore } from '@/stores/yaml.store'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirm } from '@/composables/useConfirm'
import { useAIModels } from '@/composables/useAIModels'
import { useMonacoEditor } from '@/composables/useMonacoEditor'
import type { CreateYamlRequest } from '@/types/yaml.types'

/**
 * Composable for YAML template editor page.
 * Manages template editing, validation, variables, and save operations.
 */

export interface UseYamlEditorOptions {
  autoValidate?: boolean
  validationDelay?: number
  defaultDomain?: string
  defaultModel?: string
}

interface FormData extends CreateYamlRequest {
  key?: string
}

interface ToastInterface {
  add: (options: { severity: string; summary: string; detail: string; life: number }) => void
}

const DEFAULT_TEMPLATE = `prompts:
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

const DOMAIN_OPTIONS = [
  { value: 'core', label: 'Core' },
  { value: 'agents', label: 'Agentes' },
  { value: 'bypass-rules', label: 'Reglas de Bypass' },
  { value: 'healthcare', label: 'Salud' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'excelencia', label: 'Excelencia' },
  { value: 'orchestrator', label: 'Orquestador' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'product', label: 'Producto' },
  { value: 'tools', label: 'Herramientas' }
]

const QUICK_TEMPLATES = [
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

export function useYamlEditor(
  editorContainerRef: Ref<HTMLElement | undefined | null>,
  toast: ToastInterface,
  options: UseYamlEditorOptions = {}
) {
  const {
    autoValidate = true,
    validationDelay = 1000,
    defaultDomain = 'core',
    defaultModel = 'gpt-3.5-turbo'
  } = options

  const router = useRouter()
  const route = useRoute()
  const yamlStore = useYamlStore()
  const authStore = useAuthStore()
  const { confirmDiscard } = useConfirm()

  // AI Models
  const { simpleOptions: modelOptions, loading: modelsLoading, defaultModel: defaultAIModel } = useAIModels()

  // Store state
  const { currentPrompt, validation, isPromptLocked, lockingUser } = storeToRefs(yamlStore)

  // Component state
  const showTestDialog = ref(false)
  const validating = ref(false)
  const saving = ref(false)
  const editorHeight = ref(600)

  // Form data
  const formData = ref<FormData>({
    name: '',
    description: '',
    version: '1.0.0',
    template: '',
    metadata: {
      temperature: 0.7,
      max_tokens: 1000,
      model: defaultModel,
      tags: [],
      variables: {
        required: [],
        optional: []
      },
      domain: defaultDomain
    },
    active: true,
    source: 'database'
  })

  // Monaco editor integration
  const monacoEditor = useMonacoEditor(
    editorContainerRef,
    {
      language: 'yaml',
      theme: 'vs-dark',
      initialValue: yamlStore.editorContent || DEFAULT_TEMPLATE
    },
    handleContentChange
  )

  // Debounced validation
  let validationTimeout: ReturnType<typeof setTimeout>

  // Computed
  const isNew = computed(() => route.name === 'YamlCreate' || route.path === '/yaml-management/new')
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
    if (!validation.value?.detected_variables) return []
    return validation.value.detected_variables
  })

  const requiredVariables = computed(() => {
    return detectedVariables.value.filter((v: any) => v.required)
  })

  const optionalVariables = computed(() => {
    return detectedVariables.value.filter((v: any) => !v.required)
  })

  const canSave = computed(() => {
    return (
      yamlStore.editorContent &&
      (isNew.value ? true : formData.value.key) &&
      formData.value.name &&
      formData.value.metadata.domain &&
      formData.value.metadata.model &&
      yamlStore.editorDirty &&
      (!currentPrompt.value || !isPromptLocked.value(currentPrompt.value.key))
    )
  })

  const saveDisabledReason = computed(() => {
    const reasons: string[] = []
    if (!yamlStore.editorContent) reasons.push('Editor vacío')
    if (!isNew.value && !formData.value.key) reasons.push('Falta key')
    if (!formData.value.name) reasons.push('Falta nombre')
    if (!formData.value.metadata.domain) reasons.push('Falta dominio')
    if (!formData.value.metadata.model) reasons.push('Falta modelo')
    if (!yamlStore.editorDirty) reasons.push('Sin cambios')
    if (currentPrompt.value && isPromptLocked.value(currentPrompt.value.key)) reasons.push('Prompt bloqueado')
    return reasons.length > 0 ? reasons.join(', ') : ''
  })

  const canPreview = computed(() => {
    return parsedTemplate.value && validation.value?.valid
  })

  /**
   * Handle editor content changes.
   */
  function handleContentChange(content: string): void {
    yamlStore.setEditorContent(content)
    formData.value.template = content

    if (autoValidate) {
      debounceValidation()
    }
  }

  /**
   * Debounced validation.
   */
  function debounceValidation(): void {
    clearTimeout(validationTimeout)
    validationTimeout = setTimeout(() => {
      if (yamlStore.editorContent) {
        validateTemplate()
      }
    }, validationDelay)
  }

  /**
   * Navigate back to list.
   */
  async function goBack(): Promise<void> {
    if (yamlStore.editorDirty) {
      const confirmed = await confirmDiscard('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')
      if (!confirmed) return
    }
    router.push('/yaml-management')
  }

  /**
   * Format YAML content.
   */
  function formatYaml(): void {
    if (!yamlStore.editorContent) return

    try {
      const parsed = yaml.parse(yamlStore.editorContent)
      const formatted = yaml.stringify(parsed, { indent: 2 })
      monacoEditor.setValue(formatted)
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede formatear el YAML: ' + error.message,
        life: 5000
      })
    }
  }

  /**
   * Insert a template.
   */
  function insertTemplate(): void {
    const template = QUICK_TEMPLATES[0]
    insertQuickTemplate(template)
  }

  /**
   * Insert a quick template.
   */
  function insertQuickTemplate(template: { name: string; content: string }): void {
    const currentContent = monacoEditor.getValue()
    const newContent = currentContent ? currentContent + '\n\n' + template.content : template.content
    monacoEditor.setValue(newContent)
  }

  /**
   * Validate current template.
   */
  async function validateTemplate(): Promise<void> {
    if (!yamlStore.editorContent) return

    validating.value = true

    try {
      // Extract variables from template
      const variablePattern = /\{(\w+)\}/g
      const matches = yamlStore.editorContent.matchAll(variablePattern)
      const detectedVars = [...new Set([...matches].map((m) => m[1]))]

      // Preserve existing required/optional status
      const existingRequired = new Set(formData.value.metadata.variables?.required || [])
      const existingOptional = new Set(formData.value.metadata.variables?.optional || [])

      // Update validation state
      yamlStore.validation = {
        valid: true,
        errors: [],
        warnings: [],
        detected_variables: detectedVars.map((name) => ({
          name,
          required: existingRequired.has(name) || !existingOptional.has(name),
          type: 'string'
        }))
      }

      // Update form metadata
      formData.value.metadata.variables = {
        required: detectedVars.filter((v) => existingRequired.has(v) || !existingOptional.has(v)),
        optional: detectedVars.filter((v) => existingOptional.has(v))
      }

      toast.add({
        severity: 'success',
        summary: 'Validación exitosa',
        detail: `Template válido. ${detectedVars.length} variable(s) detectada(s)`,
        life: 3000
      })
    } catch (error: any) {
      yamlStore.validation = {
        valid: false,
        errors: [
          {
            message: error.message,
            line: 0,
            path: '',
            severity: 'error'
          }
        ],
        warnings: []
      }

      toast.add({
        severity: 'error',
        summary: 'Error inesperado',
        detail: error.message,
        life: 5000
      })
    } finally {
      validating.value = false
    }
  }

  /**
   * Scan for variables without full validation.
   */
  function scanForVariables(): void {
    if (!yamlStore.editorContent) {
      toast.add({
        severity: 'warn',
        summary: 'Sin contenido',
        detail: 'Escribe algo en el editor primero',
        life: 3000
      })
      return
    }

    const variablePattern = /\{(\w+)\}/g
    const matches = yamlStore.editorContent.matchAll(variablePattern)
    const detectedVars = [...new Set([...matches].map((m) => m[1]))]

    const existingRequired = new Set(formData.value.metadata.variables?.required || [])
    const existingOptional = new Set(formData.value.metadata.variables?.optional || [])

    yamlStore.validation = {
      valid: true,
      errors: [],
      warnings: [],
      detected_variables: detectedVars.map((name) => ({
        name,
        required: existingRequired.has(name) || !existingOptional.has(name),
        type: 'string'
      }))
    }

    formData.value.metadata.variables = {
      required: detectedVars.filter((v) => existingRequired.has(v) || !existingOptional.has(v)),
      optional: detectedVars.filter((v) => existingOptional.has(v))
    }

    toast.add({
      severity: 'info',
      summary: 'Variables escaneadas',
      detail: `Se encontraron ${detectedVars.length} variable(s)`,
      life: 2000
    })
  }

  /**
   * Toggle variable between required and optional.
   */
  function toggleVariableRequired(variableName: string, makeRequired: boolean): void {
    const required = new Set(formData.value.metadata.variables?.required || [])
    const optional = new Set(formData.value.metadata.variables?.optional || [])

    if (makeRequired) {
      required.add(variableName)
      optional.delete(variableName)
    } else {
      optional.add(variableName)
      required.delete(variableName)
    }

    formData.value.metadata.variables = {
      required: [...required],
      optional: [...optional]
    }

    if (yamlStore.validation?.detected_variables) {
      yamlStore.validation = {
        ...yamlStore.validation,
        detected_variables: yamlStore.validation.detected_variables.map((v: any) => ({
          ...v,
          required: v.name === variableName ? makeRequired : v.required
        }))
      }
    }

    yamlStore.editorDirty = true
  }

  /**
   * Save template.
   */
  async function saveTemplate(): Promise<void> {
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
        const updateData = {
          name: formData.value.name,
          template: yamlStore.editorContent,
          description: formData.value.description,
          metadata: formData.value.metadata
        }
        await yamlStore.updatePrompt(currentPrompt.value!.key, updateData)
        toast.add({
          severity: 'success',
          summary: 'Template actualizado',
          detail: 'El template ha sido actualizado exitosamente',
          life: 3000
        })
      }

      if (currentPrompt.value && isPromptLocked.value(currentPrompt.value.key)) {
        await yamlStore.unlockPrompt(currentPrompt.value.key)
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

  /**
   * Initialize editor with existing prompt data.
   */
  async function initialize(): Promise<void> {
    // Check permissions
    if (!authStore.isAdminOrOwner) {
      router.push('/unauthorized')
      return
    }

    // Load existing prompt if editing
    if (!isNew.value && promptKey.value) {
      await yamlStore.fetchPromptByKey(promptKey.value)

      if (currentPrompt.value) {
        await yamlStore.lockPrompt(promptKey.value)

        formData.value = {
          key: currentPrompt.value.key,
          name: currentPrompt.value.name || '',
          description: currentPrompt.value.description || '',
          version: currentPrompt.value.version || '1.0.0',
          template: currentPrompt.value.template || '',
          metadata: {
            temperature: currentPrompt.value.metadata?.temperature ?? 0.7,
            max_tokens: currentPrompt.value.metadata?.max_tokens ?? 1000,
            model: currentPrompt.value.metadata?.model || 'default',
            tags: currentPrompt.value.metadata?.tags || [],
            variables: currentPrompt.value.metadata?.variables || { required: [], optional: [] },
            domain: currentPrompt.value.metadata?.domain || 'core'
          },
          active: currentPrompt.value.active ?? true,
          source: currentPrompt.value.source || 'database'
        }
      }
    }

    // Initialize Monaco editor
    monacoEditor.initialize()
  }

  /**
   * Cleanup on unmount.
   */
  function cleanup(): void {
    if (currentPrompt.value && isPromptLocked.value(currentPrompt.value.key)) {
      yamlStore.unlockPrompt(currentPrompt.value.key)
    }
    monacoEditor.dispose()
    clearTimeout(validationTimeout)
  }

  /**
   * Open test dialog.
   */
  function openTestDialog(): void {
    showTestDialog.value = true
  }

  /**
   * Close test dialog.
   */
  function closeTestDialog(): void {
    showTestDialog.value = false
  }

  return {
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
    promptKey,
    parsedTemplate,
    detectedVariables,
    requiredVariables,
    optionalVariables,
    canSave,
    saveDisabledReason,
    canPreview,
    // Options
    domainOptions: DOMAIN_OPTIONS,
    modelOptions,
    modelsLoading,
    quickTemplates: QUICK_TEMPLATES,
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
  }
}

export default useYamlEditor
