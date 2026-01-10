<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { usePharmacyTesting } from '@/composables/usePharmacyTesting'
import PharmacyWebhookPanel from '@/components/pharmacy/PharmacyWebhookPanel.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Dialog from 'primevue/dialog'

const DEFAULT_PHONE = '2645631000'

const {
  isLoading,
  isSending,
  pharmacies,
  selectedPharmacy,
  sessionId,
  messages,
  inputMessage,
  webhookConfig,
  executionSteps,
  graphState,
  conversationHistory,
  historyMessages,
  selectedConversation,
  isLoadingHistory,
  isDeletingHistory,
  showDeleteConfirm,
  hasSession,
  fetchPharmacies,
  sendMessage,
  clearSession,
  setQuickMessage,
  updateWebhookConfig,
  fetchHistory,
  selectConversation,
  deleteConversation,
  deleteAllHistory,
  formatTime,
  formatDateTime
} = usePharmacyTesting({ defaultPhone: DEFAULT_PHONE })

const chatContainer = ref<HTMLElement | null>(null)

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage().then(scrollToBottom)
  }
}

async function handleSendMessage() {
  await sendMessage()
  await scrollToBottom()
}
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
              class="chat-messages h-96 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-800"
            >
              <!-- No messages -->
              <div
                v-if="messages.length === 0"
                class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
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
                      ? 'ml-auto bg-green-100 dark:bg-green-900 rounded-br-none'
                      : 'mr-auto bg-white dark:bg-gray-700 rounded-bl-none'
                  ]"
                >
                  <div class="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{{ msg.content }}</div>
                  <div
                    :class="[
                      'text-xs mt-1',
                      msg.role === 'user' ? 'text-green-600 dark:text-green-400 text-right' : 'text-gray-400 dark:text-gray-500'
                    ]"
                  >
                    {{ formatTime(msg.timestamp) }}
                  </div>
                </div>

                <!-- Typing indicator -->
                <div v-if="isSending" class="mr-auto bg-white dark:bg-gray-700 p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div class="flex gap-1">
                    <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms" />
                    <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms" />
                    <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms" />
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
                @click="handleSendMessage"
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
                <Tab value="1">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-info-circle" />
                    <span>Sesion</span>
                  </div>
                </Tab>
                <Tab value="2">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-list" />
                    <span>Pasos</span>
                  </div>
                </Tab>
                <Tab value="3">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-sitemap" />
                    <span>Estado</span>
                  </div>
                </Tab>
                <Tab value="4">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-history" />
                    <span>Historial</span>
                    <Tag
                      v-if="conversationHistory.length"
                      :value="conversationHistory.length"
                      severity="info"
                      class="ml-1"
                      style="font-size: 0.65rem; padding: 0.1rem 0.3rem;"
                    />
                  </div>
                </Tab>
              </TabList>

              <TabPanels>
                <!-- Webhook Config -->
                <TabPanel value="0">
                  <PharmacyWebhookPanel
                    :config="webhookConfig"
                    :has-session="hasSession"
                    :default-phone="DEFAULT_PHONE"
                    @update="updateWebhookConfig"
                  />
                </TabPanel>

                <!-- Session Info -->
                <TabPanel value="1">
                  <div class="space-y-4 p-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</label>
                      <code class="text-xs break-all">{{ sessionId || 'N/A' }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Telefono</label>
                      <code class="text-xs break-all">{{ webhookConfig.phoneNumber }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Farmacia</label>
                      <p>{{ selectedPharmacy?.name || 'No seleccionada' }}</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes</label>
                      <Tag :value="`${messages.length} mensajes`" severity="info" />
                    </div>
                  </div>
                </TabPanel>

                <!-- Execution Steps -->
                <TabPanel value="2">
                  <div v-if="executionSteps.length === 0" class="text-center text-gray-400 dark:text-gray-500 py-4">
                    <i class="pi pi-list text-2xl mb-2" />
                    <p class="text-sm">Sin pasos de ejecucion</p>
                  </div>

                  <div v-else class="space-y-2 max-h-64 overflow-y-auto p-3">
                    <div
                      v-for="(step, idx) in executionSteps"
                      :key="idx"
                      class="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                    >
                      <pre class="overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
                    </div>
                  </div>
                </TabPanel>

                <!-- Graph State -->
                <TabPanel value="3">
                  <div v-if="!graphState" class="text-center text-gray-400 dark:text-gray-500 py-4">
                    <i class="pi pi-sitemap text-2xl mb-2" />
                    <p class="text-sm">Sin estado de grafo</p>
                  </div>

                  <div v-else class="max-h-64 overflow-y-auto p-3">
                    <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">{{
                      JSON.stringify(graphState, null, 2)
                    }}</pre>
                  </div>
                </TabPanel>

                <!-- Message History -->
                <TabPanel value="4">
                  <div class="p-3 space-y-4">
                    <!-- Header with phone and load button -->
                    <div class="flex items-center justify-between">
                      <div class="text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Telefono:</span>
                        <code class="ml-2 text-xs">{{ webhookConfig.phoneNumber }}</code>
                      </div>
                      <Button
                        icon="pi pi-refresh"
                        label="Cargar"
                        size="small"
                        severity="secondary"
                        @click="fetchHistory"
                        :loading="isLoadingHistory"
                      />
                    </div>

                    <!-- Conversation list -->
                    <div v-if="conversationHistory.length > 0" class="space-y-2">
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block">
                        Conversaciones ({{ conversationHistory.length }})
                      </label>
                      <div class="max-h-32 overflow-y-auto space-y-1">
                        <div
                          v-for="conv in conversationHistory"
                          :key="conv.conversation_id"
                          :class="[
                            'flex items-center justify-between p-2 rounded cursor-pointer text-xs',
                            selectedConversation?.conversation_id === conv.conversation_id
                              ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          ]"
                          @click="selectConversation(conv)"
                        >
                          <div class="flex items-center gap-2 flex-1 min-w-0">
                            <i class="pi pi-comments text-gray-400" />
                            <span class="truncate">{{ conv.total_turns }} msgs</span>
                            <span class="text-gray-400">{{ formatDateTime(conv.last_activity) }}</span>
                          </div>
                          <Button
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            text
                            rounded
                            @click.stop="deleteConversation(conv)"
                            v-tooltip.top="'Eliminar conversacion'"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Messages for selected conversation -->
                    <div v-if="selectedConversation && historyMessages.length > 0" class="space-y-2">
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block">
                        Mensajes ({{ historyMessages.length }})
                      </label>
                      <div class="max-h-40 overflow-y-auto space-y-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div
                          v-for="(msg, idx) in historyMessages"
                          :key="idx"
                          :class="[
                            'p-2 rounded text-xs',
                            msg.sender_type === 'user'
                              ? 'ml-4 bg-green-100 dark:bg-green-900'
                              : msg.sender_type === 'assistant'
                                ? 'mr-4 bg-white dark:bg-gray-700'
                                : 'mx-auto bg-gray-200 dark:bg-gray-600 text-center'
                          ]"
                        >
                          <div class="flex items-center gap-2 mb-1">
                            <Tag
                              :value="msg.sender_type"
                              :severity="msg.sender_type === 'user' ? 'success' : msg.sender_type === 'assistant' ? 'info' : 'secondary'"
                              class="text-xs"
                              style="font-size: 0.6rem; padding: 0.1rem 0.25rem;"
                            />
                            <span class="text-gray-400 text-xs">{{ formatDateTime(msg.created_at) }}</span>
                          </div>
                          <div class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Empty state -->
                    <div
                      v-if="!isLoadingHistory && conversationHistory.length === 0"
                      class="text-center text-gray-400 dark:text-gray-500 py-4"
                    >
                      <i class="pi pi-history text-2xl mb-2" />
                      <p class="text-sm">Presiona "Cargar" para ver historial</p>
                    </div>

                    <!-- Loading state -->
                    <div v-if="isLoadingHistory" class="text-center py-4">
                      <ProgressSpinner style="width: 30px; height: 30px" />
                    </div>

                    <!-- Delete all button -->
                    <Button
                      v-if="conversationHistory.length > 0"
                      icon="pi pi-trash"
                      label="Eliminar Todo el Historial"
                      severity="danger"
                      size="small"
                      class="w-full"
                      @click="showDeleteConfirm = true"
                      :loading="isDeletingHistory"
                    />
                  </div>
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
                @click="setQuickMessage('Hola, buenos dias')"
              />
              <Button
                label="Productos"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Que productos tienen?')"
              />
              <Button
                label="Precio"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Cuanto cuesta el paracetamol?')"
              />
              <Button
                label="Pedido"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Quiero hacer un pedido')"
              />
              <Button
                label="Ubicacion"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Donde estan ubicados?')"
              />
              <Button
                label="Horario"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Cual es su horario de atencion?')"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteConfirm"
      modal
      header="Eliminar Historial"
      :style="{ width: '400px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-yellow-500 text-2xl" />
        <div>
          <p class="text-gray-700 dark:text-gray-300">
            Esta accion eliminara <strong>TODAS</strong> las conversaciones para el telefono
            <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ webhookConfig.phoneNumber }}</code>.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Esta accion no se puede deshacer.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showDeleteConfirm = false"
          :disabled="isDeletingHistory"
        />
        <Button
          label="Eliminar"
          severity="danger"
          icon="pi pi-trash"
          @click="deleteAllHistory"
          :loading="isDeletingHistory"
        />
      </template>
    </Dialog>
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
