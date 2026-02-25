<script setup lang="ts">
import { ref } from 'vue'
import { useRagDashboard } from '@/composables/useRagDashboard'
import RagAnalytics from '@/components/analytics/RagAnalytics.vue'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const activeTab = ref('analytics')

const {
  queryLogs,
  totalLogs,
  logsPage,
  logsLoading,
  totalPages,
  selectedQuery,
  showDetailDialog,
  loadQueryLogs,
  viewQueryDetail,
  handleExport,
  formatDate,
  formatLatency,
  getFeedbackSeverity,
  getFeedbackLabel
} = useRagDashboard()

function getBadgeVariant(severity: string) {
  if (severity === 'success') return 'success' as const
  if (severity === 'danger') return 'destructive' as const
  return 'secondary' as const
}

function goToPage(page: number) {
  logsPage.value = page
  loadQueryLogs()
}
</script>

<template>
  <TooltipProvider>
    <div class="max-w-[1400px] mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">RAG Dashboard</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Monitoreo y analisis del sistema RAG
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="handleExport('csv')">
            <i class="pi pi-download mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" @click="handleExport('json')">
            <i class="pi pi-download mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      <!-- Tabs -->
      <Card class="glass-card overflow-hidden">
        <CardContent class="p-0">
          <Tabs v-model="activeTab" class="w-full">
            <TabsList class="w-full justify-start rounded-none border-b border-gray-200/50 dark:border-white/10 bg-transparent h-auto p-0">
              <TabsTrigger
                value="analytics"
                class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                <i class="pi pi-chart-line mr-2" />
                Analiticas
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                <i class="pi pi-list mr-2" />
                Historial de Consultas
              </TabsTrigger>
            </TabsList>

            <!-- Analytics Tab -->
            <TabsContent value="analytics" class="p-4 mt-0">
              <RagAnalytics :refresh-interval="0" />
            </TabsContent>

            <!-- Query Logs Tab -->
            <TabsContent value="logs" class="p-4 mt-0">
              <div class="flex justify-between items-center mb-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Total: {{ totalLogs }} consultas
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="loadQueryLogs"
                  :disabled="logsLoading"
                >
                  <i :class="['pi pi-refresh', { 'pi-spin': logsLoading }]" />
                </Button>
              </div>

              <!-- Loading -->
              <div v-if="logsLoading && queryLogs.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl mb-2" />
                <p>Cargando consultas...</p>
              </div>

              <!-- Empty -->
              <div v-else-if="queryLogs.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="pi pi-search text-4xl mb-2" />
                <p>No hay consultas registradas</p>
              </div>

              <!-- Table -->
              <template v-else>
                <Card class="overflow-hidden border border-gray-200/50 dark:border-white/10 shadow-none">
                  <CardContent class="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead class="w-[150px]">Fecha</TableHead>
                          <TableHead class="min-w-[300px]">Consulta</TableHead>
                          <TableHead class="w-[100px]">Latencia</TableHead>
                          <TableHead class="w-[80px]">Tokens</TableHead>
                          <TableHead class="w-[100px]">Relevancia</TableHead>
                          <TableHead class="w-[120px]">Feedback</TableHead>
                          <TableHead class="w-[60px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-for="log in queryLogs" :key="log.id">
                          <TableCell>
                            <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(log.created_at) }}</span>
                          </TableCell>
                          <TableCell>
                            <div class="truncate max-w-md text-gray-800 dark:text-gray-200" :title="log.query">
                              {{ log.query }}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span :class="{
                              'text-green-600 dark:text-green-400': log.latency_ms < 500,
                              'text-amber-600 dark:text-amber-400': log.latency_ms >= 500 && log.latency_ms < 2000,
                              'text-red-600 dark:text-red-400': log.latency_ms >= 2000
                            }">
                              {{ formatLatency(log.latency_ms) }}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span class="text-sm text-gray-600 dark:text-gray-400">{{ log.token_count }}</span>
                          </TableCell>
                          <TableCell>
                            <span v-if="log.relevance_score" class="text-sm text-gray-600 dark:text-gray-400">
                              {{ (log.relevance_score * 100).toFixed(0) }}%
                            </span>
                            <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                          </TableCell>
                          <TableCell>
                            <Badge :variant="getBadgeVariant(getFeedbackSeverity(log.user_feedback))">
                              {{ getFeedbackLabel(log.user_feedback) }}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  @click="viewQueryDetail(log)"
                                >
                                  <i class="pi pi-eye text-sm" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <!-- Pagination -->
                    <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200/50 dark:border-white/10">
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        Pagina {{ logsPage }} de {{ totalPages }}
                      </span>
                      <div class="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          :disabled="logsPage <= 1"
                          @click="goToPage(logsPage - 1)"
                        >
                          <i class="pi pi-chevron-left text-xs" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          :disabled="logsPage >= totalPages"
                          @click="goToPage(logsPage + 1)"
                        >
                          <i class="pi pi-chevron-right text-xs" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </template>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <!-- Query Detail Dialog -->
      <Dialog v-model:open="showDetailDialog">
        <DialogContent class="sm:max-w-[700px] glass-dialog">
          <DialogHeader>
            <DialogTitle>Detalle de Consulta</DialogTitle>
            <DialogDescription class="sr-only">Informacion detallada de la consulta RAG</DialogDescription>
          </DialogHeader>

          <template v-if="selectedQuery">
            <div class="space-y-4 py-4">
              <!-- Query info -->
              <div class="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Fecha:</span>
                  <div class="font-medium text-gray-800 dark:text-gray-100">{{ formatDate(selectedQuery.created_at) }}</div>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Latencia:</span>
                  <div class="font-medium text-gray-800 dark:text-gray-100">{{ formatLatency(selectedQuery.latency_ms) }}</div>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Tokens:</span>
                  <div class="font-medium text-gray-800 dark:text-gray-100">{{ selectedQuery.token_count }}</div>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Feedback:</span>
                  <div class="mt-1">
                    <Badge :variant="getBadgeVariant(getFeedbackSeverity(selectedQuery.user_feedback))">
                      {{ getFeedbackLabel(selectedQuery.user_feedback) }}
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- Query -->
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-sm">Consulta:</span>
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg mt-1 text-gray-800 dark:text-gray-200">
                  {{ selectedQuery.query }}
                </div>
              </div>

              <!-- Response -->
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-sm">Respuesta:</span>
                <div class="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg mt-1 max-h-48 overflow-y-auto text-gray-800 dark:text-gray-200">
                  {{ selectedQuery.response }}
                </div>
              </div>

              <!-- Context used -->
              <div v-if="selectedQuery.context_used?.length > 0">
                <span class="text-gray-500 dark:text-gray-400 text-sm">
                  Contexto utilizado ({{ selectedQuery.context_used.length }} documentos):
                </span>
                <div class="mt-1 space-y-2">
                  <div
                    v-for="(ctx, index) in selectedQuery.context_used"
                    :key="index"
                    class="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded text-sm truncate text-gray-800 dark:text-gray-200"
                    :title="ctx"
                  >
                    {{ ctx }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <DialogFooter>
            <Button variant="outline" @click="showDetailDialog = false">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </TooltipProvider>
</template>
