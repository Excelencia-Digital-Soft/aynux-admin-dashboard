<template>
  <div class="intent-configs-page">
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
      </div>
    </div>

    <!-- Graph Component -->
    <IntentConfigGraph class="graph-container" />

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
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'

import { IntentConfigGraph, IntentTestPanel } from '@/components/intent-configs'

// Dialogs
const showHelpDialog = ref(false)
const showTestDialog = ref(false)
</script>

<style scoped>
.intent-configs-page {
  padding: 1.5rem;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 0;
}

.mr-2 {
  margin-right: 0.5rem;
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
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
