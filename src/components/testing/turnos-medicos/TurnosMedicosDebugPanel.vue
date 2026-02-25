<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import TurnosMedicosWebhookPanel from '@/components/testing/turnos-medicos/TurnosMedicosWebhookPanel.vue'
import type { Institution, MedicalWebhookConfig, ConversationContext, ConversationMessage } from '@/types/turnosMedicos.types'

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
  <Card class="bg-white/70 dark:bg-navy-800/50 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl rounded-2xl overflow-hidden">
    <CardHeader class="pb-3">
      <CardTitle class="flex items-center gap-2 text-base">
        <i class="pi pi-code text-violet-500" />
        <span>Panel de Debug</span>
      </CardTitle>
    </CardHeader>

    <CardContent class="pt-0">
      <Tabs default-value="webhook">
        <TabsList class="w-full overflow-x-auto justify-start bg-white/50 dark:bg-navy-900/40 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="webhook" class="shrink-0 text-xs data-[state=active]:bg-white/80 dark:data-[state=active]:bg-navy-800/60 data-[state=active]:shadow-sm rounded-lg">
            <i class="pi pi-bolt mr-1.5" />
            Webhook
          </TabsTrigger>
          <TabsTrigger value="session" class="shrink-0 text-xs data-[state=active]:bg-white/80 dark:data-[state=active]:bg-navy-800/60 data-[state=active]:shadow-sm rounded-lg">
            <i class="pi pi-info-circle mr-1.5" />
            Sesion
          </TabsTrigger>
          <TabsTrigger value="steps" class="shrink-0 text-xs data-[state=active]:bg-white/80 dark:data-[state=active]:bg-navy-800/60 data-[state=active]:shadow-sm rounded-lg">
            <i class="pi pi-list mr-1.5" />
            Pasos
          </TabsTrigger>
          <TabsTrigger value="state" class="shrink-0 text-xs data-[state=active]:bg-white/80 dark:data-[state=active]:bg-navy-800/60 data-[state=active]:shadow-sm rounded-lg">
            <i class="pi pi-sitemap mr-1.5" />
            Estado
          </TabsTrigger>
          <TabsTrigger value="history" class="shrink-0 text-xs data-[state=active]:bg-white/80 dark:data-[state=active]:bg-navy-800/60 data-[state=active]:shadow-sm rounded-lg">
            <i class="pi pi-history mr-1.5" />
            Historial
            <Badge
              v-if="conversationHistory.length"
              variant="info"
              class="ml-1 text-[0.6rem] px-1.5 py-0"
            >
              {{ conversationHistory.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- Webhook Config -->
        <TabsContent value="webhook">
          <TurnosMedicosWebhookPanel
            :config="webhookConfig"
            :has-session="hasSession"
            :default-phone="defaultPhone"
            @update="(v) => emit('update:webhookConfig', v)"
          />
        </TabsContent>

        <!-- Session Info -->
        <TabsContent value="session">
          <div class="space-y-4 p-3">
            <div>
              <label class="block text-sm font-medium text-muted-foreground">Session ID</label>
              <code class="text-xs break-all bg-white/40 dark:bg-navy-900/40 backdrop-blur-sm px-2 py-1 rounded-lg block mt-1 border border-white/10">
                {{ sessionId || 'N/A' }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Telefono</label>
              <code class="text-xs break-all bg-white/40 dark:bg-navy-900/40 backdrop-blur-sm px-2 py-1 rounded-lg block mt-1 border border-white/10">
                {{ webhookConfig.phoneNumber }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Institucion</label>
              <p class="text-sm mt-1 text-foreground">{{ selectedInstitution?.name || 'No seleccionada' }}</p>
              <Badge
                v-if="selectedInstitution?.institution_key"
                variant="info"
                class="mt-1"
              >
                {{ selectedInstitution.institution_key }}
              </Badge>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">DID (WhatsApp ID)</label>
              <code class="text-xs break-all bg-white/40 dark:bg-navy-900/40 backdrop-blur-sm px-2 py-1 rounded-lg block mt-1 border border-white/10">
                {{ webhookConfig.did || 'N/A' }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Mensajes</label>
              <Badge variant="info" class="mt-1">{{ messageCount }} mensajes</Badge>
            </div>
          </div>
        </TabsContent>

        <!-- Execution Steps -->
        <TabsContent value="steps">
          <div v-if="executionSteps.length === 0" class="text-center text-muted-foreground py-6">
            <i class="pi pi-list text-2xl mb-2 block" />
            <p class="text-sm">Sin pasos de ejecucion</p>
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto p-3">
            <div
              v-for="(step, idx) in executionSteps"
              :key="idx"
              class="p-2 bg-white/40 dark:bg-navy-900/40 backdrop-blur-sm rounded-lg text-xs border border-white/10"
            >
              <pre class="overflow-auto text-foreground">{{ JSON.stringify(step, null, 2) }}</pre>
            </div>
          </div>
        </TabsContent>

        <!-- Graph State -->
        <TabsContent value="state">
          <div v-if="!graphState" class="text-center text-muted-foreground py-6">
            <i class="pi pi-sitemap text-2xl mb-2 block" />
            <p class="text-sm">Sin estado de grafo</p>
          </div>

          <div v-else class="max-h-64 overflow-y-auto p-3">
            <pre class="text-xs bg-white/40 dark:bg-navy-900/40 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-foreground">{{
              JSON.stringify(graphState, null, 2)
            }}</pre>
          </div>
        </TabsContent>

        <!-- Message History -->
        <TabsContent value="history">
          <div class="p-3 space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-sm">
                <span class="text-muted-foreground">Telefono:</span>
                <code class="ml-2 text-xs text-foreground">{{ webhookConfig.phoneNumber }}</code>
              </div>
              <Button
                variant="secondary"
                size="sm"
                :loading="isLoadingHistory"
                @click="emit('fetchHistory')"
              >
                <i class="pi pi-refresh mr-1.5" />
                Cargar
              </Button>
            </div>

            <div v-if="conversationHistory.length > 0" class="space-y-2">
              <label class="text-sm font-medium text-muted-foreground block">
                Conversaciones ({{ conversationHistory.length }})
              </label>
              <div class="max-h-32 overflow-y-auto space-y-1.5">
                <div
                  v-for="conv in conversationHistory"
                  :key="conv.conversation_id"
                  :class="[
                    'flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all duration-200 border',
                    selectedConversation?.conversation_id === conv.conversation_id
                      ? 'bg-violet-100/60 dark:bg-violet-900/30 border-violet-300/50 dark:border-violet-700/50 shadow-sm'
                      : 'bg-white/40 dark:bg-navy-900/30 border-white/10 hover:bg-white/60 dark:hover:bg-navy-800/40 hover:shadow-sm'
                  ]"
                  @click="emit('selectConversation', conv)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <i class="pi pi-comments text-muted-foreground" />
                    <span class="truncate text-foreground">{{ conv.total_turns }} msgs</span>
                    <span class="text-muted-foreground">{{ formatDateTime(conv.last_activity) }}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    @click.stop="emit('deleteConversation', conv)"
                  >
                    <i class="pi pi-times text-xs" />
                  </Button>
                </div>
              </div>
            </div>

            <div v-if="selectedConversation && historyMessages.length > 0" class="space-y-2">
              <label class="text-sm font-medium text-muted-foreground block">
                Mensajes ({{ historyMessages.length }})
              </label>
              <div class="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white/30 dark:bg-navy-900/30 backdrop-blur-sm rounded-xl border border-white/10">
                <div
                  v-for="(msg, idx) in historyMessages"
                  :key="idx"
                  :class="[
                    'p-2 rounded-lg text-xs',
                    msg.sender_type === 'user'
                      ? 'ml-4 bg-violet-100/60 dark:bg-violet-900/30'
                      : msg.sender_type === 'assistant'
                        ? 'mr-4 bg-white/60 dark:bg-navy-800/60'
                        : 'mx-auto bg-gray-200/60 dark:bg-navy-700/60 text-center'
                  ]"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <Badge
                      :variant="msg.sender_type === 'user' ? 'success' : msg.sender_type === 'assistant' ? 'info' : 'secondary'"
                      class="text-[0.6rem] px-1.5 py-0"
                    >
                      {{ msg.sender_type }}
                    </Badge>
                    <span class="text-muted-foreground text-xs">{{ formatDateTime(msg.created_at) }}</span>
                  </div>
                  <div class="whitespace-pre-wrap break-words text-foreground">{{ msg.content }}</div>
                </div>
              </div>
            </div>

            <div
              v-if="!isLoadingHistory && conversationHistory.length === 0"
              class="text-center text-muted-foreground py-6"
            >
              <i class="pi pi-history text-2xl mb-2 block" />
              <p class="text-sm">Presiona "Cargar" para ver historial</p>
            </div>

            <div v-if="isLoadingHistory" class="text-center py-6">
              <i class="pi pi-spin pi-spinner text-2xl text-violet-500" />
            </div>

            <Button
              v-if="conversationHistory.length > 0"
              variant="destructive"
              size="sm"
              class="w-full"
              :loading="isDeletingHistory"
              @click="emit('deleteHistory')"
            >
              <i class="pi pi-trash mr-2" />
              Eliminar Todo
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>
