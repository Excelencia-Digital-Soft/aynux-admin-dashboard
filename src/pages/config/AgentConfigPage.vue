<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { agentApi } from '@/api/agent.api'
import { useToast } from '@/composables/useToast'
import type { AgentConfig, AgentModule, AgentModuleUpdateRequest } from '@/types/agent.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'

const toast = useToast()

const isLoading = ref(false)
const config = ref<AgentConfig | null>(null)
const activeTab = ref('0')
const editingModuleId = ref<string | null>(null)

// Form state for module editing
const moduleForm = ref({
  name: '',
  description: '',
  target: '',
  features: ''
})

async function fetchConfig() {
  isLoading.value = true
  try {
    config.value = await agentApi.getConfig()
  } finally {
    isLoading.value = false
  }
}

function startEditModule(moduleId: string, module: AgentModule) {
  editingModuleId.value = moduleId
  moduleForm.value = {
    name: module.name,
    description: module.description,
    target: module.target,
    features: module.features.join('\n')
  }
}

function cancelEditModule() {
  editingModuleId.value = null
}

async function saveModule(moduleId: string) {
  isLoading.value = true
  try {
    const features = moduleForm.value.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    const updateData: AgentModuleUpdateRequest = {
      name: moduleForm.value.name,
      description: moduleForm.value.description,
      target: moduleForm.value.target,
      features
    }

    await agentApi.updateModules({ [moduleId]: updateData }, true)
    toast.success('Modulo actualizado')
    toast.warn('Reiniciar la aplicacion para aplicar los cambios')
    editingModuleId.value = null
    await fetchConfig()
  } catch (error) {
    toast.error('Error al actualizar modulo')
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
        <h1 class="text-2xl font-bold text-gray-800">Configuracion de Agentes</h1>
        <p class="text-gray-500 mt-1">Ver y editar modulos y configuracion del agente</p>
      </div>
      <Button
        icon="pi pi-refresh"
        label="Actualizar"
        severity="secondary"
        @click="fetchConfig"
        :loading="isLoading"
      />
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
          <p>No se pudo cargar la configuracion del agente. Esta la API activa?</p>
        </div>
      </template>
    </Card>

    <!-- Config loaded -->
    <Card v-else>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <div class="flex items-center gap-2">
                <i class="pi pi-cog" />
                <span>Modulos</span>
              </div>
            </Tab>
            <Tab value="1">
              <div class="flex items-center gap-2">
                <i class="pi pi-sliders-h" />
                <span>Settings</span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <!-- Modules Tab -->
            <TabPanel value="0">
              <Message severity="warn" :closable="false" class="mb-4">
                Los cambios a modulos requieren reiniciar la aplicacion!
              </Message>

              <div class="space-y-4">
                <Panel
                  v-for="(module, moduleId) in config.modules"
                  :key="moduleId"
                  :header="module.name"
                  toggleable
                  :collapsed="editingModuleId !== moduleId"
                >
                  <template #header>
                    <div class="flex items-center gap-2">
                      <i class="pi pi-android" />
                      <span class="font-medium">{{ module.name }}</span>
                      <Tag
                        v-if="module.enabled !== false"
                        severity="success"
                        value="Activo"
                        class="text-xs"
                      />
                      <Tag v-else severity="secondary" value="Inactivo" class="text-xs" />
                    </div>
                  </template>

                  <!-- Viewing mode -->
                  <div v-if="editingModuleId !== moduleId">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-500">Descripcion</label>
                        <p class="text-gray-800">{{ module.description || 'Sin descripcion' }}</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-500">
                          Audiencia Objetivo
                        </label>
                        <p class="text-gray-800">{{ module.target || 'N/A' }}</p>
                      </div>
                    </div>

                    <div class="mb-4">
                      <label class="block text-sm font-medium text-gray-500 mb-2">Features</label>
                      <div class="flex flex-wrap gap-2">
                        <Tag
                          v-for="(feature, idx) in module.features"
                          :key="idx"
                          :value="feature"
                          severity="info"
                        />
                        <span v-if="!module.features?.length" class="text-gray-400">
                          Sin features
                        </span>
                      </div>
                    </div>

                    <Button
                      label="Editar"
                      icon="pi pi-pencil"
                      severity="secondary"
                      size="small"
                      @click="startEditModule(moduleId as string, module)"
                    />
                  </div>

                  <!-- Editing mode -->
                  <div v-else class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <InputText v-model="moduleForm.name" class="w-full" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                      <Textarea v-model="moduleForm.description" rows="3" class="w-full" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Audiencia Objetivo
                      </label>
                      <InputText v-model="moduleForm.target" class="w-full" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Features (uno por linea)
                      </label>
                      <Textarea v-model="moduleForm.features" rows="5" class="w-full" />
                    </div>

                    <div class="flex gap-2">
                      <Button
                        label="Guardar"
                        icon="pi pi-save"
                        size="small"
                        @click="saveModule(moduleId as string)"
                        :loading="isLoading"
                      />
                      <Button
                        label="Cancelar"
                        icon="pi pi-times"
                        severity="secondary"
                        size="small"
                        @click="cancelEditModule"
                      />
                    </div>
                  </div>
                </Panel>
              </div>
            </TabPanel>

            <!-- Settings Tab -->
            <TabPanel value="1">
              <div class="max-w-2xl">
                <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <Card class="text-center">
                    <template #content>
                      <div class="text-2xl font-bold text-blue-600">
                        {{ config.settings?.model || 'N/A' }}
                      </div>
                      <div class="text-sm text-gray-500">Modelo</div>
                    </template>
                  </Card>

                  <Card class="text-center">
                    <template #content>
                      <div class="text-2xl font-bold text-green-600">
                        {{ config.settings?.temperature ?? 'N/A' }}
                      </div>
                      <div class="text-sm text-gray-500">Temperature</div>
                    </template>
                  </Card>

                  <Card class="text-center">
                    <template #content>
                      <div class="text-2xl font-bold text-purple-600">
                        {{ config.settings?.max_response_length || 'N/A' }}
                      </div>
                      <div class="text-sm text-gray-500">Max Respuesta</div>
                    </template>
                  </Card>
                </div>

                <Divider />

                <div class="grid grid-cols-2 gap-6 mt-6">
                  <div class="flex items-center justify-between">
                    <span class="font-medium">Usar RAG</span>
                    <Tag
                      :severity="config.settings?.use_rag ? 'success' : 'secondary'"
                      :value="config.settings?.use_rag ? 'Activo' : 'Inactivo'"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="font-medium">RAG Max Resultados</span>
                    <span class="text-gray-600">
                      {{ config.settings?.rag_max_results || 'N/A' }}
                    </span>
                  </div>
                </div>

                <Message severity="info" :closable="false" class="mt-6">
                  La funcionalidad de actualizacion de settings estara disponible proximamente!
                </Message>

                <Divider />

                <div class="mt-6">
                  <Panel header="Configuracion Raw" toggleable collapsed>
                    <pre class="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{{
                      JSON.stringify(config, null, 2)
                    }}</pre>
                  </Panel>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.agent-config-page :deep(.p-card-content) {
  padding: 0;
}

.agent-config-page :deep(.p-tabpanels) {
  padding: 1.5rem;
}
</style>
