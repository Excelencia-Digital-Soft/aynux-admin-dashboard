<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useBypassRules } from '@/composables/useBypassRules'
import { useDomains } from '@/composables/useDomains'
import type { BypassTestRequest } from '@/types/bypassRules.types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'

const store = useBypassRulesStore()
const { testRouting, isLoading, closeTestDialog, clearTestResult } = useBypassRules()
const { fetchDomains, getDomainLabel, getDomainColor } = useDomains()

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

function getDomainBadgeVariant(color: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (color) {
    case 'info': return 'default'
    case 'success': return 'secondary'
    case 'warn': return 'outline'
    default: return 'secondary'
  }
}

onMounted(() => {
  fetchDomains()
})
</script>

<template>
  <Dialog :open="store.showTestDialog" @update:open="(v: boolean) => { if (!v) handleClose() }">
    <DialogContent class="glass-dialog sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Probar Enrutamiento</DialogTitle>
        <DialogDescription class="sr-only">
          Simular el enrutamiento de un mensaje de WhatsApp para verificar las reglas de bypass
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- Test Inputs -->
        <Card class="glass-panel">
          <CardHeader class="pb-3">
            <CardTitle class="text-base flex items-center gap-2">
              <i class="pi pi-play" />
              Datos de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Phone Number (wa_id) -->
            <div>
              <Label class="text-gray-700 dark:text-gray-300">
                Numero de Telefono (wa_id) *
              </Label>
              <Input
                v-model="testData.wa_id"
                placeholder="Ej: 5491155667788"
                class="mt-1"
                @keyup.enter="executeTest"
              />
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Numero de WhatsApp del usuario (sin + ni espacios)
              </p>
            </div>

            <!-- WhatsApp Phone Number ID (optional) -->
            <div>
              <Label class="text-gray-700 dark:text-gray-300">
                WhatsApp Phone Number ID (opcional)
              </Label>
              <Input
                v-model="testData.whatsapp_phone_number_id"
                placeholder="Ej: 123456789012345"
                class="mt-1"
              />
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ID del numero de WhatsApp Business que recibe el mensaje
              </p>
            </div>

            <!-- Test Button -->
            <div class="flex gap-2">
              <Button :disabled="!canTest" @click="executeTest">
                <i v-if="isLoading" class="pi pi-spinner pi-spin mr-2" />
                <i v-else class="pi pi-play mr-2" />
                Ejecutar Prueba
              </Button>
              <Button
                v-if="testResult"
                variant="outline"
                @click="clearResults"
              >
                <i class="pi pi-times mr-2" />
                Limpiar Resultados
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Test Results -->
        <Card v-if="testResult" class="glass-panel">
          <CardHeader class="pb-3">
            <CardTitle class="text-base flex items-center gap-2">
              <i class="pi pi-check-circle" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Match Status -->
            <div class="mb-4">
              <Badge :variant="testResult.matched ? 'default' : 'outline'">
                {{ testResult.matched ? 'Coincidencia Encontrada' : 'Sin Coincidencia' }}
              </Badge>
            </div>

            <!-- Matched Rule Info -->
            <div v-if="testResult.matched && testResult.matched_rule" class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-gray-500 dark:text-gray-400">Regla</Label>
                  <p class="font-medium text-gray-800 dark:text-gray-100">{{ testResult.matched_rule.rule_name }}</p>
                </div>
                <div>
                  <Label class="text-gray-500 dark:text-gray-400">Prioridad</Label>
                  <p class="font-mono text-gray-800 dark:text-gray-100">{{ testResult.matched_rule.priority }}</p>
                </div>
              </div>

              <Separator />

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-gray-500 dark:text-gray-400">Agente Destino</Label>
                  <Badge class="mt-1">{{ testResult.target_agent }}</Badge>
                </div>
                <div>
                  <Label class="text-gray-500 dark:text-gray-400">Dominio</Label>
                  <div class="mt-1">
                    <Badge
                      v-if="testResult.target_domain"
                      :variant="getDomainBadgeVariant(getDomainColor(testResult.target_domain))"
                    >
                      {{ getDomainLabel(testResult.target_domain) }}
                    </Badge>
                    <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Match Message -->
            <Alert v-else>
              <AlertDescription>
                Ninguna regla coincide con los datos proporcionados. La conversacion sera enrutada al
                agente por defecto.
              </AlertDescription>
            </Alert>

            <Separator class="my-4" />

            <!-- Evaluation Order -->
            <div>
              <Label class="text-gray-500 dark:text-gray-400 mb-2 block">
                Orden de Evaluacion
              </Label>
              <div v-if="testResult.evaluation_order.length > 0" class="flex flex-wrap gap-2">
                <div
                  v-for="(ruleName, index) in testResult.evaluation_order"
                  :key="ruleName"
                  class="flex items-center gap-1"
                >
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ index + 1 }}.</span>
                  <Badge
                    :variant="testResult.matched_rule?.rule_name === ruleName ? 'default' : 'secondary'"
                    class="text-xs"
                  >
                    {{ ruleName }}
                  </Badge>
                </div>
              </div>
              <p v-else class="text-gray-400 dark:text-gray-500 text-sm">
                No hay reglas activas para evaluar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          <i class="pi pi-times mr-2" />
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
