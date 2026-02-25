<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const formData = defineModel<any>('formData', { required: true })
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <i class="pi pi-info-circle" />
      Informacion Basica
    </h3>

    <!-- Name -->
    <div>
      <Label class="text-gray-700 dark:text-gray-300">Nombre de la Regla *</Label>
      <Input
        v-model="formData.rule_name"
        placeholder="Ej: VIP Argentina"
        class="mt-1"
      />
    </div>

    <!-- Description -->
    <div>
      <Label class="text-gray-700 dark:text-gray-300">Descripcion</Label>
      <Textarea
        v-model="formData.description"
        :rows="2"
        placeholder="Descripcion opcional de la regla"
        class="mt-1"
      />
    </div>

    <!-- Priority -->
    <div>
      <Label class="text-gray-700 dark:text-gray-300">Prioridad *</Label>
      <Input
        v-model.number="formData.priority"
        type="number"
        :min="1"
        :max="1000"
        class="mt-1"
      />
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Mayor numero = mayor prioridad. Las reglas se evaluan en orden descendente.
      </p>
    </div>
  </div>
</template>
