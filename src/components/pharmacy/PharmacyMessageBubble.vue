<script setup lang="ts">
import type { PharmacyTestMessage, InteractiveButton, InteractiveListItem } from '@/api/pharmacy.api'
import WhatsAppButtons from './WhatsAppButtons.vue'
import WhatsAppList from './WhatsAppList.vue'
import Tag from 'primevue/tag'

interface Props {
  message: PharmacyTestMessage
  isLatest: boolean
  disabled?: boolean
  formatTime: (timestamp: string) => string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  buttonClick: [button: InteractiveButton]
  listSelect: [item: InteractiveListItem]
}>()

const isUser = props.message.role === 'user'
const isAssistant = props.message.role === 'assistant'

// Show interactive elements only on the latest assistant message
const showInteractive = isAssistant && props.isLatest

// Determine if this user message came from an interactive selection
const isInteractiveReply = isUser && props.message.interactiveResponse

function handleButtonClick(button: InteractiveButton) {
  emit('buttonClick', button)
}

function handleListSelect(item: InteractiveListItem) {
  emit('listSelect', item)
}
</script>

<template>
  <div
    :class="[
      'message-bubble max-w-[80%] p-3 rounded-lg shadow-sm',
      isUser
        ? 'ml-auto bg-green-100 dark:bg-green-900 rounded-br-none'
        : 'mr-auto bg-white dark:bg-gray-700 rounded-bl-none'
    ]"
  >
    <!-- Interactive response indicator for user messages -->
    <div v-if="isInteractiveReply" class="flex items-center gap-1 mb-1">
      <Tag
        :value="message.interactiveResponse?.type === 'button_reply' ? 'Boton' : 'Lista'"
        severity="success"
        class="text-xs"
        style="font-size: 0.6rem; padding: 0.1rem 0.3rem;"
      />
    </div>

    <!-- Message content -->
    <div class="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
      {{ message.content }}
    </div>

    <!-- Timestamp -->
    <div
      :class="[
        'text-xs mt-1',
        isUser ? 'text-green-600 dark:text-green-400 text-right' : 'text-gray-400 dark:text-gray-500'
      ]"
    >
      {{ formatTime(message.timestamp) }}
    </div>

    <!-- Interactive elements (only for latest assistant message) -->
    <template v-if="showInteractive && !disabled">
      <!-- Buttons -->
      <WhatsAppButtons
        v-if="message.responseType === 'buttons' && message.buttons?.length"
        :buttons="message.buttons"
        :disabled="disabled"
        @select="handleButtonClick"
      />

      <!-- List -->
      <WhatsAppList
        v-if="message.responseType === 'list' && message.listItems?.length"
        :items="message.listItems"
        :disabled="disabled"
        @select="handleListSelect"
      />
    </template>
  </div>
</template>

<style scoped>
.message-bubble {
  word-break: break-word;
}
</style>
