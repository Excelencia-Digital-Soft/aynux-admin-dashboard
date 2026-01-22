<script setup lang="ts">
/**
 * ResponseConfigForm - Configure node response generation and WhatsApp message format
 *
 * Allows configuring:
 * - Response type: prompt (LLM) vs template (fixed text)
 * - Message format: text, buttons, or list
 * - WhatsApp constraints validation
 */
import { ref, computed, watch } from 'vue'
import type {
  NodeResponseConfig,
  WhatsAppButton,
  WhatsAppListSection,
  WhatsAppListRow,
  ListConfig
} from '@/types/workflow.types'
import { WHATSAPP_CONSTRAINTS } from '@/types/workflow.types'

import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

interface Props {
  modelValue?: NodeResponseConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: NodeResponseConfig): void
}>()

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

// Flag to prevent update loops when syncing from props
const isUpdatingFromProps = ref(false)

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

// Watch for prop changes - only update if the value actually changed
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      // Prevent loops: only update if values actually differ
      const newConfig = { ...defaultConfig, ...newValue }
      if (JSON.stringify(newConfig) !== JSON.stringify(localConfig.value)) {
        isUpdatingFromProps.value = true
        localConfig.value = newConfig
        // Reset flag after Vue processes the update
        setTimeout(() => {
          isUpdatingFromProps.value = false
        }, 0)
      }
    }
  },
  { immediate: true, deep: true }
)

// Emit changes synchronously - parent component (WorkflowPropertiesPanel) handles
// accumulation and only persists when user clicks "Save Configuration"
function emitUpdate() {
  // Don't emit if we're updating from props (prevents loops)
  if (isUpdatingFromProps.value) return
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

// Update row
function updateRow(
  sectionIndex: number,
  rowIndex: number,
  field: keyof WhatsAppListRow,
  value: string
) {
  const row = localConfig.value.list_config?.sections[sectionIndex]?.rows[rowIndex]
  if (row) {
    ;(row as Record<string, string>)[field] = value
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
      <Select
        v-model="localConfig.response_type"
        :options="responseTypeOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        @update:modelValue="emitUpdate"
      >
        <template #option="{ option }">
          <div class="flex flex-col">
            <span class="font-medium">{{ option.label }}</span>
            <small class="text-gray-400">{{ option.description }}</small>
          </div>
        </template>
      </Select>
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
      <Select
        v-model="localConfig.message_format"
        :options="messageFormatOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        @update:modelValue="emitUpdate"
      >
        <template #option="{ option }">
          <div class="flex flex-col">
            <span class="font-medium">{{ option.label }}</span>
            <small class="text-gray-400">{{ option.description }}</small>
          </div>
        </template>
      </Select>
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
        <DataTable
          :value="localConfig.buttons ?? []"
          size="small"
          class="text-sm"
        >
          <Column header="ID" style="width: 30%">
            <template #body="{ data, index }">
              <InputText
                :modelValue="data.id"
                @update:modelValue="(v) => updateButton(index, 'id', v)"
                class="w-full text-xs"
                placeholder="btn_id"
              />
            </template>
          </Column>
          <Column header="Titulo" style="width: 50%">
            <template #body="{ data, index }">
              <div class="flex items-center gap-2">
                <InputText
                  :modelValue="data.title"
                  @update:modelValue="(v) => updateButton(index, 'title', v)"
                  class="w-full text-xs"
                  :maxlength="WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX"
                  placeholder="Texto del boton"
                />
                <Tag
                  :severity="getCharSeverity(data.title.length, WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX)"
                  class="text-xs whitespace-nowrap"
                >
                  {{ data.title.length }}/{{ WHATSAPP_CONSTRAINTS.BUTTON_TITLE_MAX }}
                </Tag>
              </div>
            </template>
          </Column>
          <Column style="width: 20%">
            <template #body="{ index }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click="removeButton(index)"
              />
            </template>
          </Column>
        </DataTable>

        <Button
          v-if="(localConfig.buttons?.length ?? 0) < WHATSAPP_CONSTRAINTS.BUTTON_MAX"
          label="Agregar Boton"
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
            @update:modelValue="(v) => { initListConfig(); localConfig.list_config!.button_text = v; emitUpdate(); }"
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
              @update:modelValue="(v) => updateSectionTitle(sectionIndex, v)"
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

          <DataTable
            :value="section.rows"
            size="small"
            class="text-sm"
          >
            <Column header="ID" style="width: 20%">
              <template #body="{ data, index }">
                <InputText
                  :modelValue="data.id"
                  @update:modelValue="(v) => updateRow(sectionIndex, index, 'id', v)"
                  class="w-full text-xs"
                  placeholder="row_id"
                />
              </template>
            </Column>
            <Column header="Titulo" style="width: 30%">
              <template #body="{ data, index }">
                <InputText
                  :modelValue="data.title"
                  @update:modelValue="(v) => updateRow(sectionIndex, index, 'title', v)"
                  class="w-full text-xs"
                  :maxlength="WHATSAPP_CONSTRAINTS.LIST_TITLE_MAX"
                  placeholder="Titulo"
                />
              </template>
            </Column>
            <Column header="Descripcion" style="width: 40%">
              <template #body="{ data, index }">
                <InputText
                  :modelValue="data.description ?? ''"
                  @update:modelValue="(v) => updateRow(sectionIndex, index, 'description', v)"
                  class="w-full text-xs"
                  :maxlength="WHATSAPP_CONSTRAINTS.LIST_DESCRIPTION_MAX"
                  placeholder="Descripcion opcional"
                />
              </template>
            </Column>
            <Column style="width: 10%">
              <template #body="{ index }">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  @click="removeRow(sectionIndex, index)"
                />
              </template>
            </Column>
          </DataTable>

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

.response-config-form :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem;
}
</style>
