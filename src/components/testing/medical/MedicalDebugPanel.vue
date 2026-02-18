<script setup lang="ts">
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import MedicalWebhookPanel from '@/components/testing/medical/MedicalWebhookPanel.vue'
import type { Institution, MedicalWebhookConfig, ConversationContext, ConversationMessage } from '@/api/medical.api'

defineProps<{
  webhookConfig: MedicalWebhookConfig
  hasSession: boolean
  defaultPhone: string
  sessionId: string | null
  selectedInstitution: Institution | null
  messageCount: number
  executionSteps: unknown[]
  graphState: unknown
  conversationHistory: ConversationContext[]
  selectedConversation: ConversationContext | null
  historyMessages: ConversationMessage[]
  isLoadingHistory: boolean
  isDeletingHistory: boolean
}>()

const emit = defineEmits<{
  (e: 'update:webhookConfig', value: Partial<MedicalWebhookConfig>): void
  (e: 'fetchHistory'): void
  (e: 'selectConversation', conv: ConversationContext): void
  (e: 'deleteConversation', conv: ConversationContext): void
  (e: 'deleteHistory'): void
}>()

function formatDateTime(timestamp: string): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
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
            <MedicalWebhookPanel
              :config="webhookConfig"
              :has-session="hasSession"
              :default-phone="defaultPhone"
              @update="(v) => emit('update:webhookConfig', v)"
            />
          </TabPanel>

          <!-- Session Info -->
          <TabPanel value="1">
            <div class="space-y-4 p-3">
              <div>
                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</label>
                <code class="text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1">
                  {{ sessionId || 'N/A' }}
                </code>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Telefono</label>
                <code class="text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1">
                  {{ webhookConfig.phoneNumber }}
                </code>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Institucion</label>
                <p class="text-sm mt-1">{{ selectedInstitution?.name || 'No seleccionada' }}</p>
                <Tag
                  v-if="selectedInstitution?.institution_key"
                  :value="selectedInstitution.institution_key"
                  severity="info"
                  class="mt-1"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">DID (WhatsApp ID)</label>
                <code class="text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1">
                  {{ webhookConfig.did || 'N/A' }}
                </code>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes</label>
                <Tag :value="`${messageCount} mensajes`" severity="info" class="mt-1" />
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
                  @click="emit('fetchHistory')"
                  :loading="isLoadingHistory"
                />
              </div>

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
                        ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    ]"
                    @click="emit('selectConversation', conv)"
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
                      @click.stop="emit('deleteConversation', conv)"
                    />
                  </div>
                </div>
              </div>

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
                        ? 'ml-4 bg-blue-100 dark:bg-blue-900'
                        : msg.sender_type === 'assistant'
                          ? 'mr-4 bg-white dark:bg-gray-700'
                          : 'mx-auto bg-gray-200 dark:bg-gray-600 text-center'
                    ]"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <Tag
                        :value="msg.sender_type"
                        :severity="msg.sender_type === 'user' ? 'success' : msg.sender_type === 'assistant' ? 'info' : 'secondary'"
                        style="font-size: 0.6rem; padding: 0.1rem 0.25rem;"
                      />
                      <span class="text-gray-400 text-xs">{{ formatDateTime(msg.created_at) }}</span>
                    </div>
                    <div class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
                  </div>
                </div>
              </div>

              <div
                v-if="!isLoadingHistory && conversationHistory.length === 0"
                class="text-center text-gray-400 dark:text-gray-500 py-4"
              >
                <i class="pi pi-history text-2xl mb-2" />
                <p class="text-sm">Presiona "Cargar" para ver historial</p>
              </div>

              <div v-if="isLoadingHistory" class="text-center py-4">
                <ProgressSpinner style="width: 30px; height: 30px" />
              </div>

              <Button
                v-if="conversationHistory.length > 0"
                icon="pi pi-trash"
                label="Eliminar Todo"
                severity="danger"
                size="small"
                class="w-full"
                @click="emit('deleteHistory')"
                :loading="isDeletingHistory"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>
