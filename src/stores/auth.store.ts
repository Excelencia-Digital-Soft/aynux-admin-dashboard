import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Organization, AuthState } from '@/types/auth.types'
import { authApi } from '@/api/auth.api'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const accessToken = ref<string | null>(null)
    const user = ref<User | null>(null)
    const organizations = ref<Organization[]>([])
    const currentOrgId = ref<string | null>(null)
    const currentRole = ref<string | null>(null)
    const loginError = ref<string | null>(null)

    // Computed
    const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

    const currentOrganization = computed(() =>
      organizations.value.find((org) => org.id === currentOrgId.value)
    )

    const isAdminOrOwner = computed(() => ['admin', 'owner'].includes(currentRole.value || ''))

    const username = computed(() => user.value?.username || user.value?.email || '')

    // Actions
    async function login(email: string, password: string): Promise<boolean> {
      try {
        loginError.value = null
        const response = await authApi.login({ email, password })
        accessToken.value = response.access_token
        await fetchCurrentUser()
        return true
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } }; message?: string }
        loginError.value = err.response?.data?.detail || err.message || 'Error de autenticacion'
        return false
      }
    }

    async function fetchCurrentUser(): Promise<void> {
      try {
        const data = await authApi.getCurrentUser()
        user.value = data.user
        organizations.value = data.organizations || []

        // Auto-select first organization if none selected
        if (organizations.value.length > 0 && !currentOrgId.value) {
          switchOrganization(organizations.value[0].id)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
        logout()
      }
    }

    function switchOrganization(orgId: string): void {
      const org = organizations.value.find((o) => o.id === orgId)
      if (org) {
        currentOrgId.value = orgId
        currentRole.value = org.role
      }
    }

    function logout(): void {
      accessToken.value = null
      user.value = null
      organizations.value = []
      currentOrgId.value = null
      currentRole.value = null
      loginError.value = null
      authApi.logout()
    }

    function clearError(): void {
      loginError.value = null
    }

    return {
      // State
      accessToken,
      user,
      organizations,
      currentOrgId,
      currentRole,
      loginError,

      // Computed
      isAuthenticated,
      currentOrganization,
      isAdminOrOwner,
      username,

      // Actions
      login,
      fetchCurrentUser,
      switchOrganization,
      logout,
      clearError
    }
  },
  {
    persist: true
  }
)

export type AuthStore = ReturnType<typeof useAuthStore>
