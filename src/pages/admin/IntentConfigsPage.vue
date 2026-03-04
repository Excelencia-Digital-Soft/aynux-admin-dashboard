<template>
  <div class="intent-configs-page" :class="{ 'simulator-open': showSimulator }">
    <!-- Main content area -->
    <div class="page-main">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-share-alt mr-2"></i>
            LangGraph Topology
          </h1>
          <p class="text-muted">Visualiza y configura la topologia del grafo de agentes</p>
        </div>
        <div class="header-right">
          <Button
            icon="pi pi-question-circle"
            severity="info"
            text
            rounded
            @click="showHelpDialog = true"
            v-tooltip="'Como funciona?'"
          />
          <Button
            icon="pi pi-play"
            severity="success"
            text
            rounded
            @click="showTestDialog = true"
            v-tooltip="'Probar intent detection'"
          />
          <Button
            :icon="showSimulator ? 'pi pi-times' : 'pi pi-comments'"
            :severity="showSimulator ? 'danger' : 'warning'"
            text
            rounded
            @click="showSimulator = !showSimulator"
            v-tooltip="showSimulator ? 'Cerrar simulador' : 'Abrir simulador'"
          />
        </div>
      </div>

      <!-- Graph Component -->
      <IntentConfigGraph
        class="graph-container"
        height="400px"
        :highlighted-node-id="simulatorHighlightedNodeId"
        @domain-change="currentDomain = $event"
        @topology-loaded="currentTopology = $event"
        @node-select="selectedGraphNodeId = $event"
      />

      <!-- Config Tabs -->
      <Tabs default-value="intents" class="config-tabs">
        <TabsList>
          <TabsTrigger value="intents">
            <i class="pi pi-list mr-1" /> Intents
          </TabsTrigger>
          <TabsTrigger value="responses">
            <i class="pi pi-comment mr-1" /> Respuestas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intents" class="mt-4 space-y-4">
          <div class="rounded-lg border border-blue-200/50 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-950/30">
            <p class="text-sm text-blue-800 dark:text-blue-300">
              <i class="pi pi-info-circle mr-1" />
              <strong>Intents</strong> definen que quiere hacer el usuario. Cada intent tiene patrones de deteccion (lemmas, frases, keywords) que spaCy usa para clasificar mensajes entrantes.
              Cuando un mensaje coincide con un patron, el router dirige la conversacion al nodo correspondiente del grafo.
            </p>
          </div>
          <DomainIntentsPanel :domain="currentDomain" />
        </TabsContent>

        <TabsContent value="responses" class="mt-4 space-y-4">
          <div class="rounded-lg border border-purple-200/50 bg-purple-50/50 p-3 dark:border-purple-500/20 dark:bg-purple-950/30">
            <p class="text-sm text-purple-800 dark:text-purple-300">
              <i class="pi pi-info-circle mr-1" />
              <strong>Respuestas</strong> configuran como el agente responde a cada intent detectado. Cada config inyecta una instruccion al LLM (task_description) y define un template de fallback para cuando el LLM no esta disponible.
              Las configs marcadas como <em>criticas</em> siempre usan el template fijo, sin pasar por el LLM.
            </p>
          </div>
          <ResponseConfigsPanel
            :domain="currentDomain"
            :node-map="intentToNodeMap"
            :node-filter-options="nodeFilterOptions"
            :selected-node-id="selectedGraphNodeId"
          />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Simulator Panel (slide-over) -->
    <Transition name="slide">
      <div v-if="showSimulator" class="simulator-sidebar">
        <SimulatorPanel
          ref="simulatorPanelRef"
          :domain="currentDomain"
          @close="showSimulator = false"
        />
      </div>
    </Transition>

    <!-- Test Dialog -->
    <Dialog
      v-model:visible="showTestDialog"
      header="Probar Intent Detection"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <IntentTestPanel />
    </Dialog>

    <!-- Help Dialog -->
    <Dialog
      v-model:visible="showHelpDialog"
      header="Como funciona el LangGraph Topology Editor?"
      :modal="true"
      :style="{ width: '700px' }"
      :maximizable="true"
    >
      <div class="help-content">
        <h4>Arquitectura del Grafo</h4>
        <p>El grafo visualiza la topologia real del LangGraph (graph_v2.py):</p>
        <ul>
          <li><strong>START</strong>: Punto de entrada del grafo</li>
          <li><strong>Router Supervisor</strong>: Enruta mensajes usando matchers de prioridad (AwaitedInput > GlobalKeyword > ButtonMapping > LLM)</li>
          <li><strong>Action Nodes</strong>: Auth Plex, Debt Manager, Payment Processor, Account Switcher, Info Node</li>
          <li><strong>Response Formatter</strong>: Formatea respuestas finales con botones/listas WhatsApp</li>
          <li><strong>END</strong>: Fin del turno de conversacion</li>
        </ul>

        <h4>Conexiones</h4>
        <ul>
          <li><strong>Linea solida</strong>: Conexion directa (siempre se sigue)</li>
          <li><strong>Linea animada</strong>: Conexion condicional (depende del estado)</li>
        </ul>

        <h4>Configuracion</h4>
        <ul>
          <li><strong>Click en nodo</strong>: Abre el panel de detalles en el drawer lateral</li>
          <li><strong>Routing Configs</strong>: Configuran como el Router decide a que nodo ir</li>
          <li><strong>Awaiting Types</strong>: Definen que tipo de input espera cada nodo</li>
        </ul>

        <h4>Interaccion</h4>
        <ul>
          <li><strong>Zoom/Pan</strong>: Controles en la esquina superior derecha o scroll del mouse</li>
          <li><strong>Minimap</strong>: Navegacion rapida en la esquina inferior derecha</li>
          <li><strong>Dominio</strong>: Selector para cambiar entre dominios disponibles</li>
        </ul>
      </div>
    </Dialog>

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import { IntentConfigGraph, IntentTestPanel } from '@/components/intent-configs'
import DomainIntentsPanel from '@/pages/admin/DomainIntentsPanel.vue'
import ResponseConfigsPanel from '@/pages/admin/ResponseConfigsPanel.vue'
import { SimulatorPanel } from '@/components/simulator'
import type { GraphTopologyResponse } from '@/types/graphTopology.types'

