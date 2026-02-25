<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { useTurnosMedicosTesting } from '@/composables/useTurnosMedicosTesting'
import { useToast } from '@/composables/useToast'
import type { InteractiveButton, InteractiveListItem } from '@/types/turnosMedicos.types'

// Components
import TurnosMedicosTestHeader from '@/components/testing/turnos-medicos/TurnosMedicosTestHeader.vue'
import TurnosMedicosChatWindow from '@/components/testing/turnos-medicos/TurnosMedicosChatWindow.vue'
import TurnosMedicosChatInput from '@/components/testing/turnos-medicos/TurnosMedicosChatInput.vue'
import TurnosMedicosDebugPanel from '@/components/testing/turnos-medicos/TurnosMedicosDebugPanel.vue'
import TurnosMedicosQuickActions from '@/components/testing/turnos-medicos/TurnosMedicosQuickActions.vue'

const DEFAULT_PHONE = '5491100001234'

const {
  isLoading,
  isSending,
  institutions,
  selectedInstitution,
  sessionId,
  messages,
  inputMessage,
  webhookConfig,
  executionSteps,
  graphState,
  conversationHistory,
  historyMessages,
  selectedConversation,
  isLoadingHistory,
  isDeletingHistory,
  showDeleteConfirm,
  hasSession,
  fetchInstitutions,
  sendMessage,
  handleButtonClick,
  handleListSelect,
  clearSession,
  setQuickMessage,
  updateWebhookConfig,
  fetchHistory,
  selectConversation,
  deleteConversation,
  deleteAllHistory,
  formatTime
} = useTurnosMedicosTesting({ defaultPhone: DEFAULT_PHONE })

const toast = useToast()
const chatInputRef = ref<InstanceType<typeof TurnosMedicosChatInput> | null>(null)

// Auto-focus input when sending finishes
watch(() => isSending.value, (sending, wasSending) => {
  if (wasSending && !sending) {
    setTimeout(() => chatInputRef.value?.focus(), 100)
  }
})

function onButtonClick(button: InteractiveButton) {
  handleButtonClick(button)
}

function onListSelect(item: InteractiveListItem) {
  handleListSelect(item)
}

async function copyAllChat() {
  if (messages.value.length === 0) {
    toast.warn('No hay mensajes para copiar')
    return
  }

  const chatText = messages.value
    .map((msg) => {
      const time = formatTime(msg.timestamp)
      const role = msg.role === 'user' ? 'Paciente' : 'Asistente'
      return `[${time}] ${role}: ${msg.content}`
    })
    .join('\n\n')

  try {
    await navigator.clipboard.writeText(chatText)
    toast.success('Chat copiado al portapapeles')
  } catch (err) {
    console.error('Error copying chat:', err)
    toast.error('Error al copiar el chat')
  }
}
</script>

<template>
  <div class="turnos-medicos-testing-page">
    <TurnosMedicosTestHeader
      :is-loading="isLoading"
      :has-session="hasSession"
      @refresh="fetchInstitutions"
      @clear="clearSession"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Panel -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div class="rounded-2xl overflow-hidden bg-white/70 dark:bg-navy-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl">
          <TurnosMedicosChatWindow
            v-model:selected-institution="selectedInstitution"
            :messages="messages"
            :institutions="institutions"
            :has-session="hasSession"
            :is-sending="isSending"
            @copy-chat="copyAllChat"
            @button-click="onButtonClick"
            @list-select="onListSelect"
          />

          <TurnosMedicosChatInput
            ref="chatInputRef"
            v-model="inputMessage"
            :is-loading="isSending"
            :disabled="!selectedInstitution"
            @send="sendMessage"
          />
        </div>
      </div>

      <!-- Right Sidebar -->
      <div>
        <TurnosMedicosDebugPanel
          :webhook-config="webhookConfig"
          :has-session="hasSession"
          :default-phone="DEFAULT_PHONE"
          :session-id="sessionId"
          :selected-institution="selectedInstitution"
          :message-count="messages.length"
          :execution-steps="executionSteps"
          :graph-state="graphState"
          :conversation-history="conversationHistory"
          :selected-conversation="selectedConversation"
          :history-messages="historyMessages"
          :is-loading-history="isLoadingHistory"
          :is-deleting-history="isDeletingHistory"
          @update:webhook-config="updateWebhookConfig"
          @fetch-history="fetchHistory"
          @select-conversation="selectConversation"
          @delete-conversation="deleteConversation"
          @delete-history="showDeleteConfirm = true"
        />

        <TurnosMedicosQuickActions
          @action="setQuickMessage"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="showDeleteConfirm" @update:open="(v) => showDeleteConfirm = v">
      <AlertDialogContent class="bg-white/95 dark:bg-navy-800/95 backdrop-blur-xl border-white/20 dark:border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-500" />
            Eliminar Historial
          </AlertDialogTitle>
          <AlertDialogDescription class="text-left">
            <p>
              Esta accion eliminara <strong>TODAS</strong> las conversaciones para el telefono
              <code class="bg-white/60 dark:bg-navy-900/40 px-1.5 py-0.5 rounded text-xs">{{ webhookConfig.phoneNumber }}</code>.
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              Esta accion no se puede deshacer.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeletingHistory">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isDeletingHistory"
            @click="deleteAllHistory"
          >
            <i v-if="isDeletingHistory" class="pi pi-spin pi-spinner mr-2" />
            <i v-else class="pi pi-trash mr-2" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
.turnos-medicos-testing-page {
  max-width: 100%;
}
</style>
