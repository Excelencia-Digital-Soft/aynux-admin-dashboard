import apiClient from './index'
import type {
  Role,
  RoleCreateRequest,
  RoleUpdateRequest,
  RolePermissions
} from '@/types/roles.types'

const ORG_URL = '/admin/organizations'

export const rolesApi = {
  async list(orgId: string): Promise<{ roles: Role[] }> {
    const { data } = await apiClient.get(`${ORG_URL}/${orgId}/roles`)
    return data
  },

  async create(orgId: string, roleData: RoleCreateRequest): Promise<Role> {
    const { data } = await apiClient.post<Role>(`${ORG_URL}/${orgId}/roles`, roleData)
    return data
  },

  async update(orgId: string, roleId: string, roleData: RoleUpdateRequest): Promise<Role> {
    const { data } = await apiClient.put<Role>(`${ORG_URL}/${orgId}/roles/${roleId}`, roleData)
    return data
  },

  async delete(orgId: string, roleId: string): Promise<void> {
    await apiClient.delete(`${ORG_URL}/${orgId}/roles/${roleId}`)
  },

  async getPermissions(orgId: string, roleId: string): Promise<RolePermissions> {
    const { data } = await apiClient.get<RolePermissions>(
      `${ORG_URL}/${orgId}/roles/${roleId}/permissions`
    )
    return data
  },

  async setPermissions(
    orgId: string,
    roleId: string,
    menuItemIds: string[]
  ): Promise<RolePermissions> {
    const { data } = await apiClient.put<RolePermissions>(
      `${ORG_URL}/${orgId}/roles/${roleId}/permissions`,
      { menu_item_ids: menuItemIds }
    )
    return data
  }
}

export default rolesApi
