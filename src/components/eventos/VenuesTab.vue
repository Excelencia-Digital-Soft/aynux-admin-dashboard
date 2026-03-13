<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEventosStore } from '@/stores/eventos.store'
import { useEventosConfig } from '@/composables/useEventosConfig'
import { getCategoryLabel } from '@/types/eventosConfig.types'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog'

const props = defineProps<{ organizationId: string }>()

const store = useEventosStore()
const {
  venues, createVenue, updateVenue, deleteVenue, toggleVenueActive,
  openVenueDialog, closeVenueDialog, openDeleteVenueDialog, closeDeleteVenueDialog,
  setVenuesCategoryFilter, seedDefaults
} = useEventosConfig()

const categoryFilter = ref<string>('all')
watch(categoryFilter, (v) => setVenuesCategoryFilter(v === 'all' ? null : v))

const categoryOptions = ['hotel', 'quinta', 'salon', 'otro']

// Form
const form = ref({
  name: '',
  category: 'salon',
  capacity: null as number | null,
  address: '',
  description: ''
})

const isEditing = computed(() => store.editingVenue !== null)
const canSave = computed(() => form.value.name.trim().length >= 2)

watch(() => store.showVenueDialog, (open) => {
  if (open && store.editingVenue) {
    const v = store.editingVenue
    form.value = {
      name: v.name,
      category: v.category,
      capacity: v.capacity,
      address: v.address || '',
      description: v.description || ''
    }
  } else if (open) {
    form.value = { name: '', category: 'salon', capacity: null, address: '', description: '' }
  }
})

async function handleSave() {
  if (isEditing.value && store.editingVenue) {
    await updateVenue(store.editingVenue.id, {
      name: form.value.name,
      category: form.value.category,
      capacity: form.value.capacity,
      address: form.value.address || null,
      description: form.value.description || null
    })
  } else {
    await createVenue({
      organization_id: props.organizationId,
      name: form.value.name,
      category: form.value.category,
      capacity: form.value.capacity,
      address: form.value.address || null,
      description: form.value.description || null
    })
  }
}

async function confirmDelete() {
  if (store.deletingVenue) {
    await deleteVenue(store.deletingVenue.id)
  }
}
</script>

<template>
  <Card class="glass-card">
    <CardContent class="p-4">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <Select v-model="categoryFilter">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem v-for="c in categoryOptions" :key="c" :value="c">{{ getCategoryLabel(c) }}</SelectItem>
          </SelectContent>
        </Select>
        <Button @click="openVenueDialog(null)">
          <i class="pi pi-plus mr-2" />
          Nuevo Salon
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Direccion</TableHead>
            <TableHead class="w-[80px]">Activo</TableHead>
            <TableHead class="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="venue in venues" :key="venue.id">
            <TableCell class="font-medium">{{ venue.name }}</TableCell>
            <TableCell>
              <Badge variant="outline">{{ getCategoryLabel(venue.category) }}</Badge>
            </TableCell>
            <TableCell>{{ venue.capacity || '-' }}</TableCell>
            <TableCell class="text-muted-foreground text-sm">{{ venue.address || '-' }}</TableCell>
            <TableCell>
              <Switch
                :checked="venue.is_active"
                @update:checked="(v: boolean) => toggleVenueActive(venue.id, v)"
              />
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" @click="openVenueDialog(venue)">
                  <i class="pi pi-pencil" />
                </Button>
                <Button variant="ghost" size="icon" @click="openDeleteVenueDialog(venue)">
                  <i class="pi pi-trash text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="venues.length === 0">
            <TableCell colspan="6" class="text-center text-muted-foreground py-12">
              <div class="flex flex-col items-center">
                <i class="pi pi-building text-4xl mb-3" />
                <p class="mb-4">No hay salones configurados</p>
                <Button variant="outline" @click="seedDefaults(props.organizationId)">
                  <i class="pi pi-download mr-2" />
                  Cargar datos por defecto
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <!-- Venue Form Dialog -->
  <Dialog v-model:open="store.showVenueDialog">
    <DialogContent class="glass-dialog max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Editar Salon' : 'Nuevo Salon' }}</DialogTitle>
        <DialogDescription class="sr-only">Formulario de salon</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div>
          <label class="text-sm font-medium mb-1 block">Nombre *</label>
          <Input v-model="form.name" placeholder="Ej: Hotel Del Bono" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Categoria *</label>
          <Select v-model="form.category">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in categoryOptions" :key="c" :value="c">{{ getCategoryLabel(c) }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Capacidad</label>
          <Input :model-value="form.capacity ?? undefined" type="number" placeholder="Ej: 200" @update:model-value="(v: string | number) => form.capacity = v === '' ? null : Number(v)" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Direccion</label>
          <Input v-model="form.address" placeholder="Ej: Av. San Martin 456" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Descripcion</label>
          <Textarea v-model="form.description" rows="3" placeholder="Descripcion del salon..." />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeVenueDialog">Cancelar</Button>
        <Button :disabled="!canSave" @click="handleSave">
          {{ isEditing ? 'Guardar' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation -->
  <AlertDialog v-model:open="store.showDeleteVenueDialog">
    <AlertDialogContent class="glass-dialog">
      <AlertDialogHeader>
        <AlertDialogTitle>Eliminar Salon</AlertDialogTitle>
        <AlertDialogDescription>
          Esta seguro de eliminar "{{ store.deletingVenue?.name }}"? Esta accion no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="closeDeleteVenueDialog">Cancelar</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="confirmDelete"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
