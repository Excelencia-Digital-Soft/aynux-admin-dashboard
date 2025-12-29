<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useBypassRules } from '@/composables/useBypassRules'
import type { BypassTestRequest } from '@/types/bypassRules.types'
import { getTargetDomainLabel } from '@/types/bypassRules.types'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const store = useBypassRulesStore()
const { testRouting, isLoading, closeTestDialog, clearTestResult } = useBypassRules()

const testData = ref<BypassTestRequest>({
  wa_id: '',
  whatsapp_phone_number_id: ''
})

const testResult = computed(() => store.testResult)

const canTest = computed(() => {
  return testData.value.wa_id.trim().length > 0
})

async function executeTest() {
  if (!canTest.value) return

  const request: BypassTestRequest = {
    wa_id: testData.value.wa_id.trim()
  }

  if (testData.value.whatsapp_phone_number_id?.trim()) {
    request.whatsapp_phone_number_id = testData.value.whatsapp_phone_number_id.trim()
  }

  await testRouting(request)
}

function handleClose() {
  testData.value = {
    wa_id: '',
    whatsapp_phone_number_id: ''
  }
  clearTestResult()
  closeTestDialog()
}

function clearResults() {
  clearTestResult()
}
</script>

<template>
  <Dialog
    :visible="store.showTestDialog"
    header="Probar Enrutamiento"
    :modal="true"
    :style="{ width: '700px' }"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Test Inputs -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-base">
            <i class="pi pi-play" />
            Datos de Prueba
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Phone Number (wa_id) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Numero de Telefono (wa_id) *
              </label>
              <InputText
                v-model="testData.wa_id"
                placeholder="Ej: 5491155667788"
                class="w-full"
                @keyup.enter="executeTest"
              />
              <p class="text-xs text-gray-400 mt-1">
                Numero de WhatsApp del usuario (sin + ni espacios)
              </p>
            </div>

            <!-- WhatsApp Phone Number ID (optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Phone Number ID (opcional)
              </label>
              <InputText
                v-model="testData.whatsapp_phone_number_id"
                placeholder="Ej: 123456789012345"
                class="w-full"
              />
              <p class="text-xs text-gray-400 mt-1">
                ID del numero de WhatsApp Business que recibe el mensaje
              </p>
            </div>

            <!-- Test Button -->
            <div class="flex gap-2">
              <Button
                label="Ejecutar Prueba"
                icon="pi pi-play"
                :disabled="!canTest"
                :loading="isLoading"
                @click="executeTest"
              />
              <Button
                v-if="testResult"
                label="Limpiar Resultados"
                icon="pi pi-times"
                severity="secondary"
                @click="clearResults"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Test Results -->
      <Card v-if="testResult">
        <template #title>
          <div class="flex items-center gap-2 text-base">
            <i class="pi pi-check-circle" />
            Resultados
          </div>
        </template>
        <template #content>
          <!-- Match Status -->
          <div class="mb-4">
            <Tag
              :value="testResult.matched ? 'Coincidencia Encontrada' : 'Sin Coincidencia'"
              :severity="testResult.matched ? 'success' : 'warn'"
              class="text-sm"
            />
          </div>

          <!-- Matched Rule Info -->
          <div v-if="testResult.matched && testResult.matched_rule" class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Regla</label>
                <p class="font-medium">{{ testResult.matched_rule.rule_name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Prioridad</label>
                <p class="font-mono">{{ testResult.matched_rule.priority }}</p>
              </div>
            </div>

            <Divider />

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Agente Destino</label>
                <Tag :value="testResult.target_agent" severity="info" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Dominio</label>
                <Tag
                  v-if="testResult.target_domain"
                  :value="getTargetDomainLabel(testResult.target_domain)"
                  severity="secondary"
                />
                <span v-else class="text-gray-400">-</span>
              </div>
            </div>
          </div>

          <!-- No Match Message -->
          <Message v-else severity="info" :closable="false">
            Ninguna regla coincide con los datos proporcionados. La conversacion sera enrutada al
            agente por defecto.
          </Message>

          <Divider />

          <!-- Evaluation Order -->
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-2">
              Orden de Evaluacion
            </label>
            <div v-if="testResult.evaluation_order.length > 0" class="flex flex-wrap gap-2">
              <div
                v-for="(ruleName, index) in testResult.evaluation_order"
                :key="ruleName"
                class="flex items-center gap-1"
              >
                <span class="text-xs text-gray-400">{{ index + 1 }}.</span>
                <Tag
                  :value="ruleName"
                  :severity="
                    testResult.matched_rule?.rule_name === ruleName ? 'success' : 'secondary'
                  "
                  class="text-xs"
                />
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm">No hay reglas activas para evaluar.</p>
          </div>
        </template>
      </Card>
    </div>

    <template #footer>
      <Button label="Cerrar" severity="secondary" icon="pi pi-times" @click="handleClose" />
    </template>
  </Dialog>
</template>
