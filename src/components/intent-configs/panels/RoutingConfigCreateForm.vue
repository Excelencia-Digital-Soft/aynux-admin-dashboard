<script setup lang="ts">
/**
 * RoutingConfigCreateForm - Form for creating new routing configs
 *
 * Shows card-style config type selector, target node dropdown,
 * trigger value input, and description textarea.
 */
import { ref, computed, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { RoutingConfigCreate } from '@/types/routingConfigs.types'
import { getPriorityDisplay } from '../utils/labelHumanizer'

interface AvailableNode {
  id: string
  displayName: string
}

interface Props {
  domainKey: string
  targetNode: string | null
  availableNodes: AvailableNode[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'save', data: RoutingConfigCreate): void
  (e: 'cancel'): void
}>()

// Config type options with auto-priority
const CONFIG_TYPES = [
  {
    value: 'global_keyword',
    label: 'Palabra clave global',
    icon: 'pi-globe',
    priority: 100,
    description: 'Funciona en cualquier momento de la conversación'
  },
  {
    value: 'button_mapping',
    label: 'Botón de WhatsApp',
    icon: 'pi-stop',
    priority: 50,
    description: 'Cuando el usuario toca un botón de respuesta rápida'
  },
  {
    value: 'list_selection',
    label: 'Lista de WhatsApp',
    icon: 'pi-list',
    priority: 45,
    description: 'Cuando el usuario elige de una lista'
  },
  {
    value: 'menu_option',
    label: 'Opción de menú',
    icon: 'pi-bars',
    priority: 40,
    description: 'Cuando el usuario escribe un número (1, 2, 3...)'
  },
  {
    value: 'intent_node_mapping',
    label: 'Detección por IA',
    icon: 'pi-arrow-right-arrow-left',
    priority: 30,
    description: 'Redirección automática usando inteligencia artificial'
  }
] as const

// Form state
const selectedType = ref<string>('')
const targetNode = ref<string>(props.targetNode || '')
const triggerValue = ref('')
const textAlias = ref('')
const description = ref('')

// Text alias (WhatsApp button/list display text)
const TEXT_ALIAS_MAX_LENGTH: Record<string, number> = {
  button_mapping: 20,
  list_selection: 24
}

const showTextAlias = computed(() =>
  selectedType.value === 'button_mapping' || selectedType.value === 'list_selection'
)

const textAliasLabel = computed(() =>
  selectedType.value === 'button_mapping' ? 'Texto del botón' : 'Texto del item'
)

const textAliasMaxLen = computed(() =>
  TEXT_ALIAS_MAX_LENGTH[selectedType.value] ?? 20
)

// Clear text alias when type changes
watch(selectedType, () => {
  textAlias.value = ''
})

// Sync target node from prop
watch(
  () => props.targetNode,
  (val) => {
    if (val) targetNode.value = val
  }
)

const selectedPriority = computed(() => {
  const ct = CONFIG_TYPES.find((t) => t.value === selectedType.value)
  return ct?.priority ?? 0
})

const canSave = computed(() => {
  if (!selectedType.value || !triggerValue.value.trim() || !targetNode.value) return false
  // Validate text alias length if applicable
  if (showTextAlias.value) {
    const trimmed = textAlias.value.trim()
    if (trimmed && trimmed.length > textAliasMaxLen.value) return false
  }
  return true
})

function handleSave() {
  if (!canSave.value) return

  const trimmedAlias = textAlias.value.trim()

  const data: RoutingConfigCreate = {
    domain_key: props.domainKey,
    config_type: selectedType.value,
    trigger_value: triggerValue.value.trim(),
    target_intent: triggerValue.value.trim(),
    target_node: targetNode.value || null,
    priority: selectedPriority.value,
    is_enabled: true,
    description: description.value.trim() || null,
    ...(showTextAlias.value && trimmedAlias
      ? { metadata: { text_alias: trimmedAlias } }
      : {})
  }

  emit('save', data)
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="create-form">
    <div class="form-header">
      <i class="pi pi-plus-circle" style="color: #8b5cf6" />
      <h4>Nueva Regla</h4>
    </div>

    <!-- Config Type Selector -->
    <div class="form-field">
      <div class="type-section-header">
        <Label class="field-label type-section-label">TIPO DE CONFIGURACIÓN</Label>
        <i
          class="pi pi-info-circle type-info-icon"
          title="Selecciona el tipo de regla que determinará cómo se activa este ruteo"
        />
      </div>
      <div class="type-cards-grid">
        <button
          v-for="ct in CONFIG_TYPES"
          :key="ct.value"
          type="button"
          class="type-glass-card"
          :class="{ selected: selectedType === ct.value }"
          :title="ct.description"
          @click="selectedType = ct.value"
        >
          <div class="card-content">
            <i :class="['pi', ct.icon, 'card-icon']" />
            <span class="card-label">{{ ct.label }}</span>
          </div>
          <span
            class="card-badge"
            :class="`badge-${getPriorityDisplay(ct.priority).label.toLowerCase()}`"
          >
            {{ getPriorityDisplay(ct.priority).label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Target Node -->
    <div class="form-field">
      <Label class="field-label">Paso destino</Label>
      <Select v-model="targetNode">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Seleccionar nodo..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="node in availableNodes"
            :key="node.id"
            :value="node.id"
          >
            {{ node.displayName }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Trigger Value / Intent Name -->
    <div class="form-field">
      <Label class="field-label">Palabra o patrón de activación</Label>
      <Input
        v-model="triggerValue"
        placeholder="ej: cancelar, menu, 1"
        class="w-full"
      />
    </div>

    <!-- Text Alias (WhatsApp button/list display text) -->
    <div v-if="showTextAlias" class="form-field">
      <Label class="field-label">{{ textAliasLabel }}</Label>
      <Input
        v-model="textAlias"
        :maxlength="textAliasMaxLen"
        :placeholder="`Texto visible en WhatsApp (máx. ${textAliasMaxLen})`"
        class="w-full"
      />
      <span class="field-hint">
        Texto que ve el usuario en WhatsApp. {{ textAlias.length }}/{{ textAliasMaxLen }}
      </span>
    </div>

    <!-- Description -->
    <div class="form-field">
      <Label class="field-label">Descripcion (opcional)</Label>
      <Textarea
        v-model="description"
        placeholder="Descripcion del ruteo..."
        :rows="2"
        class="w-full"
      />
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <Button
        variant="ghost"
        size="sm"
        @click="handleCancel"
      >
        Cancelar
      </Button>
      <Button
        :disabled="!canSave"
        size="sm"
        class="save-btn"
        @click="handleSave"
      >
        <i class="pi pi-check mr-1" />
        Guardar
      </Button>
    </div>
  </div>
</template>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.form-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

/* Type section header */
.type-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.type-section-label {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.type-info-icon {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
  cursor: help;
}

/* Glass card grid */
.type-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.type-glass-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.625rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;
}

.type-glass-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

.type-glass-card.selected {
  border-color: rgba(139, 92, 246, 0.5);
  background: rgba(139, 92, 246, 0.08);
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.25),
    0 0 16px -4px rgba(139, 92, 246, 0.15);
}

/* Card content (icon + label) */
.card-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.card-icon {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  opacity: 0.7;
  flex-shrink: 0;
}

.type-glass-card.selected .card-icon {
  color: #a78bfa;
  opacity: 1;
}

.card-label {
  font-size: 0.78rem;
  font-weight: 500;
}

/* Priority badge */
.card-badge {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.badge-alta {
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.2);
}

.badge-media {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.badge-baja {
  color: #9ca3af;
  background: rgba(156, 163, 175, 0.1);
  border: 1px solid rgba(156, 163, 175, 0.15);
}

.field-hint {
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  opacity: 0.7;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.save-btn {
  background: #8b5cf6;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #7c3aed;
}

.save-btn:disabled {
  opacity: 0.5;
}
</style>
