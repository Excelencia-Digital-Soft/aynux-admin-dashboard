<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useOrganizationStore } from '@/stores/organization.store'
import { useOrganization } from '@/composables/useOrganization'
import { getRoleLabel, getRoleSeverity } from '@/types/organization.types'
import type { OrganizationUser, UserRole, UserCreateRequest, UserUpdateRequest } from '@/types/organization.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Paginator from 'primevue/paginator'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'

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

const activeTab = ref('0')
const showUserDialog = ref(false)
const showInviteDialog = ref(false)
const editingUser = ref<OrganizationUser | null>(null)
const confirmDelete = ref<string | null>(null)

// User form
const userForm = ref({
  email: '',
  full_name: '',
  role: 'viewer' as UserRole,
  password: ''
})

// Invite form
const inviteForm = ref({
  email: '',
  role: 'viewer' as UserRole
})

const roleOptions = [
  { label: 'Propietario', value: 'owner' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Visor', value: 'viewer' }
]

const statusOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Pendiente', value: 'pending' }
]

const isEditing = computed(() => editingUser.value !== null)

function getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' {
  const map: Record<string, 'success' | 'danger' | 'warn' | 'secondary'> = {
    active: 'success',
    inactive: 'danger',
    pending: 'warn'
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
    userForm.value = {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password: ''
    }
  } else {
    userForm.value = {
      email: '',
      full_name: '',
      role: 'viewer',
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
    const updateData: UserUpdateRequest = {
      full_name: userForm.value.full_name,
      role: userForm.value.role
    }
    await updateUser(editingUser.value.id, updateData, props.organizationId)
  } else {
    const createData: UserCreateRequest = {
      email: userForm.value.email,
      full_name: userForm.value.full_name,
      role: userForm.value.role,
      password: userForm.value.password || undefined
    }
    await createUser(createData, props.organizationId)
  }
  closeUserDialog()
}

async function handleDeleteUser(userId: string) {
  if (confirmDelete.value === userId) {
    await deleteUser(userId, props.organizationId)
    confirmDelete.value = null
  } else {
    confirmDelete.value = userId
    setTimeout(() => {
      if (confirmDelete.value === userId) {
        confirmDelete.value = null
      }
    }, 3000)
  }
}

async function handleSendInvite() {
  await sendInvite(inviteForm.value.email, inviteForm.value.role, props.organizationId)
  showInviteDialog.value = false
  inviteForm.value = { email: '', role: 'viewer' }
}

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  setUserFilters({ search: value || undefined })
  fetchUsers(props.organizationId)
}

function handleRoleFilter(role: string | undefined) {
  setUserFilters({ role })
  fetchUsers(props.organizationId)
}

function onPageChange(event: { page: number }) {
  store.setUserPage(event.page + 1)
  fetchUsers(props.organizationId)
}

watch(() => props.organizationId, () => {
  fetchUsers(props.organizationId)
  fetchInvites(props.organizationId)
}, { immediate: true })

onMounted(() => {
  fetchUsers(props.organizationId)
  fetchInvites(props.organizationId)
})
</script>

