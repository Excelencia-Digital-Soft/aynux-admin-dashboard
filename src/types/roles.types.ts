export interface Role {
  id: string
  name: string
  slug: string
  description?: string
  is_system: boolean
  is_default: boolean
  sort_order: number
  user_count?: number
}

export interface RoleCreateRequest {
  name: string
  slug: string
  description?: string
  is_default?: boolean
  sort_order?: number
}

export interface RoleUpdateRequest {
  name?: string
  description?: string
  is_default?: boolean
  sort_order?: number
}

export interface MenuItemChild {
  id: string
  key: string
  label: string
  icon?: string
  route?: string
  requires_org: boolean
  sort_order: number
}

export interface MenuItemGroup {
  id: string
  key: string
  label: string
  icon?: string
  is_group: boolean
  route?: string
  requires_org: boolean
  sort_order: number
  items?: MenuItemChild[]
}

export interface RolePermissions {
  role_id: string
  role_slug: string
  menu_item_ids: string[]
}
