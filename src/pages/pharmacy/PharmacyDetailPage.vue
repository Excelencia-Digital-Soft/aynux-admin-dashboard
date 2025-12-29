<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePharmacyStore } from '@/stores/pharmacy.store'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import PharmacyCustomerList from '@/components/pharmacy/PharmacyCustomerList.vue'
import PharmacyMessageTimeline from '@/components/pharmacy/PharmacyMessageTimeline.vue'
import PharmacyConversationThread from '@/components/pharmacy/PharmacyConversationThread.vue'
import PharmacyForm from '@/components/pharmacy/PharmacyForm.vue'
import type { PharmacyCustomer, PharmacyMessage } from '@/types/pharmacyConfig.types'
import { formatPhoneNumber, getMPStatusLabel, getMPStatusSeverity } from '@/types/pharmacyConfig.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Divider from 'primevue/divider'

const route = useRoute()
const router = useRouter()
const store = usePharmacyStore()
const {
  selectedPharmacy,
  pharmacyStats,
  isLoading,
  getPharmacy,
  fetchPharmacyStats,
  openPharmacyDialog
} = usePharmacyConfig()

const pharmacyId = computed(() => route.params.id as string)
const activeTab = ref('0')

// Conversation dialog state
const showConversationDialog = ref(false)
const selectedConversationId = ref<string>('')

function handleSelectCustomer(customer: PharmacyCustomer) {
  selectedConversationId.value = customer.conversation_id
  showConversationDialog.value = true
}

function handleSelectMessage(message: PharmacyMessage) {
  selectedConversationId.value = message.conversation_id
  showConversationDialog.value = true
}

function handleEdit() {
  if (selectedPharmacy.value) {
    openPharmacyDialog(selectedPharmacy.value)
  }
}

function handleBack() {
  router.push('/pharmacy')
}

onMounted(async () => {
  if (pharmacyId.value) {
    await getPharmacy(pharmacyId.value)
    await fetchPharmacyStats(pharmacyId.value)
  }
})
</script>

<template>
  <div class="pharmacy-detail-page">
    <!-- Loading -->
    <div v-if="isLoading && !selectedPharmacy" class="space-y-4">
      <Skeleton height="100px" />
      <Skeleton height="400px" />
    </div>

    <!-- Content -->
    <template v-else-if="selectedPharmacy">
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
              {{ selectedPharmacy.pharmacy_name }}
            </h1>
            <p class="text-gray-500 mt-1">
              Historial de conversaciones y mensajes
            </p>
          </div>
        </div>
        <Button
          label="Editar Farmacia"
          icon="pi pi-pencil"
          severity="secondary"
          @click="handleEdit"
        />
      </div>

      <!-- Pharmacy Info Card -->
      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Basic Info -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Informacion</h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-phone text-gray-400" />
                  <span>{{ formatPhoneNumber(selectedPharmacy.pharmacy_phone) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-whatsapp text-green-500" />
                  <span>{{ formatPhoneNumber(selectedPharmacy.whatsapp_phone_number) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Tag
                    :severity="getMPStatusSeverity(selectedPharmacy.mp_enabled)"
                    :value="getMPStatusLabel(selectedPharmacy.mp_enabled)"
                  />
                  <Tag
                    v-if="selectedPharmacy.mp_enabled"
                    :severity="selectedPharmacy.mp_sandbox ? 'warn' : 'success'"
                    :value="selectedPharmacy.mp_sandbox ? 'Sandbox' : 'Produccion'"
                  />
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div v-if="pharmacyStats">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Estadisticas</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ pharmacyStats.total_customers }}
                  </div>
                  <div class="text-xs text-gray-500">Clientes</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">
                    {{ pharmacyStats.total_messages }}
                  </div>
                  <div class="text-xs text-gray-500">Mensajes</div>
                </div>
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                  <div class="text-2xl font-bold text-purple-600">
                    {{ pharmacyStats.messages_today }}
                  </div>
                  <div class="text-xs text-gray-500">Hoy</div>
                </div>
                <div class="text-center p-3 bg-orange-50 rounded-lg">
                  <div class="text-2xl font-bold text-orange-600">
                    {{ pharmacyStats.active_conversations_24h }}
                  </div>
                  <div class="text-xs text-gray-500">Activos 24h</div>
                </div>
              </div>
            </div>

            <!-- Activity -->
            <div v-if="pharmacyStats">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Actividad</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Mensajes esta semana</span>
                  <span class="font-semibold">{{ pharmacyStats.messages_this_week }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Promedio por conversacion</span>
                  <span class="font-semibold">{{ pharmacyStats.avg_messages_per_conversation }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Total conversaciones</span>
                  <span class="font-semibold">{{ pharmacyStats.total_conversations }}</span>
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
                <PharmacyCustomerList
                  :pharmacy-id="pharmacyId"
                  @select-customer="handleSelectCustomer"
                />
              </TabPanel>
              <TabPanel value="1">
                <PharmacyMessageTimeline
                  :pharmacy-id="pharmacyId"
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
      <h2 class="text-xl font-semibold text-gray-600">Farmacia no encontrada</h2>
      <p class="text-gray-500 mt-2">La farmacia solicitada no existe o no tienes acceso</p>
      <Button
        label="Volver a Farmacias"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="handleBack"
      />
    </div>

    <!-- Conversation Dialog -->
    <PharmacyConversationThread
      v-model:visible="showConversationDialog"
      :pharmacy-id="pharmacyId"
      :conversation-id="selectedConversationId"
    />

    <!-- Edit Form Dialog -->
    <PharmacyForm />
  </div>
</template>

<style scoped>
.pharmacy-detail-page :deep(.p-card-content) {
  padding: 1rem;
}

.pharmacy-detail-page :deep(.p-tabpanels) {
  padding: 1rem 0 0 0;
}
</style>
