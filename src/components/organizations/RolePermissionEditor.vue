<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Role, MenuItemGroup } from '@/types/roles.types'
import { rolesApi } from '@/api/roles.api'
import { useMenuStore } from '@/stores/menu.store'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  open: boolean
  orgId: string
  role: Role
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

const menuStore = useMenuStore()
const selectedIds = ref<Set<string>>(new Set())
const isSaving = ref(false)

const isOwner = ref(false)

async function loadData() {
  // Load all menu items if not loaded yet
  if (!menuStore.allMenuItems.length) {
    await menuStore.fetchAllMenuItems()
  }

  isOwner.value = props.role.slug === 'owner'

  if (isOwner.value) {
    // Owner has all — show everything checked, not editable
    const allIds = new Set<string>()
    for (const group of menuStore.allMenuItems) {
      allIds.add(group.id)
      if (group.items) {
        for (const child of group.items) {
          allIds.add(child.id)
        }
      }
    }
    selectedIds.value = allIds
    return
  }

  // Load current permissions
  try {
    const perms = await rolesApi.getPermissions(props.orgId, props.role.id)
    selectedIds.value = new Set(perms.menu_item_ids)
  } catch {
    selectedIds.value = new Set()
  }
}

function toggleItem(id: string) {
  if (isOwner.value) return
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

function toggleGroup(group: MenuItemGroup) {
  if (isOwner.value) return
  const childIds = group.items?.map((c) => c.id) || []
  const allSelected = childIds.every((id) => selectedIds.value.has(id))
  const newSet = new Set(selectedIds.value)

  if (allSelected) {
    // Deselect group + children
    newSet.delete(group.id)
    childIds.forEach((id) => newSet.delete(id))
  } else {
    // Select group + all children
    newSet.add(group.id)
    childIds.forEach((id) => newSet.add(id))
  }
  selectedIds.value = newSet
}

function isGroupChecked(group: MenuItemGroup): boolean {
  const childIds = group.items?.map((c) => c.id) || []
  return childIds.length > 0 && childIds.every((id) => selectedIds.value.has(id))
}

// No indeterminate needed — just fully checked or not

async function handleSave() {
  isSaving.value = true
  try {
    await rolesApi.setPermissions(
      props.orgId,
      props.role.id,
      Array.from(selectedIds.value)
    )
    emit('saved')
    emit('close')
  } catch (e) {
    console.error('Failed to save permissions:', e)
  } finally {
    isSaving.value = false
  }
}

watch(() => props.open, (open) => {
  if (open) loadData()
})
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Permisos: {{ role.name }}</DialogTitle>
        <DialogDescription>
          Selecciona las paginas visibles para este rol
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="isOwner" class="mb-4">
        <AlertDescription>
          El rol Propietario tiene acceso total a todas las paginas.
        </AlertDescription>
      </Alert>

      <div class="space-y-4 py-2">
        <div v-for="group in menuStore.allMenuItems" :key="group.id">
          <template v-if="group.is_group">
            <div class="flex items-center gap-2 mb-2">
              <Checkbox
                :id="`group-${group.id}`"
                :checked="isGroupChecked(group)"
                :disabled="isOwner"
                @update:checked="toggleGroup(group)"
              />
              <Label :for="`group-${group.id}`" class="font-semibold text-sm cursor-pointer">
                <i v-if="group.icon" :class="[group.icon, 'mr-1']" />
                {{ group.label }}
              </Label>
            </div>

            <div class="ml-6 space-y-1.5">
              <div v-for="child in group.items" :key="child.id" class="flex items-center gap-2">
                <Checkbox
                  :id="`item-${child.id}`"
                  :checked="selectedIds.has(child.id)"
                  :disabled="isOwner"
                  @update:checked="toggleItem(child.id)"
                />
                <Label :for="`item-${child.id}`" class="text-sm cursor-pointer">
                  <i v-if="child.icon" :class="[child.icon, 'mr-1 text-muted-foreground']" />
                  {{ child.label }}
                </Label>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center gap-2">
              <Checkbox
                :id="`item-${group.id}`"
                :checked="selectedIds.has(group.id)"
                :disabled="isOwner"
                @update:checked="toggleItem(group.id)"
              />
              <Label :for="`item-${group.id}`" class="text-sm cursor-pointer">
                <i v-if="group.icon" :class="[group.icon, 'mr-1']" />
                {{ group.label }}
              </Label>
            </div>
          </template>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('close')">Cancelar</Button>
        <Button v-if="!isOwner" @click="handleSave" :disabled="isSaving">
          <i v-if="isSaving" class="pi pi-spin pi-spinner mr-2" />
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
