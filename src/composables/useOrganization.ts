import { computed } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { organizationApi } from '@/api/organization.api'
import { tenantApi } from '@/api/tenant.api'
import { useToast } from '@/composables/useToast'
import type {
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  UserCreateRequest,
  UserUpdateRequest,
  TenantConfigUpdateRequest,
  TenantDocumentCreateRequest,
  TenantDocumentUpdateRequest
} from '@/types/organization.types'

export function useOrganization() {
  const store = useOrganizationStore()
  const toast = useToast()

  // Computed
  const organizations = computed(() => store.organizations)
  const totalOrganizations = computed(() => store.totalOrganizations)
  const selectedOrg = computed(() => store.selectedOrganization)
  const orgStats = computed(() => store.organizationStats)

  const users = computed(() => store.users)
  const totalUsers = computed(() => store.totalUsers)
  const invites = computed(() => store.invites)

  const tenantConfig = computed(() => store.tenantConfig)
  const tenantDocuments = computed(() => store.tenantDocuments)
  const totalTenantDocuments = computed(() => store.totalTenantDocuments)
  const tenantDocStats = computed(() => store.tenantDocumentStats)

  const isLoading = computed(() => store.isLoading)

  // ============ Organizations ============

  async function fetchOrganizations() {
    store.setLoading(true)
    store.setError(null)

    try {
      const result = await organizationApi.list({
        page: store.orgPage,
        pageSize: store.orgPageSize,
        ...store.orgFilters
      })
      store.setOrganizations(result.organizations, result.total)
    } catch (error) {
      store.setError('Error al cargar organizaciones')
      toast.error('Error al cargar organizaciones')
    } finally {
      store.setLoading(false)
    }
  }

  async function createOrganization(data: OrganizationCreateRequest) {
    store.setLoading(true)
    try {
      const org = await organizationApi.create(data)
      await fetchOrganizations()
      store.closeOrgDialog()
      toast.success('Organizacion creada')
      return org
    } catch (error) {
      toast.error('Error al crear organizacion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateOrganization(orgId: string, data: OrganizationUpdateRequest) {
    store.setLoading(true)
    try {
      const org = await organizationApi.update(orgId, data)
      store.updateOrganization(org)
      store.closeOrgDialog()
      toast.success('Organizacion actualizada')
      return org
    } catch (error) {
      toast.error('Error al actualizar organizacion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteOrganization(orgId: string) {
    store.setLoading(true)
    try {
      await organizationApi.delete(orgId)
      store.removeOrganization(orgId)
      toast.success('Organizacion eliminada')
      return true
    } catch (error) {
      toast.error('Error al eliminar organizacion')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  async function selectOrganization(orgId: string) {
    store.setLoading(true)
    try {
      const org = await organizationApi.getById(orgId)
      store.selectOrganization(org)

      // Load stats
      const stats = await organizationApi.getStats(orgId)
      store.setOrganizationStats(stats)

      return org
    } catch (error) {
      toast.error('Error al cargar organizacion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Users ============

  async function fetchUsers(orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return

    store.setLoading(true)
    try {
      const result = await organizationApi.getUsers(targetOrgId, {
        page: store.userPage,
        pageSize: store.userPageSize,
        ...store.userFilters
      })
      store.setUsers(result.users, result.total)
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      store.setLoading(false)
    }
  }

  async function createUser(data: UserCreateRequest, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const user = await organizationApi.createUser(targetOrgId, data)
      store.addUser(user)
      store.closeUserDialog()
      toast.success('Usuario creado')
      return user
    } catch (error) {
      toast.error('Error al crear usuario')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateUser(userId: string, data: UserUpdateRequest, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const user = await organizationApi.updateUser(targetOrgId, userId, data)
      store.updateUser(user)
      store.closeUserDialog()
      toast.success('Usuario actualizado')
      return user
    } catch (error) {
      toast.error('Error al actualizar usuario')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteUser(userId: string, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return false

    store.setLoading(true)
    try {
      await organizationApi.deleteUser(targetOrgId, userId)
      store.removeUser(userId)
      toast.success('Usuario eliminado')
      return true
    } catch (error) {
      toast.error('Error al eliminar usuario')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  async function sendInvite(email: string, role: string, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const invite = await organizationApi.sendInvite(targetOrgId, { email, role })
      store.addInvite(invite)
      store.closeInviteDialog()
      toast.success('Invitacion enviada')
      return invite
    } catch (error) {
      toast.error('Error al enviar invitacion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchInvites(orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return

    try {
      const invites = await organizationApi.getInvites(targetOrgId)
      store.setInvites(invites)
    } catch (error) {
      console.error('Error fetching invites:', error)
    }
  }

  async function cancelInvite(inviteId: string, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return false

    try {
      await organizationApi.cancelInvite(targetOrgId, inviteId)
      store.removeInvite(inviteId)
      toast.info('Invitacion cancelada')
      return true
    } catch (error) {
      toast.error('Error al cancelar invitacion')
      return false
    }
  }

  // ============ Tenant Config ============

  async function fetchTenantConfig(orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return

    store.setLoading(true)
    try {
      const config = await tenantApi.getConfig(targetOrgId)
      store.setTenantConfig(config)
    } catch (error) {
      toast.error('Error al cargar configuracion')
    } finally {
      store.setLoading(false)
    }
  }

  async function updateTenantConfig(data: TenantConfigUpdateRequest, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const config = await tenantApi.updateConfig(targetOrgId, data)
      store.setTenantConfig(config)
      toast.success('Configuracion actualizada')
      return config
    } catch (error) {
      toast.error('Error al actualizar configuracion')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function regenerateApiKey(orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const result = await tenantApi.regenerateApiKey(targetOrgId)
      toast.success('API Key regenerada')
      return result.api_key
    } catch (error) {
      toast.error('Error al regenerar API Key')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  // ============ Tenant Documents ============

  async function fetchTenantDocuments(orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return

    store.setLoading(true)
    try {
      const result = await tenantApi.getDocuments(targetOrgId, {
        page: store.docPage,
        pageSize: store.docPageSize,
        ...store.docFilters
      })
      store.setTenantDocuments(result.documents, result.total)
    } catch (error) {
      toast.error('Error al cargar documentos')
    } finally {
      store.setLoading(false)
    }
  }

  async function createTenantDocument(data: TenantDocumentCreateRequest, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const doc = await tenantApi.createDocument(targetOrgId, data)
      store.addTenantDocument(doc)
      toast.success('Documento creado')
      return doc
    } catch (error) {
      toast.error('Error al crear documento')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function updateTenantDocument(
    docId: string,
    data: TenantDocumentUpdateRequest,
    orgId?: string
  ) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return null

    store.setLoading(true)
    try {
      const doc = await tenantApi.updateDocument(targetOrgId, docId, data)
      store.updateTenantDocument(doc)
      toast.success('Documento actualizado')
      return doc
    } catch (error) {
      toast.error('Error al actualizar documento')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async function deleteTenantDocument(docId: string, hardDelete = false, orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return false

    store.setLoading(true)
    try {
      await tenantApi.deleteDocument(targetOrgId, docId, hardDelete)
      store.removeTenantDocument(docId)
      toast.success(hardDelete ? 'Documento eliminado' : 'Documento desactivado')
      return true
    } catch (error) {
      toast.error('Error al eliminar documento')
      return false
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchTenantDocumentStats(orgId?: string) {
    const targetOrgId = orgId || store.selectedOrganization?.id
    if (!targetOrgId) return

    try {
      const stats = await tenantApi.getDocumentStats(targetOrgId)
      store.setTenantDocumentStats(stats)
    } catch (error) {
      console.error('Error fetching doc stats:', error)
    }
  }

  return {
    // State
    organizations,
    totalOrganizations,
    selectedOrg,
    orgStats,
    users,
    totalUsers,
    invites,
    tenantConfig,
    tenantDocuments,
    totalTenantDocuments,
    tenantDocStats,
    isLoading,

    // Organization actions
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    selectOrganization,

    // User actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    sendInvite,
    fetchInvites,
    cancelInvite,

    // Tenant config
    fetchTenantConfig,
    updateTenantConfig,
    regenerateApiKey,

    // Tenant documents
    fetchTenantDocuments,
    createTenantDocument,
    updateTenantDocument,
    deleteTenantDocument,
    fetchTenantDocumentStats,

    // Store actions
    setOrgPage: store.setOrgPage,
    setOrgPageSize: store.setOrgPageSize,
    setOrgFilters: store.setOrgFilters,
    setUserPage: store.setUserPage,
    setUserPageSize: store.setUserPageSize,
    setUserFilters: store.setUserFilters,
    setDocPage: store.setDocPage,
    setDocPageSize: store.setDocPageSize,
    setDocFilters: store.setDocFilters,
    openOrgDialog: store.openOrgDialog,
    closeOrgDialog: store.closeOrgDialog,
    openUserDialog: store.openUserDialog,
    closeUserDialog: store.closeUserDialog,
    openInviteDialog: store.openInviteDialog,
    closeInviteDialog: store.closeInviteDialog
  }
}
