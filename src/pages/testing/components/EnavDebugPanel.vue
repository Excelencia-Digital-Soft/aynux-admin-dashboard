<script setup lang="ts">
import { computed } from 'vue'
import type { EnavWebhookConfig } from '@/composables/useEnavTesting'
import type { ExecutionStep } from '@/types/chat.types'
import {
  RefreshCw, Zap, Info, List, Network, Trash2
} from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

const props = defineProps<{
  webhookConfig: EnavWebhookConfig
  hasSession: boolean
  sessionId: string | null
  messageCount: number
  executionSteps: ExecutionStep[]
  graphState: unknown
}>()

const emit = defineEmits<{
  'update-config': [updates: Partial<EnavWebhookConfig>]
  'clear-config': []
}>()

const PHONE_PRESETS = [
  { label: 'Default', value: '5493446405060' },
  { label: 'Test 1', value: '5493446000001' },
  { label: 'Test 2', value: '5493446000002' }
]

const isDefaultPhone = computed(() => props.webhookConfig.phoneNumber === '5493446405060')

function selectPreset(value: string) {
  if (!props.hasSession) {
    emit('update-config', { phoneNumber: value })
  }
}

function handleResetPhone() {
  if (!props.hasSession) {
    emit('update-config', { phoneNumber: '5493446405060' })
  }
}
</script>

