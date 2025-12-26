import apiClient from './index'
import type {
  Organization,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  OrganizationUser,
  UserCreateRequest,
  UserUpdateRequest,
  UserInvite,
  OrganizationStats
} from '@/types/organization.types'

const ORG_URL = '/admin/organizations'

export const organizationApi = {
  // ============ Organizations ============

  /**
   * Get all organizations (super admin)
   */
  async list(params: {
    page?: number
    pageSize?: number
    status?: string
    search?: string
  } = {}): Promise<{ organizations: Organization[]; total: number }> {
    const { data } = await apiClient.get(ORG_URL, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 25,
        status: params.status,
        search: params.search
      }
    })
    return data
  },

  /**
   * Get single organization
   */
  async getById(orgId: string): Promise<Organization> {
    const { data } = await apiClient.get<Organization>(`${ORG_URL}/${orgId}`)
    return data
  },

  /**
   * Create organization
   */
  async create(orgData: OrganizationCreateRequest): Promise<Organization> {
    const { data } = await apiClient.post<Organization>(ORG_URL, orgData)
    return data
  },

  /**
   * Update organization
   */
  async update(orgId: string, updateData: OrganizationUpdateRequest): Promise<Organization> {
    const { data } = await apiClient.put<Organization>(`${ORG_URL}/${orgId}`, updateData)
    return data
  },

  /**
   * Delete organization
   */
  async delete(orgId: string): Promise<void> {
    await apiClient.delete(`${ORG_URL}/${orgId}`)
  },

  /**
   * Get organization statistics
   */
  async getStats(orgId: string): Promise<OrganizationStats> {
    const { data } = await apiClient.get<OrganizationStats>(`${ORG_URL}/${orgId}/stats`)
    return data
  },

  // ============ Users ============

  /**
   * Get users for an organization
   */
  async getUsers(orgId: string, params: {
    page?: number
    pageSize?: number
    role?: string
    status?: string
    search?: string
  } = {}): Promise<{ users: OrganizationUser[]; total: number }> {
    const { data } = await apiClient.get(`${ORG_URL}/${orgId}/users`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 25,
        role: params.role,
        status: params.status,
        search: params.search
      }
    })
    return data
  },

  /**
   * Get single user
   */
  async getUser(orgId: string, userId: string): Promise<OrganizationUser> {
    const { data } = await apiClient.get<OrganizationUser>(
      `${ORG_URL}/${orgId}/users/${userId}`
    )
    return data
  },

  /**
   * Create user in organization
   */
  async createUser(orgId: string, userData: UserCreateRequest): Promise<OrganizationUser> {
    const { data } = await apiClient.post<OrganizationUser>(
      `${ORG_URL}/${orgId}/users`,
      userData
    )
    return data
  },

  /**
   * Update user
   */
  async updateUser(
    orgId: string,
    userId: string,
    updateData: UserUpdateRequest
  ): Promise<OrganizationUser> {
    const { data } = await apiClient.put<OrganizationUser>(
      `${ORG_URL}/${orgId}/users/${userId}`,
      updateData
    )
    return data
  },

  /**
   * Delete user from organization
   */
  async deleteUser(orgId: string, userId: string): Promise<void> {
    await apiClient.delete(`${ORG_URL}/${orgId}/users/${userId}`)
  },

  /**
   * Reset user password
   */
  async resetUserPassword(orgId: string, userId: string): Promise<{ temp_password: string }> {
    const { data } = await apiClient.post<{ temp_password: string }>(
      `${ORG_URL}/${orgId}/users/${userId}/reset-password`
    )
    return data
  },

  // ============ Invitations ============

  /**
   * Get pending invitations
   */
  async getInvites(orgId: string): Promise<UserInvite[]> {
    const { data } = await apiClient.get<{ invites: UserInvite[] }>(
      `${ORG_URL}/${orgId}/invites`
    )
    return data.invites
  },

  /**
   * Send invitation
   */
  async sendInvite(orgId: string, invite: {
    email: string
    role: string
  }): Promise<UserInvite> {
    const { data } = await apiClient.post<UserInvite>(
      `${ORG_URL}/${orgId}/invites`,
      invite
    )
    return data
  },

  /**
   * Resend invitation
   */
  async resendInvite(orgId: string, inviteId: string): Promise<void> {
    await apiClient.post(`${ORG_URL}/${orgId}/invites/${inviteId}/resend`)
  },

  /**
   * Cancel invitation
   */
  async cancelInvite(orgId: string, inviteId: string): Promise<void> {
    await apiClient.delete(`${ORG_URL}/${orgId}/invites/${inviteId}`)
  }
}

export default organizationApi
