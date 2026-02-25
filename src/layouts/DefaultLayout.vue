<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useDarkMode } from '@/composables/useDarkMode'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const { currentUser, currentOrganization, organizations, logout, switchOrganization, username, isAdminOrOwner } = useAuth()
const { isDark, toggleDarkMode } = useDarkMode()

const sidebarCollapsed = ref(false)

interface MenuItem {
  key: string
  label: string
  icon: string
  items?: { label: string; icon: string; route: string; disabled?: boolean }[]
}

const menuItems = computed<MenuItem[]>(() => [
  {
    key: 'knowledge',
    label: 'Knowledge & RAG',
    icon: 'pi pi-database',
    items: [
      { label: 'Knowledge Base', icon: 'pi pi-book', route: '/knowledge-base' },
      { label: 'Upload Documents', icon: 'pi pi-upload', route: '/upload-documents' },
      { label: 'Embeddings', icon: 'pi pi-th-large', route: '/embeddings' },
      { label: 'RAG Dashboard', icon: 'pi pi-chart-line', route: '/rag-dashboard' },
      { label: 'Excelencia', icon: 'pi pi-star', route: '/excelencia' },
    ],
  },
  {
    key: 'multitenant',
    label: 'Multi-Tenant',
    icon: 'pi pi-sitemap',
    items: [
      { label: 'Organizations', icon: 'pi pi-building', route: '/organizations' },
      {
        label: 'Users',
        icon: 'pi pi-users',
        route: currentOrganization.value ? `/organizations/${currentOrganization.value.id}/users` : '',
        disabled: !currentOrganization.value,
      },
      { label: 'Tenant Config', icon: 'pi pi-cog', route: '/tenant-config', disabled: !currentOrganization.value },
      { label: 'Instituciones', icon: 'pi pi-building-columns', route: '/institution-configs', disabled: !currentOrganization.value },
      { label: 'Farmacias', icon: 'pi pi-shop', route: '/pharmacy', disabled: !currentOrganization.value },
    ],
  },
  {
    key: 'config',
    label: 'Configuracion',
    icon: 'pi pi-cog',
    items: [
      { label: 'Reglas de Bypass', icon: 'pi pi-directions', route: '/bypass-rules' },
      { label: 'Gestion YAML', icon: 'pi pi-code', route: '/yaml-management' },
      { label: 'Chattigo', icon: 'pi pi-whatsapp', route: '/chattigo-credentials' },
      ...(isAdminOrOwner.value
        ? [
            { label: 'Modelos AI', icon: 'pi pi-microchip-ai', route: '/ai-models' },
            { label: 'Catalogo Agentes', icon: 'pi pi-box', route: '/agent-catalog' },
            { label: 'Dominios', icon: 'pi pi-globe', route: '/domains' },
            { label: 'LangGraph Topologia', icon: 'pi pi-share-alt', route: '/graph-topology' },
            { label: 'Editor Workflows', icon: 'pi pi-sitemap', route: '/workflow-editor' },
          ]
        : []),
    ],
  },
  {
    key: 'testing',
    label: 'Pruebas',
    icon: 'pi pi-flask',
    items: [
      { label: 'Pharmacy Testing', icon: 'pi pi-heart', route: '/pharmacy-testing' },
      { label: 'Turnos Medicos', icon: 'pi pi-calendar-clock', route: '/turnos-medicos-testing' },
      { label: 'Whisper Testing', icon: 'pi pi-microphone', route: '/whisper-testing' },
      { label: 'Chat Visualizer', icon: 'pi pi-comments', route: '/chat-visualizer' },
      { label: 'ENAV Testing', icon: 'pi pi-file-pdf', route: '/enav-testing' },
    ],
  },
])

const expandedSections = ref<Record<string, boolean>>({})

function initExpandedState() {
  if (route.path.startsWith('/knowledge-base') || route.path.startsWith('/upload-documents') || route.path.startsWith('/embeddings') || route.path.startsWith('/rag-dashboard') || route.path.startsWith('/excelencia')) {
    expandedSections.value['knowledge'] = true
  }
  if (route.path.startsWith('/organizations') || route.path.startsWith('/tenant') || route.path.startsWith('/institution') || route.path.startsWith('/pharmacy')) {
    expandedSections.value['multitenant'] = true
  }
  if (route.path.startsWith('/bypass') || route.path.startsWith('/yaml') || route.path.startsWith('/chattigo') || route.path.startsWith('/ai-models') || route.path.startsWith('/agent-catalog') || route.path.startsWith('/domains') || route.path.startsWith('/graph-topology') || route.path.startsWith('/workflow-editor')) {
    expandedSections.value['config'] = true
  }
  if (route.path.startsWith('/pharmacy-testing') || route.path.startsWith('/turnos-medicos-testing') || route.path.startsWith('/whisper-testing') || route.path.startsWith('/chat-visualizer') || route.path.startsWith('/enav-testing')) {
    expandedSections.value['testing'] = true
  }
}
initExpandedState()

