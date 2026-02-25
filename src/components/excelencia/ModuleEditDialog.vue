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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

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

// Bridge v-model:visible to Dialog's v-model:open
const dialogOpen = computed({
  get: () => props.visible,
  set: (val: boolean) => {
    emit('update:visible', val)
    if (!val) emit('cancelled')
  }
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
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-[550px] glass-dialog">
      <DialogHeader>
        <DialogTitle>Editar Modulo</DialogTitle>
        <DialogDescription class="sr-only">Editar informacion del modulo de software</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Codigo (readonly) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codigo</label>
          <Input :model-value="module?.code" disabled />
        </div>

        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre <span class="text-red-500">*</span>
          </label>
          <Input v-model="moduleForm.name" />
        </div>

        <!-- Categoria y Estado -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <Select v-model="moduleForm.category">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
            <Select v-model="moduleForm.status">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Descripcion -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
          <Textarea v-model="moduleForm.description" :rows="3" />
        </div>

        <!-- Features y Pricing Tier -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Features (uno por linea)
            </label>
            <Textarea v-model="moduleForm.features" :rows="5" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan de Precios</label>
            <Select v-model="moduleForm.pricing_tier">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in pricingOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">Cancelar</Button>
        <Button
          @click="handleSave"
          :disabled="!canSave || isLoading"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
          <i v-else class="pi pi-check mr-2" />
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
