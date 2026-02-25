<script setup lang="ts">
/**
 * BypassRuleDetailPanel - Side panel showing bypass rule details
 *
 * Displays:
 * - Rule name and type
 * - Status and priority
 * - Match criteria (pattern, phone list, or WhatsApp ID)
 * - Target agent information
 * - Flow explanation
 */
import { computed } from 'vue'
import type { BypassRuleVisualization } from '@/types/agentFlow.types'
import { BYPASS_RULE_TYPE_CONFIG } from '@/types/agentFlow.types'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface Props {
  rule: BypassRuleVisualization | null
  visible: boolean
  targetAgentName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', ruleId: string): void
}>()

const typeConfig = computed(() =>
  props.rule ? BYPASS_RULE_TYPE_CONFIG[props.rule.rule_type] : null
)

function handleClose() {
  emit('update:visible', false)
}

function handleEdit() {
  if (props.rule) {
    emit('edit', props.rule.id)
  }
}
</script>

<template>
  <Sheet :open="visible" @update:open="emit('update:visible', $event)">
    <SheetContent side="right" class="w-96 overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Detalles de Regla</SheetTitle>
        <SheetDescription class="sr-only">
          Panel lateral con detalles de la regla de bypass seleccionada
        </SheetDescription>
      </SheetHeader>

      <template v-if="rule">
        <div class="mt-6 space-y-4">
          <!-- Header -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: typeConfig?.color + '20' }"
            >
              <i
                :class="['pi', typeConfig?.icon, 'text-lg']"
                :style="{ color: typeConfig?.color }"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-lg truncate text-gray-800 dark:text-gray-100">{{ rule.rule_name }}</h3>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ typeConfig?.displayName }}</span>
            </div>
          </div>

          <!-- Status & Priority -->
          <div class="flex gap-2">
            <Badge :variant="rule.enabled ? 'default' : 'destructive'">
              {{ rule.enabled ? 'Activa' : 'Inactiva' }}
            </Badge>
            <Badge variant="outline">
              Prioridad {{ rule.priority }}
            </Badge>
          </div>

          <!-- Description -->
          <div v-if="rule.description">
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Descripcion</label>
            <p class="text-gray-800 dark:text-gray-100 mt-1">{{ rule.description }}</p>
          </div>

          <Separator />

          <!-- Match Criteria -->
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
              Criterio de Match
            </label>

            <!-- Phone Pattern -->
            <div
              v-if="rule.rule_type === 'phone_number' && rule.pattern"
              class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <i class="pi pi-search" />
                <span>Patron Regex</span>
              </div>
              <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-gray-800 dark:text-gray-200">
                {{ rule.pattern }}
              </code>
            </div>

            <!-- Phone List -->
            <div
              v-else-if="rule.rule_type === 'phone_number_list' && rule.phone_numbers"
              class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <i class="pi pi-list" />
                <span>{{ rule.phone_numbers.length }} Numeros</span>
              </div>
              <div class="max-h-32 overflow-y-auto space-y-1">
                <div
                  v-for="phone in rule.phone_numbers"
                  :key="phone"
                  class="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200"
                >
                  {{ phone }}
                </div>
              </div>
            </div>

            <!-- WhatsApp Phone ID -->
            <div
              v-else-if="rule.rule_type === 'whatsapp_phone_number_id' && rule.phone_number_id"
              class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <i class="pi pi-whatsapp" />
                <span>WhatsApp Phone Number ID</span>
              </div>
              <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block text-gray-800 dark:text-gray-200">
                {{ rule.phone_number_id }}
              </code>
            </div>

            <!-- No criteria -->
            <div v-else class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-700">
              No hay criterio de match configurado
            </div>
          </div>

          <Separator />

          <!-- Target Agent -->
          <div>
            <label class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
              Agente Destino
            </label>
            <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <i class="pi pi-android text-blue-500 text-xl" />
              <div>
                <div class="font-medium text-blue-800 dark:text-blue-300">
                  {{ targetAgentName || rule.target_agent }}
                </div>
                <div v-if="rule.target_domain" class="text-sm text-blue-600 dark:text-blue-400">
                  Dominio: {{ rule.target_domain }}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Flow Explanation -->
          <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
            <div class="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-medium mb-2">
              <i class="pi pi-directions" />
              <span>Flujo de Bypass</span>
            </div>
            <div class="text-sm text-orange-600 dark:text-orange-400 space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <span>Mensaje entrante de WhatsApp</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <span>Regla evalua criterio de match</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <span>Mensaje va directo a {{ targetAgentName || rule.target_agent }}</span>
              </div>
            </div>
          </div>

          <!-- Edit Button -->
          <Button variant="outline" class="w-full" @click="handleEdit">
            <i class="pi pi-pencil mr-2" />
            Editar Regla
          </Button>
        </div>
      </template>

      <!-- Empty state -->
      <template v-else>
        <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
          <i class="pi pi-filter text-4xl mb-2" />
          <p>Selecciona una regla para ver detalles</p>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
