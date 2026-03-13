<script setup lang="ts">
import { ref } from 'vue'
import { useEventosStore } from '@/stores/eventos.store'
import { useEventosConfig } from '@/composables/useEventosConfig'
import { getStatusColor, getStatusLabel } from '@/types/eventosConfig.types'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible'

defineProps<{ organizationId: string }>()

const store = useEventosStore()
const { leads, updateLeadStatus, setLeadsStatusFilter } = useEventosConfig()

const statusFilter = ref<string>('all')
function onStatusFilterChange(v: string) {
  statusFilter.value = v
  setLeadsStatusFilter(v === 'all' ? null : v)
}

const expandedLeads = ref<Set<string>>(new Set())
function toggleExpand(leadId: string) {
  if (expandedLeads.value.has(leadId)) {
    expandedLeads.value.delete(leadId)
  } else {
    expandedLeads.value.add(leadId)
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const statusOptions = ['new', 'contacted', 'closed']
</script>

<template>
  <Card class="glass-card">
    <CardContent class="p-4">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <Select :model-value="statusFilter" @update:model-value="onStatusFilterChange">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Nuevos</SelectItem>
            <SelectItem value="contacted">Contactados</SelectItem>
            <SelectItem value="closed">Cerrados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Table -->
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[40px]"></TableHead>
            <TableHead>Telefono</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Formulario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="lead in leads" :key="lead.id">
            <TableRow class="cursor-pointer" @click="toggleExpand(lead.id)">
              <TableCell>
                <i
                  class="pi text-xs transition-transform"
                  :class="expandedLeads.has(lead.id) ? 'pi-chevron-down' : 'pi-chevron-right'"
                />
              </TableCell>
              <TableCell class="font-medium">{{ lead.user_phone }}</TableCell>
              <TableCell>{{ lead.category || '-' }}</TableCell>
              <TableCell>{{ lead.form_type || '-' }}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child @click.stop>
                    <button>
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer"
                        :class="getStatusColor(lead.status)"
                      >
                        {{ getStatusLabel(lead.status) }}
                        <i class="pi pi-chevron-down text-[10px] ml-1" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      v-for="s in statusOptions"
                      :key="s"
                      :disabled="lead.status === s"
                      @click="updateLeadStatus(lead.id, s)"
                    >
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2"
                        :class="getStatusColor(s)"
                      >
                        {{ getStatusLabel(s) }}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell class="text-muted-foreground text-sm">{{ formatDate(lead.created_at) }}</TableCell>
            </TableRow>

            <!-- Expanded row -->
            <TableRow v-if="expandedLeads.has(lead.id)">
              <TableCell colspan="6" class="bg-muted/30 p-4">
                <div class="text-sm">
                  <p class="font-medium mb-2">Mensajes del lead:</p>
                  <div v-if="lead.raw_messages && lead.raw_messages.length > 0" class="space-y-2">
                    <div
                      v-for="(msg, idx) in lead.raw_messages"
                      :key="idx"
                      class="bg-background rounded p-2 text-xs font-mono whitespace-pre-wrap"
                    >
                      {{ typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2) }}
                    </div>
                  </div>
                  <p v-else class="text-muted-foreground">Sin mensajes registrados</p>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <!-- Empty state -->
          <TableRow v-if="leads.length === 0">
            <TableCell colspan="6" class="text-center py-12">
              <div class="flex flex-col items-center gap-2 text-muted-foreground">
                <i class="pi pi-inbox text-4xl" />
                <p>No hay leads registrados</p>
                <p class="text-sm">Los leads aparecen cuando un usuario completa un formulario via WhatsApp</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
