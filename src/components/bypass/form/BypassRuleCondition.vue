<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const formData = defineModel<any>('formData', { required: true })

defineProps<{
  ruleTypeOptions: { label: string; value: string }[]
}>()

const newPhoneNumber = ref('')

function addPhoneNumber() {
  const number = newPhoneNumber.value.trim()
  if (number && !formData.value.phone_numbers.includes(number)) {
    formData.value.phone_numbers.push(number)
    newPhoneNumber.value = ''
  }
}

function removePhoneNumber(number: string) {
  formData.value.phone_numbers = formData.value.phone_numbers.filter((n: string) => n !== number)
}
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <i class="pi pi-filter" />
      Condicion de Coincidencia
    </h3>

    <!-- Rule Type -->
    <div class="mb-4">
      <Label class="text-gray-700 dark:text-gray-300">Tipo de Regla *</Label>
      <Select v-model="formData.rule_type">
        <SelectTrigger class="w-full mt-1">
          <SelectValue placeholder="Seleccionar tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in ruleTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Phone Number Pattern -->
    <div v-if="formData.rule_type === 'phone_number'">
      <Label class="text-gray-700 dark:text-gray-300">Patron de Telefono *</Label>
      <Input
        v-model="formData.pattern"
        placeholder="Ej: 549* (numeros de Argentina)"
        class="mt-1"
      />
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Usa * como comodin. Ej: "549*" coincide con todos los numeros de Argentina.
      </p>
    </div>

    <!-- Phone Number List -->
    <div v-else-if="formData.rule_type === 'phone_number_list'">
      <Label class="text-gray-700 dark:text-gray-300">Lista de Telefonos *</Label>

      <div class="flex gap-2 mb-2 mt-1">
        <Input
          v-model="newPhoneNumber"
          placeholder="Agregar numero (ej: 5491155667788)"
          class="flex-1"
          @keyup.enter="addPhoneNumber"
        />
        <Button size="icon" :disabled="!newPhoneNumber.trim()" @click="addPhoneNumber">
          <i class="pi pi-plus" />
        </Button>
      </div>

      <div
        v-if="formData.phone_numbers.length > 0"
        class="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
      >
        <Badge
          v-for="number in formData.phone_numbers"
          :key="number"
          variant="secondary"
          class="flex items-center gap-1 pr-1"
        >
          {{ number }}
          <button
            class="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
            @click="removePhoneNumber(number)"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </Badge>
      </div>
      <p v-else class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Agrega al menos un numero de telefono.
      </p>
    </div>

    <!-- WhatsApp Phone Number ID -->
    <div v-else-if="formData.rule_type === 'whatsapp_phone_number_id'">
      <Label class="text-gray-700 dark:text-gray-300">WhatsApp Phone Number ID *</Label>
      <Input
        v-model="formData.phone_number_id"
        placeholder="Ej: 123456789012345"
        class="mt-1"
      />
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        ID del numero de WhatsApp Business (de Meta Business Manager).
      </p>
    </div>
  </div>
</template>
