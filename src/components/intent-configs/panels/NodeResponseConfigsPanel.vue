<script setup lang="ts">
/**
 * NodeResponseConfigsPanel - Panel showing response configs linked to a node's
 * routing config intents, with inheritance visualization.
 *
 * Shows each ResponseConfig as a card with:
 * - Inheritance badge: SISTEMA (gray) / OVERRIDE (blue)
 * - Type badge, critical badge, template preview
 * - Edit, Create Override, Delete Override, View Diff actions
 */
import { computed, ref, watch, toRef } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import { useNodeResponseConfigs } from '../composables/useNodeResponseConfigs'
import { humanizeTargetIntent } from '../utils/labelHumanizer'
import type { ResponseConfig } from '@/types/responseConfigs.types'

interface Props {
  responseKeys: string[]
  domainKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'editResponse', config: ResponseConfig): void
  (e: 'createResponse', intentKey: string): void
  (e: 'createOverride', intentKey: string, systemConfig: ResponseConfig): void
  (e: 'deleteOverride', config: ResponseConfig): void
  (e: 'viewDiff', intentKey: string, systemConfig: ResponseConfig, overrideConfig: ResponseConfig): void
}>()

const domainKeyRef = toRef(props, 'domainKey')
const responseKeysRef = toRef(props, 'responseKeys')

const {
  effectiveConfigs,
  inheritanceMap,
  isLoading,
  isSystemOrg,
  intentsWithoutConfig,
  getInheritanceSource,
  getSystemConfig,
  getDiffFields,
} = useNodeResponseConfigs(domainKeyRef, responseKeysRef)

const totalCount = computed(
  () => effectiveConfigs.value.length + intentsWithoutConfig.value.length
)

// Search with debounce
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val
  }, 150)
})

const normalizedQuery = computed(() => debouncedQuery.value.trim().toLowerCase())

const filteredConfigs = computed(() => {
  if (!normalizedQuery.value) return effectiveConfigs.value
  return effectiveConfigs.value.filter(
    (rc) =>
      rc.intent_key.toLowerCase().includes(normalizedQuery.value) ||
      (rc.display_name ?? '').toLowerCase().includes(normalizedQuery.value) ||
      (rc.template_text ?? '').toLowerCase().includes(normalizedQuery.value)
  )
})

const filteredIntentsWithoutConfig = computed(() => {
  if (!normalizedQuery.value) return intentsWithoutConfig.value
  return intentsWithoutConfig.value.filter(
    (intentKey) =>
      intentKey.toLowerCase().includes(normalizedQuery.value) ||
      humanizeTargetIntent(intentKey).toLowerCase().includes(normalizedQuery.value)
  )
})

const filteredCount = computed(
  () => filteredConfigs.value.length + filteredIntentsWithoutConfig.value.length
)

function clearSearch() {
  searchQuery.value = ''
  debouncedQuery.value = ''
}

