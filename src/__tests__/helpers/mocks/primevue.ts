import { vi } from 'vitest'

/**
 * PrimeVue mock factories for testing.
 */

/**
 * Create toast mock for useToast composable.
 */
export function createToastMock() {
  return {
    add: vi.fn(),
    removeGroup: vi.fn(),
    removeAllGroups: vi.fn()
  }
}

/**
 * Create confirm mock for useConfirm composable.
 */
export function createConfirmMock() {
  return {
    require: vi.fn()
  }
}

/**
 * Setup PrimeVue toast mock.
 * Returns the mock object for assertions.
 */
export function setupPrimeVueToastMock() {
  const mock = createToastMock()

  vi.mock('primevue/usetoast', () => ({
    useToast: () => mock
  }))

  return mock
}

/**
 * Setup PrimeVue confirm mock.
 * Returns the mock object for assertions.
 */
export function setupPrimeVueConfirmMock() {
  const mock = createConfirmMock()

  vi.mock('primevue/useconfirm', () => ({
    useConfirm: () => mock
  }))

  return mock
}
