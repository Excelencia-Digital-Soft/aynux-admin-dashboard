<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import { getRoleLabel, getRoleSeverity } from '@/types/organization.types'
import type { OrganizationUser, UserRole, UserCreateRequest, UserUpdateRequest } from '@/types/organization.types'
import type { Role } from '@/types/roles.types'
import { rolesApi } from '@/api/roles.api'
import { organizationApi } from '@/api/organization.api'

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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface Props {
  organizationId: string
}

const props = defineProps<Props>()

const store = useOrganizationStore()
const {
  users,
  totalUsers,
  invites,
  isLoading,
  fetchUsers,
  fetchInvites,
  createUser,
  updateUser,
  deleteUser,
  sendInvite,
  cancelInvite,
  setUserFilters
} = useOrganization()

const activeTab = ref('users')
const showUserDialog = ref(false)
const showInviteDialog = ref(false)
const editingUser = ref<OrganizationUser | null>(null)
const confirmDeleteId = ref<string | null>(null)
const roleFilterValue = ref('all')

// Roles from API
const roles = ref<Role[]>([])
const tempPassword = ref<string | null>(null)
const showTempPasswordDialog = ref(false)

async function loadRoles() {
  try {
    const data = await rolesApi.list(props.organizationId)
    roles.value = data.roles
  } catch (e) {
    console.error('Failed to load roles:', e)
  }
}

// Role options for dropdowns (exclude owner for creation)
const roleOptions = computed(() =>
  roles.value
    .filter((r) => r.slug !== 'owner')
    .map((r) => ({ label: r.name, value: r.id }))
)

// All role options (including owner, for filter/display)
const allRoleOptions = computed(() =>
  roles.value.map((r) => ({ label: r.name, value: r.slug }))
)

// User form
const userForm = ref({
  email: '',
  full_name: '',
  role_id: '',
  password: ''
})

// Invite form
const inviteForm = ref({
  email: '',
  role: 'member' as UserRole
})

const isEditing = computed(() => editingUser.value !== null)

function getRoleBadgeVariant(role: UserRole): 'destructive' | 'warning' | 'info' | 'secondary' {
  const severity = getRoleSeverity(role)
  const map: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = {
    danger: 'destructive',
    warn: 'warning',
    info: 'info',
    secondary: 'secondary'
  }
  return map[severity] || 'secondary'
}

function getStatusVariant(status: string): 'success' | 'destructive' | 'warning' | 'secondary' {
  const map: Record<string, 'success' | 'destructive' | 'warning' | 'secondary'> = {
    active: 'success',
    inactive: 'destructive',
    pending: 'warning'
  }
  return map[status] || 'secondary'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Nunca'
  return new Date(dateStr).toLocaleDateString('es-ES')
}

function openUserDialog(user: OrganizationUser | null = null) {
  editingUser.value = user
  if (user) {
    // Find role_id from user's role slug
    const matchedRole = roles.value.find((r) => r.slug === user.role)
    userForm.value = {
      email: user.email,
      full_name: user.full_name,
      role_id: matchedRole?.id || '',
      password: ''
    }
  } else {
    // Default to the is_default role (member)
    const defaultRole = roles.value.find((r) => r.is_default) || roles.value.find((r) => r.slug === 'member')
    userForm.value = {
      email: '',
      full_name: '',
      role_id: defaultRole?.id || '',
      password: ''
    }
  }
  showUserDialog.value = true
}

function closeUserDialog() {
  showUserDialog.value = false
  editingUser.value = null
}

async function handleSaveUser() {
  if (isEditing.value && editingUser.value) {
    const selectedRole = roles.value.find((r) => r.id === userForm.value.role_id)
    const updateData: UserUpdateRequest = {
      full_name: userForm.value.full_name,
      role: selectedRole?.slug
    }
    await updateUser(editingUser.value.id, updateData, props.organizationId)
  } else {
    const createData: UserCreateRequest = {
      email: userForm.value.email,
      full_name: userForm.value.full_name,
      role_id: userForm.value.role_id,
      password: userForm.value.password || undefined
    }
    try {
      const response = await organizationApi.createUser(props.organizationId, createData)
      // Check if temp_password was returned
      const resp = response as unknown as { temp_password?: string }
      if (resp.temp_password) {
        tempPassword.value = resp.temp_password
        showTempPasswordDialog.value = true
      }
      await fetchUsers(props.organizationId)
    } catch (e) {
      console.error('Failed to create user:', e)
    }
  }
  closeUserDialog()
}

