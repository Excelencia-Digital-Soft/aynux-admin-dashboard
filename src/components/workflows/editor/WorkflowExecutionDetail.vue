<script setup lang="ts">
import { computed } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ExecutionLogDetail } from '@/types/workflow-execution.types'

const props = defineProps<{
  log: ExecutionLogDetail | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'replay', payload: { logId: string; nodeId: string }): void
}>()

const isOpen = computed(() => props.log !== null || props.isLoading)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es')
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function handleOpenChange(open: boolean) {
  if (!open) emit('close')
}
</script>

<template>
  <Sheet :open="isOpen" @update:open="handleOpenChange">
    <SheetContent class="w-[500px] sm:max-w-[500px] overflow-y-auto exec-detail-sheet">
      <SheetHeader>
        <SheetTitle>Detalle de Ejecucion</SheetTitle>
        <SheetDescription class="sr-only">Traza y datos de la ejecucion del workflow</SheetDescription>
      </SheetHeader>

      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner text-2xl" />
        <span>Cargando...</span>
      </div>

      <div v-else-if="log" class="detail-content">
        <!-- Summary -->
        <div class="detail-section">
          <h3 class="section-title">RESUMEN</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Estado</span>
              <Badge :variant="log.is_error ? 'destructive' : 'default'">
                {{ log.is_error ? 'Error' : 'Completado' }}
              </Badge>
            </div>
            <div class="summary-item">
              <span class="summary-label">Dominio</span>
              <span>{{ log.domain_key }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Duracion</span>
              <span>{{ formatDuration(log.execution_ms) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Fecha</span>
              <span>{{ formatDate(log.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Input/Output -->
        <div class="detail-section">
          <h3 class="section-title">ENTRADA / SALIDA</h3>
          <div class="io-block">
            <span class="io-label">Entrada:</span>
            <p class="io-text">{{ log.input_message || '-' }}</p>
          </div>
          <div class="io-block">
            <span class="io-label">Salida:</span>
            <p class="io-text">{{ log.output_message || '-' }}</p>
          </div>
          <div v-if="log.error_detail" class="io-block error-block">
            <span class="io-label">Error:</span>
            <p class="io-text text-red-400">{{ log.error_detail }}</p>
          </div>
        </div>

        <!-- Trace Timeline -->
        <div v-if="log.trace && log.trace.length > 0" class="detail-section">
          <h3 class="section-title">TRAZA DE EJECUCION</h3>
          <div class="trace-timeline">
            <div
              v-for="(entry, index) in log.trace"
              :key="index"
              class="trace-entry"
            >
              <div class="trace-dot" :class="{
                'dot-success': !entry.error,
                'dot-error': !!entry.error
              }" />
              <div class="trace-info">
                <span class="trace-node">{{ (entry.node_label as string) || (entry.node_id as string) || `Paso ${index + 1}` }}</span>
                <span v-if="entry.duration_ms" class="trace-duration">{{ formatDuration(entry.duration_ms as number) }}</span>
                <span v-if="entry.error" class="trace-error">{{ entry.error }}</span>
              </div>
              <Button
                v-if="entry.node_id"
                variant="ghost"
                size="sm"
                class="trace-replay-btn"
                title="Replay desde aqui"
                @click="emit('replay', { logId: log!.id, nodeId: entry.node_id as string })"
              >
                <i class="pi pi-replay text-xs" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Edge Data -->
        <div v-if="log.edge_data && Object.keys(log.edge_data).length > 0" class="detail-section">
          <h3 class="section-title">DATOS DE ARISTAS</h3>
          <div
            v-for="(value, key) in log.edge_data"
            :key="key as string"
            class="edge-data-block"
          >
            <details>
              <summary class="edge-data-key">{{ key }}</summary>
              <pre class="edge-data-json">{{ JSON.stringify(value, null, 2) }}</pre>
            </details>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
.exec-detail-sheet {
  background: hsl(var(--background)) !important;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  color: hsl(var(--muted-foreground));
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 16px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: hsl(var(--muted-foreground));
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
}

.io-block {
  padding: 8px 12px;
  background: hsl(var(--muted) / 0.3);
  border-radius: 6px;
}

.error-block {
  background: hsl(var(--destructive) / 0.1);
}

.io-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.io-text {
  font-size: 0.85rem;
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Trace Timeline */
.trace-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 8px;
}

.trace-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-left: 2px solid hsl(var(--border));
  padding-left: 16px;
  position: relative;
}

.trace-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  position: absolute;
  left: -6px;
}

.dot-success { background: #10b981; }
.dot-error { background: #ef4444; }

.trace-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  padding-left: 8px;
}

.trace-node {
  font-size: 0.85rem;
  font-weight: 500;
}

.trace-duration {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
}

.trace-error {
  font-size: 0.75rem;
  color: hsl(var(--destructive));
}

.trace-replay-btn {
  flex-shrink: 0;
}

/* Edge Data */
.edge-data-block {
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  overflow: hidden;
}

.edge-data-key {
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  background: hsl(var(--muted) / 0.3);
}

.edge-data-key:hover {
  background: hsl(var(--muted) / 0.5);
}

.edge-data-json {
  padding: 12px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  overflow-x: auto;
  background: hsl(var(--muted) / 0.15);
  max-height: 200px;
  margin: 0;
}
</style>
