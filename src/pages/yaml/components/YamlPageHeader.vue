<template>
  <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-semibold text-foreground flex items-center gap-2">
        <Code class="h-6 w-6" />
        Gestion de Templates YAML
      </h1>
      <p class="text-muted-foreground mt-1">
        {{ description }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <!-- Type Toggle -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="secondary">
            <component :is="currentTypeIconComponent" class="mr-2 h-4 w-4" />
            {{ currentTypeLabel }}
            <ChevronDown class="ml-2 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="emit('update:modelValue', 'prompt')">
            <Code class="mr-2 h-4 w-4" />
            Prompts
          </DropdownMenuItem>
          <DropdownMenuItem @click="emit('update:modelValue', 'task')">
            <ListTodo class="mr-2 h-4 w-4" />
            Tasks
          </DropdownMenuItem>
          <DropdownMenuItem @click="emit('update:modelValue', 'formatter')">
            <MessageSquare class="mr-2 h-4 w-4" />
            Formatters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button @click="$emit('create')">
        <Plus class="mr-2 h-4 w-4" />
        {{ createLabel }}
      </Button>
      <Button variant="outline" @click="$emit('export')">
        <Download class="mr-2 h-4 w-4" />
        Exportar
      </Button>
      <Button variant="outline" @click="$emit('import')">
        <Upload class="mr-2 h-4 w-4" />
        Importar
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Code, ListTodo, MessageSquare, Plus, Download, Upload, ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import type { TemplateType } from '@/types/yaml.types'

const props = defineProps<{
  modelValue: TemplateType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TemplateType): void
  (e: 'create'): void
  (e: 'export'): void
  (e: 'import'): void
}>()

const typeOptions = [
  { value: 'prompt', label: 'Prompts', icon: Code },
  { value: 'task', label: 'Tasks', icon: ListTodo },
  { value: 'formatter', label: 'Formatters', icon: MessageSquare }
]

const currentTypeLabel = computed(() => {
  const option = typeOptions.find(o => o.value === props.modelValue)
  return option?.label || 'Prompts'
})

const currentTypeIconComponent = computed(() => {
  const option = typeOptions.find(o => o.value === props.modelValue)
  return option?.icon || Code
})

const description = computed(() => {
  if (props.modelValue === 'formatter') return 'Administra los templates de mensajes interactivos de WhatsApp'
  if (props.modelValue === 'task') return 'Administra los templates de texto para chatbot'
  return 'Administra los templates de prompts del sistema de IA'
})

const createLabel = computed(() => {
  return props.modelValue === 'task' ? 'Nuevo Task' : 'Nuevo Template'
})
</script>