async function handleDeleteUser(userId: string) {
  if (confirmDeleteId.value === userId) {
    await deleteUser(userId, props.organizationId)
    confirmDeleteId.value = null
  } else {
    confirmDeleteId.value = userId
    setTimeout(() => {
      if (confirmDeleteId.value === userId) {
        confirmDeleteId.value = null
      }
    }, 3000)
  }
}

async function handleSendInvite() {
  await sendInvite(inviteForm.value.email, inviteForm.value.role, props.organizationId)
  showInviteDialog.value = false
  inviteForm.value = { email: '', role: 'member' }
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setUserFilters({ search: value || undefined })
  fetchUsers(props.organizationId)
}

function handleRoleFilter(val: string) {
  roleFilterValue.value = val
  setUserFilters({ role: val === 'all' ? undefined : val })
  fetchUsers(props.organizationId)
}

function onPageChange(page: number) {
  store.setUserPage(page)
  fetchUsers(props.organizationId)
}

watch(() => props.organizationId, () => {
  Promise.all([
    fetchUsers(props.organizationId),
    fetchInvites(props.organizationId),
    loadRoles()
  ])
}, { immediate: true })
</script>

<template>
  <div class="user-management p-4">
    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="users">
          <div class="flex items-center gap-2">
            <i class="pi pi-users text-sm" />
            <span>Usuarios ({{ totalUsers }})</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="invites">
          <div class="flex items-center gap-2">
            <i class="pi pi-envelope text-sm" />
            <span>Invitaciones ({{ invites.length }})</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <!-- Users Tab -->
      <TabsContent value="users">
        <!-- Toolbar -->
        <div class="flex justify-between items-center mb-4 mt-4">
          <div class="flex gap-2">
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <Input
                placeholder="Buscar usuarios..."
                class="w-64 pl-9"
                @input="handleSearch"
              />
            </div>
            <Select :model-value="roleFilterValue" @update:model-value="handleRoleFilter">
              <SelectTrigger class="w-40">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem v-for="opt in allRoleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button @click="openUserDialog(null)">
            <i class="pi pi-plus mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        <!-- Empty state -->
        <div
          v-if="!isLoading && users.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          <i class="pi pi-users text-4xl mb-2" />
          <p>No hay usuarios</p>
        </div>

        <!-- Users table -->
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="min-w-[200px]">Usuario</TableHead>
              <TableHead class="w-[120px]">Rol</TableHead>
              <TableHead class="w-[100px]">Estado</TableHead>
              <TableHead class="w-[120px]">Ultimo acceso</TableHead>
              <TableHead class="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="user in users" :key="user.id">
              <TableCell>
                <div>
                  <div class="font-medium text-foreground">{{ user.full_name }}</div>
                  <div class="text-xs text-muted-foreground">{{ user.email }}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getRoleBadgeVariant(user.role)">
                  {{ getRoleLabel(user.role) }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(user.status)">
                  {{ user.status }}
                </Badge>
              </TableCell>
              <TableCell>
                <span class="text-sm text-muted-foreground">{{ formatDate(user.last_login) }}</span>
              </TableCell>
              <TableCell>
                <div class="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8" @click="openUserDialog(user)">
                          <i class="pi pi-pencil text-sm" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Editar</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <template v-if="confirmDeleteId !== user.id">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="handleDeleteUser(user.id)">
                            <i class="pi pi-trash text-sm" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Eliminar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </template>
                  <template v-else>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="handleDeleteUser(user.id)">
                            <i class="pi pi-check text-sm" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Confirmar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button variant="ghost" size="icon" class="h-8 w-8" @click="confirmDeleteId = null">
                            <i class="pi pi-times text-sm" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Cancelar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </template>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Pagination
          v-if="totalUsers > store.userPageSize"
          :total-records="totalUsers"
          :rows="store.userPageSize"
          :current-page="store.userPage"
          @page-change="onPageChange"
          class="mt-4"
        />
      </TabsContent>

      <!-- Invitations Tab -->
      <TabsContent value="invites">
        <div class="flex justify-end mb-4 mt-4">
          <Button @click="showInviteDialog = true">
            <i class="pi pi-send mr-2" />
            Enviar Invitacion
          </Button>
        </div>

        <!-- Empty state -->
        <div
          v-if="!isLoading && invites.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          <i class="pi pi-envelope text-4xl mb-2" />
          <p>No hay invitaciones pendientes</p>
        </div>

        <!-- Invites table -->
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="min-w-[200px]">Email</TableHead>
              <TableHead class="w-[120px]">Rol</TableHead>
              <TableHead class="w-[100px]">Estado</TableHead>
              <TableHead class="w-[120px]">Expira</TableHead>
              <TableHead class="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="invite in invites" :key="invite.id">
              <TableCell>
                <span class="text-foreground">{{ invite.email }}</span>
              </TableCell>
              <TableCell>
                <Badge :variant="getRoleBadgeVariant(invite.role)">
                  {{ getRoleLabel(invite.role) }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="invite.status === 'pending' ? 'warning' : 'secondary'">
                  {{ invite.status }}
                </Badge>
              </TableCell>
              <TableCell>
                <span class="text-sm text-muted-foreground">{{ formatDate(invite.expires_at) }}</span>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="cancelInvite(invite.id, organizationId)">
                        <i class="pi pi-times text-sm" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Cancelar</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>

    <!-- User Dialog -->
    <Dialog v-model:open="showUserDialog">
      <DialogContent class="sm:max-w-[400px] glass-dialog">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ isEditing ? 'Editar datos del usuario' : 'Crear un nuevo usuario' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-foreground mb-1">Email *</label>
            <Input v-model="userForm.email" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Nombre completo *</label>
            <Input v-model="userForm.full_name" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Rol</label>
            <Select v-model="userForm.role_id">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-foreground mb-1">Password</label>
            <Input v-model="userForm.password" type="password" />
            <p class="text-xs text-muted-foreground mt-1">Dejar vacio para generar automaticamente</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeUserDialog">Cancelar</Button>
          <Button @click="handleSaveUser" :disabled="isLoading">
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
            {{ isEditing ? 'Guardar' : 'Crear' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Invite Dialog -->
    <Dialog v-model:open="showInviteDialog">
      <DialogContent class="sm:max-w-[400px] glass-dialog">
        <DialogHeader>
          <DialogTitle>Enviar Invitacion</DialogTitle>
          <DialogDescription class="sr-only">
            Enviar una invitacion para unirse a la organizacion
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <Alert variant="info">
            <AlertDescription>
              Se enviara un email con un enlace para unirse a la organizacion.
            </AlertDescription>
          </Alert>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Email *</label>
            <Input v-model="inviteForm.email" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Rol</label>
            <Select v-model="inviteForm.role">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in allRoleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showInviteDialog = false">Cancelar</Button>
          <Button @click="handleSendInvite" :disabled="!inviteForm.email || isLoading">
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2" />
            <i v-else class="pi pi-send mr-2" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Temp Password Dialog -->
    <Dialog v-model:open="showTempPasswordDialog">
      <DialogContent class="sm:max-w-[400px] glass-dialog">
        <DialogHeader>
          <DialogTitle>Usuario Creado</DialogTitle>
          <DialogDescription>
            El usuario fue creado exitosamente. Guarda la password temporal.
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <Alert>
            <AlertDescription>
              <div class="space-y-2">
                <p class="text-sm font-medium">Password temporal:</p>
                <code class="block p-3 bg-muted rounded-md text-lg font-mono select-all">
                  {{ tempPassword }}
                </code>
                <p class="text-xs text-muted-foreground">
                  Esta password solo se muestra una vez. El usuario debe cambiarla en su primer inicio de sesion.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button @click="showTempPasswordDialog = false">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
