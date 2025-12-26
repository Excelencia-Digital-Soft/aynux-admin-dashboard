<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useKnowledge } from '@/composables/useKnowledge'
import { useAuthStore } from '@/stores/auth.store'
import { agentKnowledgeApi } from '@/api/agentKnowledge.api'
import { KNOWLEDGE_SOURCE_OPTIONS } from '@/utils/constants'
import DocumentBrowser from '@/components/documents/DocumentBrowser.vue'
import AdvancedSearch from '@/components/documents/AdvancedSearch.vue'

import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const authStore = useAuthStore()
const { fetchDocuments } = useKnowledge()

const activeTab = ref('0')

// Source filtering
const selectedSource = ref('all')
const selectedAgentKey = ref('')
const availableAgents = ref<Array<{ value: string; label: string }>>([])
const loadingAgents = ref(false)

// Computed
const currentOrgId = computed(() => authStore.currentOrganization?.id || '')
const showAgentSelector = computed(() => selectedSource.value === 'agent')

// Format agent key to display label
function formatAgentLabel(agentKey: string): string {
  return agentKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Fetch available agents
async function fetchAgents() {
  if (availableAgents.value.length > 0) return

  loadingAgents.value = true
  try {
    const response = await agentKnowledgeApi.getAvailableAgents()
    availableAgents.value = response.agents.map((agentKey) => ({
      value: agentKey,
      label: formatAgentLabel(agentKey)
    }))
  } catch (error) {
    console.error('Error fetching agents:', error)
  } finally {
    loadingAgents.value = false
  }
}

// Watch for source changes
watch(selectedSource, (newSource) => {
  if (newSource === 'agent') {
    fetchAgents()
  } else {
    selectedAgentKey.value = ''
  }
})

function handleSearchSelect(docId: string) {
  // Switch to browse tab and highlight document
  activeTab.value = '0'
}

function goToUpload() {
  router.push('/upload-documents')
}

onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div class="knowledge-base-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Base de Conocimiento</h1>
        <p class="text-gray-500 mt-1">
          Gestiona los documentos de la base de conocimiento
        </p>
      </div>
      <Button
        label="Subir Documento"
        icon="pi pi-upload"
        @click="goToUpload"
      />
    </div>

    <!-- Source Filter -->
    <Card class="mb-4">
      <template #content>
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700">Fuente:</label>
            <Select
              v-model="selectedSource"
              :options="KNOWLEDGE_SOURCE_OPTIONS"
              optionLabel="label"
              optionValue="value"
              class="w-40"
            />
          </div>

          <!-- Agent selector (shown when Agent source is selected) -->
          <div v-if="showAgentSelector" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700">Agente:</label>
            <div v-if="loadingAgents" class="flex items-center gap-2 text-gray-500">
              <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
              <span class="text-sm">Cargando...</span>
            </div>
            <Select
              v-else
              v-model="selectedAgentKey"
              :options="availableAgents"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un agente"
              class="w-56"
              :disabled="availableAgents.length === 0"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabs -->
    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <div class="flex items-center gap-2">
                <i class="pi pi-list" />
                <span>Explorar</span>
              </div>
            </Tab>
            <Tab value="1">
              <div class="flex items-center gap-2">
                <i class="pi pi-search" />
                <span>Busqueda Semantica</span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <DocumentBrowser
                :source="selectedSource"
                :agent-key="selectedAgentKey"
                :org-id="currentOrgId"
              />
            </TabPanel>
            <TabPanel value="1">
              <AdvancedSearch
                :source="selectedSource"
                :agent-key="selectedAgentKey"
                :org-id="currentOrgId"
                :max-results="15"
                @select="handleSearchSelect"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.knowledge-base-page :deep(.p-card-content) {
  padding: 0;
}

.knowledge-base-page :deep(.p-tablist) {
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.knowledge-base-page :deep(.p-tabpanels) {
  padding: 1rem;
}
</style>
