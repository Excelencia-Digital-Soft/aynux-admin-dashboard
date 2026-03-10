<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { workflowApi } from '@/api/workflow.api'
import type { ResponsePreviewResponse, ResponseVariablesResponse } from '@/types/workflow-execution.types'

const props = defineProps<{
  domainKey: string
  nodeId: string
  templateText: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isLoading = ref(false)
const preview = ref<ResponsePreviewResponse | null>(null)
const variables = ref<ResponseVariablesResponse | null>(null)
const useLlm = ref(false)
const error = ref<string | null>(null)

watch(
  () => [props.domainKey, props.nodeId],
  async () => {
    if (props.domainKey && props.nodeId) {
      try {
        variables.value = await workflowApi.getResponseVariables(props.domainKey, props.nodeId)
      } catch {
        variables.value = null
      }
    }
  },
  { immediate: true }
)

async function loadPreview() {
  isLoading.value = true
  error.value = null
  try {
    preview.value = await workflowApi.previewResponse({
      domain_key: props.domainKey,
      node_id: props.nodeId,
      template_text: props.templateText,
      variables: variables.value?.mock_values || {},
      use_llm: useLlm.value,
      user_message: useLlm.value ? 'Hola, necesito ayuda' : undefined
    })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="response-preview-panel">
    <!-- Header -->
    <div class="preview-header">
      <h3 class="preview-title">Vista Previa</h3>
      <Button variant="ghost" size="icon" class="h-7 w-7" @click="emit('close')">
        <i class="pi pi-times" />
      </Button>
    </div>

    <!-- Controls -->
    <div class="preview-controls">
      <div class="flex items-center gap-2">
        <Switch v-model:checked="useLlm" />
        <Label class="text-xs">Modo LLM</Label>
      </div>
      <Button size="sm" :disabled="isLoading" @click="loadPreview">
        <i :class="['pi mr-1', isLoading ? 'pi-spin pi-spinner' : 'pi-eye']" />
        Previsualizar
      </Button>
    </div>

    <!-- Variables -->
    <div v-if="variables && variables.available_variables.length > 0" class="preview-variables">
      <span class="text-xs text-muted-foreground">Variables disponibles:</span>
      <div class="variable-tags">
        <Badge
          v-for="v in variables.available_variables"
          :key="v"
          variant="outline"
          class="text-xs"
        >
          {{ '{' + v + '}' }}
        </Badge>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="preview-error">
      <i class="pi pi-exclamation-triangle" />
      {{ error }}
    </div>

    <!-- Preview Result -->
    <div v-if="preview" class="preview-result">
      <!-- WhatsApp-style bubble -->
      <div class="wa-bubble">
        <p class="wa-text">{{ preview.rendered_template }}</p>
      </div>

      <!-- LLM version -->
      <div v-if="preview.rendered_llm" class="wa-bubble wa-bubble-llm">
        <span class="wa-llm-badge">LLM</span>
        <p class="wa-text">{{ preview.rendered_llm }}</p>
      </div>

      <!-- Warnings -->
      <div v-if="preview.missing_variables.length > 0" class="preview-warnings">
        <Badge variant="outline" class="text-amber-500 border-amber-500 text-xs">
          <i class="pi pi-exclamation-triangle mr-1" />
          {{ preview.missing_variables.length }} variable(s) sin valor
        </Badge>
      </div>
      <div v-if="preview.unknown_variables.length > 0" class="preview-warnings">
        <Badge variant="destructive" class="text-xs">
          {{ preview.unknown_variables.length }} variable(s) desconocida(s):
          {{ preview.unknown_variables.join(', ') }}
        </Badge>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading && !error" class="preview-empty">
      <i class="pi pi-eye text-2xl opacity-30" />
      <span class="text-xs text-muted-foreground">Haz clic en Previsualizar para ver el resultado</span>
    </div>
  </div>
</template>

<style scoped>
.response-preview-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: hsl(var(--muted) / 0.2);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-variables {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variable-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: hsl(var(--destructive) / 0.1);
  border-radius: 6px;
  color: hsl(var(--destructive));
  font-size: 0.8rem;
}

.preview-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* WhatsApp bubble */
.wa-bubble {
  background: #1b3a2d;
  border-radius: 0 12px 12px 12px;
  padding: 10px 14px;
  max-width: 320px;
  position: relative;
}

.wa-bubble-llm {
  background: #1a2b3d;
}

.wa-text {
  font-size: 0.85rem;
  color: #e5e7eb;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.wa-llm-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 5px;
  background: #3b82f6;
  color: white;
  border-radius: 3px;
  margin-bottom: 4px;
}

.preview-warnings {
  display: flex;
  gap: 4px;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
}
</style>
