<script setup lang="ts">
import { computed, watch } from 'vue'
import { useInstitutionConversation } from '@/composables/useInstitutionConversation'
import { formatPhoneNumber } from '@/types/institutionConversation.types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  visible: boolean
  orgId: string
  configId: string
  conversationId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const {
  conversation,
  isLoading,
  fetchConversation
} = useInstitutionConversation()

const dialogOpen = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

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
    return 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ml-auto'
  }
  if (senderType === 'assistant') {
    return 'bg-green-100 dark:bg-green-950/40 text-green-900 dark:text-green-100 mr-auto'
  }
  return 'bg-muted text-muted-foreground mx-auto text-center'
}

function handleClose() {
  emit('update:visible', false)
}

watch(
  () => [props.visible, props.conversationId] as const,
  ([visible, convId]) => {
    if (visible && convId && props.orgId && props.configId) {
      fetchConversation(props.orgId, props.configId, convId)
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-[700px] glass-dialog max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          Historial de mensajes de la conversacion
        </DialogDescription>
      </DialogHeader>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4 py-4">
        <div class="h-[60px] rounded-lg bg-muted animate-pulse" />
        <div v-for="i in 5" :key="i" class="h-[40px] rounded-lg bg-muted animate-pulse" />
      </div>

      <!-- Content -->
      <div v-else-if="conversation" class="flex flex-col gap-4 py-4 min-h-0">
        <!-- Context Summary -->
        <div v-if="contextSummary" class="bg-muted/50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-info-circle text-blue-500" />
            <span class="text-sm font-medium text-foreground">Resumen de la conversacion</span>
          </div>
          <p class="text-sm text-muted-foreground italic">{{ contextSummary }}</p>
        </div>

        <!-- Topic Tags -->
        <div v-if="topicHistory.length > 0" class="flex flex-wrap gap-2">
          <Badge
            v-for="topic in topicHistory"
            :key="topic"
            variant="secondary"
            class="text-xs"
          >
            {{ topic }}
          </Badge>
        </div>

        <!-- Messages -->
        <div class="border rounded-lg overflow-y-auto flex-1 min-h-0 max-h-[400px]">
          <div class="p-4 space-y-3">
            <div
              v-for="message in conversation.messages"
              :key="message.id"
              class="flex flex-col max-w-[80%] rounded-lg p-3"
              :class="getMessageClass(message.sender_type)"
            >
              <!-- Sender info -->
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

              <!-- Message content -->
              <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
            </div>

            <!-- Empty state -->
            <div
              v-if="conversation.messages.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              <i class="pi pi-comments text-4xl mb-2" />
              <p>No hay mensajes en esta conversacion</p>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex justify-between text-sm text-muted-foreground border-t pt-3">
          <span>Total: {{ conversation.total_messages }} mensajes</span>
          <span v-if="conversation.context.last_activity">
            Ultima actividad: {{ formatDate(conversation.context.last_activity) }}
          </span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else class="text-center py-8 text-muted-foreground">
        <i class="pi pi-exclamation-circle text-4xl mb-2" />
        <p>No se pudo cargar la conversacion</p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">Cerrar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
