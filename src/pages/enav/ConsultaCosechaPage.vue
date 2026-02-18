<script setup lang="ts">
import { useEnavConsulta, PERIODO_OPTIONS } from '@/composables/useEnavConsulta'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'

const {
  clientecodigo,
  periodo,
  useCustomRange,
  fechaDesde,
  fechaHasta,
  records,
  clienterazonsocial,
  total,
  isLoading,
  error,
  hasSearched,
  page,
  pageSize,
  totals,
  canSearch,
  submitSearch,
  onPageChange
} = useEnavConsulta()

function formatDate(value: string | null): string {
  if (!value) return '-'
  const d = new Date(value + 'T00:00:00')
  return d.toLocaleDateString('es-AR')
}

function formatNumber(value: number | null): string {
  if (value == null) return '-'
  return value.toLocaleString('es-AR')
}

function formatDecimal(value: number | null): string {
  if (value == null) return '-'
  return value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8 bg-gradient-to-r from-white via-primary-200 to-cyan-300 bg-clip-text text-transparent">
      Consulta de Cosecha ENAV
    </h1>

    <!-- Search Panel - Glass Card -->
    <div class="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl p-6 mb-6">
      <form @submit.prevent="submitSearch" class="flex flex-col gap-5">
        <!-- Row 1: Clientecodigo + Periodo -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <Label for="clientecodigo" class="text-sm font-medium text-white/80">
              Codigo de Vinatero
            </Label>
            <Input
              id="clientecodigo"
              v-model="clientecodigo"
              placeholder="Ej: 12345"
              class="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-cyan-400/50"
            />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="periodo" class="text-sm font-medium text-white/80">
              Periodo
            </Label>
            <Select v-model="periodo" :disabled="useCustomRange">
              <SelectTrigger
                id="periodo"
                class="bg-white/10 border-white/20 text-white focus:ring-cyan-400/50 [&>span]:text-white"
              >
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent class="bg-navy-800/95 backdrop-blur-lg border-white/20 text-white">
                <SelectItem
                  v-for="opt in PERIODO_OPTIONS"
                  :key="opt.value"
                  :value="opt.value"
                  class="text-white/90 focus:bg-white/10 focus:text-white"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Row 2: Custom range toggle + dates -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <Switch
              :checked="useCustomRange"
              @update:checked="useCustomRange = $event"
              class="data-[state=checked]:bg-cyan-500"
            />
            <Label class="text-sm text-white/70 cursor-pointer" @click="useCustomRange = !useCustomRange">
              Rango personalizado
            </Label>
          </div>

          <div v-if="useCustomRange" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <Label class="text-sm font-medium text-white/80">Desde</Label>
              <Input
                type="date"
                :model-value="fechaDesde ?? ''"
                @update:model-value="fechaDesde = ($event as string) || null"
                class="bg-white/10 border-white/20 text-white focus-visible:ring-cyan-400/50 [color-scheme:dark]"
              />
            </div>
            <div class="flex flex-col gap-2">
              <Label class="text-sm font-medium text-white/80">Hasta</Label>
              <Input
                type="date"
                :model-value="fechaHasta ?? ''"
                @update:model-value="fechaHasta = ($event as string) || null"
                class="bg-white/10 border-white/20 text-white focus-visible:ring-cyan-400/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <!-- Search button -->
        <div>
          <Button
            type="submit"
            :loading="isLoading"
            :disabled="!canSearch"
            class="bg-gradient-to-r from-primary-500 to-cyan-500 text-white hover:from-primary-400 hover:to-cyan-400 border-0 shadow-lg shadow-primary-500/25"
          >
            Buscar
          </Button>
        </div>
      </form>
    </div>

    <!-- Error message -->
    <Alert v-if="error" variant="destructive" class="mb-6 bg-red-500/15 backdrop-blur-sm border-red-400/30 text-red-200">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Results - Glass Card -->
    <div v-if="hasSearched && !error" class="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-2 p-6 pb-4">
        <span v-if="clienterazonsocial" class="text-lg font-semibold text-white">
          {{ clienterazonsocial }}
        </span>
        <span class="text-sm text-white/60">
          {{ total }} registro{{ total !== 1 ? 's' : '' }} encontrado{{ total !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow class="border-white/10 hover:bg-transparent">
              <TableHead class="text-white/70 bg-white/5">Fecha</TableHead>
              <TableHead class="text-white/70 bg-white/5">Nro CIU</TableHead>
              <TableHead class="text-white/70 bg-white/5">Variedad</TableHead>
              <TableHead class="text-white/70 bg-white/5">Kg Neto</TableHead>
              <TableHead class="text-white/70 bg-white/5">Azucar</TableHead>
              <TableHead class="text-white/70 bg-white/5">Patente</TableHead>
              <TableHead class="text-white/70 bg-white/5">Bruto</TableHead>
              <TableHead class="text-white/70 bg-white/5">Tara</TableHead>
              <TableHead class="text-white/70 bg-white/5">Tipo Cosecha</TableHead>
              <TableHead class="text-white/70 bg-white/5">Comercializacion</TableHead>
              <TableHead class="text-white/70 bg-white/5">Chofer</TableHead>
              <TableHead class="text-white/70 bg-white/5">Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" class="border-white/5">
              <TableCell :colspan="12" class="text-center text-white/50 py-8">
                Cargando...
              </TableCell>
            </TableRow>
            <TableRow v-else-if="records.length === 0" class="border-white/5">
              <TableCell :colspan="12" class="text-center text-white/50 py-8">
                No se encontraron registros
              </TableCell>
            </TableRow>
            <TableRow
              v-else
              v-for="row in records"
              :key="row.id"
              class="border-white/5 text-white/90 hover:bg-white/5 transition-colors"
            >
              <TableCell>{{ formatDate(row.fecha) }}</TableCell>
              <TableCell>{{ row.id }}</TableCell>
              <TableCell>{{ row.descvariedad }}</TableCell>
              <TableCell>{{ formatNumber(row.neto) }}</TableCell>
              <TableCell>{{ formatDecimal(row.azucar) }}</TableCell>
              <TableCell>{{ row.codigotransporte }}</TableCell>
              <TableCell>{{ formatNumber(row.bruto) }}</TableCell>
              <TableCell>{{ formatNumber(row.tara) }}</TableCell>
              <TableCell>{{ row.tipocosecha }}</TableCell>
              <TableCell>{{ row.tipocomercializacion }}</TableCell>
              <TableCell>{{ row.choferdescripcion }}</TableCell>
              <TableCell>{{ row.observacion }}</TableCell>
            </TableRow>
          </TableBody>
          <tfoot v-if="records.length > 0">
            <TableRow class="border-white/10 bg-white/5 font-semibold text-white">
              <TableCell :colspan="3" class="text-right">Totales</TableCell>
              <TableCell>{{ formatNumber(totals.sum_neto) }}</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>{{ formatNumber(totals.sum_bruto) }}</TableCell>
              <TableCell>{{ formatNumber(totals.sum_tara) }}</TableCell>
              <TableCell :colspan="4"></TableCell>
            </TableRow>
          </tfoot>
        </Table>
      </div>

      <!-- Pagination -->
      <div v-if="total > pageSize" class="p-4 flex justify-center">
        <Pagination
          :total-records="total"
          :rows="pageSize"
          :current-page="page"
          class="glass-pagination"
          @page-change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Override Pagination button styles for glass theme */
.glass-pagination :deep(button) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}
.glass-pagination :deep(button:hover:not(:disabled)) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.glass-pagination :deep(button[data-state="active"]),
.glass-pagination :deep(button:not([variant])):not(:disabled) {
  /* Active page button keeps default variant styling which is fine */
}
.glass-pagination :deep(span) {
  color: rgba(255, 255, 255, 0.5);
}
</style>
