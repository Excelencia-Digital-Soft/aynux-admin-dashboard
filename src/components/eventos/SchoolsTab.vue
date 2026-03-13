<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEventosStore } from '@/stores/eventos.store'
import { useEventosConfig } from '@/composables/useEventosConfig'
import { formatPrice } from '@/types/eventosConfig.types'
import type { EgresadosSchool, PriceEntry, PaymentInfo } from '@/types/eventosConfig.types'
import { generateSchoolPdf } from '@/utils/eventoPdfGenerator'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{ organizationId: string }>()

const store = useEventosStore()
const {
  schools, createSchool, updateSchool, deleteSchool, toggleSchoolActive,
  openSchoolDialog, closeSchoolDialog, openDeleteSchoolDialog, closeDeleteSchoolDialog,
  openPdfDialog, closePdfDialog, setSchoolYearFilter, seedDefaults
} = useEventosConfig()

// Year filter
const yearFilter = ref<string>('all')
watch(yearFilter, (v) => setSchoolYearFilter(v === 'all' ? null : Number(v)))

const currentYear = new Date().getFullYear()
const yearOptions = [`${currentYear}`, `${currentYear + 1}`]

// Empty factories
function emptyPrice(): PriceEntry {
  return { label: '', amount: null }
}

function emptyPaymentInfo(): PaymentInfo {
  return { cash_address: '', bank_name: '', cbu: '', alias: '', cuit: '', email: '' }
}

// Backward compat: convert old object format to PriceEntry[]
function normalizePrices(raw: unknown): PriceEntry[] {
  if (!raw) return [emptyPrice()]
  if (Array.isArray(raw)) return raw.length > 0 ? raw : [emptyPrice()]
  // Old format: { adult, minor, after_dinner }
  if (typeof raw === 'object' && raw !== null && 'adult' in raw) {
    const obj = raw as Record<string, number | null>
    const entries: PriceEntry[] = []
    if (obj.adult !== null && obj.adult !== undefined) entries.push({ label: 'Adulto', amount: obj.adult })
    if (obj.minor !== null && obj.minor !== undefined) entries.push({ label: 'Menor', amount: obj.minor })
    if (obj.after_dinner !== null && obj.after_dinner !== undefined) entries.push({ label: 'After Dinner', amount: obj.after_dinner })
    return entries.length > 0 ? entries : [emptyPrice()]
  }
  return [emptyPrice()]
}

// Backward compat: convert old single object to PaymentInfo[]
function normalizePaymentInfos(raw: unknown): PaymentInfo[] {
  if (!raw) return [emptyPaymentInfo()]
  if (Array.isArray(raw)) return raw.length > 0 ? raw : [emptyPaymentInfo()]
  // Old format: single object
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return [raw as PaymentInfo]
  }
  return [emptyPaymentInfo()]
}

// Form state
const form = ref({
  school_name: '',
  year: currentYear,
  event_date: '',
  venue_name: '',
  enrollment_link: '',
  sort_order: 0,
  prices: [emptyPrice()] as PriceEntry[],
  payment_infos: [emptyPaymentInfo()] as PaymentInfo[]
})

const isEditing = computed(() => store.editingSchool !== null)
const canSave = computed(() => form.value.school_name.trim().length >= 2 && form.value.year > 0)

watch(() => store.showSchoolDialog, (open) => {
  if (open && store.editingSchool) {
    const s = store.editingSchool
    form.value = {
      school_name: s.school_name,
      year: s.year,
      event_date: s.event_date || '',
      venue_name: s.venue_name || '',
      enrollment_link: s.enrollment_link || '',
      sort_order: s.sort_order,
      prices: normalizePrices(s.prices),
      payment_infos: normalizePaymentInfos(s.payment_info)
    }
  } else if (open) {
    form.value = {
      school_name: '', year: currentYear, event_date: '', venue_name: '',
      enrollment_link: '', sort_order: 0,
      prices: [emptyPrice()],
      payment_infos: [emptyPaymentInfo()]
    }
  }
})

// Price helpers
function addPrice() {
  form.value.prices.push(emptyPrice())
}

function removePrice(index: number) {
  form.value.prices.splice(index, 1)
}

// Payment info helpers
function addPaymentInfo() {
  form.value.payment_infos.push(emptyPaymentInfo())
}

function removePaymentInfo(index: number) {
  form.value.payment_infos.splice(index, 1)
}

function isPaymentInfoEmpty(pi: PaymentInfo): boolean {
  return !pi.cash_address && !pi.bank_name && !pi.cbu && !pi.alias && !pi.cuit && !pi.email
}

function buildPrices(): PriceEntry[] | null {
  const valid = form.value.prices.filter(p => p.label.trim() || p.amount !== null)
  return valid.length > 0 ? valid : null
}

