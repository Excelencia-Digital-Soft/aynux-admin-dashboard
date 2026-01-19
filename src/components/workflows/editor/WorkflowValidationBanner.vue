<script setup lang="ts">
defineProps<{
  validationErrors: any[] // Using any for now or I need to find the type definition for validation errors
}>()

const emit = defineEmits<{
  (e: 'focusNode', nodeId: string): void
}>()
</script>

<template>
  <div v-if="validationErrors.length > 0" class="validation-banner mb-4">
    <div
      v-for="(error, index) in validationErrors"
      :key="index"
      class="validation-item"
      :class="{ 'validation-error': error.type === 'error', 'validation-warning': error.type === 'warning' }"
      @click="emit('focusNode', error.nodeId)"
    >
      <i :class="['pi', error.type === 'error' ? 'pi-times-circle' : 'pi-exclamation-triangle']" />
      <span>{{ error.message }}</span>
      <i v-if="error.nodeId" class="pi pi-arrow-right ml-auto cursor-pointer" title="Ir al nodo" />
    </div>
  </div>
</template>

<style scoped>
.validation-banner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.validation-item:hover {
  transform: translateX(4px);
}

.validation-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.validation-error:hover {
  background: #fee2e2;
}

.validation-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}

.validation-warning:hover {
  background: #fef3c7;
}
</style>
