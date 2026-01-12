import { vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

/**
 * Global test setup utilities for composables and stores.
 */

/**
 * Setup test environment for each test.
 * Creates fresh Pinia instance and clears mocks.
 */
export function setupTestEnvironment() {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
}

/**
 * Helper to flush all pending promises.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Helper to advance timers and flush promises.
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await flushPromises()
}

/**
 * Create a mock router for testing composables that use vue-router.
 */
export function createMockRouter() {
  const push = vi.fn()
  const replace = vi.fn()
  const back = vi.fn()
  const go = vi.fn()

  return {
    push,
    replace,
    back,
    go,
    currentRoute: {
      value: {
        params: {},
        query: {},
        path: '/',
        name: 'test'
      }
    }
  }
}

/**
 * Create a mock route for testing.
 */
export function createMockRoute(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    query: {},
    path: '/',
    name: 'test',
    ...overrides
  }
}
