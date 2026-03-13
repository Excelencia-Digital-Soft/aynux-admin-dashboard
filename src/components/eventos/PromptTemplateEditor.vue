<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { FormField } from '@/types/eventosConfig.types'

import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import { GripVertical, AlertTriangle, Info } from 'lucide-vue-next'

interface Props {
  modelValue: string
  fields: FormField[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const templateText = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const textareaRef = ref<InstanceType<typeof Textarea> | null>(null)

const namedFields = computed(() => props.fields.filter(f => f.name.trim()))

// --- Stats ---
const charCount = computed(() => templateText.value.length)
const variablesUsed = computed(() => {
  const matches = templateText.value.match(/\{\{(\w+)\}\}/g)
  if (!matches) return 0
  return new Set(matches).size
})

// --- Warnings ---
const undefinedVariables = computed(() => {
  const matches = templateText.value.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  const fieldNames = new Set(namedFields.value.map(f => f.name))
  const vars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  return vars.filter(v => !fieldNames.has(v))
})

const unusedFields = computed(() => {
  return namedFields.value.filter(f => {
    const pattern = `{{${f.name}}}`
    return !templateText.value.includes(pattern)
  })
})

// --- Insert variable at cursor ---
function getTextarea(): HTMLTextAreaElement | null {
  const wrapper = textareaRef.value
  if (!wrapper) return null
  // shadcn Textarea wraps a native textarea
  const el = (wrapper as any)?.$el
  if (el instanceof HTMLTextAreaElement) return el
  if (el?.querySelector) return el.querySelector('textarea')
  return document.querySelector('.template-textarea') as HTMLTextAreaElement
}

function insertVariable(fieldName: string) {
  const textarea = getTextarea()
  if (!textarea) return

  const token = `{{${fieldName}}}`
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  const newText =
    templateText.value.substring(0, start) +
    token +
    templateText.value.substring(end)

  templateText.value = newText

  nextTick(() => {
    textarea.focus()
    const pos = start + token.length
    textarea.setSelectionRange(pos, pos)
  })
}

// --- Drag & Drop ---
function onPillDragStart(event: DragEvent, fieldName: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', `{{${fieldName}}}`)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function onTemplateDrop(event: DragEvent) {
  event.preventDefault()
  const data = event.dataTransfer?.getData('text/plain')
  if (!data) return

  const textarea = getTextarea()
  if (!textarea) return

  // Try to get caret position from drop coordinates
  let insertPos = textarea.selectionStart
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY)
    if (range) {
      textarea.focus()
      // Approximate position from the native textarea
      insertPos = textarea.selectionStart
    }
  }

  const newText =
    templateText.value.substring(0, insertPos) +
    data +
    templateText.value.substring(insertPos)

  templateText.value = newText

  nextTick(() => {
    textarea.focus()
    const pos = insertPos + data.length
    textarea.setSelectionRange(pos, pos)
  })
}

function onTemplateDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// --- Preview ---
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const renderedPreview = computed(() => {
  if (!templateText.value) return '<span class="text-muted-foreground">Sin contenido</span>'

  let html = escapeHtml(templateText.value)

  // Replace {{var}} with inline badges
  html = html.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
    const field = namedFields.value.find(f => f.name === varName)
    const label = field ? field.label || field.name : varName
    const isUndefined = !field
    const badgeClass = isUndefined
      ? 'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-mono bg-destructive/20 text-destructive border border-destructive/30'
      : 'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-mono bg-primary/20 text-primary border border-primary/30'
    return `<span class="${badgeClass}">${escapeHtml(label)}</span>`
  })

  // Convert newlines to <br>
  html = html.replace(/\n/g, '<br>')

  return html
})
</script>

<template>
  <div class="space-y-3">
    <!-- Variable Palette -->
    <div>
      <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
        Variables disponibles
      </label>
      <div v-if="namedFields.length > 0" class="flex flex-wrap gap-1.5">
        <TooltipProvider v-for="field in namedFields" :key="field.name">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                type="button"
                draggable="true"
                class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full font-mono text-xs cursor-grab hover:bg-primary/30 transition-colors active:cursor-grabbing"
                @click="insertVariable(field.name)"
                @dragstart="onPillDragStart($event, field.name)"
              >
                <GripVertical class="w-3 h-3 opacity-50" />
                <span v-text="'{{' + field.name + '}}'"></span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p class="font-medium">{{ field.label || field.name }}</p>
              <p class="text-xs text-muted-foreground">Tipo: {{ field.type }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p v-else class="text-xs text-muted-foreground italic">
        Agrega campos en la pestana Campos para usar variables
      </p>
    </div>

    <!-- Edit / Preview Tabs -->
    <Tabs default-value="edit" class="w-full">
      <TabsList class="w-full">
        <TabsTrigger value="edit" class="flex-1">Editar</TabsTrigger>
        <TabsTrigger value="preview" class="flex-1">Vista Previa</TabsTrigger>
      </TabsList>

      <TabsContent value="edit" class="mt-2">
        <Textarea
          ref="textareaRef"
          v-model="templateText"
          class="template-textarea font-mono text-sm"
          :rows="8"
          placeholder="Escribe el template del mensaje...&#10;Usa {{nombre_campo}} para insertar variables"
          @drop="onTemplateDrop"
          @dragover="onTemplateDragOver"
        />
        <div class="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span>{{ charCount }} caracteres</span>
          <span class="text-border">|</span>
          <span>{{ variablesUsed }} variables usadas</span>
        </div>
      </TabsContent>

      <TabsContent value="preview" class="mt-2">
        <div
          class="min-h-[200px] rounded-md border border-input bg-background/50 p-3 text-sm leading-relaxed"
          v-html="renderedPreview"
        />
      </TabsContent>
    </Tabs>

    <!-- Warnings -->
    <div v-if="undefinedVariables.length > 0 || unusedFields.length > 0" class="space-y-1.5">
      <div v-if="undefinedVariables.length > 0" class="flex items-start gap-2 text-xs">
        <AlertTriangle class="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
        <span class="text-destructive">
          Variables sin campo definido:
          <Badge
            v-for="v in undefinedVariables"
            :key="v"
            variant="destructive"
            class="ml-1 font-mono text-[10px]"
            v-text="'{{' + v + '}}'"
          />
        </span>
      </div>
      <div v-if="unusedFields.length > 0" class="flex items-start gap-2 text-xs">
        <Info class="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <span class="text-muted-foreground">
          Campos no usados en template:
          <Badge
            v-for="f in unusedFields"
            :key="f.name"
            variant="secondary"
            class="ml-1 font-mono text-[10px]"
            v-text="f.name"
          />
        </span>
      </div>
    </div>
  </div>
</template>
