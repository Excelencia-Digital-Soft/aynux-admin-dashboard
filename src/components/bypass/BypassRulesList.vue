<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBypassRules } from '@/composables/useBypassRules'
import { useDomains } from '@/composables/useDomains'
import { pharmacyApi, type Pharmacy } from '@/api/pharmacy.api'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'
import { useAuthStore } from '@/stores/auth.store'
import type { BypassRule, BypassRuleType } from '@/types/bypassRules.types'
import {
  getRuleTypeLabel,
  getRuleTypeSeverity,
  formatRuleMatch,
  getDetailedRuleMatch
} from '@/types/bypassRules.types'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

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

const pharmacies = ref<Pharmacy[]>([])
const institutions = ref<TenantInstitutionConfig[]>([])

function getPharmacyName(pharmacyId: string | null | undefined): string | null {
  if (!pharmacyId) return null
  const pharmacy = pharmacies.value.find((p) => p.id === pharmacyId)
  return pharmacy?.name || null
}

function getInstitutionName(institutionId: string | null | undefined): string | null {
  if (!institutionId) return null
  const institution = institutions.value.find((i) => i.id === institutionId)
  return institution?.institution_name || null
}

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activas', value: 'true' },
  { label: 'Inactivas', value: 'false' }
]

const ruleTypeOptions = [
  { label: 'Todos los tipos', value: 'all' },
  { label: 'Patron de Telefono', value: 'phone_number' },
  { label: 'Lista de Telefonos', value: 'phone_number_list' },
  { label: 'WhatsApp Phone ID', value: 'whatsapp_phone_number_id' }
]

const searchValue = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchValue.value = value

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setFilters({ search: value || undefined })
  }, 300)
}

function handleStatusFilter(value: string) {
  statusFilter.value = value
  const enabled = value === 'all' ? undefined : value === 'true'
  setFilters({ enabled })
}

function handleTypeFilter(value: string) {
  typeFilter.value = value
  const ruleType = value === 'all' ? undefined : (value as BypassRuleType)
  setFilters({ ruleType })
}

async function handleToggle(rule: BypassRule) {
  await toggleRule(rule.id)
}

async function movePriority(rule: BypassRule, direction: 'up' | 'down') {
  const rules = [...sortedRules.value]
  const index = rules.findIndex((r) => r.id === rule.id)

  if (direction === 'up' && index > 0) {
    ;[rules[index - 1], rules[index]] = [rules[index], rules[index - 1]]
  } else if (direction === 'down' && index < rules.length - 1) {
    ;[rules[index], rules[index + 1]] = [rules[index + 1], rules[index]]
  } else {
    return
  }

  const ruleIds = rules.map((r) => r.id)
  await reorderRules(ruleIds)
}

function getSeverityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity) {
    case 'info': return 'default'
    case 'warn': return 'outline'
    case 'success': return 'secondary'
    default: return 'secondary'
  }
}

function getDomainBadgeVariant(color: string) {
  switch (color) {
    case 'info': return 'info' as const
    case 'success': return 'success' as const
    case 'warn': return 'warning' as const
    case 'help': return 'default' as const
    case 'secondary': return 'secondary' as const
    default: return 'outline' as const
  }
}

onMounted(async () => {
  fetchRules()
  fetchDomains()
  try {
    pharmacies.value = await pharmacyApi.getPharmacies()
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
  }
  try {
    const authStore = useAuthStore()
    const orgId = authStore.currentOrgId
    if (orgId) {
      const response = await tenantInstitutionConfigApi.list(orgId)
      institutions.value = response.items
    }
  } catch (error) {
    console.error('Error fetching institutions:', error)
  }
})
</script>

