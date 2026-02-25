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

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const router = useRouter()

const {
  stats,
  isLoading: conversationLoading,
  fetchStats
} = useInstitutionConversation()

const orgId = computed(() => route.params.orgId as string)
const configId = computed(() => route.params.configId as string)
const activeTab = ref('customers')

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
    generic: 'Genérico',
    medical: 'Clínica',
    hospital: 'Hospital',
    pharmacy: 'Farmacia',
    laboratory: 'Laboratorio',
    imaging: 'Imágenes',
    dental: 'Odontología',
    ophthalmology: 'Oftalmología',
    mental_health: 'Salud Mental',
    rehabilitation: 'Rehabilitación',
    veterinary: 'Veterinaria',
    insurance: 'Obra Social',
    aesthetics: 'Estética',
    traumatology: 'Traumatología'
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
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Loading -->
    <div v-if="loadingConfig && !institutionConfig" class="space-y-4">
      <div class="h-[100px] rounded-lg bg-muted animate-pulse" />
      <div class="h-[400px] rounded-lg bg-muted animate-pulse" />
    </div>

    <!-- Content -->
    <template v-else-if="institutionConfig">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="handleBack">
            <i class="pi pi-arrow-left" />
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {{ institutionConfig.institution_name }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Historial de conversaciones y mensajes
            </p>
          </div>
        </div>
      </div>

      <!-- Institution Info Card -->
      <Card class="glass-panel mb-6">
        <CardContent class="pt-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Basic Info -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Informacion</h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <i class="pi pi-building text-gray-400 dark:text-gray-500" />
                  <span>{{ getTypeLabel(institutionConfig.institution_type) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-key text-gray-400 dark:text-gray-500" />
                  <code class="text-sm bg-muted px-2 py-0.5 rounded">
                    {{ institutionConfig.institution_key }}
                  </code>
                </div>
                <div v-if="institutionConfig.settings?.whatsapp?.phone_number_id" class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <i class="pi pi-whatsapp text-green-500" />
                  <span class="text-sm">{{ institutionConfig.settings.whatsapp.phone_number_id }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge :variant="institutionConfig.enabled ? 'success' : 'secondary'">
                    {{ institutionConfig.enabled ? 'Habilitado' : 'Deshabilitado' }}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div v-if="stats">
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Estadisticas</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ stats.total_customers }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Clientes</div>
                </div>
                <div class="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ stats.total_messages }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Mensajes</div>
                </div>
                <div class="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {{ stats.messages_today }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Hoy</div>
                </div>
                <div class="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {{ stats.active_conversations_24h }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Activos 24h</div>
                </div>
              </div>
            </div>

            <!-- Activity -->
            <div v-if="stats">
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Actividad</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Mensajes esta semana</span>
                  <span class="font-semibold text-gray-800 dark:text-gray-100">{{ stats.messages_this_week }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Promedio por conversacion</span>
                  <span class="font-semibold text-gray-800 dark:text-gray-100">{{ stats.avg_messages_per_conversation }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Total conversaciones</span>
                  <span class="font-semibold text-gray-800 dark:text-gray-100">{{ stats.total_conversations }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Tabs -->
      <Card class="glass-card">
        <CardContent class="pt-6">
          <Tabs v-model="activeTab" class="w-full">
            <TabsList>
              <TabsTrigger value="customers" class="flex items-center gap-2">
                <i class="pi pi-users" />
                <span>Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" class="flex items-center gap-2">
                <i class="pi pi-clock" />
                <span>Timeline</span>
              </TabsTrigger>
            </TabsList>

            <div class="mt-4">
              <TabsContent value="customers">
                <InstitutionCustomerList
                  :org-id="orgId"
                  :config-id="configId"
                  @select-customer="handleSelectCustomer"
                />
              </TabsContent>
              <TabsContent value="timeline">
                <InstitutionMessageTimeline
                  :org-id="orgId"
                  :config-id="configId"
                  @select-message="handleSelectMessage"
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-circle text-6xl text-gray-300 dark:text-gray-600 mb-4" />
      <h2 class="text-xl font-semibold text-gray-600 dark:text-gray-300">Institucion no encontrada</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">La institucion solicitada no existe o no tienes acceso</p>
      <Button class="mt-4" @click="handleBack">
        <i class="pi pi-arrow-left mr-2" />
        Volver a Instituciones
      </Button>
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
