<script setup lang="ts">
import { ref } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useBypassRules } from '@/composables/useBypassRules'
import { useAuthStore } from '@/stores/auth.store'
import BypassRulesList from '@/components/bypass/BypassRulesList.vue'
import BypassRuleForm from '@/components/bypass/BypassRuleForm.vue'
import BypassTestDialog from '@/components/bypass/BypassTestDialog.vue'
import AgentFlowGraph from '@/components/agentFlow/AgentFlowGraph.vue'
import type { BypassRule } from '@/types/bypassRules.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const store = useBypassRulesStore()
const authStore = useAuthStore()
const { deleteRule, openRuleDialog, openTestDialog, closeDeleteDialog, isLoading } =
  useBypassRules()

// Tab state
const activeTab = ref('0')

function handleEdit(rule: BypassRule) {
  openRuleDialog(rule)
}

function handleDelete(rule: BypassRule) {
  store.openDeleteDialog(rule)
}

async function confirmDelete() {
  if (store.deletingRule) {
    await deleteRule(store.deletingRule.id)
  }
}

function cancelDelete() {
  closeDeleteDialog()
}
</script>

<template>
  <div class="bypass-rules-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Reglas de Bypass</h1>
        <p class="text-gray-500 mt-1">
          Administra las reglas de enrutamiento para conversaciones de WhatsApp
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Probar Enrutamiento"
          icon="pi pi-play"
          severity="secondary"
          @click="openTestDialog"
        />
        <Button label="Nueva Regla" icon="pi pi-plus" severity="primary" @click="openRuleDialog(null)" />
      </div>
    </div>

    <!-- Content with Tabs -->
    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <i class="pi pi-list mr-2" />
              Reglas
            </Tab>
            <Tab value="1">
              <i class="pi pi-sitemap mr-2" />
              Visualizacion
            </Tab>
          </TabList>
          <TabPanels>
            <!-- Rules List Tab -->
            <TabPanel value="0">
              <BypassRulesList @edit="handleEdit" @delete="handleDelete" />
            </TabPanel>

            <!-- Visualization Tab -->
            <TabPanel value="1">
              <div class="visualization-container">
                <AgentFlowGraph
                  :organization-id="authStore.currentOrgId ?? undefined"
                  height="600px"
                  :show-minimap="true"
                  :show-controls="true"
                  :show-legend="true"
                />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- Form Dialog -->
    <BypassRuleForm />

    <!-- Test Dialog -->
    <BypassTestDialog />

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="store.showDeleteDialog"
      header="Eliminar Regla"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
        <div>
          <p class="font-medium">Esta seguro de eliminar esta regla?</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ store.deletingRule?.rule_name }}
          </p>
        </div>
      </div>

      <Message severity="warn" :closable="false" class="mt-4">
        Esta accion no se puede deshacer. Las conversaciones ya no seran enrutadas por esta regla.
      </Message>

      <template #footer>
        <Button label="Cancelar" severity="secondary" :disabled="isLoading" @click="cancelDelete" />
        <Button
          label="Eliminar"
          severity="danger"
          icon="pi pi-trash"
          :loading="isLoading"
          @click="confirmDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.bypass-rules-page :deep(.p-card-content) {
  padding: 1rem;
}

.visualization-container {
  margin-top: 1rem;
}

/* Tab styling */
.bypass-rules-page :deep(.p-tablist) {
  border-bottom: 1px solid #e2e8f0;
}

.bypass-rules-page :deep(.p-tab) {
  padding: 0.75rem 1.5rem;
}

.bypass-rules-page :deep(.p-tabpanels) {
  padding-top: 1rem;
}
</style>
