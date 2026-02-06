<script setup lang="ts">
/**
 * ResponseConfigForm - Configure node response generation and WhatsApp message format
 *
 * Allows configuring:
 * - Response type: prompt (LLM) vs template (fixed text)
 * - Message format: text, buttons, or list
 * - WhatsApp constraints validation
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import type {
  NodeResponseConfig,
  WhatsAppButton,
  WhatsAppListSection,
  WhatsAppListRow,
  ListConfig
} from '@/types/workflow.types'
import { WHATSAPP_CONSTRAINTS } from '@/types/workflow.types'

import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

interface AvailableNode {
  id: string
  key: string
  label: string
}

interface Props {
  modelValue?: NodeResponseConfig
  availableNodes?: AvailableNode[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: NodeResponseConfig): void
}>()

// Computed for node dropdown options
const nodeOptions = computed(() => {
  return (props.availableNodes ?? []).map(node => ({
    label: node.label || node.key,
    value: node.key
  }))
})

// Response type options
const responseTypeOptions = [
  { label: 'Prompt (LLM)', value: 'prompt', description: 'Usa IA para generar respuesta' },
  { label: 'Template (Fijo)', value: 'template', description: 'Texto fijo con variables' }
]

// Message format options
const messageFormatOptions = [
  { label: 'Texto', value: 'text', description: 'Mensaje de texto simple' },
  { label: 'Botones', value: 'buttons', description: 'Hasta 3 botones interactivos' },
  { label: 'Lista', value: 'list', description: 'Lista con hasta 10 opciones' }
]

// Default config
const defaultConfig: NodeResponseConfig = {
  response_type: 'prompt',
  message_format: 'text',
  task_description: '',
  template_text: '',
  buttons: [],
  list_config: undefined,
  header: '',
  footer: ''
}

// Local config state
const localConfig = ref<NodeResponseConfig>({ ...defaultConfig })

// Track last emitted value to prevent loops
let lastEmittedJson = ''

// Flag to prevent update loops when syncing from props
const isUpdatingFromProps = ref(false)

// Timer tracking for cleanup (prevents memory leak)
let updateFlagTimeoutId: ReturnType<typeof setTimeout> | null = null

// Computed for character counters
const taskDescriptionLength = computed(() => localConfig.value.task_description?.length ?? 0)
const templateTextLength = computed(() => localConfig.value.template_text?.length ?? 0)

// Button validation
const buttonsValid = computed(() => {
  const buttons = localConfig.value.buttons ?? []
  if (buttons.length > WHATSAPP_CONSTRAINTS.BUTTON_MAX) return false
  return buttons.every((btn) => btn.title.length <= WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX)
})

// List validation
const listValid = computed(() => {
  const listConfig = localConfig.value.list_config
  if (!listConfig) return true
  if (listConfig.button_text.length > WHATSAPP_CONSTRAINTS.BUTTON_TEXT_MAX) return false

  let totalRows = 0
  for (const section of listConfig.sections) {
    if (section.title.length > WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX) return false
    for (const row of section.rows) {
      if (row.title.length > WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX) return false
      if (row.description && row.description.length > WHATSAPP_CONSTRAINTS.LIST_DESCRIPTION_MAX) {
        return false
      }
      totalRows++
    }
  }
  return totalRows <= WHATSAPP_CONSTRAINTS.LIST_ITEMS_MAX
})

// Watch for prop changes - only update when parent sends genuinely new value
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) return

    const newConfig = { ...defaultConfig, ...newValue }
    const newConfigJson = JSON.stringify(newConfig)

    // Skip if this is the same as what we last emitted (round-trip from our own emit)
    if (newConfigJson === lastEmittedJson) return

    // Skip if already same as local state
    if (newConfigJson === JSON.stringify(localConfig.value)) return

    // Genuinely new value from parent - sync it
    isUpdatingFromProps.value = true
    localConfig.value = newConfig
    lastEmittedJson = newConfigJson

    // Clear any pending timer before scheduling new one
    if (updateFlagTimeoutId) {
      clearTimeout(updateFlagTimeoutId)
    }
    // Reset flag after Vue processes the update
    updateFlagTimeoutId = setTimeout(() => {
      isUpdatingFromProps.value = false
      updateFlagTimeoutId = null
    }, 0)
  },
  { immediate: true, deep: true }
)

// Cleanup timer on component unmount to prevent memory leak
onUnmounted(() => {
  if (updateFlagTimeoutId) {
    clearTimeout(updateFlagTimeoutId)
    updateFlagTimeoutId = null
  }
})

// Emit changes synchronously - parent component (WorkflowPropertiesPanel) handles
// accumulation and only persists when user clicks "Save Configuration"
function emitUpdate() {
  // Don't emit if we're updating from props (prevents loops)
  if (isUpdatingFromProps.value) return

  const currentJson = JSON.stringify(localConfig.value)
  // Skip if nothing changed
  if (currentJson === lastEmittedJson) return

  lastEmittedJson = currentJson
  emit('update:modelValue', { ...localConfig.value })
}

// Add button
function addButton() {
  if (!localConfig.value.buttons) {
    localConfig.value.buttons = []
  }
  if (localConfig.value.buttons.length < WHATSAPP_CONSTRAINTS.BUTTON_MAX) {
    const newId = `btn_${Date.now()}`
    localConfig.value.buttons.push({ id: newId, title: '' })
    emitUpdate()
  }
}

// Remove button
function removeButton(index: number) {
  localConfig.value.buttons?.splice(index, 1)
  emitUpdate()
}

// Update button
function updateButton(index: number, field: keyof WhatsAppButton, value: string) {
  if (localConfig.value.buttons && localConfig.value.buttons[index]) {
    localConfig.value.buttons[index][field] = value
    emitUpdate()
  }
}

// Initialize list config
function initListConfig() {
  if (!localConfig.value.list_config) {
    localConfig.value.list_config = {
      button_text: 'Ver opciones',
      sections: [{ title: 'Opciones', rows: [] }]
    }
    emitUpdate()
  }
}

// Add list section
function addSection() {
  initListConfig()
  localConfig.value.list_config!.sections.push({
    title: `Seccion ${localConfig.value.list_config!.sections.length + 1}`,
    rows: []
  })
  emitUpdate()
}

// Remove section
function removeSection(index: number) {
  localConfig.value.list_config?.sections.splice(index, 1)
  emitUpdate()
}

// Add row to section
function addRow(sectionIndex: number) {
  initListConfig()
  const section = localConfig.value.list_config!.sections[sectionIndex]
  const totalRows = localConfig.value.list_config!.sections.reduce(
    (acc, s) => acc + s.rows.length,
    0
  )
  if (totalRows < WHATSAPP_CONSTRAINTS.LIST_ITEMS_MAX) {
    const newId = `row_${Date.now()}`
    section.rows.push({ id: newId, title: '', description: '' })
    emitUpdate()
  }
}

// Remove row from section
function removeRow(sectionIndex: number, rowIndex: number) {
  localConfig.value.list_config?.sections[sectionIndex]?.rows.splice(rowIndex, 1)
  emitUpdate()
}

// Update row - uses Object.assign for type-safe property assignment
function updateRow(
  sectionIndex: number,
  rowIndex: number,
  field: keyof WhatsAppListRow,
  value: string
) {
  const row = localConfig.value.list_config?.sections[sectionIndex]?.rows[rowIndex]
  if (row && field in row) {
    Object.assign(row, { [field]: value })
    emitUpdate()
  }
}

// Update section title
function updateSectionTitle(index: number, value: string) {
  if (localConfig.value.list_config?.sections[index]) {
    localConfig.value.list_config.sections[index].title = value
    emitUpdate()
  }
}

// Get character count badge severity
function getCharSeverity(current: number, max: number): 'success' | 'warn' | 'danger' {
  const ratio = current / max
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.8) return 'warn'
  return 'success'
}

// Get total list rows
const totalListRows = computed(() => {
  return (
    localConfig.value.list_config?.sections.reduce((acc, s) => acc + s.rows.length, 0) ?? 0
  )
})
</script>

<template>
  <div class="response-config-form space-y-4">
    <!-- Response Type Selection -->
    <div class="field">
      <label class="block text-xs font-medium text-gray-600 mb-1">
        Tipo de Respuesta
      </label>
      <SelectButton
        :modelValue="localConfig.response_type"
        @update:modelValue="(v) => { if (v) { localConfig.response_type = v; emitUpdate(); } }"
        :options="responseTypeOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        class="response-type-selector"
      />
    </div>

    <!-- Task Description (for prompt type) -->
    <div v-if="localConfig.response_type === 'prompt'" class="field">
      <label class="block text-xs font-medium text-gray-600 mb-1">
        Descripcion de la Tarea
        <Tag
          :severity="getCharSeverity(taskDescriptionLength, 500)"
          class="ml-2 text-xs"
        >
          {{ taskDescriptionLength }} chars
        </Tag>
      </label>
      <Textarea
        v-model="localConfig.task_description"
        rows="4"
        class="w-full"
        placeholder="Describe que debe hacer el agente para generar la respuesta..."
        autoResize
        @update:modelValue="emitUpdate"
      />
      <small class="text-gray-400">
        El LLM usara esta descripcion para generar la respuesta dinamicamente.
      </small>
    </div>

    <!-- Template Text (for template type) -->
    <div v-if="localConfig.response_type === 'template'" class="field">
      <label class="block text-xs font-medium text-gray-600 mb-1">
        Texto del Template
        <Tag
          :severity="getCharSeverity(templateTextLength, 1000)"
          class="ml-2 text-xs"
        >
          {{ templateTextLength }} chars
        </Tag>
      </label>
      <Textarea
        v-model="localConfig.template_text"
        rows="4"
        class="w-full font-mono text-sm"
        placeholder="Hola {nombre}, tu turno es el {fecha} a las {hora}."
        autoResize
        @update:modelValue="emitUpdate"
      />
      <small class="text-gray-400">
        Usa {placeholder} para variables dinamicas. Ej: {nombre}, {fecha}
      </small>
    </div>

    <Divider />

    <!-- Message Format Selection -->
    <div class="field">
      <label class="block text-xs font-medium text-gray-600 mb-1">
        Formato WhatsApp
      </label>
      <SelectButton
        :modelValue="localConfig.message_format"
        @update:modelValue="(v) => { if (v) { localConfig.message_format = v; emitUpdate(); } }"
        :options="messageFormatOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        class="response-type-selector"
      />
    </div>

    <!-- Buttons Configuration -->
    <Panel
      v-if="localConfig.message_format === 'buttons'"
      header="Configuracion de Botones"
      toggleable
      :collapsed="false"
    >
      <template #icons>
        <Tag :severity="buttonsValid ? 'success' : 'danger'" class="text-xs">
          {{ localConfig.buttons?.length ?? 0 }}/{{ WHATSAPP_CONSTRAINTS.BUTTON_MAX }}
        </Tag>
      </template>

      <div class="space-y-3">
        <!-- Card-based button layout for better responsiveness -->
        <div
          v-for="(button, index) in localConfig.buttons ?? []"
          :key="button.id"
          class="button-card"
        >
          <div class="button-card-header">
            <span class="text-sm font-medium">Botón {{ index + 1 }}</span>
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="removeButton(index)"
            />
          </div>

          <div class="button-card-body">
            <!-- ID -->
            <div class="field">
              <label class="text-xs text-gray-500">ID</label>
              <InputText
                :modelValue="button.id"
                @update:modelValue="(v) => updateButton(index, 'id', v ?? '')"
                class="w-full text-sm"
                placeholder="btn_id"
              />
            </div>

            <!-- Título con contador -->
            <div class="field">
              <label class="text-xs text-gray-500 flex items-center gap-2">
                Título
                <Tag
                  :severity="getCharSeverity(button.title.length, WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX)"
                  class="text-xs"
                >
                  {{ button.title.length }}/{{ WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX }}
                </Tag>
              </label>
              <InputText
                :modelValue="button.title"
                @update:modelValue="(v) => updateButton(index, 'title', v ?? '')"
                class="w-full text-sm"
                :maxlength="WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX"
                placeholder="Texto del botón"
              />
            </div>

            <!-- Siguiente Nodo con Dropdown -->
            <div class="field">
              <label class="text-xs text-gray-500">Siguiente Nodo</label>
              <Select
                :modelValue="button.next_node ?? ''"
                @update:modelValue="(v) => updateButton(index, 'next_node', v ?? '')"
                :options="nodeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar nodo..."
                class="w-full text-sm"
                showClear
                appendTo="body"
                :pt="{
                  overlay: { style: 'z-index: 9999 !important; pointer-events: auto !important;' },
                  list: { style: 'pointer-events: auto !important;' },
                  option: { style: 'pointer-events: auto !important;' }
                }"
              />
            </div>
          </div>
        </div>

        <Button
          v-if="(localConfig.buttons?.length ?? 0) < WHATSAPP_CONSTRAINTS.BUTTON_MAX"
          label="Agregar Botón"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          @click="addButton"
        />
      </div>
    </Panel>

    <!-- List Configuration -->
    <Panel
      v-if="localConfig.message_format === 'list'"
      header="Configuracion de Lista"
      toggleable
      :collapsed="false"
    >
      <template #icons>
        <Tag :severity="listValid ? 'success' : 'danger'" class="text-xs">
          {{ totalListRows }}/{{ WHATSAPP_CONSTRAINTS.LIST_ITEMS_MAX }} items
        </Tag>
      </template>

      <div class="space-y-4">
        <!-- List Button Text -->
        <div class="field">
          <label class="block text-xs font-medium text-gray-600 mb-1">
            Texto del Boton
            <Tag
              :severity="getCharSeverity(localConfig.list_config?.button_text?.length ?? 0, WHATSAPP_CONSTRAINTS.BUTTON_TEXT_MAX)"
              class="ml-2 text-xs"
            >
              {{ localConfig.list_config?.button_text?.length ?? 0 }}/{{ WHATSAPP_CONSTRAINTS.BUTTON_TEXT_MAX }}
            </Tag>
          </label>
          <InputText
            :modelValue="localConfig.list_config?.button_text ?? ''"
            @update:modelValue="(v) => { initListConfig(); localConfig.list_config!.button_text = v ?? ''; emitUpdate(); }"
            class="w-full"
            :maxlength="WHATSAPP_CONSTRAINTS.BUTTON_TEXT_MAX"
            placeholder="Ver opciones"
          />
        </div>

        <!-- Sections -->
        <div
          v-for="(section, sectionIndex) in localConfig.list_config?.sections ?? []"
          :key="sectionIndex"
          class="border border-gray-200 rounded-lg p-3"
        >
          <div class="flex items-center justify-between mb-3">
            <InputText
              :modelValue="section.title"
              @update:modelValue="(v) => updateSectionTitle(sectionIndex, v ?? '')"
              class="font-medium"
              :maxlength="WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX"
              placeholder="Titulo de seccion"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="removeSection(sectionIndex)"
            />
          </div>

          <!-- Card-based list item layout for better responsiveness -->
          <div class="space-y-2">
            <div
              v-for="(row, rowIndex) in section.rows"
              :key="row.id"
              class="list-item-card"
            >
              <div class="list-item-card-header">
                <span class="text-xs font-medium text-gray-600">Item {{ rowIndex + 1 }}</span>
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  @click="removeRow(sectionIndex, rowIndex)"
                />
              </div>
              <div class="list-item-card-body">
                <!-- ID y Título en fila -->
                <div class="grid grid-cols-2 gap-2">
                  <div class="field">
                    <label class="text-xs text-gray-500">ID</label>
                    <InputText
                      :modelValue="row.id"
                      @update:modelValue="(v) => updateRow(sectionIndex, rowIndex, 'id', v ?? '')"
                      class="w-full text-sm"
                      placeholder="row_id"
                    />
                  </div>
                  <div class="field">
                    <label class="text-xs text-gray-500 flex items-center gap-1">
                      Título
                      <Tag
                        :severity="getCharSeverity(row.title.length, WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX)"
                        class="text-xs"
                      >
                        {{ row.title.length }}/{{ WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX }}
                      </Tag>
                    </label>
                    <InputText
                      :modelValue="row.title"
                      @update:modelValue="(v) => updateRow(sectionIndex, rowIndex, 'title', v ?? '')"
                      class="w-full text-sm"
                      :maxlength="WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX"
                      placeholder="Título del item"
                    />
                  </div>
                </div>

                <!-- Descripción -->
                <div class="field">
                  <label class="text-xs text-gray-500 flex items-center gap-1">
                    Descripción
                    <Tag
                      v-if="row.description"
                      :severity="getCharSeverity(row.description?.length ?? 0, WHATSAPP_CONSTRAINTS.LIST_DESCRIPTION_MAX)"
                      class="text-xs"
                    >
                      {{ row.description?.length ?? 0 }}/{{ WHATSAPP_CONSTRAINTS.LIST_DESCRIPTION_MAX }}
                    </Tag>
                  </label>
                  <InputText
                    :modelValue="row.description ?? ''"
                    @update:modelValue="(v) => updateRow(sectionIndex, rowIndex, 'description', v ?? '')"
                    class="w-full text-sm"
                    :maxlength="WHATSAPP_CONSTRAINTS.LIST_DESCRIPTION_MAX"
                    placeholder="Descripción opcional"
                  />
                </div>

                <!-- Siguiente Nodo con Dropdown -->
                <div class="field">
                  <label class="text-xs text-gray-500">Siguiente Nodo</label>
                  <Select
                    :modelValue="row.next_node ?? ''"
                    @update:modelValue="(v) => updateRow(sectionIndex, rowIndex, 'next_node', v ?? '')"
                    :options="nodeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar nodo..."
                    class="w-full text-sm"
                    showClear
                    appendTo="body"
                    :pt="{
                      overlay: { style: 'z-index: 9999 !important; pointer-events: auto !important;' },
                      list: { style: 'pointer-events: auto !important;' },
                      option: { style: 'pointer-events: auto !important;' }
                    }"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            v-if="totalListRows < WHATSAPP_CONSTRAINTS.LIST_ITEMS_MAX"
            label="Agregar Item"
            icon="pi pi-plus"
            size="small"
            severity="secondary"
            class="mt-2"
            @click="addRow(sectionIndex)"
          />
        </div>

        <Button
          label="Agregar Seccion"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          @click="addSection"
        />
      </div>
    </Panel>

    <!-- Header/Footer (for buttons and list) -->
    <div
      v-if="localConfig.message_format !== 'text'"
      class="grid grid-cols-2 gap-4"
    >
      <div class="field">
        <label class="block text-xs font-medium text-gray-600 mb-1">
          Header (opcional)
        </label>
        <InputText
          v-model="localConfig.header"
          class="w-full"
          placeholder="Encabezado del mensaje"
          @update:modelValue="emitUpdate"
        />
      </div>
      <div class="field">
        <label class="block text-xs font-medium text-gray-600 mb-1">
          Footer (opcional)
        </label>
        <InputText
          v-model="localConfig.footer"
          class="w-full"
          placeholder="Pie del mensaje"
          @update:modelValue="emitUpdate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.response-config-form :deep(.p-panel-header) {
  padding: 0.75rem;
  background: var(--p-surface-50);
}

.response-config-form :deep(.p-panel-content) {
  padding: 0.75rem;
}

/* Button Card Styles */
.button-card {
  border: 1px solid var(--p-surface-300);
  border-radius: 8px;
  overflow: hidden;
  background: var(--p-surface-0);
}

