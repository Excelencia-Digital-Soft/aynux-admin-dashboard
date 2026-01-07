<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useDarkMode } from '@/composables/useDarkMode'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import Avatar from 'primevue/avatar'
import type { MenuItem } from 'primevue/menuitem'

const route = useRoute()
const { currentUser, currentOrganization, organizations, logout, switchOrganization, username, isAdminOrOwner } = useAuth()
const { isDark, toggleDarkMode } = useDarkMode()

const sidebarCollapsed = ref(false)
const userMenuRef = ref()

// Navigation menu items
const globalMenuItems = computed<MenuItem[]>(() => [
  {
    label: 'Chat Visualizer',
    icon: 'pi pi-comments',
    route: '/chat-visualizer'
  },
  {
    label: 'Knowledge Base',
    icon: 'pi pi-book',
    route: '/knowledge-base'
  },
  {
    label: 'Upload Documents',
    icon: 'pi pi-upload',
    route: '/upload-documents'
  },
  {
    label: 'Embeddings',
    icon: 'pi pi-cog',
    route: '/embeddings'
  },
  {
    label: 'Excelencia',
    icon: 'pi pi-building',
    route: '/excelencia'
  },
  {
    label: 'Agent Config',
    icon: 'pi pi-sliders-h',
    route: '/agent-config'
  },
  {
    label: 'Statistics',
    icon: 'pi pi-chart-bar',
    route: '/statistics'
  },
  {
    label: 'RAG Dashboard',
    icon: 'pi pi-chart-line',
    route: '/rag-dashboard'
  }
])

const multiTenantMenuItems = computed<MenuItem[]>(() => [
  {
    label: 'Organizations',
    icon: 'pi pi-sitemap',
    route: '/organizations'
  },
  {
    label: 'Users',
    icon: 'pi pi-users',
    route: `/organizations/${currentOrganization.value?.id}/users`,
    disabled: !currentOrganization.value
  },
  {
    label: 'Tenant Config',
    icon: 'pi pi-cog',
    route: '/tenant-config',
    disabled: !currentOrganization.value
  },
  {
    label: 'Tenant Documents (Soon)',
    icon: 'pi pi-file',
    route: '/tenant-documents',
    disabled: true
  }
])

const configMenuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    {
      label: 'Farmacias',
      icon: 'pi pi-shop',
      route: '/pharmacy'
    },
    {
      label: 'Reglas de Bypass',
      icon: 'pi pi-directions',
      route: '/bypass-rules'
    },
    {
      label: 'Gestion YAML',
      icon: 'pi pi-code',
      route: '/yaml-management'
    },
    {
      label: 'Chattigo',
      icon: 'pi pi-whatsapp',
      route: '/chattigo-credentials'
    }
  ]

  // Admin-only items
  if (isAdminOrOwner.value) {
    items.push({
      label: 'Modelos AI',
      icon: 'pi pi-microchip-ai',
      route: '/ai-models'
    })
    items.push({
      label: 'Catalogo Agentes',
      icon: 'pi pi-box',
      route: '/agent-catalog'
    })
    items.push({
      label: 'Dominios',
      icon: 'pi pi-globe',
      route: '/domains'
    })
  }

  return items
})

const testingMenuItems = computed<MenuItem[]>(() => [
  {
    label: 'Pharmacy Testing',
    icon: 'pi pi-heart',
    route: '/pharmacy-testing'
  }
])

const userMenuItems = computed<MenuItem[]>(() => [
  {
    label: 'Perfil',
    icon: 'pi pi-user',
    command: () => {
      // Navigate to profile
    }
  },
  {
    separator: true
  },
  {
    label: 'Cerrar Sesion',
    icon: 'pi pi-sign-out',
    command: () => logout()
  }
])

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleUserMenu(event: Event) {
  userMenuRef.value.toggle(event)
}

function isActive(path: string): boolean {
  return route.path === path
}

