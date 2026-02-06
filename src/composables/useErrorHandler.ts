/**
 * useErrorHandler - Centralized error handling for workflow editor
 *
 * Provides consistent error handling with:
 * - User notifications via toast
 * - Console logging for debugging
 * - Field-level error tracking for forms
 */
import { ref } from 'vue'
import { useToast } from './useToast'

export interface ErrorContext {
  component?: string
  action?: string
  field?: string
  value?: unknown
}

export function useErrorHandler(componentName?: string) {
  const toast = useToast()
  const fieldErrors = ref<Record<string, string>>({})

  /**
   * Handle a JSON parsing error with user feedback
   */
  function handleJsonParseError(
    error: unknown,
    field: string,
    value: string,
    showToast = false
  ): void {
    const errorMessage = error instanceof SyntaxError ? 'JSON invalido' : 'Error de formato'

    // Track field-level error
    fieldErrors.value[field] = errorMessage

    // Log for debugging
    console.warn(`[${componentName || 'Component'}] JSON parse error in field "${field}":`, {
      error,
      valuePreview: value.substring(0, 100),
    })

    // Optionally show toast
    if (showToast) {
      toast.warn(errorMessage, `Error en ${field}`)
    }
  }

  /**
   * Clear error for a specific field
   */
  function clearFieldError(field: string): void {
    delete fieldErrors.value[field]
  }

  /**
   * Clear all field errors
   */
  function clearAllErrors(): void {
    fieldErrors.value = {}
  }

  /**
   * Handle general errors with logging and optional toast
   */
  function handleError(
    error: unknown,
    context: ErrorContext,
    showToast = true
  ): void {
    const message = error instanceof Error ? error.message : 'Error desconocido'

    console.error(`[${componentName || context.component || 'Component'}] Error:`, {
      ...context,
      error,
    })

    if (showToast) {
      toast.error(message, context.action || 'Error')
    }
  }

  /**
   * Safe JSON parse that returns the value or null on error
   * Also tracks field errors for form validation
   */
  function safeJsonParse<T = unknown>(
    value: string,
    field: string,
    defaultValue: T | null = null
  ): T | null {
    try {
      const parsed = JSON.parse(value) as T
      clearFieldError(field)
      return parsed
    } catch (error) {
      handleJsonParseError(error, field, value)
      return defaultValue
    }
  }

  /**
   * Safe JSON stringify that returns empty string on error
   */
  function safeJsonStringify(value: unknown, field?: string): string {
    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      console.warn(`[${componentName || 'Component'}] JSON stringify error:`, {
        field,
        error,
      })
      return '{}'
    }
  }

  /**
   * Wrap an async function with error handling
   */
  function withErrorHandling<T>(
    fn: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | null> {
    return fn().catch((error) => {
      handleError(error, context)
      return null
    })
  }

  return {
    fieldErrors,
    handleJsonParseError,
    handleError,
    clearFieldError,
    clearAllErrors,
    safeJsonParse,
    safeJsonStringify,
    withErrorHandling,
  }
}
