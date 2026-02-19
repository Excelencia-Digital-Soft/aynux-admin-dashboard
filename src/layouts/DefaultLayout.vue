<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useDarkMode } from '@/composables/useDarkMode'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import PanelMenu from 'primevue/panelmenu'
import Select from 'primevue/select'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Ripple from 'primevue/ripple'
import type { MenuItem } from 'primevue/menuitem'

const vRipple = Ripple

const route = useRoute()
const router = useRouter()
const { currentUser, currentOrganization, organizations, logout, switchOrganization, username, isAdminOrOwner } = useAuth()
const { isDark, toggleDarkMode } = useDarkMode()

const sidebarCollapsed = ref(false)
const userMenuRef = ref()

// Expanded keys for controlled PanelMenu
const expandedKeys = ref<Record<string, boolean>>({})

// Initialize expanded state based on current route
function initExpandedState() {
  if (route.path.startsWith('/knowledge-base') || route.path.startsWith('/upload-documents') || route.path.startsWith('/embeddings') || route.path.startsWith('/rag-dashboard')) {
    expandedKeys.value['knowledge'] = true
  }
  if (route.path.startsWith('/agent-config') || route.path.startsWith('/excelencia')) {
    expandedKeys.value['agents'] = true
  }
  if (route.path.startsWith('/organizations') || route.path.startsWith('/tenant') || route.path.startsWith('/institution') || route.path.startsWith('/pharmacy')) {
    expandedKeys.value['multitenant'] = true
  }
  if (route.path.startsWith('/bypass') || route.path.startsWith('/yaml') || route.path.startsWith('/chattigo') || route.path.startsWith('/ai-models') || route.path.startsWith('/agent-catalog') || route.path.startsWith('/domains') || route.path.startsWith('/graph-topology') || route.path.startsWith('/workflow-editor')) {
    expandedKeys.value['config'] = true
  }
  if (route.path.startsWith('/pharmacy-testing') || route.path.startsWith('/medical-testing') || route.path.startsWith('/turnos-medicos-testing') || route.path.startsWith('/whisper-testing') || route.path.startsWith('/chat-visualizer') || route.path.startsWith('/enav-testing')) {
    expandedKeys.value['testing'] = true
  }
}
initExpandedState()

// Menu items with modern structure
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    // Knowledge & RAG Section
    {
      key: 'knowledge',
      label: 'Knowledge & RAG',
      icon: 'pi pi-database',
      items: [
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
          icon: 'pi pi-th-large',
          route: '/embeddings'
        },
        {
          label: 'RAG Dashboard',
          icon: 'pi pi-chart-line',
          route: '/rag-dashboard'
        }
      ]
    },
    // Agents Section
    {
      key: 'agents',
      label: 'Agentes',
      icon: 'pi pi-microchip-ai',
      items: [
        {
          label: 'Agent Config',
          icon: 'pi pi-sliders-h',
          route: '/agent-config'
        },
        {
          label: 'Excelencia',
          icon: 'pi pi-star',
          route: '/excelencia'
        }
      ]
    },
    // Multi-Tenant Section
    {
      key: 'multitenant',
      label: 'Multi-Tenant',
      icon: 'pi pi-sitemap',
      items: [
        {
          label: 'Organizations',
          icon: 'pi pi-building',
          route: '/organizations'
        },
        {
          label: 'Users',
          icon: 'pi pi-users',
          route: currentOrganization.value ? `/organizations/${currentOrganization.value.id}/users` : '',
          disabled: !currentOrganization.value
        },
        {
          label: 'Tenant Config',
          icon: 'pi pi-cog',
          route: '/tenant-config',
          disabled: !currentOrganization.value
        },
        {
          label: 'Instituciones',
          icon: 'pi pi-building-columns',
          route: '/institution-configs',
          disabled: !currentOrganization.value
        },
        {
          label: 'Farmacias',
          icon: 'pi pi-shop',
          route: '/pharmacy',
          disabled: !currentOrganization.value
        }
      ]
    },
    // Configuration Section
    {
      key: 'config',
      label: 'Configuración',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Reglas de Bypass',
          icon: 'pi pi-directions',
          route: '/bypass-rules'
        },
        {
          label: 'Gestión YAML',
          icon: 'pi pi-code',
          route: '/yaml-management'
        },
        {
          label: 'Chattigo',
          icon: 'pi pi-whatsapp',
          route: '/chattigo-credentials'
        },
        ...(isAdminOrOwner.value ? [
          {
            label: 'Modelos AI',
            icon: 'pi pi-microchip-ai',
            route: '/ai-models'
          },
          {
            label: 'Catálogo Agentes',
            icon: 'pi pi-box',
            route: '/agent-catalog'
          },
          {
            label: 'Dominios',
            icon: 'pi pi-globe',
            route: '/domains'
          },
          {
            label: 'LangGraph Topología',
            icon: 'pi pi-share-alt',
            route: '/graph-topology'
          },
          {
            label: 'Editor Workflows',
            icon: 'pi pi-sitemap',
            route: '/workflow-editor'
          }
        ] : [])
      ]
    },
    // Testing Section
    {
      key: 'testing',
      label: 'Pruebas',
      icon: 'pi pi-flask',
      items: [
        {
          label: 'Pharmacy Testing',
          icon: 'pi pi-heart',
          route: '/pharmacy-testing'
        },
        {
          label: 'Medical Testing',
          icon: 'pi pi-calendar-plus',
          route: '/medical-testing'
        },
        {
          label: 'Turnos Medicos',
          icon: 'pi pi-calendar-clock',
          route: '/turnos-medicos-testing'
        },
        {
          label: 'Whisper Testing',
          icon: 'pi pi-microphone',
          route: '/whisper-testing'
        },
        {
          label: 'Chat Visualizer',
          icon: 'pi pi-comments',
          route: '/chat-visualizer'
        },
        {
          label: 'ENAV Testing',
          icon: 'pi pi-file-pdf',
          route: '/enav-testing'
        }
      ]
    }
  ]

  return items
})

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
    label: 'Cerrar Sesión',
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

