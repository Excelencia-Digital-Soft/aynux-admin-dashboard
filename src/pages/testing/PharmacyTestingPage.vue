<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { pharmacyApi } from '@/api/pharmacy.api'
import type { Pharmacy, PharmacyTestMessage, PharmacyWebhookConfig } from '@/api/pharmacy.api'
import { useToast } from '@/composables/useToast'
import PharmacyWebhookPanel from '@/components/pharmacy/PharmacyWebhookPanel.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Divider from 'primevue/divider'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import ScrollPanel from 'primevue/scrollpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const toast = useToast()

const isLoading = ref(false)
const isSending = ref(false)
const pharmacies = ref<Pharmacy[]>([])
const selectedPharmacy = ref<Pharmacy | null>(null)
const sessionId = ref<string | null>(null)
const messages = ref<PharmacyTestMessage[]>([])
const inputMessage = ref('')
const webhookConfig = ref<PharmacyWebhookConfig>({
  enabled: false,
  phoneNumber: '2645631000',
  userName: 'Pharmacy Tester'
})
const executionSteps = ref<unknown[]>([])
const graphState = ref<unknown | null>(null)
const chatContainer = ref<HTMLElement | null>(null)

const hasSession = computed(() => !!sessionId.value)

async function fetchPharmacies() {
  isLoading.value = true
  try {
    pharmacies.value = await pharmacyApi.getPharmacies()
    if (pharmacies.value.length > 0 && !selectedPharmacy.value) {
      selectedPharmacy.value = pharmacies.value[0]
    }
  } finally {
    isLoading.value = false
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || !selectedPharmacy.value) return

  const userMessage: PharmacyTestMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date().toISOString()
  }

  messages.value.push(userMessage)
  const messageText = inputMessage.value
  inputMessage.value = ''
  await scrollToBottom()

  isSending.value = true
  try {
    const response = await pharmacyApi.sendTestMessage({
      pharmacy_id: selectedPharmacy.value.id,
      message: messageText,
      session_id: sessionId.value || undefined,
      phone_number: webhookConfig.value.phoneNumber
    })

    if (response) {
      sessionId.value = response.session_id

      const assistantMessage: PharmacyTestMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      }

      messages.value.push(assistantMessage)

      if (response.execution_steps) {
        executionSteps.value = response.execution_steps
      }
      if (response.graph_state) {
        graphState.value = response.graph_state
      }

      await scrollToBottom()
    }
  } catch (error) {
    toast.error('Error al enviar mensaje')
    // Remove user message on error
    messages.value.pop()
  } finally {
    isSending.value = false
  }
}

async function clearSession() {
  if (sessionId.value) {
    await pharmacyApi.clearSession(sessionId.value)
  }
  sessionId.value = null
  messages.value = []
  executionSteps.value = []
  graphState.value = null
  toast.info('Sesion reiniciada')
}

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  // Load webhook config from localStorage
  const saved = localStorage.getItem('pharmacy-webhook-config')
  if (saved) {
    try {
      webhookConfig.value = JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse pharmacy webhook config')
    }
  }
  fetchPharmacies()
})

// Persist webhook config to localStorage
watch(webhookConfig, (val) => {
  localStorage.setItem('pharmacy-webhook-config', JSON.stringify(val))
}, { deep: true })
</script>

