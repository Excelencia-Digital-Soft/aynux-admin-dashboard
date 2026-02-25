<script setup lang="ts">
import { useKnowledgeBasePage } from '@/composables/useKnowledgeBasePage'
import { KNOWLEDGE_SOURCE_OPTIONS } from '@/utils/constants'
import DocumentBrowser from '@/components/documents/DocumentBrowser.vue'
import AdvancedSearch from '@/components/documents/AdvancedSearch.vue'
import AgentKnowledgeDashboard from '@/components/documents/AgentKnowledgeDashboard.vue'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const {
  activeTab,
  selectedSource,
  selectedAgentKey,
  availableAgents,
  loadingAgents,
  currentOrgId,
  showAgentSelector,
  handleSearchSelect,
  handleSelectAgentFromDashboard,
  goToUpload
} = useKnowledgeBasePage()
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Base de Conocimiento</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Gestiona los documentos de la base de conocimiento
        </p>
      </div>
      <Button @click="goToUpload">
        <i class="pi pi-upload mr-2" />
        Subir Documento
      </Button>
    </div>

    <!-- Quick Navigation -->
    <div class="flex items-center gap-4 mb-4 text-sm">
      <RouterLink
        to="/upload-documents"
        class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <i class="pi pi-upload text-xs" />
        <span>Subir documento</span>
      </RouterLink>
      <span class="text-gray-300 dark:text-gray-600">|</span>
      <RouterLink
        to="/embeddings"
        class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <i class="pi pi-database text-xs" />
        <span>Gestionar embeddings</span>
      </RouterLink>
      <span class="text-gray-300 dark:text-gray-600">|</span>
      <RouterLink
        to="/excelencia"
        class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <i class="pi pi-box text-xs" />
        <span>Catalogo de Software</span>
      </RouterLink>
    </div>

    <!-- Source Filter -->
    <Card class="glass-panel mb-4">
      <CardContent class="pt-6">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Fuente:</label>
            <Select v-model="selectedSource">
              <SelectTrigger class="w-40">
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in KNOWLEDGE_SOURCE_OPTIONS"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Agent selector (shown when Agent source is selected) -->
          <div v-if="showAgentSelector" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Agente:</label>
            <div v-if="loadingAgents" class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <i class="pi pi-spin pi-spinner" />
              <span class="text-sm">Cargando...</span>
            </div>
            <Select
              v-else
              v-model="selectedAgentKey"
              :disabled="availableAgents.length === 0"
            >
              <SelectTrigger class="w-56">
                <SelectValue placeholder="Selecciona un agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="agent in availableAgents"
                  :key="agent.value"
                  :value="agent.value"
                >
                  {{ agent.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Tabs -->
    <Card class="glass-card overflow-hidden">
      <CardContent class="p-0">
        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="w-full justify-start rounded-none border-b border-gray-200/50 dark:border-white/10 bg-transparent h-auto p-0">
            <TabsTrigger
              value="browse"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <i class="pi pi-list mr-2" />
              Explorar
            </TabsTrigger>
            <TabsTrigger
              value="search"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <i class="pi pi-search mr-2" />
              Busqueda Semantica
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <i class="pi pi-th-large mr-2" />
              Dashboard Agentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" class="p-4 mt-0">
            <DocumentBrowser
              :source="selectedSource"
              :agent-key="selectedAgentKey"
              :org-id="currentOrgId"
            />
          </TabsContent>

          <TabsContent value="search" class="p-4 mt-0">
            <AdvancedSearch
              :source="selectedSource"
              :agent-key="selectedAgentKey"
              :org-id="currentOrgId"
              :max-results="15"
              @select="handleSearchSelect"
            />
          </TabsContent>

          <TabsContent value="dashboard" class="p-4 mt-0">
            <AgentKnowledgeDashboard @select-agent="handleSelectAgentFromDashboard" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>
