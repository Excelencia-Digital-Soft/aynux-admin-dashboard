<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { agentApi } from '@/api/agent.api'
import { useToast } from '@/composables/useToast'
import type { AgentConfigResponse } from '@/types/agent.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Panel from 'primevue/panel'

const toast = useToast()

const isLoading = ref(false)
const config = ref<AgentConfigResponse | null>(null)

// Agent icons mapping
const agentIcons: Record<string, string> = {
  greeting_agent: 'pi-comments',
  support_agent: 'pi-headphones',
  fallback_agent: 'pi-question-circle',
  farewell_agent: 'pi-sign-out',
  excelencia_agent: 'pi-star',
  excelencia_invoice_agent: 'pi-file',
  excelencia_promotions_agent: 'pi-megaphone',
  data_insights_agent: 'pi-chart-bar'
}

// Agent descriptions
const agentDescriptions: Record<string, string> = {
  greeting_agent: 'Maneja saludos y bienvenida inicial',
  support_agent: 'Proporciona soporte y ayuda general',
  fallback_agent: 'Responde cuando no hay agente específico',
  farewell_agent: 'Maneja despedidas y cierre de conversación',
  excelencia_agent: 'Agente principal de Excelencia',
  excelencia_invoice_agent: 'Consultas de facturas y pagos',
  excelencia_promotions_agent: 'Información de promociones',
  data_insights_agent: 'Análisis de datos e insights'
}

const agentCount = computed(() => config.value?.enabled_agents?.length ?? 0)

function formatAgentName(agentId: string): string {
  return agentId
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getAgentIcon(agentId: string): string {
  return agentIcons[agentId] || 'pi-android'
}

function getAgentDescription(agentId: string): string {
  return agentDescriptions[agentId] || 'Agente del sistema'
}

async function fetchConfig() {
  isLoading.value = true
  try {
    config.value = await agentApi.getConfig()
    if (config.value) {
      toast.success('Configuración cargada')
    }
  } catch (error) {
    toast.error('Error al cargar configuración')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div class="agent-config-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Configuración de Agentes</h1>
        <p class="text-gray-500 mt-1">Ver los agentes activos del sistema</p>
      </div>
      <div class="flex items-center gap-3">
        <Tag
          v-if="config"
          :severity="config.system_initialized ? 'success' : 'warn'"
          :value="config.system_initialized ? 'Sistema Inicializado' : 'No Inicializado'"
          class="text-sm"
        />
        <Button
          icon="pi pi-refresh"
          label="Actualizar"
          severity="secondary"
          @click="fetchConfig"
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !config" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- No config -->
    <Card v-else-if="!config">
      <template #content>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-exclamation-circle text-4xl mb-2" />
          <p>No se pudo cargar la configuración del agente.</p>
          <p class="text-sm mt-1">¿Está la API activa?</p>
        </div>
      </template>
    </Card>

    <!-- Config loaded -->
    <div v-else>
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                <i class="pi pi-android text-white text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">{{ agentCount }}</p>
                <p class="text-sm text-gray-500">Agentes Activos</p>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <i class="pi pi-check-circle text-white text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">{{ config.system_initialized ? 'Sí' : 'No' }}</p>
                <p class="text-sm text-gray-500">Sistema Inicializado</p>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <i class="pi pi-cog text-white text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">v1.0</p>
                <p class="text-sm text-gray-500">Versión Config</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Agents Grid -->
      <Panel header="Agentes Habilitados" class="mb-6">
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-android" />
            <span class="font-semibold">Agentes Habilitados</span>
            <Tag :value="String(agentCount)" severity="info" class="ml-2" />
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="agent in config.enabled_agents"
            :key="agent"
            class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all duration-200 card-hover"
          >
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                <i :class="['pi', getAgentIcon(agent), 'text-primary-600']" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">
                  {{ formatAgentName(agent) }}
                </h3>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                  {{ getAgentDescription(agent) }}
                </p>
                <div class="mt-2">
                  <Tag severity="success" value="Activo" class="text-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!config.enabled_agents?.length" class="text-center py-8 text-gray-500">
          <i class="pi pi-info-circle text-2xl mb-2" />
          <p>No hay agentes habilitados</p>
        </div>
      </Panel>

      <!-- Raw Config -->
      <Panel header="Configuración Raw" toggleable collapsed>
        <pre class="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 font-mono">{{ JSON.stringify(config, null, 2) }}</pre>
      </Panel>
    </div>
  </div>
</template>

<style scoped>
.agent-config-page :deep(.p-card-content) {
  padding: 1rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
