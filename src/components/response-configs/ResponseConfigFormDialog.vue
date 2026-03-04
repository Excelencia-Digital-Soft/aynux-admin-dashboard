<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] glass-card border-white/20 dark:border-white/10">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          Formulario para {{ isEditing ? 'editar' : 'crear' }} una configuracion de respuesta
        </DialogDescription>
      </DialogHeader>

      <!-- Save Validation Warnings -->
      <div
        v-if="saveWarnings && saveWarnings.length > 0"
        class="mx-0 mt-2 rounded-lg border p-3 text-sm"
        :class="saveWarnings.some(w => w.severity === 'critical')
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'"
      >
        <div class="flex items-center gap-2 font-medium mb-1.5">
          <i class="pi pi-exclamation-triangle text-xs" />
          <span>{{ saveWarnings.some(w => w.severity === 'critical') ? 'Errores' : 'Avisos' }} de validacion</span>
        </div>
        <ul class="space-y-1 pl-4 text-xs">
          <li v-for="(warn, idx) in saveWarnings" :key="idx" class="list-disc">
            <span :class="warn.severity === 'critical' ? 'text-red-400' : 'text-amber-400'">
              {{ warn.detail }}
            </span>
            <span v-if="warn.fix_hint" class="text-muted-foreground ml-1">— {{ warn.fix_hint }}</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
        <!-- Intent Key -->
        <div class="flex flex-col gap-1.5">
          <Label for="intent_key">Intent Key *</Label>
          <Input
            id="intent_key"
            v-model="formData.intent_key"
            :disabled="isEditing"
            placeholder="ej: greeting, payment_confirmation"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10"
          />
          <p class="text-xs text-muted-foreground">Identificador unico del intent (snake_case)</p>
        </div>

        <!-- Display Name -->
        <div class="flex flex-col gap-1.5">
          <Label for="display_name">Nombre para Mostrar</Label>
          <Input
            id="display_name"
            v-model="formData.display_name"
            placeholder="ej: Saludo Inicial"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10"
          />
        </div>

        <!-- Response Type -->
        <div class="flex flex-col gap-1.5">
          <Label>Tipo de Respuesta</Label>
          <div class="flex gap-4">
            <label
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
              :class="formData.response_type === 'fixed'
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                : 'border-white/20 dark:border-white/10 hover:border-white/30'"
            >
              <input
                type="radio"
                v-model="formData.response_type"
                value="fixed"
                class="sr-only"
                :disabled="formData.is_critical"
              />
              <i class="pi pi-file-edit text-sm" />
              <span class="text-sm font-medium">Plantilla Fija</span>
            </label>
            <label
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
              :class="[
                formData.response_type === 'prompt'
                  ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                  : 'border-white/20 dark:border-white/10 hover:border-white/30',
                formData.is_critical ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <input
                type="radio"
                v-model="formData.response_type"
                value="prompt"
                class="sr-only"
                :disabled="formData.is_critical"
              />
              <i class="pi pi-bolt text-sm" />
              <span class="text-sm font-medium">Prompt LLM (vLLM)</span>
            </label>
          </div>
          <p v-if="formData.is_critical" class="text-xs text-amber-400">
            Los intents criticos siempre usan plantilla fija
          </p>
        </div>

        <!-- Template Text -->
        <div class="flex flex-col gap-1.5">
          <Label for="template_text">
            {{ formData.response_type === 'prompt' ? 'System Prompt (vLLM)' : 'Texto de Plantilla' }}
          </Label>
          <Textarea
            id="template_text"
            v-model="formData.template_text"
            :rows="4"
            :placeholder="formData.response_type === 'prompt'
              ? 'Prompt del sistema que se envia al vLLM para generar la respuesta...'
              : 'Texto fijo con {variables} para sustitucion. Ej: Hola {customer_name}...'"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 resize-none font-mono text-sm"
          />
          <div class="flex items-center justify-between">
            <p class="text-xs text-muted-foreground">
              {{ formData.response_type === 'prompt'
                ? 'Se envia como system prompt al vLLM'
                : 'Texto con {parametros} para sustitucion directa' }}
            </p>
            <span class="text-xs text-muted-foreground">
              {{ (formData.template_text ?? '').length }} / 5000
            </span>
          </div>

          <!-- Parameter Chips -->
          <div v-if="availableParams.length > 0" class="flex flex-col gap-1.5">
            <Label class="text-xs text-muted-foreground">Parametros disponibles (click para insertar)</Label>
            <div class="flex flex-wrap gap-1.5">
              <TooltipProvider v-for="param in availableParams" :key="param.key">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-md border transition-colors cursor-pointer hover:bg-primary/10 hover:border-primary/30"
                      :class="param.source === 'computed' ? 'border-amber-500/30 text-amber-400' : param.source === 'system' ? 'border-green-500/30 text-green-400' : 'border-white/20 text-muted-foreground'"
                      @click="insertParam(param.key)"
                    >
                      {<span>{{ param.key }}</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" class="max-w-xs">
                    <p class="font-medium text-sm">{{ param.label }}</p>
                    <p class="text-xs text-muted-foreground">{{ param.description }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <!-- Unknown Variables Warning -->
          <div v-if="unknownVars.length > 0" class="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
            <i class="pi pi-exclamation-triangle text-xs mt-0.5 shrink-0" />
            <span>Variables no reconocidas: <code v-for="v in unknownVars" :key="v" class="mx-0.5 font-mono">{{'{'}}{{ v }}{{'}'}}</code></span>
          </div>

          <!-- Preview Toggle -->
          <button
            v-if="formData.template_text && formData.response_type === 'fixed'"
            type="button"
            class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
            @click="showPreview = !showPreview"
          >
            <i :class="showPreview ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-xs" />
            {{ showPreview ? 'Ocultar vista previa' : 'Vista previa WhatsApp' }}
          </button>

          <!-- WhatsApp Preview -->
          <div v-if="showPreview && formData.template_text" class="rounded-lg border border-white/10 bg-[#0b141a] p-3">
            <div class="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <i class="pi pi-whatsapp text-green-500" />
              <span>Vista previa (datos de ejemplo)</span>
            </div>
            <div class="bg-[#005c4b] text-white text-sm rounded-lg rounded-tr-none px-3 py-2 max-w-[85%] ml-auto whitespace-pre-wrap">
              {{ previewText }}
            </div>
            <div
              v-if="formData.buttons && formData.buttons.length > 0"
              class="flex flex-col gap-1 mt-2 max-w-[85%] ml-auto"
            >
              <div
                v-for="(btn, i) in formData.buttons"
                :key="i"
                class="text-center text-sm text-[#53bdeb] bg-[#1f2c34] rounded-lg py-1.5 border border-white/5"
              >
                {{ btn.title || '(sin titulo)' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Task Description (visible for prompt type or when no template_text) -->
        <div v-if="formData.response_type === 'prompt' || !formData.template_text" class="flex flex-col gap-1.5">
          <Label for="task_description">Descripcion de Tarea</Label>
          <Textarea
            id="task_description"
            v-model="formData.task_description"
            :rows="3"
            placeholder="Contexto adicional que se inyecta al LLM para generar la respuesta"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 resize-none"
          />
          <p class="text-xs text-muted-foreground">Se agrega como contexto al system prompt del LLM</p>
        </div>

        <!-- Fallback Template Key -->
        <div class="flex flex-col gap-1.5">
          <Label for="fallback_template_key">Fallback Template Key *</Label>
          <Input
            id="fallback_template_key"
            v-model="formData.fallback_template_key"
            placeholder="ej: greeting, payment_confirmation"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10"
          />
          <p class="text-xs text-muted-foreground">Clave del template YAML (respaldo legacy)</p>
        </div>

        <!-- WhatsApp Buttons -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <Label>Botones WhatsApp</Label>
            <span class="text-xs text-muted-foreground">{{ (formData.buttons ?? []).length }} / 3</span>
          </div>

          <div v-if="formData.buttons?.length > 0" class="flex flex-col gap-2">
            <div
              v-for="(button, index) in formData.buttons"
              :key="index"
              class="flex items-center gap-2"
            >
              <Input
                v-model="button.id"
                placeholder="ID (ej: nuevo_turno)"
                class="flex-1 bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-xs font-mono"
              />
              <Input
                v-model="button.title"
                placeholder="Titulo (max 20)"
                :maxlength="20"
                class="flex-1 bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                @click="removeButton(index)"
              >
                <i class="pi pi-times text-xs" />
              </Button>
            </div>
          </div>

          <Button
            v-if="(formData.buttons ?? []).length < 3"
            variant="outline"
            size="sm"
            class="w-full border-dashed border-white/20 dark:border-white/10 text-muted-foreground hover:text-foreground"
            @click="addButton"
          >
            <i class="pi pi-plus text-xs mr-1.5" />
            Agregar Boton
          </Button>

          <p class="text-xs text-muted-foreground">
            Botones interactivos de WhatsApp. Maximo 3, titulo maximo 20 caracteres.
          </p>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <Label for="description">Descripcion (opcional)</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :rows="2"
            placeholder="Notas adicionales sobre esta configuracion"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 resize-none"
          />
        </div>

        <!-- Priority -->
        <div class="flex flex-col gap-1.5">
          <Label for="priority">Prioridad</Label>
          <Input
            id="priority"
            v-model.number="formData.priority"
            type="number"
            :min="0"
            :max="1000"
            class="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10"
          />
          <p class="text-xs text-muted-foreground">Mayor numero = mayor prioridad (0-1000)</p>
        </div>

        <!-- Checkboxes -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex items-center gap-2">
            <Checkbox
              id="is_critical"
              :checked="formData.is_critical"
              @update:checked="onCriticalChange($event as boolean)"
            />
            <div class="flex flex-col">
              <Label for="is_critical" class="cursor-pointer font-normal">Es Critico</Label>
              <p class="text-xs text-muted-foreground">Siempre usa template fijo, nunca LLM</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              id="is_enabled"
              :checked="formData.is_enabled"
              @update:checked="formData.is_enabled = $event as boolean"
            />
            <Label for="is_enabled" class="cursor-pointer font-normal">Activo</Label>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="ghost" @click="$emit('cancel')">Cancelar</Button>
        <Button
          v-if="saveWarnings && saveWarnings.length > 0"
          variant="outline"
          @click="$emit('dismiss-warnings')"
        >
          Cerrar con avisos
        </Button>
        <Button @click="$emit('save')" :disabled="saving">
          <i v-if="saving" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ saveWarnings && saveWarnings.length > 0 ? 'Guardar de nuevo' : submitLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import type { ResponseConfigFormData, ResponseParam, ValidationWarning } from '@/types/responseConfigs.types'

const props = defineProps<{
  open: boolean
  saving: boolean
  formData: ResponseConfigFormData
  availableParams: ResponseParam[]
  isEditing: boolean
  dialogTitle: string
  submitLabel: string
  saveWarnings?: ValidationWarning[]
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'dismiss-warnings'): void
}>()

function insertParam(key: string) {
  const placeholder = `{${key}}`
  const textarea = document.getElementById('template_text') as HTMLTextAreaElement | null
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = props.formData.template_text
    props.formData.template_text = text.substring(0, start) + placeholder + text.substring(end)
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length
      textarea.focus()
    })
  } else {
    props.formData.template_text += placeholder
  }
}

