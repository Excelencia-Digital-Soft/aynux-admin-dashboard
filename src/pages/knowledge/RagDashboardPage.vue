<script setup lang="ts">
import { ref } from 'vue'
import { useRagDashboard } from '@/composables/useRagDashboard'
import RagAnalytics from '@/components/analytics/RagAnalytics.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Dialog from 'primevue/dialog'

const activeTab = ref('0')

const {
  queryLogs,
  totalLogs,
  logsLoading,
  selectedQuery,
  showDetailDialog,
  loadQueryLogs,
  onLogsPageChange,
  viewQueryDetail,
  handleExport,
  formatDate,
  formatLatency,
  getFeedbackSeverity,
  getFeedbackLabel
} = useRagDashboard()
</script>

<template>
  <div class="rag-dashboard-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">RAG Dashboard</h1>
        <p class="text-gray-500 mt-1">
          Monitoreo y analisis del sistema RAG
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Exportar CSV"
          icon="pi pi-download"
          severity="secondary"
          size="small"
          @click="handleExport('csv')"
        />
        <Button
          label="Exportar JSON"
          icon="pi pi-download"
          severity="secondary"
          size="small"
          @click="handleExport('json')"
        />
      </div>
    </div>

    <!-- Tabs -->
    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-line" />
                <span>Analiticas</span>
              </div>
            </Tab>
            <Tab value="1">
              <div class="flex items-center gap-2">
                <i class="pi pi-list" />
                <span>Historial de Consultas</span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <!-- Analytics Tab -->
            <TabPanel value="0">
              <RagAnalytics :refresh-interval="0" />
            </TabPanel>

            <!-- Query Logs Tab -->
            <TabPanel value="1">
              <div class="query-logs">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-sm text-gray-500">
                    Total: {{ totalLogs }} consultas
                  </span>
                  <Button
                    icon="pi pi-refresh"
                    severity="secondary"
                    text
                    rounded
                    @click="loadQueryLogs"
                    :loading="logsLoading"
                  />
                </div>

                <DataTable
                  :value="queryLogs"
                  :loading="logsLoading"
                  stripedRows
                  class="p-datatable-sm"
                  :paginator="true"
                  :rows="25"
                  :totalRecords="totalLogs"
                  :lazy="true"
                  @page="onLogsPageChange"
                >
                  <template #empty>
                    <div class="text-center py-8 text-gray-500">
                      No hay consultas registradas
                    </div>
                  </template>

                  <Column field="created_at" header="Fecha" style="width: 150px">
                    <template #body="{ data }">
                      <span class="text-sm">{{ formatDate(data.created_at) }}</span>
                    </template>
                  </Column>

                  <Column field="query" header="Consulta" style="min-width: 300px">
                    <template #body="{ data }">
                      <div class="truncate max-w-md" :title="data.query">
                        {{ data.query }}
                      </div>
                    </template>
                  </Column>

                  <Column field="latency_ms" header="Latencia" style="width: 100px">
                    <template #body="{ data }">
                      <span :class="{
                        'text-green-600': data.latency_ms < 500,
                        'text-amber-600': data.latency_ms >= 500 && data.latency_ms < 2000,
                        'text-red-600': data.latency_ms >= 2000
                      }">
                        {{ formatLatency(data.latency_ms) }}
                      </span>
                    </template>
                  </Column>

                  <Column field="token_count" header="Tokens" style="width: 80px">
                    <template #body="{ data }">
                      <span class="text-sm">{{ data.token_count }}</span>
                    </template>
                  </Column>

                  <Column field="relevance_score" header="Relevancia" style="width: 100px">
                    <template #body="{ data }">
                      <span v-if="data.relevance_score" class="text-sm">
                        {{ (data.relevance_score * 100).toFixed(0) }}%
                      </span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </Column>

                  <Column field="user_feedback" header="Feedback" style="width: 100px">
                    <template #body="{ data }">
                      <Tag
                        :severity="getFeedbackSeverity(data.user_feedback)"
                        :value="getFeedbackLabel(data.user_feedback)"
                      />
                    </template>
                  </Column>

                  <Column header="" style="width: 60px">
                    <template #body="{ data }">
                      <Button
                        icon="pi pi-eye"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        @click="viewQueryDetail(data)"
                        v-tooltip="'Ver detalle'"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- Query Detail Dialog -->
    <Dialog
      v-model:visible="showDetailDialog"
      header="Detalle de Consulta"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <template v-if="selectedQuery">
        <div class="space-y-4">
          <!-- Query info -->
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Fecha:</span>
              <div class="font-medium">{{ formatDate(selectedQuery.created_at) }}</div>
            </div>
            <div>
              <span class="text-gray-500">Latencia:</span>
              <div class="font-medium">{{ formatLatency(selectedQuery.latency_ms) }}</div>
            </div>
            <div>
              <span class="text-gray-500">Tokens:</span>
              <div class="font-medium">{{ selectedQuery.token_count }}</div>
            </div>
            <div>
              <span class="text-gray-500">Feedback:</span>
              <div>
                <Tag
                  :severity="getFeedbackSeverity(selectedQuery.user_feedback)"
                  :value="getFeedbackLabel(selectedQuery.user_feedback)"
                />
              </div>
            </div>
          </div>

          <!-- Query -->
          <div>
            <span class="text-gray-500 text-sm">Consulta:</span>
            <div class="p-3 bg-blue-50 rounded-lg mt-1">
              {{ selectedQuery.query }}
            </div>
          </div>

          <!-- Response -->
          <div>
            <span class="text-gray-500 text-sm">Respuesta:</span>
            <div class="p-3 bg-gray-50 rounded-lg mt-1 max-h-48 overflow-y-auto">
              {{ selectedQuery.response }}
            </div>
          </div>

          <!-- Context used -->
          <div v-if="selectedQuery.context_used?.length > 0">
            <span class="text-gray-500 text-sm">Contexto utilizado ({{ selectedQuery.context_used.length }} documentos):</span>
            <div class="mt-1 space-y-2">
              <div
                v-for="(ctx, index) in selectedQuery.context_used"
                :key="index"
                class="p-2 bg-amber-50 rounded text-sm truncate"
                :title="ctx"
              >
                {{ ctx }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <Button label="Cerrar" severity="secondary" @click="showDetailDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.rag-dashboard-page :deep(.p-card-content) {
  padding: 0;
}

.rag-dashboard-page :deep(.p-tabpanels) {
  padding: 1rem;
}
</style>
