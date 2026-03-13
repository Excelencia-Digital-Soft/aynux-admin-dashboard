<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useEventosConfig } from '@/composables/useEventosConfig'
import type { EventosMenuConfig } from '@/types/eventosConfig.types'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible'

const props = defineProps<{ organizationId: string }>()

const {
  menusByKey, updateMenu, createMenu, seedDefaults,
  allMenuKeys, allFormTypes
} = useEventosConfig()

// ============ Search ============

const searchQuery = ref('')

// Keys that are referenced as target_menu_key by some option → they are submenus
const submenuKeys = computed(() => {
  const targeted = new Set<string>()
  for (const items of Object.values(menusByKey.value)) {
    for (const item of items) {
      if (item.target_menu_key) targeted.add(item.target_menu_key)
    }
  }
  return targeted
})

function isSubmenu(key: string): boolean {
  return submenuKeys.value.has(key)
}

// Sorted entries: main menus first, then submenus, alphabetically within each group
const sortedMenuEntries = computed(() => {
  const entries = Object.entries(menusByKey.value)
  return entries.sort(([a], [b]) => {
    const aIsSub = submenuKeys.value.has(a)
    const bIsSub = submenuKeys.value.has(b)
    if (aIsSub !== bIsSub) return aIsSub ? 1 : -1
    return a.localeCompare(b)
  })
})

const filteredMenuEntries = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return sortedMenuEntries.value

  return sortedMenuEntries.value.filter(([key, items]) => {
    if (key.toLowerCase().includes(q)) return true
    return items.some(i => i.display_text.toLowerCase().includes(q))
  })
})

// ============ Expand/Collapse ============

const expandedMenus = ref<Set<string>>(new Set())

function toggleMenu(key: string) {
  if (expandedMenus.value.has(key)) {
    expandedMenus.value.delete(key)
  } else {
    expandedMenus.value.add(key)
  }
}

// ============ Inline Edit ============

const editingId = ref<number | null>(null)
const editingText = ref('')

function startEdit(item: EventosMenuConfig) {
  editingId.value = item.id
  editingText.value = item.display_text
}