<template>
  <div class="bypass-rules-list">
    <!-- Filters -->
    <div class="glass-panel flex gap-4 mb-4 flex-wrap p-3 rounded-lg">
      <div class="flex-1 min-w-64 relative">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
        <Input
          v-model="searchValue"
          placeholder="Buscar por nombre, descripcion o agente..."
          class="pl-9 w-full"
          @input="handleSearch"
        />
      </div>
      <Select :model-value="statusFilter" @update:model-value="handleStatusFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select :model-value="typeFilter" @update:model-value="handleTypeFilter">
        <SelectTrigger class="w-56">
          <SelectValue placeholder="Tipo de Regla" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in ruleTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading && sortedRules.length === 0" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-14 animate-pulse bg-muted rounded" />
    </div>

    <!-- Table -->
    <div v-else class="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-24">Prioridad</TableHead>
            <TableHead class="min-w-[180px]">Nombre</TableHead>
            <TableHead class="w-28">Tipo</TableHead>
            <TableHead class="w-40">Patron/Numeros</TableHead>
            <TableHead class="w-36">Agente</TableHead>
            <TableHead class="w-36">Dominio</TableHead>
            <TableHead class="w-20">Aislado</TableHead>
            <TableHead class="w-24">Estado</TableHead>
            <TableHead class="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Empty state -->
          <TableRow v-if="sortedRules.length === 0">
            <TableCell :colspan="9" class="text-center py-8 text-gray-500 dark:text-gray-400">
              <i class="pi pi-directions text-4xl mb-2 block" />
              <p>No se encontraron reglas de bypass</p>
            </TableCell>
          </TableRow>

          <TableRow
            v-for="(rule, index) in sortedRules"
            :key="rule.id"
            class="hover:bg-muted/50"
          >
            <!-- Priority -->
            <TableCell>
              <div class="flex items-center gap-1">
                <span class="font-mono text-sm font-bold">{{ rule.priority }}</span>
                <div class="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5"
                    :disabled="index === 0"
                    @click="movePriority(rule, 'up')"
                  >
                    <i class="pi pi-chevron-up text-xs" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5"
                    :disabled="index === sortedRules.length - 1"
                    @click="movePriority(rule, 'down')"
                  >
                    <i class="pi pi-chevron-down text-xs" />
                  </Button>
                </div>
              </div>
            </TableCell>

            <!-- Name -->
            <TableCell>
              <div>
                <div class="font-medium text-gray-800 dark:text-gray-100">{{ rule.rule_name }}</div>
                <div v-if="rule.description" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {{ rule.description }}
                </div>
              </div>
            </TableCell>

            <!-- Type -->
            <TableCell>
              <Badge :variant="getSeverityVariant(getRuleTypeSeverity(rule.rule_type))">
                {{ getRuleTypeLabel(rule.rule_type) }}
              </Badge>
            </TableCell>

            <!-- Pattern/Numbers -->
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <span class="text-sm font-mono cursor-help text-gray-700 dark:text-gray-300">
                      {{ formatRuleMatch(rule) }}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">{{ getDetailedRuleMatch(rule) }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>

            <!-- Target Agent -->
            <TableCell>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ rule.target_agent }}</span>
            </TableCell>

            <!-- Domain -->
            <TableCell>
              <div class="flex flex-col gap-1">
                <Badge
                  v-if="rule.target_domain"
                  :variant="getDomainBadgeVariant(getDomainColor(rule.target_domain))"
                >
                  {{ getDomainLabel(rule.target_domain) }}
                </Badge>
                <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                <span
                  v-if="rule.pharmacy_id && getPharmacyName(rule.pharmacy_id)"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ getPharmacyName(rule.pharmacy_id) }}
                </span>
                <span
                  v-if="rule.institution_id && getInstitutionName(rule.institution_id)"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ getInstitutionName(rule.institution_id) }}
                </span>
              </div>
            </TableCell>

            <!-- Isolated History -->
            <TableCell>
              <TooltipProvider v-if="rule.isolated_history">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <i class="pi pi-history text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Historial aislado activo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </TableCell>

            <!-- Status Toggle -->
            <TableCell>
              <Switch :checked="rule.enabled" @update:checked="handleToggle(rule)" />
            </TableCell>

            <!-- Actions -->
            <TableCell>
              <div class="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('edit', rule)">
                        <i class="pi pi-pencil text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="emit('delete', rule)">
                        <i class="pi pi-trash text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Eliminar</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