// State
const showHelpDialog = ref(false)
const showTestDialog = ref(false)
const showSimulator = ref(false)
const currentDomain = ref<string | null>('pharmacy')

// Topology state for node-response association
const currentTopology = ref<GraphTopologyResponse | null>(null)
const selectedGraphNodeId = ref<string | null>(null)

// Simulator panel ref for accessing highlightedNodeId
const simulatorPanelRef = ref<InstanceType<typeof SimulatorPanel> | null>(null)

const simulatorHighlightedNodeId = computed(() => {
  return simulatorPanelRef.value?.highlightedNodeId ?? null
})

/**
 * Maps each response intent_key to its owning node's id and display_name.
 * First node encountered wins if a key appears in multiple nodes.
 */
const intentToNodeMap = computed<Record<string, { nodeId: string; nodeDisplayName: string }>>(() => {
  if (!currentTopology.value) return {}
  const map: Record<string, { nodeId: string; nodeDisplayName: string }> = {}
  for (const node of currentTopology.value.nodes) {
    for (const key of node.response_keys ?? []) {
      if (map[key]) {
        console.warn(
          `[intentToNodeMap] Duplicate response_key "${key}" in nodes "${map[key].nodeDisplayName}" and "${node.display_name}". Keeping first.`
        )
        continue
      }
      map[key] = { nodeId: node.id, nodeDisplayName: node.display_name }
    }
  }
  return map
})

const nodeFilterOptions = computed(() => {
  if (!currentTopology.value) return []
  return currentTopology.value.nodes
    .filter(n => (n.response_keys ?? []).length > 0)
    .map(n => ({ id: n.id, label: n.display_name }))
})
</script>

<style scoped>
.intent-configs-page {
  padding: 1.5rem;
  display: flex;
  gap: 0;
  height: 100%;
  transition: all 0.3s ease;
}

.page-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.header-left .text-muted {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
}

.header-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.graph-container {
  flex-shrink: 0;
}

.config-tabs {
  flex: 1;
  min-height: 0;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* Simulator sidebar */
.simulator-sidebar {
  width: 380px;
  flex-shrink: 0;
  height: calc(100vh - 4rem);
  position: sticky;
  top: 2rem;
  margin-left: 1rem;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
  width: 0;
  margin-left: 0;
}

/* Help Dialog */
.help-content {
  line-height: 1.6;
}

.help-content h4 {
  margin: 1.5rem 0 0.75rem 0;
  font-size: 1rem;
  color: var(--text-color);
}

.help-content h4:first-child {
  margin-top: 0;
}

.help-content p,
.help-content ul {
  margin: 0 0 0.75rem 0;
  color: var(--text-color-secondary);
}

.help-content ul {
  padding-left: 1.5rem;
}

.help-content li {
  margin-bottom: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .intent-configs-page {
    padding: 1rem;
    flex-direction: column;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .simulator-sidebar {
    width: 100%;
    height: 50vh;
    position: relative;
    margin-left: 0;
    margin-top: 1rem;
  }
}
</style>