function isGroupActive(item: MenuItem): boolean {
  if (!item.items) return false
  return item.items.some((subItem: MenuItem) => subItem.route && route.path === subItem.route)
}

function handleOrgChange(orgId: string) {
  switchOrganization(orgId)
}

function navigateTo(path: string) {
  if (path) {
    router.push(path)
  }
}

// Get collapsed tooltip for section
function getCollapsedTooltip(item: MenuItem): string {
  return typeof item.label === 'string' ? item.label : ''
}

function getCollapsedRoute(item: MenuItem): string {
  const firstItem = item.items?.[0]
  return typeof firstItem?.route === 'string' ? firstItem.route : '/'
}
</script>

<template>
  <div class="flex h-screen bg-surface-50 dark:bg-surface-950">
    <!-- Skip Link for Accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-contrast focus:px-4 focus:py-2 focus:rounded-lg"
    >
      Saltar al contenido principal
    </a>

    <!-- Modern Sidebar -->
    <aside
      :class="[
        'bg-surface-0 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700',
        'transition-all duration-300 ease-in-out flex flex-col shadow-sm',
        sidebarCollapsed ? 'w-[4.5rem]' : 'w-72'
      ]"
      role="navigation"
      aria-label="Menú principal"
    >
      <!-- Logo Header -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800">
        <RouterLink to="/" class="flex items-center gap-3 overflow-hidden group">
          <div class="flex-shrink-0 w-9 h-9 flex items-center justify-center">
            <img
              src="@/assets/aynux.svg"
              alt="Aynux"
              class="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-110"
            />
          </div>
          <Transition name="fade-slide">
            <span
              v-if="!sidebarCollapsed"
              class="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent whitespace-nowrap"
            >
              Aynux
            </span>
          </Transition>
        </RouterLink>
        <Button
          :icon="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
          text
          rounded
          size="small"
          severity="secondary"
          @click="toggleSidebar"
          :aria-label="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'"
          :aria-expanded="!sidebarCollapsed"
          class="!w-8 !h-8 flex-shrink-0"
        />
      </div>

      <!-- Organization Switcher -->
      <Transition name="fade">
        <div v-if="!sidebarCollapsed && organizations.length > 0" class="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
          <label class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 block">
            Organización
          </label>
          <Select
            v-model="currentOrganization"
            :options="organizations"
            optionLabel="name"
            placeholder="Seleccionar Org"
            class="w-full"
            @change="(e) => handleOrgChange(e.value.id)"
          />
        </div>
      </Transition>

      <!-- Collapsed org indicator -->
      <div
        v-if="sidebarCollapsed && currentOrganization"
        class="px-3 py-3 border-b border-surface-100 dark:border-surface-800 flex justify-center"
        v-tooltip.right="currentOrganization.name"
      >
        <Avatar
          :label="currentOrganization.name?.charAt(0).toUpperCase()"
          shape="circle"
          size="normal"
          class="bg-primary/10 text-primary"
        />
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin">
        <!-- Expanded Mode: PanelMenu with custom template -->
        <div v-if="!sidebarCollapsed" class="px-3 space-y-1">
          <PanelMenu
            :model="menuItems"
            v-model:expandedKeys="expandedKeys"
            :multiple="true"
            class="modern-panel-menu"
          >
            <template #item="{ item, active, hasSubmenu }">
              <!-- Parent item (section header) -->
              <div v-if="hasSubmenu" class="flex items-center gap-3 w-full">
                <span
                  :class="[
                    item.icon,
                    'text-lg transition-colors duration-200',
                    isGroupActive(item) ? 'text-primary' : 'text-surface-500 dark:text-surface-400'
                  ]"
                />
                <span
                  :class="[
                    'font-medium transition-colors duration-200 flex-1',
                    isGroupActive(item) ? 'text-primary' : 'text-surface-700 dark:text-surface-200'
                  ]"
                >
                  {{ item.label }}
                </span>
                <i
                  :class="[
                    'pi text-xs transition-transform duration-200',
                    active ? 'pi-chevron-down' : 'pi-chevron-right'
                  ]"
                />
              </div>

              <!-- Child item (navigation link) -->
              <router-link
                v-else-if="item.route && !item.disabled"
                :to="item.route"
                custom
                v-slot="{ href, navigate }"
              >
                <a
                  v-ripple
                  :href="href"
                  @click="navigate"
                  :class="[
                    'flex items-center gap-3 w-full py-2.5 px-3 rounded-lg transition-all duration-200 menu-item-hover',
                    isActive(item.route)
                      ? 'menu-item-active'
                      : 'text-surface-600 dark:text-surface-300'
                  ]"
                >
                  <span
                    :class="[
                      item.icon,
                      'text-base transition-colors duration-200',
                      isActive(item.route) ? 'text-primary-600' : ''
                    ]"
                  />
                  <span class="flex-1">{{ item.label }}</span>
                  <Badge
                    v-if="item.badge"
                    :value="item.badge"
                    severity="primary"
                    class="ml-auto"
                  />
                </a>
              </router-link>

              <!-- Disabled item -->
              <div
                v-else-if="item.disabled"
                class="flex items-center gap-3 w-full py-2.5 px-3 rounded-lg opacity-50 cursor-not-allowed"
              >
                <span :class="[item.icon, 'text-base text-surface-400']" />
                <span class="flex-1 text-surface-400">{{ item.label }}</span>
              </div>
            </template>
          </PanelMenu>

          <!-- Statistics (standalone item) -->
          <div class="mt-2 pt-2 border-t border-surface-100 dark:border-surface-800">
            <RouterLink
              to="/statistics"
              v-slot="{ href, navigate }"
              custom
            >
              <a
                v-ripple
                :href="href"
                @click="navigate"
                :class="[
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 menu-item-hover',
                  isActive('/statistics')
                    ? 'menu-item-active'
                    : 'text-surface-600 dark:text-surface-300'
                ]"
              >
                <i
                  :class="[
                    'pi pi-chart-bar text-lg',
                    isActive('/statistics') ? 'text-primary-600' : ''
                  ]"
                />
                <span>Statistics</span>
              </a>
            </RouterLink>
          </div>
        </div>

        <!-- Collapsed Mode: Icon only navigation -->
        <div v-else class="px-2 space-y-1">
          <template v-for="item in menuItems" :key="item.key">
            <RouterLink
              :to="getCollapsedRoute(item)"
              v-slot="{ href, navigate }"
              custom
            >
              <a
                v-ripple
                :href="href"
                @click="navigate"
                v-tooltip.right="getCollapsedTooltip(item)"
                :class="[
                  'flex items-center justify-center w-full h-11 rounded-lg transition-all duration-200 menu-icon-hover',
                  isGroupActive(item)
                    ? 'menu-item-active'
                    : 'text-surface-500 dark:text-surface-400'
                ]"
              >
                <i :class="[item.icon, 'text-xl']" />
              </a>
            </RouterLink>
          </template>

          <!-- Divider -->
          <div class="!my-2 mx-2 border-t border-surface-100 dark:border-surface-800"></div>

          <!-- Statistics collapsed -->
          <RouterLink
            to="/statistics"
            v-slot="{ href, navigate }"
            custom
          >
            <a
              v-ripple
              :href="href"
              @click="navigate"
              v-tooltip.right="'Statistics'"
              :class="[
                'flex items-center justify-center w-full h-11 rounded-lg transition-all duration-200 menu-icon-hover',
                isActive('/statistics')
                  ? 'menu-item-active'
                  : 'text-surface-500 dark:text-surface-400'
              ]"
            >
              <i class="pi pi-chart-bar text-xl" />
            </a>
          </RouterLink>
        </div>
      </nav>

      <!-- User Section -->
      <div class="border-t border-surface-100 dark:border-surface-800 p-3">
        <div
          v-ripple
          :class="[
            'flex items-center cursor-pointer rounded-lg p-2 transition-all duration-200',
            'hover:bg-surface-100 dark:hover:bg-surface-800',
            sidebarCollapsed ? 'justify-center' : 'gap-3'
          ]"
          @click="toggleUserMenu"
        >
          <Avatar
            :label="username.charAt(0).toUpperCase()"
            shape="circle"
            class="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
          />
          <Transition name="fade-slide">
            <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                {{ username }}
              </p>
              <p class="text-xs text-surface-500 dark:text-surface-400 truncate">
                {{ currentOrganization?.name || 'Sin organización' }}
              </p>
            </div>
          </Transition>
          <i
            v-if="!sidebarCollapsed"
            class="pi pi-chevron-up text-xs text-surface-400"
          />
        </div>
        <Menu ref="userMenuRef" :model="userMenuItems" :popup="true" />
      </div>
    </aside>

    <!-- Main Content Area -->
    <main id="main-content" class="flex-1 flex flex-col overflow-hidden" role="main" aria-label="Contenido principal">
      <!-- Header -->
      <header
        class="h-16 bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 flex-shrink-0"
        role="banner"
      >
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {{ route.meta.title || 'Dashboard' }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-surface-500 dark:text-surface-400 hidden sm:inline">
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
      <div class="flex-1 overflow-auto p-6 bg-surface-50 dark:bg-surface-950">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Aynux Menu Item Styles */
.menu-item-hover:hover {
  background: linear-gradient(135deg, rgba(237, 233, 254, 0.8) 0%, rgba(236, 254, 255, 0.8) 100%);
  color: #7c3aed;
}

.menu-item-hover:hover span[class^="pi"],
.menu-item-hover:hover i[class^="pi"] {
  color: #7c3aed;
}

.dark .menu-item-hover:hover {
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
  color: #a78bfa;
}

.dark .menu-item-hover:hover span[class^="pi"],
.dark .menu-item-hover:hover i[class^="pi"] {
  color: #a78bfa;
}

.menu-item-active {
  background: linear-gradient(135deg, rgba(237, 233, 254, 0.9) 0%, rgba(236, 254, 255, 0.9) 100%);
  color: #7c3aed;
  font-weight: 500;
  border-left: 3px solid #7c3aed;
  margin-left: -3px;
  padding-left: calc(0.75rem + 3px) !important;
}

.dark .menu-item-active {
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
  color: #a78bfa;
  border-left-color: #a78bfa;
}

.menu-icon-hover:hover {
  background: linear-gradient(135deg, rgba(237, 233, 254, 0.8) 0%, rgba(236, 254, 255, 0.8) 100%);
  color: #7c3aed;
}

.dark .menu-icon-hover:hover {
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
  color: #a78bfa;
}

/* Modern PanelMenu Styles */
.modern-panel-menu :deep(.p-panelmenu-panel) {
  border: none;
  margin-bottom: 0.25rem;
}

.modern-panel-menu :deep(.p-panelmenu-header) {
  border: none;
  border-radius: 0.5rem;
  overflow: hidden;
}

.modern-panel-menu :deep(.p-panelmenu-header-content) {
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  transition: all 0.2s ease;
}

.modern-panel-menu :deep(.p-panelmenu-header-content:hover) {
  background: linear-gradient(135deg, rgba(237, 233, 254, 0.6) 0%, rgba(236, 254, 255, 0.6) 100%);
}

.dark .modern-panel-menu :deep(.p-panelmenu-header-content:hover) {
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
}

.modern-panel-menu :deep(.p-panelmenu-header-content .p-panelmenu-header-link) {
  padding: 0;
  gap: 0;
}

.modern-panel-menu :deep(.p-panelmenu-content) {
  background: transparent;
  border: none;
  padding: 0.25rem 0 0.25rem 1.25rem;
}

.modern-panel-menu :deep(.p-panelmenu-item) {
  margin: 0.125rem 0;
}

.modern-panel-menu :deep(.p-panelmenu-item-content) {
  background: transparent;
  border: none;
  padding: 0;
  transition: none;
}

.modern-panel-menu :deep(.p-panelmenu-item-link) {
  padding: 0;
}

.modern-panel-menu :deep(.p-icon) {
  display: none;
}

/* Scrollbar Styling */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--p-surface-300) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: var(--p-surface-300);
  border-radius: 3px;
}

.dark .scrollbar-thin {
  scrollbar-color: var(--p-surface-600) transparent;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: var(--p-surface-600);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
