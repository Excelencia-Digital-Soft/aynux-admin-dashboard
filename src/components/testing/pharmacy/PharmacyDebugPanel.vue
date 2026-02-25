<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PharmacyWebhookPanel from '@/components/pharmacy/PharmacyWebhookPanel.vue'
import type { StreamMetadata } from '@/composables/usePharmacyStream'

const props = defineProps<{
  webhookConfig: any
  hasSession: boolean
  defaultPhone: string
  sessionId: string | null
  selectedPharmacy: any
  messageCount: number
  useStreaming: boolean
  isStreaming: boolean
  currentPhase: string | null
  currentAgent: string | null
  streamProgress: number
  streamMetadata: StreamMetadata
  executionSteps: any[]
  graphState: any
  conversationHistory: any[]
  selectedConversation: any
  historyMessages: any[]
  isLoadingHistory: boolean
  isDeletingHistory: boolean
}>()

const emit = defineEmits<{
  (e: 'update:webhookConfig', value: any): void
  (e: 'update:useStreaming', value: boolean): void
  (e: 'fetchHistory'): void
  (e: 'selectConversation', conv: any): void
  (e: 'deleteConversation', conv: any): void
  (e: 'deleteHistory'): void
}>()

function getPhaseLabel(phase: string | null): string {
  const labels: Record<string, string> = {
    thinking: 'Analizando',
    processing: 'Procesando',
    generating: 'Generando',
    complete: 'Completado',
    error: 'Error'
  }
  return phase ? labels[phase] || phase : ''
}

function getPhaseBadgeVariant(phase: string | null): 'info' | 'warning' | 'success' | 'destructive' | 'secondary' {
  const variants: Record<string, 'info' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
    thinking: 'info',
    processing: 'warning',
    generating: 'success',
    complete: 'success',
    error: 'destructive'
  }
  return phase ? variants[phase] || 'secondary' : 'secondary'
}

