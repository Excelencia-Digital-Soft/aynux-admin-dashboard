import { defineStore } from 'pinia'
import type {
  Organization,
  OrganizationUser,
  UserInvite,
  OrganizationStats,
  TenantConfig,
  TenantDocument,
  TenantDocumentStats
} from '@/types/organization.types'

interface OrganizationState {
  // Organizations
  organizations: Organization[]
  totalOrganizations: number
  selectedOrganization: Organization | null
  organizationStats: OrganizationStats | null

  // Users
  users: OrganizationUser[]
  totalUsers: number
  selectedUser: OrganizationUser | null
  invites: UserInvite[]

  // Tenant
  tenantConfig: TenantConfig | null
  tenantDocuments: TenantDocument[]
  totalTenantDocuments: number
  tenantDocumentStats: TenantDocumentStats | null

  // UI State
  isLoading: boolean
  error: string | null

  // Pagination
  orgPage: number
  orgPageSize: number
  userPage: number
  userPageSize: number
  docPage: number
  docPageSize: number

  // Filters
  orgFilters: {
    status?: string
    search?: string
  }
  userFilters: {
    role?: string
    status?: string
    search?: string
  }
  docFilters: {
    documentType?: string
    category?: string
    activeOnly?: boolean
    search?: string
  }

  // Dialogs
  showOrgDialog: boolean
  showUserDialog: boolean
  showInviteDialog: boolean
  showConfigDialog: boolean
  editingOrg: Organization | null
  editingUser: OrganizationUser | null
}

export const useOrganizationStore = defineStore('organization', {
  state: (): OrganizationState => ({
    organizations: [],
    totalOrganizations: 0,
    selectedOrganization: null,
    organizationStats: null,

    users: [],
    totalUsers: 0,
    selectedUser: null,
    invites: [],

    tenantConfig: null,
    tenantDocuments: [],
    totalTenantDocuments: 0,
    tenantDocumentStats: null,

    isLoading: false,
    error: null,

    orgPage: 1,
    orgPageSize: 25,
    userPage: 1,
    userPageSize: 25,
    docPage: 1,
    docPageSize: 25,

    orgFilters: {},
    userFilters: {},
    docFilters: {},

    showOrgDialog: false,
    showUserDialog: false,
    showInviteDialog: false,
    showConfigDialog: false,
    editingOrg: null,
    editingUser: null
  }),

  getters: {
    activeOrganizations(): Organization[] {
      return this.organizations.filter(org => org.status === 'active')
    },

    currentOrgId(): string | null {
      return this.selectedOrganization?.id || null
    },

    activeUsers(): OrganizationUser[] {
      return this.users.filter(user => user.status === 'active')
    },

    pendingInvites(): UserInvite[] {
      return this.invites.filter(invite => invite.status === 'pending')
    },

    activeTenantDocuments(): TenantDocument[] {
      return this.tenantDocuments.filter(doc => doc.active)
    },

    isEditingOrg(): boolean {
      return this.editingOrg !== null
    },

    isEditingUser(): boolean {
      return this.editingUser !== null
    }
  },

  actions: {
    // Organization actions
    setOrganizations(orgs: Organization[], total: number) {
      this.organizations = orgs
      this.totalOrganizations = total
    },

    selectOrganization(org: Organization | null) {
      this.selectedOrganization = org
      // Clear tenant data when switching orgs
      if (org?.id !== this.selectedOrganization?.id) {
        this.tenantConfig = null
        this.tenantDocuments = []
        this.tenantDocumentStats = null
        this.users = []
        this.invites = []
      }
    },

    updateOrganization(org: Organization) {
      const index = this.organizations.findIndex(o => o.id === org.id)
      if (index >= 0) {
        this.organizations[index] = org
      }
      if (this.selectedOrganization?.id === org.id) {
        this.selectedOrganization = org
      }
    },

    removeOrganization(orgId: string) {
      this.organizations = this.organizations.filter(o => o.id !== orgId)
      if (this.selectedOrganization?.id === orgId) {
        this.selectedOrganization = null
      }
    },

    setOrganizationStats(stats: OrganizationStats | null) {
      this.organizationStats = stats
    },

    // User actions
    setUsers(users: OrganizationUser[], total: number) {
      this.users = users
      this.totalUsers = total
    },

    addUser(user: OrganizationUser) {
      this.users.push(user)
      this.totalUsers++
    },

    updateUser(user: OrganizationUser) {
      const index = this.users.findIndex(u => u.id === user.id)
      if (index >= 0) {
        this.users[index] = user
      }
    },

    removeUser(userId: string) {
      this.users = this.users.filter(u => u.id !== userId)
      this.totalUsers--
    },

    setInvites(invites: UserInvite[]) {
      this.invites = invites
    },

    addInvite(invite: UserInvite) {
      this.invites.push(invite)
    },

    removeInvite(inviteId: string) {
      this.invites = this.invites.filter(i => i.id !== inviteId)
    },

    // Tenant actions
    setTenantConfig(config: TenantConfig | null) {
      this.tenantConfig = config
    },

    setTenantDocuments(docs: TenantDocument[], total: number) {
      this.tenantDocuments = docs
      this.totalTenantDocuments = total
    },

    addTenantDocument(doc: TenantDocument) {
      this.tenantDocuments.unshift(doc)
      this.totalTenantDocuments++
    },

    updateTenantDocument(doc: TenantDocument) {
      const index = this.tenantDocuments.findIndex(d => d.id === doc.id)
      if (index >= 0) {
        this.tenantDocuments[index] = doc
      }
    },

    removeTenantDocument(docId: string) {
      this.tenantDocuments = this.tenantDocuments.filter(d => d.id !== docId)
      this.totalTenantDocuments--
    },

    setTenantDocumentStats(stats: TenantDocumentStats | null) {
      this.tenantDocumentStats = stats
    },

    // UI actions
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    // Dialog actions
    openOrgDialog(org: Organization | null = null) {
      this.editingOrg = org
      this.showOrgDialog = true
    },

    closeOrgDialog() {
      this.showOrgDialog = false
      this.editingOrg = null
    },

    openUserDialog(user: OrganizationUser | null = null) {
      this.editingUser = user
      this.showUserDialog = true
    },

    closeUserDialog() {
      this.showUserDialog = false
      this.editingUser = null
    },

    openInviteDialog() {
      this.showInviteDialog = true
    },

    closeInviteDialog() {
      this.showInviteDialog = false
    },

    // Pagination
    setOrgPage(page: number) {
      this.orgPage = page
    },

    setOrgPageSize(size: number) {
      this.orgPageSize = size
      this.orgPage = 1
    },

    setUserPage(page: number) {
      this.userPage = page
    },

    setUserPageSize(size: number) {
      this.userPageSize = size
      this.userPage = 1
    },

    setDocPage(page: number) {
      this.docPage = page
    },

    setDocPageSize(size: number) {
      this.docPageSize = size
      this.docPage = 1
    },

    // Filters
    setOrgFilters(filters: Partial<OrganizationState['orgFilters']>) {
      this.orgFilters = { ...this.orgFilters, ...filters }
      this.orgPage = 1
    },

    setUserFilters(filters: Partial<OrganizationState['userFilters']>) {
      this.userFilters = { ...this.userFilters, ...filters }
      this.userPage = 1
    },

    setDocFilters(filters: Partial<OrganizationState['docFilters']>) {
      this.docFilters = { ...this.docFilters, ...filters }
      this.docPage = 1
    },

    resetFilters() {
      this.orgFilters = {}
      this.userFilters = {}
      this.docFilters = {}
    }
  }
})
