<script setup lang="ts">
import { ref } from 'vue'
import type { InteractiveListItem } from '@/api/pharmacy.api'
import Dialog from 'primevue/dialog'

interface Props {
  items: InteractiveListItem[]
  buttonText?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Ver opciones',
  disabled: false
})

const emit = defineEmits<{
  select: [item: InteractiveListItem]
}>()

const showDialog = ref(false)

function openDialog() {
  if (!props.disabled) {
    showDialog.value = true
  }
}

function handleSelect(item: InteractiveListItem) {
  showDialog.value = false
  emit('select', item)
}
</script>

<template>
  <div class="whatsapp-list mt-2">
    <button
      class="whatsapp-list-trigger"
      :disabled="disabled"
      @click="openDialog"
    >
      <i class="pi pi-list mr-2" />
      {{ buttonText }}
    </button>

    <Dialog
      v-model:visible="showDialog"
      modal
      :header="buttonText"
      :style="{ width: '90%', maxWidth: '400px' }"
      :draggable="false"
    >
      <div class="whatsapp-list-items space-y-2">
        <button
          v-for="item in items"
          :key="item.id"
          class="whatsapp-list-item"
          @click="handleSelect(item)"
        >
          <div class="item-content">
            <span class="item-title">{{ item.titulo }}</span>
            <span v-if="item.descripcion" class="item-description">
              {{ item.descripcion }}
            </span>
          </div>
          <i class="pi pi-chevron-right text-gray-400" />
        </button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.whatsapp-list-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid #25D366;
  border-radius: 0.5rem;
  background-color: transparent;
  color: #25D366;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.whatsapp-list-trigger:hover:not(:disabled) {
  background-color: #25D366;
  color: white;
}

.whatsapp-list-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #9ca3af;
  color: #9ca3af;
}

.whatsapp-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.whatsapp-list-item:hover {
  background-color: #f0fdf4;
  border-color: #25D366;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-title {
  font-weight: 500;
  color: #111827;
}

.item-description {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Dark mode support */
:global(.dark-mode) .whatsapp-list-trigger {
  border-color: #34d058;
  color: #34d058;
}

:global(.dark-mode) .whatsapp-list-trigger:hover:not(:disabled) {
  background-color: #34d058;
  color: #111827;
}

:global(.dark-mode) .whatsapp-list-trigger:disabled {
  border-color: #6b7280;
  color: #6b7280;
}

:global(.dark-mode) .whatsapp-list-item {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark-mode) .whatsapp-list-item:hover {
  background-color: #064e3b;
  border-color: #34d058;
}

:global(.dark-mode) .item-title {
  color: #f3f4f6;
}

:global(.dark-mode) .item-description {
  color: #9ca3af;
}
</style>
