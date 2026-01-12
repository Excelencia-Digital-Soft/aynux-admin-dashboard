import { ref, onMounted, onBeforeUnmount, type Ref, shallowRef } from 'vue'
import * as monaco from 'monaco-editor'

/**
 * Composable for Monaco Editor integration.
 * Provides editor initialization, lifecycle management, and keyboard event isolation.
 */

export interface UseMonacoEditorOptions {
  language?: string
  theme?: 'vs-dark' | 'vs' | 'hc-black'
  initialValue?: string
  readOnly?: boolean
  fontSize?: number
  tabSize?: number
  minimap?: boolean
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  lineNumbers?: 'on' | 'off' | 'relative'
}

export interface MonacoEditorInstance {
  editor: monaco.editor.IStandaloneCodeEditor | null
  getValue: () => string
  setValue: (value: string) => void
  focus: () => void
  dispose: () => void
}

const defaultOptions: Required<UseMonacoEditorOptions> = {
  language: 'yaml',
  theme: 'vs-dark',
  initialValue: '',
  readOnly: false,
  fontSize: 14,
  tabSize: 2,
  minimap: true,
  wordWrap: 'on',
  lineNumbers: 'on'
}

export function useMonacoEditor(
  containerRef: Ref<HTMLElement | undefined | null>,
  options: UseMonacoEditorOptions = {},
  onContentChange?: (content: string) => void
) {
  const mergedOptions = { ...defaultOptions, ...options }

  const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const isReady = ref(false)
  const content = ref(mergedOptions.initialValue)

  // Event listener handlers for cleanup
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null
  let keyupHandler: ((e: KeyboardEvent) => void) | null = null
  let keypressHandler: ((e: KeyboardEvent) => void) | null = null

  /**
   * Initialize the Monaco editor.
   */
  function initialize(): void {
    if (!containerRef.value || editor.value) return

    // Register language if not already registered
    const languageId = mergedOptions.language
    const languages = monaco.languages.getLanguages()
    if (!languages.find((l) => l.id === languageId)) {
      monaco.languages.register({ id: languageId })
    }

    editor.value = monaco.editor.create(containerRef.value, {
      value: content.value,
      language: languageId,
      theme: mergedOptions.theme,
      automaticLayout: true,
      minimap: { enabled: mergedOptions.minimap },
      wordWrap: mergedOptions.wordWrap,
      lineNumbers: mergedOptions.lineNumbers,
      folding: true,
      fontSize: mergedOptions.fontSize,
      tabSize: mergedOptions.tabSize,
      scrollBeyondLastLine: false,
      readOnly: mergedOptions.readOnly
    })

    // Listen for content changes
    editor.value.onDidChangeModelContent(() => {
      const newContent = editor.value?.getValue() || ''
      content.value = newContent
      onContentChange?.(newContent)
    })

    // Prevent keyboard events from propagating outside the editor
    // This fixes issues with browser extensions (like Vimium) capturing keys
    setupKeyboardIsolation()

    isReady.value = true
  }

  /**
   * Set up keyboard event isolation.
   */
  function setupKeyboardIsolation(): void {
    if (!containerRef.value) return

    keydownHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        e.stopPropagation()
      }
    }

    keyupHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        e.stopPropagation()
      }
    }

    keypressHandler = (e: KeyboardEvent) => {
      e.stopPropagation()
    }

    containerRef.value.addEventListener('keydown', keydownHandler)
    containerRef.value.addEventListener('keyup', keyupHandler)
    containerRef.value.addEventListener('keypress', keypressHandler)
  }

  /**
   * Clean up keyboard event listeners.
   */
  function cleanupKeyboardIsolation(): void {
    if (!containerRef.value) return

    if (keydownHandler) containerRef.value.removeEventListener('keydown', keydownHandler)
    if (keyupHandler) containerRef.value.removeEventListener('keyup', keyupHandler)
    if (keypressHandler) containerRef.value.removeEventListener('keypress', keypressHandler)
  }

  /**
   * Get current editor content.
   */
  function getValue(): string {
    return editor.value?.getValue() || ''
  }

  /**
   * Set editor content.
   */
  function setValue(value: string): void {
    if (editor.value) {
      editor.value.setValue(value)
      content.value = value
    }
  }

  /**
   * Focus the editor.
   */
  function focus(): void {
    editor.value?.focus()
  }

  /**
   * Dispose the editor and clean up.
   */
  function dispose(): void {
    cleanupKeyboardIsolation()
    if (editor.value) {
      editor.value.dispose()
      editor.value = null
    }
    isReady.value = false
  }

  /**
   * Update editor options.
   */
  function updateOptions(newOptions: Partial<UseMonacoEditorOptions>): void {
    if (editor.value) {
      editor.value.updateOptions({
        readOnly: newOptions.readOnly,
        fontSize: newOptions.fontSize,
        tabSize: newOptions.tabSize,
        minimap: newOptions.minimap !== undefined ? { enabled: newOptions.minimap } : undefined,
        wordWrap: newOptions.wordWrap,
        lineNumbers: newOptions.lineNumbers,
        theme: newOptions.theme
      })
    }
  }

  // Lifecycle hooks are optional - caller can manage lifecycle manually
  // This allows the composable to be used in tests without component context

  return {
    // State
    editor,
    isReady,
    content,
    // Actions
    initialize,
    getValue,
    setValue,
    focus,
    dispose,
    updateOptions,
    // For manual lifecycle management
    setupKeyboardIsolation,
    cleanupKeyboardIsolation
  }
}

/**
 * Version with automatic lifecycle management.
 * Use this when calling from a component's setup function.
 */
export function useMonacoEditorWithLifecycle(
  containerRef: Ref<HTMLElement | undefined | null>,
  options: UseMonacoEditorOptions = {},
  onContentChange?: (content: string) => void
) {
  const instance = useMonacoEditor(containerRef, options, onContentChange)

  onMounted(() => {
    instance.initialize()
  })

  onBeforeUnmount(() => {
    instance.dispose()
  })

  return instance
}

export default useMonacoEditor
