<script setup lang="ts">
/**
 * WorkflowLogsPanel - n8n-style collapsible logs panel
 *
 * Features:
 * - Position: Bottom bar
 * - Collapsible with header click
 * - Log entries with timestamps
 * - Color-coded log levels
 */
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  nodeId?: string
  nodeName?: string
}

const props = defineProps<{
  logs: LogEntry[]
  isExpanded: boolean
  isExecuting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isExpanded', value: boolean): void
  (e: 'clear'): void
  (e: 'logClick', logId: string): void
}>()

const errorCount = computed(() => props.logs.filter(l => l.level === 'error').length)
const warnCount = computed(() => props.logs.filter(l => l.level === 'warn').length)

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getLevelIcon(level: LogEntry['level']): string {
  const icons: Record<string, string> = {
    info: 'pi-info-circle',
    warn: 'pi-exclamation-triangle',
    error: 'pi-times-circle',
    success: 'pi-check-circle'
  }
  return icons[level] || 'pi-circle'
}

function getLevelColor(level: LogEntry['level']): string {
  const colors: Record<string, string> = {
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    success: '#10b981'
  }
  return colors[level] || '#64748b'
}
</script>

<template>
  <div class="n8n-logs-panel" :class="{ expanded: isExpanded }">
    <!-- Header (always visible) -->
    <div class="logs-header" @click="emit('update:isExpanded', !isExpanded)">
      <div class="header-left">
        <i :class="['pi', isExpanded ? 'pi-chevron-down' : 'pi-chevron-up']" />
        <span class="header-title">Logs de ejecución</span>

        <!-- Status badges -->
        <Badge v-if="isExecuting" variant="secondary" class="ml-2">
          <i class="pi pi-spin pi-spinner mr-1" style="font-size: 10px" />
          Ejecutando
        </Badge>

        <Badge v-if="errorCount > 0" variant="destructive" class="ml-2">
          {{ errorCount }} error{{ errorCount > 1 ? 'es' : '' }}
        </Badge>

        <Badge v-if="warnCount > 0" class="ml-2 bg-amber-500/20 text-amber-400">
          {{ warnCount }} advertencia{{ warnCount > 1 ? 's' : '' }}
        </Badge>
      </div>

      <div class="header-right" @click.stop>
        <Button
          v-if="logs.length > 0"
          variant="ghost"
          size="sm"
          class="clear-button"
          @click="emit('clear')"
        >
          <i class="pi pi-trash mr-1" />
          Limpiar
        </Button>
      </div>
    </div>

    <!-- Logs content (collapsible) -->
    <Transition name="slide-down">
      <div v-if="isExpanded" class="logs-content">
        <div v-if="logs.length === 0" class="logs-empty">
          <i class="pi pi-inbox" />
          <span>No hay logs de ejecución</span>
        </div>

        <div v-else class="logs-list">
          <div
            v-for="log in logs"
            :key="log.id"
            class="log-entry"
            :class="[`level-${log.level}`]"
            @click="log.nodeId && emit('logClick', log.id)"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <i
              :class="['pi', getLevelIcon(log.level)]"
              :style="{ color: getLevelColor(log.level) }"
            />
            <span v-if="log.nodeName" class="log-node">
              [{{ log.nodeName }}]
            </span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.n8n-logs-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(6, 18, 34, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  z-index: 20;
}

/* Header */
.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.logs-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left i {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s;
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.header-right {
  display: flex;
  align-items: center;
}

.clear-button {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 12px !important;
}

.clear-button:hover {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* Logs content */
.logs-content {
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.logs-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.logs-empty i {
  font-size: 16px;
}

.logs-list {
  padding: 8px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  transition: background 0.15s;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.03);
}

.log-entry.level-error {
  background: rgba(239, 68, 68, 0.1);
}

.log-entry.level-warn {
  background: rgba(245, 158, 11, 0.1);
}

.log-time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  min-width: 70px;
}

.log-entry i {
  font-size: 12px;
  flex-shrink: 0;
}

.log-node {
  color: #8b5cf6;
  font-weight: 600;
}

.log-message {
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Scrollbar */
.logs-content::-webkit-scrollbar {
  width: 6px;
}

.logs-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.logs-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.logs-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