function formatDateTime(timestamp: string): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <Card class="glass-card">
    <CardContent class="pt-6">
      <div class="flex items-center gap-2 mb-4">
        <i class="pi pi-code text-foreground" />
        <span class="font-semibold text-foreground">Panel de Debug</span>
      </div>

      <Tabs default-value="webhook">
        <TabsList class="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="webhook" class="text-xs">
            <div class="flex items-center gap-1">
              <i class="pi pi-bolt" />
              <span>Webhook</span>
              <Badge
                v-if="webhookConfig.enabled"
                variant="success"
                class="ml-1 text-[0.65rem] px-1 py-0"
              >
                ON
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="session" class="text-xs">
            <div class="flex items-center gap-1">
              <i class="pi pi-info-circle" />
              <span>Sesión</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="steps" class="text-xs">
            <div class="flex items-center gap-1">
              <i class="pi pi-list" />
              <span>Pasos</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="state" class="text-xs">
            <div class="flex items-center gap-1">
              <i class="pi pi-sitemap" />
              <span>Estado</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="history" class="text-xs">
            <div class="flex items-center gap-1">
              <i class="pi pi-history" />
              <span>Historial</span>
              <Badge
                v-if="conversationHistory.length"
                variant="info"
                class="ml-1 text-[0.65rem] px-1 py-0"
              >
                {{ conversationHistory.length }}
              </Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <!-- Webhook Config -->
        <TabsContent value="webhook">
          <PharmacyWebhookPanel
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
              <code class="text-xs break-all bg-muted px-2 py-1 rounded block mt-1">
                {{ sessionId || 'N/A' }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Teléfono</label>
              <code class="text-xs break-all bg-muted px-2 py-1 rounded block mt-1">
                {{ webhookConfig.phoneNumber }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Farmacia</label>
              <p class="text-sm mt-1 text-foreground">{{ selectedPharmacy?.name || 'No seleccionada' }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Mensajes</label>
              <Badge variant="info" class="mt-1">{{ messageCount }} mensajes</Badge>
            </div>

            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-muted-foreground">Modo Streaming</label>
              <div class="flex items-center gap-2">
                <Badge :variant="useStreaming ? 'success' : 'secondary'">
                  {{ useStreaming ? 'Activo' : 'Inactivo' }}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  @click="emit('update:useStreaming', !useStreaming)"
                >
                  <i :class="useStreaming ? 'pi pi-pause' : 'pi pi-play'" class="text-sm" />
                </Button>
              </div>
            </div>

            <!-- Streaming state display -->
            <div v-if="isStreaming" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div class="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Estado del Stream
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Fase:</span>
                  <Badge :variant="getPhaseBadgeVariant(currentPhase)">
                    {{ getPhaseLabel(currentPhase) }}
                  </Badge>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Agente:</span>
                  <span class="font-mono text-foreground">{{ currentAgent || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Progreso:</span>
                  <span class="text-foreground">{{ Math.round(streamProgress * 100) }}%</span>
                </div>
                <div v-if="streamMetadata.bypass_matched" class="flex justify-between">
                  <span class="text-muted-foreground">Bypass:</span>
                  <Badge variant="info">Matched</Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Execution Steps -->
        <TabsContent value="steps">
          <div v-if="executionSteps.length === 0" class="text-center text-muted-foreground py-4">
            <i class="pi pi-list text-2xl mb-2" />
            <p class="text-sm">Sin pasos de ejecución</p>
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto p-3">
            <div
              v-for="(step, idx) in executionSteps"
              :key="idx"
              class="p-2 bg-muted rounded text-xs"
            >
              <pre class="overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
            </div>
          </div>
        </TabsContent>

        <!-- Graph State -->
        <TabsContent value="state">
          <div v-if="!graphState && !streamMetadata.graph_state" class="text-center text-muted-foreground py-4">
            <i class="pi pi-sitemap text-2xl mb-2" />
            <p class="text-sm">Sin estado de grafo</p>
          </div>

          <div v-else class="max-h-64 overflow-y-auto p-3">
            <pre class="text-xs bg-muted p-2 rounded">{{
              JSON.stringify(streamMetadata.graph_state || graphState, null, 2)
            }}</pre>
          </div>
        </TabsContent>

        <!-- Message History -->
        <TabsContent value="history">
          <div class="p-3 space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-sm">
                <span class="text-muted-foreground">Teléfono:</span>
                <code class="ml-2 text-xs">{{ webhookConfig.phoneNumber }}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="emit('fetchHistory')"
                :disabled="isLoadingHistory"
              >
                <i v-if="isLoadingHistory" class="pi pi-spin pi-spinner mr-1" />
                <i v-else class="pi pi-refresh mr-1" />
                Cargar
              </Button>
            </div>

            <div v-if="conversationHistory.length > 0" class="space-y-2">
              <label class="text-sm font-medium text-muted-foreground block">
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
                      : 'bg-muted hover:bg-muted/80'
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
                    size="icon"
                    class="h-6 w-6 text-destructive hover:text-destructive"
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
              <div class="max-h-40 overflow-y-auto space-y-1 p-2 bg-muted rounded">
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
                    <Badge
                      :variant="msg.sender_type === 'user' ? 'success' : msg.sender_type === 'assistant' ? 'info' : 'secondary'"
                      class="text-[0.6rem] px-1 py-0"
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
              class="text-center text-muted-foreground py-4"
            >
              <i class="pi pi-history text-2xl mb-2" />
              <p class="text-sm">Presiona "Cargar" para ver historial</p>
            </div>

            <div v-if="isLoadingHistory" class="text-center py-4">
              <div class="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>

            <Button
              v-if="conversationHistory.length > 0"
              variant="destructive"
              size="sm"
              class="w-full"
              @click="emit('deleteHistory')"
              :disabled="isDeletingHistory"
            >
              <i v-if="isDeletingHistory" class="pi pi-spin pi-spinner mr-2" />
              <i v-else class="pi pi-trash mr-2" />
              Eliminar Todo
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>