function buildPaymentInfo(): PaymentInfo[] | null {
  const valid = form.value.payment_infos.filter(pi => !isPaymentInfoEmpty(pi))
  return valid.length > 0 ? valid : null
}

async function handleSave() {
  const prices = buildPrices()
  const payment_info = buildPaymentInfo()

  if (isEditing.value && store.editingSchool) {
    await updateSchool(store.editingSchool.id, {
      school_name: form.value.school_name,
      year: form.value.year,
      event_date: form.value.event_date || null,
      venue_name: form.value.venue_name || null,
      prices,
      payment_info,
      enrollment_link: form.value.enrollment_link || null,
      sort_order: form.value.sort_order
    })
  } else {
    await createSchool({
      organization_id: props.organizationId,
      school_name: form.value.school_name,
      year: form.value.year,
      event_date: form.value.event_date || null,
      venue_name: form.value.venue_name || null,
      prices,
      payment_info,
      enrollment_link: form.value.enrollment_link || null,
      sort_order: form.value.sort_order
    })
  }
}

async function confirmDelete() {
  if (store.deletingSchool) {
    await deleteSchool(store.deletingSchool.id)
  }
}

// PDF
const pdfExtraText = ref('')
watch(() => store.showPdfDialog, (open) => {
  if (open) pdfExtraText.value = ''
})

function handlePdfGenerate() {
  if (store.pdfSchool) {
    generateSchoolPdf(store.pdfSchool, pdfExtraText.value)
    closePdfDialog()
  }
}

function compactPrices(s: EgresadosSchool): string {
  if (!s.prices) return '-'
  // Handle both old and new format for display
  const raw = s.prices as unknown
  if (Array.isArray(raw)) {
    const parts = (raw as PriceEntry[])
      .filter(p => p.amount !== null)
      .map(p => `${p.label}: ${formatPrice(p.amount)}`)
    return parts.join(' | ') || '-'
  }
  // Old format fallback
  if (typeof raw === 'object' && raw !== null && 'adult' in raw) {
    const obj = raw as Record<string, number | null>
    const parts = []
    if (obj.adult !== null) parts.push(`A: ${formatPrice(obj.adult)}`)
    if (obj.minor !== null) parts.push(`M: ${formatPrice(obj.minor)}`)
    if (obj.after_dinner !== null) parts.push(`AD: ${formatPrice(obj.after_dinner)}`)
    return parts.join(' | ') || '-'
  }
  return '-'
}
</script>

