<script setup lang="ts">
import { ref } from 'vue'
import { useAgentConfig } from '@/composables/useAgentConfig'
import { RefreshCw, Bot, CheckCircle, Settings, Info, AlertCircle, ChevronsUpDown } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

const {
  config,
  isLoading,
  agentCount,
  formatAgentName,
  getAgentIcon,
  getAgentDescription,
  fetchConfig
} = useAgentConfig()

const rawConfigOpen = ref(false)
</script>

<template>
  <div class="agent-config-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Configuracion de Agentes</h1>
        <p class="text-muted-foreground mt-1">Ver los agentes activos del sistema</p>
      </div>
      <div class="flex items-center gap-3">
        <Badge
          v-if="config"
          :variant="config.system_initialized ? 'success' : 'warning'"
        >
          {{ config.system_initialized ? 'Sistema Inicializado' : 'No Inicializado' }}
        </Badge>
        <Button
          variant="secondary"
          @click="fetchConfig"
          :disabled="isLoading"
        >
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !config" class="flex justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- No config -->
    <Card v-else-if="!config">
      <CardContent class="p-6">
        <div class="text-center py-8 text-muted-foreground">
          <AlertCircle class="h-10 w-10 mx-auto mb-2" />
          <p>No se pudo cargar la configuracion del agente.</p>
          <p class="text-sm mt-1">Esta la API activa?</p>
        </div>
      </CardContent>
    </Card>

    <!-- Config loaded -->
    <div v-else>
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bot class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-2xl font-bold text-foreground">{{ agentCount }}</p>
                <p class="text-sm text-muted-foreground">Agentes Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-2xl font-bold text-foreground">{{ config.system_initialized ? 'Si' : 'No' }}</p>
                <p class="text-sm text-muted-foreground">Sistema Inicializado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Settings class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-2xl font-bold text-foreground">v1.0</p>
                <p class="text-sm text-muted-foreground">Version Config</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Agents Grid -->
      <Card class="mb-6">
        <CardContent class="p-6">
          <div class="flex items-center gap-2 mb-4">
            <Bot class="h-4 w-4" />
            <span class="font-semibold">Agentes Habilitados</span>
            <Badge variant="info" class="ml-2">{{ agentCount }}</Badge>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="agent in config.enabled_agents"
              :key="agent"
              class="bg-card border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <i :class="['pi', getAgentIcon(agent), 'text-primary']" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-foreground truncate">
                    {{ formatAgentName(agent) }}
                  </h3>
                  <p class="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {{ getAgentDescription(agent) }}
                  </p>
                  <div class="mt-2">
                    <Badge variant="success" class="text-xs">Activo</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!config.enabled_agents?.length" class="text-center py-8 text-muted-foreground">
            <Info class="h-6 w-6 mx-auto mb-2" />
            <p>No hay agentes habilitados</p>
          </div>
        </CardContent>
      </Card>

      <!-- Raw Config -->
      <Collapsible v-model:open="rawConfigOpen">
        <Card>
          <CardContent class="p-4">
            <CollapsibleTrigger as-child>
              <button class="flex items-center justify-between w-full text-left">
                <span class="font-semibold">Configuracion Raw</span>
                <ChevronsUpDown class="h-4 w-4 text-muted-foreground" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre class="text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-96 font-mono mt-4">{{ JSON.stringify(config, null, 2) }}</pre>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  </div>
</template>
