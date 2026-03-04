<template>
  <div class="sim-panel">
    <!-- Header -->
    <div class="sim-header">
      <div class="sim-header__info">
        <h3 class="sim-header__title">Simulador</h3>
        <span v-if="isSessionActive" class="sim-header__institution">
          {{ institutionName }}
        </span>
      </div>
      <div class="sim-header__actions">
        <button
          v-if="isSessionActive"
          class="sim-icon-btn sim-icon-btn--danger"
          title="Terminar sesion"
          @click="handleEndSession"
        >
          <i class="pi pi-times" />
        </button>
        <button
          class="sim-icon-btn"
          title="Cerrar panel"
          @click="$emit('close')"
        >
          <i class="pi pi-times-circle" />
        </button>
      </div>
    </div>

    <!-- Session setup (when no active session) -->
    <div v-if="!isSessionActive" class="sim-setup">
      <div class="sim-setup__desc">
        <i class="pi pi-play-circle" />
        <p>
          Inicia una sesion de simulacion para probar el flujo de conversacion
          sin afectar datos de produccion.
        </p>
      </div>

      <!-- Institution config selector -->
      <div v-if="institutionConfigs.length > 0" class="sim-setup__field">
        <label class="sim-setup__label">Institucion</label>
        <select v-model="selectedConfigId" class="sim-setup__select">
          <option :value="null">Simulador generico</option>
          <option
            v-for="config in institutionConfigs"
            :key="config.id"
            :value="config.id"
          >
            {{ config.institution_name }}
          </option>
        </select>
      </div>

      <button
        class="sim-start-btn"
        :disabled="isCreatingSession"
        @click="handleStartSession"
      >
        <i v-if="isCreatingSession" class="pi pi-spin pi-spinner" />
        <i v-else class="pi pi-play" />
        {{ isCreatingSession ? 'Iniciando...' : 'Iniciar simulacion' }}
      </button>
    </div>

    <!-- Active session -->
    <template v-else>
      <!-- Tab switcher -->
      <div class="sim-tabs">
        <button
          :class="['sim-tab', { 'sim-tab--active': activeTab === 'chat' }]"
          @click="activeTab = 'chat'"
        >
          <i class="pi pi-comments" /> Chat
        </button>
        <button
          :class="['sim-tab', { 'sim-tab--active': activeTab === 'trace' }]"
          @click="activeTab = 'trace'"
        >
          <i class="pi pi-code" /> Trace
        </button>
      </div>

      <!-- Chat tab -->
      <div v-show="activeTab === 'chat'" class="sim-chat">
        <div ref="chatScrollRef" class="sim-chat__messages">
          <div v-if="messages.length === 0" class="sim-chat__empty">
            <i class="pi pi-comment" />
            <span>Escribe "Hola" para iniciar la conversacion</span>
          </div>
          <SimulatorMessage
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            :disabled="isLoading"
            @button-click="handleButtonClick"
            @list-select="handleListSelect"
            @show-trace="handleShowTrace"
          />
          <div v-if="isLoading" class="sim-chat__loading">
            <i class="pi pi-spin pi-spinner" />
          </div>
        </div>

        <!-- Input -->
        <div class="sim-chat__input">
          <input
            v-model="inputText"
            type="text"
            placeholder="Escribe un mensaje..."
            :disabled="isLoading"
            @keydown.enter="handleSendText"
          />
          <button
            class="sim-send-btn"
            :disabled="isLoading || !inputText.trim()"
            @click="handleSendText"
          >
            <i class="pi pi-send" />
          </button>
        </div>
      </div>

      <!-- Trace tab -->
      <div v-show="activeTab === 'trace'" class="sim-trace-tab">
        <TraceInspector
          :trace="currentTrace"
          :state-snapshot="currentStateSnapshot"
        />
      </div>
    </template>

    <!-- Error display -->
    <div v-if="error" class="sim-error">
      <i class="pi pi-exclamation-triangle" />
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import SimulatorMessage from './SimulatorMessage.vue'
import TraceInspector from './TraceInspector.vue'
import { useSimulator } from './useSimulator'
import type { SimulatorMessage as SimulatorMessageType } from './useSimulator'

defineEmits<{
  close: []
}>()

const props = defineProps<{
  domain?: string | null
}>()

const authStore = useAuthStore()

const {
  sessionId,
  institutionName,
  messages,
  isLoading,
  isCreatingSession,
  error,
  currentTrace,
  currentStateSnapshot,
  highlightedNodeId,
  isSessionActive,
  createSession,
  sendMessage,
  endSession,
  handleButtonClick,
  handleListSelect,
} = useSimulator()

// Expose highlighted node for parent graph
defineExpose({ highlightedNodeId })

