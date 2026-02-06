import { ref } from 'vue'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  nodeId?: string
  nodeName?: string
}

/**
 * useWorkflowExecutionLogs - Manages workflow execution and logs
 *
 * Single responsibility: Handle execution state and log entries
 * for workflow runs.
 */
export function useWorkflowExecutionLogs(options: {
  startSimulation: () => void
}) {
  const logs = ref<LogEntry[]>([])
  const isLogsExpanded = ref(false)

  function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    logs.value.push({
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    })
  }

  function addInfoLog(message: string, nodeId?: string, nodeName?: string) {
    addLog({ level: 'info', message, nodeId, nodeName })
  }

  function addSuccessLog(message: string, nodeId?: string, nodeName?: string) {
    addLog({ level: 'success', message, nodeId, nodeName })
  }

  function addWarnLog(message: string, nodeId?: string, nodeName?: string) {
    addLog({ level: 'warn', message, nodeId, nodeName })
  }

  function addErrorLog(message: string, nodeId?: string, nodeName?: string) {
    addLog({ level: 'error', message, nodeId, nodeName })
  }

  function clearLogs() {
    logs.value = []
  }

  function executeWorkflow() {
    options.startSimulation()
    isLogsExpanded.value = true
    addInfoLog('Iniciando ejecución del workflow...')
  }

  function expandLogs() {
    isLogsExpanded.value = true
  }

  function collapseLogs() {
    isLogsExpanded.value = false
  }

  function toggleLogs() {
    isLogsExpanded.value = !isLogsExpanded.value
  }

  return {
    // State
    logs,
    isLogsExpanded,

    // Log actions
    addLog,
    addInfoLog,
    addSuccessLog,
    addWarnLog,
    addErrorLog,
    clearLogs,

    // Execution
    executeWorkflow,

    // Panel controls
    expandLogs,
    collapseLogs,
    toggleLogs
  }
}
