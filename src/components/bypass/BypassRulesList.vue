<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBypassRules } from '@/composables/useBypassRules'
import { useDomains } from '@/composables/useDomains'
import type { BypassRule, BypassRuleType } from '@/types/bypassRules.types'
import {
  getRuleTypeLabel,
  getRuleTypeSeverity,
  formatRuleMatch,
  getDetailedRuleMatch
} from '@/types/bypassRules.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Skeleton from 'primevue/skeleton'

const emit = defineEmits<{
  (e: 'edit', rule: BypassRule): void
  (e: 'delete', rule: BypassRule): void
}>()

const {
  sortedRules,
  isLoading,
  fetchRules,
  toggleRule,
  reorderRules,
  setFilters
} = useBypassRules()

const { fetchDomains, getDomainLabel, getDomainColor } = useDomains()

// Filter options
const statusOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Activas', value: true },
  { label: 'Inactivas', value: false }
]

const ruleTypeOptions = [
  { label: 'Todos los tipos', value: undefined },
  { label: 'Patron de Telefono', value: 'phone_number' },
  { label: 'Lista de Telefonos', value: 'phone_number_list' },
  { label: 'WhatsApp Phone ID', value: 'whatsapp_phone_number_id' }
]

// Local filter state
const searchValue = ref('')
const statusFilter = ref<boolean | undefined>(undefined)
const typeFilter = ref<BypassRuleType | undefined>(undefined)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchValue.value = value

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setFilters({ search: value || undefined })
  }, 300)
}

function handleStatusFilter(enabled: boolean | undefined) {
  statusFilter.value = enabled
  setFilters({ enabled })
}

function handleTypeFilter(ruleType: BypassRuleType | undefined) {
  typeFilter.value = ruleType
  setFilters({ ruleType })
}

async function handleToggle(rule: BypassRule) {
  await toggleRule(rule.id)
}

async function movePriority(rule: BypassRule, direction: 'up' | 'down') {
  const rules = [...sortedRules.value]
  const index = rules.findIndex((r) => r.id === rule.id)

  if (direction === 'up' && index > 0) {
    // Swap with previous (higher priority)
    ;[rules[index - 1], rules[index]] = [rules[index], rules[index - 1]]
  } else if (direction === 'down' && index < rules.length - 1) {
    // Swap with next (lower priority)
    ;[rules[index], rules[index + 1]] = [rules[index + 1], rules[index]]
  } else {
    return // Can't move
  }

  const ruleIds = rules.map((r) => r.id)
  await reorderRules(ruleIds)
}

onMounted(() => {
  fetchRules()
  fetchDomains()
})
</script>

<template>
  <div class="bypass-rules-list">
    <!-- Filters -->
    <div class="flex gap-4 mb-4 flex-wrap">
      <div class="flex-1 min-w-64">
        <InputText
          v-model="searchValue"
          placeholder="Buscar por nombre, descripcion o agente..."
          class="w-full"
          @input="handleSearch"
        />
      </div>
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        class="w-40"
        @update:model-value="handleStatusFilter"
      />
      <Select
        v-model="typeFilter"
        :options="ruleTypeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo de Regla"
        class="w-56"
        @update:model-value="handleTypeFilter"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && sortedRules.length === 0" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" height="60px" />
    </div>

    <!-- Table -->
    <DataTable
      v-else
      :value="sortedRules"
      :loading="isLoading"
      stripedRows
      class="p-datatable-sm"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-directions text-4xl mb-2" />
          <p>No se encontraron reglas de bypass</p>
        </div>
      </template>

      <!-- Priority -->
      <Column header="Prioridad" style="width: 100px">
        <template #body="{ data, index }">
          <div class="flex items-center gap-1">
            <span class="font-mono text-sm font-bold">{{ data.priority }}</span>
            <div class="flex flex-col">
              <Button
                icon="pi pi-chevron-up"
                text
                rounded
                size="small"
                :disabled="index === 0"
                class="!p-0 !w-6 !h-4"
                @click="movePriority(data, 'up')"
              />
              <Button
                icon="pi pi-chevron-down"
                text
                rounded
                size="small"
                :disabled="index === sortedRules.length - 1"
                class="!p-0 !w-6 !h-4"
                @click="movePriority(data, 'down')"
              />
            </div>
          </div>
        </template>
      </Column>

      <!-- Name -->
      <Column field="rule_name" header="Nombre" style="min-width: 180px">
        <template #body="{ data }">
          <div>
            <div class="font-medium">{{ data.rule_name }}</div>
            <div v-if="data.description" class="text-xs text-gray-500 truncate max-w-xs">
              {{ data.description }}
            </div>
          </div>
        </template>
      </Column>

      <!-- Type -->
      <Column field="rule_type" header="Tipo" style="width: 120px">
        <template #body="{ data }">
          <Tag :value="getRuleTypeLabel(data.rule_type)" :severity="getRuleTypeSeverity(data.rule_type)" />
        </template>
      </Column>

      <!-- Pattern/Numbers -->
      <Column header="Patron/Numeros" style="width: 160px">
        <template #body="{ data }">
          <span
            v-tooltip.top="getDetailedRuleMatch(data)"
            class="text-sm font-mono cursor-help"
          >
            {{ formatRuleMatch(data) }}
          </span>
        </template>
      </Column>

      <!-- Target Agent -->
      <Column field="target_agent" header="Agente" style="width: 140px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.target_agent }}</span>
        </template>
      </Column>

      <!-- Domain -->
      <Column field="target_domain" header="Dominio" style="width: 120px">
        <template #body="{ data }">
          <Tag
            v-if="data.target_domain"
            :value="getDomainLabel(data.target_domain)"
            :severity="getDomainColor(data.target_domain)"
          />
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>

      <!-- Isolated History -->
      <Column header="Aislado" style="width: 80px">
        <template #body="{ data }">
          <i
            v-if="data.isolated_history"
            v-tooltip.top="'Historial aislado activo'"
            class="pi pi-history text-blue-500"
          />
          <span v-else class="text-gray-300">-</span>
        </template>
      </Column>

      <!-- Status Toggle -->
      <Column header="Estado" style="width: 100px">
        <template #body="{ data }">
          <ToggleSwitch :model-value="data.enabled" @update:model-value="handleToggle(data)" />
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Acciones" style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              v-tooltip.top="'Editar'"
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              @click="emit('edit', data)"
            />
            <Button
              v-tooltip.top="'Eliminar'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click="emit('delete', data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
