<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'

interface Props {
  modelValue: string
  placeholder?: string
  rows?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Escribe en Markdown...',
  rows: 15,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const content = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const renderedHtml = computed(() => {
  if (!content.value) return '<p class="text-gray-400">Sin contenido</p>'
  try {
    return marked(content.value) as string
  } catch {
    return '<p class="text-red-500">Error al renderizar Markdown</p>'
  }
})

// Markdown toolbar actions
function insertText(before: string, after = '') {
  const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)

  const newText =
    content.value.substring(0, start) +
    before +
    selectedText +
    after +
    content.value.substring(end)

  content.value = newText

  // Restore cursor position
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    )
  }, 0)
}

function insertBold() {
  insertText('**', '**')
}

function insertItalic() {
  insertText('*', '*')
}

function insertHeading() {
  insertText('## ')
}

function insertLink() {
  insertText('[', '](url)')
}

function insertList() {
  insertText('\n- ')
}

function insertCode() {
  insertText('`', '`')
}

function insertCodeBlock() {
  insertText('\n```\n', '\n```\n')
}

const toolbarButtons = [
  { icon: '', tooltip: 'Negrita', action: insertBold, group: 'text', label: 'B', labelClass: 'font-bold' },
  { icon: '', tooltip: 'Cursiva', action: insertItalic, group: 'text', label: 'I', labelClass: 'italic' },
  { icon: '', tooltip: 'Titulo', action: insertHeading, group: 'text', label: 'H', labelClass: 'font-bold' },
  { icon: 'pi pi-link', tooltip: 'Enlace', action: insertLink, group: 'structure' },
  { icon: 'pi pi-list', tooltip: 'Lista', action: insertList, group: 'structure' },
  { icon: 'pi pi-code', tooltip: 'Codigo', action: insertCode, group: 'code' },
  { icon: '', tooltip: 'Bloque de codigo', action: insertCodeBlock, group: 'code', label: '{}', labelClass: 'font-mono' }
]

// Group buttons with separators
const groupedButtons = computed(() => {
  const groups: Array<typeof toolbarButtons | 'separator'> = []
  let currentGroup = ''
  let currentBatch: typeof toolbarButtons = []

  for (const btn of toolbarButtons) {
    if (btn.group !== currentGroup && currentBatch.length > 0) {
      groups.push(currentBatch)
      groups.push('separator')
      currentBatch = []
    }
    currentGroup = btn.group
    currentBatch.push(btn)
  }
  if (currentBatch.length > 0) {
    groups.push(currentBatch)
  }
  return groups
})
</script>

<template>
  <div class="markdown-editor">
    <Tabs default-value="edit">
      <TabsList class="bg-transparent h-auto p-0 border-b border-gray-200/50 dark:border-white/10 w-full justify-start rounded-none">
        <TabsTrigger
          value="edit"
          class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
        >
          Editar
        </TabsTrigger>
        <TabsTrigger
          value="preview"
          class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
        >
          Vista previa
        </TabsTrigger>
      </TabsList>

      <TabsContent value="edit" class="mt-2">
        <!-- Toolbar -->
        <TooltipProvider :delay-duration="300">
          <div class="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200/50 dark:border-white/10">
            <template v-for="(group, gIdx) in groupedButtons" :key="gIdx">
              <template v-if="group === 'separator'">
                <div class="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1 self-center" />
              </template>
              <template v-else>
                <Tooltip v-for="(btn, bIdx) in group" :key="bIdx">
                  <TooltipTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="btn.action"
                      :disabled="disabled"
                    >
                      <i v-if="btn.icon" :class="btn.icon" />
                      <span v-else class="text-sm" :class="btn.labelClass">{{ btn.label }}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{{ btn.tooltip }}</p>
                  </TooltipContent>
                </Tooltip>
              </template>
            </template>
          </div>
        </TooltipProvider>

        <!-- Editor -->
        <Textarea
          v-model="content"
          :placeholder="placeholder"
          :disabled="disabled"
          class="w-full markdown-textarea font-mono text-sm"
          :style="{ minHeight: `${rows * 1.5}rem` }"
        />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ content.length }} caracteres | Markdown soportado
        </p>
      </TabsContent>

      <TabsContent value="preview" class="mt-2">
        <div
          class="markdown-preview prose prose-sm max-w-none p-4 glass-panel min-h-[200px]"
          v-html="renderedHtml"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  color: #111827;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.dark-mode .markdown-preview :deep(h1),
.dark-mode .markdown-preview :deep(h2),
.dark-mode .markdown-preview :deep(h3) {
  color: #e5e7eb;
}

.markdown-preview :deep(p),
.markdown-preview :deep(li),
.markdown-preview :deep(td) {
  color: #374151;
}

.dark-mode .markdown-preview :deep(p),
.dark-mode .markdown-preview :deep(li),
.dark-mode .markdown-preview :deep(td) {
  color: #d1d5db;
}

.markdown-preview :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.dark-mode .markdown-preview :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.markdown-preview :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.markdown-preview :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-preview :deep(a) {
  color: #7c3aed;
}

.dark-mode .markdown-preview :deep(a) {
  color: #a78bfa;
}

.markdown-preview :deep(blockquote) {
  border-left-color: #7c3aed;
  color: #6b7280;
}

.dark-mode .markdown-preview :deep(blockquote) {
  border-left-color: #a78bfa;
  color: #9ca3af;
}
</style>
