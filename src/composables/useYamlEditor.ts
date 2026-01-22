import { ref, computed, watch, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import yaml from 'yaml'
import { useYamlStore } from '@/stores/yaml.store'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirm } from '@/composables/useConfirm'
import { useAIModels } from '@/composables/useAIModels'
import { useMonacoEditor } from '@/composables/useMonacoEditor'
import type {
  CreateYamlRequest,
  TemplateType,
  CreateTaskRequest,
  UpdateTaskRequest,
  YamlFormatter,
  FormatterResponseType,
  FormatterButton,
  FormatterCreateRequest,
  FormatterUpdateRequest
} from '@/types/yaml.types'

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

interface TaskFormData extends CreateTaskRequest {
  key?: string
  version?: string
  active?: boolean
  source?: 'file' | 'database'
  is_critical?: boolean
}

interface FormatterFormData {
  key: string
  name: string
  description?: string
  version: string
  response_type: FormatterResponseType
  title?: string
  body_template: string
  buttons: FormatterButton[]
  list_button_text?: string
  awaiting_input?: string
  is_complete: boolean
  metadata: {
    tags: string[]
    category?: string
    priority?: number
  }
  active: boolean
  source: 'file' | 'database'
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

// ===== TASK TEMPLATES (no LLM params) =====

const DEFAULT_TASK_TEMPLATE = `tasks:
  - key: domain.flow.action
    name: Task Name
    description: Describe what this task does
    version: "1.0.0"
    template: |
      Your text template here with {variables}
    metadata:
      tags:
        - example
        - task
      variables:
        required:
          - variable1
        optional:
          - variable2
      is_critical: false`

const TASK_QUICK_TEMPLATES = [
  {
    name: 'Task Básico',
    content: `tasks:
  - key: domain.flow.action
    name: Task Name
    description: What this task does
    version: "1.0.0"
    template: |
      Your text template here with {variables}
    metadata:
      tags:
        - tag1
      variables:
        required:
          - variable1
        optional:
          - variable2
      is_critical: false`
  },
  {
    name: 'Greeting Task',
    content: `tasks:
  - key: pharmacy.greeting.default
    name: Pharmacy Greeting
    description: Saludo inicial para el chatbot de farmacia
    version: "1.0.0"
    template: |
      ¡Hola {user_name}! 👋

      Bienvenido a {pharmacy_name}. Estoy aquí para ayudarte con:
      - Consultas sobre medicamentos
      - Disponibilidad de productos
      - Información sobre pedidos

      ¿En qué puedo ayudarte hoy?
    metadata:
      tags:
        - greeting
        - pharmacy
      variables:
        required:
          - user_name
          - pharmacy_name
        optional:
          - time_of_day
      is_critical: false`
  },
  {
    name: 'Error Response Task',
    content: `tasks:
  - key: core.error.generic
    name: Generic Error Response
    description: Mensaje de error genérico para el chatbot
    version: "1.0.0"
    template: |
      Lo siento, ha ocurrido un error al procesar tu solicitud.

      {error_message}

      Por favor intenta de nuevo o contacta a soporte si el problema persiste.
    metadata:
      tags:
        - error
        - critical
      variables:
        required:
          - error_message
        optional: []
      is_critical: true`
  }
]

// ===== FORMATTER TEMPLATES (WhatsApp interactive messages) =====

const DEFAULT_FORMATTER_TEMPLATE = `key: pharmacy.formatter.example
name: Example Formatter
description: Template de ejemplo para mensajes WhatsApp interactivos
version: "1.0.0"
response_type: buttons
title: Título del mensaje
body_template: |
  Hola {user_name}!

  Este es un mensaje de ejemplo con variables.
buttons:
  - id: btn_option_1
    titulo: Opción 1
  - id: btn_option_2
    titulo: Opción 2
awaiting_input: null
is_complete: false
metadata:
  tags:
    - example
    - formatter`

const FORMATTER_QUICK_TEMPLATES = [
  {
    name: 'Formatter con Botones',
    content: `key: pharmacy.formatter.buttons_example
name: Buttons Formatter
description: Template con botones interactivos
version: "1.0.0"
response_type: buttons
title: Selecciona una opción
body_template: |
  {greeting_message}

  Por favor selecciona una de las siguientes opciones:
buttons:
  - id: btn_option_a
    titulo: Opción A
  - id: btn_option_b
    titulo: Opción B
  - id: btn_cancel
    titulo: Cancelar
awaiting_input: user_selection
is_complete: false
metadata:
  tags:
    - buttons
    - interactive`
  },
  {
    name: 'Formatter con Lista',
    content: `key: pharmacy.formatter.list_example
name: List Formatter
description: Template con lista de opciones
version: "1.0.0"
response_type: list
title: Menú de opciones
body_template: |
  Hola {user_name}!

  Aquí están las opciones disponibles para ti:
list_button_text: Ver opciones
buttons:
  - id: item_1
    titulo: Primera opción
  - id: item_2
    titulo: Segunda opción
  - id: item_3
    titulo: Tercera opción
awaiting_input: list_selection
is_complete: false
metadata:
  tags:
    - list
    - menu`
  },
  {
    name: 'Formatter de Texto',
    content: `key: pharmacy.formatter.text_example
name: Text Formatter
description: Template de solo texto
version: "1.0.0"
response_type: text
body_template: |
  Hola {user_name}!

  {message_content}

  Gracias por tu consulta.
is_complete: true
metadata:
  tags:
    - text
    - simple`
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
  const {
    currentPrompt,
    currentTask,
    currentFormatter,
    templateType,
    validation,
    isPromptLocked,
    lockingUser
  } = storeToRefs(yamlStore)

  // Template type from route query (defaults to store value or 'prompt')
  const routeTemplateType = computed<TemplateType>(() => {
    const queryType = route.query.type as string
    if (queryType === 'task') return 'task'
    if (queryType === 'formatter') return 'formatter'
    return 'prompt'
  })

  // Sync route type to store on mount and route changes
  watch(routeTemplateType, (newType) => {
    yamlStore.setTemplateType(newType)
  }, { immediate: true })

  // Convenience computed
  const isTask = computed(() => templateType.value === 'task')
  const isPrompt = computed(() => templateType.value === 'prompt')
  const isFormatter = computed(() => templateType.value === 'formatter')

  // Unified template access
  const currentTemplate = computed(() => {
    if (isTask.value) return currentTask.value
    if (isFormatter.value) return currentFormatter.value
    return currentPrompt.value
  })

  // Component state
  const showTestDialog = ref(false)
  const validating = ref(false)
  const saving = ref(false)
  const editorHeight = ref(600)

  // Form data for Prompts
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

  // Form data for Tasks (simpler - no LLM params)
  const taskFormData = ref<TaskFormData>({
    key: '',
    name: '',
    description: '',
    template: '',
    version: '1.0.0',
    metadata: {
      tags: [],
      variables: {
        required: [],
        optional: []
      },
      is_critical: false
    },
    active: true,
    source: 'database',
    is_critical: false
  })

  // Form data for Formatters (WhatsApp interactive messages)
  const formatterFormData = ref<FormatterFormData>({
    key: '',
    name: '',
    description: '',
    version: '1.0.0',
    response_type: 'text',
    title: '',
    body_template: '',
    buttons: [],
    list_button_text: '',
    awaiting_input: '',
    is_complete: false,
    metadata: {
      tags: [],
      category: '',
      priority: 0
    },
    active: true,
    source: 'database'
  })

  // Dynamic default template based on type
  const defaultTemplateForType = computed(() => {
    if (isTask.value) return DEFAULT_TASK_TEMPLATE
    if (isFormatter.value) return DEFAULT_FORMATTER_TEMPLATE
    return DEFAULT_TEMPLATE
  })

  // Unified form data access (returns the active form based on type)
  const currentFormData = computed(() => {
    if (isTask.value) return taskFormData.value
    if (isFormatter.value) return formatterFormData.value
    return formData.value
  })

  // Type-aware quick templates
  const currentQuickTemplates = computed(() => {
    if (isTask.value) return TASK_QUICK_TEMPLATES
    if (isFormatter.value) return FORMATTER_QUICK_TEMPLATES
    return QUICK_TEMPLATES
  })

  // Monaco editor integration
  const monacoEditor = useMonacoEditor(
    editorContainerRef,
    {
      language: 'yaml',
      theme: 'vs-dark',
      initialValue: yamlStore.editorContent || defaultTemplateForType.value
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
    const hasContent = !!yamlStore.editorContent
    const isDirty = yamlStore.editorDirty

    if (isTask.value) {
      // Task validation: simpler - no domain/model required
      const hasKey = isNew.value ? true : !!taskFormData.value.key
      const hasName = !!taskFormData.value.name
      return hasContent && hasKey && hasName && isDirty
    } else if (isFormatter.value) {
      // Formatter validation: requires name, response_type, and body_template
      const hasKey = isNew.value ? true : !!formatterFormData.value.key
      const hasName = !!formatterFormData.value.name
      const hasResponseType = !!formatterFormData.value.response_type
      const hasBodyTemplate = !!formatterFormData.value.body_template
      return hasKey && hasName && hasResponseType && hasBodyTemplate && isDirty
    } else {
      // Prompt validation: requires domain and model
      const hasKey = isNew.value ? true : !!formData.value.key
      const hasName = !!formData.value.name
      const hasDomain = !!formData.value.metadata.domain
      const hasModel = !!formData.value.metadata.model
      const notLocked = !currentPrompt.value || !isPromptLocked.value(currentPrompt.value.key)
      return hasContent && hasKey && hasName && hasDomain && hasModel && isDirty && notLocked
    }
  })

  const saveDisabledReason = computed(() => {
    const reasons: string[] = []
    if (!yamlStore.editorContent && !isFormatter.value) reasons.push('Editor vacío')
    if (!yamlStore.editorDirty) reasons.push('Sin cambios')

    if (isTask.value) {
      // Task-specific validation
      if (!isNew.value && !taskFormData.value.key) reasons.push('Falta key')
      if (!taskFormData.value.name) reasons.push('Falta nombre')
    } else if (isFormatter.value) {
      // Formatter-specific validation
      if (!isNew.value && !formatterFormData.value.key) reasons.push('Falta key')
      if (!formatterFormData.value.name) reasons.push('Falta nombre')
      if (!formatterFormData.value.response_type) reasons.push('Falta tipo de respuesta')
      if (!formatterFormData.value.body_template) reasons.push('Falta body template')
    } else {
      // Prompt-specific validation
      if (!isNew.value && !formData.value.key) reasons.push('Falta key')
      if (!formData.value.name) reasons.push('Falta nombre')
      if (!formData.value.metadata.domain) reasons.push('Falta dominio')
      if (!formData.value.metadata.model) reasons.push('Falta modelo')
      if (currentPrompt.value && isPromptLocked.value(currentPrompt.value.key)) reasons.push('Prompt bloqueado')
    }

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
   * Save template (handles prompts, tasks, and formatters).
   */
  async function saveTemplate(): Promise<void> {
    if (!canSave.value) return

    saving.value = true

    try {
      if (isTask.value) {
        // Save Task
        if (isNew.value) {
          const newTaskData: CreateTaskRequest = {
            key: taskFormData.value.name.toLowerCase().replace(/\s+/g, '_'),
            name: taskFormData.value.name,
            description: taskFormData.value.description,
            template: yamlStore.editorContent,
            metadata: {
              tags: taskFormData.value.metadata?.tags || [],
              variables: taskFormData.value.metadata?.variables || { required: [], optional: [] },
              is_critical: taskFormData.value.is_critical || false
            }
          }
          await yamlStore.createTask(newTaskData)
          toast.add({
            severity: 'success',
            summary: 'Task creado',
            detail: 'El task ha sido creado exitosamente',
            life: 3000
          })
        } else {
          const updateData: UpdateTaskRequest = {
            name: taskFormData.value.name,
            description: taskFormData.value.description,
            template: yamlStore.editorContent,
            metadata: {
              tags: taskFormData.value.metadata?.tags || [],
              variables: taskFormData.value.metadata?.variables || { required: [], optional: [] },
              is_critical: taskFormData.value.is_critical || false
            }
          }
          await yamlStore.updateTask(currentTask.value!.key, updateData)
          toast.add({
            severity: 'success',
            summary: 'Task actualizado',
            detail: 'El task ha sido actualizado exitosamente',
            life: 3000
          })
        }
      } else if (isFormatter.value) {
        // Save Formatter
        if (isNew.value) {
          const newFormatterData: FormatterCreateRequest = {
            key: formatterFormData.value.name.toLowerCase().replace(/\s+/g, '.'),
            name: formatterFormData.value.name,
            description: formatterFormData.value.description,
            version: formatterFormData.value.version || '1.0.0',
            response_type: formatterFormData.value.response_type,
            title: formatterFormData.value.title,
            body_template: formatterFormData.value.body_template,
            buttons: formatterFormData.value.buttons,
            list_button_text: formatterFormData.value.list_button_text,
            awaiting_input: formatterFormData.value.awaiting_input,
            is_complete: formatterFormData.value.is_complete,
            metadata: formatterFormData.value.metadata
          }
          await yamlStore.createFormatter(newFormatterData)
          toast.add({
            severity: 'success',
            summary: 'Formatter creado',
            detail: 'El formatter ha sido creado exitosamente',
            life: 3000
          })
        } else {
          const updateData: FormatterUpdateRequest = {
            name: formatterFormData.value.name,
            description: formatterFormData.value.description,
            version: formatterFormData.value.version,
            response_type: formatterFormData.value.response_type,
            title: formatterFormData.value.title,
            body_template: formatterFormData.value.body_template,
            buttons: formatterFormData.value.buttons,
            list_button_text: formatterFormData.value.list_button_text,
            awaiting_input: formatterFormData.value.awaiting_input,
            is_complete: formatterFormData.value.is_complete,
            metadata: formatterFormData.value.metadata
          }
          await yamlStore.updateFormatter(currentFormatter.value!.key, updateData)
          toast.add({
            severity: 'success',
            summary: 'Formatter actualizado',
            detail: 'El formatter ha sido actualizado exitosamente',
            life: 3000
          })
        }
      } else {
        // Save Prompt
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

        // Unlock prompt if locked
        if (currentPrompt.value && isPromptLocked.value(currentPrompt.value.key)) {
          await yamlStore.unlockPrompt(currentPrompt.value.key)
        }
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
   * Initialize editor with existing prompt, task, or formatter data.
   */
  async function initialize(): Promise<void> {
    // Check permissions
    if (!authStore.isAdminOrOwner) {
      router.push('/unauthorized')
      return
    }

    // Load existing template if editing
    if (!isNew.value && promptKey.value) {
      if (isTask.value) {
        // Load Task
        await yamlStore.fetchTaskByKey(promptKey.value)

        if (currentTask.value) {
          taskFormData.value = {
            key: currentTask.value.key,
            name: currentTask.value.name || '',
            description: currentTask.value.description || '',
            template: currentTask.value.template || '',
            version: currentTask.value.version || '1.0.0',
            metadata: {
              tags: currentTask.value.metadata?.tags || [],
              variables: currentTask.value.metadata?.variables || { required: [], optional: [] },
              is_critical: currentTask.value.metadata?.is_critical || false
            },
            active: currentTask.value.active ?? true,
            source: currentTask.value.source || 'database',
            is_critical: currentTask.value.metadata?.is_critical || false
          }
        }
      } else if (isFormatter.value) {
        // Load Formatter
        await yamlStore.fetchFormatterByKey(promptKey.value)

        if (currentFormatter.value) {
          formatterFormData.value = {
            key: currentFormatter.value.key,
            name: currentFormatter.value.name || '',
            description: currentFormatter.value.description || '',
            version: currentFormatter.value.version || '1.0.0',
            response_type: currentFormatter.value.response_type || 'text',
            title: currentFormatter.value.title || '',
            body_template: currentFormatter.value.body_template || '',
            buttons: currentFormatter.value.buttons || [],
            list_button_text: currentFormatter.value.list_button_text || '',
            awaiting_input: currentFormatter.value.awaiting_input || '',
            is_complete: currentFormatter.value.is_complete ?? false,
            metadata: {
              tags: currentFormatter.value.metadata?.tags || [],
              category: currentFormatter.value.metadata?.category || '',
              priority: currentFormatter.value.metadata?.priority || 0
            },
            active: currentFormatter.value.active ?? true,
            source: currentFormatter.value.source || 'file'
          }

          // Set editor content for formatter (YAML representation)
          yamlStore.setEditorContent(yaml.stringify({
            key: currentFormatter.value.key,
            name: currentFormatter.value.name,
            description: currentFormatter.value.description,
            version: currentFormatter.value.version,
            response_type: currentFormatter.value.response_type,
            title: currentFormatter.value.title,
            body_template: currentFormatter.value.body_template,
            buttons: currentFormatter.value.buttons,
            list_button_text: currentFormatter.value.list_button_text,
            awaiting_input: currentFormatter.value.awaiting_input,
            is_complete: currentFormatter.value.is_complete,
            metadata: currentFormatter.value.metadata
          }, { indent: 2 }))
        }
      } else {
        // Load Prompt
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

  // Response type options for formatters
  const responseTypeOptions = [
    { value: 'text', label: 'Texto' },
    { value: 'buttons', label: 'Botones' },
    { value: 'list', label: 'Lista' }
  ]

  return {
    // State
    showTestDialog,
    validating,
    saving,
    editorHeight,
    formData,
    taskFormData,
    formatterFormData,
    // Store refs
    currentPrompt,
    currentTask,
    currentFormatter,
    templateType,
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
    isTask,
    isPrompt,
    isFormatter,
    defaultTemplateForType,
    currentTemplate,
    currentFormData,
    currentQuickTemplates,
    // Options
    domainOptions: DOMAIN_OPTIONS,
    modelOptions,
    modelsLoading,
    quickTemplates: QUICK_TEMPLATES,
    taskQuickTemplates: TASK_QUICK_TEMPLATES,
    formatterQuickTemplates: FORMATTER_QUICK_TEMPLATES,
    responseTypeOptions,
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