function truncateText(text: string | null, maxLength = 120): string {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

function handleAction(config: ResponseConfig) {
  const source = getInheritanceSource(config.intent_key)
  if (source === 'system' && !isSystemOrg.value) {
    // System config on tenant org → create override
    emit('createOverride', config.intent_key, config)
  } else {
    // Override or SYSTEM_ORG → edit directly
    emit('editResponse', config)
  }
}

function handleDeleteOverride(config: ResponseConfig) {
  emit('deleteOverride', config)
}

function handleViewDiff(config: ResponseConfig) {
  const systemConfig = getSystemConfig(config.intent_key)
  if (systemConfig) {
    emit('viewDiff', config.intent_key, systemConfig, config)
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <i class="pi pi-list text-sm text-muted-foreground" />
        <h4 class="text-sm font-semibold text-foreground m-0">
          Respuestas vinculadas
          <span v-if="!isLoading" class="text-muted-foreground font-normal">({{ totalCount }})</span>
        </h4>
      </div>
      <p class="text-xs text-muted-foreground m-0 leading-relaxed">
        Cada regla de enrutamiento genera una respuesta. Aqui ves como responde el bot para cada intencion.
      </p>
    </div>

    <!-- Search -->
    <div v-if="!isLoading && totalCount > 0" class="relative">
      <i
        class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
      />
      <Input v-model="searchQuery" placeholder="Buscar respuestas..." class="pl-8 h-8 text-xs" />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-6">
      <i class="pi pi-spin pi-spinner text-lg text-muted-foreground" />
    </div>

    <!-- Response Config Cards -->
    <template v-else>
      <div
        v-for="config in filteredConfigs"
        :key="config.id ?? config.intent_key"
        class="rounded-lg border border-border/50 bg-muted/30 p-3 flex flex-col gap-2"
        :class="{
          'border-l-2 border-l-blue-500/60': !isSystemOrg && getInheritanceSource(config.intent_key) === 'override',
          'opacity-80': !isSystemOrg && getInheritanceSource(config.intent_key) === 'system',
        }"
      >
        <!-- Title row -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              class="inline-block w-2 h-2 rounded-full shrink-0"
              :class="config.response_type === 'fixed' ? 'bg-blue-500' : 'bg-purple-500'"
            />
            <span class="text-sm font-medium text-foreground truncate">
              {{ config.display_name || humanizeTargetIntent(config.intent_key) }}
            </span>
          </div>
          <div class="flex items-center gap-0.5 shrink-0">
            <!-- View Diff button (only for overrides with system counterpart) -->
            <TooltipProvider v-if="!isSystemOrg && getInheritanceSource(config.intent_key) === 'override' && getSystemConfig(config.intent_key)">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    @click="handleViewDiff(config)"
                  >
                    <i class="pi pi-arrows-h text-xs" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Comparar con sistema</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <!-- Delete Override button (only for overrides on tenant orgs) -->
            <TooltipProvider v-if="!isSystemOrg && getInheritanceSource(config.intent_key) === 'override'">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-destructive/70 hover:text-destructive"
                    @click="handleDeleteOverride(config)"
                  >
                    <i class="pi pi-undo text-xs" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Revertir al sistema</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <!-- Edit / Create Override button -->
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    @click="handleAction(config)"
                  >
                    <i
                      class="text-xs"
                      :class="
                        !isSystemOrg && getInheritanceSource(config.intent_key) === 'system'
                          ? 'pi pi-copy'
                          : 'pi pi-pencil'
                      "
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {{
                    !isSystemOrg && getInheritanceSource(config.intent_key) === 'system'
                      ? 'Crear override'
                      : 'Editar respuesta'
                  }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Badges -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Inheritance badge (only for tenant orgs) -->
          <Badge
            v-if="!isSystemOrg && getInheritanceSource(config.intent_key) === 'system'"
            variant="secondary"
            class="text-[10px] px-1.5 py-0 italic"
          >
            SISTEMA
          </Badge>
          <Badge
            v-else-if="!isSystemOrg && getInheritanceSource(config.intent_key) === 'override'"
            variant="outline"
            class="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30"
          >
            OVERRIDE
            <span
              v-if="getDiffFields(config.intent_key).length > 0"
              class="ml-1 text-blue-300/70"
            >
              ({{ getDiffFields(config.intent_key).length }} cambios)
            </span>
          </Badge>

          <!-- Type badge -->
          <Badge
            :variant="config.response_type === 'fixed' ? 'info' : 'default'"
            class="text-[10px] px-1.5 py-0"
          >
            {{ config.response_type === 'fixed' ? 'Plantilla Fija' : 'Prompt IA' }}
          </Badge>
          <Badge v-if="config.is_critical" variant="warning" class="text-[10px] px-1.5 py-0">
            Critica
          </Badge>
          <Badge v-if="!config.is_enabled" variant="secondary" class="text-[10px] px-1.5 py-0">
            Inactiva
          </Badge>
          <Badge
            v-if="config.buttons && config.buttons.length > 0"
            variant="outline"
            class="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          >
            {{ config.buttons.length }}
            {{ config.buttons.length === 1 ? 'Boton' : 'Botones' }}
          </Badge>
        </div>

        <!-- Template preview -->
        <p
          v-if="config.template_text"
          class="text-xs text-muted-foreground font-mono leading-relaxed m-0 line-clamp-2"
        >
          "{{ truncateText(config.template_text) }}"
        </p>
        <p v-else class="text-xs text-muted-foreground italic m-0">Sin texto de plantilla</p>
      </div>

      <!-- Intents without config -->
      <div
        v-for="intentKey in filteredIntentsWithoutConfig"
        :key="intentKey"
        class="rounded-lg border border-dashed border-border/50 bg-muted/10 p-3 flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <i class="pi pi-exclamation-triangle text-xs text-amber-500" />
          <span class="text-sm text-muted-foreground truncate">
            {{ humanizeTargetIntent(intentKey) }}
          </span>
          <span class="text-xs text-muted-foreground/60">- Sin respuesta configurada</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7 shrink-0"
                @click="emit('createResponse', intentKey)"
              >
                <i class="pi pi-plus text-xs" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Crear respuesta</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <!-- Empty state: no search results -->
      <div v-if="normalizedQuery && filteredCount === 0" class="text-center py-4">
        <p class="text-xs text-muted-foreground m-0 mb-2">
          Sin resultados para "{{ searchQuery.trim() }}"
        </p>
        <Button variant="ghost" size="sm" class="text-xs h-7" @click="clearSearch">
          Limpiar busqueda
        </Button>
      </div>

      <!-- Empty state: no intents at all -->
      <div
        v-else-if="effectiveConfigs.length === 0 && intentsWithoutConfig.length === 0"
        class="text-center py-4"
      >
        <p class="text-xs text-muted-foreground m-0">
          Este nodo no tiene intenciones de enrutamiento configuradas.
        </p>
      </div>
    </template>
  </div>
</template>
