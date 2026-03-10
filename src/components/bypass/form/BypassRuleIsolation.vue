<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

const formData = defineModel<any>('formData', { required: true })

const newWhitelistNumber = ref('')

function addWhitelistNumber() {
  const number = newWhitelistNumber.value.trim()
  if (number && !formData.value.whitelist_numbers.includes(number)) {
    formData.value.whitelist_numbers.push(number)
    newWhitelistNumber.value = ''
  }
}

function removeWhitelistNumber(number: string) {
  formData.value.whitelist_numbers = formData.value.whitelist_numbers.filter((n: string) => n !== number)
}
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <i class="pi pi-history" />
      Aislamiento de Historial
    </h3>

    <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
      <Checkbox
        :checked="formData.isolated_history"
        @update:checked="(v: boolean) => formData.isolated_history = v"
      />
      <div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Historial Aislado</span>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Cuando esta activo, este agente tendra un historial de conversacion separado
          de otros agentes. Util para separar contextos (ej: farmacia vs excelencia).
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800 mt-3">
      <Checkbox
        :checked="formData.whitelist_only"
        @update:checked="(v: boolean) => formData.whitelist_only = v"
      />
      <div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Lista Blanca</span>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Cuando esta activo, solo los numeros en la lista permitida podran
          interactuar con el bot a traves de esta regla. Los demas seran ignorados.
        </p>
      </div>
    </div>

    <!-- Whitelist numbers input (shown when whitelist_only is checked) -->
    <div v-if="formData.whitelist_only" class="mt-3 pl-6">
      <Label class="text-gray-700 dark:text-gray-300">Numeros Permitidos</Label>

      <div class="flex gap-2 mb-2 mt-1">
        <Input
          v-model="newWhitelistNumber"
          placeholder="Ej: 2644472542"
          class="flex-1"
          @keyup.enter="addWhitelistNumber"
        />
        <Button size="icon" :disabled="!newWhitelistNumber.trim()" @click="addWhitelistNumber">
          <i class="pi pi-plus" />
        </Button>
      </div>

      <div
        v-if="formData.whitelist_numbers.length > 0"
        class="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
      >
        <Badge
          v-for="number in formData.whitelist_numbers"
          :key="number"
          variant="secondary"
          class="flex items-center gap-1 pr-1"
        >
          {{ number }}
          <button
            class="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
            @click="removeWhitelistNumber(number)"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </Badge>
      </div>
      <p v-else class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Agrega numeros de telefono permitidos para esta regla.
      </p>
    </div>
  </div>
</template>