.button-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--p-surface-100);
  border-bottom: 1px solid var(--p-surface-200);
}

.button-card-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.button-card-body .field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* List Item Card Styles */
.list-item-card {
  border: 1px solid var(--p-surface-200);
  border-radius: 6px;
  overflow: hidden;
  background: var(--p-surface-0);
}

.list-item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: var(--p-surface-50);
  border-bottom: 1px solid var(--p-surface-200);
}

.list-item-card-body {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-item-card-body .field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* SelectButton styling for response type */
.response-type-selector {
  display: flex;
  width: 100%;
}

.response-type-selector :deep(.p-selectbutton) {
  display: flex;
  width: 100%;
}

.response-type-selector :deep(.p-togglebutton) {
  flex: 1;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: 1px solid var(--p-surface-300);
  background: var(--p-surface-0);
  color: var(--p-text-color);
  transition: all 0.2s;
}

.response-type-selector :deep(.p-togglebutton:first-child) {
  border-radius: 6px 0 0 6px;
}

.response-type-selector :deep(.p-togglebutton:last-child) {
  border-radius: 0 6px 6px 0;
}

.response-type-selector :deep(.p-togglebutton:hover:not(.p-togglebutton-checked)) {
  background: var(--p-surface-100);
}

.response-type-selector :deep(.p-togglebutton-checked) {
  background: var(--p-primary-color);
  border-color: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
}

/* Select dropdown adjustments */
.button-card :deep(.p-select),
.list-item-card :deep(.p-select) {
  font-size: 0.875rem;
}
</style>

<!-- Global styles for Select overlay (needs to be above Sheet and capture pointer events) -->
<style>
.p-select-overlay {
  z-index: 9999 !important;
  pointer-events: auto !important;
}

.p-select-overlay * {
  pointer-events: auto !important;
}
</style>
