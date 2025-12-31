<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { chatApi } from '@/api/chat.api'
import { useToast } from '@/composables/useToast'
import GraphVisualization from '@/components/chat/GraphVisualization.vue'
import ConversationHistory from '@/components/chat/ConversationHistory.vue'
import ReasoningDisplay from '@/components/chat/ReasoningDisplay.vue'
import MetricsPanel from '@/components/chat/MetricsPanel.vue'
import WebhookSimulationPanel from '@/components/chat/WebhookSimulationPanel.vue'
import type { ConversationMessage } from '@/types/chat.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const store = useChatStore()
const toast = useToast()

const activeTab = ref('0')
const debugMode = ref(true)
const showSettings = ref(false)
const useStreaming = ref(false)

async function handleSendMessage(message: string) {
  store.clearExecutionState()
  store.setLoading(true)
  store.setError(null)

  try {
    // IMPORTANT: Create/get thread BEFORE adding user message
    // Otherwise createNewThread() will reset currentMessages and lose the user message
    let threadId = store.activeThreadId
    if (!threadId) {
      threadId = store.createNewThread()
    }

    // Add user message AFTER thread is set up
    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    store.addMessage(userMessage)

    // Check if webhook simulation mode is enabled
    if (store.webhookSimulation.enabled) {
      // Use webhook simulation endpoint (process_webhook_message flow)
      const result = await chatApi.testWebhookSimulation({
        message,
        phone_number: store.webhookSimulation.phoneNumber,
        user_name: store.webhookSimulation.userName,
        business_domain: store.webhookSimulation.businessDomain,
        session_id: threadId,
        debug: debugMode.value
      })

      const assistantMessage: ConversationMessage = {
        id: result.session_id || crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString()
      }
      store.addMessage(assistantMessage)

      if (result.execution_steps) {
        store.setExecutionSteps(result.execution_steps)
      }
    } else if (useStreaming.value) {
      // Streaming mode
      store.startStreaming()

      const response = await chatApi.sendMessageStream(
        { message, thread_id: threadId },
        (chunk) => store.appendStreamContent(chunk),
        (step) => store.addExecutionStep(step)
      )

      store.endStreaming()
      store.addMessage(response.message)

      if (response.execution_steps) {
        store.setExecutionSteps(response.execution_steps)
      }
      if (response.agent_state) {
        store.setAgentState(response.agent_state)
      }
    } else {
      // Non-streaming with debug
      if (debugMode.value) {
        const result = await chatApi.testAgent({
          message,
          debug: true,
          session_id: threadId
        })

        // Backend returns response as string, not object
        const assistantMessage: ConversationMessage = {
          id: result.session_id || crypto.randomUUID(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString()
        }
        store.addMessage(assistantMessage)

        if (result.execution_steps) {
          store.setExecutionSteps(result.execution_steps)
        }
      } else {
        const response = await chatApi.sendMessage({
          message,
          thread_id: threadId
        })

        store.addMessage(response.message)

        if (response.execution_steps) {
          store.setExecutionSteps(response.execution_steps)
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    store.setError(errorMessage)
    toast.error(`Error: ${errorMessage}`)

    // Add error step
    store.addExecutionStep({
      id: crypto.randomUUID(),
      step_number: store.executionSteps.length + 1,
      node_type: 'error',
      name: 'Error',
      description: errorMessage,
      status: 'error',
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    })
  } finally {
    store.setLoading(false)
  }
}

function handleMessageClick(message: ConversationMessage) {
  // Could load execution steps for this specific message
  console.log('Message clicked:', message.id)
}

function handleNodeClick(nodeId: string) {
  // Already handled by store.selectNode in GraphVisualization
  // Switch to reasoning tab to show details
  activeTab.value = '1'
}

async function handleClearChat() {
  store.clearAllThreads()
  store.clearExecutionState()
  toast.info('Conversacion limpiada')
}

async function handleNewThread() {
  store.createNewThread()
  store.clearExecutionState()
  toast.info('Nueva conversacion iniciada')
}

async function loadMetrics() {
  try {
    const metrics = await chatApi.getMetrics({ days: 7 })
    store.setSessionMetrics(metrics)
  } catch (error) {
    console.error('Error loading metrics:', error)
  }
}

onMounted(() => {
  loadMetrics()
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<template>
  <div class="chat-visualizer-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Chat Visualizer</h1>
        <p class="text-gray-500 mt-1">
          Interfaz interactiva para probar y visualizar el agente
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          icon="pi pi-plus"
          label="Nueva"
          severity="secondary"
          size="small"
          @click="handleNewThread"
        />
        <Button
          icon="pi pi-trash"
          label="Limpiar"
          severity="secondary"
          size="small"
          @click="handleClearChat"
        />
        <Button
          icon="pi pi-cog"
          severity="secondary"
          size="small"
          @click="showSettings = true"
        />
      </div>
    </div>

    <!-- Error message -->
    <Message v-if="store.error" severity="error" :closable="true" @close="store.setError(null)" class="mb-4">
      {{ store.error }}
    </Message>

    <!-- Main content -->
    <Splitter class="main-splitter" style="height: calc(100vh - 120px)">
      <!-- Left panel: Chat -->
      <SplitterPanel :size="40" :minSize="30">
        <Card class="h-full chat-card">
          <template #content>
            <ConversationHistory
              :max-height="'calc(100vh - 180px)'"
              @send="handleSendMessage"
              @message-click="handleMessageClick"
            />
          </template>
        </Card>
      </SplitterPanel>

      <!-- Right panel: Visualization -->
      <SplitterPanel :size="60" :minSize="40">
        <Card class="h-full visualization-card">
          <template #content>
            <Tabs v-model:value="activeTab" class="h-full">
              <TabList>
                <Tab value="0">
                  <i class="pi pi-sitemap mr-2" />
                  Grafo
                </Tab>
                <Tab value="1">
                  <i class="pi pi-list mr-2" />
                  Razonamiento
                </Tab>
                <Tab value="2">
                  <i class="pi pi-chart-bar mr-2" />
                  Metricas
                </Tab>
                <Tab value="3">
                  <i class="pi pi-bolt mr-2" />
                  Webhook
                  <Tag
                    v-if="store.webhookSimulation.enabled"
                    value="ON"
                    severity="success"
                    class="ml-2 text-xs"
                    style="font-size: 0.65rem; padding: 0.1rem 0.3rem;"
                  />
                </Tab>
              </TabList>
              <TabPanels class="tab-panels-container">
                <TabPanel value="0">
                  <GraphVisualization
                    height="calc(100vh - 220px)"
                    :show-minimap="true"
                    :show-controls="true"
                    @node-click="handleNodeClick"
                  />
                </TabPanel>
                <TabPanel value="1">
                  <ReasoningDisplay :max-height="'calc(100vh - 220px)'" />
                </TabPanel>
                <TabPanel value="2">
                  <MetricsPanel />
                </TabPanel>
                <TabPanel value="3">
                  <WebhookSimulationPanel />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </template>
        </Card>
      </SplitterPanel>
    </Splitter>

    <!-- Settings dialog -->
    <Dialog
      v-model:visible="showSettings"
      header="Configuracion"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <Checkbox v-model="debugMode" :binary="true" inputId="debugMode" />
          <label for="debugMode" class="text-sm">
            Modo debug (muestra pasos de ejecucion)
          </label>
        </div>

        <div class="flex items-center gap-3">
          <Checkbox v-model="useStreaming" :binary="true" inputId="useStreaming" />
          <label for="useStreaming" class="text-sm">
            Usar streaming (respuesta en tiempo real)
          </label>
        </div>

        <Message severity="info" :closable="false" class="text-sm">
          El modo debug proporciona informacion detallada sobre cada paso del agente, pero puede ser mas lento.
        </Message>
      </div>

      <template #footer>
        <Button label="Cerrar" severity="secondary" @click="showSettings = false" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.chat-visualizer-page {
  height: 100%;
}

.main-splitter {
  border: none;
}

.chat-card,
.visualization-card {
  height: 100%;
}

.chat-card :deep(.p-card-content),
.visualization-card :deep(.p-card-content) {
  height: 100%;
  padding: 0;
}

.visualization-card :deep(.p-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.visualization-card :deep(.p-tabpanels) {
  flex: 1;
  padding: 0.5rem;
  overflow: auto;
}

.visualization-card :deep(.p-tabpanel) {
  height: 100%;
}

:deep(.p-splitter-gutter) {
  background: #e2e8f0;
}

:deep(.p-splitter-gutter-handle) {
  background: #94a3b8;
}
</style>
