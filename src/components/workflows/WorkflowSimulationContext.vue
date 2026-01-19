<script setup lang="ts">
/**
 * WorkflowSimulationContext - Editor for simulation context
 *
 * Allows editing the simulation context including state, entities, intent, and user input.
 */
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import type { SimulationContext } from '@/composables/useWorkflowSimulation'

interface Props {
  visible: boolean
  context: SimulationContext
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:context': [value: Partial<SimulationContext>]
}>()

// Local state for editing
const localIntent = ref(props.context.intent || '')
const localUserInput = ref(props.context.userInput || '')
const localStateJson = ref(JSON.stringify(props.context.state, null, 2))
const localEntitiesJson = ref(JSON.stringify(props.context.entities, null, 2))

// Validation errors
const stateError = ref('')
const entitiesError = ref('')

// Watch for context changes
watch(() => props.context, (newContext) => {
  localIntent.value = newContext.intent || ''
  localUserInput.value = newContext.userInput || ''
  localStateJson.value = JSON.stringify(newContext.state, null, 2)
  localEntitiesJson.value = JSON.stringify(newContext.entities, null, 2)
}, { deep: true })

// Validate JSON
function validateJson(json: string): { valid: boolean; error: string } {
  try {
    JSON.parse(json)
    return { valid: true, error: '' }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

// Validate state JSON
function handleStateChange() {
  const result = validateJson(localStateJson.value)
  stateError.value = result.error
}

// Validate entities JSON
function handleEntitiesChange() {
  const result = validateJson(localEntitiesJson.value)
  entitiesError.value = result.error
}

// Check if form is valid
const isValid = computed(() => {
  return !stateError.value && !entitiesError.value
})

// Save changes
function saveChanges() {
  if (!isValid.value) return

  const updates: Partial<SimulationContext> = {
    intent: localIntent.value || null,
    userInput: localUserInput.value
  }

  try {
    updates.state = JSON.parse(localStateJson.value)
  } catch {
    updates.state = {}
  }

  try {
    updates.entities = JSON.parse(localEntitiesJson.value)
  } catch {
    updates.entities = {}
  }

  emit('update:context', updates)
  emit('update:visible', false)
}

// Cancel and close
function cancel() {
  // Reset to original values
  localIntent.value = props.context.intent || ''
  localUserInput.value = props.context.userInput || ''
  localStateJson.value = JSON.stringify(props.context.state, null, 2)
  localEntitiesJson.value = JSON.stringify(props.context.entities, null, 2)
  stateError.value = ''
  entitiesError.value = ''

  emit('update:visible', false)
}

// Add common intent
function setIntent(intent: string) {
  localIntent.value = intent
}

// Add common entity
function addEntity(key: string, value: string) {
  try {
    const entities = JSON.parse(localEntitiesJson.value)
    entities[key] = value
    localEntitiesJson.value = JSON.stringify(entities, null, 2)
    entitiesError.value = ''
  } catch {
    // If invalid JSON, start fresh
    localEntitiesJson.value = JSON.stringify({ [key]: value }, null, 2)
    entitiesError.value = ''
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="Contexto de Simulacion"
    :style="{ width: '500px' }"
    :closable="true"
    :dismissableMask="true"
  >
    <div class="context-editor">
      <!-- User Input -->
      <div class="field">
        <label for="userInput">Entrada del usuario</label>
        <InputText
          id="userInput"
          v-model="localUserInput"
          placeholder="Texto que escribio el usuario..."
          class="w-full"
        />
        <small class="field-help">El mensaje del usuario que se esta procesando</small>
      </div>

      <!-- Intent -->
      <div class="field">
        <label for="intent">Intent detectado</label>
        <div class="intent-input">
          <InputText
            id="intent"
            v-model="localIntent"
            placeholder="Ej: greeting, appointment, cancel..."
            class="w-full"
          />
        </div>
        <div class="quick-intents">
          <span class="quick-label">Rapido:</span>
          <Button
            v-for="intent in ['greeting', 'appointment', 'cancel', 'confirm', 'fallback']"
            :key="intent"
            :label="intent"
            text
            size="small"
            @click="setIntent(intent)"
          />
        </div>
      </div>

      <Divider />

      <!-- Entities -->
      <div class="field">
        <label for="entities">Entidades (JSON)</label>
        <Textarea
          id="entities"
          v-model="localEntitiesJson"
          rows="4"
          class="w-full code-input"
          :class="{ 'p-invalid': entitiesError }"
          @input="handleEntitiesChange"
        />
        <small v-if="entitiesError" class="p-error">{{ entitiesError }}</small>
        <small v-else class="field-help">Entidades extraidas del mensaje (fecha, hora, especialidad, etc.)</small>
        <div class="quick-entities">
          <span class="quick-label">Agregar:</span>
          <Button label="fecha" text size="small" @click="addEntity('date', '2025-01-20')" />
          <Button label="hora" text size="small" @click="addEntity('time', '10:00')" />
          <Button label="especialidad" text size="small" @click="addEntity('specialty', 'cardiologia')" />
        </div>
      </div>

      <Divider />

      <!-- State -->
      <div class="field">
        <label for="state">Estado (JSON)</label>
        <Textarea
          id="state"
          v-model="localStateJson"
          rows="4"
          class="w-full code-input"
          :class="{ 'p-invalid': stateError }"
          @input="handleStateChange"
        />
        <small v-if="stateError" class="p-error">{{ stateError }}</small>
        <small v-else class="field-help">Variables de estado del flujo (contadores, flags, datos)</small>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        text
        severity="secondary"
        @click="cancel"
      />
      <Button
        label="Aplicar"
        icon="pi pi-check"
        :disabled="!isValid"
        @click="saveChanges"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.context-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.field-help {
  color: #6b7280;
  font-size: 12px;
}

.intent-input {
  display: flex;
  gap: 8px;
}

.quick-intents,
.quick-entities {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.quick-label {
  font-size: 12px;
  color: #6b7280;
}

.code-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.w-full {
  width: 100%;
}
</style>
