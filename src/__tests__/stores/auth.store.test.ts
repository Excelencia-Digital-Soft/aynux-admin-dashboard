import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

// Mock the auth API
vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn()
  }
}))

import { authApi } from '@/api/auth.api'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have null values initially', () => {
      const store = useAuthStore()

      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.organizations).toEqual([])
      expect(store.currentOrgId).toBeNull()
      expect(store.currentRole).toBeNull()
      expect(store.loginError).toBeNull()
    })

    it('should not be authenticated initially', () => {
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('isAuthenticated returns true when token and user exist', () => {
      const store = useAuthStore()

      store.accessToken = 'test-token'
      store.user = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        disabled: false,
        scopes: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      expect(store.isAuthenticated).toBe(true)
    })

    it('isAuthenticated returns false when token is missing', () => {
      const store = useAuthStore()

      store.user = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        disabled: false,
        scopes: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      expect(store.isAuthenticated).toBe(false)
    })

    it('currentOrganization returns the correct organization', () => {
      const store = useAuthStore()

      store.organizations = [
        { id: 'org1', name: 'Org 1', slug: 'org1', role: 'admin' },
        { id: 'org2', name: 'Org 2', slug: 'org2', role: 'viewer' }
      ]
      store.currentOrgId = 'org2'

      expect(store.currentOrganization?.name).toBe('Org 2')
    })

    it('isAdminOrOwner returns true for admin role', () => {
      const store = useAuthStore()

      store.currentRole = 'admin'
      expect(store.isAdminOrOwner).toBe(true)

      store.currentRole = 'owner'
      expect(store.isAdminOrOwner).toBe(true)

      store.currentRole = 'viewer'
      expect(store.isAdminOrOwner).toBe(false)
    })

    it('username returns username or email', () => {
      const store = useAuthStore()

      store.user = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        disabled: false,
        scopes: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      expect(store.username).toBe('testuser')

      store.user = {
        id: '1',
        username: '',
        email: 'test@test.com',
        disabled: false,
        scopes: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      expect(store.username).toBe('test@test.com')
    })
  })

  describe('login action', () => {
    it('should login successfully', async () => {
      const store = useAuthStore()

      vi.mocked(authApi.login).mockResolvedValue({
        access_token: 'test-token',
        token_type: 'bearer'
      })

      vi.mocked(authApi.getCurrentUser).mockResolvedValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          disabled: false,
          scopes: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        organizations: [
          { id: 'org1', name: 'Test Org', slug: 'test-org', role: 'admin' }
        ]
      })

      const result = await store.login('test@test.com', 'password')

      expect(result).toBe(true)
      expect(store.accessToken).toBe('test-token')
      expect(store.user?.username).toBe('testuser')
      expect(store.organizations).toHaveLength(1)
      expect(store.currentOrgId).toBe('org1')
    })

    it('should handle login error', async () => {
      const store = useAuthStore()

      vi.mocked(authApi.login).mockRejectedValue({
        response: { data: { detail: 'Invalid credentials' } }
      })

      const result = await store.login('test@test.com', 'wrong-password')

      expect(result).toBe(false)
      expect(store.loginError).toBe('Invalid credentials')
      expect(store.accessToken).toBeNull()
    })
  })

  describe('switchOrganization action', () => {
    it('should switch organization and update role', () => {
      const store = useAuthStore()

      store.organizations = [
        { id: 'org1', name: 'Org 1', slug: 'org1', role: 'admin' },
        { id: 'org2', name: 'Org 2', slug: 'org2', role: 'viewer' }
      ]

      store.switchOrganization('org2')

      expect(store.currentOrgId).toBe('org2')
      expect(store.currentRole).toBe('viewer')
    })

    it('should not switch to non-existent organization', () => {
      const store = useAuthStore()

      store.organizations = [
        { id: 'org1', name: 'Org 1', slug: 'org1', role: 'admin' }
      ]
      store.currentOrgId = 'org1'
      store.currentRole = 'admin'

      store.switchOrganization('org999')

      expect(store.currentOrgId).toBe('org1')
      expect(store.currentRole).toBe('admin')
    })
  })

  describe('logout action', () => {
    it('should clear all state on logout', () => {
      const store = useAuthStore()

      // Set some state
      store.accessToken = 'test-token'
      store.user = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        disabled: false,
        scopes: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
      store.organizations = [{ id: 'org1', name: 'Org', slug: 'org', role: 'admin' }]
      store.currentOrgId = 'org1'
      store.currentRole = 'admin'

      store.logout()

      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.organizations).toEqual([])
      expect(store.currentOrgId).toBeNull()
      expect(store.currentRole).toBeNull()
      expect(authApi.logout).toHaveBeenCalled()
    })
  })

  describe('clearError action', () => {
    it('should clear login error', () => {
      const store = useAuthStore()

      store.loginError = 'Some error'
      store.clearError()

      expect(store.loginError).toBeNull()
    })
  })
})
