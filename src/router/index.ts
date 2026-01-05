import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth routes (no sidebar)
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'Login',
          component: () => import('@/pages/auth/LoginPage.vue'),
          meta: { requiresAuth: false, title: 'Iniciar Sesion' }
        }
      ]
    },

    // Main application routes (with sidebar)
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        // Redirect root to chat-visualizer
        {
          path: '',
          redirect: '/chat-visualizer'
        },

        // Chat Visualizer (Page 1)
        {
          path: 'chat-visualizer',
          name: 'ChatVisualizer',
          component: () => import('@/pages/chat/ChatVisualizerPage.vue'),
          meta: { title: 'Chat Visualizer', icon: 'pi-comments' }
        },

        // Knowledge Base (Page 2)
        {
          path: 'knowledge-base',
          name: 'KnowledgeBase',
          component: () => import('@/pages/knowledge/KnowledgeBasePage.vue'),
          meta: { title: 'Base de Conocimiento', icon: 'pi-book' }
        },

        // Upload Documents (Page 3)
        {
          path: 'upload-documents',
          name: 'UploadDocuments',
          component: () => import('@/pages/knowledge/UploadDocumentsPage.vue'),
          meta: { title: 'Subir Documentos', icon: 'pi-upload' }
        },

        // Embeddings (Page 4)
        {
          path: 'embeddings',
          name: 'Embeddings',
          component: () => import('@/pages/knowledge/EmbeddingsPage.vue'),
          meta: { title: 'Embeddings', icon: 'pi-cog' }
        },

        // Excelencia (Page 5)
        {
          path: 'excelencia',
          name: 'Excelencia',
          component: () => import('@/pages/excelencia/ExcelenciaPage.vue'),
          meta: { title: 'Excelencia', icon: 'pi-building' }
        },

        // Agent Config (Page 6)
        {
          path: 'agent-config',
          name: 'AgentConfig',
          component: () => import('@/pages/config/AgentConfigPage.vue'),
          meta: { title: 'Configuracion de Agentes', icon: 'pi-sliders-h' }
        },

        // Statistics (Page 7)
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import('@/pages/config/StatisticsPage.vue'),
          meta: { title: 'Estadisticas', icon: 'pi-chart-bar' }
        },

        // Organizations (Page 8)
        {
          path: 'organizations',
          name: 'Organizations',
          component: () => import('@/pages/organizations/OrganizationsPage.vue'),
          meta: { title: 'Organizaciones', icon: 'pi-sitemap' }
        },

        // Users (Page 9)
        {
          path: 'organizations/:orgId/users',
          name: 'Users',
          component: () => import('@/pages/organizations/UsersPage.vue'),
          meta: { title: 'Usuarios', icon: 'pi-users', requiresOrg: true }
        },

        // Tenant Config (Page 10)
        {
          path: 'tenant-config',
          name: 'TenantConfig',
          component: () => import('@/pages/tenant/TenantConfigPage.vue'),
          meta: { title: 'Configuracion Tenant', icon: 'pi-cog', requiresOrg: true }
        },

        // Tenant Documents (Page 11)
        {
          path: 'tenant-documents',
          name: 'TenantDocuments',
          component: () => import('@/pages/tenant/TenantDocumentsPage.vue'),
          meta: { title: 'Documentos Tenant', icon: 'pi-file', requiresOrg: true }
        },

        // Pharmacy Testing (Page 12)
        {
          path: 'pharmacy-testing',
          name: 'PharmacyTesting',
          component: () => import('@/pages/testing/PharmacyTestingPage.vue'),
          meta: { title: 'Pruebas Farmacia', icon: 'pi-heart' }
        },

        // Pharmacy Config (Page 12b) - Admin CRUD
        {
          path: 'pharmacy',
          name: 'Pharmacy',
          component: () => import('@/pages/pharmacy/PharmacyPage.vue'),
          meta: { title: 'Farmacias', icon: 'pi-shop' }
        },

        // Pharmacy Detail (Page 12c) - History View
        {
          path: 'pharmacy/:id',
          name: 'PharmacyDetail',
          component: () => import('@/pages/pharmacy/PharmacyDetailPage.vue'),
          meta: { title: 'Detalle Farmacia', icon: 'pi-shop', hideFromMenu: true }
        },

        // RAG Dashboard (Page 13)
        {
          path: 'rag-dashboard',
          name: 'RagDashboard',
          component: () => import('@/pages/knowledge/RagDashboardPage.vue'),
          meta: { title: 'RAG Dashboard', icon: 'pi-chart-line' }
        },

        // YAML Management (Page 14)
        {
          path: 'yaml-management',
          name: 'YamlManagement',
          component: () => import('@/pages/yaml/YamlManagementPage.vue'),
          meta: { 
            title: 'Gestión YAML', 
            icon: 'pi-code',
            requiresAdmin: true
          }
        },

        // YAML Editor (Page 15)
        {
          path: 'yaml-management/edit/:key',
          name: 'YamlEditor',
          component: () => import('@/pages/yaml/YamlEditor.vue'),
          meta: { 
            title: 'Editar YAML', 
            requiresAdmin: true,
            hideFromMenu: true
          }
        },

        // YAML Create (Page 16)
        {
          path: 'yaml-management/new',
          name: 'YamlCreate',
          component: () => import('@/pages/yaml/YamlEditor.vue'),
          meta: { 
            title: 'Nuevo YAML', 
            requiresAdmin: true,
            hideFromMenu: true
          },
          props: { isNew: true }
        },

        // YAML Versions (Page 17)
        {
          path: 'yaml-management/versions/:key',
          name: 'YamlVersions',
          component: () => import('@/pages/yaml/YamlVersionHistory.vue'),
          meta: {
            title: 'Versiones YAML',
            requiresAdmin: true,
            hideFromMenu: true
          }
        },

        // Bypass Rules (Page 18)
        {
          path: 'bypass-rules',
          name: 'BypassRules',
          component: () => import('@/pages/bypass/BypassRulesPage.vue'),
          meta: {
            title: 'Reglas de Bypass',
            icon: 'pi-directions',
            requiresOrg: true,
            requiresAdmin: true
          }
        },

        // AI Models Admin (Page 19)
        {
          path: 'ai-models',
          name: 'AIModels',
          component: () => import('@/pages/admin/AIModelsPage.vue'),
          meta: {
            title: 'Modelos AI',
            icon: 'pi-microchip-ai',
            requiresAdmin: true
          }
        },

        // Agent Catalog (Page 21) - CRUD for core.agents table
        {
          path: 'agent-catalog',
          name: 'AgentCatalog',
          component: () => import('@/pages/admin/AgentCatalogPage.vue'),
          meta: {
            title: 'Catalogo de Agentes',
            icon: 'pi-android',
            requiresAdmin: true
          }
        },

        // Chattigo Credentials (Page 20)
        {
          path: 'chattigo-credentials',
          name: 'ChattigoCredentials',
          component: () => import('@/pages/chattigo/ChattigoCredentialsPage.vue'),
          meta: {
            title: 'Credenciales Chattigo',
            icon: 'pi-whatsapp',
            requiresAdmin: true
          }
        }
      ]
    },

    // Unauthorized page
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: () => import('@/pages/UnauthorizedPage.vue'),
      meta: { requiresAuth: false, title: 'No Autorizado' }
    },

    // Catch-all redirect to login
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check if route requires admin privileges
  if (to.meta.requiresAdmin && !authStore.isAdminOrOwner) {
    next('/unauthorized')
    return
  }

  // Check if route requires organization
  if (to.meta.requiresOrg && !authStore.currentOrgId) {
    next('/organizations')
    return
  }

  // Redirect authenticated users away from login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/chat-visualizer')
    return
  }

  next()
})

export default router
