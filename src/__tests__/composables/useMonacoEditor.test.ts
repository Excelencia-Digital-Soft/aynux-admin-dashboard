import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Monaco mock functions - defined before vi.mock hoisting
const mockEditorInstance = {
  dispose: vi.fn(),
  getValue: vi.fn().mockReturnValue('content'),
  setValue: vi.fn(),
  focus: vi.fn(),
  updateOptions: vi.fn(),
  onDidChangeModelContent: vi.fn()
}

const mockLanguages = {
  getLanguages: vi.fn().mockReturnValue([]),
  register: vi.fn()
}

const mockEditor = {
  create: vi.fn().mockReturnValue(mockEditorInstance)
}

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  languages: {
    getLanguages: vi.fn().mockReturnValue([]),
    register: vi.fn()
  },
  editor: {
    create: vi.fn()
  }
}))

import { useMonacoEditor } from '@/composables/useMonacoEditor'
import * as monaco from 'monaco-editor'

describe('useMonacoEditor', () => {
  let containerRef: ReturnType<typeof ref<HTMLElement | null>>
  let mockContainer: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()
    mockContainer = document.createElement('div')
    containerRef = ref(mockContainer)

    // Reset and configure monaco mocks
    vi.mocked(monaco.languages.getLanguages).mockReturnValue([])
    vi.mocked(monaco.editor.create).mockReturnValue(mockEditorInstance as any)
    mockEditorInstance.getValue.mockReturnValue('content')
    mockEditorInstance.dispose.mockClear()
    mockEditorInstance.setValue.mockClear()
    mockEditorInstance.focus.mockClear()
    mockEditorInstance.updateOptions.mockClear()
    mockEditorInstance.onDidChangeModelContent.mockClear()
  })

  describe('initialization', () => {
    it('should have default state', () => {
      const { editor, isReady, content } = useMonacoEditor(ref(null))

      expect(editor.value).toBeNull()
      expect(isReady.value).toBe(false)
      expect(content.value).toBe('')
    })

    it('should accept initial value', () => {
      const { content } = useMonacoEditor(ref(null), { initialValue: 'test content' })

      expect(content.value).toBe('test content')
    })

    it('should not initialize without container', () => {
      const { initialize, isReady } = useMonacoEditor(ref(null))

      initialize()

      expect(isReady.value).toBe(false)
      expect(monaco.editor.create).not.toHaveBeenCalled()
    })

    it('should initialize with container', () => {
      const { initialize, isReady, editor } = useMonacoEditor(containerRef)

      initialize()

      expect(isReady.value).toBe(true)
      expect(monaco.editor.create).toHaveBeenCalledWith(
        mockContainer,
        expect.objectContaining({
          language: 'yaml',
          theme: 'vs-dark'
        })
      )
    })

    it('should not initialize twice', () => {
      const { initialize } = useMonacoEditor(containerRef)

      initialize()
      initialize()

      expect(monaco.editor.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('options', () => {
    it('should use custom language', () => {
      const { initialize } = useMonacoEditor(containerRef, { language: 'javascript' })

      initialize()

      expect(monaco.editor.create).toHaveBeenCalledWith(
        mockContainer,
        expect.objectContaining({
          language: 'javascript'
        })
      )
    })

    it('should use custom theme', () => {
      const { initialize } = useMonacoEditor(containerRef, { theme: 'vs' })

      initialize()

      expect(monaco.editor.create).toHaveBeenCalledWith(
        mockContainer,
        expect.objectContaining({
          theme: 'vs'
        })
      )
    })

    it('should apply all options', () => {
      const { initialize } = useMonacoEditor(containerRef, {
        language: 'json',
        theme: 'hc-black',
        readOnly: true,
        fontSize: 16,
        tabSize: 4,
        minimap: false,
        wordWrap: 'off',
        lineNumbers: 'off'
      })

      initialize()

      expect(monaco.editor.create).toHaveBeenCalledWith(
        mockContainer,
        expect.objectContaining({
          language: 'json',
          theme: 'hc-black',
          readOnly: true,
          fontSize: 16,
          tabSize: 4,
          minimap: { enabled: false },
          wordWrap: 'off',
          lineNumbers: 'off'
        })
      )
    })
  })

  describe('getValue', () => {
    it('should return empty string when no editor', () => {
      const { getValue } = useMonacoEditor(ref(null))

      expect(getValue()).toBe('')
    })

    it('should return editor value', () => {
      const { initialize, getValue } = useMonacoEditor(containerRef)

      initialize()

      expect(getValue()).toBe('content')
    })
  })

  describe('setValue', () => {
    it('should set editor value', () => {
      const { initialize, setValue, content } = useMonacoEditor(containerRef)

      initialize()
      setValue('new content')

      expect(mockEditorInstance.setValue).toHaveBeenCalledWith('new content')
      expect(content.value).toBe('new content')
    })

    it('should not throw when no editor', () => {
      const { setValue } = useMonacoEditor(ref(null))

      expect(() => setValue('test')).not.toThrow()
    })
  })

  describe('focus', () => {
    it('should focus editor', () => {
      const { initialize, focus } = useMonacoEditor(containerRef)

      initialize()
      focus()

      expect(mockEditorInstance.focus).toHaveBeenCalled()
    })

    it('should not throw when no editor', () => {
      const { focus } = useMonacoEditor(ref(null))

      expect(() => focus()).not.toThrow()
    })
  })

  describe('dispose', () => {
    it('should dispose editor', () => {
      const { initialize, dispose, isReady, editor } = useMonacoEditor(containerRef)

      initialize()
      expect(isReady.value).toBe(true)

      dispose()

      expect(mockEditorInstance.dispose).toHaveBeenCalled()
      expect(isReady.value).toBe(false)
      expect(editor.value).toBeNull()
    })
  })

  describe('updateOptions', () => {
    it('should update editor options', () => {
      const { initialize, updateOptions } = useMonacoEditor(containerRef)

      initialize()
      updateOptions({ fontSize: 18, readOnly: true })

      expect(mockEditorInstance.updateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          fontSize: 18,
          readOnly: true
        })
      )
    })
  })

  describe('content change callback', () => {
    it('should call onContentChange when content changes', () => {
      const onContentChange = vi.fn()
      let changeCallback: (() => void) | null = null

      mockEditorInstance.onDidChangeModelContent.mockImplementation((cb) => {
        changeCallback = cb
      })

      const { initialize } = useMonacoEditor(containerRef, {}, onContentChange)

      initialize()

      // Simulate content change
      if (changeCallback) {
        changeCallback()
      }

      expect(onContentChange).toHaveBeenCalledWith('content')
    })
  })

  describe('keyboard isolation', () => {
    it('should set up keyboard event listeners', () => {
      const addEventListenerSpy = vi.spyOn(mockContainer, 'addEventListener')
      const { initialize } = useMonacoEditor(containerRef)

      initialize()

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('keypress', expect.any(Function))
    })

    it('should clean up keyboard event listeners on dispose', () => {
      const removeEventListenerSpy = vi.spyOn(mockContainer, 'removeEventListener')
      const { initialize, dispose } = useMonacoEditor(containerRef)

      initialize()
      dispose()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keypress', expect.any(Function))
    })
  })

  describe('language registration', () => {
    it('should register language if not already registered', () => {
      vi.mocked(monaco.languages.getLanguages).mockReturnValue([])

      const { initialize } = useMonacoEditor(containerRef, { language: 'custom' })

      initialize()

      expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'custom' })
    })

    it('should not register language if already registered', () => {
      vi.mocked(monaco.languages.getLanguages).mockReturnValue([{ id: 'yaml' }] as any)

      const { initialize } = useMonacoEditor(containerRef, { language: 'yaml' })

      initialize()

      expect(monaco.languages.register).not.toHaveBeenCalled()
    })
  })
})