<template>
  <div class="user-management">
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="0">
          <div class="flex items-center gap-2">
            <i class="pi pi-users" />
            <span>Usuarios ({{ totalUsers }})</span>
          </div>
        </Tab>
        <Tab value="1">
          <div class="flex items-center gap-2">
            <i class="pi pi-envelope" />
            <span>Invitaciones ({{ invites.length }})</span>
          </div>
        </Tab>
      </TabList>
      <TabPanels>
        <!-- Users Tab -->
        <TabPanel value="0">
          <!-- Toolbar -->
          <div class="flex justify-between items-center mb-4">
            <div class="flex gap-2">
              <InputText
                placeholder="Buscar usuarios..."
                class="w-64"
                @input="handleSearch"
              />
              <Select
                :options="roleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Rol"
                class="w-40"
                @update:model-value="handleRoleFilter"
              />
            </div>
            <Button
              label="Nuevo Usuario"
              icon="pi pi-plus"
              @click="openUserDialog(null)"
            />
          </div>

          <!-- Users table -->
          <DataTable
            :value="users"
            :loading="isLoading"
            stripedRows
            class="p-datatable-sm"
          >
            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-users text-4xl mb-2" />
                <p>No hay usuarios</p>
              </div>
            </template>

            <Column field="full_name" header="Usuario" style="min-width: 200px">
              <template #body="{ data }">
                <div>
                  <div class="font-medium">{{ data.full_name }}</div>
                  <div class="text-xs text-gray-500">{{ data.email }}</div>
                </div>
              </template>
            </Column>

            <Column field="role" header="Rol" style="width: 120px">
              <template #body="{ data }">
                <Tag :severity="getRoleSeverity(data.role)" :value="getRoleLabel(data.role)" />
              </template>
            </Column>

            <Column field="status" header="Estado" style="width: 100px">
              <template #body="{ data }">
                <Tag :severity="getStatusSeverity(data.status)" :value="data.status" />
              </template>
            </Column>

            <Column field="last_login" header="Ultimo acceso" style="width: 120px">
              <template #body="{ data }">
                <span class="text-sm">{{ formatDate(data.last_login) }}</span>
              </template>
            </Column>

            <Column header="Acciones" style="width: 120px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    @click="openUserDialog(data)"
                  />
                  <Button
                    v-if="confirmDelete !== data.id"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    @click="handleDeleteUser(data.id)"
                  />
                  <template v-else>
                    <Button
                      icon="pi pi-check"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      @click="handleDeleteUser(data.id)"
                    />
                    <Button
                      icon="pi pi-times"
                      severity="secondary"
                      text
                      rounded
                      size="small"
                      @click="confirmDelete = null"
                    />
                  </template>
                </div>
              </template>
            </Column>
          </DataTable>

          <Paginator
            v-if="totalUsers > store.userPageSize"
            :first="(store.userPage - 1) * store.userPageSize"
            :rows="store.userPageSize"
            :totalRecords="totalUsers"
            @page="onPageChange"
            class="mt-4"
          />
        </TabPanel>

        <!-- Invitations Tab -->
        <TabPanel value="1">
          <div class="flex justify-end mb-4">
            <Button
              label="Enviar Invitacion"
              icon="pi pi-send"
              @click="showInviteDialog = true"
            />
          </div>

          <DataTable
            :value="invites"
            :loading="isLoading"
            stripedRows
            class="p-datatable-sm"
          >
            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-envelope text-4xl mb-2" />
                <p>No hay invitaciones pendientes</p>
              </div>
            </template>

            <Column field="email" header="Email" style="min-width: 200px" />

            <Column field="role" header="Rol" style="width: 120px">
              <template #body="{ data }">
                <Tag :severity="getRoleSeverity(data.role)" :value="getRoleLabel(data.role)" />
              </template>
            </Column>

            <Column field="status" header="Estado" style="width: 100px">
              <template #body="{ data }">
                <Tag
                  :severity="data.status === 'pending' ? 'warn' : 'secondary'"
                  :value="data.status"
                />
              </template>
            </Column>

            <Column field="expires_at" header="Expira" style="width: 120px">
              <template #body="{ data }">
                <span class="text-sm">{{ formatDate(data.expires_at) }}</span>
              </template>
            </Column>

            <Column header="" style="width: 60px">
              <template #body="{ data }">
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="cancelInvite(data.id, organizationId)"
                  v-tooltip="'Cancelar'"
                />
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- User Dialog -->
    <Dialog
      v-model:visible="showUserDialog"
      :header="isEditing ? 'Editar Usuario' : 'Nuevo Usuario'"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="space-y-4">
        <div v-if="!isEditing">
          <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <InputText v-model="userForm.email" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <InputText v-model="userForm.full_name" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <Select
            v-model="userForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div v-if="!isEditing">
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <InputText v-model="userForm.password" type="password" class="w-full" />
          <p class="text-xs text-gray-400 mt-1">Dejar vacio para generar automaticamente</p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="closeUserDialog" />
        <Button
          :label="isEditing ? 'Guardar' : 'Crear'"
          @click="handleSaveUser"
          :loading="isLoading"
        />
      </template>
    </Dialog>

    <!-- Invite Dialog -->
    <Dialog
      v-model:visible="showInviteDialog"
      header="Enviar Invitacion"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="space-y-4">
        <Message severity="info" :closable="false" class="text-sm">
          Se enviara un email con un enlace para unirse a la organizacion.
        </Message>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <InputText v-model="inviteForm.email" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <Select
            v-model="inviteForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showInviteDialog = false" />
        <Button
          label="Enviar"
          icon="pi pi-send"
          @click="handleSendInvite"
          :loading="isLoading"
          :disabled="!inviteForm.email"
        />
      </template>
    </Dialog>
  </div>
</template>
