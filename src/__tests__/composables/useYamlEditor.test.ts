import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => ({
    name: 'YamlEdit',
    path: '/yaml-management/test-key',
    params: { key: 'test-key' }
  })
}))

// Mock yaml
vi.mock('yaml', () => ({
  default: {
    parse: vi.fn().mockReturnValue({ prompts: [] }),
    stringify: vi.fn().mockReturnValue('formatted: yaml')
  }
}))

// Create a mock Pinia store that works with storeToRefs
const useMockYamlStore = defineStore('yaml', () => {
  const editorContent = ref('test: content')
  const editorDirty = ref(true)
  const currentPrompt = ref<any>(null)
  const validation = ref<any>(null)

  const isPromptLocked = computed(() => (_key: string) => false)
  const lockingUser = computed(() => (_key: string) => null)

  const setEditorContent = vi.fn((content: string) => {
    editorContent.value = content
  })
  const fetchPromptByKey = vi.fn()
  const lockPrompt = vi.fn()
  const unlockPrompt = vi.fn()
  const createPrompt = vi.fn()
  const updatePrompt = vi.fn()

  return {
    editorContent,
    editorDirty,
    currentPrompt,
    validation,
    isPromptLocked,
    lockingUser,
    setEditorContent,
    fetchPromptByKey,
    lockPrompt,
    unlockPrompt,
    createPrompt,
    updatePrompt
  }
})

vi.mock('@/stores/yaml.store', () => ({
  useYamlStore: () => useMockYamlStore()
}))

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    isAdminOrOwner: true
  })
}))

// Mock confirm
vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({
    confirmDiscard: vi.fn().mockResolvedValue(true)
  })
}))

// Mock AI models
vi.mock('@/composables/useAIModels', () => ({
  useAIModels: () => ({
    simpleOptions: ref([{ value: 'gpt-4', label: 'GPT-4' }]),
    loading: ref(false),
    defaultModel: ref('gpt-4')
  })
}))

// Mock Monaco Editor
vi.mock('@/composables/useMonacoEditor', () => ({
  useMonacoEditor: vi.fn().mockReturnValue({
    editor: ref(null),
    isReady: ref(false),
    content: ref(''),
    initialize: vi.fn(),
    getValue: vi.fn().mockReturnValue('test: content'),
    setValue: vi.fn(),
    focus: vi.fn(),
    dispose: vi.fn()
  })
}))

import { useYamlEditor } from '@/composables/useYamlEditor'
import yaml from 'yaml'