async function finishEdit(item: EventosMenuConfig) {
  if (editingText.value.trim() && editingText.value !== item.display_text) {
    await updateMenu(item.id, { display_text: editingText.value.trim() })
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

// ============ Toggle Enabled ============

async function toggleEnabled(item: EventosMenuConfig) {
  await updateMenu(item.id, { is_enabled: !item.is_enabled })
}

// ============ Target Helpers ============

type TargetType = 'submenu' | 'form' | 'action' | 'none'

function getTargetType(item: EventosMenuConfig): TargetType {
  if (item.target_menu_key) return 'submenu'
  if (item.target_action?.startsWith('form_')) return 'form'
  if (item.target_action) return 'action'
  return 'none'
}

const allActionTypes = computed(() => {
  const actions = new Set<string>()
  for (const items of Object.values(menusByKey.value)) {
    for (const item of items) {
      if (item.target_action && !item.target_action.startsWith('form_')) {
        actions.add(item.target_action)
      }
    }
  }
  return [...actions].sort()
})

function getTargetDisplay(item: EventosMenuConfig): string {
  if (item.target_menu_key) return item.target_menu_key
  if (item.target_action?.startsWith('form_')) return item.target_action.slice(5)
  if (item.target_action) return item.target_action
  return ''
}

async function changeTargetType(item: EventosMenuConfig, newType: string) {
  if (newType === 'submenu') {
    const firstKey = allMenuKeys.value[0] || null
    await updateMenu(item.id, { target_menu_key: firstKey, target_action: null })
  } else if (newType === 'form') {
    const firstForm = allFormTypes.value[0] || ''
    await updateMenu(item.id, { target_action: firstForm ? `form_${firstForm}` : null, target_menu_key: null })
  } else if (newType === 'action') {
    const firstAction = allActionTypes.value[0] || null
    await updateMenu(item.id, { target_action: firstAction, target_menu_key: null })
  } else {
    await updateMenu(item.id, { target_menu_key: null, target_action: null })
  }
}

async function changeTargetMenu(item: EventosMenuConfig, menuKey: string) {
  await updateMenu(item.id, { target_menu_key: menuKey, target_action: null })
}

async function changeFormType(item: EventosMenuConfig, formType: string) {
  await updateMenu(item.id, { target_action: `form_${formType}`, target_menu_key: null })
}

async function changeActionType(item: EventosMenuConfig, action: string) {
  await updateMenu(item.id, { target_action: action, target_menu_key: null })
}

// ============ New Menu Dialog ============

const showNewMenuDialog = ref(false)
const newMenuKey = ref('')

async function handleCreateMenu() {
  const key = newMenuKey.value.trim().toLowerCase().replace(/\s+/g, '_')
  if (!key) return

  const result = await createMenu({
    organization_id: props.organizationId,
    menu_key: key,
    option_number: 0,
    display_text: `Menu ${formatMenuKey(key)}`
  })

  if (result) {
    expandedMenus.value.add(key)
    showNewMenuDialog.value = false
    newMenuKey.value = ''
  }
}

// ============ Add Option ============

const addingOptionTo = ref<string | null>(null)
const newOptionText = ref('')

function startAddOption(menuKey: string) {
  addingOptionTo.value = menuKey
  newOptionText.value = ''
  nextTick(() => {
    const input = document.querySelector('[data-new-option-input]') as HTMLInputElement
    input?.focus()
  })
}

async function confirmAddOption(menuKey: string, items: EventosMenuConfig[]) {
  const text = newOptionText.value.trim()
  if (!text) {
    cancelAddOption()
    return
  }

  const maxOption = items.reduce((max, i) => Math.max(max, i.option_number), 0)

  await createMenu({
    organization_id: props.organizationId,
    menu_key: menuKey,
    option_number: maxOption + 1,
    display_text: text
  })

  addingOptionTo.value = null
  newOptionText.value = ''
}

function cancelAddOption() {
  addingOptionTo.value = null
  newOptionText.value = ''
}

// ============ Format Helpers ============

function formatMenuKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getActionIcon(item: EventosMenuConfig): string {
  if (item.target_menu_key) return 'pi-arrow-right'
  if (item.target_action?.startsWith('form_')) return 'pi-file-edit'
  if (item.target_action === 'human_handoff') return 'pi-user'
  if (item.target_action === 'pagos_info' || item.target_action === 'link') return 'pi-external-link'
  if (item.target_action === 'info') return 'pi-info-circle'
  if (item.target_action) return 'pi-bolt'
  return 'pi-circle'
}

function getHeader(items: EventosMenuConfig[]): EventosMenuConfig | undefined {
  return items.find(i => i.option_number === 0)
}

async function handleCreateHeader(menuKey: string) {
  const result = await createMenu({
    organization_id: props.organizationId,
    menu_key: menuKey,
    option_number: 0,
    display_text: 'Mensaje principal...'
  })
  if (result) {
    startEdit(result)
  }
}

const targetTypeLabels: Record<string, string> = {
  submenu: 'Submenu',
  form: 'Formulario',
  action: 'Accion',
  none: 'Sin destino'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar menu o texto..."
          class="pl-9 h-9"
        />
      </div>
      <Button size="sm" @click="showNewMenuDialog = true">
        <i class="pi pi-plus mr-1.5" />
        Nuevo Menu
      </Button>
    </div>

    <!-- Menu Groups -->
    <Card
      v-for="[key, items] in filteredMenuEntries"
      :key="key"
      class="glass-card"
    >
      <Collapsible :open="expandedMenus.has(key)">
        <CollapsibleTrigger
          class="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/30 transition-colors"
          @click="toggleMenu(key)"
        >
          <i
            class="pi text-xs transition-transform"
            :class="expandedMenus.has(key) ? 'pi-chevron-down' : 'pi-chevron-right'"
          />
          <span class="font-semibold text-sm">{{ formatMenuKey(key) }}</span>
          <Badge
            :variant="isSubmenu(key) ? 'outline' : 'default'"
            class="text-[10px] px-1.5 py-0"
          >
            {{ isSubmenu(key) ? 'Submenu' : 'Menu' }}
          </Badge>
          <Badge variant="secondary" class="text-xs px-1.5 py-0">{{ items.length }}</Badge>
          <span class="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 shrink-0"
            @click.stop="startAddOption(key)"
          >
            <i class="pi pi-plus text-xs" />
          </Button>
        </CollapsibleTrigger>

        <!-- Pre-message (header / option_number=0) — always visible -->
        <div v-if="getHeader(items)" class="px-4 pb-2">
          <div class="flex items-start gap-3 py-2 px-3 rounded-md bg-muted/10 border-l-2 border-primary/40">
            <Badge variant="outline" class="text-[10px] px-1.5 shrink-0 mt-1">
              Mensaje
            </Badge>

            <div class="flex-1 min-w-0">
              <Textarea
                v-if="editingId === getHeader(items)!.id"
                v-model="editingText"
                class="text-sm"
                :rows="3"
                @blur="finishEdit(getHeader(items)!)"
                @keydown.escape="cancelEdit"
                autofocus
              />
              <span
                v-else
                class="text-sm italic text-muted-foreground cursor-pointer hover:text-primary transition-colors whitespace-pre-line block"
                @click.stop="startEdit(getHeader(items)!)"
              >
                {{ getHeader(items)!.display_text }}
              </span>
            </div>

            <Switch
              :checked="getHeader(items)!.is_enabled"
              class="shrink-0 mt-1"
              @update:checked="() => toggleEnabled(getHeader(items)!)"
            />
          </div>
        </div>

        <!-- No header yet — offer to create one -->
        <div v-else class="px-4 pb-2">
          <button
            class="flex items-center gap-2 w-full py-2 px-3 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm"
            @click="handleCreateHeader(key)"
          >
            <i class="pi pi-plus text-xs" />
            Agregar mensaje principal
          </button>
        </div>

        <CollapsibleContent>
          <div class="px-4 pb-3 space-y-1">
            <template v-for="item in items" :key="item.id">
              <!-- Regular options (skip header, already shown above) -->
              <div
                v-if="item.option_number !== 0"
                class="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/20 transition-colors"
              >
                <!-- Option number -->
                <span class="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                  {{ item.option_number }}
                </span>

                <!-- Action icon -->
                <i :class="['pi text-xs text-muted-foreground shrink-0', getActionIcon(item)]" />

                <!-- Display text -->
                <div class="flex-1 min-w-0">
                  <Input
                    v-if="editingId === item.id"
                    v-model="editingText"
                    class="h-7 text-sm"
                    @blur="finishEdit(item)"
                    @keydown.enter="finishEdit(item)"
                    @keydown.escape="cancelEdit"
                    autofocus
                  />
                  <span
                    v-else
                    class="text-sm cursor-pointer hover:text-primary transition-colors"
                    @click.stop="startEdit(item)"
                  >
                    {{ item.display_text }}
                  </span>
                </div>

                <!-- Target type selector -->
                <Select
                  :model-value="getTargetType(item)"
                  @update:model-value="(v: string) => changeTargetType(item, v)"
                >
                  <SelectTrigger class="h-7 w-[110px] text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submenu">Submenu</SelectItem>
                    <SelectItem value="form">Formulario</SelectItem>
                    <SelectItem value="action">Accion</SelectItem>
                    <SelectItem value="none">Sin destino</SelectItem>
                  </SelectContent>
                </Select>

                <!-- Target value selector -->
                <Select
                  v-if="getTargetType(item) === 'submenu'"
                  :model-value="item.target_menu_key ?? undefined"
                  @update:model-value="(v: string) => changeTargetMenu(item, v)"
                >
                  <SelectTrigger class="h-7 w-[130px] text-xs shrink-0">
                    <SelectValue :placeholder="getTargetDisplay(item) || 'Elegir...'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="mk in allMenuKeys"
                      :key="mk"
                      :value="mk"
                    >
                      {{ formatMenuKey(mk) }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  v-else-if="getTargetType(item) === 'form'"
                  :model-value="item.target_action?.replace('form_', '') ?? undefined"
                  @update:model-value="(v: string) => changeFormType(item, v)"
                >
                  <SelectTrigger class="h-7 w-[130px] text-xs shrink-0">
                    <SelectValue :placeholder="getTargetDisplay(item) || 'Elegir...'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="ft in allFormTypes"
                      :key="ft"
                      :value="ft"
                    >
                      {{ ft }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  v-else-if="getTargetType(item) === 'action'"
                  :model-value="item.target_action ?? undefined"
                  @update:model-value="(v: string) => changeActionType(item, v)"
                >
                  <SelectTrigger class="h-7 w-[130px] text-xs shrink-0">
                    <SelectValue :placeholder="getTargetDisplay(item) || 'Elegir...'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="at in allActionTypes"
                      :key="at"
                      :value="at"
                    >
                      {{ at }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <span v-else class="w-[130px] shrink-0" />

                <!-- Enabled toggle -->
                <Switch
                  :checked="item.is_enabled"
                  class="shrink-0"
                  @update:checked="() => toggleEnabled(item)"
                />
              </div>
            </template>

            <!-- Add option inline -->
            <div
              v-if="addingOptionTo === key"
              class="flex items-center gap-3 py-2 px-3"
            >
              <span class="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">+</span>
              <i class="pi pi-circle text-xs text-muted-foreground shrink-0" />
              <Input
                v-model="newOptionText"
                data-new-option-input
                class="h-7 text-sm flex-1"
                placeholder="Texto de la opcion..."
                @keydown.enter="confirmAddOption(key, items)"
                @keydown.escape="cancelAddOption"
                autofocus
              />
              <Button
                variant="ghost"
                size="sm"
                class="h-7 text-xs"
                @click="confirmAddOption(key, items)"
              >
                Agregar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 text-xs"
                @click="cancelAddOption"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Empty state -->
    <div
      v-if="filteredMenuEntries.length === 0 && !searchQuery"
      class="flex flex-col items-center justify-center text-muted-foreground py-12"
    >
      <i class="pi pi-list text-4xl mb-3" />
      <p class="mb-4">No hay menus configurados</p>
      <Button variant="outline" @click="seedDefaults(props.organizationId)">
        <i class="pi pi-download mr-2" />
        Cargar datos por defecto
      </Button>
    </div>

    <div
      v-if="filteredMenuEntries.length === 0 && searchQuery"
      class="flex flex-col items-center justify-center text-muted-foreground py-12"
    >
      <i class="pi pi-search text-4xl mb-3" />
      <p>No se encontraron menus para "{{ searchQuery }}"</p>
    </div>

    <!-- New Menu Dialog -->
    <Dialog v-model:open="showNewMenuDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Menu</DialogTitle>
          <DialogDescription class="sr-only">Crear un nuevo grupo de menu</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Clave del menu (snake_case)</label>
            <Input
              v-model="newMenuKey"
              placeholder="ej: empresarial, casamientos..."
              @keydown.enter="handleCreateMenu"
            />
            <p class="text-xs text-muted-foreground">
              Se usara como identificador interno. Ej: main_menu, quince_anios
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showNewMenuDialog = false">Cancelar</Button>
          <Button :disabled="!newMenuKey.trim()" @click="handleCreateMenu">Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
