<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useMedicalTesting } from '@/composables/useMedicalTesting'
import { useToast } from '@/composables/useToast'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const DEFAULT_PHONE = '5491100001234'

const {
  isLoading,
  isSending,
  institutions,
  selectedInstitution,
  sessionId,
  messages,
  inputMessage,
  webhookConfig,
  executionSteps,
  hasSession,
  fetchInstitutions,
  sendMessage,
  clearSession,
  setQuickMessage,
  updateWebhookConfig,
  formatTime
} = useMedicalTesting({ defaultPhone: DEFAULT_PHONE })

const toast = useToast()
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

async function copyAllChat() {
  if (messages.value.length === 0) {
    toast.warn('No hay mensajes para copiar')
    return
  }

  const chatText = messages.value
    .map((msg) => {
      const time = formatTime(msg.timestamp)
      const role = msg.role === 'user' ? 'Paciente' : 'Asistente'
      return `[${time}] ${role}: ${msg.content}`
    })
    .join('\n\n')

  try {
    await navigator.clipboard.writeText(chatText)
    toast.success('Chat copiado al portapapeles')
  } catch (err) {
    console.error('Error copying chat:', err)
    toast.error('Error al copiar el chat')
  }
}
</script>

<template>
  <div class="medical-testing-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Pruebas Turnos Medicos</h1>
        <p class="text-gray-500 mt-1">
          Simulador de conversacion WhatsApp para el dominio medical_appointments
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          icon="pi pi-refresh"
          label="Actualizar"
          severity="secondary"
          @click="fetchInstitutions"
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
            <div
              class="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <i class="pi pi-calendar-plus text-xl" />
                </div>
                <div>
                  <div class="font-medium">
                    {{ selectedInstitution?.name || 'Seleccionar Institucion' }}
                  </div>
                  <div class="text-xs text-blue-100">
                    {{ hasSession ? 'Sesion activa' : 'Sin sesion' }}
                  </div>
                </div>
              </div>
              <Select
                v-model="selectedInstitution"
                :options="institutions"
                optionLabel="name"
                placeholder="Institucion"
                class="w-56"
                :disabled="hasSession"
              />
              <Button
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                v-tooltip.bottom="'Copiar chat'"
                @click="copyAllChat"
                :disabled="messages.length === 0"
                class="text-white hover:bg-white/20"
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
                      ? 'ml-auto bg-blue-500 text-white rounded-br-none'
                      : 'mr-auto bg-white dark:bg-gray-700 rounded-bl-none'
                  ]"
                >
                  <p class="text-sm whitespace-pre-wrap break-words">{{ msg.content }}</p>
                  <div
                    :class="[
                      'text-xs mt-1',
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                    ]"
                  >
                    {{ formatTime(msg.timestamp) }}
                  </div>
                </div>

                <!-- Typing indicator -->
                <div
                  v-if="isSending"
                  class="mr-auto bg-white dark:bg-gray-700 p-3 rounded-lg rounded-bl-none shadow-sm"
                >
                  <div class="flex gap-1">
                    <span
                      class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style="animation-delay: 0ms"
                    />
                    <span
                      class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style="animation-delay: 150ms"
                    />
                    <span
                      class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style="animation-delay: 300ms"
                    />
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
                :disabled="!selectedInstitution || isSending"
              />
              <Button
                icon="pi pi-send"
                @click="handleSendMessage"
                :loading="isSending"
                :disabled="!inputMessage.trim() || !selectedInstitution"
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
              </TabList>

              <TabPanels>
                <!-- Session Info -->
                <TabPanel value="0">
                  <div class="space-y-4 p-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400"
                        >Session ID</label
                      >
                      <code class="text-xs break-all">{{ sessionId || 'N/A' }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400"
                        >Telefono</label
                      >
                      <code class="text-xs break-all">{{ webhookConfig.phoneNumber }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400"
                        >Institucion</label
                      >
                      <p>{{ selectedInstitution?.name || 'No seleccionada' }}</p>
                      <Tag
                        v-if="selectedInstitution?.institution_key"
                        :value="selectedInstitution.institution_key"
                        severity="info"
                        class="mt-1"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400"
                        >DID (WhatsApp ID)</label
                      >
                      <code class="text-xs break-all">{{ webhookConfig.did || 'N/A' }}</code>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400"
                        >Mensajes</label
                      >
                      <Tag :value="`${messages.length} mensajes`" severity="info" />
                    </div>

                    <!-- Phone number input -->
                    <div>
                      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
                        >Telefono Simulado</label
                      >
                      <InputText
                        :modelValue="webhookConfig.phoneNumber"
                        @update:modelValue="updateWebhookConfig({ phoneNumber: String($event) })"
                        class="w-full"
                        size="small"
                        placeholder="Numero de telefono"
                        :disabled="hasSession"
                      />
                    </div>
                  </div>
                </TabPanel>

                <!-- Execution Steps -->
                <TabPanel value="1">
                  <div
                    v-if="executionSteps.length === 0"
                    class="text-center text-gray-400 dark:text-gray-500 py-4"
                  >
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
                label="Turno"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Quiero sacar un turno')"
              />
              <Button
                label="Consultar"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Quiero consultar mis turnos')"
              />
              <Button
                label="Cancelar"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Quiero cancelar un turno')"
              />
              <Button
                label="Especialista"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Quiero turno con Dr. Martinez')"
              />
              <Button
                label="Disponibilidad"
                size="small"
                severity="secondary"
                @click="setQuickMessage('Que horarios tienen disponibles?')"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.medical-testing-page :deep(.p-card-content) {
  padding: 0;
}

.medical-testing-page :deep(.p-card-header) {
  padding: 0;
}

@keyframes bounce {
  0%,
  60%,
  100% {
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