// UI state
const activeTab = ref<'chat' | 'trace'>('chat')
const inputText = ref('')
const chatScrollRef = ref<HTMLElement | null>(null)
const selectedConfigId = ref<string | null>(null)
const institutionConfigs = ref<Array<{ id: string; institution_name: string }>>([])

// Load institution configs for the current org
async function loadInstitutionConfigs() {
  const orgId = authStore.currentOrgId
  if (!orgId) return

  try {
    const result = await tenantInstitutionConfigApi.list(orgId, {
      institution_type: 'medical',
      enabled_only: true,
    })
    institutionConfigs.value = result.items.map((c: { id: string; institution_name: string }) => ({
      id: c.id,
      institution_name: c.institution_name,
    }))
  } catch {
    // Silently fail — default simulator config will be used
  }
}

loadInstitutionConfigs()

// Auto-scroll chat on new messages
watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }
  }
)

async function handleStartSession() {
  const orgId = authStore.currentOrgId
  if (!orgId) return
  await createSession(orgId, selectedConfigId.value)
}

async function handleEndSession() {
  await endSession()
}

function handleSendText() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return
  inputText.value = ''
  sendMessage(text)
}

function handleShowTrace(msg: SimulatorMessageType) {
  if (msg.trace) {
    currentTrace.value = msg.trace
  }
  if (msg.stateSnapshot) {
    currentStateSnapshot.value = msg.stateSnapshot
  }
  activeTab.value = 'trace'
}
</script>

<style scoped>
.sim-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e5e7eb;
}

:root.dark-mode .sim-panel {
  background: #111827;
  border-left-color: #374151;
}

/* Header */
.sim-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

:root.dark-mode .sim-header {
  border-bottom-color: #374151;
}

.sim-header__info {
  display: flex;
  flex-direction: column;
}

.sim-header__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
}

.sim-header__institution {
  font-size: 0.75rem;
  color: #6b7280;
}

.sim-header__actions {
  display: flex;
  gap: 0.25rem;
}

.sim-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sim-icon-btn:hover {
  background: #f3f4f6;
  color: #111;
}

:root.dark-mode .sim-icon-btn:hover {
  background: #1f2937;
  color: #e9edef;
}

.sim-icon-btn--danger:hover {
  background: #fef2f2;
  color: #ef4444;
}

:root.dark-mode .sim-icon-btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Setup */
.sim-setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1rem;
  flex: 1;
}

.sim-setup__desc {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #166534;
}

:root.dark-mode .sim-setup__desc {
  background: rgba(22, 101, 52, 0.15);
  border-color: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.sim-setup__desc p {
  margin: 0;
}

.sim-setup__desc i {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.sim-setup__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.sim-setup__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sim-setup__select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: #fff;
  color: #111;
}

:root.dark-mode .sim-setup__select {
  background: #1f2937;
  border-color: #374151;
  color: #e9edef;
}

.sim-start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #22c55e;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.sim-start-btn:hover:not(:disabled) {
  background: #16a34a;
}

.sim-start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tabs */
.sim-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

:root.dark-mode .sim-tabs {
  border-bottom-color: #374151;
}

.sim-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 2px solid transparent;
}

.sim-tab:hover {
  color: #111;
  background: #f9fafb;
}

:root.dark-mode .sim-tab:hover {
  color: #e9edef;
  background: #1f2937;
}

.sim-tab--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 500;
}

/* Chat */
.sim-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.sim-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  background: #f0f2f5;
}

:root.dark-mode .sim-chat__messages {
  background: #0b141a;
}

.sim-chat__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-size: 0.8125rem;
  text-align: center;
}

.sim-chat__empty i {
  font-size: 2rem;
}

.sim-chat__loading {
  display: flex;
  justify-content: flex-start;
  padding: 0.5rem 0;
}

.sim-chat__loading i {
  color: #6b7280;
  font-size: 1.25rem;
}

.sim-chat__input {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

:root.dark-mode .sim-chat__input {
  border-top-color: #374151;
}

.sim-chat__input input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 1.25rem;
  font-size: 0.875rem;
  outline: none;
  background: #fff;
  color: #111;
}

:root.dark-mode .sim-chat__input input {
  background: #1f2937;
  border-color: #374151;
  color: #e9edef;
}

.sim-chat__input input:focus {
  border-color: #3b82f6;
}

.sim-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 50%;
  background: #25d366;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.sim-send-btn:hover:not(:disabled) {
  background: #128c7e;
}

.sim-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Trace tab */
.sim-trace-tab {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

/* Error */
.sim-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.8125rem;
  border-top: 1px solid #fecaca;
  flex-shrink: 0;
}

:root.dark-mode .sim-error {
  background: rgba(220, 38, 38, 0.1);
  border-top-color: rgba(220, 38, 38, 0.2);
  color: #f87171;
}
</style>
