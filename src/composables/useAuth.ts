import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.user)
  const currentOrganization = computed(() => authStore.currentOrganization)
  const organizations = computed(() => authStore.organizations)
  const isAdminOrOwner = computed(() => authStore.isAdminOrOwner)
  const username = computed(() => authStore.username)
  const loginError = computed(() => authStore.loginError)

  async function login(email: string, password: string): Promise<boolean> {
    const success = await authStore.login(email, password)
    if (success) {
      router.push('/chat-visualizer')
    }
    return success
  }

  function logout(): void {
    authStore.logout()
    router.push('/login')
  }

  function switchOrganization(orgId: string): void {
    authStore.switchOrganization(orgId)
  }

  function clearError(): void {
    authStore.clearError()
  }

  /**
   * Check if user is authenticated, redirect to login if not
   */
  function requireAuth(): boolean {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  /**
   * Check if organization is selected, redirect if not
   */
  function requireOrg(): boolean {
    if (!requireAuth()) return false
    if (!authStore.currentOrgId) {
      router.push('/organizations')
      return false
    }
    return true
  }

  /**
   * Check if user has required role
   */
  function requireRole(minRole: 'member' | 'admin' | 'owner'): boolean {
    if (!requireOrg()) return false

    const roleLevels: Record<string, number> = { member: 1, admin: 2, owner: 3 }
    const currentLevel = roleLevels[authStore.currentRole || 'member'] || 0
    const requiredLevel = roleLevels[minRole]

    return currentLevel >= requiredLevel
  }

  return {
    // State
    isAuthenticated,
    currentUser,
    currentOrganization,
    organizations,
    isAdminOrOwner,
    username,
    loginError,

    // Actions
    login,
    logout,
    switchOrganization,
    clearError,
    requireAuth,
    requireOrg,
    requireRole
  }
}
