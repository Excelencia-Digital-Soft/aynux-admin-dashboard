<script setup lang="ts">
import { useChatVisualizer } from '@/composables/useChatVisualizer'
import GraphVisualization from '@/components/chat/GraphVisualization.vue'
import ConversationHistory from '@/components/chat/ConversationHistory.vue'
import ReasoningDisplay from '@/components/chat/ReasoningDisplay.vue'
import MetricsPanel from '@/components/chat/MetricsPanel.vue'
import WebhookSimulationPanel from '@/components/chat/WebhookSimulationPanel.vue'
import WebhookQuickConfig from '@/components/chat/WebhookQuickConfig.vue'
import {
  Plus, Trash2, Settings, Network, List, BarChart3, Zap
} from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

const {
  activeTab,
  debugMode,
  showSettings,
  useStreaming,
  store,
  sendMessage,
  handleMessageClick,
  handleNodeClick,
  handleButtonClick,
  handleListSelect,
  clearChat,
  newThread,
  closeSettings,
  clearError
} = useChatVisualizer()

function openWebhookConfig() {
  activeTab.value = '3'
}
</script>

<template>
  <div class="chat-visualizer-page h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Chat Visualizer</h1>
        <p class="text-muted-foreground mt-1">
          Interfaz interactiva para probar y visualizar el agente
        </p>
      </div>
      <div class="flex gap-2">
        <WebhookQuickConfig @open-full-config="openWebhookConfig" />
        <Button variant="secondary" size="sm" @click="newThread">
          <Plus class="mr-2 h-3.5 w-3.5" />
          Nueva
        </Button>
        <Button variant="secondary" size="sm" @click="clearChat">
          <Trash2 class="mr-2 h-3.5 w-3.5" />
          Limpiar
        </Button>
        <Button variant="secondary" size="sm" @click="showSettings = true">
          <Settings class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Error message -->
    <Alert v-if="store.error" variant="destructive" class="mb-4">
      <AlertDescription class="flex items-center justify-between">
        <span>{{ store.error }}</span>
        <Button variant="ghost" size="sm" @click="clearError" class="ml-2 h-6 px-2 text-xs">
          Cerrar
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Main content - Flex split layout -->
    <div class="flex gap-4" style="height: calc(100vh - 120px)">
      <!-- Left panel: Chat (40%) -->
      <div class="w-2/5 min-w-[300px]">
        <Card class="h-full">
          <CardContent class="h-full p-0">
            <ConversationHistory
              :max-height="'calc(100vh - 180px)'"
              @send="sendMessage"
              @message-click="handleMessageClick"
              @button-click="handleButtonClick"
              @list-select="handleListSelect"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Right panel: Visualization (60%) -->
      <div class="w-3/5 min-w-[400px]">
        <Card class="h-full">
          <CardContent class="h-full p-0">
            <Tabs v-model="activeTab" class="h-full flex flex-col">
              <TabsList class="w-full justify-start rounded-none border-b bg-transparent px-2 pt-2">
                <TabsTrigger value="0" class="gap-1.5">
                  <Network class="h-3.5 w-3.5" />
                  Grafo
                </TabsTrigger>
                <TabsTrigger value="1" class="gap-1.5">
                  <List class="h-3.5 w-3.5" />
                  Razonamiento
                </TabsTrigger>
                <TabsTrigger value="2" class="gap-1.5">
                  <BarChart3 class="h-3.5 w-3.5" />
                  Metricas
                </TabsTrigger>
                <TabsTrigger value="3" class="gap-1.5">
                  <Zap class="h-3.5 w-3.5" />
                  Webhook
                  <Badge
                    v-if="store.webhookSimulation.enabled"
                    variant="success"
                    class="ml-1 text-[0.6rem] px-1.5 py-0"
                  >
                    ON
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <div class="flex-1 overflow-auto p-2">
                <TabsContent value="0" class="h-full mt-0">
                  <GraphVisualization
                    height="calc(100vh - 220px)"
                    :show-minimap="true"
                    :show-controls="true"
                    @node-click="handleNodeClick"
                  />
                </TabsContent>
                <TabsContent value="1" class="mt-0">
                  <ReasoningDisplay :max-height="'calc(100vh - 220px)'" />
                </TabsContent>
                <TabsContent value="2" class="mt-0">
                  <MetricsPanel />
                </TabsContent>
                <TabsContent value="3" class="mt-0">
                  <WebhookSimulationPanel />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Settings dialog -->
    <Dialog v-model:open="showSettings">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configuracion</DialogTitle>
          <DialogDescription class="sr-only">Opciones de configuracion del chat visualizer</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="flex items-center gap-3">
            <Checkbox
              :checked="debugMode"
              @update:checked="(val: boolean) => { debugMode = val }"
            />
            <label class="text-sm cursor-pointer" @click="debugMode = !debugMode">
              Modo debug (muestra pasos de ejecucion)
            </label>
          </div>

          <div class="flex items-center gap-3">
            <Checkbox
              :checked="useStreaming"
              @update:checked="(val: boolean) => { useStreaming = val }"
            />
            <label class="text-sm cursor-pointer" @click="useStreaming = !useStreaming">
              Usar streaming (respuesta en tiempo real)
            </label>
          </div>

          <Alert variant="info">
            <AlertDescription class="text-sm">
              El modo debug proporciona informacion detallada sobre cada paso del agente, pero puede ser mas lento.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="secondary" @click="closeSettings">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.chat-visualizer-page :deep([data-radix-collection-item]) {
  flex-shrink: 0;
}
</style>