<template>
  <div class="pharmacy-testing-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Pruebas Farmacia</h1>
        <p class="text-gray-500 mt-1">Simulador de conversacion WhatsApp para el dominio farmacia</p>
      </div>
      <div class="flex gap-2">
        <Button
          icon="pi pi-refresh"
          label="Actualizar"
          severity="secondary"
          @click="fetchPharmacies"
          :loading="isLoading"
        />
        <Button
          icon="pi pi-trash"
          label="Reiniciar"
          severity="warn"
          @click="clearSession"
          :disabled="!hasSession"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Panel -->
      <div class="lg:col-span-2">
        <Card class="h-full">
          <template #header>
            <div class="flex items-center justify-between p-4 bg-green-600 text-white rounded-t-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="pi pi-whatsapp text-xl" />
                </div>
                <div>
                  <div class="font-medium">
                    {{ selectedPharmacy?.name || 'Seleccionar Farmacia' }}
                  </div>
                  <div class="text-xs text-green-100">
                    {{ hasSession ? 'Sesion activa' : 'Sin sesion' }}
                  </div>
                </div>
              </div>
              <Select
                v-model="selectedPharmacy"
                :options="pharmacies"
                optionLabel="name"
                placeholder="Farmacia"
                class="w-48"
                :disabled="hasSession"
              />
            </div>
          </template>

          <template #content>
            <!-- Chat Messages -->
            <div
              ref="chatContainer"
              class="chat-messages h-96 overflow-y-auto p-4 bg-gray-100"
            >
              <!-- No messages -->
              <div
                v-if="messages.length === 0"
                class="h-full flex items-center justify-center text-gray-400"
              >
                <div class="text-center">
                  <i class="pi pi-comments text-4xl mb-2" />
                  <p>Inicia una conversacion</p>
                </div>
              </div>

              <!-- Messages -->
              <div v-else class="space-y-3">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  :class="[
                    'max-w-[80%] p-3 rounded-lg shadow-sm',
                    msg.role === 'user'
                      ? 'ml-auto bg-green-100 rounded-br-none'
                      : 'mr-auto bg-white rounded-bl-none'
                  ]"
                >
                  <div class="text-sm whitespace-pre-wrap">{{ msg.content }}</div>
                  <div
                    :class="[
                      'text-xs mt-1',
                      msg.role === 'user' ? 'text-green-600 text-right' : 'text-gray-400'
                    ]"
                  >
                    {{ formatTime(msg.timestamp) }}
                  </div>
                </div>

                <!-- Typing indicator -->
                <div v-if="isSending" class="mr-auto bg-white p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div class="flex gap-1">
                    <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                    <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                    <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="p-4 border-t flex gap-2">
              <InputText
                v-model="inputMessage"
                placeholder="Escribe un mensaje..."
                class="flex-1"
                @keypress="handleKeyPress"
                :disabled="!selectedPharmacy || isSending"
              />
              <Button
                icon="pi pi-send"
                @click="sendMessage"
                :loading="isSending"
                :disabled="!inputMessage.trim() || !selectedPharmacy"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Debug Panel -->
      <div>
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-code" />
              <span>Panel de Debug</span>
            </div>
          </template>

          <template #content>
            <Tabs value="0">
              <TabList>
                <Tab value="0">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-info-circle" />
                    <span>Sesion</span>
                  </div>
                </Tab>
                <Tab value="1">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-list" />
                    <span>Pasos</span>
                  </div>
                </Tab>
                <Tab value="2">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-sitemap" />
                    <span>Estado</span>
                  </div>
                </Tab>
                <Tab value="3">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-bolt" />
                    <span>Webhook</span>
                    <Tag
                      v-if="webhookConfig.enabled"
                      value="ON"
                      severity="success"
                      class="ml-1"
                      style="font-size: 0.65rem; padding: 0.1rem 0.3rem;"
                    />
                  </div>
                </Tab>
              </TabList>

              <TabPanels>
                <!-- Session Info -->
                <TabPanel value="0">
                  <div class="space-y-4 p-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-500">Session ID</label>
                      <code class="text-xs break-all">{{ sessionId || 'N/A' }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500">Telefono</label>
                      <code class="text-xs break-all">{{ webhookConfig.phoneNumber }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500">Farmacia</label>
                      <p>{{ selectedPharmacy?.name || 'No seleccionada' }}</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500">Mensajes</label>
                      <Tag :value="`${messages.length} mensajes`" severity="info" />
                    </div>
                  </div>
                </TabPanel>

                <!-- Execution Steps -->
                <TabPanel value="1">
                  <div v-if="executionSteps.length === 0" class="text-center text-gray-400 py-4">
                    <i class="pi pi-list text-2xl mb-2" />
                    <p class="text-sm">Sin pasos de ejecucion</p>
                  </div>

                  <div v-else class="space-y-2 max-h-64 overflow-y-auto p-3">
                    <div
                      v-for="(step, idx) in executionSteps"
                      :key="idx"
                      class="p-2 bg-gray-50 rounded text-xs"
                    >
                      <pre class="overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
                    </div>
                  </div>
                </TabPanel>

                <!-- Graph State -->
                <TabPanel value="2">
                  <div v-if="!graphState" class="text-center text-gray-400 py-4">
                    <i class="pi pi-sitemap text-2xl mb-2" />
                    <p class="text-sm">Sin estado de grafo</p>
                  </div>

                  <div v-else class="max-h-64 overflow-y-auto p-3">
                    <pre class="text-xs bg-gray-50 p-2 rounded">{{
                      JSON.stringify(graphState, null, 2)
                    }}</pre>
                  </div>
                </TabPanel>

                <!-- Webhook Config -->
                <TabPanel value="3">
                  <PharmacyWebhookPanel
                    :config="webhookConfig"
                    :has-session="hasSession"
                    @update="(c) => webhookConfig = { ...webhookConfig, ...c }"
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </template>
        </Card>

        <!-- Quick Actions -->
        <Card class="mt-4">
          <template #title>
            <div class="flex items-center gap-2 text-sm">
              <i class="pi pi-bolt" />
              <span>Acciones Rapidas</span>
            </div>
          </template>

          <template #content>
            <div class="grid grid-cols-2 gap-2">
              <Button
                label="Hola"
                size="small"
                severity="secondary"
                @click="inputMessage = 'Hola, buenos dias'"
              />
              <Button
                label="Productos"
                size="small"
                severity="secondary"
                @click="inputMessage = 'Que productos tienen?'"
              />
              <Button
                label="Precio"
                size="small"
                severity="secondary"
                @click="inputMessage = 'Cuanto cuesta el paracetamol?'"
              />
              <Button
                label="Pedido"
                size="small"
                severity="secondary"
                @click="inputMessage = 'Quiero hacer un pedido'"
              />
              <Button
                label="Ubicacion"
                size="small"
                severity="secondary"
                @click="inputMessage = 'Donde estan ubicados?'"
              />
              <Button
                label="Horario"
                size="small"
                severity="secondary"
                @click="inputMessage = 'Cual es su horario de atencion?'"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pharmacy-testing-page :deep(.p-card-content) {
  padding: 0;
}

.pharmacy-testing-page :deep(.p-card-header) {
  padding: 0;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
