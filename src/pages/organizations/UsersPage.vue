<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import UserManagement from '@/components/organizations/UserManagement.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const store = useOrganizationStore()
const { selectedOrg, orgStats, selectOrganization, isLoading } = useOrganization()

const orgId = computed(() => route.params.orgId as string)

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
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            rounded
            @click="goBack"
          />
          <h1 class="text-2xl font-bold text-gray-800">Usuarios</h1>
        </div>
        <p v-if="selectedOrg" class="text-gray-500 ml-10">
          {{ selectedOrg.name }}
          <Tag :severity="selectedOrg.status === 'active' ? 'success' : 'secondary'" :value="selectedOrg.status" class="ml-2" />
        </p>
      </div>
      <div v-if="orgStats" class="text-right text-sm text-gray-500">
        <div><strong>{{ orgStats.active_users }}</strong> usuarios activos</div>
        <div><strong>{{ orgStats.total_documents }}</strong> documentos</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !selectedOrg" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <Card v-else-if="selectedOrg">
      <template #content>
        <UserManagement :organization-id="orgId" />
      </template>
    </Card>

    <!-- Not found -->
    <Card v-else>
      <template #content>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-exclamation-circle text-4xl mb-2" />
          <p>Organizacion no encontrada</p>
          <Button label="Volver" severity="secondary" @click="goBack" class="mt-4" />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.users-page :deep(.p-card-content) {
  padding: 0;
}
</style>
