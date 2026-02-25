<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import type { MedicalTestMessage, Institution, InteractiveButton, InteractiveListItem } from '@/types/turnosMedicos.types'

const props = defineProps<{
  messages: MedicalTestMessage[]
  selectedInstitution: Institution | null
  institutions: Institution[]
  hasSession: boolean
  isSending: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedInstitution', value: Institution | null): void
  (e: 'copyChat'): void
  (e: 'buttonClick', button: InteractiveButton): void
  (e: 'listSelect', item: InteractiveListItem): void
}>()

const chatContainer = ref<HTMLElement | null>(null)

const selectedInstitutionId = computed({
  get: () => props.selectedInstitution?.id || '',
  set: (id: string) => {
    const institution = props.institutions.find((i) => i.id === id) || null
    emit('update:selectedInstitution', institution)
  }
})

watch(() => props.messages.length, () => {
  scrollToBottom()
})

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function formatTime(timestamp: string): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function hasInteractiveButtons(msg: MedicalTestMessage): boolean {
  return msg.responseType === 'buttons' &&
    (msg.buttons?.length ?? 0) > 0
}

function hasInteractiveList(msg: MedicalTestMessage): boolean {
  return msg.responseType === 'list' &&
    (msg.listItems?.length ?? 0) > 0
}

function linkifyText(text: string): string {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
}
</script>

<template>
  <div class="overflow-hidden">
    <!-- Chat Header -->
    <div class="flex items-center justify-between p-4 bg-white/70 dark:bg-navy-800/50 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/20">
          <i class="pi pi-calendar-plus text-xl text-white" />
        </div>
        <div>
          <div class="font-semibold text-foreground">
            {{ selectedInstitution?.name || 'Seleccionar Institucion' }}
          </div>
          <div class="text-xs text-muted-foreground flex items-center gap-2">
            <span v-if="hasSession" class="flex items-center gap-1">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Sesion activa
            </span>
            <span v-else>Sin sesion</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Select
          v-model="selectedInstitutionId"
          :disabled="hasSession"
        >
          <SelectTrigger class="w-48 bg-white/60 dark:bg-navy-900/40 backdrop-blur-sm border-white/20 dark:border-white/10">
            <SelectValue placeholder="Institucion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="inst in institutions"
              :key="inst.id"
              :value="inst.id"
            >
              {{ inst.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                @click="emit('copyChat')"
                :disabled="messages.length === 0"
                class="text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/10"
              >
                <i class="pi pi-copy" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Chat Messages -->
    <div
      ref="chatContainer"
      class="chat-messages h-[500px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50/80 to-gray-100/80 dark:from-navy-900/60 dark:to-navy-800/40 backdrop-blur-sm"
    >
      <!-- Empty state -->
      <div
        v-if="messages.length === 0 && !isSending"
        class="h-full flex items-center justify-center"
      >
        <div class="text-center text-muted-foreground">
          <div class="w-20 h-20 mx-auto mb-4 bg-white/60 dark:bg-navy-800/60 backdrop-blur-lg rounded-full flex items-center justify-center shadow-lg border border-white/20 dark:border-white/10">
            <i class="pi pi-comments text-4xl text-violet-500/80" />
          </div>
          <p class="text-lg font-medium text-foreground">Inicia una conversacion</p>
          <p class="text-sm mt-1">Escribe un mensaje o usa una accion rapida</p>
        </div>
      </div>

      <!-- Messages -->
      <div v-else class="space-y-4">
        <template v-for="(msg, idx) in messages" :key="msg.id">
          <!-- User Message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="max-w-[75%] bg-gradient-to-br from-violet-500 to-violet-600 text-white p-3 rounded-2xl rounded-br-md shadow-lg shadow-violet-500/20">
              <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
              <div class="text-xs text-violet-200 mt-1 text-right">
                {{ formatTime(msg.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Assistant Message -->
          <div v-else class="flex justify-start">
            <div class="max-w-[80%]">
              <!-- Message bubble -->
              <div class="bg-white/80 dark:bg-navy-800/60 backdrop-blur-sm p-4 rounded-2xl rounded-bl-md shadow-md border border-white/30 dark:border-white/10">
                <p
                  class="whitespace-pre-wrap break-words text-foreground"
                  v-html="linkifyText(msg.content)"
                />

                <!-- Interactive Buttons -->
                <div
                  v-if="hasInteractiveButtons(msg) && idx === messages.length - 1"
                  class="mt-3 pt-3 border-t border-violet-200/30 dark:border-violet-500/20 flex flex-col gap-2"
                >
                  <button
                    v-for="btn in msg.buttons"
                    :key="btn.id"
                    class="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                    @click="emit('buttonClick', btn)"
                    :disabled="isSending"
                  >
                    {{ btn.titulo }}
                  </button>
                </div>

                <!-- Interactive List -->
                <div
                  v-if="hasInteractiveList(msg) && idx === messages.length - 1"
                  class="mt-3 space-y-2"
                >
                  <div
                    v-for="item in msg.listItems"
                    :key="item.id"
                    class="p-3 bg-white/50 dark:bg-navy-900/40 backdrop-blur-sm rounded-xl cursor-pointer border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-navy-800/60 hover:shadow-md transition-all duration-200"
                    @click="emit('listSelect', item)"
                  >
                    <div class="font-medium text-sm text-foreground">{{ item.titulo }}</div>
                    <div v-if="item.descripcion" class="text-xs text-muted-foreground mt-0.5">
                      {{ item.descripcion }}
                    </div>
                  </div>
                </div>

                <!-- Metadata footer -->
                <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100/50 dark:border-white/5">
                  <span class="text-xs text-muted-foreground">
                    {{ formatTime(msg.timestamp) }}
                  </span>
                  <template v-if="msg.metadata">
                    <Badge
                      v-if="msg.metadata?.bypass_matched"
                      variant="info"
                      class="text-[0.6rem] px-1.5 py-0"
                    >
                      Bypass
                    </Badge>
                    <Badge
                      v-if="msg.metadata?.domain"
                      variant="secondary"
                      class="text-[0.6rem] px-1.5 py-0"
                    >
                      {{ msg.metadata?.domain }}
                    </Badge>
                    <span
                      v-if="msg.metadata?.processing_time_ms"
                      class="text-xs text-muted-foreground"
                    >
                      {{ msg.metadata?.processing_time_ms }}ms
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Typing indicator -->
        <div v-if="isSending" class="flex justify-start">
          <div class="bg-white/80 dark:bg-navy-800/60 backdrop-blur-sm p-4 rounded-2xl rounded-bl-md shadow-md border border-white/30 dark:border-white/10">
            <div class="flex gap-1.5">
              <span class="w-2 h-2 bg-violet-400 rounded-full animate-typing-dot" style="animation-delay: 0ms" />
              <span class="w-2 h-2 bg-violet-400 rounded-full animate-typing-dot" style="animation-delay: 200ms" />
              <span class="w-2 h-2 bg-violet-400 rounded-full animate-typing-dot" style="animation-delay: 400ms" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes typing-dot {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-typing-dot {
  animation: typing-dot 1.4s infinite ease-in-out;
}

.chat-messages {
  scroll-behavior: smooth;
}

/* Message link styles */
:deep(.message-link) {
  color: hsl(var(--primary));
  text-decoration: underline;
  word-break: break-all;
  transition: color 0.2s ease;
}

:deep(.message-link:hover) {
  opacity: 0.8;
}
</style>
