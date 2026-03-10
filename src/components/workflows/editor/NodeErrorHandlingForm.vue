<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import type { NodeErrorConfig } from '@/types/workflow-node.types'

interface AvailableNode {
  id: string
  key: string
  label: string
}

const props = defineProps<{
  modelValue?: NodeErrorConfig
  availableNodes?: AvailableNode[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: NodeErrorConfig): void
}>()

const isOpen = ref(false)

const defaults: NodeErrorConfig = {
  on_error: 'stop',
  max_retries: 3,
  retry_delay_ms: 2000,
  backoff_multiplier: 1.5,
  timeout_ms: 30000
}

const localConfig = ref<NodeErrorConfig>({ ...defaults })

watch(
  () => props.modelValue,
  (val) => {
    if (val) localConfig.value = { ...defaults, ...val }
  },
  { immediate: true }
)

const showRetryFields = computed(() => localConfig.value.on_error === 'retry')
const showFallbackField = computed(() => localConfig.value.on_error === 'fallback')

const hasCustomConfig = computed(() => {
  return localConfig.value.on_error !== 'stop'
})

function emitUpdate() {
  emit('update:modelValue', { ...localConfig.value })
}

function handleStrategyChange(value: string) {
  localConfig.value.on_error = value as NodeErrorConfig['on_error']
  emitUpdate()
}
</script>

<template>
  <Collapsible v-model:open="isOpen" class="error-handling-section">
    <CollapsibleTrigger class="error-handling-trigger">
      <div class="trigger-left">
        <i class="pi pi-exclamation-triangle text-amber-500" />
        <span class="trigger-title">Manejo de Errores</span>
        <span v-if="hasCustomConfig" class="trigger-badge">Configurado</span>
      </div>
      <i :class="['pi', isOpen ? 'pi-chevron-up' : 'pi-chevron-down']" />
    </CollapsibleTrigger>

    <CollapsibleContent class="error-handling-content">
      <div class="error-form">
        <!-- Strategy -->
        <div class="form-group">
          <Label class="text-xs text-muted-foreground">Estrategia ante error</Label>
          <Select :model-value="localConfig.on_error" @update:model-value="handleStrategyChange">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stop">Detener</SelectItem>
              <SelectItem value="retry">Reintentar</SelectItem>
              <SelectItem value="fallback">Nodo alternativo</SelectItem>
              <SelectItem value="continue">Continuar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Retry fields -->
        <template v-if="showRetryFields">
          <div class="form-row">
            <div class="form-group">
              <Label class="text-xs text-muted-foreground">Max reintentos</Label>
              <Input
                type="number"
                :model-value="localConfig.max_retries"
                @update:model-value="(v) => { localConfig.max_retries = Number(v); emitUpdate() }"
                :min="1"
                :max="10"
              />
            </div>
            <div class="form-group">
              <Label class="text-xs text-muted-foreground">Delay (ms)</Label>
              <Input
                type="number"
                :model-value="localConfig.retry_delay_ms"
                @update:model-value="(v) => { localConfig.retry_delay_ms = Number(v); emitUpdate() }"
                :min="100"
                :step="500"
              />
            </div>
          </div>
          <div class="form-group">
            <Label class="text-xs text-muted-foreground">Multiplicador backoff</Label>
            <Input
              type="number"
              :model-value="localConfig.backoff_multiplier"
              @update:model-value="(v) => { localConfig.backoff_multiplier = Number(v); emitUpdate() }"
              :min="1"
              :max="5"
              :step="0.5"
            />
          </div>
        </template>

        <!-- Fallback node -->
        <div v-if="showFallbackField" class="form-group">
          <Label class="text-xs text-muted-foreground">Nodo alternativo</Label>
          <Select
            :model-value="localConfig.fallback_node_id || ''"
            @update:model-value="(v) => { localConfig.fallback_node_id = v || undefined; emitUpdate() }"
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar nodo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="node in availableNodes"
                :key="node.id"
                :value="node.id"
              >
                {{ node.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Timeout -->
        <div class="form-group">
          <Label class="text-xs text-muted-foreground">Timeout (ms)</Label>
          <Input
            type="number"
            :model-value="localConfig.timeout_ms"
            @update:model-value="(v) => { localConfig.timeout_ms = Number(v); emitUpdate() }"
            :min="1000"
            :step="1000"
          />
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<style scoped>
.error-handling-section {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  overflow: hidden;
}

.error-handling-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: hsl(var(--muted) / 0.3);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.error-handling-trigger:hover {
  background: hsl(var(--muted) / 0.5);
}

.trigger-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trigger-title {
  font-size: 0.8rem;
  font-weight: 600;
}

.trigger-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  background: hsl(var(--primary) / 0.15);
  color: hsl(var(--primary));
  border-radius: 4px;
}

.error-handling-content {
  padding: 12px;
  border-top: 1px solid hsl(var(--border));
}

.error-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
</style>
