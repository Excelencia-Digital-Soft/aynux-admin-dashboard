<script setup lang="ts">
/**
 * ConditionEditorDialog - Edit transition conditions for workflow edges
 *
 * Supports multiple condition types:
 * - always: Always execute
 * - intent: Based on detected intent
 * - entity: Based on extracted entity
 * - state: Based on conversation state
 * - expression: Custom expression
 */
import { ref, watch, computed } from 'vue'
import type { TransitionCondition } from '@/types/workflow.types'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

interface Props {
  visible: boolean
  condition: TransitionCondition | null
  availableIntents?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  availableIntents: () => []
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', condition: TransitionCondition | null): void
}>()

// Condition types
const conditionTypes = [
  { value: 'always', label: 'Siempre', description: 'Ejecutar siempre esta transicion' },
  { value: 'intent', label: 'Intent', description: 'Basado en intent detectado' },
  { value: 'entity', label: 'Entidad', description: 'Basado en entidad extraida' },
  { value: 'state', label: 'Estado', description: 'Basado en estado de conversacion' },
  { value: 'expression', label: 'Expresion', description: 'Expresion personalizada' }
]

// Operators
const operators = [
  { value: 'eq', label: '= (igual)', description: 'Igual a' },
  { value: 'ne', label: '!= (diferente)', description: 'Diferente de' },
  { value: 'gt', label: '> (mayor)', description: 'Mayor que' },
  { value: 'lt', label: '< (menor)', description: 'Menor que' },
  { value: 'gte', label: '>= (mayor o igual)', description: 'Mayor o igual que' },
  { value: 'lte', label: '<= (menor o igual)', description: 'Menor o igual que' },
  { value: 'contains', label: 'contiene', description: 'Contiene el valor' },
  { value: 'matches', label: 'coincide (regex)', description: 'Coincide con expresion regular' }
]

// Local condition state
const localCondition = ref<{
  type: TransitionCondition['type']
  value?: string
  field?: string
  operator?: TransitionCondition['operator']
  expression?: string
}>({
  type: 'always'
})

// Initialize from props
watch(
  () => props.condition,
  (newCondition) => {
    if (newCondition) {
      localCondition.value = {
        type: newCondition.type,
        value: newCondition.value as string,
        field: newCondition.field,
        operator: newCondition.operator,
        expression: (newCondition as { expression?: string }).expression
      }
    } else {
      localCondition.value = { type: 'always' }
    }
  },
  { immediate: true }
)

// Computed helpers
const showIntentSelect = computed(() => localCondition.value.type === 'intent')
const showFieldOperatorValue = computed(() =>
  ['entity', 'state'].includes(localCondition.value.type)
)
const showExpression = computed(() => localCondition.value.type === 'expression')

const currentTypeDescription = computed(() => {
  const type = conditionTypes.find((t) => t.value === localCondition.value.type)
  return type?.description || ''
})

// Intent options
const intentOptions = computed(() => {
  return props.availableIntents.map((intent) => ({
    value: intent,
    label: intent
  }))
})

// Field placeholder based on type
const fieldPlaceholder = computed(() => {
  if (localCondition.value.type === 'entity') {
    return 'ej: specialty, date, time'
  }
  return 'ej: user.authenticated, step_count'
})

// Validate condition
const isValid = computed(() => {
  const c = localCondition.value
  switch (c.type) {
    case 'always':
      return true
    case 'intent':
      return !!c.value
    case 'entity':
    case 'state':
      return !!c.field && !!c.operator && c.value !== undefined
    case 'expression':
      return !!(c as { expression?: string }).expression
    default:
      return false
  }
})

// Handle save
function onSave() {
  if (!isValid.value) return

  const c = localCondition.value

  if (c.type === 'always') {
    // For "always", we can either save null or save the condition object
    emit('save', { type: 'always' })
  } else {
    const condition: TransitionCondition = {
      type: c.type
    }

    if (c.value) condition.value = c.value
    if (c.field) condition.field = c.field
    if (c.operator) condition.operator = c.operator
    const expr = (c as { expression?: string }).expression
    if (expr) {
      (condition as unknown as { expression: string }).expression = expr
    }

    emit('save', condition)
  }
  emit('update:visible', false)
}

// Handle cancel
function onCancel() {
  emit('update:visible', false)
}

// Handle clear condition
function onClear() {
  emit('save', null)
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Editar Condicion de Transicion"
    :modal="true"
    :style="{ width: '550px' }"
    :closable="true"
  >
    <div class="space-y-5">
      <!-- Condition Type -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Condicion</label>
        <Select
          v-model="localCondition.type"
          :options="conditionTypes"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        >
          <template #option="{ option }">
            <div>
              <div class="font-medium">{{ option.label }}</div>
              <div class="text-xs text-gray-500">{{ option.description }}</div>
            </div>
          </template>
        </Select>
        <small class="text-gray-500 mt-1 block">{{ currentTypeDescription }}</small>
      </div>

      <!-- Intent Selector -->
      <div v-if="showIntentSelect" class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">Intent</label>
        <Select
          v-if="intentOptions.length > 0"
          v-model="localCondition.value"
          :options="intentOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          placeholder="Selecciona un intent..."
          showClear
        />
        <InputText
          v-else
          v-model="localCondition.value"
          class="w-full"
          placeholder="Nombre del intent (ej: confirm_appointment)"
        />
        <small class="text-gray-500 mt-1 block">
          La transicion se ejecutara cuando se detecte este intent
        </small>
      </div>

      <!-- Field + Operator + Value -->
      <div v-if="showFieldOperatorValue" class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="field">
            <label class="block text-xs font-medium text-gray-600 mb-1">Campo</label>
            <InputText
              v-model="localCondition.field"
              class="w-full"
              :placeholder="fieldPlaceholder"
            />
          </div>
          <div class="field">
            <label class="block text-xs font-medium text-gray-600 mb-1">Operador</label>
            <Select
              v-model="localCondition.operator"
              :options="operators"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="..."
            />
          </div>
          <div class="field">
            <label class="block text-xs font-medium text-gray-600 mb-1">Valor</label>
            <InputText
              v-model="localCondition.value"
              class="w-full"
              placeholder="Valor esperado"
            />
          </div>
        </div>
        <Message severity="info" :closable="false" class="text-sm">
          <template v-if="localCondition.type === 'entity'">
            Ejemplo: Campo <code>specialty</code> operador <code>=</code> valor <code>FONOAUDIOLOGIA</code>
          </template>
          <template v-else>
            Ejemplo: Campo <code>attempts</code> operador <code>&gt;</code> valor <code>3</code>
          </template>
        </Message>
      </div>

      <!-- Expression Editor -->
      <div v-if="showExpression" class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">Expresion</label>
        <Textarea
          v-model="(localCondition as any).expression"
          rows="4"
          class="w-full font-mono text-sm"
          placeholder="state.specialty === 'FONOAUDIOLOGIA' && state.confirmed"
        />
        <small class="text-gray-500 mt-1 block">
          Expresion JavaScript que debe evaluar a <code>true</code> o <code>false</code>.
          Tienes acceso a <code>state</code>, <code>entities</code>, <code>intent</code>.
        </small>
      </div>

      <!-- Always message -->
      <Message v-if="localCondition.type === 'always'" severity="info" :closable="false">
        Esta transicion siempre se ejecutara (sin condiciones).
      </Message>
    </div>

    <Divider />

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          label="Quitar Condicion"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="onClear"
        />
        <div class="flex gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="onCancel"
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            severity="success"
            :disabled="!isValid"
            @click="onSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.field code {
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
}
</style>
