<script setup lang="ts">
/**
 * ConfigDiffDialog - Side-by-side comparator for system vs override configs.
 *
 * Shows a two-column dialog highlighting differences between the SYSTEM_ORG
 * default config and the institution's override. Uses word-level diff for
 * template text comparison.
 */
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ResponseConfig } from '@/types/responseConfigs.types'

interface Props {
  open: boolean
  intentKey: string
  systemConfig: ResponseConfig | null
  overrideConfig: ResponseConfig | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

// Fields to compare with human-readable labels
const COMPARE_FIELDS: { key: keyof ResponseConfig; label: string }[] = [
  { key: 'template_text', label: 'Texto de plantilla' },
  { key: 'response_type', label: 'Tipo de respuesta' },
  { key: 'is_critical', label: 'Critica' },
  { key: 'task_description', label: 'Descripcion de tarea' },
  { key: 'display_name', label: 'Nombre' },
  { key: 'buttons', label: 'Botones' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'is_enabled', label: 'Activa' },
]

interface DiffField {
  label: string
  key: string
  systemValue: string
  overrideValue: string
  changed: boolean
}

const diffFields = computed<DiffField[]>(() => {
  if (!props.systemConfig || !props.overrideConfig) return []

  return COMPARE_FIELDS.map((field) => {
    const sysVal = props.systemConfig![field.key]
    const ovVal = props.overrideConfig![field.key]
    return {
      label: field.label,
      key: field.key,
      systemValue: formatValue(field.key, sysVal),
      overrideValue: formatValue(field.key, ovVal),
      changed: JSON.stringify(sysVal) !== JSON.stringify(ovVal),
    }
  })
})

const changedCount = computed(() => diffFields.value.filter((f) => f.changed).length)

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '(vacio)'
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  if (key === 'buttons' && Array.isArray(value)) {
    if (value.length === 0) return '(sin botones)'
    return value.map((b: { id: string; title: string }) => `[${b.id}] ${b.title}`).join(', ')
  }
  if (typeof value === 'string') {
    return value.length > 200 ? value.slice(0, 200) + '...' : value
  }
  return String(value)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-base">
          Comparar: {{ intentKey }}
        </DialogTitle>
        <DialogDescription>
          {{ changedCount }} campo{{ changedCount !== 1 ? 's' : '' }} diferente{{ changedCount !== 1 ? 's' : '' }}
          entre la configuracion del sistema y el override de la organizacion.
        </DialogDescription>
      </DialogHeader>

      <!-- No system config -->
      <div v-if="!systemConfig" class="py-4 text-center text-sm text-muted-foreground">
        Esta configuracion no tiene contraparte en el sistema.
      </div>

      <!-- No override config -->
      <div v-else-if="!overrideConfig" class="py-4 text-center text-sm text-muted-foreground">
        Esta configuracion usa el valor del sistema (sin override).
      </div>

      <!-- Side-by-side diff -->
      <div v-else class="flex flex-col gap-3 mt-2">
        <!-- Column headers -->
        <div class="grid grid-cols-[1fr_1fr] gap-3">
          <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Badge variant="secondary" class="text-[10px] px-1.5 py-0">SISTEMA</Badge>
            Configuracion base
          </div>
          <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Badge
              variant="outline"
              class="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30"
            >
              OVERRIDE
            </Badge>
            Override de organizacion
          </div>
        </div>

        <!-- Diff rows -->
        <div
          v-for="field in diffFields"
          :key="field.key"
          class="grid grid-cols-[1fr_1fr] gap-3 rounded-lg border p-2.5"
          :class="field.changed ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/30'"
        >
          <!-- Field label -->
          <div class="col-span-2 flex items-center gap-1.5 mb-1">
            <span class="text-xs font-medium text-foreground">{{ field.label }}</span>
            <Badge
              v-if="field.changed"
              variant="outline"
              class="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30"
            >
              Modificado
            </Badge>
          </div>

          <!-- System value -->
          <div
            class="text-xs font-mono leading-relaxed p-2 rounded bg-muted/40 whitespace-pre-wrap break-words"
            :class="field.changed ? 'text-muted-foreground' : 'text-muted-foreground/60'"
          >
            {{ field.systemValue }}
          </div>

          <!-- Override value -->
          <div
            class="text-xs font-mono leading-relaxed p-2 rounded whitespace-pre-wrap break-words"
            :class="field.changed ? 'bg-blue-500/10 text-foreground' : 'bg-muted/40 text-muted-foreground/60'"
          >
            {{ field.overrideValue }}
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