function handleOrgChange(orgId: string) {
  switchOrganization(orgId)
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Skip Link for Accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
    >
      Saltar al contenido principal
    </a>

    <!-- Sidebar -->
    <aside
      :class="[
        'bg-white shadow-lg transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      ]"
      role="navigation"
      aria-label="Menu principal"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <RouterLink to="/" class="flex items-center gap-2 overflow-hidden">
          <img
            v-if="sidebarCollapsed"
            src="@/assets/aynux.svg"
            alt="Aynux"
            class="h-8 w-8 object-contain"
          />
          <img
            v-else
            src="@/assets/full-aynux.png"
            alt="Aynux Admin"
            class="h-10 object-contain"
          />
        </RouterLink>
        <Button
          :icon="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
          text
          rounded
          severity="secondary"
          @click="toggleSidebar"
          :aria-label="sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'"
          :aria-expanded="!sidebarCollapsed"
        />
      </div>

      <!-- Organization Switcher -->
      <div v-if="!sidebarCollapsed && organizations.length > 0" class="p-3 border-b">
        <Select
          v-model="currentOrganization"
          :options="organizations"
          optionLabel="name"
          placeholder="Seleccionar Org"
          class="w-full"
          @change="(e) => handleOrgChange(e.value.id)"
        />
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4">
        <!-- Global Mode -->
        <div class="px-3 mb-4">
          <span
            v-if="!sidebarCollapsed"
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Global
          </span>
          <ul class="mt-2 space-y-1">
            <li v-for="item in globalMenuItems" :key="item.route">
              <RouterLink
                :to="item.route!"
                :class="[
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive(item.route!)
                    ? 'bg-gradient-to-r from-primary-100 to-cyan-50 text-primary-700 border-l-4 border-primary-500 -ml-1 pl-4'
                    : 'text-gray-600 hover:bg-primary-50/50 hover:text-primary-600'
                ]"
              >
                <i :class="[item.icon, 'text-lg']" />
                <span v-if="!sidebarCollapsed" class="ml-3">{{ item.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Multi-Tenant Mode -->
        <div class="px-3 mb-4">
          <span
            v-if="!sidebarCollapsed"
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Multi-Tenant
          </span>
          <ul class="mt-2 space-y-1">
            <li v-for="item in multiTenantMenuItems" :key="item.route">
              <RouterLink
                :to="item.route!"
                :class="[
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                  item.disabled
                    ? 'text-gray-300 cursor-not-allowed pointer-events-none'
                    : isActive(item.route!)
                      ? 'bg-gradient-to-r from-primary-100 to-cyan-50 text-primary-700 border-l-4 border-primary-500 -ml-1 pl-4'
                      : 'text-gray-600 hover:bg-primary-50/50 hover:text-primary-600'
                ]"
              >
                <i :class="[item.icon, 'text-lg']" />
                <span v-if="!sidebarCollapsed" class="ml-3">{{ item.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Configuracion -->
        <div class="px-3 mb-4">
          <span
            v-if="!sidebarCollapsed"
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Configuracion
          </span>
          <ul class="mt-2 space-y-1">
            <li v-for="item in configMenuItems" :key="item.route">
              <RouterLink
                :to="item.route!"
                :class="[
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive(item.route!)
                    ? 'bg-gradient-to-r from-primary-100 to-cyan-50 text-primary-700 border-l-4 border-primary-500 -ml-1 pl-4'
                    : 'text-gray-600 hover:bg-primary-50/50 hover:text-primary-600'
                ]"
              >
                <i :class="[item.icon, 'text-lg']" />
                <span v-if="!sidebarCollapsed" class="ml-3">{{ item.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Pruebas -->
        <div class="px-3">
          <span
            v-if="!sidebarCollapsed"
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Pruebas
          </span>
          <ul class="mt-2 space-y-1">
            <li v-for="item in testingMenuItems" :key="item.route">
              <RouterLink
                :to="item.route!"
                :class="[
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive(item.route!)
                    ? 'bg-gradient-to-r from-primary-100 to-cyan-50 text-primary-700 border-l-4 border-primary-500 -ml-1 pl-4'
                    : 'text-gray-600 hover:bg-primary-50/50 hover:text-primary-600'
                ]"
              >
                <i :class="[item.icon, 'text-lg']" />
                <span v-if="!sidebarCollapsed" class="ml-3">{{ item.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- User Section -->
      <div class="border-t border-gray-100 p-3">
        <div
          class="flex items-center cursor-pointer hover:bg-primary-50/50 rounded-lg p-2 transition-all duration-200"
          @click="toggleUserMenu"
        >
          <Avatar :label="username.charAt(0).toUpperCase()" shape="circle" class="bg-gradient-to-br from-primary-500 to-cyan-500 text-white" />
          <div v-if="!sidebarCollapsed" class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ username }}</p>
            <p class="text-xs text-gray-500 truncate">{{ currentOrganization?.name || 'Sin org' }}</p>
          </div>
          <i v-if="!sidebarCollapsed" class="pi pi-chevron-up text-gray-400" />
        </div>
        <Menu ref="userMenuRef" :model="userMenuItems" :popup="true" />
      </div>
    </aside>

    <!-- Main Content -->
    <main id="main-content" class="flex-1 overflow-auto" role="main" aria-label="Contenido principal">
      <!-- Header -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6" role="banner">
        <h1 class="text-xl font-semibold text-gray-800">
          {{ route.meta.title || 'Dashboard' }}
        </h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            {{ currentUser?.email }}
          </span>
          <Button
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            text
            rounded
            severity="secondary"
            @click="toggleDarkMode"
            v-tooltip.bottom="isDark ? 'Modo claro' : 'Modo oscuro'"
            aria-label="Cambiar modo de color"
          />
        </div>
      </header>

      <!-- Page Content -->
      <div class="p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>