<template>
  <Card>
    <CardContent class="p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="font-semibold text-sm">Panel de Debug</span>
      </div>

      <Tabs default-value="webhook">
        <TabsList class="w-full grid grid-cols-4">
          <TabsTrigger value="webhook" class="text-xs gap-1">
            <Zap class="h-3 w-3" />
            Webhook
          </TabsTrigger>
          <TabsTrigger value="session" class="text-xs gap-1">
            <Info class="h-3 w-3" />
            Sesion
          </TabsTrigger>
          <TabsTrigger value="steps" class="text-xs gap-1">
            <List class="h-3 w-3" />
            Pasos
          </TabsTrigger>
          <TabsTrigger value="state" class="text-xs gap-1">
            <Network class="h-3 w-3" />
            Estado
          </TabsTrigger>
        </TabsList>

        <!-- Webhook Config -->
        <TabsContent value="webhook">
          <div class="space-y-4 pt-2">
            <div class="flex items-center justify-between">
              <Alert variant="info" class="flex-1">
                <AlertDescription class="text-sm">
                  Simula el flujo de WhatsApp para
                  <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">ENAV</code>.
                </AlertDescription>
              </Alert>
              <Button
                variant="ghost"
                size="icon"
                class="ml-2 h-8 w-8"
                title="Limpiar config guardada"
                @click="emit('clear-config')"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            </div>

            <!-- Toggle -->
            <div class="flex items-center gap-3">
              <Checkbox
                :checked="webhookConfig.enabled"
                @update:checked="(val: boolean) => emit('update-config', { enabled: val })"
              />
              <label class="font-medium cursor-pointer text-sm" @click="emit('update-config', { enabled: !webhookConfig.enabled })">
                Activar Modo Webhook
              </label>
            </div>

            <!-- Config (visible cuando activo) -->
            <div v-if="webhookConfig.enabled" class="space-y-3 pl-4 border-l-2 border-purple-300 ml-2">
              <div>
                <label class="text-sm text-muted-foreground block mb-1">Telefono simulado</label>
                <div class="flex gap-2">
                  <Input
                    :model-value="webhookConfig.phoneNumber"
                    @input="(e: Event) => emit('update-config', { phoneNumber: (e.target as HTMLInputElement).value })"
                    class="flex-1"
                    placeholder="5493446405060"
                    :disabled="hasSession"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    class="h-9 w-9"
                    @click="handleResetPhone"
                    :disabled="hasSession || isDefaultPhone"
                    title="Restaurar default"
                  >
                    <RefreshCw class="h-3.5 w-3.5" />
                  </Button>
                </div>

                <!-- Phone Presets -->
                <div class="flex flex-wrap gap-1 mt-2">
                  <Badge
                    v-for="preset in PHONE_PRESETS"
                    :key="preset.value"
                    :variant="webhookConfig.phoneNumber === preset.value ? 'success' : 'secondary'"
                    :class="`cursor-pointer text-xs ${hasSession ? 'opacity-50' : ''}`"
                    @click="selectPreset(preset.value)"
                  >
                    {{ preset.label }}
                  </Badge>
                </div>
              </div>

              <div>
                <label class="text-sm text-muted-foreground block mb-1">Nombre usuario</label>
                <Input
                  :model-value="webhookConfig.userName"
                  @input="(e: Event) => emit('update-config', { userName: (e.target as HTMLInputElement).value })"
                  class="w-full"
                  placeholder="Test Vinatero"
                  :disabled="hasSession"
                />
              </div>

              <div>
                <label class="text-sm text-muted-foreground block mb-1">Dominio</label>
                <div class="flex items-center gap-2">
                  <Badge variant="info">ENAV</Badge>
                  <span class="text-xs text-muted-foreground">(DDJJ/CIU)</span>
                </div>
              </div>

              <!-- Toggle: Simular Bypass Rules -->
              <div class="flex items-center gap-3 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Checkbox
                  :checked="webhookConfig.simulateBypass"
                  @update:checked="(val: boolean) => emit('update-config', { simulateBypass: val })"
                />
                <div @click="emit('update-config', { simulateBypass: !webhookConfig.simulateBypass })" class="cursor-pointer">
                  <label class="font-medium cursor-pointer text-sm">Simular Bypass Rules</label>
                  <small class="block text-muted-foreground">
                    Usa bypass rules para auto-poblar phone/DID
                  </small>
                </div>
              </div>

              <!-- Bypass Rules Section -->
              <div v-if="webhookConfig.simulateBypass" class="space-y-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div>
                  <label class="text-sm text-muted-foreground block mb-1">DID (Bot Phone)</label>
                  <Input
                    :model-value="webhookConfig.did || ''"
                    @input="(e: Event) => emit('update-config', { did: (e.target as HTMLInputElement).value || null })"
                    class="w-full"
                    placeholder="5493446405060"
                    :disabled="hasSession"
                  />
                  <small class="text-muted-foreground text-xs">
                    Numero del bot para bypass rules tipo whatsapp_phone_number_id
                  </small>
                </div>
              </div>

              <!-- Manual Overrides -->
              <div v-if="!webhookConfig.simulateBypass" class="space-y-3 p-3 bg-muted/50 rounded-lg">
                <p class="text-xs text-muted-foreground font-medium">Overrides manuales (opcional)</p>
                <div>
                  <label class="text-sm text-muted-foreground block mb-1">Organization ID</label>
                  <Input
                    :model-value="webhookConfig.organizationId || ''"
                    @input="(e: Event) => emit('update-config', { organizationId: (e.target as HTMLInputElement).value || null })"
                    class="w-full"
                    placeholder="UUID de organizacion"
                    :disabled="hasSession"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Session Info -->
        <TabsContent value="session">
          <div class="space-y-4 pt-2">
            <div>
              <label class="block text-sm font-medium text-muted-foreground">Session ID</label>
              <code class="text-xs break-all bg-muted px-2 py-1 rounded block mt-1">
                {{ sessionId || 'N/A' }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Telefono</label>
              <code class="text-xs break-all bg-muted px-2 py-1 rounded block mt-1">
                {{ webhookConfig.phoneNumber }}
              </code>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Mensajes</label>
              <Badge variant="info" class="mt-1">{{ messageCount }} mensajes</Badge>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted-foreground">Dominio</label>
              <Badge variant="info" class="mt-1">enav</Badge>
            </div>
          </div>
        </TabsContent>

        <!-- Execution Steps -->
        <TabsContent value="steps">
          <div v-if="executionSteps.length === 0" class="text-center text-muted-foreground py-4">
            <List class="h-6 w-6 mx-auto mb-2" />
            <p class="text-sm">Sin pasos de ejecucion</p>
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto pt-2">
            <div
              v-for="(step, idx) in executionSteps"
              :key="idx"
              class="p-2 bg-muted/50 rounded text-xs"
            >
              <pre class="overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
            </div>
          </div>
        </TabsContent>

        <!-- Graph State -->
        <TabsContent value="state">
          <div v-if="!graphState" class="text-center text-muted-foreground py-4">
            <Network class="h-6 w-6 mx-auto mb-2" />
            <p class="text-sm">Sin estado de grafo</p>
          </div>

          <div v-else class="max-h-64 overflow-y-auto pt-2">
            <pre class="text-xs bg-muted/50 p-2 rounded">{{
              JSON.stringify(graphState, null, 2)
            }}</pre>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>

<style scoped>
code {
  font-family: monospace;
  font-size: 0.85em;
}
</style>
