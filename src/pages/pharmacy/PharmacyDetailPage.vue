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
import { formatPhoneNumber, getMPStatusLabel } from '@/types/pharmacyConfig.types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
const activeTab = ref('customers')

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
  <div class="pharmacy-detail-page min-h-screen">
    <div v-if="isLoading && !selectedPharmacy" class="space-y-4">
      <div class="h-24 bg-gray-50 dark:bg-white/5 rounded-2xl animate-pulse" />
      <div class="h-96 bg-gray-50 dark:bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <template v-else-if="selectedPharmacy">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            class="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            @click="handleBack"
          >
            <i class="pi pi-arrow-left" />
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-foreground dark:text-white">
              {{ selectedPharmacy.pharmacy_name }}
            </h1>
            <p class="text-gray-400 dark:text-white/50 mt-1">
              Historial de conversaciones y mensajes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          @click="handleEdit"
        >
          <i class="pi pi-pencil mr-2" />
          Editar Farmacia
        </Button>
      </div>

      <div class="bg-white dark:bg-white/10 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/15 shadow-lg dark:shadow-2xl p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-400 dark:text-white/50 mb-3">Informacion</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center">
                  <i class="pi pi-phone text-gray-500 dark:text-white/60 text-sm" />
                </div>
                <span class="text-gray-700 dark:text-white/80">{{ formatPhoneNumber(selectedPharmacy.pharmacy_phone) }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <i class="pi pi-whatsapp text-green-400 text-sm" />
                </div>
                <span class="text-gray-700 dark:text-white/80">{{ formatPhoneNumber(selectedPharmacy.whatsapp_phone_number) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Badge
                  :variant="selectedPharmacy.mp_enabled ? 'success' : 'secondary'"
                  class="text-xs"
                >
                  {{ getMPStatusLabel(selectedPharmacy.mp_enabled) }}
                </Badge>
                <Badge
                  v-if="selectedPharmacy.mp_enabled"
                  :variant="selectedPharmacy.mp_sandbox ? 'warning' : 'success'"
                  class="text-xs"
                >
                  {{ selectedPharmacy.mp_sandbox ? 'Sandbox' : 'Produccion' }}
                </Badge>
              </div>
            </div>
          </div>

          <div v-if="pharmacyStats">
            <h3 class="text-sm font-semibold text-gray-400 dark:text-white/50 mb-3">Estadisticas</h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div class="text-2xl font-bold text-blue-400">
                  {{ pharmacyStats.total_customers }}
                </div>
                <div class="text-xs text-gray-400 dark:text-white/50">Clientes</div>
              </div>
              <div class="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <div class="text-2xl font-bold text-green-400">
                  {{ pharmacyStats.total_messages }}
                </div>
                <div class="text-xs text-gray-400 dark:text-white/50">Mensajes</div>
              </div>
              <div class="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <div class="text-2xl font-bold text-purple-400">
                  {{ pharmacyStats.messages_today }}
                </div>
                <div class="text-xs text-gray-400 dark:text-white/50">Hoy</div>
              </div>
              <div class="text-center p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <div class="text-2xl font-bold text-orange-400">
                  {{ pharmacyStats.active_conversations_24h }}
                </div>
                <div class="text-xs text-gray-400 dark:text-white/50">Activos 24h</div>
              </div>
            </div>
          </div>

          <div v-if="pharmacyStats">
            <h3 class="text-sm font-semibold text-gray-400 dark:text-white/50 mb-3">Actividad</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/10">
                <span class="text-sm text-gray-500 dark:text-white/60">Mensajes esta semana</span>
                <span class="font-semibold text-foreground dark:text-white">{{ pharmacyStats.messages_this_week }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/10">
                <span class="text-sm text-gray-500 dark:text-white/60">Promedio por conversacion</span>
                <span class="font-semibold text-foreground dark:text-white">{{ pharmacyStats.avg_messages_per_conversation }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-500 dark:text-white/60">Total conversaciones</span>
                <span class="font-semibold text-foreground dark:text-white">{{ pharmacyStats.total_conversations }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 mb-6">
          <TabsTrigger
            value="customers"
            class="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-white/20 data-[state=active]:text-foreground dark:data-[state=active]:text-white text-gray-500 dark:text-white/60"
          >
            <i class="pi pi-users mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            class="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-white/20 data-[state=active]:text-foreground dark:data-[state=active]:text-white text-gray-500 dark:text-white/60"
          >
            <i class="pi pi-clock mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <PharmacyCustomerList
            :pharmacy-id="pharmacyId"
            @select-customer="handleSelectCustomer"
          />
        </TabsContent>

        <TabsContent value="timeline">
          <PharmacyMessageTimeline
            :pharmacy-id="pharmacyId"
            @select-message="handleSelectMessage"
          />
        </TabsContent>
      </Tabs>
    </template>

    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-circle text-6xl text-gray-300 dark:text-white/30 mb-4" />
      <h2 class="text-xl font-semibold text-gray-600 dark:text-white/70">Farmacia no encontrada</h2>
      <p class="text-gray-400 dark:text-white/50 mt-2">La farmacia solicitada no existe o no tienes acceso</p>
      <Button
        variant="outline"
        class="mt-4 border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
        @click="handleBack"
      >
        <i class="pi pi-arrow-left mr-2" />
        Volver a Farmacias
      </Button>
    </div>

    <PharmacyConversationThread
      v-model:visible="showConversationDialog"
      :pharmacy-id="pharmacyId"
      :conversation-id="selectedConversationId"
    />

    <PharmacyForm />
  </div>
</template>
