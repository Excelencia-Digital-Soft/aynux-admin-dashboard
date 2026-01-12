<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { catalogApi } from '@/api/agent.api'
import { useToast } from '@/composables/useToast'
import type {
  SoftwareModule,
  SoftwareModuleUpdateRequest,
  ModuleCategory,
  ModuleStatus,
  PricingTier
} from '@/types/agent.types'
import {
  categoryOptions,
  statusOptions,
  pricingOptions
} from '@/types/agent.types'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'

interface Props {
  visible: boolean
  module: SoftwareModule | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved', module: SoftwareModule): void
  (e: 'cancelled'): void
}>()

const toast = useToast()
const isLoading = ref(false)

// Form state
const moduleForm = ref({
  name: '',
  description: '',
  category: 'general' as ModuleCategory,
  status: 'active' as ModuleStatus,
  features: '',
  pricing_tier: 'standard' as PricingTier
})

// Sync form when module changes
watch(
  () => props.module,
  (newModule) => {
    if (newModule) {
      moduleForm.value = {
        name: newModule.name,
        description: newModule.description || '',
        category: newModule.category,
        status: newModule.status,
        features: newModule.features?.join('\n') || '',
        pricing_tier: newModule.pricing_tier
      }
    } else {
      // Reset form
      moduleForm.value = {
        name: '',
        description: '',
        category: 'general',
        status: 'active',
        features: '',
        pricing_tier: 'standard'
      }
    }
  },
  { immediate: true }
)

const canSave = computed(() => moduleForm.value.name.trim().length > 0)

function handleClose() {
  emit('update:visible', false)
  emit('cancelled')
}

async function handleSave() {
  if (!props.module || !canSave.value) return

  isLoading.value = true
  try {
    const features = moduleForm.value.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    const updateData: SoftwareModuleUpdateRequest = {
      name: moduleForm.value.name,
      description: moduleForm.value.description,
      category: moduleForm.value.category,
      status: moduleForm.value.status,
      features,
      pricing_tier: moduleForm.value.pricing_tier
    }

    const updatedModule = await catalogApi.updateModule(props.module.id, updateData)
    toast.success('Modulo actualizado')
    emit('update:visible', false)
    emit('saved', updatedModule || { ...props.module, ...updateData, features })
  } catch (error) {
    console.error('Error updating module:', error)
    toast.error('Error al guardar modulo')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Editar Modulo"
    :modal="true"
    :style="{ width: '550px' }"
  >
    <div class="space-y-4">
      <!-- Codigo (readonly) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
        <InputText :value="module?.code" disabled class="w-full" />
      </div>

      <!-- Nombre -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <InputText v-model="moduleForm.name" class="w-full" />
      </div>

      <!-- Categoria y Estado -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <Select
            v-model="moduleForm.category"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <Select
            v-model="moduleForm.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Descripcion -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <Textarea v-model="moduleForm.description" rows="3" class="w-full" />
      </div>

      <!-- Features y Pricing Tier -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Features (uno por linea)
          </label>
          <Textarea v-model="moduleForm.features" rows="5" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan de Precios</label>
          <Select
            v-model="moduleForm.pricing_tier"
            :options="pricingOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="handleClose" />
      <Button
        label="Guardar"
        severity="success"
        @click="handleSave"
        :loading="isLoading"
        :disabled="!canSave"
      />
    </template>
  </Dialog>
</template>