describe('useYamlEditor', () => {
  let containerRef: ReturnType<typeof ref<HTMLElement | null>>
  let mockToast: { add: ReturnType<typeof vi.fn> }
  let yamlStore: ReturnType<typeof useMockYamlStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    containerRef = ref(document.createElement('div'))
    mockToast = { add: vi.fn() }

    // Get fresh store instance
    yamlStore = useMockYamlStore()
    yamlStore.editorContent = 'test: content'
    yamlStore.editorDirty = true
    yamlStore.currentPrompt = null
    yamlStore.validation = null
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const { showTestDialog, validating, saving, formData } = useYamlEditor(containerRef, mockToast)

      expect(showTestDialog.value).toBe(false)
      expect(validating.value).toBe(false)
      expect(saving.value).toBe(false)
      expect(formData.value.name).toBe('')
      expect(formData.value.metadata.domain).toBe('core')
    })

    it('should provide domain options', () => {
      const { domainOptions } = useYamlEditor(containerRef, mockToast)

      expect(domainOptions.length).toBeGreaterThan(0)
      expect(domainOptions[0]).toHaveProperty('value')
      expect(domainOptions[0]).toHaveProperty('label')
    })

    it('should provide quick templates', () => {
      const { quickTemplates } = useYamlEditor(containerRef, mockToast)

      expect(quickTemplates.length).toBeGreaterThan(0)
      expect(quickTemplates[0]).toHaveProperty('name')
      expect(quickTemplates[0]).toHaveProperty('content')
    })
  })

  describe('computed', () => {
    it('isNew should be false for edit route', () => {
      const { isNew } = useYamlEditor(containerRef, mockToast)

      expect(isNew.value).toBe(false)
    })

    it('canSave should be defined', () => {
      const { canSave } = useYamlEditor(containerRef, mockToast)

      // canSave is a computed property
      expect(canSave).toBeDefined()
    })

    it('saveDisabledReason should list missing fields', () => {
      const { saveDisabledReason } = useYamlEditor(containerRef, mockToast)

      expect(saveDisabledReason.value).toContain('Falta nombre')
    })
  })

  describe('formatYaml', () => {
    it('should format YAML content', () => {
      vi.mocked(yaml.parse).mockReturnValue({ test: 'content' })
      vi.mocked(yaml.stringify).mockReturnValue('test: content\n')

      const { formatYaml, monacoEditor } = useYamlEditor(containerRef, mockToast)

      formatYaml()

      expect(yaml.parse).toHaveBeenCalled()
      expect(monacoEditor.setValue).toHaveBeenCalledWith('test: content\n')
    })

    it('should show error on invalid YAML', () => {
      vi.mocked(yaml.parse).mockImplementation(() => {
        throw new Error('Invalid YAML')
      })

      const { formatYaml } = useYamlEditor(containerRef, mockToast)

      formatYaml()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      )
    })
  })

  describe('validateTemplate', () => {
    it('should detect variables in template', async () => {
      yamlStore.editorContent = 'Hello {name}, your order {orderId} is ready'

      const { validateTemplate } = useYamlEditor(containerRef, mockToast)

      await validateTemplate()

      expect(yamlStore.validation).toEqual(
        expect.objectContaining({
          valid: true,
          detected_variables: expect.arrayContaining([
            expect.objectContaining({ name: 'name' }),
            expect.objectContaining({ name: 'orderId' })
          ])
        })
      )
    })

    it('should show success toast on valid template', async () => {
      yamlStore.editorContent = 'Hello {name}'

      const { validateTemplate } = useYamlEditor(containerRef, mockToast)

      await validateTemplate()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Validación exitosa'
        })
      )
    })
  })

  describe('scanForVariables', () => {
    it('should warn when editor is empty', () => {
      yamlStore.editorContent = ''

      const { scanForVariables } = useYamlEditor(containerRef, mockToast)

      scanForVariables()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'Sin contenido'
        })
      )
    })

    it('should scan and update variables', () => {
      yamlStore.editorContent = 'Use {var1} and {var2}'

      const { scanForVariables } = useYamlEditor(containerRef, mockToast)

      scanForVariables()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          detail: expect.stringContaining('2 variable(s)')
        })
      )
    })
  })

  describe('toggleVariableRequired', () => {
    it('should toggle variable from required to optional', () => {
      yamlStore.validation = {
        valid: true,
        errors: [],
        warnings: [],
        detected_variables: [{ name: 'testVar', required: true, type: 'string' }]
      }

      const { toggleVariableRequired, formData } = useYamlEditor(containerRef, mockToast)
      formData.value.metadata.variables = { required: ['testVar'], optional: [] }

      toggleVariableRequired('testVar', false)

      expect(formData.value.metadata.variables.optional).toContain('testVar')
      expect(formData.value.metadata.variables.required).not.toContain('testVar')
    })

    it('should mark store as dirty', () => {
      yamlStore.validation = {
        valid: true,
        errors: [],
        warnings: [],
        detected_variables: [{ name: 'testVar', required: true, type: 'string' }]
      }
      yamlStore.editorDirty = false

      const { toggleVariableRequired, formData } = useYamlEditor(containerRef, mockToast)
      formData.value.metadata.variables = { required: ['testVar'], optional: [] }

      toggleVariableRequired('testVar', false)

      expect(yamlStore.editorDirty).toBe(true)
    })
  })

  describe('saveTemplate', () => {
    it('should be a function', () => {
      const { saveTemplate } = useYamlEditor(containerRef, mockToast)

      expect(typeof saveTemplate).toBe('function')
    })

    it('should not throw when called', async () => {
      const { saveTemplate } = useYamlEditor(containerRef, mockToast)

      // Should not throw even if canSave is false
      await expect(saveTemplate()).resolves.not.toThrow()
    })
  })

  describe('goBack', () => {
    it('should navigate to yaml-management', async () => {
      yamlStore.editorDirty = false

      const { goBack } = useYamlEditor(containerRef, mockToast)

      await goBack()

      expect(mockPush).toHaveBeenCalledWith('/yaml-management')
    })
  })

  describe('test dialog', () => {
    it('openTestDialog should show dialog', () => {
      const { openTestDialog, showTestDialog } = useYamlEditor(containerRef, mockToast)

      openTestDialog()

      expect(showTestDialog.value).toBe(true)
    })

    it('closeTestDialog should hide dialog', () => {
      const { openTestDialog, closeTestDialog, showTestDialog } = useYamlEditor(containerRef, mockToast)

      openTestDialog()
      closeTestDialog()

      expect(showTestDialog.value).toBe(false)
    })
  })

  describe('insertTemplate', () => {
    it('should insert quick template', () => {
      const { insertQuickTemplate, monacoEditor } = useYamlEditor(containerRef, mockToast)

      insertQuickTemplate({ name: 'Test', content: 'new: content' })

      expect(monacoEditor.setValue).toHaveBeenCalled()
    })
  })
})