function onCriticalChange(value: boolean) {
  props.formData.is_critical = value
  if (value) {
    props.formData.response_type = 'fixed'
  }
}

function addButton() {
  if (!props.formData.buttons) {
    props.formData.buttons = []
  }
  if (props.formData.buttons.length < 3) {
    props.formData.buttons.push({ id: '', title: '' })
  }
}

function removeButton(index: number) {
  props.formData.buttons.splice(index, 1)
}

// --- Template Preview ---
const showPreview = ref(false)

const SAMPLE_VALUES: Record<string, string> = {
  customer_name: 'Juan Perez',
  institution_name: 'Clinica San Martin',
  specialty_name: 'Cardiologia',
  doctor_name: 'Dra. Lopez',
  appointment_date: '15/03/2026',
  appointment_time: '10:30',
  appointment_day: 'Lunes',
  phone_number: '+54 11 1234-5678',
  account_number: '00012345',
  available_times: '09:00, 10:30, 14:00',
  available_specialties: 'Cardiologia, Dermatologia, Pediatria'
}

const previewText = computed(() => {
  if (!props.formData.template_text) return ''
  return props.formData.template_text.replace(/\{(\w+)\}/g, (_match, key: string) => {
    if (SAMPLE_VALUES[key]) return SAMPLE_VALUES[key]
    const param = props.availableParams.find(p => p.key === key)
    return param ? `[${param.label}]` : `{${key}}`
  })
})

const unknownVars = computed(() => {
  if (!props.formData.template_text || props.availableParams.length === 0) return []
  const knownKeys = new Set(props.availableParams.map(p => p.key))
  const matches = props.formData.template_text.matchAll(/\{(\w+)\}/g)
  const unknown: string[] = []
  for (const m of matches) {
    if (!knownKeys.has(m[1]) && !unknown.includes(m[1])) unknown.push(m[1])
  }
  return unknown
})
</script>
