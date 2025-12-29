<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { usePharmacyConfig } from '@/composables/usePharmacyConfig'
import { formatPhoneNumber } from '@/types/pharmacyConfig.types'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import ScrollPanel from 'primevue/scrollpanel'

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
    return 'bg-blue-100 text-blue-900 ml-auto'
  }
  if (senderType === 'assistant') {
    return 'bg-green-100 text-green-900 mr-auto'
  }
  return 'bg-gray-100 text-gray-700 mx-auto text-center'
}

function handleClose() {
  emit('update:visible', false)
}

// Watch for visibility changes to load conversation
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
  <Dialog
    :visible="visible"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '700px', maxHeight: '80vh' }"
    @update:visible="handleClose"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <Skeleton height="60px" />
      <Skeleton v-for="i in 5" :key="i" height="40px" />
    </div>

    <!-- Content -->
    <div v-else-if="conversation" class="flex flex-col gap-4">
      <!-- Context Summary -->
      <div v-if="contextSummary" class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-blue-500" />
          <span class="text-sm font-medium text-gray-700">Resumen de la conversacion</span>
        </div>
        <p class="text-sm text-gray-600 italic">{{ contextSummary }}</p>
      </div>

      <!-- Topic Tags -->
      <div v-if="topicHistory.length > 0" class="flex flex-wrap gap-2">
        <Tag
          v-for="topic in topicHistory"
          :key="topic"
          :value="topic"
          severity="secondary"
          class="text-xs"
        />
      </div>

      <!-- Messages -->
      <ScrollPanel style="height: 400px" class="border rounded-lg">
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
            class="text-center py-8 text-gray-500"
          >
            <i class="pi pi-comments text-4xl mb-2" />
            <p>No hay mensajes en esta conversacion</p>
          </div>
        </div>
      </ScrollPanel>

      <!-- Stats -->
      <div class="flex justify-between text-sm text-gray-500 border-t pt-3">
        <span>Total: {{ conversation.total_messages }} mensajes</span>
        <span v-if="conversation.context.last_activity">
          Ultima actividad: {{ formatDate(conversation.context.last_activity) }}
        </span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8 text-gray-500">
      <i class="pi pi-exclamation-circle text-4xl mb-2" />
      <p>No se pudo cargar la conversacion</p>
    </div>

    <template #footer>
      <Button
        label="Cerrar"
        severity="secondary"
        @click="handleClose"
      />
    </template>
  </Dialog>
</template>
