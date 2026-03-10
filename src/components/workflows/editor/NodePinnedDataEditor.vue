<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  pinnedData: Record<string, unknown> | null | undefined
  isPinned: boolean
}>()

const emit = defineEmits<{
  (e: 'pin', data: Record<string, unknown>): void
  (e: 'unpin'): void
}>()

const jsonText = ref('')
const parseError = ref<string | null>(null)

watch(
  () => props.pinnedData,
  (val) => {
    if (val) {
      jsonText.value = JSON.stringify(val, null, 2)
    } else {
      jsonText.value = '{\n  \n}'
    }
    parseError.value = null
  },
  { immediate: true }
)

const isValidJson = computed(() => {
  try {
    JSON.parse(jsonText.value)
    return true
  } catch {
    return false
  }
})

function handlePin() {
  try {
    const data = JSON.parse(jsonText.value)
    parseError.value = null
    emit('pin', data)
  } catch (e) {
    parseError.value = (e as Error).message
  }
}
</script>

<template>
  <div class="pinned-data-editor">
    <div class="pinned-header">
      <div class="pinned-header-left">
        <Label class="text-sm font-semibold">Datos Fijados (Mock)</Label>
        <Badge v-if="isPinned" variant="outline" class="text-amber-500 border-amber-500">
          Pinned
        </Badge>
      </div>
      <Button
        v-if="isPinned"
        variant="ghost"
        size="sm"
        @click="emit('unpin')"
      >
        <i class="pi pi-times mr-1" />
        Quitar pin
      </Button>
    </div>

    <p class="text-xs text-muted-foreground mb-2">
      Fija datos mock en este nodo. Al ejecutar, el nodo devolvera estos datos en vez de ejecutarse.
    </p>

    <Textarea
      v-model="jsonText"
      :rows="8"
      class="font-mono text-xs resize-y"
      placeholder='{ "key": "value" }'
    />

    <div v-if="parseError" class="parse-error">
      <i class="pi pi-exclamation-triangle" />
      {{ parseError }}
    </div>

    <Button
      size="sm"
      :disabled="!isValidJson"
      class="mt-2"
      @click="handlePin"
    >
      <i class="pi pi-thumbtack mr-2" />
      {{ isPinned ? 'Actualizar pin' : 'Fijar datos' }}
    </Button>
  </div>
</template>

<style scoped>
.pinned-data-editor {
  display: flex;
  flex-direction: column;
}

.pinned-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.pinned-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.parse-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: hsl(var(--destructive));
  font-size: 0.75rem;
  margin-top: 4px;
}
</style>
