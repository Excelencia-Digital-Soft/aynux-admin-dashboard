<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'

import Textarea from 'primevue/textarea'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'

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

const activeTab = ref('0')

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
</script>

<template>
  <div class="markdown-editor">
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="0">Editar</Tab>
        <Tab value="1">Vista previa</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <!-- Toolbar -->
          <div class="flex gap-1 mb-2 pb-2 border-b">
            <Button
              icon="pi pi-bold"
              severity="secondary"
              text
              size="small"
              @click="insertBold"
              :disabled="disabled"
              v-tooltip="'Negrita'"
            />
            <Button
              icon="pi pi-italic"
              severity="secondary"
              text
              size="small"
              @click="insertItalic"
              :disabled="disabled"
              v-tooltip="'Cursiva'"
            />
            <Button
              icon="pi pi-heading"
              severity="secondary"
              text
              size="small"
              @click="insertHeading"
              :disabled="disabled"
              v-tooltip="'Titulo'"
            />
            <Button
              icon="pi pi-link"
              severity="secondary"
              text
              size="small"
              @click="insertLink"
              :disabled="disabled"
              v-tooltip="'Enlace'"
            />
            <Button
              icon="pi pi-list"
              severity="secondary"
              text
              size="small"
              @click="insertList"
              :disabled="disabled"
              v-tooltip="'Lista'"
            />
            <Button
              icon="pi pi-code"
              severity="secondary"
              text
              size="small"
              @click="insertCode"
              :disabled="disabled"
              v-tooltip="'Codigo'"
            />
            <Button
              severity="secondary"
              text
              size="small"
              @click="insertCodeBlock"
              :disabled="disabled"
              v-tooltip="'Bloque de codigo'"
            >
              <span class="text-xs font-mono">{}</span>
            </Button>
          </div>

          <!-- Editor -->
          <Textarea
            v-model="content"
            :rows="rows"
            :placeholder="placeholder"
            :disabled="disabled"
            class="w-full markdown-textarea font-mono text-sm"
          />
          <p class="text-xs text-gray-400 mt-1">
            {{ content.length }} caracteres | Markdown soportado
          </p>
        </TabPanel>

        <TabPanel value="1">
          <div
            class="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg min-h-[200px]"
            v-html="renderedHtml"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.markdown-editor :deep(.p-tabpanels) {
  padding: 0.5rem 0;
}

.markdown-editor :deep(.prose) {
  color: #374151;
}

.markdown-editor :deep(.prose h1),
.markdown-editor :deep(.prose h2),
.markdown-editor :deep(.prose h3) {
  color: #111827;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-editor :deep(.prose code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.markdown-editor :deep(.prose pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.markdown-editor :deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
}
</style>
