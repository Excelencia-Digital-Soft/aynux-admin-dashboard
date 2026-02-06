<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInstitutionConversation } from '@/composables/useInstitutionConversation'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'
import type { InstitutionCustomer, InstitutionMessage } from '@/types/institutionConversation.types'
import InstitutionCustomerList from '@/components/institution/InstitutionCustomerList.vue'
import InstitutionMessageTimeline from '@/components/institution/InstitutionMessageTimeline.vue'
import InstitutionConversationThread from '@/components/institution/InstitutionConversationThread.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()

const {
  stats,
  isLoading: conversationLoading,
  fetchStats
} = useInstitutionConversation()

const orgId = computed(() => route.params.orgId as string)
const configId = computed(() => route.params.configId as string)
const activeTab = ref('0')

const institutionConfig = ref<TenantInstitutionConfig | null>(null)
const loadingConfig = ref(false)

const showConversationDialog = ref(false)
const selectedConversationId = ref<string>('')

function handleSelectCustomer(customer: InstitutionCustomer) {
  selectedConversationId.value = customer.conversation_id
  showConversationDialog.value = true
}

function handleSelectMessage(message: InstitutionMessage) {
  selectedConversationId.value = message.conversation_id
  showConversationDialog.value = true
}

function handleBack() {
  router.push('/institution-configs')
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    medical: 'Medico',
    pharmacy: 'Farmacia',
    laboratory: 'Laboratorio',
    generic: 'Generico'
  }
  return labels[type] || type
}

onMounted(async () => {
  if (orgId.value && configId.value) {
    loadingConfig.value = true
    try {
      institutionConfig.value = await tenantInstitutionConfigApi.getById(orgId.value, configId.value)
    } catch {
      // Config not found
    } finally {
      loadingConfig.value = false
    }
    await fetchStats(orgId.value, configId.value)
  }
})
</script>

<template>
  <div class="institution-detail-page">
    <!-- Loading -->
    <div v-if="loadingConfig && !institutionConfig" class="space-y-4">
      <Skeleton height="100px" />
      <Skeleton height="400px" />
    </div>

    <!-- Content -->
    <template v-else-if="institutionConfig">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            rounded
            @click="handleBack"
          />
          <div>
            <h1 class="text-2xl font-bold text-gray-800">
              {{ institutionConfig.institution_name }}
            </h1>
            <p class="text-gray-500 mt-1">
              Historial de conversaciones y mensajes
            </p>
          </div>
        </div>
      </div>

      <!-- Institution Info Card -->
      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Basic Info -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Informacion</h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-building text-gray-400" />
                  <span>{{ getTypeLabel(institutionConfig.institution_type) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-key text-gray-400" />
                  <code class="text-sm bg-gray-100 px-2 py-0.5 rounded">
                    {{ institutionConfig.institution_key }}
                  </code>
                </div>
                <div v-if="institutionConfig.settings?.whatsapp?.phone_number_id" class="flex items-center gap-2">
                  <i class="pi pi-whatsapp text-green-500" />
                  <span class="text-sm">{{ institutionConfig.settings.whatsapp.phone_number_id }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Tag
                    :severity="institutionConfig.enabled ? 'success' : 'secondary'"
                    :value="institutionConfig.enabled ? 'Habilitado' : 'Deshabilitado'"
                  />
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div v-if="stats">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Estadisticas</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ stats.total_customers }}
                  </div>
                  <div class="text-xs text-gray-500">Clientes</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">
                    {{ stats.total_messages }}
                  </div>
                  <div class="text-xs text-gray-500">Mensajes</div>
                </div>
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                  <div class="text-2xl font-bold text-purple-600">
                    {{ stats.messages_today }}
                  </div>
                  <div class="text-xs text-gray-500">Hoy</div>
                </div>
                <div class="text-center p-3 bg-orange-50 rounded-lg">
                  <div class="text-2xl font-bold text-orange-600">
                    {{ stats.active_conversations_24h }}
                  </div>
                  <div class="text-xs text-gray-500">Activos 24h</div>
                </div>
              </div>
            </div>

            <!-- Activity -->
            <div v-if="stats">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Actividad</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Mensajes esta semana</span>
                  <span class="font-semibold">{{ stats.messages_this_week }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Promedio por conversacion</span>
                  <span class="font-semibold">{{ stats.avg_messages_per_conversation }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Total conversaciones</span>
                  <span class="font-semibold">{{ stats.total_conversations }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Tabs -->
      <Card>
        <template #content>
          <Tabs v-model:value="activeTab">
            <TabList>
              <Tab value="0">
                <div class="flex items-center gap-2">
                  <i class="pi pi-users" />
                  <span>Clientes</span>
                </div>
              </Tab>
              <Tab value="1">
                <div class="flex items-center gap-2">
                  <i class="pi pi-clock" />
                  <span>Timeline</span>
                </div>
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="0">
                <InstitutionCustomerList
                  :org-id="orgId"
                  :config-id="configId"
                  @select-customer="handleSelectCustomer"
                />
              </TabPanel>
              <TabPanel value="1">
                <InstitutionMessageTimeline
                  :org-id="orgId"
                  :config-id="configId"
                  @select-message="handleSelectMessage"
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </Card>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-circle text-6xl text-gray-300 mb-4" />
      <h2 class="text-xl font-semibold text-gray-600">Institucion no encontrada</h2>
      <p class="text-gray-500 mt-2">La institucion solicitada no existe o no tienes acceso</p>
      <Button
        label="Volver a Instituciones"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="handleBack"
      />
    </div>

    <!-- Conversation Dialog -->
    <InstitutionConversationThread
      v-model:visible="showConversationDialog"
      :org-id="orgId"
      :config-id="configId"
      :conversation-id="selectedConversationId"
    />
  </div>
</template>

<style scoped>
.institution-detail-page :deep(.p-card-content) {
  padding: 1rem;
}

.institution-detail-page :deep(.p-tabpanels) {
  padding: 1rem 0 0 0;
}
</style>
