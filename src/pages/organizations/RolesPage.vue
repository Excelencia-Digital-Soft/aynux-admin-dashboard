<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Role } from '@/types/roles.types'
import { rolesApi } from '@/api/roles.api'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import RolePermissionEditor from '@/components/organizations/RolePermissionEditor.vue'

const route = useRoute()
const orgId = ref(route.params.orgId as string)

const roles = ref<Role[]>([])
const isLoading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showPermissionDialog = ref(false)
const selectedRole = ref<Role | null>(null)
const confirmDeleteId = ref<string | null>(null)
const errorMessage = ref('')

const form = ref({
  name: '',
  slug: '',
  description: '',
  sort_order: 0
})

async function loadRoles() {
  isLoading.value = true
  try {
    const data = await rolesApi.list(orgId.value)
    roles.value = data.roles
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  form.value = { name: '', slug: '', description: '', sort_order: roles.value.length }
  errorMessage.value = ''
  showCreateDialog.value = true
}

function openEdit(role: Role) {
  selectedRole.value = role
  form.value = {
    name: role.name,
    slug: role.slug,
    description: role.description || '',
    sort_order: role.sort_order
  }
  errorMessage.value = ''
  showEditDialog.value = true
}

function openPermissions(role: Role) {
  selectedRole.value = role
  showPermissionDialog.value = true
}

function autoSlug() {
  if (!showEditDialog.value) {
    form.value.slug = form.value.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
  }
}

async function handleCreate() {
  errorMessage.value = ''
  try {
    await rolesApi.create(orgId.value, {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description || undefined,
      sort_order: form.value.sort_order
    })
    showCreateDialog.value = false
    await loadRoles()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    errorMessage.value = err.response?.data?.detail || 'Error al crear rol'
  }
}

async function handleUpdate() {
  if (!selectedRole.value) return
  errorMessage.value = ''
  try {
    await rolesApi.update(orgId.value, selectedRole.value.id, {
      name: selectedRole.value.is_system ? undefined : form.value.name,
      description: form.value.description || undefined,
      sort_order: form.value.sort_order
    })
    showEditDialog.value = false
    await loadRoles()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    errorMessage.value = err.response?.data?.detail || 'Error al actualizar rol'
  }
}

async function handleDelete(roleId: string) {
  if (confirmDeleteId.value === roleId) {
    try {
      await rolesApi.delete(orgId.value, roleId)
      confirmDeleteId.value = null
      await loadRoles()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      errorMessage.value = err.response?.data?.detail || 'Error al eliminar rol'
      confirmDeleteId.value = null
    }
  } else {
    confirmDeleteId.value = roleId
    setTimeout(() => {
      if (confirmDeleteId.value === roleId) confirmDeleteId.value = null
    }, 3000)
  }
}

watch(() => route.params.orgId, (v) => {
  orgId.value = v as string
  loadRoles()
}, { immediate: true })
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-lg font-semibold text-foreground">Roles</h2>
        <p class="text-sm text-muted-foreground">Gestiona los roles y permisos de la organizacion</p>
      </div>
      <Button @click="openCreate">
        <i class="pi pi-plus mr-2" />
        Nuevo Rol
      </Button>
    </div>

    <p v-if="errorMessage" class="text-sm text-destructive mb-4">{{ errorMessage }}</p>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="min-w-[150px]">Nombre</TableHead>
          <TableHead class="w-[120px]">Slug</TableHead>
          <TableHead class="w-[200px]">Descripcion</TableHead>
          <TableHead class="w-[100px]">Tipo</TableHead>
          <TableHead class="w-[80px]">Usuarios</TableHead>
          <TableHead class="w-[160px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="role in roles" :key="role.id">
          <TableCell class="font-medium">{{ role.name }}</TableCell>
          <TableCell><code class="text-xs">{{ role.slug }}</code></TableCell>
          <TableCell class="text-sm text-muted-foreground">{{ role.description || '-' }}</TableCell>
          <TableCell>
            <Badge v-if="role.is_system" variant="secondary">Sistema</Badge>
            <Badge v-else-if="role.is_default" variant="info">Default</Badge>
            <Badge v-else variant="outline">Custom</Badge>
          </TableCell>
          <TableCell>{{ role.user_count || 0 }}</TableCell>
          <TableCell>
            <div class="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click="openPermissions(role)">
                      <i class="pi pi-lock text-sm" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Permisos</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEdit(role)">
                      <i class="pi pi-pencil text-sm" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Editar</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <template v-if="!role.is_system">
                <template v-if="confirmDeleteId !== role.id">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive" @click="handleDelete(role.id)">
                          <i class="pi pi-trash text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Eliminar</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </template>
                <template v-else>
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive" @click="handleDelete(role.id)">
                    <i class="pi pi-check text-sm" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="confirmDeleteId = null">
                    <i class="pi pi-times text-sm" />
                  </Button>
                </template>
              </template>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- Create Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nuevo Rol</DialogTitle>
          <DialogDescription class="sr-only">Crear un nuevo rol personalizado</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre *</label>
            <Input v-model="form.name" @input="autoSlug" placeholder="Ej: Supervisor" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Slug *</label>
            <Input v-model="form.slug" placeholder="Ej: supervisor" />
            <p class="text-xs text-muted-foreground mt-1">Solo letras minusculas, numeros, guiones</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Descripcion</label>
            <Input v-model="form.description" placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">Cancelar</Button>
          <Button @click="handleCreate" :disabled="!form.name || !form.slug">Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar Rol</DialogTitle>
          <DialogDescription class="sr-only">Editar datos del rol</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <Input v-model="form.name" :disabled="selectedRole?.is_system" />
            <p v-if="selectedRole?.is_system" class="text-xs text-muted-foreground mt-1">
              Los roles de sistema no pueden renombrarse
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Descripcion</label>
            <Input v-model="form.description" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Orden</label>
            <Input v-model.number="form.sort_order" type="number" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false">Cancelar</Button>
          <Button @click="handleUpdate">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Permission Editor -->
    <RolePermissionEditor
      v-if="selectedRole"
      :open="showPermissionDialog"
      :org-id="orgId"
      :role="selectedRole"
      @close="showPermissionDialog = false"
      @saved="loadRoles"
    />
  </div>
</template>
