/**
 * Type Guards and Utility Functions for Type Safety
 *
 * Provides runtime type checking utilities to ensure type safety
 * when handling external data (API responses, user input, etc.)
 */

// ============================================================================
// Axios Error Type Guards
// ============================================================================

/**
 * Shape of an Axios error response for type-safe error handling
 */
export interface AxiosErrorResponse {
  response?: {
    data?: {
      detail?: string | { msg: string }[]
    }
  }
}

/**
 * Type guard to check if an error is an Axios-like error with response
 */
export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  if (typeof error !== 'object' || error === null) return false
  return 'response' in error
}

/**
 * Extract a user-friendly error message from various error types
 *
 * Handles:
 * - Axios errors with string detail
 * - Axios errors with array of validation errors
 * - Standard Error objects
 * - Unknown errors (returns default message)
 */
export function extractErrorMessage(error: unknown, defaultMessage: string): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : defaultMessage
  }

  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .filter((d): d is { msg: string } => typeof d === 'object' && d !== null && 'msg' in d)
      .map((d) => d.msg)
    if (messages.length > 0) {
      return messages.join(', ')
    }
  }

  return defaultMessage
}

// ============================================================================
// Config Schema Type Guards
// ============================================================================

/**
 * Shape of a JSON Schema config (subset of JSON Schema spec)
 */
export interface ConfigSchema {
  type?: string
  properties?: Record<string, unknown>
  required?: string[]
}

/**
 * Type guard to validate if a value is a valid ConfigSchema
 */
export function isValidConfigSchema(value: unknown): value is ConfigSchema {
  if (value === null || value === undefined) return false
  if (typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  // type must be string if present
  if (obj.type !== undefined && typeof obj.type !== 'string') return false

  // properties must be object if present
  if (obj.properties !== undefined && (typeof obj.properties !== 'object' || obj.properties === null)) {
    return false
  }

  // required must be array if present
  if (obj.required !== undefined && !Array.isArray(obj.required)) return false

  return true
}

// ============================================================================
// Object Property Type Guards
// ============================================================================

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}

/**
 * Type guard to check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
