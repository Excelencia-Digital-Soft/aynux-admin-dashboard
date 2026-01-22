<script setup lang="ts">
import { ref } from 'vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Chip from 'primevue/chip'

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
    <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <i class="pi pi-filter" />
      Condicion de Coincidencia
    </h3>

    <!-- Rule Type -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1"> Tipo de Regla * </label>
      <Select
        v-model="formData.rule_type"
        :options="ruleTypeOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />
    </div>

    <!-- Phone Number Pattern -->
    <div v-if="formData.rule_type === 'phone_number'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Patron de Telefono *
      </label>
      <InputText
        v-model="formData.pattern"
        placeholder="Ej: 549* (numeros de Argentina)"
        class="w-full"
      />
      <p class="text-xs text-gray-400 mt-1">
        Usa * como comodin. Ej: "549*" coincide con todos los numeros de Argentina.
      </p>
    </div>

    <!-- Phone Number List -->
    <div v-else-if="formData.rule_type === 'phone_number_list'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Lista de Telefonos *
      </label>

      <div class="flex gap-2 mb-2">
        <InputText
          v-model="newPhoneNumber"
          placeholder="Agregar numero (ej: 5491155667788)"
          class="flex-1"
          @keyup.enter="addPhoneNumber"
        />
        <Button icon="pi pi-plus" :disabled="!newPhoneNumber.trim()" @click="addPhoneNumber" />
      </div>

      <div
        v-if="formData.phone_numbers.length > 0"
        class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded"
      >
        <Chip
          v-for="number in formData.phone_numbers"
          :key="number"
          :label="number"
          removable
          @remove="removePhoneNumber(number)"
        />
      </div>
      <p v-else class="text-xs text-gray-400">Agrega al menos un numero de telefono.</p>
    </div>

    <!-- WhatsApp Phone Number ID -->
    <div v-else-if="formData.rule_type === 'whatsapp_phone_number_id'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        WhatsApp Phone Number ID *
      </label>
      <InputText
        v-model="formData.phone_number_id"
        placeholder="Ej: 123456789012345"
        class="w-full"
      />
      <p class="text-xs text-gray-400 mt-1">
        ID del numero de WhatsApp Business (de Meta Business Manager).
      </p>
    </div>
  </div>
</template>
