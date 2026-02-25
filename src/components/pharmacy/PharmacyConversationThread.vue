<script setup lang="ts">
import { computed, watch } from 'vue'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import { formatPhoneNumber } from '@/types/pharmacyConfig.types'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  visible: boolean
  pharmacyId: string
  conversationId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const {
  conversation,
  isLoading,
  fetchConversation
} = usePharmacyConfig()

const dialogTitle = computed(() => {
  if (!conversation.value) return 'Conversacion'
  return `Conversacion con ${formatPhoneNumber(conversation.value.user_phone)}`
})

const contextSummary = computed(() => {
  if (!conversation.value?.context) return null
  return conversation.value.context.rolling_summary
})

const topicHistory = computed(() => {
  if (!conversation.value?.context) return []
  return conversation.value.context.topic_history || []
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getMessageClass(senderType: string): string {
  if (senderType === 'user') {
    return 'bg-blue-50 dark:bg-blue-500/20 text-blue-900 dark:text-blue-100 ml-auto border border-blue-200 dark:border-blue-500/30'
  }
  if (senderType === 'assistant') {
    return 'bg-green-50 dark:bg-green-500/20 text-green-900 dark:text-green-100 mr-auto border border-green-200 dark:border-green-500/30'
  }
  return 'bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-white/70 mx-auto text-center border border-gray-200 dark:border-white/20'
}

function handleClose() {
  emit('update:visible', false)
}

watch(
  () => [props.visible, props.conversationId] as const,
  ([visible, convId]) => {
    if (visible && convId && props.pharmacyId) {
      fetchConversation(convId, props.pharmacyId)
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="visible" @update:open="handleClose">
    <DialogContent class="max-w-[700px] max-h-[80vh] flex flex-col bg-white dark:bg-slate-900/95 backdrop-blur-xl border-gray-200 dark:border-white/15 text-foreground dark:text-white">
      <DialogHeader>
        <DialogTitle class="text-xl font-semibold text-foreground dark:text-white">
          {{ dialogTitle }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          Hilo de mensajes de la conversacion
        </DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="space-y-4 py-4">
        <div v-for="i in 6" :key="i" class="h-12 bg-gray-50 dark:bg-white/5 rounded-lg animate-pulse" />
      </div>

      <div v-else-if="conversation" class="flex flex-col gap-4 min-h-0 overflow-y-auto">
        <div v-if="contextSummary" class="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-info-circle text-cyan-400" />
            <span class="text-sm font-medium text-gray-700 dark:text-white/80">Resumen de la conversacion</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-white/60 italic">{{ contextSummary }}</p>
        </div>

        <div v-if="topicHistory.length > 0" class="flex flex-wrap gap-2">
          <Badge
            v-for="topic in topicHistory"
            :key="topic"
            variant="secondary"
            class="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/20"
          >
            {{ topic }}
          </Badge>
        </div>

        <div class="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <div class="max-h-[400px] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div
              v-for="message in conversation.messages"
              :key="message.id"
              class="flex flex-col max-w-[80%] rounded-xl p-3 backdrop-blur-sm"
              :class="getMessageClass(message.sender_type)"
            >
              <div class="flex items-center gap-2 mb-1">
                <i
                  v-if="message.sender_type === 'user'"
                  class="pi pi-user text-xs"
                />
                <i
                  v-else-if="message.sender_type === 'assistant'"
                  class="pi pi-android text-xs"
                />
                <i v-else class="pi pi-cog text-xs" />
                <span class="text-xs font-medium">
                  {{ message.sender_type === 'user' ? 'Cliente' : message.agent_name || 'Agente' }}
                </span>
                <span class="text-xs opacity-70">
                  {{ formatDate(message.created_at) }}
                </span>
              </div>

              <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
            </div>

            <div
              v-if="conversation.messages.length === 0"
              class="text-center py-8 text-gray-400 dark:text-white/50"
            >
              <i class="pi pi-comments text-4xl mb-2" />
              <p>No hay mensajes en esta conversacion</p>
            </div>
          </div>
        </div>

        <div class="flex justify-between text-sm text-gray-400 dark:text-white/50 border-t border-gray-200 dark:border-white/10 pt-3">
          <span>Total: {{ conversation.total_messages }} mensajes</span>
          <span v-if="conversation.context.last_activity">
            Ultima actividad: {{ formatDate(conversation.context.last_activity) }}
          </span>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-400 dark:text-white/50">
        <i class="pi pi-exclamation-circle text-4xl mb-2" />
        <p>No se pudo cargar la conversacion</p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          class="border-gray-300 dark:border-white/20 text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          @click="handleClose"
        >
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.25);
}

.dark-mode .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

.dark-mode .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
