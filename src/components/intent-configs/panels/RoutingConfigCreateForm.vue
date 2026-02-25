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
    label: 'Global Keyword',
    icon: 'pi-globe',
    priority: 100,
    description: 'Keyword activo en cualquier contexto'
  },
  {
    value: 'button_mapping',
    label: 'Button Mapping',
    icon: 'pi-stop',
    priority: 50,
    description: 'Mapeo de boton interactivo'
  },
  {
    value: 'list_selection',
    label: 'List Selection',
    icon: 'pi-list',
    priority: 45,
    description: 'Seleccion de lista interactiva'
  },
  {
    value: 'menu_option',
    label: 'Menu Option',
    icon: 'pi-bars',
    priority: 40,
    description: 'Opcion de menu'
  },
  {
    value: 'intent_node_mapping',
    label: 'Intent → Node',
    icon: 'pi-arrow-right-arrow-left',
    priority: 30,
    description: 'Mapeo directo de intent a nodo'
  }
] as const

// Form state
const selectedType = ref<string>('')
const targetNode = ref<string>(props.targetNode || '')
const triggerValue = ref('')
const description = ref('')

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
  return selectedType.value && triggerValue.value.trim() && targetNode.value
})

function handleSave() {
  if (!canSave.value) return

  const data: RoutingConfigCreate = {
    domain_key: props.domainKey,
    config_type: selectedType.value,
    trigger_value: triggerValue.value.trim(),
    target_intent: triggerValue.value.trim(),
    target_node: targetNode.value || null,
    priority: selectedPriority.value,
    is_enabled: true,
    description: description.value.trim() || null
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
      <h4>Nuevo Ruteo</h4>
    </div>

    <!-- Config Type Selector -->
    <div class="form-field">
      <Label class="field-label">Tipo de configuracion</Label>
      <div class="type-cards">
        <button
          v-for="ct in CONFIG_TYPES"
          :key="ct.value"
          type="button"
          class="type-card"
          :class="{ selected: selectedType === ct.value }"
          @click="selectedType = ct.value"
        >
          <i :class="['pi', ct.icon]" />
          <span class="type-label">{{ ct.label }}</span>
          <span class="type-priority">P{{ ct.priority }}</span>
        </button>
      </div>
    </div>

    <!-- Target Node -->
    <div class="form-field">
      <Label class="field-label">Destino (nodo)</Label>
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
      <Label class="field-label">Pattern / Intent Name</Label>
      <Input
        v-model="triggerValue"
        placeholder="ej. confirm_booking"
        class="w-full"
      />
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

.type-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: 1.5px solid var(--surface-border);
  border-radius: 0.375rem;
  background: var(--surface-ground);
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--text-color);
  transition: all 0.15s;
}

.type-card:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.type-card.selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
}

.type-card i {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.type-card.selected i {
  color: #8b5cf6;
}

.type-label {
  font-weight: 600;
  white-space: nowrap;
}

.type-priority {
  font-size: 0.6rem;
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
