<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEventosStore } from '@/stores/eventos.store'
import { useEventosConfig } from '@/composables/useEventosConfig'
import { useAuthStore } from '@/stores/auth.store'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import { useToast } from '@/composables/useToast'

import SchoolsTab from '@/components/eventos/SchoolsTab.vue'
import LeadsTab from '@/components/eventos/LeadsTab.vue'
import VenuesTab from '@/components/eventos/VenuesTab.vue'
import FormsTab from '@/components/eventos/FormsTab.vue'
import MenusTab from '@/components/eventos/MenusTab.vue'
import CompanyInfoTab from '@/components/eventos/CompanyInfoTab.vue'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const store = useEventosStore()
const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
const { fetchAll, seedDefaults, schoolsCount, leadsCount, venuesCount, formsCount, menusCount } = useEventosConfig()

const isLoadingHistory = ref(false)

async function handleViewHistory() {
  if (!currentOrgId.value) return
  isLoadingHistory.value = true
  try {
    const response = await tenantInstitutionConfigApi.list(currentOrgId.value, { domain_key: 'eventos' })
    if (response.items.length > 0) {
      router.push(`/eventos-config/history/${currentOrgId.value}/${response.items[0].id}`)
    } else {
      toast.error('No se encontro configuracion de institucion para eventos.')
    }
  } catch {
    toast.error('Error al buscar configuracion de institucion.')
  } finally {
    isLoadingHistory.value = false
  }
}

const hasEmptyConfig = computed(() =>
  currentOrgId.value && (schoolsCount.value === 0 || venuesCount.value === 0 || formsCount.value === 0 || menusCount.value === 0)
)

const currentOrgId = computed(() => authStore.currentOrganization?.id)

onMounted(() => {
  if (currentOrgId.value) {
    fetchAll(currentOrgId.value)
  }
})

watch(currentOrgId, (newOrgId) => {
  if (newOrgId) fetchAll(newOrgId)
})
</script>

<template>
  <div class="eventos-config-page">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Configuracion Eventos</h1>
        <p class="text-muted-foreground mt-1">
          Gestiona colegios, leads, salones, formularios y menus del bot
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          :disabled="isLoadingHistory"
          @click="handleViewHistory"
        >
          <i class="pi pi-comments mr-2" />
          Historial de Mensajes
        </Button>
        <Button
          v-if="hasEmptyConfig"
          variant="outline"
          @click="seedDefaults(currentOrgId!)"
        >
          <i class="pi pi-download mr-2" />
          Cargar datos por defecto
        </Button>
      </div>
    </div>

    <!-- No org selected warning -->
    <Alert v-if="!currentOrgId" variant="warning" class="mb-6">
      <AlertDescription>
        Selecciona una organizacion para ver la configuracion de eventos.
      </AlertDescription>
    </Alert>

    <!-- Tabs -->
    <Tabs v-if="currentOrgId" default-value="schools" class="w-full">
      <TabsList class="grid w-full grid-cols-6">
        <TabsTrigger value="schools" class="flex items-center gap-2">
          <i class="pi pi-graduation-cap text-xs" />
          <span>Colegios</span>
          <Badge v-if="schoolsCount" variant="secondary" class="ml-1 text-xs px-1.5 py-0">{{ schoolsCount }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="leads" class="flex items-center gap-2">
          <i class="pi pi-users text-xs" />
          <span>Leads</span>
          <Badge v-if="leadsCount" variant="secondary" class="ml-1 text-xs px-1.5 py-0">{{ leadsCount }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="venues" class="flex items-center gap-2">
          <i class="pi pi-building text-xs" />
          <span>Salones</span>
          <Badge v-if="venuesCount" variant="secondary" class="ml-1 text-xs px-1.5 py-0">{{ venuesCount }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="forms" class="flex items-center gap-2">
          <i class="pi pi-file-edit text-xs" />
          <span>Formularios</span>
          <Badge v-if="formsCount" variant="secondary" class="ml-1 text-xs px-1.5 py-0">{{ formsCount }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="menus" class="flex items-center gap-2">
          <i class="pi pi-list text-xs" />
          <span>Menu Bot</span>
          <Badge v-if="menusCount" variant="secondary" class="ml-1 text-xs px-1.5 py-0">{{ menusCount }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="company" class="flex items-center gap-2">
          <i class="pi pi-briefcase text-xs" />
          <span>Empresa</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schools" class="mt-4">
        <SchoolsTab :organization-id="currentOrgId!" />
      </TabsContent>
      <TabsContent value="leads" class="mt-4">
        <LeadsTab :organization-id="currentOrgId!" />
      </TabsContent>
      <TabsContent value="venues" class="mt-4">
        <VenuesTab :organization-id="currentOrgId!" />
      </TabsContent>
      <TabsContent value="forms" class="mt-4">
        <FormsTab :organization-id="currentOrgId!" />
      </TabsContent>
      <TabsContent value="menus" class="mt-4">
        <MenusTab :organization-id="currentOrgId!" />
      </TabsContent>
      <TabsContent value="company" class="mt-4">
        <CompanyInfoTab :organization-id="currentOrgId!" />
      </TabsContent>
    </Tabs>

    <!-- Loading overlay -->
    <div v-if="store.isLoading" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50 pointer-events-none">
      <div class="bg-background border rounded-lg p-4 shadow-lg pointer-events-auto">
        <i class="pi pi-spin pi-spinner text-xl mr-2" />
        <span class="text-sm">Cargando...</span>
      </div>
    </div>
  </div>
</template>
