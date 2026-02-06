<script setup lang="ts">
/**
 * NodeConfigForm - Dynamic form for node instance configuration
 *
 * Renders a form based on the node definition's config_schema.
 * Falls back to JSON editor if no schema is defined.
 */
import { ref, computed, watch } from 'vue'
import type { NodeDefinition, NodeResponseConfig } from '@/types/workflow.types'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { isValidConfigSchema, type ConfigSchema } from '@/utils/typeGuards'
import ResponseConfigForm from './ResponseConfigForm.vue'

import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import Chips from 'primevue/chips'
import Message from 'primevue/message'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

interface AvailableNode {
  id: string
  key: string
  label: string
}

interface Props {
  config: Record<string, unknown>
  nodeDefinition?: NodeDefinition | null
  availableNodes?: AvailableNode[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:config', value: Record<string, unknown>): void
}>()

// Error handling
const { fieldErrors, safeJsonParse, safeJsonStringify, clearFieldError } =
  useErrorHandler('NodeConfigForm')

// Local config state
const localConfig = ref<Record<string, unknown>>({})
const jsonConfigString = ref('')
const jsonError = ref<string | null>(null)

// Get config schema from node definition with type validation
// For conversation nodes, filters out 'message' field since it's handled by response_config
const configSchema = computed((): (ConfigSchema & { properties?: Record<string, SchemaProperty> }) | null => {
  const schema = props.nodeDefinition?.config_schema
  if (!isValidConfigSchema(schema)) {
    if (schema !== null && schema !== undefined) {
      console.warn('[NodeConfigForm] Invalid config_schema:', schema)
    }
    return null
  }

  const validSchema = schema as ConfigSchema & { properties?: Record<string, SchemaProperty> }

  // For conversation nodes, filter out 'message' field to avoid duplication
  // Message is now configured via response_config.template_text
  if (props.nodeDefinition?.node_type === 'conversation' && validSchema.properties?.message) {
    const { message, ...filteredProperties } = validSchema.properties
    return {
      ...validSchema,
      properties: filteredProperties,
      required: validSchema.required?.filter((r: string) => r !== 'message')
    }
  }

  return validSchema
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

// Check if node supports response configuration (conversation nodes)
const supportsResponseConfig = computed(() => {
  const nodeType = props.nodeDefinition?.node_type
  return nodeType === 'conversation'
})

// Get current response config
const responseConfig = computed(() => {
  return localConfig.value.response_config as NodeResponseConfig | undefined
})

// Initialize local config from props - avoid unnecessary resets
watch(
  () => props.config,
  (newConfig, oldConfig) => {
    // Only sync if the config actually changed (prevents unnecessary resets)
    const newJson = JSON.stringify(newConfig ?? {})
    const oldJson = JSON.stringify(oldConfig ?? {})

    if (newJson !== oldJson) {
      localConfig.value = { ...newConfig }
      if (!hasSchema.value) {
        // Use safe stringify with error logging
        jsonConfigString.value = safeJsonStringify(newConfig, 'config')
        jsonError.value = null
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

// Handle JSON editor changes using safe parsing
function onJsonChange(value: string) {
  jsonConfigString.value = value
  const parsed = safeJsonParse(value, 'jsonConfig')

  if (parsed !== null) {
    jsonError.value = null
    localConfig.value = parsed as Record<string, unknown>
    emit('update:config', parsed as Record<string, unknown>)
  } else {
    // Get error from fieldErrors or use default
    jsonError.value = fieldErrors.value['jsonConfig'] || 'JSON invalido'
  }
}

// Handle response config changes
function updateResponseConfig(config: NodeResponseConfig) {
  localConfig.value.response_config = config
  emit('update:config', { ...localConfig.value })
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

// Handle JSON field updates with proper error handling
function handleJsonFieldUpdate(fieldKey: string, value: string): void {
  const parsed = safeJsonParse(value, fieldKey)
  if (parsed !== null) {
    updateField(fieldKey, parsed)
  }
  // On error, safeJsonParse already logs and tracks the error in fieldErrors
}

// Get error for a specific JSON field
function getJsonFieldError(fieldKey: string): string | undefined {
  return fieldErrors.value[fieldKey]
}
</script>

<template>
  <div class="node-config-form">
    <!-- Response Configuration (for conversation nodes) -->
    <Accordion v-if="supportsResponseConfig" :value="['response', 'config']" multiple class="mb-4">
      <AccordionPanel value="response">
        <AccordionHeader>
          <span class="flex items-center gap-2">
            <i class="pi pi-comments text-primary"></i>
            Configuracion de Respuesta
          </span>
        </AccordionHeader>
        <AccordionContent>
          <ResponseConfigForm
            :modelValue="responseConfig"
            :availableNodes="props.availableNodes"
            @update:modelValue="updateResponseConfig"
          />
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="config" v-if="hasSchema">
        <AccordionHeader>
          <span class="flex items-center gap-2">
            <i class="pi pi-cog text-secondary"></i>
            Configuracion del Nodo
          </span>
        </AccordionHeader>
        <AccordionContent>
          <!-- Schema-based config form content here -->
          <div class="schema-form space-y-4">
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
              <div v-else-if="getFieldType(property, key as string) === 'json'" class="json-field">
                <Textarea
                  :modelValue="safeJsonStringify(localConfig[key] ?? property.default ?? {}, key as string)"
                  @update:modelValue="(v) => handleJsonFieldUpdate(key as string, v)"
                  rows="4"
                  class="w-full font-mono text-sm"
                  :class="{ 'border-red-500': getJsonFieldError(key as string) }"
                />
                <small v-if="getJsonFieldError(key as string)" class="text-red-500 mt-1 block">
                  {{ getJsonFieldError(key as string) }}
                </small>
              </div>

              <small v-if="property.description && getFieldType(property, key as string) !== 'toggle'" class="text-gray-400 mt-1 block">
                {{ property.description }}
              </small>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <!-- Non-conversation nodes: Original behavior -->
    <template v-else>
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
        <div v-else-if="getFieldType(property, key as string) === 'json'" class="json-field">
          <Textarea
            :modelValue="safeJsonStringify(localConfig[key] ?? property.default ?? {}, key as string)"
            @update:modelValue="(v) => handleJsonFieldUpdate(key as string, v)"
            rows="4"
            class="w-full font-mono text-sm"
            :class="{ 'border-red-500': getJsonFieldError(key as string) }"
          />
          <small v-if="getJsonFieldError(key as string)" class="text-red-500 mt-1 block">
            {{ getJsonFieldError(key as string) }}
          </small>
        </div>

        <small v-if="property.description && getFieldType(property, key as string) !== 'toggle'" class="text-gray-400 mt-1 block">
          {{ property.description }}
        </small>
      </div>

        <Message v-if="Object.keys(configSchema?.properties || {}).length === 0" severity="info" :closable="false">
          Este nodo no tiene opciones configurables.
        </Message>
      </div>
    </template>
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