<template>
  <Card class="glass-card">
    <CardContent class="p-4">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <Select v-model="yearFilter">
            <SelectTrigger class="w-[140px]">
              <SelectValue placeholder="Filtrar ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem v-for="y in yearOptions" :key="y" :value="y">{{ y }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button @click="openSchoolDialog(null)">
          <i class="pi pi-plus mr-2" />
          Nuevo Colegio
        </Button>
      </div>

      <!-- Table -->
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead class="w-[80px]">Ano</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Salon</TableHead>
            <TableHead>Precios</TableHead>
            <TableHead class="w-[80px]">Activo</TableHead>
            <TableHead class="w-[140px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="school in schools" :key="school.id">
            <TableCell class="font-medium">{{ school.school_name }}</TableCell>
            <TableCell>{{ school.year }}</TableCell>
            <TableCell>{{ school.event_date || '-' }}</TableCell>
            <TableCell>{{ school.venue_name || '-' }}</TableCell>
            <TableCell class="text-sm text-muted-foreground">{{ compactPrices(school) }}</TableCell>
            <TableCell>
              <Switch
                :checked="school.is_active"
                @update:checked="(v: boolean) => toggleSchoolActive(school.id, v)"
              />
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" @click="openPdfDialog(school)" title="Exportar PDF">
                  <i class="pi pi-file-pdf" />
                </Button>
                <Button variant="ghost" size="icon" @click="openSchoolDialog(school)" title="Editar">
                  <i class="pi pi-pencil" />
                </Button>
                <Button variant="ghost" size="icon" @click="openDeleteSchoolDialog(school)" title="Eliminar">
                  <i class="pi pi-trash text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="schools.length === 0">
            <TableCell colspan="7" class="text-center text-muted-foreground py-12">
              <div class="flex flex-col items-center">
                <i class="pi pi-graduation-cap text-4xl mb-3" />
                <p class="mb-4">No hay colegios configurados</p>
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

  <!-- School Form Dialog -->
  <Dialog v-model:open="store.showSchoolDialog">
    <DialogContent class="glass-dialog max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Editar Colegio' : 'Nuevo Colegio' }}</DialogTitle>
        <DialogDescription class="sr-only">Formulario de configuracion de colegio</DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- Info Basica -->
        <div>
          <h4 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Info Basica</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="text-sm font-medium mb-1 block">Nombre del Colegio *</label>
              <Input v-model="form.school_name" placeholder="Ej: Colegio Nacional" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Ano *</label>
              <Select :model-value="String(form.year)" @update:model-value="(v: string) => form.year = Number(v)">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="y in yearOptions" :key="y" :value="y">{{ y }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Fecha del Evento</label>
              <Input v-model="form.event_date" placeholder="Ej: 15/12/2026" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Salon</label>
              <Input v-model="form.venue_name" placeholder="Ej: Hotel Del Bono" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Orden</label>
              <Input v-model.number="form.sort_order" type="number" />
            </div>
          </div>
        </div>

        <hr class="border-border" />

        <!-- Precios (dynamic) -->
        <div>
          <h4 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Precios</h4>
          <div class="space-y-2">
            <div v-for="(price, idx) in form.prices" :key="idx" class="flex items-center gap-2">
              <Input
                v-model="price.label"
                placeholder="Ej: Adulto"
                class="flex-1"
              />
              <div class="relative w-[140px]">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  :model-value="price.amount ?? undefined"
                  type="number"
                  class="pl-7"
                  placeholder="0"
                  @update:model-value="(v: string | number) => price.amount = v === '' ? null : Number(v)"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="shrink-0 text-muted-foreground hover:text-destructive"
                :disabled="form.prices.length <= 1"
                @click="removePrice(idx)"
              >
                <i class="pi pi-trash text-sm" />
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" class="mt-3" @click="addPrice">
            <i class="pi pi-plus mr-2" />
            Agregar precio
          </Button>
        </div>

        <hr class="border-border" />

        <!-- Info de Pago (multiple blocks) -->
        <div>
          <h4 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Info de Pago</h4>
          <div class="space-y-4">
            <div v-for="(pi, idx) in form.payment_infos" :key="idx" class="border border-border rounded-lg p-4 relative">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-muted-foreground">Metodo de pago {{ idx + 1 }}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 text-muted-foreground hover:text-destructive"
                  :disabled="form.payment_infos.length <= 1"
                  @click="removePaymentInfo(idx)"
                >
                  <i class="pi pi-trash text-sm" />
                </Button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2">
                  <label class="text-sm font-medium mb-1 block">Direccion Efectivo</label>
                  <Input v-model="pi.cash_address" placeholder="Ej: Av. San Martin 123" />
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">Banco</label>
                  <Input v-model="pi.bank_name" placeholder="Ej: Banco Nacion" />
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">CBU</label>
                  <Input v-model="pi.cbu" placeholder="22 digitos" />
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">Alias</label>
                  <Input v-model="pi.alias" placeholder="Ej: eventos.viajes" />
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">CUIT</label>
                  <Input v-model="pi.cuit" placeholder="Ej: 20-12345678-9" />
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">Email</label>
                  <Input v-model="pi.email" type="email" placeholder="pago@ejemplo.com" />
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" class="mt-3" @click="addPaymentInfo">
            <i class="pi pi-plus mr-2" />
            Agregar info de pago
          </Button>
        </div>

        <hr class="border-border" />

        <!-- Extras -->
        <div>
          <h4 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Extras</h4>
          <div>
            <label class="text-sm font-medium mb-1 block">Link de Inscripcion</label>
            <Input v-model="form.enrollment_link" placeholder="https://..." />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeSchoolDialog">Cancelar</Button>
        <Button :disabled="!canSave" @click="handleSave">
          {{ isEditing ? 'Guardar' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation -->
  <AlertDialog v-model:open="store.showDeleteSchoolDialog">
    <AlertDialogContent class="glass-dialog">
      <AlertDialogHeader>
        <AlertDialogTitle>Eliminar Colegio</AlertDialogTitle>
        <AlertDialogDescription>
          Esta seguro de eliminar "{{ store.deletingSchool?.school_name }}"? Esta accion no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="closeDeleteSchoolDialog">Cancelar</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="confirmDelete"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- PDF Dialog -->
  <Dialog v-model:open="store.showPdfDialog">
    <DialogContent class="glass-dialog max-w-md">
      <DialogHeader>
        <DialogTitle>Exportar PDF</DialogTitle>
        <DialogDescription>
          Generar PDF de informacion para "{{ store.pdfSchool?.school_name }}"
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <label class="text-sm font-medium mb-1 block">Texto extra (opcional)</label>
        <Textarea v-model="pdfExtraText" placeholder="Informacion adicional para incluir en el PDF..." rows="4" />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closePdfDialog">Cancelar</Button>
        <Button @click="handlePdfGenerate">
          <i class="pi pi-file-pdf mr-2" />
          Generar PDF
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
