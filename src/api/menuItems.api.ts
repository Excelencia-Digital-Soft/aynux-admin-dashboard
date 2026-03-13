import apiClient from './index'
import type { MenuItemGroup } from '@/types/roles.types'

const BASE_URL = '/admin'

export const menuItemsApi = {
  async listAll(): Promise<{ menu_items: MenuItemGroup[] }> {
    const { data } = await apiClient.get(`${BASE_URL}/menu-items`)
    return data
  },

  async getMyMenus(orgId?: string): Promise<{ menu_items: MenuItemGroup[] }> {
    const { data } = await apiClient.get(`${BASE_URL}/menu-items/my-menus`, {
      params: orgId ? { org_id: orgId } : undefined
    })
    return data
  }
}

export default menuItemsApi
