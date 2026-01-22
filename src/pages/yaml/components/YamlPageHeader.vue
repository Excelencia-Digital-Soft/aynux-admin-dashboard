<template>
  <div class="page-header">
    <div class="header-content">
      <h1>
        <i class="pi pi-code"></i>
        Gestión de Templates YAML
      </h1>
      <p class="text-muted">
        {{ description }}
      </p>
    </div>
    <div class="header-actions">
      <!-- Type Toggle: Prompts vs Tasks vs Formatters -->
      <Button
        type="button"
        :label="currentTypeLabel"
        :icon="currentTypeIcon"
        severity="secondary"
        @click="toggleTypeMenu"
        aria-haspopup="true"
        aria-controls="type_menu"
        class="mr-2"
      >
        <template #default>
          <i :class="currentTypeIcon" class="mr-2"></i>
          <span>{{ currentTypeLabel }}</span>
          <i class="pi pi-chevron-down ml-2 text-xs"></i>
        </template>
      </Button>
      <Menu
        ref="typeMenu"
        id="type_menu"
        :model="typeMenuItems"
        :popup="true"
      />
      <Button
        @click="$emit('create')"
        icon="pi pi-plus"
        :label="createLabel"
        severity="primary"
      />
      <Button
        @click="$emit('export')"
        icon="pi pi-download"
        label="Exportar"
        severity="secondary"
        variant="outlined"
      />
      <Button
        @click="$emit('import')"
        icon="pi pi-upload"
        label="Importar"
        severity="secondary"
        variant="outlined"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
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

const typeMenu = ref()

const typeOptions = [
  { value: 'prompt', label: 'Prompts', icon: 'pi pi-code' },
  { value: 'task', label: 'Tasks', icon: 'pi pi-list' },
  { value: 'formatter', label: 'Formatters', icon: 'pi pi-comment' }
]

const currentTypeLabel = computed(() => {
  const option = typeOptions.find(o => o.value === props.modelValue)
  return option?.label || 'Prompts'
})

const currentTypeIcon = computed(() => {
  const option = typeOptions.find(o => o.value === props.modelValue)
  return option?.icon || 'pi pi-code'
})

const description = computed(() => {
  if (props.modelValue === 'formatter') return 'Administra los templates de mensajes interactivos de WhatsApp'
  if (props.modelValue === 'task') return 'Administra los templates de texto para chatbot'
  return 'Administra los templates de prompts del sistema de IA'
})

const createLabel = computed(() => {
  return props.modelValue === 'task' ? 'Nuevo Task' : 'Nuevo Template'
})

const typeMenuItems = computed(() => [
  {
    label: 'Prompts',
    icon: 'pi pi-code',
    command: () => emit('update:modelValue', 'prompt')
  },
  {
    label: 'Tasks',
    icon: 'pi pi-list',
    command: () => emit('update:modelValue', 'task')
  },
  {
    label: 'Formatters',
    icon: 'pi pi-comment',
    command: () => emit('update:modelValue', 'formatter')
  }
])

function toggleTypeMenu(event: Event) {
  typeMenu.value.toggle(event)
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
}

.header-content p {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.text-muted {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