watch(() => route.path, initExpandedState)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function isActive(path: string): boolean {
  return route.path === path
}

function isGroupActive(item: MenuItem): boolean {
  if (!item.items) return false
  return item.items.some((subItem) => subItem.route && route.path === subItem.route)
}

function handleOrgChange(orgId: string) {
  switchOrganization(orgId)
}

function navigateTo(path: string) {
  if (path) {
    router.push(path)
  }
}

function getFirstRoute(item: MenuItem): string {
  const firstItem = item.items?.find((i) => i.route && !i.disabled)
  return firstItem?.route || '/'
}

</script>

<template>
  <TooltipProvider>
    <div class="flex h-screen bg-surface-50 dark:bg-surface-950">
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-contrast focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Saltar al contenido principal
      </a>

      <aside
        :class="[
          'glass-sidebar flex flex-col shadow-lg',
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[4.5rem]' : 'w-72',
        ]"
        role="navigation"
        aria-label="Menu principal"
      >
        <div class="h-16 flex items-center justify-between px-4 border-b border-white/10 dark:border-white/5">
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
            variant="ghost"
            size="icon"
            @click="toggleSidebar"
            :aria-label="sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'"
            :aria-expanded="!sidebarCollapsed"
            class="h-8 w-8 flex-shrink-0"
          >
            <i :class="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
          </Button>
        </div>

        <Transition name="fade">
          <div v-if="!sidebarCollapsed && organizations.length > 0" class="px-4 py-3 border-b border-white/10 dark:border-white/5">
            <label class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 block">
              Organizacion
            </label>
            <Select :model-value="currentOrganization?.id" @update:model-value="handleOrgChange">
              <SelectTrigger class="w-full glass-input">
                <SelectValue placeholder="Seleccionar Org" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="org in organizations" :key="org.id" :value="org.id">
                  {{ org.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Transition>

        <div
          v-if="sidebarCollapsed && currentOrganization"
          class="px-3 py-3 border-b border-white/10 dark:border-white/5 flex justify-center"
        >
          <Tooltip>
            <TooltipTrigger as-child>
              <Avatar class="bg-primary/20 text-primary">
                <AvatarFallback>{{ currentOrganization.name?.charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">
              {{ currentOrganization.name }}
            </TooltipContent>
          </Tooltip>
        </div>

        <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin">
          <div v-if="!sidebarCollapsed" class="px-3 space-y-1">
            <Collapsible
              v-for="item in menuItems"
              :key="item.key"
              v-model:open="expandedSections[item.key]"
              class="group/collapsible"
            >
              <CollapsibleTrigger
                as-child
              >
                <button
                  :class="[
                    'flex items-center gap-3 w-full py-2.5 px-3 rounded-lg transition-all duration-200',
                    'hover:bg-white/20 dark:hover:bg-white/5',
                    isGroupActive(item) ? 'bg-white/25 dark:bg-white/10 text-primary-600 dark:text-primary-400' : 'text-surface-700 dark:text-surface-200',
                  ]"
                >
                  <span
                    :class="[
                      item.icon,
                      'text-lg transition-colors duration-200',
                      isGroupActive(item) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400',
                    ]"
                  />
                  <span class="font-medium flex-1 text-left">
                    {{ item.label }}
                  </span>
                  <i
                    :class="[
                      'pi text-xs transition-transform duration-200',
                      expandedSections[item.key] ? 'pi-chevron-down' : 'pi-chevron-right',
                    ]"
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent class="pl-4 pr-0 pt-1 space-y-0.5">
                <RouterLink
                  v-for="subItem in item.items"
                  :key="subItem.route"
                  :to="subItem.disabled ? '#' : subItem.route"
                  custom
                  v-slot="{ href, navigate }"
                >
                  <a
                    v-if="!subItem.disabled"
                    :href="href"
                    @click="navigate"
                    :class="[
                      'flex items-center gap-3 w-full py-2 px-3 rounded-lg transition-all duration-200',
                      isActive(subItem.route)
                        ? 'bg-primary/20 dark:bg-primary/30 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-surface-600 dark:text-surface-300 hover:bg-white/15 dark:hover:bg-white/5',
                    ]"
                  >
                    <span :class="[subItem.icon, 'text-base', isActive(subItem.route) ? 'text-primary-600' : '']" />
                    <span class="flex-1">{{ subItem.label }}</span>
                  </a>
                  <span
                    v-else
                    :class="[
                      'flex items-center gap-3 w-full py-2 px-3 rounded-lg',
                      'opacity-50 cursor-not-allowed pointer-events-none',
                    ]"
                  >
                    <span :class="[subItem.icon, 'text-base text-surface-400']" />
                    <span class="flex-1 text-surface-400">{{ subItem.label }}</span>
                  </span>
                </RouterLink>
              </CollapsibleContent>
            </Collapsible>

            <Separator class="my-3 bg-white/10 dark:bg-white/5" />

            <RouterLink to="/statistics" v-slot="{ href, navigate }" custom>
              <a
                :href="href"
                @click="navigate"
                :class="[
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200',
                  isActive('/statistics')
                    ? 'bg-primary/20 dark:bg-primary/30 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-surface-600 dark:text-surface-300 hover:bg-white/15 dark:hover:bg-white/5',
                ]"
              >
                <i :class="['pi pi-chart-bar text-lg', isActive('/statistics') ? 'text-primary-600' : '']" />
                <span>Statistics</span>
              </a>
            </RouterLink>
          </div>

          <div v-else class="px-2 space-y-1">
            <Tooltip v-for="item in menuItems" :key="item.key">
              <TooltipTrigger as-child>
                <RouterLink :to="getFirstRoute(item)" v-slot="{ href, navigate }" custom>
                  <a
                    :href="href"
                    @click="navigate"
                    :class="[
                      'flex items-center justify-center w-full h-11 rounded-lg transition-all duration-200',
                      isGroupActive(item)
                        ? 'bg-primary/20 dark:bg-primary/30 text-primary-600 dark:text-primary-400'
                        : 'text-surface-500 dark:text-surface-400 hover:bg-white/15 dark:hover:bg-white/5',
                    ]"
                  >
                    <i :class="[item.icon, 'text-xl']" />
                  </a>
                </RouterLink>
              </TooltipTrigger>
              <TooltipContent side="right">
                {{ item.label }}
              </TooltipContent>
            </Tooltip>

            <Separator class="my-2 bg-white/10 dark:bg-white/5" />

            <Tooltip>
              <TooltipTrigger as-child>
                <RouterLink to="/statistics" v-slot="{ href, navigate }" custom>
                  <a
                    :href="href"
                    @click="navigate"
                    :class="[
                      'flex items-center justify-center w-full h-11 rounded-lg transition-all duration-200',
                      isActive('/statistics')
                        ? 'bg-primary/20 dark:bg-primary/30 text-primary-600 dark:text-primary-400'
                        : 'text-surface-500 dark:text-surface-400 hover:bg-white/15 dark:hover:bg-white/5',
                    ]"
                  >
                    <i class="pi pi-chart-bar text-xl" />
                  </a>
                </RouterLink>
              </TooltipTrigger>
              <TooltipContent side="right">
                Statistics
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>

        <div class="border-t border-white/10 dark:border-white/5 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                :class="[
                  'flex items-center cursor-pointer rounded-lg p-2 transition-all duration-200 w-full',
                  'hover:bg-white/15 dark:hover:bg-white/5',
                  sidebarCollapsed ? 'justify-center' : 'gap-3',
                ]"
              >
                <Avatar class="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0">
                  <AvatarFallback>{{ username.charAt(0).toUpperCase() }}</AvatarFallback>
                </Avatar>
                <Transition name="fade-slide">
                  <div v-if="!sidebarCollapsed" class="flex-1 min-w-0 text-left">
                    <p class="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                      {{ username }}
                    </p>
                    <p class="text-xs text-surface-500 dark:text-surface-400 truncate">
                      {{ currentOrganization?.name || 'Sin organizacion' }}
                    </p>
                  </div>
                </Transition>
                <i v-if="!sidebarCollapsed" class="pi pi-chevron-up text-xs text-surface-400 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :side="sidebarCollapsed ? 'right' : 'bottom'" class="glass-dropdown">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="() => {}">
                <i class="pi pi-user mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="logout" class="text-destructive">
                <i class="pi pi-sign-out mr-2" />
                Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main id="main-content" class="flex-1 flex flex-col overflow-hidden" role="main" aria-label="Contenido principal">
        <header
          class="glass-header h-16 flex items-center justify-between px-6 flex-shrink-0"
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
              variant="ghost"
              size="icon"
              @click="toggleDarkMode"
              aria-label="Cambiar modo de color"
            >
              <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
            </Button>
          </div>
        </header>

        <div class="flex-1 overflow-auto p-6 bg-surface-50 dark:bg-surface-950">
          <RouterView />
        </div>
      </main>
    </div>
  </TooltipProvider>
</template>

<style scoped>
.glass-sidebar {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.dark-mode .glass-sidebar {
  background: rgba(15, 23, 42, 0.7);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-header {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.dark-mode .glass-header {
  background: rgba(15, 23, 42, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-input {
  background: rgba(255, 255, 255, 0.5) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.dark-mode .glass-input {
  background: rgba(0, 0, 0, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.glass-dropdown {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.dark-mode .glass-dropdown {
  background: rgba(15, 23, 42, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.dark-mode .scrollbar-thin {
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.dark-mode .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
}

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
