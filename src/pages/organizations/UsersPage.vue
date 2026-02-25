<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import UserManagement from '@/components/organizations/UserManagement.vue'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const router = useRouter()
const store = useOrganizationStore()
const { selectedOrg, orgStats, selectOrganization, isLoading } = useOrganization()

const orgId = computed(() => route.params.orgId as string)

function getStatusVariant(status: string) {
  const map: Record<string, 'success' | 'secondary' | 'destructive'> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'destructive'
  }
  return map[status] || 'secondary'
}

function goBack() {
  router.push('/organizations')
}

onMounted(async () => {
  if (orgId.value && (!selectedOrg.value || selectedOrg.value.id !== orgId.value)) {
    await selectOrganization(orgId.value)
  }
})
</script>

<template>
  <div class="users-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" @click="goBack">
            <i class="pi pi-arrow-left" />
          </Button>
          <h1 class="text-2xl font-bold text-foreground">Usuarios</h1>
        </div>
        <p v-if="selectedOrg" class="text-muted-foreground ml-10">
          {{ selectedOrg.name }}
          <Badge :variant="getStatusVariant(selectedOrg.status)" class="ml-2">
            {{ selectedOrg.status }}
          </Badge>
        </p>
      </div>
      <div v-if="orgStats" class="text-right text-sm text-muted-foreground">
        <div class="glass-panel px-4 py-2 rounded-lg">
          <div><strong class="text-foreground">{{ orgStats.active_users }}</strong> usuarios activos</div>
          <div><strong class="text-foreground">{{ orgStats.total_documents }}</strong> documentos</div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !selectedOrg" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>

    <!-- Content -->
    <Card v-else-if="selectedOrg" class="glass-card">
      <CardContent class="p-0">
        <UserManagement :organization-id="orgId" />
      </CardContent>
    </Card>

    <!-- Not found -->
    <Card v-else class="glass-card">
      <CardContent class="p-0">
        <div class="text-center py-8 text-muted-foreground">
          <i class="pi pi-exclamation-circle text-4xl mb-2" />
          <p>Organizacion no encontrada</p>
          <Button variant="outline" @click="goBack" class="mt-4">Volver</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
