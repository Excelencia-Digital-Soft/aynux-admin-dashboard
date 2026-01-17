<template>
  <div class="intent-configs-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="pi pi-cog mr-2"></i>
          Configuración de Intents
        </h1>
        <p class="text-muted">Configura intents, agentes y keywords en el grafo visual</p>
      </div>
      <div class="header-right">
        <Button
          icon="pi pi-question-circle"
          severity="info"
          text
          rounded
          @click="showHelpDialog = true"
          v-tooltip="'¿Cómo funciona?'"
        />
        <Button
          icon="pi pi-chart-bar"
          severity="secondary"
          text
          rounded
          @click="fetchCacheStats"
          :loading="loadingCacheStats"
          v-tooltip="'Estadísticas del cache'"
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

    <!-- Cache Stats Dialog -->
    <Dialog
      v-model:visible="showCacheStatsDialog"
      header="Estadísticas del Cache"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div v-if="cacheStats" class="cache-stats-content">
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-title">Memory Hits</span>
            <span class="stat-number">{{ cacheStats.memory_hits }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Memory Misses</span>
            <span class="stat-number">{{ cacheStats.memory_misses }}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-title">Memory Hit Rate</span>
            <span class="stat-number">{{ (cacheStats.memory_hit_rate * 100).toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Redis Hits</span>
            <span class="stat-number">{{ cacheStats.redis_hits }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Redis Misses</span>
            <span class="stat-number">{{ cacheStats.redis_misses }}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-title">Redis Hit Rate</span>
            <span class="stat-number">{{ (cacheStats.redis_hit_rate * 100).toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">DB Loads</span>
            <span class="stat-number">{{ cacheStats.db_loads }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Invalidaciones</span>
            <span class="stat-number">{{ cacheStats.invalidations }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-title">Orgs en Cache</span>
            <span class="stat-number">{{ cacheStats.cached_organizations }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" severity="secondary" @click="showCacheStatsDialog = false" />
      </template>
    </Dialog>

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
      header="¿Cómo funciona el sistema de intents?"
      :modal="true"
      :style="{ width: '700px' }"
      :maximizable="true"
    >
      <div class="help-content">
        <h4>Arquitectura del Grafo</h4>
        <p>El grafo visualiza la configuración de intents en 4 columnas:</p>
        <ul>
          <li><strong>Dominios</strong>: Agrupaciones de intents por área funcional (customer_service, sales, etc.)</li>
          <li><strong>Intents</strong>: Intenciones detectadas con patrones (lemmas, frases, keywords)</li>
          <li><strong>Agentes</strong>: Agentes de IA que manejan los intents (pueden ser Flow Agents)</li>
          <li><strong>Keywords</strong>: Palabras clave adicionales para activar agentes directamente</li>
        </ul>

        <h4>Estados de los Intents</h4>
        <ul>
          <li><span class="status-badge active">Activo</span> - Habilitado y mapeado a un agente</li>
          <li><span class="status-badge idle">Idle</span> - Habilitado pero sin uso reciente</li>
          <li><span class="status-badge unused">Sin usar</span> - Sin mapeo a agente</li>
          <li><span class="status-badge orphaned">Huérfano</span> - Mapeo sin intent correspondiente</li>
        </ul>

        <h4>Interacción</h4>
        <ul>
          <li><strong>Click en nodo</strong>: Abre el panel de detalles en el drawer lateral</li>
          <li><strong>Filtros</strong>: Filtra por dominio o estado desde la barra superior</li>
          <li><strong>Zoom/Pan</strong>: Usa los controles o el scroll del mouse</li>
          <li><strong>Minimap</strong>: Navegación rápida en la esquina inferior derecha</li>
        </ul>

        <h4>Flow Agents</h4>
        <p>
          Los agentes marcados como "Flow" permiten conversaciones multi-turno.
          Tienen configuración adicional como límite de turnos y timeout.
        </p>
      </div>
    </Dialog>

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'

import { IntentConfigGraph, IntentTestPanel } from '@/components/intent-configs'

import { domainIntentsApi } from '@/api/domainIntents.api'
import type { CacheStatsResponse } from '@/types/domainIntents.types'

const toast = useToast()

// Cache stats
const cacheStats = ref<CacheStatsResponse | null>(null)
const loadingCacheStats = ref(false)
const showCacheStatsDialog = ref(false)

// Dialogs
const showHelpDialog = ref(false)
const showTestDialog = ref(false)

// Cache operations
async function fetchCacheStats() {
  loadingCacheStats.value = true
  try {
    cacheStats.value = await domainIntentsApi.getCacheStats()
    showCacheStatsDialog.value = true
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las estadísticas del cache',
      life: 3000
    })
  } finally {
    loadingCacheStats.value = false
  }
}
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

/* Cache Stats Dialog */
.cache-stats-content {
  padding: 0.5rem 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-item.highlight {
  background: var(--primary-color);
  color: white;
}

.stat-item.highlight .stat-title {
  color: rgba(255, 255, 255, 0.8);
}

.stat-title {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.stat-number {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
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

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: var(--green-100);
  color: var(--green-700);
}

.status-badge.idle {
  background: var(--blue-100);
  color: var(--blue-700);
}

.status-badge.unused {
  background: var(--orange-100);
  color: var(--orange-700);
}

.status-badge.orphaned {
  background: var(--red-100);
  color: var(--red-700);
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

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
