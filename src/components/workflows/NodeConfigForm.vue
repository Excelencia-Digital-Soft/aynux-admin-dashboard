<script setup lang="ts">
/**
 * NodeConfigForm - Dynamic form for node instance configuration
 *
 * Renders a form based on the node definition's config_schema.
 * Falls back to JSON editor if no schema is defined.
 */
import { ref, computed, watch } from 'vue'
import type { NodeDefinition } from '@/types/workflow.types'

import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Chips from 'primevue/chips'
import Message from 'primevue/message'

interface Props {
  config: Record<string, unknown>
  nodeDefinition?: NodeDefinition | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:config', value: Record<string, unknown>): void
}>()

// Local config state
const localConfig = ref<Record<string, unknown>>({})
const jsonConfigString = ref('')
const jsonError = ref<string | null>(null)

// Get config schema from node definition
const configSchema = computed(() => {
  return props.nodeDefinition?.config_schema as {
    type?: string
    properties?: Record<string, SchemaProperty>
    required?: string[]
  } | null
})

interface SchemaProperty {
  type: string
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  items?: { type: string }
  minimum?: number
  maximum?: number
  format?: string
}

// Check if we have a valid schema
const hasSchema = computed(() => {
  return configSchema.value?.properties && Object.keys(configSchema.value.properties).length > 0
})

// Initialize local config from props
watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = { ...newConfig }
    if (!hasSchema.value) {
      try {
        jsonConfigString.value = JSON.stringify(newConfig, null, 2)
        jsonError.value = null
      } catch {
        jsonConfigString.value = '{}'
      }
    }
  },
  { immediate: true, deep: true }
)

// Handle field changes
function updateField(key: string, value: unknown) {
  localConfig.value[key] = value
  emit('update:config', { ...localConfig.value })
}

// Handle JSON editor changes
function onJsonChange(value: string) {
  jsonConfigString.value = value
  try {
    const parsed = JSON.parse(value)
    jsonError.value = null
    localConfig.value = parsed
    emit('update:config', parsed)
  } catch (e) {
    jsonError.value = 'JSON invalido'
  }
}

// Get field type component
function getFieldType(property: SchemaProperty, key: string): string {
  if (property.enum && property.enum.length > 0) {
    return 'select'
  }
  switch (property.type) {
    case 'string':
      // Use textarea for message fields, long text, or when format indicates multiline
      if (
        key.toLowerCase().includes('message') ||
        key.toLowerCase().includes('content') ||
        key.toLowerCase().includes('text') ||
        key.toLowerCase().includes('prompt') ||
        key.toLowerCase().includes('template') ||
        property.format === 'textarea' ||
        property.format === 'multiline'
      ) {
        return 'textarea'
      }
      return 'text'
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'toggle'
    case 'array':
      return 'chips'
    case 'object':
      return 'json'
    default:
      return 'text'
  }
}

// Get select options from enum
function getSelectOptions(property: SchemaProperty): Array<{ label: string; value: unknown }> {
  if (!property.enum) return []
  return property.enum.map((v) => ({
    label: String(v),
    value: v
  }))
}
</script>

<template>
  <div class="node-config-form">
    <!-- JSON Editor (fallback when no schema) -->
    <div v-if="!hasSchema" class="json-editor">
      <label class="block text-xs font-medium text-gray-500 mb-1">Configuracion (JSON)</label>
      <Textarea
        :modelValue="jsonConfigString"
        @update:modelValue="onJsonChange"
        rows="8"
        class="w-full font-mono text-sm"
        placeholder="{}"
      />
      <Message v-if="jsonError" severity="error" :closable="false" class="mt-2 text-sm">
        {{ jsonError }}
      </Message>
      <small class="text-gray-400 mt-1 block">
        Este nodo no tiene un esquema definido. Edita el JSON directamente.
      </small>
    </div>

    <!-- Schema-based form -->
    <div v-else class="schema-form space-y-4">
      <div
        v-for="(property, key) in configSchema?.properties"
        :key="key"
        class="field"
      >
        <label class="block text-xs font-medium text-gray-600 mb-1">
          {{ property.title || key }}
          <span v-if="configSchema?.required?.includes(key as string)" class="text-red-500">*</span>
        </label>

        <!-- String input -->
        <InputText
          v-if="getFieldType(property, key as string) === 'text'"
          :modelValue="String(localConfig[key] ?? property.default ?? '')"
          @update:modelValue="(v) => updateField(key as string, v)"
          class="w-full"
          :placeholder="property.description"
        />

        <!-- Textarea for messages and long text -->
        <Textarea
          v-else-if="getFieldType(property, key as string) === 'textarea'"
          :modelValue="String(localConfig[key] ?? property.default ?? '')"
          @update:modelValue="(v) => updateField(key as string, v)"
          rows="4"
          class="w-full"
          :placeholder="property.description"
          autoResize
        />

        <!-- Number input -->
        <InputNumber
          v-else-if="getFieldType(property, key as string) === 'number'"
          :modelValue="Number(localConfig[key] ?? property.default ?? 0)"
          @update:modelValue="(v) => updateField(key as string, v)"
          class="w-full"
          :min="property.minimum"
          :max="property.maximum"
        />

        <!-- Boolean toggle -->
        <div v-else-if="getFieldType(property, key as string) === 'toggle'" class="flex items-center gap-2">
          <ToggleSwitch
            :modelValue="Boolean(localConfig[key] ?? property.default ?? false)"
            @update:modelValue="(v) => updateField(key as string, v)"
          />
          <span class="text-sm text-gray-500">{{ property.description }}</span>
        </div>

        <!-- Select from enum -->
        <Select
          v-else-if="getFieldType(property, key as string) === 'select'"
          :modelValue="localConfig[key] ?? property.default"
          @update:modelValue="(v) => updateField(key as string, v)"
          :options="getSelectOptions(property)"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          :placeholder="property.description || 'Seleccionar...'"
        />

        <!-- Array as chips -->
        <Chips
          v-else-if="getFieldType(property, key as string) === 'chips'"
          :modelValue="(localConfig[key] as string[]) ?? (property.default as string[]) ?? []"
          @update:modelValue="(v) => updateField(key as string, v)"
          class="w-full"
          :placeholder="property.description || 'Agregar items...'"
        />

        <!-- Nested object as JSON -->
        <Textarea
          v-else-if="getFieldType(property, key as string) === 'json'"
          :modelValue="JSON.stringify(localConfig[key] ?? property.default ?? {}, null, 2)"
          @update:modelValue="(v) => { try { updateField(key as string, JSON.parse(v)) } catch {} }"
          rows="4"
          class="w-full font-mono text-sm"
        />

        <small v-if="property.description && getFieldType(property, key as string) !== 'toggle'" class="text-gray-400 mt-1 block">
          {{ property.description }}
        </small>
      </div>

      <Message v-if="Object.keys(configSchema?.properties || {}).length === 0" severity="info" :closable="false">
        Este nodo no tiene opciones configurables.
      </Message>
    </div>
  </div>
</template>

<style scoped>
.node-config-form {
  width: 100%;
}

.json-editor :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
}

.schema-form .field {
  margin-bottom: 0.75rem;
}
</style>
