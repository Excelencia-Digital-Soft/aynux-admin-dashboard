import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItemGroup } from '@/types/roles.types'
import { menuItemsApi } from '@/api/menuItems.api'

export const useMenuStore = defineStore('menu', () => {
  const menuItems = ref<MenuItemGroup[]>([])
  const allMenuItems = ref<MenuItemGroup[]>([])
  const isLoading = ref(false)

  async function fetchMyMenus(orgId?: string): Promise<void> {
    isLoading.value = true
    try {
      const data = await menuItemsApi.getMyMenus(orgId)
      menuItems.value = data.menu_items
    } catch (error) {
      console.error('Error fetching menus:', error)
      menuItems.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllMenuItems(): Promise<void> {
    try {
      const data = await menuItemsApi.listAll()
      allMenuItems.value = data.menu_items
    } catch (error) {
      console.error('Error fetching all menu items:', error)
      allMenuItems.value = []
    }
  }

  return {
    menuItems,
    allMenuItems,
    isLoading,
    fetchMyMenus,
    fetchAllMenuItems
  }
})
